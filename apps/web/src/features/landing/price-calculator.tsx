"use client";

import {
  finalPriceWithFees,
  laborCost,
  profitPerUnit,
  suggestedPrice,
  totalCost,
} from "@lucro-caseiro/contracts";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { playStoreUrl, pwaUrl } from "./site-constants";
import { createCalculatorTracking } from "./analytics-events";
import { trackLandingEvent } from "./site-analytics";
import styles from "./price-calculator.module.css";
import { parseDecimalInput } from "./calculator-input";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const EXAMPLE = {
  batchUnits: "1",
  materials: "12.50",
  packaging: "3",
  minutes: "90",
  hourlyRate: "20",
  monthlyFixed: "400",
  monthlyUnits: "100",
  markup: "50",
  fees: "0",
};
type Values = typeof EXAMPLE;
type FieldKey = keyof Values;
const LIMITS: Record<FieldKey, number> = {
  batchUnits: 1_000_000,
  materials: 1_000_000,
  packaging: 1_000_000,
  minutes: 10_000,
  hourlyRate: 1_000_000,
  monthlyFixed: 1_000_000,
  monthlyUnits: 1_000_000,
  markup: 1_000,
  fees: 95,
};

function NumberField({
  label,
  help,
  value,
  onChange,
  unit = "R$",
  error,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.inputWrap} data-invalid={!!error}>
        {unit === "R$" && <span aria-hidden="true">R$</span>}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder="0"
          aria-invalid={!!error}
          aria-describedby={`${id}-help`}
          onChange={(event) => onChange(event.target.value)}
        />
        {unit !== "R$" && <span aria-hidden="true">{unit}</span>}
      </div>
      <p id={`${id}-help`} className={error ? styles.fieldError : undefined}>
        {error || help}
      </p>
    </div>
  );
}

