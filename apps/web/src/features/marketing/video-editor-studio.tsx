"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  CircleAlert,
  Clapperboard,
  Clock3,
  Film,
  LoaderCircle,
  MessageSquareText,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Upload,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { PageHeader } from "@/features/marketing/page-header";
import { apiClient } from "@/shared/lib/api-client";
import { getSupabase } from "@/shared/lib/supabase";
import type { MarketingResource } from "@/shared/types";

import styles from "./video-editor-studio.module.css";

type VideoStatus =
  | "draft"
  | "uploaded"
  | "analyzing"
  | "strategy_ready"
  | "rendering"
  | "self_review"
  | "ready_for_review"
  | "approved"
  | "completed"
  | "needs_input"
  | "failed"
  | "cancelled";

type VideoAsset = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

type VideoVersion = {
  id: string;
  version: number;
  kind: "preview" | "final";
  signedUrl: string | null;
  durationMs: number | null;
  createdAt: string;
};

type VideoPlan = {
  editorialSummary: string;
  hook: string;
  estimatedDurationMs: number;
  pacing: string;
  segments: Array<{
    narrativeRole: string;
    reason: string;
    sourceStartMs: number;
    sourceEndMs: number;
  }>;
  warnings: string[];
};

type VideoReview = {
  passed: boolean;
  score: number;
  issues: Array<{ code: string; severity: "warning" | "blocking"; message: string }>;
};

type VideoJob = {
  id: string;
  title: string;
  brief: string;
  status: VideoStatus;
  aspectRatio: "9:16" | "1:1" | "4:5" | "16:9";
  targetDurationSeconds: number | null;
  destinationChannel: string;
  sourceCampaignId: string | null;
  plan: VideoPlan | null;
  review: VideoReview | null;
  error: string | null;
  assets: VideoAsset[];
  versions: VideoVersion[];
  createdAt: string;
  updatedAt: string;
};

const activeStatuses: VideoStatus[] = [
  "uploaded",
  "analyzing",
  "strategy_ready",
  "rendering",
  "self_review",
  "approved",
];

const stageOrder = ["Material", "Leitura GPT", "Primeiro corte", "Autorrevisão", "Sua aprovação"];

const statusCopy: Record<VideoStatus, string> = {
  draft: "Aguardando material",
  uploaded: "Na fila de edição",
  analyzing: "GPT lendo fala e imagem",
  strategy_ready: "Estratégia de corte pronta",
  rendering: "Montando primeiro corte",
  self_review: "GPT revisando o próprio trabalho",
  ready_for_review: "Pronto para sua revisão",
  approved: "Exportando versão final",
  completed: "Final aprovado",
  needs_input: "Precisa de orientação",
  failed: "Edição interrompida",
  cancelled: "Cancelado",
};

