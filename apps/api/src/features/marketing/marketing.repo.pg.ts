import {
  marketingAiEvaluations,
  marketingAiExamples,
  marketingAiFeedback,
  marketingAiInstructions,
  marketingAiKnowledge,
  marketingAiLearning,
  marketingAiMessages,
  marketingAiSessions,
  marketingAiSettings,
  marketingDocumentAttachments,
  marketingDocuments,
  marketingDocumentVersions,
  marketingResources,
} from "@lucro-caseiro/database/schema";
import { and, asc, desc, eq, gte, lte, max, sql } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";

type ResourceInput = typeof marketingResources.$inferInsert;
type DocumentInput = Pick<
  typeof marketingDocuments.$inferInsert,
  "slug" | "title" | "body" | "tags" | "source"
>;

export class MarketingRepoPg {
  constructor(private db: AppDatabase) {}

  listResources(
    userId: string,
    filters: { kind?: string; status?: string; from?: Date; to?: Date } = {},
  ) {
    const conditions = [eq(marketingResources.userId, userId)];
    if (filters.kind) conditions.push(eq(marketingResources.kind, filters.kind));
    if (filters.status) conditions.push(eq(marketingResources.status, filters.status));
    if (filters.from) conditions.push(gte(marketingResources.scheduledFor, filters.from));
    if (filters.to) conditions.push(lte(marketingResources.scheduledFor, filters.to));
    return this.db
      .select()
      .from(marketingResources)
      .where(and(...conditions))
      .orderBy(asc(marketingResources.scheduledFor), desc(marketingResources.updatedAt));
  }

  async createResource(userId: string, data: Omit<ResourceInput, "userId">) {
    const [row] = await this.db
      .insert(marketingResources)
      .values({ ...data, userId })
      .returning();
    return row!;
  }

