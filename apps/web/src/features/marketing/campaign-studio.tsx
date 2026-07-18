"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/shared/lib/api-client";
import type {
  MarketingCampaignCopiesGeneration,
  MarketingCampaignPlan,
  MarketingCampaignPlanGeneration,
  MarketingCreativeBundle,
  MarketingPromptTelemetry,
  MarketingResource,
} from "@/shared/types";

type Briefing = {
  segment: "pme" | "ecommerce" | "agency";
  goal: "sales" | "leads" | "repurchase" | "awareness" | "reactivation";
  audience: string;
  offer: string;
  budget: string;
};

type CopyStyle = "promotional" | "organic";
type Destination = "content" | "document";

const initialBriefing: Briefing = {
  segment: "pme",
  goal: "leads",
  audience: "",
  offer: "",
  budget: "",
};

export function CampaignStudio({ campaigns }: { campaigns: MarketingResource[] }) {
  const queryClient = useQueryClient();
  const restored = useMemo(() => restoreApprovedPlan(campaigns), [campaigns]);
  const [restoredId, setRestoredId] = useState<string>();
  const [briefing, setBriefing] = useState<Briefing>(initialBriefing);
  const [plan, setPlan] = useState<MarketingCampaignPlan | null>(null);
  const [strategyApproved, setStrategyApproved] = useState(false);
  const [campaignResourceId, setCampaignResourceId] = useState<string>();
  const [strategyRaw, setStrategyRaw] = useState("");
  const [strategyMessageId, setStrategyMessageId] = useState<string>();
  const [strategyTelemetry, setStrategyTelemetry] = useState<MarketingPromptTelemetry>();
  const [style, setStyle] = useState<CopyStyle>("promotional");
  const [bundle, setBundle] = useState<MarketingCreativeBundle | null>(null);
  const [copyRaw, setCopyRaw] = useState("");
  const [copyMessageId, setCopyMessageId] = useState<string>();
  const [copyTelemetry, setCopyTelemetry] = useState<MarketingPromptTelemetry>();
  const [savedVariants, setSavedVariants] = useState<Record<number, Destination>>({});
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!restored || restored.resource.id === restoredId) return;
    setRestoredId(restored.resource.id);
    setCampaignResourceId(restored.resource.id);
    setBriefing(restored.briefing);
    setPlan(restored.plan);
    setStrategyApproved(true);
    const storedBundle = creativeBundleFromData(restored.resource.data.copyBundle);
    if (storedBundle) setBundle(storedBundle);
  }, [restored, restoredId]);

  const generateStrategy = useMutation({
    mutationFn: () =>
      apiClient<MarketingCampaignPlanGeneration>("/ai/campaigns/strategy", {
        method: "POST",
        timeoutMs: 55_000,
        body: {
          ...briefing,
          budget: Number(briefing.budget) || undefined,
        },
      }),
    onMutate: () => {
      setPlan(null);
      setBundle(null);
      setStrategyRaw("");
      setStrategyApproved(false);
      setSavedVariants({});
    },
    onSuccess: (result) => {
      setStrategyRaw(result.plan ? "" : result.raw);
      setStrategyMessageId(result.messageId);
      setStrategyTelemetry(result.telemetry);
      setPlan(result.plan);
    },
  });

  const approveStrategy = useMutation({
    mutationFn: async () => {
      if (!plan || !strategyTelemetry)
        throw new Error("Gere a estratégia antes de aprovar.");
      const data = {
        ...currentCampaignData(campaigns, campaignResourceId),
        adBriefing: { ...briefing, budget: Number(briefing.budget) || null },
        adStrategy: plan,
        adStrategyApprovedAt: new Date().toISOString(),
        promptRuns: appendPromptRun(
          currentCampaignData(campaigns, campaignResourceId).promptRuns,
          strategyTelemetry,
        ),
      };
      if (campaignResourceId) {
        return apiClient<MarketingResource>(`/resources/${campaignResourceId}`, {
          method: "PATCH",
          body: {
            title: plan.name,
            summary: plan.nextBestAction || plan.offer || "Estratégia aprovada.",
            status: "planned",
            data,
          },
        });
      }
      return apiClient<MarketingResource>("/resources", {
        method: "POST",
        body: {
          kind: "campaign",
          slug: `estrategia-anuncio-${Date.now()}`,
          title: plan.name,
          summary: plan.nextBestAction || plan.offer || "Estratégia aprovada.",
          status: "planned",
          scheduledFor: null,
          data,
        },
      });
    },
    onSuccess: (resource) => {
      setCampaignResourceId(resource.id);
      setRestoredId(resource.id);
      setStrategyApproved(true);
      setBundle(null);
      setSavedVariants({});
      void queryClient.invalidateQueries({ queryKey: ["resources", "campaign"] });
    },
  });

  const generateCopies = useMutation({
    mutationFn: () => {
      if (!plan || !strategyApproved)
        throw new Error("Aprove a estratégia antes de gerar as copies.");
      return apiClient<MarketingCampaignCopiesGeneration>("/ai/campaigns/copies", {
        method: "POST",
        timeoutMs: 55_000,
        body: { plan, style },
      });
    },
    onMutate: () => {
      setBundle(null);
      setCopyRaw("");
      setSavedVariants({});
    },
    onSuccess: async (result) => {
      setCopyRaw(result.bundle ? "" : result.raw);
      setCopyMessageId(result.messageId);
      setCopyTelemetry(result.telemetry);
      setBundle(result.bundle);
      if (!result.bundle || !campaignResourceId) return;
      const data = currentCampaignData(campaigns, campaignResourceId);
      await apiClient(`/resources/${campaignResourceId}`, {
        method: "PATCH",
        body: {
          data: {
            ...data,
            copyBundle: result.bundle,
            copyStyle: style,
            copyGeneratedAt: new Date().toISOString(),
            promptRuns: appendPromptRun(data.promptRuns, result.telemetry),
          },
        },
      });
      void queryClient.invalidateQueries({ queryKey: ["resources", "campaign"] });
    },
  });

  const saveVariant = useMutation({
    mutationFn: async ({
      index,
      destination,
    }: {
      index: number;
      destination: Destination;
    }) => {
      const variant = bundle?.variants[index];
      if (!variant) throw new Error("Variante não encontrada.");
      if (destination === "content") {
        await apiClient("/resources", {
          method: "POST",
          body: {
            kind: "content",
            slug: `copy-campanha-${Date.now()}-${index}`,
            title: variant.headline,
            summary: variant.body,
            status: "ready",
            scheduledFor: null,
            data: {
              source: "ad-copywriter",
              campaignResourceId,
              channel: variant.channel,
              format: variant.format,
              headline: variant.headline,
              body: variant.body,
              cta: variant.cta,
              prompt: copyTelemetry,
            },
          },
        });
      } else {
        await apiClient("/documents", {
          method: "POST",
          body: {
            title: variant.headline,
            slug: `copy-campanha-${Date.now()}-${index}`,
            body: `# ${variant.headline}\n\n${variant.body}\n\n**CTA:** ${variant.cta}\n\n**Canal:** ${variant.channel}\n**Formato:** ${variant.format}`,
            tags: ["ia", "copy", variant.channel],
            source: "ai",
          },
        });
      }
      return { index, destination };
    },
    onSuccess: ({ index, destination }) => {
      setSavedVariants((current) => ({ ...current, [index]: destination }));
      void queryClient.invalidateQueries({ queryKey: ["resources", "content"] });
    },
  });

  const sendFeedback = useMutation({
    mutationFn: ({
      messageId,
      rating,
      note,
    }: {
      messageId: string;
      rating: "positive" | "negative";
      note: string;
    }) =>
      apiClient("/ai/feedback", { method: "POST", body: { messageId, rating, note } }),
    onSuccess: (_result, input) =>
      setFeedbackSent((current) => ({ ...current, [input.messageId]: true })),
  });

  return (
    <section className="campaign-studio" aria-label="Criação de campanha com IA">
      <div className="campaign-studio-intro">
        <p className="eyebrow">Fluxo guiado com IA</p>
        <h2>Estrategista de anúncios → Copywriter</h2>
        <p>Defina e aprove a estratégia antes de produzir as peças de cada canal.</p>
      </div>

      <div className="campaign-step">
        <StepHeading
          number="1"
          title="Estratégia do anúncio"
          description="Briefing, plano estruturado e aprovação."
        />
        <fieldset
          className="campaign-form"
          disabled={generateStrategy.isPending || strategyApproved}
        >
          <label>
            Segmento
            <select
              value={briefing.segment}
              onChange={(event) =>
                setBriefing({
                  ...briefing,
                  segment: event.target.value as Briefing["segment"],
                })
              }
            >
              <option value="pme">PME</option>
              <option value="ecommerce">E-commerce</option>
              <option value="agency">Agência</option>
            </select>
          </label>
          <label>
            Objetivo
            <select
              value={briefing.goal}
              onChange={(event) =>
                setBriefing({ ...briefing, goal: event.target.value as Briefing["goal"] })
              }
            >
              <option value="sales">Vendas</option>
              <option value="leads">Leads</option>
              <option value="repurchase">Recompra</option>
              <option value="awareness">Reconhecimento</option>
              <option value="reactivation">Reativação</option>
            </select>
          </label>
          <label className="span-2">
            Público
            <textarea
              rows={3}
              value={briefing.audience}
              onChange={(event) =>
                setBriefing({ ...briefing, audience: event.target.value })
              }
              placeholder="Quem precisa ver este anúncio?"
            />
          </label>
          <label className="span-2">
            Oferta
            <textarea
              rows={3}
              value={briefing.offer}
              onChange={(event) =>
                setBriefing({ ...briefing, offer: event.target.value })
              }
              placeholder="O que está sendo oferecido e qual promessa é permitida?"
            />
          </label>
          <label>
            Orçamento estimado (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              value={briefing.budget}
              onChange={(event) =>
                setBriefing({ ...briefing, budget: event.target.value })
              }
            />
          </label>
        </fieldset>
        {!strategyApproved && (
          <button
            className="button primary"
            disabled={
              generateStrategy.isPending ||
              !briefing.audience.trim() ||
              !briefing.offer.trim()
            }
            onClick={() => generateStrategy.mutate()}
          >
            {generateStrategy.isPending ? "Gerando estratégia…" : "Gerar estratégia"}
          </button>
        )}
        {generateStrategy.error && (
          <Recovery
            error={generateStrategy.error.message}
            onRetry={() => generateStrategy.mutate()}
          />
        )}
        {!plan && strategyRaw && (
          <Recovery
            error="A IA respondeu, mas o plano não veio no formato esperado."
            raw={strategyRaw}
            onRetry={() => generateStrategy.mutate()}
          />
        )}
        {plan && (
          <PlanEditor plan={plan} disabled={strategyApproved} onChange={setPlan} />
        )}
        {plan && (
          <div className="campaign-approval-actions">
            {strategyApproved ? (
              <>
                <span className="approval-mark">Estratégia aprovada</span>
                <button
                  className="button secondary"
                  onClick={() => {
                    setStrategyApproved(false);
                    setBundle(null);
                  }}
                >
                  Reabrir edição
                </button>
              </>
            ) : (
              <button
                className="button primary"
                disabled={approveStrategy.isPending}
                onClick={() => approveStrategy.mutate()}
              >
                {approveStrategy.isPending ? "Aprovando…" : "Aprovar estratégia"}
              </button>
            )}
            {strategyMessageId && (
              <FeedbackButtons
                sent={Boolean(feedbackSent[strategyMessageId])}
                onRate={(rating) =>
                  sendFeedback.mutate({
                    messageId: strategyMessageId,
                    rating,
                    note:
                      rating === "positive"
                        ? "Estratégia de anúncio útil"
                        : "Estratégia de anúncio não útil",
                  })
                }
              />
            )}
          </div>
        )}
      </div>

      <div className={`campaign-step ${strategyApproved ? "" : "locked"}`}>
        <StepHeading
          number="2"
          title="Copies"
          description="O plano aprovado trava público, oferta, promessa e canais."
        />
        {!strategyApproved ? (
          <p className="empty-inline">Aprove a estratégia para liberar as copies.</p>
        ) : (
          <>
            <div
              className="style-picker"
              role="radiogroup"
              aria-label="Estilo das copies"
            >
              <button
                className={`button ${style === "promotional" ? "primary" : "secondary"}`}
                role="radio"
                aria-checked={style === "promotional"}
                onClick={() => setStyle("promotional")}
              >
                Promocional
              </button>
              <button
                className={`button ${style === "organic" ? "primary" : "secondary"}`}
                role="radio"
                aria-checked={style === "organic"}
                onClick={() => setStyle("organic")}
              >
                Orgânico
              </button>
              <button
                className="button primary"
                disabled={generateCopies.isPending}
                onClick={() => generateCopies.mutate()}
              >
                {generateCopies.isPending ? "Gerando copies…" : "Gerar copies"}
              </button>
            </div>
            {generateCopies.error && (
              <Recovery
                error={generateCopies.error.message}
                onRetry={() => generateCopies.mutate()}
              />
            )}
            {!bundle && copyRaw && (
              <Recovery
                error="A IA respondeu, mas as copies não vieram no formato esperado."
                raw={copyRaw}
                onRetry={() => generateCopies.mutate()}
              />
            )}
            {bundle && (
              <div className="reuse-map">
                <strong>Mapa de reaproveitamento</strong>
                {bundle.reuseMap.length ? (
                  <ul>
                    {bundle.reuseMap.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Sem instruções adicionais.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className={`campaign-step ${bundle ? "" : "locked"}`}>
        <StepHeading
          number="3"
          title="Aprovação e destino"
          description="Envie cada variante aprovada para Conteúdo ou Documentos."
        />
        {!bundle ? (
          <p className="empty-inline">Gere as copies para revisar cada variante.</p>
        ) : (
          <>
            <div className="copy-variants">
              {bundle.variants.map((variant, index) => (
                <article className="copy-card" key={`${variant.channel}-${index}`}>
                  <div className="copy-meta">
                    <span>{variant.channel}</span>
                    <small>{variant.format}</small>
                  </div>
                  <h3>{variant.headline}</h3>
                  <p>{variant.body}</p>
                  <div className="copy-cta">
                    <small>CTA</small>
                    <strong>{variant.cta}</strong>
                  </div>
                  {savedVariants[index] ? (
                    <span className="approval-mark">
                      Aprovada como{" "}
                      {savedVariants[index] === "content" ? "conteúdo" : "documento"}
                    </span>
                  ) : (
                    <div className="copy-actions">
                      <button
                        className="button primary"
                        disabled={saveVariant.isPending}
                        onClick={() =>
                          saveVariant.mutate({ index, destination: "content" })
                        }
                      >
                        Aprovar como conteúdo
                      </button>
                      <button
                        className="button secondary"
                        disabled={saveVariant.isPending}
                        onClick={() =>
                          saveVariant.mutate({ index, destination: "document" })
                        }
                      >
                        Aprovar como documento
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
            {copyMessageId && (
              <FeedbackButtons
                sent={Boolean(feedbackSent[copyMessageId])}
                onRate={(rating) =>
                  sendFeedback.mutate({
                    messageId: copyMessageId,
                    rating,
                    note:
                      rating === "positive"
                        ? "Pacote de copies útil"
                        : "Pacote de copies não útil",
                  })
                }
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PlanEditor({
  plan,
  disabled,
  onChange,
}: {
  plan: MarketingCampaignPlan;
  disabled: boolean;
  onChange: (plan: MarketingCampaignPlan) => void;
}) {
  const patch = (value: Partial<MarketingCampaignPlan>) =>
    onChange({ ...plan, ...value });
  const updateKpi = (index: number, field: "label" | "target", value: string) =>
    patch({
      kpis: plan.kpis.map((kpi, itemIndex) =>
        itemIndex === index ? { ...kpi, [field]: value } : kpi,
      ),
    });
  return (
    <fieldset className="plan-editor" disabled={disabled}>
      <legend>Plano estruturado</legend>
      <label className="span-2">
        Nome
        <input
          value={plan.name}
          onChange={(event) => patch({ name: event.target.value })}
        />
      </label>
      <label>
        Público
        <textarea
          rows={3}
          value={plan.audienceSummary ?? ""}
          onChange={(event) => patch({ audienceSummary: event.target.value })}
        />
      </label>
      <label>
        Oferta
        <textarea
          rows={3}
          value={plan.offer ?? ""}
          onChange={(event) => patch({ offer: event.target.value })}
        />
      </label>
      <label className="span-2">
        Canais
        <input
          value={plan.channels.join(", ")}
          onChange={(event) => patch({ channels: splitList(event.target.value) })}
        />
      </label>
      <label className="span-2">
        Necessidades criativas
        <textarea
          rows={3}
          value={plan.creativeNeeds.join("\n")}
          onChange={(event) => patch({ creativeNeeds: splitLines(event.target.value) })}
        />
      </label>
      <label className="span-2">
        Automação
        <textarea
          rows={3}
          value={plan.automation ?? ""}
          onChange={(event) => patch({ automation: event.target.value })}
        />
      </label>
      <div className="span-2 message-editor">
        <strong>Mensagem por canal</strong>
        {plan.channels.map((channel) => (
          <label key={channel}>
            {channel}
            <textarea
              rows={2}
              value={plan.messages[channel] ?? ""}
              onChange={(event) =>
                patch({ messages: { ...plan.messages, [channel]: event.target.value } })
              }
            />
          </label>
        ))}
      </div>
      <div className="span-2 kpi-editor">
        <strong>KPIs</strong>
        {plan.kpis.map((kpi, index) => (
          <div key={`${index}-${kpi.label}`}>
            <input
              aria-label={`KPI ${index + 1}`}
              value={kpi.label}
              onChange={(event) => updateKpi(index, "label", event.target.value)}
            />
            <input
              aria-label={`Meta ${index + 1}`}
              value={kpi.target}
              onChange={(event) => updateKpi(index, "target", event.target.value)}
            />
          </div>
        ))}
      </div>
      <label className="span-2">
        Próxima melhor ação
        <textarea
          rows={3}
          value={plan.nextBestAction ?? ""}
          onChange={(event) => patch({ nextBestAction: event.target.value })}
        />
      </label>
    </fieldset>
  );
}

function StepHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="step-heading">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Recovery({
  error,
  raw,
  onRetry,
}: {
  error: string;
  raw?: string;
  onRetry: () => void;
}) {
  return (
    <div className="notice error parse-recovery">
      <strong>{error}</strong>
      {raw && (
        <details>
          <summary>Ver resposta bruta</summary>
          <pre>{raw}</pre>
        </details>
      )}
      <button className="button secondary" onClick={onRetry}>
        Regenerar
      </button>
    </div>
  );
}

function FeedbackButtons({
  sent,
  onRate,
}: {
  sent: boolean;
  onRate: (rating: "positive" | "negative") => void;
}) {
  if (sent) return <span className="approval-mark">Feedback registrado</span>;
  return (
    <div className="feedback-buttons">
      <span>Esta geração foi útil?</span>
      <button className="button secondary" onClick={() => onRate("positive")}>
        Útil
      </button>
      <button className="button secondary" onClick={() => onRate("negative")}>
        Não útil
      </button>
    </div>
  );
}

function restoreApprovedPlan(resources: MarketingResource[]) {
  for (const resource of resources) {
    if (!resource.data.adStrategyApprovedAt) continue;
    const plan = campaignPlanFromData(resource.data.adStrategy);
    if (plan)
      return { resource, plan, briefing: briefingFromData(resource.data.adBriefing) };
  }
  return null;
}

function campaignPlanFromData(value: unknown): MarketingCampaignPlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.name !== "string" ||
    !Array.isArray(raw.channels) ||
    !Array.isArray(raw.kpis)
  )
    return null;
  return raw as unknown as MarketingCampaignPlan;
}

function creativeBundleFromData(value: unknown): MarketingCreativeBundle | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.variants) || !Array.isArray(raw.reuseMap)) return null;
  return raw as unknown as MarketingCreativeBundle;
}

function briefingFromData(value: unknown): Briefing {
  if (!value || typeof value !== "object") return initialBriefing;
  const raw = value as Record<string, unknown>;
  return {
    segment:
      raw.segment === "ecommerce" || raw.segment === "agency" ? raw.segment : "pme",
    goal:
      raw.goal === "sales" ||
      raw.goal === "repurchase" ||
      raw.goal === "awareness" ||
      raw.goal === "reactivation"
        ? raw.goal
        : "leads",
    audience: typeof raw.audience === "string" ? raw.audience : "",
    offer: typeof raw.offer === "string" ? raw.offer : "",
    budget: typeof raw.budget === "number" ? String(raw.budget) : "",
  };
}

function currentCampaignData(resources: MarketingResource[], id?: string) {
  return resources.find((resource) => resource.id === id)?.data ?? {};
}

function appendPromptRun(value: unknown, telemetry: MarketingPromptTelemetry) {
  return [
    ...(Array.isArray(value) ? value : []),
    { ...telemetry, createdAt: new Date().toISOString() },
  ];
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
