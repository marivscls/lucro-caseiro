import {
  contentFormatOptions,
  scoreContentBrief,
  type ContentBrief,
  type ContentBriefAnalysis,
  type ContentBriefScore,
} from "./content-brief";
import type { MarketingContentIdea } from "@/shared/types";

export function ContentBriefEditor({
  value,
  onChange,
  sourceText,
  onSourceTextChange,
  onGenerate,
  onRefine,
  onGenerateIdeas,
  onUseIdea,
  ideas = [],
  ideasPending,
  ideasError,
  aiIntent,
  aiPending,
  aiError,
  canGenerate,
  canRefine,
}: {
  value: ContentBrief;
  onChange: (value: ContentBrief) => void;
  sourceText: string;
  onSourceTextChange: (value: string) => void;
  onGenerate: () => void;
  onRefine: () => void;
  onGenerateIdeas: () => void;
  onUseIdea: (idea: MarketingContentIdea) => void;
  ideas: MarketingContentIdea[];
  ideasPending: boolean;
  ideasError?: string;
  aiIntent?: "generate" | "refine";
  aiPending: boolean;
  aiError?: string;
  canGenerate: boolean;
  canRefine: boolean;
}) {
  const score = scoreContentBrief(value);
  const displayedScore = value.analysis?.overallScore ?? score.overall;
  const update = <Key extends keyof ContentBrief>(
    key: Key,
    nextValue: ContentBrief[Key],
  ) => onChange({ ...value, [key]: nextValue, analysis: undefined });

  return (
    <details className="content-brief" open>
      <summary>
        <span>Contexto estruturado</span>
        <span className={`brief-score-badge ${scoreClass(displayedScore)}`}>
          {displayedScore}/100
        </span>
      </summary>
      <p className="field-help">
        Quanto mais específico o briefing, menos a IA precisa inferir. Campos vazios são
        aceitos quando a informação ainda não existe.
      </p>

      <section className="brief-ai-panel" aria-label="Inteligência do briefing">
        <label>
          Ideia, texto ou transcrição
          <textarea
            value={sourceText}
            rows={5}
            placeholder="Cole uma ideia solta, legenda, roteiro, anotação ou transcrição. O título e o resumo também serão considerados."
            onChange={(event) => onSourceTextChange(event.target.value)}
          />
        </label>
        <div className="brief-ai-actions">
          <button
            type="button"
            className="button primary"
            disabled={!canGenerate || aiPending}
            onClick={onGenerate}
          >
            ✨ {aiPending && aiIntent === "generate" ? "Gerando…" : "Gerar Briefing"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!canRefine || aiPending}
            onClick={onRefine}
          >
            🧠 {aiPending && aiIntent === "refine" ? "Refinando…" : "Refinar Estratégia"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={aiPending || ideasPending}
            onClick={onGenerateIdeas}
          >
            💡 {ideasPending ? "Descobrindo…" : "Gerar Ideias"}
          </button>
        </div>
        {aiError && <p className="form-error">{aiError}</p>}
        {ideasError && <p className="form-error">{ideasError}</p>}
        {ideas.length > 0 && <IdeaBank ideas={ideas} onUseIdea={onUseIdea} />}
      </section>

      <fieldset>
        <legend>Estratégia e persona</legend>
        <div className="content-brief-grid">
          <BriefInput
            label="Tema"
            value={value.theme}
            onChange={(next) => update("theme", next)}
          />
          <BriefInput
            label="Categoria"
            value={value.category}
            onChange={(next) => update("category", next)}
          />
          <BriefInput
            label="Persona"
            value={value.persona}
            placeholder="Ex.: confeiteira que já vende por encomenda"
            onChange={(next) => update("persona", next)}
          />
          <BriefInput
            label="Objetivo do conteúdo"
            value={value.contentObjective}
            placeholder="Ex.: gerar salvamentos e levar à calculadora"
            onChange={(next) => update("contentObjective", next)}
          />
          <BriefInput
            label="Estágio da persona"
            value={value.personaStage}
            placeholder="Ex.: consciente do problema"
            onChange={(next) => update("personaStage", next)}
          />
          <BriefInput
            label="Tom de voz"
            value={value.toneOfVoice}
            placeholder="Ex.: direto, acolhedor e prático"
            onChange={(next) => update("toneOfVoice", next)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Dor, desejo e transformação</legend>
        <div className="content-brief-grid">
          <BriefTextarea
            label="Dor principal"
            value={value.mainPain}
            onChange={(next) => update("mainPain", next)}
          />
          <BriefTextarea
            label="Desejo principal"
            value={value.mainDesire}
            onChange={(next) => update("mainDesire", next)}
          />
          <BriefTextarea
            label="Transformação (Antes → Depois)"
            value={value.transformation}
            onChange={(next) => update("transformation", next)}
          />
          <BriefInput
            label="Emoção principal"
            value={value.primaryEmotion}
            placeholder="Ex.: alívio, segurança, confiança"
            onChange={(next) => update("primaryEmotion", next)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Mensagem e conversão</legend>
        <BriefTextarea
          label="Gancho"
          value={value.hook}
          onChange={(next) => update("hook", next)}
        />
        <BriefTextarea
          label="Mensagem principal"
          value={value.mainMessage}
          onChange={(next) => update("mainMessage", next)}
        />
        <BriefInput
          label="CTA"
          value={value.cta}
          onChange={(next) => update("cta", next)}
        />
      </fieldset>

      <fieldset>
        <legend>Direcionadores e limites</legend>
        <div className="content-brief-grid">
          <BriefList
            label="Gatilhos mentais"
            value={value.mentalTriggers}
            onChange={(next) => update("mentalTriggers", next)}
          />
          <BriefList
            label="Objeções"
            value={value.objections}
            onChange={(next) => update("objections", next)}
          />
          <BriefList
            label="Palavras-chave"
            value={value.keywords}
            onChange={(next) => update("keywords", next)}
          />
          <BriefList
            label="Restrições"
            value={value.restrictions}
            onChange={(next) => update("restrictions", next)}
          />
          <BriefList
            label="Provas"
            value={value.proofs}
            onChange={(next) => update("proofs", next)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Formatos desejados</legend>
        <div className="content-format-grid">
          {contentFormatOptions.map((format) => (
            <label key={format} className="content-format-option">
              <input
                type="checkbox"
                checked={value.desiredFormats.includes(format)}
                onChange={(event) => {
                  const desiredFormats = event.target.checked
                    ? [...value.desiredFormats, format]
                    : value.desiredFormats.filter((item) => item !== format);
                  update("desiredFormats", desiredFormats);
                }}
              />
              <span>{format}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {value.analysis ? (
        <StrategicAnalysis analysis={value.analysis} brief={value} />
      ) : (
        <BriefCompletionScore score={score} />
      )}
    </details>
  );
}

function IdeaBank({
  ideas,
  onUseIdea,
}: {
  ideas: MarketingContentIdea[];
  onUseIdea: (idea: MarketingContentIdea) => void;
}) {
  return (
    <section className="idea-bank" aria-label="Banco inteligente de ideias">
      <div className="idea-bank-heading">
        <div>
          <p className="eyebrow">Banco inteligente de ideias</p>
          <h3>Melhores oportunidades para o contexto atual</h3>
        </div>
        <span>{ideas.length} ideias</span>
      </div>
      <p className="idea-bank-disclaimer">
        Os indicadores são estimativas heurísticas para comparação estratégica, não
        previsões garantidas de resultado.
      </p>
      <div className="idea-bank-list">
        {ideas.map((idea, index) => (
          <article className="idea-card" key={`${idea.title}-${index}`}>
            <header>
              <span className="idea-rank">#{index + 1}</span>
              <span className="idea-category">{idea.category}</span>
              <span
                className="idea-stars"
                aria-label={`${idea.strategicPotential} de 5 estrelas`}
              >
                {"★".repeat(idea.strategicPotential)}
                {"☆".repeat(5 - idea.strategicPotential)}
              </span>
            </header>
            <h4>{idea.title}</h4>
            {idea.example && <p className="idea-example">Exemplo: {idea.example}</p>}
            <dl className="idea-context">
              <div>
                <dt>Objetivo</dt>
                <dd>{idea.objective}</dd>
              </div>
              <div>
                <dt>Persona</dt>
                <dd>{idea.persona}</dd>
              </div>
              <div>
                <dt>Emoção</dt>
                <dd>{idea.primaryEmotion}</dd>
              </div>
              <div>
                <dt>Formato</dt>
                <dd>{idea.bestFormat}</dd>
              </div>
            </dl>
            <div className="idea-copy-grid">
              <p>
                <strong>Gancho</strong>
                {idea.hook}
              </p>
              <p>
                <strong>CTA</strong>
                {idea.cta}
              </p>
            </div>
            <IdeaScores scores={idea.scores} />
            <p className="idea-justification">{idea.justification}</p>
            <button
              type="button"
              className="button primary idea-use-button"
              onClick={() => onUseIdea(idea)}
            >
              Usar esta ideia
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function IdeaScores({ scores }: { scores: MarketingContentIdea["scores"] }) {
  const metrics = [
    ["Conversão", scores.conversion],
    ["Compartilhamento", scores.sharing],
    ["Salvamento", scores.saving],
    ["Identificação", scores.identification],
    ["Potencial viral", scores.viral],
  ] as const;
  return (
    <div className="idea-score-grid">
      {metrics.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <progress value={value} max="100" aria-label={`${label}: ${value} de 100`} />
        </div>
      ))}
    </div>
  );
}

function StrategicAnalysis({
  analysis,
  brief,
}: {
  analysis: ContentBriefAnalysis;
  brief: ContentBrief;
}) {
  const metrics = [
    ["Clareza da persona", analysis.personaClarity],
    ["Clareza do objetivo", analysis.objectiveClarity],
    ["Força do gancho", analysis.hookStrength],
    ["Apelo emocional", analysis.emotionalAppeal],
    ["Clareza da mensagem", analysis.messageClarity],
    ["Potencial de engajamento", analysis.engagementPotential],
    ["Potencial de compartilhamento", analysis.sharingPotential],
    ["Potencial de conversão", analysis.conversionPotential],
  ] as const;
  const improvements = [
    ["Gancho", brief.hook, analysis.improvements.hook],
    ["Mensagem", brief.mainMessage, analysis.improvements.message],
    ["CTA", brief.cta, analysis.improvements.cta],
    ["Persona", brief.persona, analysis.improvements.persona],
    ["Dor", brief.mainPain, analysis.improvements.pain],
    ["Transformação", brief.transformation, analysis.improvements.transformation],
  ].filter(([, , improved]) => improved);
  const opportunities = [
    ["Objeção não respondida", analysis.unansweredObjection],
    ["Storytelling", analysis.storytellingOpportunity],
    ["Prova social", analysis.socialProofOpportunity],
    ["Uso de números", analysis.numbersOpportunity],
  ].filter(([, description]) => description);
  return (
    <section className="brief-score-panel" aria-label="Análise estratégica">
      <div className="brief-score-heading">
        <div>
          <p className="eyebrow">Análise estratégica da IA</p>
          <h3>Briefing refinado</h3>
          <p>Relatório integrado de estratégia, mensagem e conversão.</p>
        </div>
        <strong className={scoreClass(analysis.overallScore)}>
          {analysis.overallScore}/100
        </strong>
      </div>
      <div className="brief-score-list">
        {metrics.map(([label, metricScore]) => (
          <div className="brief-score-item" key={label}>
            <div>
              <span>{label}</span>
              <strong>{metricScore}</strong>
            </div>
            <progress max="100" value={metricScore} aria-label={label} />
          </div>
        ))}
      </div>
      <div className="brief-intelligence-grid">
        <article>
          <span>Formato recomendado</span>
          <strong>{analysis.bestFormat || "Não definido"}</strong>
          <p>{analysis.bestFormatReason}</p>
        </article>
        <article>
          <span>Objetivo real</span>
          <strong>{analysis.actualObjective || "Não definido"}</strong>
        </article>
        <article>
          <span>Potencial viral</span>
          <strong>{analysis.viralClassification || "Não classificado"}</strong>
          <p>{analysis.viralReason}</p>
        </article>
      </div>
      <div className="brief-diagnosis-grid">
        <AnalysisList title="Pontos fortes" items={analysis.diagnosis.strengths} />
        <AnalysisList title="Pontos fracos" items={analysis.diagnosis.weaknesses} />
        <AnalysisList title="O que está faltando" items={analysis.diagnosis.missing} />
        <AnalysisList title="O que está excelente" items={analysis.diagnosis.excellent} />
      </div>
      {improvements.length > 0 && (
        <div className="brief-improvements">
          <h4>Melhorias sugeridas</h4>
          {improvements.map(([label, current, improved]) => (
            <article key={label}>
              <span>{label} atual</span>
              <p>{current || "Não definido"}</p>
              <strong aria-hidden="true">↓</strong>
              <span>{label} melhorado</span>
              <p>{improved}</p>
            </article>
          ))}
        </div>
      )}
      <div className="brief-trigger-grid">
        <AnalysisList title="Gatilhos naturais" items={analysis.naturalTriggers} />
        <AnalysisList
          title="Gatilhos que podem ser adicionados"
          items={analysis.suggestedTriggers}
        />
      </div>
      {opportunities.length > 0 && (
        <div className="brief-opportunities">
          <h4>Oportunidades estratégicas</h4>
          {opportunities.map(([label, description]) => (
            <p key={label}>
              <strong>{label}:</strong> {description}
            </p>
          ))}
        </div>
      )}
      {analysis.executiveSummary && (
        <blockquote className="brief-executive-summary">
          <strong>Resumo executivo</strong>
          <p>{analysis.executiveSummary}</p>
        </blockquote>
      )}
    </section>
  );
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function BriefCompletionScore({ score }: { score: ContentBriefScore }) {
  return (
    <section className="brief-score-panel" aria-label="Completude do briefing">
      <div className="brief-score-heading">
        <div>
          <p className="eyebrow">Completude do contexto</p>
          <h3>Pronto para análise</h3>
          <p>Use Gerar Briefing ou Refinar Estratégia para obter o score estratégico.</p>
        </div>
        <strong className={scoreClass(score.overall)}>{score.overall}/100</strong>
      </div>
      <div className="brief-score-list">
        {score.criteria.map((criterion) => (
          <div className="brief-score-item" key={criterion.label}>
            <div>
              <span>{criterion.label}</span>
              <strong>{criterion.score}</strong>
            </div>
            <progress max="100" value={criterion.score} aria-label={criterion.label} />
            <p>{criterion.suggestion}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BriefInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function BriefTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function BriefList({
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
        value={value.join("\n")}
        rows={3}
        placeholder="Um item por linha"
        onChange={(event) => onChange(event.target.value.split(/\r?\n/))}
      />
    </label>
  );
}

function scoreClass(score: number) {
  if (score >= 80) return "score-good";
  if (score >= 50) return "score-medium";
  return "score-low";
}