export function PriceCalculator() {
  const [values, setValues] = useState<Values>(EXAMPLE);
  const [edited, setEdited] = useState(false);
  const [usingExample, setUsingExample] = useState(true);
  const [batch, setBatch] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [tracking] = useState(() => createCalculatorTracking(trackLandingEvent));
  let workspaceTitle = usingExample ? "Exemplo preenchido" : "Seus valores";
  if (usingExample && edited) workspaceTitle = "Exemplo em edição";
  let workspaceHelp = edited
    ? "Ajuste os valores quando precisar."
    : "Troque os valores pelos seus.";
  if (usingExample && edited)
    workspaceHelp = "Os campos não alterados ainda usam valores do exemplo.";
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const key of Object.keys(values) as FieldKey[]) {
    if (key === "batchUnits" && !batch) continue;
    const value = parseDecimalInput(values[key]);
    if (!Number.isFinite(value) || value < 0 || value > LIMITS[key]) {
      errors[key] = `Use um valor entre 0 e ${LIMITS[key].toLocaleString("pt-BR")}.`;
    }
  }
  if (
    batch &&
    (!Number.isInteger(parseDecimalInput(values.batchUnits)) ||
      parseDecimalInput(values.batchUnits) < 1)
  ) {
    errors.batchUnits =
      "Informe quantas unidades o lote rende: um número inteiro a partir de 1.";
  }
  if (
    parseDecimalInput(values.monthlyFixed) > 0 &&
    parseDecimalInput(values.monthlyUnits) <= 0
  ) {
    errors.monthlyUnits = "Informe a quantidade para dividir os gastos do mês.";
  }
  const hasErrors = Object.keys(errors).length > 0;
  const number = (key: FieldKey) => (errors[key] ? 0 : parseDecimalInput(values[key]));
  const divisor = batch && number("batchUnits") > 0 ? number("batchUnits") : 1;
  const materials = number("materials") / divisor;
  const packaging = number("packaging") / divisor;
  const labor = laborCost(number("minutes"), number("hourlyRate")) / divisor;
  const missingHourlyRate = number("minutes") > 0 && values.hourlyRate.trim() === "";
  const unpaidTime =
    number("minutes") > 0 && !missingHourlyRate && number("hourlyRate") === 0;
  const fixed =
    number("monthlyUnits") > 0 ? number("monthlyFixed") / number("monthlyUnits") : 0;
  const cost = totalCost(materials, packaging, labor, fixed);
  const basePrice = suggestedPrice(cost, number("markup"));
  const { finalPrice, feesAmount } = finalPriceWithFees(basePrice, number("fees"));
  const profit = profitPerUnit(basePrice, cost);
  const ready = !hasErrors && cost > 0;
  useEffect(() => {
    const timer = window.setTimeout(() => tracking.result(ready), 800);
    return () => window.clearTimeout(timer);
  }, [ready, values, tracking]);
  let resultNote = "Para cobrir os custos e o lucro que você definiu.";
  if (missingHourlyRate)
    resultNote =
      "Resultado parcial: falta informar o valor da sua hora para incluir seu trabalho.";
  if (unpaidTime)
    resultNote =
      "Você definiu sua hora como R$ 0. Seu trabalho não está remunerado nesta conta.";
  if (cost <= 0) resultNote = "Preencha pelo menos um custo para começar.";
  if (hasErrors) resultNote = "Confira os campos indicados para ver o resultado.";
  let resultTip = "A sobra considera apenas os custos e as taxas informadas.";
  if (labor > 0)
    resultTip =
      "Seu trabalho já está incluído nos custos. A sobra vem depois dos custos e das taxas informadas.";
  if (unpaidTime)
    resultTip = "A hora foi definida como zero. A sobra exibida não remunera seu tempo.";
  if (missingHourlyRate)
    resultTip =
      "Seu trabalho ainda não está incluído. Informe o valor da hora para completar a conta.";
  const money = (value: number) => (ready ? currency.format(value) : "—");

  function field(key: FieldKey, label: string, help: string, unit?: string) {
    return (
      <NumberField
        label={label}
        help={help}
        value={values[key]}
        unit={unit}
        error={errors[key]}
        onChange={(value) => {
          tracking.edit();
          setValues((previous) => ({ ...previous, [key]: value }));
          setEdited(true);
        }}
      />
    );
  }
  function reset(clear: boolean) {
    tracking.example();
    setValues(
      clear
        ? (Object.fromEntries(
            Object.keys(EXAMPLE).map((key) => [key, key === "batchUnits" ? "1" : ""]),
          ) as Values)
        : { ...EXAMPLE },
    );
    setEdited(clear);
    setUsingExample(!clear);
    setAnnouncement(
      clear ? "Campos limpos. Preencha seus custos." : "Exemplo carregado.",
    );
  }

  return (
    <>
      <div className={styles.workspaceBar}>
        <div>
          <span className={styles.statusDot} />
          <strong>{workspaceTitle}</strong>
          <span>{workspaceHelp}</span>
        </div>
        <button type="button" data-pointer-ripple onClick={() => reset(!edited)}>
          <RotateCcw size={17} aria-hidden="true" />
          {edited ? "Usar exemplo" : "Limpar campos"}
        </button>
      </div>
      <p className={styles.srOnly} role="status">
        {announcement}
      </p>
      <a href="#resultado" className={styles.resultJump}>
        Ir para o resultado <ArrowDown size={18} aria-hidden="true" />
      </a>
      <div className={styles.calculatorGrid}>
        <section className={styles.formPanel} aria-label="Valores para calcular o preço">
          <div className={styles.formIntro}>
            <h2>O que entra na sua conta?</h2>
            <p>
              Use os custos de uma peça, um item de revenda ou um atendimento. Se produz
              em lote, informe os totais e a quantidade; nós dividimos para você. Use
              vírgula ou ponto nos centavos, sem separador de milhares.
            </p>
          </div>
          <fieldset className={styles.fieldGroup}>
            <legend>Como você quer calcular?</legend>
            <div className={styles.calculationMode}>
              <label>
                <input
                  type="radio"
                  name="calculation-mode"
                  checked={!batch}
                  onChange={() => setBatch(false)}
                />
                Uma unidade ou serviço
              </label>
              <label>
                <input
                  type="radio"
                  name="calculation-mode"
                  checked={batch}
                  onChange={() => setBatch(true)}
                />
                Um lote de produção
              </label>
            </div>
            {batch &&
              field(
                "batchUnits",
                "Quantidade produzida no lote",
                "Quantas unidades prontas para vender? Exemplo: 30 brigadeiros.",
                "un.",
              )}
          </fieldset>
          <fieldset className={styles.fieldGroup}>
            <legend>Produto e embalagem</legend>
            <div className={styles.fieldsGrid}>
              {field(
                "materials",
                batch
                  ? "Materiais ou ingredientes do lote"
                  : "Materiais ou preço de compra",
                batch
                  ? "Custo total dos ingredientes ou materiais usados neste lote."
                  : "Quanto custa uma unidade: ingredientes, materiais ou o item que você compra para revender.",
              )}
              {field(
                "packaging",
                batch ? "Embalagens do lote" : "Embalagem e acabamento",
                batch
                  ? "Total gasto com as embalagens deste lote, não o preço de uma só."
                  : "Caixa, etiqueta, laço… Se não usa, deixe 0.",
              )}
            </div>
          </fieldset>
          <fieldset className={styles.fieldGroup}>
            <legend>Seu tempo também custa</legend>
            <div className={styles.fieldsGrid}>
              {field(
                "minutes",
                batch ? "Tempo total do lote" : "Tempo por unidade ou atendimento",
                batch
                  ? "Minutos de trabalho para produzir todo o lote."
                  : "Minutos de trabalho nesta unidade. Se não há trabalho a incluir, use 0.",
                "min",
              )}
              {field(
                "hourlyRate",
                "Valor da sua hora",
                "Quanto você quer receber por hora trabalhada.",
              )}
            </div>
            <p className={styles.groupInsight}>
              Seu trabalho nesta unidade <strong>{currency.format(labor)}</strong>
            </p>
          </fieldset>
          <fieldset className={styles.fieldGroup}>
            <legend>Uma parte dos gastos do mês</legend>
            <div className={styles.fieldsGrid}>
              {field(
                "monthlyFixed",
                "Gastos fixos mensais",
                "Parcela do negócio: aluguel, energia, internet…",
              )}
              {field(
                "monthlyUnits",
                "Unidades por mês",
                "Quantidade que você espera produzir ou atender.",
                "un.",
              )}
            </div>
            <p className={styles.groupInsight}>
              Gastos fixos por unidade{" "}
              <strong>{hasErrors ? "—" : currency.format(fixed)}</strong>
            </p>
          </fieldset>
          <fieldset className={`${styles.fieldGroup} ${styles.returnGroup}`}>
            <legend>Quanto você quer que sobre?</legend>
            <div className={styles.fieldsGrid}>
              {field(
                "markup",
                "Lucro sobre o custo",
                "Com 50%, cada R$ 10 de custo ganha R$ 5 de lucro.",
                "%",
              )}
              {field(
                "fees",
                "Taxas da venda",
                "Some cartão, comissão ou app de entrega. Sem taxa? Use 0.",
                "%",
              )}
            </div>
          </fieldset>
          <p className={styles.privacyNote}>
            <ShieldCheck size={20} aria-hidden="true" />
            Os valores da simulação ficam só nesta página. Eles não são enviados nem
            salvos.
          </p>
          <a className={styles.resultJump} href="#resultado">
            Ver meu preço <ArrowDown size={18} aria-hidden="true" />
          </a>
        </section>
        <aside
          id="resultado"
          className={styles.resultColumn}
          aria-labelledby="result-title"
          tabIndex={-1}
        >
          <div className={styles.receipt}>
            <div className={styles.priceHeading}>
              <div className={styles.receiptEyebrow}>
                <span>Seu preço, explicado</span>
                <span>Por unidade</span>
              </div>
              <h2 id="result-title">
                {missingHourlyRate
                  ? "Preço parcial por unidade"
                  : "Preço de venda sugerido"}
              </h2>
              <p className={styles.resultPrice}>{money(finalPrice)}</p>
              <p className={styles.priceNote}>{resultNote}</p>
            </div>
            <div className={styles.receiptBody}>
              <h3>Para onde vai cada real</h3>
              <dl className={styles.breakdown}>
                <div>
                  <dt>Materiais ou ingredientes</dt>
                  <dd>{money(materials)}</dd>
                </div>
                <div>
                  <dt>Embalagem e acabamento</dt>
                  <dd>{money(packaging)}</dd>
                </div>
                <div>
                  <dt>Seu trabalho</dt>
                  <dd>{money(labor)}</dd>
                </div>
                <div>
                  <dt>Parte dos gastos fixos</dt>
                  <dd>{money(fixed)}</dd>
                </div>
                <div className={styles.total}>
                  <dt>Custo por unidade</dt>
                  <dd>{money(cost)}</dd>
                </div>
                <div>
                  <dt>
                    Taxas da venda {number("fees") > 0 ? `(${number("fees")}%)` : ""}
                  </dt>
                  <dd>{money(feesAmount)}</dd>
                </div>
              </dl>
              <div className={styles.profitHighlight}>
                <div>
                  <span>Sobra por unidade</span>
                  <strong>{money(profit)}</strong>
                </div>
                <p>
                  {missingHourlyRate
                    ? "Sobra parcial: ainda falta incluir o custo do seu trabalho."
                    : "Seu lucro depois dos custos e das taxas informadas."}
                </p>
              </div>
              <p className={styles.resultTip}>
                <Check size={18} aria-hidden="true" />
                {resultTip}
              </p>
            </div>
          </div>
          <div className={styles.resultCta}>
            <p>Quer guardar seus cálculos e organizar as vendas?</p>
            <p id="calculator-continuity">
              Esta simulação fica só nesta página. No app, você precisará preencher os
              valores novamente para salvar o cálculo.
            </p>
            <a
              href={pwaUrl("pwa_calculator_result")}
              data-pointer-ripple
              data-analytics="pwa_calculator_result"
              aria-describedby="calculator-continuity"
            >
              Começar grátis no navegador <ArrowRight size={19} aria-hidden="true" />
            </a>
            <a
              href={playStoreUrl("play_store_calculator_result")}
              data-analytics="play_store_calculator_result"
              aria-describedby="calculator-continuity"
            >
              Baixar no Google Play <ArrowRight size={19} aria-hidden="true" />
            </a>
            <small>Plano gratuito no navegador e no Android. Sem cartão.</small>
          </div>
          <p className={styles.srOnly} role="status" aria-atomic="true">
            {ready
              ? `Preço sugerido: ${currency.format(finalPrice)}. Sobra por unidade: ${currency.format(profit)}.`
              : "Preencha ou corrija os custos para calcular seu preço."}
          </p>
        </aside>
      </div>
      <section className={styles.explainer} aria-labelledby="understand-title">
        <div>
          <p className={styles.eyebrow}>Entenda a conta</p>
          <h2 id="understand-title">
            Preço, custo e lucro.
            <br />
            Cada um no seu lugar.
          </h2>
          <p>
            Esta é uma estimativa com os valores que você informou. Inclua os gastos e
            tributos que se aplicam ao seu negócio.
          </p>
        </div>
        <div className={styles.questions}>
          <details>
            <summary>
              Como o preço é calculado?
              <ChevronDown size={20} aria-hidden="true" />
            </summary>
            <p>
              Somamos materiais, embalagem, seu trabalho e a parte dos gastos fixos.
              Depois acrescentamos o lucro sobre esse custo. Se houver taxas, dividimos o
              valor por (1 − taxa ÷ 100), pois elas são cobradas sobre o preço final.
            </p>
          </details>
          <details>
            <summary>
              50% sobre o custo é 50% da venda?
              <ChevronDown size={20} aria-hidden="true" />
            </summary>
            <p>
              São contas diferentes. Com custo de R$ 10 e lucro de 50% sobre o custo, o
              preço fica R$ 15, sem taxas. Os R$ 5 de lucro representam 33,3% do preço de
              venda. Aqui você escolhe o percentual sobre o custo.
            </p>
          </details>
          <details>
            <summary>
              E se eu produzir várias unidades de uma vez?
              <ChevronDown size={20} aria-hidden="true" />
            </summary>
            <p>
              Divida os materiais, a embalagem e o tempo do lote pela quantidade
              produzida. Por exemplo: se 10 peças levam 60 minutos, informe 6 minutos por
              unidade. Os gastos fixos continuam sendo os do mês inteiro.
            </p>
          </details>
        </div>
      </section>
      <div className={styles.nextStep}>
        <div>
          <h2>A conta é só o começo.</h2>
          <p>Conheça os produtos, as vendas e o catálogo do Lucro Caseiro.</p>
        </div>
        <a href="/#recursos" data-analytics="calculator_view_features">
          Ver recursos do app <ArrowRight size={20} aria-hidden="true" />
        </a>
      </div>
    </>
  );
}
