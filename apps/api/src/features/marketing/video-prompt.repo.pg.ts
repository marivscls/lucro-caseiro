import {
  characterProfiles,
  videoPromptProjects,
  videoPromptVersions,
  videoScenes,
} from "@lucro-caseiro/database/schema";
import { and, desc, eq, gte, isNull, lte, max, type SQL } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";

type ProjectInsert = typeof videoPromptProjects.$inferInsert;
type SceneInsert = typeof videoScenes.$inferInsert;
type CharacterInsert = typeof characterProfiles.$inferInsert;

export class VideoPromptRepoPg {
  constructor(private db: AppDatabase) {}

  listProjects(
    userId: string,
    filters: {
      characterProfileId?: string;
      visualMode?: string;
      objective?: string;
      featureId?: string;
      duration?: number;
      format?: string;
      targetTool?: string;
      status?: string;
      from?: Date;
      to?: Date;
    } = {},
  ) {
    const conditions: SQL[] = [eq(videoPromptProjects.userId, userId)];
    if (filters.characterProfileId)
      conditions.push(
        eq(videoPromptProjects.characterProfileId, filters.characterProfileId),
      );
    if (filters.visualMode)
      conditions.push(eq(videoPromptProjects.visualMode, filters.visualMode));
    if (filters.objective)
      conditions.push(eq(videoPromptProjects.objective, filters.objective));
    if (filters.featureId)
      conditions.push(eq(videoPromptProjects.featureId, filters.featureId));
    if (filters.duration)
      conditions.push(eq(videoPromptProjects.duration, filters.duration));
    if (filters.format) conditions.push(eq(videoPromptProjects.format, filters.format));
    if (filters.targetTool)
      conditions.push(eq(videoPromptProjects.targetTool, filters.targetTool));
    if (filters.status) conditions.push(eq(videoPromptProjects.status, filters.status));
    if (filters.from) conditions.push(gte(videoPromptProjects.createdAt, filters.from));
    if (filters.to) conditions.push(lte(videoPromptProjects.createdAt, filters.to));
    return this.db
      .select()
      .from(videoPromptProjects)
      .where(and(...conditions))
      .orderBy(desc(videoPromptProjects.updatedAt));
  }

  async getProject(userId: string, id: string) {
    const [project] = await this.db
      .select()
      .from(videoPromptProjects)
      .where(and(eq(videoPromptProjects.userId, userId), eq(videoPromptProjects.id, id)));
    if (!project) return null;
    const [scenes, versions] = await Promise.all([
      this.db
        .select()
        .from(videoScenes)
        .where(eq(videoScenes.projectId, id))
        .orderBy(videoScenes.order),
      this.db
        .select()
        .from(videoPromptVersions)
        .where(eq(videoPromptVersions.projectId, id))
        .orderBy(desc(videoPromptVersions.version)),
    ]);
    return { ...project, ...project.configuration, scenes, versions };
  }