export function VideoEditorStudio() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | undefined>(
    searchParams.get("job") ?? undefined,
  );
  const [showNew, setShowNew] = useState(!selectedId);
  const [files, setFiles] = useState<File[]>([]);
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [refinement, setRefinement] = useState("");
  const [form, setForm] = useState({
    title: "",
    brief: "",
    aspectRatio: "9:16" as VideoJob["aspectRatio"],
    targetDurationSeconds: "45",
    destinationChannel: "Instagram Reels",
    sourceCampaignId: "",
  });

  const jobs = useQuery({
    queryKey: ["video-editor-jobs"],
    queryFn: () => apiClient<VideoJob[]>("/video-editor/jobs"),
    refetchInterval: (query) =>
      query.state.data?.some((job) => activeStatuses.includes(job.status)) ? 3_000 : false,
  });
  const campaigns = useQuery({
    queryKey: ["resources", "campaign"],
    queryFn: () => apiClient<MarketingResource[]>("/resources?kind=campaign"),
  });
  const job = useQuery({
    queryKey: ["video-editor-job", selectedId],
    queryFn: () => apiClient<VideoJob>(`/video-editor/jobs/${selectedId}`),
    enabled: !!selectedId,
    refetchInterval: (query) =>
      query.state.data && activeStatuses.includes(query.state.data.status) ? 2_500 : false,
  });

  useEffect(() => {
    if (!selectedId && jobs.data?.[0]) setSelectedId(jobs.data[0].id);
  }, [jobs.data, selectedId]);

  const latestVersion = job.data?.versions[0];
  const currentStage = stageIndex(job.data?.status);
  const totalRawMinutes = useMemo(
    () => job.data?.assets.reduce((sum, asset) => sum + asset.sizeBytes, 0) ?? 0,
    [job.data?.assets],
  );

  const createJob = useMutation({
    mutationFn: async () => {
      setUploading(true);
      setUploadError(undefined);
      try {
        const created = await apiClient<VideoJob>("/video-editor/jobs", {
          method: "POST",
          body: {
            brandId: "lucro-caseiro",
            title: form.title,
            brief: form.brief,
            aspectRatio: form.aspectRatio,
            targetDurationSeconds: form.targetDurationSeconds
              ? Number(form.targetDurationSeconds)
              : null,
            destinationChannel: form.destinationChannel,
            sourceCampaignId: form.sourceCampaignId || null,
            sourceContentId: null,
          },
        });
        await uploadFootage(created.id, files);
        await apiClient(`/video-editor/jobs/${created.id}/start`, { method: "POST" });
        return created;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: (created) => {
      setSelectedId(created.id);
      setShowNew(false);
      setFiles([]);
      void queryClient.invalidateQueries({ queryKey: ["video-editor-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["video-editor-job", created.id] });
    },
    onError: (error) => setUploadError(error.message),
  });
  const refine = useMutation({
    mutationFn: () =>
      apiClient(`/video-editor/jobs/${selectedId}/refine`, {
        method: "POST",
        body: { instruction: refinement },
      }),
    onSuccess: () => {
      setRefinement("");
      void queryClient.invalidateQueries({ queryKey: ["video-editor-job", selectedId] });
      void queryClient.invalidateQueries({ queryKey: ["video-editor-jobs"] });
    },
  });
  const continueDraft = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("Selecione uma edição.");
      setUploading(true);
      try {
        await uploadFootage(selectedId, draftFiles);
        await apiClient(`/video-editor/jobs/${selectedId}/start`, { method: "POST" });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      setDraftFiles([]);
      void queryClient.invalidateQueries({ queryKey: ["video-editor-job", selectedId] });
      void queryClient.invalidateQueries({ queryKey: ["video-editor-jobs"] });
    },
  });
  const approve = useMutation({
    mutationFn: () =>
      apiClient(`/video-editor/jobs/${selectedId}/approve`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["video-editor-job", selectedId] });
      void queryClient.invalidateQueries({ queryKey: ["video-editor-jobs"] });
    },
  });

  return (
    <div className={styles.studio}>
      <PageHeader
        eyebrow="Selenita · sala de edição"
        title="Editor autônomo de vídeo"
        description="Entregue a gravação bruta e um objetivo. O GPT encontra a história, corta, legenda, trata o áudio, revisa o resultado e só então chama você."
        action={
          <button className="button primary" onClick={() => setShowNew((value) => !value)}>
            <Plus size={17} />
            Nova edição
          </button>
        }
      />

      {showNew && (
        <form
          className={styles.intake}
          onSubmit={(event) => {
            event.preventDefault();
            createJob.mutate();
          }}
        >
          <div className={styles.intakeLead}>
            <span><Clapperboard size={22} /></span>
            <div>
              <p>Briefing de montagem</p>
              <h2>Que vídeo deve sair daqui?</h2>
              <small>Você dá intenção e material. A Selenita toma as decisões de edição.</small>
            </div>
          </div>
          <div className={styles.intakeFields}>
            <label>
              Nome da edição
              <input required minLength={2} maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex.: Reels — preço sem chute" />
            </label>
            <label>
              Onde será publicado
              <select value={form.destinationChannel} onChange={(event) => setForm({ ...form, destinationChannel: event.target.value })}>
                <option>Instagram Reels</option><option>TikTok</option><option>YouTube Shorts</option><option>YouTube</option><option>Anúncio</option>
              </select>
            </label>
            <label className={styles.briefField}>
              Resultado que o vídeo precisa gerar
              <textarea required minLength={10} maxLength={5000} value={form.brief} onChange={(event) => setForm({ ...form, brief: event.target.value })} placeholder="Explique a promessa, o público, a mensagem que não pode faltar e o CTA. Não precisa escrever instruções de corte." />
            </label>
            <label>
              Formato
              <select value={form.aspectRatio} onChange={(event) => setForm({ ...form, aspectRatio: event.target.value as VideoJob["aspectRatio"] })}>
                <option value="9:16">9:16 · Vertical</option><option value="4:5">4:5 · Feed</option><option value="1:1">1:1 · Quadrado</option><option value="16:9">16:9 · Horizontal</option>
              </select>
            </label>
            <label>
              Duração desejada
              <select value={form.targetDurationSeconds} onChange={(event) => setForm({ ...form, targetDurationSeconds: event.target.value })}>
                <option value="15">15 segundos</option><option value="30">30 segundos</option><option value="45">45 segundos</option><option value="60">60 segundos</option><option value="90">90 segundos</option><option value="">A Selenita decide</option>
              </select>
            </label>
            <label>
              Campanha vinculada
              <select value={form.sourceCampaignId} onChange={(event) => setForm({ ...form, sourceCampaignId: event.target.value })}>
                <option value="">Sem campanha</option>
                {campaigns.data?.map((campaign) => <option value={campaign.id} key={campaign.id}>{campaign.title}</option>)}
              </select>
            </label>
          </div>
          <label className={styles.dropzone}>
            <Upload size={23} />
            <strong>{files.length ? `${files.length} gravação(ões) selecionada(s)` : "Solte ou escolha as gravações brutas"}</strong>
            <span>MP4, MOV ou WebM · até 2 GB por arquivo</span>
            <input
              required
              multiple
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </label>
          {files.length > 0 && <ul className={styles.fileList}>{files.map((file) => <li key={`${file.name}-${file.size}`}><Film size={15} /><span>{file.name}</span><small>{formatBytes(file.size)}</small></li>)}</ul>}
          {(uploadError || createJob.error) && <p className={styles.error}><CircleAlert size={16} />{uploadError ?? createJob.error?.message}</p>}
          <button className="button primary" disabled={uploading || !files.length || form.brief.trim().length < 10 || form.title.trim().length < 2}>
            {uploading ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
            {uploading ? "Enviando e preparando…" : "Entregar para a Selenita editar"}
          </button>
        </form>
      )}

      <div className={styles.room}>
        <aside className={styles.reelShelf}>
          <header><span>Fila de montagem</span><strong>{jobs.data?.length ?? 0}</strong></header>
          {jobs.isLoading && <p>Carregando edições…</p>}
          {jobs.data?.map((item) => (
            <button className={selectedId === item.id ? styles.reelActive : styles.reel} key={item.id} onClick={() => { setSelectedId(item.id); setShowNew(false); }}>
              <span className={styles.reelFrame}><Scissors size={17} /></span>
              <span><strong>{item.title}</strong><small>{statusCopy[item.status]}</small><time>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</time></span>
              <ChevronRight size={15} />
            </button>
          ))}
          {!jobs.isLoading && !jobs.data?.length && <p>Nenhuma edição ainda. Crie a primeira acima.</p>}
        </aside>

        <main className={styles.editBay}>
          <EditorBayState
            selectedId={selectedId}
            isLoading={job.isLoading}
            errorMessage={job.error?.message}
          >
            {job.data && (
            <>
              <header className={styles.jobHeader}>
                <div><p>{job.data.destinationChannel} · {job.data.aspectRatio}</p><h2>{job.data.title}</h2></div>
                <span className={activeStatuses.includes(job.data.status) ? styles.liveStatus : styles.status}>{activeStatuses.includes(job.data.status) && <i />}{statusCopy[job.data.status]}</span>
              </header>
              <ol className={styles.stageRail}>
                {stageOrder.map((stage, index) => <li className={stageClass(index, currentStage)} key={stage}><span>{index < currentStage ? <Check size={13} /> : index + 1}</span><small>{stage}</small></li>)}
              </ol>

              <section className={styles.monitor}>
                {latestVersion?.signedUrl ? (
                  <video key={latestVersion.signedUrl} controls playsInline preload="metadata" src={latestVersion.signedUrl} />
                ) : (
                  <div><span className={styles.playPulse}>{activeStatuses.includes(job.data.status) ? <LoaderCircle className="spin" /> : <Play />}</span><h3>{statusCopy[job.data.status]}</h3><p>{processingMessage(job.data.status)}</p></div>
                )}
              </section>

              <div className={styles.metadata}>
                <span><Film size={15} />{job.data.assets.length} arquivo(s) bruto(s)</span>
                <span><Clock3 size={15} />{formatBytes(totalRawMinutes)}</span>
                {latestVersion && <span><Clapperboard size={15} />Versão {latestVersion.version} · {latestVersion.kind === "final" ? "final" : "preview"}</span>}
              </div>

              {job.data.status === "draft" && job.data.assets.length === 0 && (
                <section className={styles.draftUpload}>
                  <div><p>Direção recebida da Selenita</p><h3>Agora entregue as gravações</h3><span>O briefing já está salvo. Falta apenas o material bruto para a edição começar.</span></div>
                  <label><Upload size={18} /><span>{draftFiles.length ? `${draftFiles.length} arquivo(s) selecionado(s)` : "Escolher MP4, MOV ou WebM"}</span><input multiple type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(event) => setDraftFiles(Array.from(event.target.files ?? []))} /></label>
                  <button className="button primary" disabled={!draftFiles.length || continueDraft.isPending} onClick={() => continueDraft.mutate()}>{continueDraft.isPending ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}{continueDraft.isPending ? "Enviando…" : "Começar edição autônoma"}</button>
                  {continueDraft.error && <p className={styles.error}>{continueDraft.error.message}</p>}
                </section>
              )}

              {job.data.error && <p className={styles.error}><CircleAlert size={16} />{job.data.error}</p>}
              {job.data.plan && (
                <section className={styles.editorNotes}>
                  <header><div><p>Decisões da editora</p><h3>{job.data.plan.hook}</h3></div>{job.data.review && <span>{job.data.review.score}/100</span>}</header>
                  <p>{job.data.plan.editorialSummary}</p>
                  <div className={styles.cutList}>
                    {job.data.plan.segments.map((segment, index) => <article key={`${segment.sourceStartMs}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{segment.narrativeRole}</strong><p>{segment.reason}</p></div><time>{formatTime(segment.sourceStartMs)}–{formatTime(segment.sourceEndMs)}</time></article>)}
                  </div>
                  {!!job.data.review?.issues.length && <div className={styles.reviewIssues}><strong>O que a Selenita encontrou na própria revisão</strong>{job.data.review.issues.map((issue) => <p key={`${issue.code}-${issue.message}`}><CircleAlert size={14} />{issue.message}</p>)}</div>}
                </section>
              )}

              {job.data.status === "ready_for_review" && (
                <section className={styles.approvalDesk}>
                  <div><p>Agora é com você</p><h3>Aprove ou dirija mais uma rodada</h3><span>A Selenita já fez a revisão técnica e editorial. Sua aprovação inicia o render final.</span></div>
                  <form onSubmit={(event) => { event.preventDefault(); refine.mutate(); }}>
                    <MessageSquareText size={18} />
                    <textarea required minLength={3} maxLength={2000} value={refinement} onChange={(event) => setRefinement(event.target.value)} placeholder="Ex.: encurte a abertura, deixe o CTA menos comercial e mantenha a pausa antes da prova." />
                    <button className="button secondary" disabled={refine.isPending || refinement.trim().length < 3}>{refine.isPending ? "Refazendo…" : "Pedir novo corte"}</button>
                  </form>
                  <button className="button primary" disabled={approve.isPending} onClick={() => approve.mutate()}><Check size={17} />{approve.isPending ? "Iniciando exportação…" : "Aprovar e exportar final"}</button>
                  {(refine.error || approve.error) && <p className={styles.error}>{refine.error?.message ?? approve.error?.message}</p>}
                </section>
              )}

              {job.data.status === "completed" && latestVersion?.signedUrl && (
                <section className={styles.completed}><Check size={22} /><div><h3>Vídeo final concluído</h3><p>A peça aprovada já foi registrada em Posts para seguir para publicação.</p></div><a className="button primary" href={latestVersion.signedUrl} target="_blank" rel="noreferrer">Abrir arquivo final</a></section>
              )}
            </>
            )}
          </EditorBayState>
        </main>
      </div>
    </div>
  );
}

function EditorBayState({
  selectedId,
  isLoading,
  errorMessage,
  children,
}: {
  selectedId?: string;
  isLoading: boolean;
  errorMessage?: string;
  children: ReactNode;
}) {
  if (!selectedId)
    return <div className={styles.empty}><Film size={36} /><h2>Sua sala de edição está livre</h2><p>Crie um trabalho e a Selenita assume a ilha.</p></div>;
  if (isLoading)
    return <div className={styles.empty}><LoaderCircle className="spin" size={30} /><p>Abrindo a ilha…</p></div>;
  if (errorMessage)
    return <div className={styles.empty}><CircleAlert size={30} /><h2>Não foi possível abrir esta edição</h2><p>{errorMessage}</p></div>;
  return <>{children}</>;
}

function stageClass(index: number, currentStage: number) {
  if (index < currentStage) return styles.doneStage;
  if (index === currentStage) return styles.currentStage;
  return "";
}

function stageIndex(status?: VideoStatus) {
  if (!status || status === "draft" || status === "uploaded") return 0;
  if (status === "analyzing" || status === "strategy_ready") return 1;
  if (status === "rendering") return 2;
  if (status === "self_review") return 3;
  return 4;
}

function processingMessage(status: VideoStatus) {
  if (status === "analyzing") return "Transcrevendo, observando enquadramento e encontrando os trechos mais fortes.";
  if (status === "strategy_ready") return "A narrativa está definida. O render do primeiro corte começa agora.";
  if (status === "rendering") return "Cortando por palavra, ajustando ritmo, áudio, formato e legendas.";
  if (status === "self_review") return "Assistindo ao preview, procurando falhas e decidindo se precisa refazer.";
  if (status === "approved") return "Gerando o arquivo final em qualidade de publicação.";
  if (status === "failed") return "Você pode revisar a mensagem de erro e criar uma nova edição.";
  return "Envie o material para começar a montagem autônoma.";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

async function uploadFootage(jobId: string, files: File[]) {
  const { data: auth } = await getSupabase().auth.getSession();
  if (!auth.session?.user.id) throw new Error("Sua sessão expirou. Entre novamente.");
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storagePath = `${auth.session.user.id}/${jobId}/uploads/${crypto.randomUUID()}-${safeName}`;
    const { error } = await getSupabase().storage
      .from("marketing-video-editor")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    await apiClient(`/video-editor/jobs/${jobId}/assets`, {
      method: "POST",
      body: {
        name: file.name,
        mimeType: file.type,
        storagePath,
        sizeBytes: file.size,
        kind: "footage",
      },
    });
  }
}
