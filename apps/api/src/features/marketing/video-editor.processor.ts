import {
  VideoEditPlanSchema,
  type VideoEditPlan,
  type VideoEditReview,
} from "@lucro-caseiro/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  OpenAiVideoEditor,
  type EditorialAsset,
  type TranscriptWord,
} from "./openai-video-editor";
import type { VideoEditorRepoPg } from "./video-editor.repo.pg";

const runFile = promisify(execFile);
const BUCKET = "marketing-video-editor";

type JobDetail = NonNullable<Awaited<ReturnType<VideoEditorRepoPg["getJob"]>>>;

export class VideoEditorProcessor {
  private running = new Set<string>();

  constructor(
    private repo: VideoEditorRepoPg,
    private storage: SupabaseClient,
    private editor: OpenAiVideoEditor,
    private ffmpegPath: string,
    private ffprobePath: string,
  ) {}

  async recover() {
    const jobs = await this.repo.listRecoverableJobs();
    for (const job of jobs)
      this.enqueue(job.userId, job.id, job.status === "approved" ? "final" : "preview");
    return jobs.length;
  }

  enqueue(userId: string, jobId: string, mode: "preview" | "final" = "preview") {
    if (this.running.has(jobId)) return;
    this.running.add(jobId);
    void (
      mode === "final"
        ? this.renderFinal(userId, jobId)
        : this.processPreview(userId, jobId)
    )
      .catch(async (error: unknown) => {
        await this.repo.updateJob(userId, jobId, {
          status: "failed",
          error: error instanceof Error ? error.message : "Falha inesperada na edição.",
        });
      })
      .finally(() => this.running.delete(jobId));
  }