  createProject(
    userId: string,
    project: Omit<ProjectInsert, "id" | "userId" | "createdAt" | "updatedAt">,
    scenes: Array<Omit<SceneInsert, "id" | "projectId">>,
  ) {
    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(videoPromptProjects)
        .values({ ...project, userId })
        .returning();
      const createdScenes = scenes.length
        ? await tx
            .insert(videoScenes)
            .values(scenes.map((scene) => ({ ...scene, projectId: created!.id })))
            .returning()
        : [];
      return {
        ...created!,
        ...created!.configuration,
        scenes: createdScenes,
        versions: [],
      };
    });
  }

  updateProject(
    userId: string,
    id: string,
    project: Partial<ProjectInsert>,
    scenes?: Array<Omit<SceneInsert, "id" | "projectId">>,
  ) {
    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(videoPromptProjects)
        .set({ ...project, updatedAt: new Date() })
        .where(
          and(eq(videoPromptProjects.userId, userId), eq(videoPromptProjects.id, id)),
        )
        .returning();
      if (!updated) return null;
      let updatedScenes: Array<typeof videoScenes.$inferSelect>;
      if (scenes) {
        await tx.delete(videoScenes).where(eq(videoScenes.projectId, id));
        updatedScenes = scenes.length
          ? await tx
              .insert(videoScenes)
              .values(scenes.map((scene) => ({ ...scene, projectId: id })))
              .returning()
          : [];
      } else {
        updatedScenes = await tx
          .select()
          .from(videoScenes)
          .where(eq(videoScenes.projectId, id))
          .orderBy(videoScenes.order);
      }
      const versions = await tx
        .select()
        .from(videoPromptVersions)
        .where(eq(videoPromptVersions.projectId, id))
        .orderBy(desc(videoPromptVersions.version));
      return { ...updated, ...updated.configuration, scenes: updatedScenes, versions };
    });
  }

  async createVersion(
    userId: string,
    projectId: string,
    data: Omit<
      typeof videoPromptVersions.$inferInsert,
      "id" | "projectId" | "version" | "createdAt"
    >,
  ) {
    return this.db.transaction(async (tx) => {
      const [project] = await tx
        .select({ id: videoPromptProjects.id })
        .from(videoPromptProjects)
        .where(
          and(
            eq(videoPromptProjects.userId, userId),
            eq(videoPromptProjects.id, projectId),
          ),
        )
        .for("update");
      if (!project) return null;
      const [latest] = await tx
        .select({ value: max(videoPromptVersions.version) })
        .from(videoPromptVersions)
        .where(eq(videoPromptVersions.projectId, projectId));
      const [version] = await tx
        .insert(videoPromptVersions)
        .values({ ...data, projectId, version: (latest?.value ?? 0) + 1 })
        .returning();
      await tx
        .update(videoPromptProjects)
        .set({ status: "ready", updatedAt: new Date() })
        .where(eq(videoPromptProjects.id, projectId));
      return version!;
    });
  }

  recentGenerationContexts(userId: string, brandId: string, limit = 20) {
    return this.db
      .select({
        projectId: videoPromptProjects.id,
        title: videoPromptProjects.title,
        format: videoPromptProjects.format,
        objective: videoPromptProjects.objective,
        visualMode: videoPromptProjects.visualMode,
        featureId: videoPromptProjects.featureId,
        cta: videoPromptProjects.cta,
        configuration: videoPromptProjects.configuration,
        generationContext: videoPromptVersions.generationContext,
      })
      .from(videoPromptVersions)
      .innerJoin(
        videoPromptProjects,
        eq(videoPromptVersions.projectId, videoPromptProjects.id),
      )
      .where(
        and(
          eq(videoPromptProjects.userId, userId),
          eq(videoPromptProjects.brandId, brandId),
        ),
      )
      .orderBy(desc(videoPromptVersions.createdAt))
      .limit(limit);
  }

  listCharacters(userId: string, brandId: string, includeArchived = false) {
    const conditions: SQL[] = [
      eq(characterProfiles.userId, userId),
      eq(characterProfiles.brandId, brandId),
    ];
    if (!includeArchived) conditions.push(isNull(characterProfiles.archivedAt));
    return this.db
      .select()
      .from(characterProfiles)
      .where(and(...conditions))
      .orderBy(desc(characterProfiles.updatedAt));
  }

  async getCharacter(userId: string, id: string) {
    const [profile] = await this.db
      .select()
      .from(characterProfiles)
      .where(and(eq(characterProfiles.userId, userId), eq(characterProfiles.id, id)));
    if (!profile) return null;
    const projects = await this.db
      .select({
        id: videoPromptProjects.id,
        title: videoPromptProjects.title,
        status: videoPromptProjects.status,
        updatedAt: videoPromptProjects.updatedAt,
      })
      .from(videoPromptProjects)
      .where(
        and(
          eq(videoPromptProjects.userId, userId),
          eq(videoPromptProjects.characterProfileId, id),
        ),
      )
      .orderBy(desc(videoPromptProjects.updatedAt));
    return { ...profile, projects };
  }

  async createCharacter(
    userId: string,
    input: Omit<CharacterInsert, "id" | "userId" | "createdAt" | "updatedAt">,
  ) {
    const [profile] = await this.db
      .insert(characterProfiles)
      .values({ ...input, userId })
      .returning();
    return profile!;
  }

  async updateCharacter(userId: string, id: string, input: Partial<CharacterInsert>) {
    const [profile] = await this.db
      .update(characterProfiles)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(characterProfiles.userId, userId), eq(characterProfiles.id, id)))
      .returning();
    return profile ?? null;
  }
}
