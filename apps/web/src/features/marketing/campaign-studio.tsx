"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/shared/lib/api-client";
import type {
  MarketingCampaignCopiesGeneration,
  MarketingAiResourceDraft,
  MarketingCampaignPlan,
  MarketingCampaignPlanGeneration,
  MarketingCreativeBundle,
  MarketingPromptTelemetry,
  MarketingResource,
} from "@/shared/types";

import {
  campaignAiBriefingFields,
  campaignNeedsStrategyEnrichment,
  mergeCampaignStrategyEnrichment,
} from "./campaign-strategy";

type Briefing = {
  segment: "pme" | "ecommerce" | "agency";
  goal: "sales" | "leads" | "repurchase" | "awareness" | "reactivation";
  audience: string;
  offer: string;
  budget: string;
};

type CopyStyle = "promotional" | "organic";
type Destination = "content" | "document";
type CreativeVariant = MarketingCreativeBundle["variants"][number];

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
    mutationFn: async () => {
      const result = await apiClient<MarketingCampaignPlanGeneration>(
        "/ai/campaigns/strategy",
        {
          method: "POST",
          timeoutMs: 55_000,
          body: {
            ...briefing,
            ...campaignAiBriefingFields(briefing.audience, briefing.offer),
            budget: Number(briefing.budget) || undefined,
          },
        },
      );
      if (!result.plan || !campaignNeedsStrategyEnrichment(result.plan)) return result;

      const enrichment = await apiClient<MarketingAiResourceDraft>(
        "/ai/resources/draft",
        {
          method: "POST",
          timeoutMs: 55_000,
          body: {
            kind: "campaign",
            intent: "refine",
            prompt: campaignStrategyEnrichmentPrompt,
            current: {
              title: result.plan.name,
              summary: result.plan.nextBestAction ?? result.plan.offer ?? "",
              status: "planned",
              scheduledFor: null,
              data: {
                adBriefing: briefing,
                adStrategy: result.plan,
              },
            },
          },
        },
      );

      return {
        ...result,
        plan: mergeCampaignStrategyEnrichment(result.plan, enrichment.data),
      };
    },
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
              hook: variant.hook,
              landing: variant.landing,
              body: variant.body,
              retentionBeats: variant.retentionBeats ?? [],
              productionNotes: variant.productionNotes,
              evidence: variant.evidence,
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
            body: creativeVariantDocument(variant),
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

  const reviewBlocksApproval = bundle?.qualityReview?.ready === false;
  let strategyButtonLabel = plan
    ? "Refazer preenchimento com IA"
    : "Preencher todos os campos com IA";
  if (generateStrategy.isPending) strategyButtonLabel = "Preenchendo todos os campos…";

  return (
    <section className="campaign-studio" aria-label="Criação de campanha com IA">
      <div className="campaign-studio-intro">
        <p className="eyebrow">Fluxo guiado com IA</p>
        <h2>Pesquisa → Estratégia → Copy → Revisão</h2>
        <p>
          Converta contexto real em uma Big Idea, uma produção executável e peças
          revisadas antes da aprovação.
        </p>
      </div>

      <div className="campaign-step">
        <StepHeading
          number="1"
          title="Pesquisa e estratégia do anúncio"
          description="Público, mecanismos, saturação, Big Idea, produção e aprovação."
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
            Público desta campanha
            <textarea
              rows={3}
              value={briefing.audience}
              onChange={(event) =>
                setBriefing({ ...briefing, audience: event.target.value })
              }
              placeholder="Qual recorte precisa ver este anúncio? Deixe vazio para a IA comparar os segmentos."
            />
            <small>
              Este recorte orienta a campanha; não define todo o mercado do Lucro Caseiro.
            </small>
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
            disabled={generateStrategy.isPending}
            onClick={() => generateStrategy.mutate()}
          >
            {strategyButtonLabel}
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
          description="O plano aprovado trava psicologia, público, oferta, promessa e canais."
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
            {bundle.qualityReview && <QualityReviewPanel review={bundle.qualityReview} />}
            <div className="copy-variants">
              {bundle.variants.map((variant, index) => (
                <article className="copy-card" key={`${variant.channel}-${index}`}>
                  <div className="copy-meta">
                    <span>{variant.channel}</span>
                    <small>{variant.format}</small>
                  </div>
                  <h3>{variant.headline}</h3>
                  {variant.hook && <CopyElement label="Gancho" value={variant.hook} />}
                  {variant.landing && (
                    <CopyElement label="Aterrissagem" value={variant.landing} />
                  )}
                  <p>{variant.body}</p>
                  {Boolean(variant.retentionBeats?.length) && (
                    <div className="copy-elements">
                      <small>Movimentos de retenção</small>
                      <ul>
                        {variant.retentionBeats?.map((beat, beatIndex) => (
                          <li key={`${beatIndex}-${beat}`}>{beat}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {variant.productionNotes && (
                    <CopyElement label="Produção" value={variant.productionNotes} />
                  )}
                  {variant.evidence && (
                    <CopyElement label="Evidência usada" value={variant.evidence} />
                  )}
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
                        disabled={saveVariant.isPending || reviewBlocksApproval}
                        onClick={() =>
                          saveVariant.mutate({ index, destination: "content" })
                        }
                      >
                        Aprovar como conteúdo
                      </button>
                      <button
                        className="button secondary"
                        disabled={saveVariant.isPending || reviewBlocksApproval}
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
            {reviewBlocksApproval && (
              <p className="notice warning">
                A autorrevisão encontrou uma lacuna impeditiva. Regere as copies ou reabra
                a estratégia antes de aprovar.
              </p>
            )}
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

function ListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <label>
      {label}
      <textarea
        rows={4}
        value={value.join("\n")}
        onChange={(event) => onChange(splitLines(event.target.value))}
        placeholder="Um item por linha"
      />
    </label>
  );
}

function QualityReviewPanel({
  review,
}: {
  review: NonNullable<MarketingCreativeBundle["qualityReview"]>;
}) {
  const criteria = [
    ["Congruência", review.criteria.congruence],
    ["Especificidade", review.criteria.specificity],
    ["Novidade", review.criteria.novelty],
    ["Segurança das evidências", review.criteria.evidenceSafety],
    ["Concisão", review.criteria.concision],
  ] as const;
  return (
    <section className={`quality-review ${review.ready ? "ready" : "blocked"}`}>
      <div className="quality-review-heading">
        <div>
          <small>Autorrevisão da geração</small>
          <strong>{review.ready ? "Pronta para revisão humana" : "Requer ajuste"}</strong>
        </div>
        <span>{review.score}/100</span>
      </div>
      <div className="quality-criteria">
        {criteria.map(([label, score]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{score}</strong>
          </div>
        ))}
      </div>
      {review.strengths.length > 0 && (
        <div>
          <strong>Pontos fortes</strong>
          <ul>
            {review.strengths.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {review.warnings.length > 0 && (
        <div>
          <strong>Pendências</strong>
          <ul>
            {review.warnings.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {review.nextTest && (
        <p>
          <strong>Próximo teste:</strong> {review.nextTest}
        </p>
      )}
    </section>
  );
}

function CopyElement({ label, value }: { label: string; value: string }) {
  return (
    <div className="copy-elements">
      <small>{label}</small>
      <p>{value}</p>
    </div>
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
  const research = campaignResearch(plan);
  const creativeStrategy = campaignCreativeStrategy(plan);
  const patchResearch = (value: Partial<typeof research>) =>
    patch({ research: { ...research, ...value } });
  const patchCreativeStrategy = (value: Partial<typeof creativeStrategy>) =>
    patch({ creativeStrategy: { ...creativeStrategy, ...value } });
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
      <details className="span-2 plan-section" open>
        <summary>Pesquisa estratégica</summary>
        <div className="plan-section-grid">
          <label>
            Fatia de público
            <textarea
              rows={3}
              value={research.audienceSlice}
              onChange={(event) => patchResearch({ audienceSlice: event.target.value })}
            />
          </label>
          <label>
            Desejo real
            <textarea
              rows={3}
              value={research.realDesire}
              onChange={(event) => patchResearch({ realDesire: event.target.value })}
            />
          </label>
          <label>
            Mecanismo do problema
            <textarea
              rows={3}
              value={research.problemMechanism}
              onChange={(event) =>
                patchResearch({ problemMechanism: event.target.value })
              }
            />
          </label>
          <label>
            Mecanismo da solução
            <textarea
              rows={3}
              value={research.solutionMechanism}
              onChange={(event) =>
                patchResearch({ solutionMechanism: event.target.value })
              }
            />
          </label>
          <ListField
            label="Linguagem real do público"
            value={research.audienceLanguage}
            onChange={(audienceLanguage) => patchResearch({ audienceLanguage })}
          />
          <ListField
            label="Soluções ou mensagens saturadas"
            value={research.saturatedSolutions}
            onChange={(saturatedSolutions) => patchResearch({ saturatedSolutions })}
          />
          <ListField
            label="Diferenciais"
            value={research.differentiators}
            onChange={(differentiators) => patchResearch({ differentiators })}
          />
          <ListField
            label="Provas confirmadas"
            value={research.proofs}
            onChange={(proofs) => patchResearch({ proofs })}
          />
          <label className="span-2">
            Notas de saturação e lacunas
            <textarea
              rows={3}
              value={research.saturationNotes}
              onChange={(event) => patchResearch({ saturationNotes: event.target.value })}
            />
          </label>
        </div>
      </details>
      <details className="span-2 plan-section" open>
        <summary>Big Idea e produção</summary>
        <div className="plan-section-grid">
          <label className="span-2">
            Big Idea
            <textarea
              rows={3}
              value={creativeStrategy.bigIdea}
              onChange={(event) => patchCreativeStrategy({ bigIdea: event.target.value })}
            />
          </label>
          <label>
            Ângulo
            <textarea
              rows={3}
              value={creativeStrategy.angle}
              onChange={(event) => patchCreativeStrategy({ angle: event.target.value })}
            />
          </label>
          <label>
            Promessa permitida
            <textarea
              rows={3}
              value={creativeStrategy.promise}
              onChange={(event) => patchCreativeStrategy({ promise: event.target.value })}
            />
          </label>
          <label>
            Razão para acreditar
            <textarea
              rows={3}
              value={creativeStrategy.reasonToBelieve}
              onChange={(event) =>
                patchCreativeStrategy({ reasonToBelieve: event.target.value })
              }
            />
          </label>
          <label>
            Insight do orgânico
            <textarea
              rows={3}
              value={creativeStrategy.organicInsight}
              onChange={(event) =>
                patchCreativeStrategy({ organicInsight: event.target.value })
              }
            />
          </label>
          <label>
            Nome memorável (opcional)
            <input
              value={creativeStrategy.stickyName}
              onChange={(event) =>
                patchCreativeStrategy({ stickyName: event.target.value })
              }
            />
          </label>
          <label>
            Inimigo comum fundamentado (opcional)
            <input
              value={creativeStrategy.commonEnemy}
              onChange={(event) =>
                patchCreativeStrategy({ commonEnemy: event.target.value })
              }
            />
          </label>
          <label>
            Avatar
            <textarea
              rows={3}
              value={creativeStrategy.avatar}
              onChange={(event) => patchCreativeStrategy({ avatar: event.target.value })}
            />
          </label>
          <label>
            Formato
            <textarea
              rows={3}
              value={creativeStrategy.format}
              onChange={(event) => patchCreativeStrategy({ format: event.target.value })}
            />
          </label>
          <label>
            Gancho visual
            <textarea
              rows={3}
              value={creativeStrategy.visualHook}
              onChange={(event) =>
                patchCreativeStrategy({ visualHook: event.target.value })
              }
            />
          </label>
          <label>
            Frase de aterrissagem
            <textarea
              rows={3}
              value={creativeStrategy.landing}
              onChange={(event) => patchCreativeStrategy({ landing: event.target.value })}
            />
          </label>
          <ListField
            label="Movimentos de retenção"
            value={creativeStrategy.retentionBeats}
            onChange={(retentionBeats) => patchCreativeStrategy({ retentionBeats })}
          />
          <ListField
            label="Notas de produção"
            value={creativeStrategy.productionNotes}
            onChange={(productionNotes) => patchCreativeStrategy({ productionNotes })}
          />
        </div>
      </details>
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

function campaignResearch(
  plan: MarketingCampaignPlan,
): NonNullable<MarketingCampaignPlan["research"]> {
  return {
    audienceSlice: "",
    realDesire: "",
    problemMechanism: "",
    solutionMechanism: "",
    saturationNotes: "",
    ...plan.research,
    audienceLanguage: plan.research?.audienceLanguage ?? [],
    saturatedSolutions: plan.research?.saturatedSolutions ?? [],
    differentiators: plan.research?.differentiators ?? [],
    proofs: plan.research?.proofs ?? [],
  };
}

function campaignCreativeStrategy(
  plan: MarketingCampaignPlan,
): NonNullable<MarketingCampaignPlan["creativeStrategy"]> {
  return {
    bigIdea: "",
    angle: "",
    promise: "",
    reasonToBelieve: "",
    stickyName: "",
    commonEnemy: "",
    organicInsight: "",
    avatar: "",
    format: "",
    visualHook: "",
    landing: "",
    ...plan.creativeStrategy,
    retentionBeats: plan.creativeStrategy?.retentionBeats ?? [],
    productionNotes: plan.creativeStrategy?.productionNotes ?? [],
  };
}

const campaignStrategyEnrichmentPrompt = `Complete os blocos Pesquisa estratégica e Big Idea e produção da campanha atual.
Use somente o briefing, o plano e o conhecimento confirmado da Central. Não invente provas.
No objeto data da resposta, devolva exatamente estas duas chaves:
{"research":{"audienceSlice":"...","audienceLanguage":["..."],"realDesire":"...","saturatedSolutions":["..."],"problemMechanism":"...","solutionMechanism":"...","differentiators":["..."],"proofs":["..."],"saturationNotes":"..."},"creativeStrategy":{"bigIdea":"...","angle":"...","promise":"...","reasonToBelieve":"...","stickyName":"...","commonEnemy":"...","organicInsight":"...","avatar":"...","format":"...","visualHook":"...","landing":"...","retentionBeats":["..."],"productionNotes":["..."]}}.
Preencha todos os campos com conteúdo específico. proofs pode ser [] e stickyName/commonEnemy podem ficar vazios quando não houver fundamento.`;

function creativeVariantDocument(variant: CreativeVariant) {
  const retentionItems = variant.retentionBeats?.map((item) => "- " + item).join("\n");
  const retention = retentionItems
    ? `\n\n## Movimentos de retenção\n\n${retentionItems}`
    : "";
  const production = variant.productionNotes
    ? `\n\n## Produção\n\n${variant.productionNotes}`
    : "";
  const evidence = variant.evidence
    ? `\n\n## Evidência usada\n\n${variant.evidence}`
    : "";
  return `# ${variant.headline}\n\n**Canal:** ${variant.channel}\n**Formato:** ${variant.format}\n\n## Gancho\n\n${variant.hook || variant.headline}\n\n## Aterrissagem\n\n${variant.landing || "—"}\n\n## Corpo\n\n${variant.body}${retention}${production}${evidence}\n\n## CTA\n\n${variant.cta}`;
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