  private async processPreview(userId: string, jobId: string) {
    const workDir = await mkdtemp(join(tmpdir(), `selenita-video-${jobId}-`));
    try {
      await this.repo.updateJob(userId, jobId, {
        status: "analyzing",
        error: null,
        iterationCount: 0,
      });
      let job = await this.requiredJob(userId, jobId);
      if (!job.assets.length)
        throw new Error("Envie pelo menos uma gravação antes de editar.");
      const prepared = await this.prepareAssets(userId, job, workDir);
      job = await this.requiredJob(userId, jobId);
      const editorialAssets = this.editorialAssets(job, prepared.paths, prepared.sheets);
      let plan = validateAndSnapPlan(
        await this.editor.createPlan({
          brief: job.brief,
          aspectRatio: job.aspectRatio,
          destinationChannel: job.destinationChannel,
          targetDurationSeconds: job.targetDurationSeconds,
          assets: editorialAssets,
          refinement: job.refinementInstruction,
        }),
        editorialAssets,
      );
      plan = { ...plan, captions: buildCaptions(plan, editorialAssets) };
      await this.repo.updateJob(userId, jobId, { status: "strategy_ready", plan });

      let review: VideoEditReview | null = null;
      let latestOutput = "";
      for (let iteration = 1; iteration <= job.maxIterations; iteration += 1) {
        await this.repo.updateJob(userId, jobId, {
          status: "rendering",
          plan,
          iterationCount: iteration,
        });
        latestOutput = join(workDir, `preview-${iteration}.mp4`);
        await renderPlan({
          plan,
          assets: editorialAssets,
          localPaths: prepared.paths,
          outputPath: latestOutput,
          workDir,
          ffmpegPath: this.ffmpegPath,
          quality: "preview",
        });
        await this.repo.updateJob(userId, jobId, { status: "self_review" });
        const frames = await samplePreview(
          latestOutput,
          plan.estimatedDurationMs,
          workDir,
          this.ffmpegPath,
        );
        review = await this.editor.reviewPreview({
          plan,
          frames,
          durationMs: plan.estimatedDurationMs,
        });
        if (review.passed || iteration === job.maxIterations) break;
        plan = validateAndSnapPlan(
          await this.editor.revisePlan({
            brief: job.brief,
            plan,
            review,
            assets: editorialAssets,
          }),
          editorialAssets,
        );
        plan = { ...plan, captions: buildCaptions(plan, editorialAssets) };
      }

      const storagePath = `${userId}/${jobId}/renders/preview-${Date.now()}.mp4`;
      await this.upload(storagePath, latestOutput, "video/mp4");
      await this.repo.createVersion(userId, jobId, {
        kind: "preview",
        storagePath,
        durationMs: plan.estimatedDurationMs,
        plan,
        review,
      });
      await this.repo.updateJob(userId, jobId, {
        status: "ready_for_review",
        plan,
        review,
        refinementInstruction: null,
      });
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async renderFinal(userId: string, jobId: string) {
    const workDir = await mkdtemp(join(tmpdir(), `selenita-final-${jobId}-`));
    try {
      const job = await this.requiredJob(userId, jobId);
      if (!job.plan) throw new Error("O job não possui plano aprovado.");
      const plan = VideoEditPlanSchema.parse(job.plan);
      const prepared = await this.prepareAssets(userId, job, workDir);
      const assets = this.editorialAssets(
        await this.requiredJob(userId, jobId),
        prepared.paths,
        prepared.sheets,
      );
      const outputPath = join(workDir, "final.mp4");
      await this.repo.updateJob(userId, jobId, { status: "rendering", error: null });
      await renderPlan({
        plan,
        assets,
        localPaths: prepared.paths,
        outputPath,
        workDir,
        ffmpegPath: this.ffmpegPath,
        quality: "final",
      });
      const storagePath = `${userId}/${jobId}/renders/final-${Date.now()}.mp4`;
      await this.upload(storagePath, outputPath, "video/mp4");
      await this.repo.createVersion(userId, jobId, {
        kind: "final",
        storagePath,
        durationMs: plan.estimatedDurationMs,
        plan,
        review: job.review,
      });
      await this.repo.publishJob(userId, jobId);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async prepareAssets(userId: string, job: JobDetail, workDir: string) {
    const paths = new Map<string, string>();
    const sheets = new Map<string, string>();
    for (const asset of job.assets) {
      const extension = extensionFor(asset.mimeType);
      const localPath = join(workDir, `${asset.id}${extension}`);
      const { data, error } = await this.storage.storage
        .from(BUCKET)
        .download(asset.storagePath);
      if (error || !data) throw new Error(`Não foi possível baixar ${asset.name}.`);
      await writeFile(localPath, Buffer.from(await data.arrayBuffer()));
      paths.set(asset.id, localPath);
      let durationMs = asset.durationMs;
      if (
        !asset.transcript?.length ||
        !asset.durationMs ||
        !asset.width ||
        !asset.height
      ) {
        const metadata = await probe(localPath, this.ffprobePath);
        const transcript = await this.editor.transcribe(data, asset.name);
        durationMs = metadata.durationMs;
        await this.repo.updateAsset(userId, asset.id, {
          status: "analyzed",
          durationMs: metadata.durationMs,
          width: metadata.width,
          height: metadata.height,
          transcript,
          metadata,
        });
      }
      sheets.set(
        asset.id,
        await createContactSheet(
          localPath,
          durationMs ?? 1_000,
          join(workDir, `source-${asset.id}.jpg`),
          this.ffmpegPath,
        ),
      );
    }
    return { paths, sheets };
  }

  private editorialAssets(
    job: JobDetail,
    paths: Map<string, string>,
    sheets: Map<string, string>,
  ): EditorialAsset[] {
    return job.assets.map((asset) => {
      if (!asset.durationMs || !asset.width || !asset.height || !asset.transcript)
        throw new Error(`A análise de ${asset.name} ficou incompleta.`);
      return {
        id: asset.id,
        name: asset.name,
        durationMs: asset.durationMs,
        width: asset.width,
        height: asset.height,
        transcript: asset.transcript as TranscriptWord[],
        contactSheet: sheets.get(asset.id),
      };
    });
  }

  private async requiredJob(userId: string, jobId: string) {
    const job = await this.repo.getJob(userId, jobId);
    if (!job) throw new Error("Job de edição não encontrado.");
    return job;
  }

  private async upload(storagePath: string, localPath: string, contentType: string) {
    const { error } = await this.storage.storage
      .from(BUCKET)
      .upload(storagePath, await readFile(localPath), { contentType, upsert: false });
    if (error) throw new Error(`Falha ao salvar o render: ${error.message}`);
  }
}

async function createContactSheet(
  source: string,
  durationMs: number,
  target: string,
  ffmpegPath: string,
) {
  const interval = Math.max(0.5, durationMs / 1000 / 4);
  await runFile(ffmpegPath, [
    "-y",
    "-i",
    source,
    "-vf",
    `fps=1/${interval},scale=480:-2,tile=2x2:padding=4:margin=4`,
    "-frames:v",
    "1",
    target,
  ]);
  return `data:image/jpeg;base64,${(await readFile(target)).toString("base64")}`;
}

async function probe(path: string, ffprobePath: string) {
  const { stdout } = await runFile(ffprobePath, [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_type,width,height",
    "-of",
    "json",
    path,
  ]);
  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string; width?: number; height?: number }>;
  };
  const video = parsed.streams?.find((stream) => stream.codec_type === "video");
  const audio = parsed.streams?.some((stream) => stream.codec_type === "audio");
  if (!video?.width || !video.height || !audio)
    throw new Error("A gravação precisa conter vídeo e áudio válidos.");
  return {
    durationMs: Math.round(Number(parsed.format?.duration ?? 0) * 1000),
    width: video.width,
    height: video.height,
    hasAudio: true,
  };
}

function validateAndSnapPlan(plan: VideoEditPlan, assets: EditorialAsset[]) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const segments = plan.segments.map((segment) => {
    const asset = byId.get(segment.assetId);
    if (!asset) throw new Error("O GPT selecionou um arquivo que não pertence ao job.");
    if (segment.sourceEndMs > asset.durationMs)
      throw new Error(`O GPT ultrapassou a duração de ${asset.name}.`);
    const selectedWords = asset.transcript.filter(
      (word) =>
        word.endMs >= segment.sourceStartMs && word.startMs <= segment.sourceEndMs,
    );
    if (!selectedWords.length)
      throw new Error("O GPT criou um segmento sem fala transcrita.");
    return {
      ...segment,
      sourceStartMs: Math.max(0, selectedWords[0]!.startMs - 50),
      sourceEndMs: Math.min(asset.durationMs, selectedWords.at(-1)!.endMs + 80),
    };
  });
  const estimatedDurationMs = segments.reduce(
    (sum, segment) => sum + segment.sourceEndMs - segment.sourceStartMs,
    0,
  );
  return VideoEditPlanSchema.parse({ ...plan, segments, estimatedDurationMs });
}

function buildCaptions(plan: VideoEditPlan, assets: EditorialAsset[]) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  let outputOffset = 0;
  return plan.segments.flatMap((segment) => {
    const asset = byId.get(segment.assetId)!;
    const words = asset.transcript.filter(
      (word) =>
        word.startMs >= segment.sourceStartMs && word.endMs <= segment.sourceEndMs,
    );
    const captions = words.map((word) => ({
      text: ` ${word.text}`,
      startMs: outputOffset + word.startMs - segment.sourceStartMs,
      endMs: outputOffset + word.endMs - segment.sourceStartMs,
      timestampMs: outputOffset + word.startMs - segment.sourceStartMs,
      confidence: word.confidence,
    }));
    outputOffset += segment.sourceEndMs - segment.sourceStartMs;
    return captions;
  });
}