  async updateResource(userId: string, id: string, data: Partial<ResourceInput>) {
    const [row] = await this.db
      .update(marketingResources)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(marketingResources.userId, userId), eq(marketingResources.id, id)))
      .returning();
    return row ?? null;
  }

  async deleteResource(userId: string, id: string) {
    const [row] = await this.db
      .delete(marketingResources)
      .where(and(eq(marketingResources.userId, userId), eq(marketingResources.id, id)))
      .returning({ id: marketingResources.id });
    return !!row;
  }

  async seedResource(userId: string, data: Omit<ResourceInput, "userId">) {
    const [row] = await this.db
      .insert(marketingResources)
      .values({ ...data, userId })
      .onConflictDoUpdate({
        target: [
          marketingResources.userId,
          marketingResources.kind,
          marketingResources.slug,
        ],
        set: {
          title: data.title,
          summary: data.summary,
          status: data.status,
          data: data.data,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row!;
  }

  listDocuments(userId: string) {
    return this.db
      .select()
      .from(marketingDocuments)
      .where(eq(marketingDocuments.userId, userId))
      .orderBy(desc(marketingDocuments.updatedAt));
  }

  async getDocument(userId: string, id: string) {
    const [document] = await this.db
      .select()
      .from(marketingDocuments)
      .where(and(eq(marketingDocuments.userId, userId), eq(marketingDocuments.id, id)));
    if (!document) return null;
    const [versions, attachments] = await Promise.all([
      this.db
        .select()
        .from(marketingDocumentVersions)
        .where(eq(marketingDocumentVersions.documentId, id))
        .orderBy(desc(marketingDocumentVersions.version)),
      this.db
        .select()
        .from(marketingDocumentAttachments)
        .where(eq(marketingDocumentAttachments.documentId, id))
        .orderBy(desc(marketingDocumentAttachments.createdAt)),
    ]);
    return { ...document, versions, attachments };
  }

  async createDocument(userId: string, data: DocumentInput) {
    return this.db.transaction(async (tx) => {
      const [document] = await tx
        .insert(marketingDocuments)
        .values({ ...data, userId })
        .returning();
      await tx.insert(marketingDocumentVersions).values({
        documentId: document!.id,
        version: 1,
        title: document!.title,
        body: document!.body,
        note: "Versão inicial",
      });
      return document!;
    });
  }

  async updateDocument(
    userId: string,
    id: string,
    data: Partial<DocumentInput> & { versionNote?: string },
  ) {
    const current = await this.getDocument(userId, id);
    if (!current) return null;
    const nextTitle = data.title ?? current.title;
    const nextBody = data.body ?? current.body;
    return this.db.transaction(async (tx) => {
      const [document] = await tx
        .update(marketingDocuments)
        .set({
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.body !== undefined ? { body: data.body } : {}),
          ...(data.tags !== undefined ? { tags: data.tags } : {}),
          ...(data.source !== undefined ? { source: data.source } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(marketingDocuments.userId, userId), eq(marketingDocuments.id, id)))
        .returning();
      const [latest] = await tx
        .select({ value: max(marketingDocumentVersions.version) })
        .from(marketingDocumentVersions)
        .where(eq(marketingDocumentVersions.documentId, id));
      await tx.insert(marketingDocumentVersions).values({
        documentId: id,
        version: (latest?.value ?? 0) + 1,
        title: nextTitle,
        body: nextBody,
        note: data.versionNote ?? "Salvamento",
      });
      return document!;
    });
  }

  async deleteDocument(userId: string, id: string) {
    const [row] = await this.db
      .delete(marketingDocuments)
      .where(and(eq(marketingDocuments.userId, userId), eq(marketingDocuments.id, id)))
      .returning({ id: marketingDocuments.id });
    return !!row;
  }

  async addAttachment(
    userId: string,
    documentId: string,
    data: Omit<typeof marketingDocumentAttachments.$inferInsert, "documentId">,
  ) {
    const document = await this.getDocument(userId, documentId);
    if (!document) return null;
    const [row] = await this.db
      .insert(marketingDocumentAttachments)
      .values({ ...data, documentId })
      .returning();
    return row!;
  }

  async createSession(userId: string, title: string) {
    const [row] = await this.db
      .insert(marketingAiSessions)
      .values({ userId, title })
      .returning();
    return row!;
  }

  listSessions(userId: string) {
    return this.db
      .select()
      .from(marketingAiSessions)
      .where(eq(marketingAiSessions.userId, userId))
      .orderBy(desc(marketingAiSessions.updatedAt));
  }

  async getSession(userId: string, sessionId: string) {
    const [session] = await this.db
      .select()
      .from(marketingAiSessions)
      .where(
        and(
          eq(marketingAiSessions.userId, userId),
          eq(marketingAiSessions.id, sessionId),
        ),
      );
    if (!session) return null;
    const messages = await this.db
      .select()
      .from(marketingAiMessages)
      .where(eq(marketingAiMessages.sessionId, sessionId))
      .orderBy(asc(marketingAiMessages.createdAt));
    return { ...session, messages };
  }

  async addMessage(
    sessionId: string,
    role: "user" | "assistant",
    body: string,
    context: Record<string, unknown> = {},
    model?: string,
  ) {
    const [row] = await this.db
      .insert(marketingAiMessages)
      .values({ sessionId, role, body, context, model })
      .returning();
    await this.db
      .update(marketingAiSessions)
      .set({ updatedAt: new Date() })
      .where(eq(marketingAiSessions.id, sessionId));
    return row!;
  }

  async activeInstruction(userId: string) {
    const [row] = await this.db
      .select()
      .from(marketingAiInstructions)
      .where(
        and(
          eq(marketingAiInstructions.userId, userId),
          eq(marketingAiInstructions.isActive, true),
        ),
      )
      .orderBy(desc(marketingAiInstructions.version));
    return row ?? null;
  }

  listInstructions(userId: string) {
    return this.db
      .select()
      .from(marketingAiInstructions)
      .where(eq(marketingAiInstructions.userId, userId))
      .orderBy(desc(marketingAiInstructions.version));
  }

  async createInstruction(userId: string, body: string, note?: string) {
    const [latest] = await this.db
      .select({ value: max(marketingAiInstructions.version) })
      .from(marketingAiInstructions)
      .where(eq(marketingAiInstructions.userId, userId));
    const [row] = await this.db
      .insert(marketingAiInstructions)
      .values({ userId, version: (latest?.value ?? 0) + 1, body, note, isActive: false })
      .returning();
    return row!;
  }

  async publishInstruction(userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      await tx
        .update(marketingAiInstructions)
        .set({ isActive: false })
        .where(eq(marketingAiInstructions.userId, userId));
      const [row] = await tx
        .update(marketingAiInstructions)
        .set({ isActive: true })
        .where(
          and(
            eq(marketingAiInstructions.userId, userId),
            eq(marketingAiInstructions.id, id),
          ),
        )
        .returning();
      return row ?? null;
    });
  }

  listKnowledge(userId: string) {
    return this.db
      .select()
      .from(marketingAiKnowledge)
      .where(
        and(
          eq(marketingAiKnowledge.userId, userId),
          eq(marketingAiKnowledge.active, true),
        ),
      )
      .orderBy(
        desc(marketingAiKnowledge.canonical),
        desc(marketingAiKnowledge.updatedAt),
      );
  }

  async addKnowledge(
    userId: string,
    data: Omit<typeof marketingAiKnowledge.$inferInsert, "userId">,
  ) {
    const [row] = await this.db
      .insert(marketingAiKnowledge)
      .values({ ...data, userId })
      .returning();
    return row!;
  }

  listExamples(userId: string) {
    return this.db
      .select()
      .from(marketingAiExamples)
      .where(eq(marketingAiExamples.userId, userId))
      .orderBy(desc(marketingAiExamples.createdAt));
  }

  async addExample(
    userId: string,
    data: Omit<typeof marketingAiExamples.$inferInsert, "userId">,
  ) {
    const [row] = await this.db
      .insert(marketingAiExamples)
      .values({ ...data, userId })
      .returning();
    return row!;
  }

  listEvaluations(userId: string) {
    return this.db
      .select()
      .from(marketingAiEvaluations)
      .where(eq(marketingAiEvaluations.userId, userId))
      .orderBy(desc(marketingAiEvaluations.updatedAt));
  }

  async addEvaluation(
    userId: string,
    data: Omit<typeof marketingAiEvaluations.$inferInsert, "userId">,
  ) {
    const [row] = await this.db
      .insert(marketingAiEvaluations)
      .values({ ...data, userId })
      .returning();
    return row!;
  }

  async setEvaluationResult(userId: string, id: string, output: string, score: number) {
    const [row] = await this.db
      .update(marketingAiEvaluations)
      .set({
        lastOutput: output,
        lastScore: score,
        lastRunAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(marketingAiEvaluations.userId, userId), eq(marketingAiEvaluations.id, id)),
      )
      .returning();
    return row ?? null;
  }

  async addFeedback(userId: string, messageId: string, rating: string, note?: string) {
    const [row] = await this.db
      .insert(marketingAiFeedback)
      .values({ userId, messageId, rating, note })
      .returning();
    return row!;
  }

  async getSettings(userId: string) {
    const [row] = await this.db
      .select()
      .from(marketingAiSettings)
      .where(eq(marketingAiSettings.userId, userId));
    if (row) return row;
    const [created] = await this.db
      .insert(marketingAiSettings)
      .values({ userId })
      .returning();
    return created!;
  }

  async updateSettings(
    userId: string,
    data: Partial<typeof marketingAiSettings.$inferInsert>,
  ) {
    const [row] = await this.db
      .insert(marketingAiSettings)
      .values({ userId, ...data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: marketingAiSettings.userId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row!;
  }

  listLearning(userId: string) {
    return this.db
      .select()
      .from(marketingAiLearning)
      .where(eq(marketingAiLearning.userId, userId))
      .orderBy(desc(marketingAiLearning.createdAt));
  }

  async addLearning(
    userId: string,
    data: Omit<typeof marketingAiLearning.$inferInsert, "userId">,
  ) {
    const [row] = await this.db
      .insert(marketingAiLearning)
      .values({ ...data, userId })
      .returning();
    return row!;
  }

  async dashboard(userId: string) {
    const [resources, documents, sessions, learning, settings] = await Promise.all([
      this.listResources(userId),
      this.listDocuments(userId),
      this.listSessions(userId),
      this.listLearning(userId),
      this.getSettings(userId),
    ]);
    return { resources, documents, sessions, learning: learning.slice(0, 20), settings };
  }

  async training(userId: string) {
    const [instructions, knowledge, examples, evaluations, learning, settings] =
      await Promise.all([
        this.listInstructions(userId),
        this.listKnowledge(userId),
        this.listExamples(userId),
        this.listEvaluations(userId),
        this.listLearning(userId),
        this.getSettings(userId),
      ]);
    return { instructions, knowledge, examples, evaluations, learning, settings };
  }

  async countFeedback(userId: string) {
    const [row] = await this.db
      .select({ value: sql<number>`count(*)::int` })
      .from(marketingAiFeedback)
      .where(eq(marketingAiFeedback.userId, userId));
    return row?.value ?? 0;
  }
}
