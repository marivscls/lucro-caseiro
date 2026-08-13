import {
  marketingResources,
  videoEditAssets,
  videoEditJobs,
  videoEditVersions,
} from "@lucro-caseiro/database/schema";
import { and, asc, desc, eq, inArray, max } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";

export class VideoEditorRepoPg {
  constructor(private db: AppDatabase) {}

  async createJob(
    userId: string,
    input: Omit<typeof videoEditJobs.$inferInsert, "id" | "userId">,
  ) {
    const [created] = await this.db
      .insert(videoEditJobs)
      .values({ ...input, userId })
      .returning();
    return created!;
  }

  listJobs(userId: string) {
    return this.db
      .select()
      .from(videoEditJobs)
      .where(eq(videoEditJobs.userId, userId))
      .orderBy(desc(videoEditJobs.updatedAt));
  }

  listRecoverableJobs() {
    return this.db
      .select({
        id: videoEditJobs.id,
        userId: videoEditJobs.userId,
        status: videoEditJobs.status,
      })
      .from(videoEditJobs)
      .where(
        inArray(videoEditJobs.status, [
          "uploaded",
          "analyzing",
          "strategy_ready",
          "rendering",
          "self_review",
          "approved",
        ]),
      );
  }

  async getJob(userId: string, id: string) {
    const [job] = await this.db
      .select()
      .from(videoEditJobs)
      .where(and(eq(videoEditJobs.id, id), eq(videoEditJobs.userId, userId)));
    if (!job) return null;
    const [assets, versions] = await Promise.all([
      this.db
        .select()
        .from(videoEditAssets)
        .where(and(eq(videoEditAssets.jobId, id), eq(videoEditAssets.userId, userId)))
        .orderBy(asc(videoEditAssets.createdAt)),
      this.db
        .select()
        .from(videoEditVersions)
        .where(and(eq(videoEditVersions.jobId, id), eq(videoEditVersions.userId, userId)))
        .orderBy(desc(videoEditVersions.version)),
    ]);
    return { ...job, assets, versions };
  }

  async addAsset(
    userId: string,
    jobId: string,
    input: Omit<typeof videoEditAssets.$inferInsert, "id" | "userId" | "jobId">,
  ) {
    if (!(await this.getJob(userId, jobId))) return null;
    const [created] = await this.db
      .insert(videoEditAssets)
      .values({ ...input, jobId, userId })
      .returning();
    await this.updateJob(userId, jobId, { status: "uploaded", error: null });
    return created!;
  }

  async updateAsset(
    userId: string,
    assetId: string,
    patch: Partial<typeof videoEditAssets.$inferInsert>,
  ) {
    const [updated] = await this.db
      .update(videoEditAssets)
      .set(patch)
      .where(and(eq(videoEditAssets.id, assetId), eq(videoEditAssets.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async updateJob(
    userId: string,
    id: string,
    patch: Partial<typeof videoEditJobs.$inferInsert>,
  ) {
    const [updated] = await this.db
      .update(videoEditJobs)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(videoEditJobs.id, id), eq(videoEditJobs.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async createVersion(
    userId: string,
    jobId: string,
    input: Omit<
      typeof videoEditVersions.$inferInsert,
      "id" | "userId" | "jobId" | "version"
    >,
  ) {
    return this.db.transaction(async (tx) => {
      const [current] = await tx
        .select({ value: max(videoEditVersions.version) })
        .from(videoEditVersions)
        .where(eq(videoEditVersions.jobId, jobId));
      const [created] = await tx
        .insert(videoEditVersions)
        .values({ ...input, userId, jobId, version: (current?.value ?? 0) + 1 })
        .returning();
      return created!;
    });
  }

  async publishJob(userId: string, jobId: string) {
    return this.db.transaction(async (tx) => {
      const [job] = await tx
        .select()
        .from(videoEditJobs)
        .where(and(eq(videoEditJobs.id, jobId), eq(videoEditJobs.userId, userId)));
      if (!job) return null;
      const [version] = await tx
        .select()
        .from(videoEditVersions)
        .where(
          and(eq(videoEditVersions.jobId, jobId), eq(videoEditVersions.userId, userId)),
        )
        .orderBy(desc(videoEditVersions.version))
        .limit(1);
      if (!version) return null;
      const [resource] = await tx
        .insert(marketingResources)
        .values({
          userId,
          kind: "content",
          slug: `video-edit-${jobId}-${version.version}`,
          title: job.title,
          summary: "Vídeo editado autonomamente pela Selenita e aprovado para produção.",
          status: "ready",
          data: {
            source: "selenita-video-editor",
            videoEditJobId: jobId,
            videoEditVersionId: version.id,
            storagePath: version.storagePath,
            sourceCampaignId: job.sourceCampaignId,
            sourceContentId: job.sourceContentId,
          },
        })
        .returning();
      await tx
        .update(videoEditJobs)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(videoEditJobs.id, jobId));
      return resource!;
    });
  }
}