async function renderPlan(input: {
  plan: VideoEditPlan;
  assets: EditorialAsset[];
  localPaths: Map<string, string>;
  outputPath: string;
  workDir: string;
  ffmpegPath: string;
  quality: "preview" | "final";
}) {
  const dimensions = outputDimensions(input.plan.aspectRatio, input.quality);
  const clipPaths: string[] = [];
  for (const [index, segment] of input.plan.segments.entries()) {
    const source = input.localPaths.get(segment.assetId);
    if (!source) throw new Error("Arquivo local do segmento não encontrado.");
    const clipPath = join(input.workDir, `segment-${index}.mp4`);
    const durationSeconds = (segment.sourceEndMs - segment.sourceStartMs) / 1000;
    await runFile(input.ffmpegPath, [
      "-y",
      "-ss",
      String(segment.sourceStartMs / 1000),
      "-t",
      String(durationSeconds),
      "-i",
      source,
      "-vf",
      `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},fps=30`,
      "-af",
      `loudnorm=I=-16:LRA=11:TP=-1.5,afade=t=in:st=0:d=0.03,afade=t=out:st=${Math.max(0, durationSeconds - 0.03)}:d=0.03`,
      "-c:v",
      "libx264",
      "-preset",
      input.quality === "preview" ? "veryfast" : "medium",
      "-crf",
      input.quality === "preview" ? "25" : "18",
      "-c:a",
      "aac",
      "-ar",
      "48000",
      clipPath,
    ]);
    clipPaths.push(clipPath);
  }
  const concatPath = join(input.workDir, "concat.txt");
  await writeFile(
    concatPath,
    clipPaths.map((path) => `file '${path.replaceAll("'", "'\\''")}'`).join("\n"),
  );
  const cleanPath = join(input.workDir, "clean.mp4");
  await runFile(input.ffmpegPath, [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-c",
    "copy",
    cleanPath,
  ]);
  const srtPath = join(input.workDir, "captions.srt");
  await writeFile(srtPath, captionsToSrt(input.plan.captions));
  const escapedSrt = srtPath.replaceAll("\\", "/").replace(":", "\\:");
  await runFile(input.ffmpegPath, [
    "-y",
    "-i",
    cleanPath,
    "-vf",
    `subtitles='${escapedSrt}':force_style='FontName=Arial,FontSize=18,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2,MarginV=80'`,
    "-c:v",
    "libx264",
    "-preset",
    input.quality === "preview" ? "veryfast" : "medium",
    "-crf",
    input.quality === "preview" ? "25" : "18",
    "-c:a",
    "copy",
    input.outputPath,
  ]);
}

