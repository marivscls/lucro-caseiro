import {
  VideoEditAssetInputSchema,
  VideoEditJobInputSchema,
  VideoEditRefinementSchema,
  type VideoEditAssetInput,
  type VideoEditJobInput,
} from "@lucro-caseiro/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "../../shared/errors";
import type { VideoEditorProcessor } from "./video-editor.processor";
import type { VideoEditorRepoPg } from "./video-editor.repo.pg";

const BUCKET = "marketing-video-editor";

export class VideoEditorUseCases {
  constructor(
    private repo: VideoEditorRepoPg,
    private storage?: SupabaseClient,
    private processor?: VideoEditorProcessor,
  ) {}

  createJob(userId: string, rawInput: VideoEditJobInput) {
    const input = VideoEditJobInputSchema.parse(rawInput);
    return this.repo.createJob(userId, { ...input, status: "draft" });
  }

  listJobs(userId: string) {
    return this.repo.listJobs(userId);
  }

  async getJob(userId: string, id: string) {
    const job = await this.repo.getJob(userId, id);
    if (!job) throw new NotFoundError("Edição de vídeo não encontrada");
    if (!this.storage) return job;
    return {
      ...job,
      versions: await Promise.all(
        job.versions.map(async (version) => {
          const { data } = await this.storage!.storage.from(BUCKET).createSignedUrl(
            version.storagePath,
            60 * 60,
          );
          return { ...version, signedUrl: data?.signedUrl ?? null };
        }),
      ),
    };
  }

  async addAsset(userId: string, jobId: string, rawInput: VideoEditAssetInput) {
    const input = VideoEditAssetInputSchema.parse(rawInput);
    const requiredPrefix = `${userId}/${jobId}/uploads/`;
    if (!input.storagePath.startsWith(requiredPrefix))
      throw new ValidationError(["O arquivo enviado não pertence a este job."]);
    const created = await this.repo.addAsset(userId, jobId, input);
    if (!created) throw new NotFoundError("Edição de vídeo não encontrada");
    return created;
  }

  async start(userId: string, jobId: string) {
    this.assertProcessor();
    const job = await this.repo.getJob(userId, jobId);
    if (!job) throw new NotFoundError("Edição de vídeo não encontrada");
    if (!job.assets.length)
      throw new ValidationError(["Envie pelo menos uma gravação antes de iniciar."]);
    if (["analyzing", "rendering", "self_review"].includes(job.status))
      throw new ValidationError(["Esta edição já está sendo processada."]);
    await this.repo.updateJob(userId, jobId, { status: "uploaded", error: null });
    this.processor!.enqueue(userId, jobId);
    return this.getJob(userId, jobId);
  }

  async refine(userId: string, jobId: string, rawInput: unknown) {
    this.assertProcessor();
    const { instruction } = VideoEditRefinementSchema.parse(rawInput);
    const job = await this.repo.getJob(userId, jobId);
    if (!job) throw new NotFoundError("Edição de vídeo não encontrada");
    if (job.status !== "ready_for_review")
      throw new ValidationError(["Aguarde o preview atual antes de pedir refinamentos."]);
    await this.repo.updateJob(userId, jobId, {
      status: "uploaded",
      refinementInstruction: instruction,
      error: null,
    });
    this.processor!.enqueue(userId, jobId);
    return this.getJob(userId, jobId);
  }

  async approve(userId: string, jobId: string) {
    this.assertProcessor();
    const job = await this.repo.getJob(userId, jobId);
    if (!job) throw new NotFoundError("Edição de vídeo não encontrada");
    if (job.status !== "ready_for_review")
      throw new ValidationError(["Apenas um preview pronto pode ser aprovado."]);
    await this.repo.updateJob(userId, jobId, { status: "approved", error: null });
    this.processor!.enqueue(userId, jobId, "final");
    return this.getJob(userId, jobId);
  }

  private assertProcessor() {
    if (!this.processor)
      throw new ServiceUnavailableError(
        "Configure OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, FFmpeg e FFprobe para usar o Editor Autônomo.",
      );
  }
}