async function samplePreview(
  path: string,
  durationMs: number,
  workDir: string,
  ffmpegPath: string,
) {
  const times = [0.3, 0.25, 0.5, 0.75, 0.95].map((ratio) =>
    Math.max(0, (durationMs / 1000) * ratio),
  );
  const frames: string[] = [];
  for (const [index, second] of times.entries()) {
    const target = join(workDir, `review-${index}.jpg`);
    await runFile(ffmpegPath, [
      "-y",
      "-ss",
      String(second),
      "-i",
      path,
      "-frames:v",
      "1",
      "-vf",
      "scale=720:-2",
      target,
    ]);
    frames.push(`data:image/jpeg;base64,${(await readFile(target)).toString("base64")}`);
  }
  return frames;
}

function captionsToSrt(captions: VideoEditPlan["captions"]) {
  const groups: (typeof captions)[] = [];
  for (let index = 0; index < captions.length; index += 4)
    groups.push(captions.slice(index, index + 4));
  return groups
    .map((group, index) => {
      const text = group
        .map((caption) => caption.text)
        .join("")
        .trim()
        .toUpperCase();
      return `${index + 1}\n${srtTime(group[0]!.startMs)} --> ${srtTime(group.at(-1)!.endMs)}\n${text}\n`;
    })
    .join("\n");
}

function srtTime(ms: number) {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = Math.floor(ms % 1000);
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")
    .concat(",", String(millis).padStart(3, "0"));
}

function outputDimensions(aspectRatio: string, quality: "preview" | "final") {
  const long = quality === "preview" ? 960 : 1920;
  const short = quality === "preview" ? 540 : 1080;
  if (aspectRatio === "9:16") return { width: short, height: long };
  if (aspectRatio === "16:9") return { width: long, height: short };
  if (aspectRatio === "1:1") return { width: short, height: short };
  return {
    width: quality === "preview" ? 600 : 1080,
    height: quality === "preview" ? 750 : 1350,
  };
}

function extensionFor(mimeType: string) {
  if (mimeType === "video/quicktime") return ".mov";
  if (mimeType === "video/webm") return ".webm";
  return ".mp4";
}

export const videoEditorInternals = {
  buildCaptions,
  captionsToSrt,
  outputDimensions,
  validateAndSnapPlan,
};
