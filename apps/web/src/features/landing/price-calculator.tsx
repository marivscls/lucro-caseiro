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
import { useId, useState } from "react";
import { PLAY_STORE_URL } from "./site-constants";
import styles from "./price-calculator.module.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const EXAMPLE = {
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
  max,
  error,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  max: number;
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
          type="number"
          inputMode="decimal"
          min="0"
          max={max}
          step="any"
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
  const [announcement, setAnnouncement] = useState("");
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const key of Object.keys(values) as FieldKey[]) {
    const value = Number(values[key]);
    if (!Number.isFinite(value) || value < 0 || value > LIMITS[key]) {
      errors[key] = `Use um valor entre 0 e ${LIMITS[key].toLocaleString("pt-BR")}.`;
    }
  }
  if (Number(values.monthlyFixed) > 0 && Number(values.monthlyUnits) <= 0) {
    errors.monthlyUnits = "Informe a quantidade para dividir os gastos do mês.";
  }
  const hasErrors = Object.keys(errors).length > 0;
  const number = (key: FieldKey) => (errors[key] ? 0 : Number(values[key]));
  const labor = laborCost(number("minutes"), number("hourlyRate"));
  const fixed =
    number("monthlyUnits") > 0 ? number("monthlyFixed") / number("monthlyUnits") : 0;
  const cost = totalCost(number("materials"), number("packaging"), labor, fixed);
  const basePrice = suggestedPrice(cost, number("markup"));
  const { finalPrice, feesAmount } = finalPriceWithFees(basePrice, number("fees"));
  const profit = profitPerUnit(basePrice, cost);
  const ready = !hasErrors && cost > 0;
  let resultNote = "Para cobrir os custos e o lucro que você definiu.";
  if (cost <= 0) resultNote = "Preencha pelo menos um custo para começar.";
  if (hasErrors) resultNote = "Confira os campos indicados para ver o resultado.";
  const money = (value: number) => (ready ? currency.format(value) : "—");

  function field(key: FieldKey, label: string, help: string, unit?: string) {
    return (
      <NumberField
        label={label}
        help={help}
        value={values[key]}
        unit={unit}
        max={LIMITS[key]}
        error={errors[key]}
        onChange={(value) => {
          setValues((previous) => ({ ...previous, [key]: value }));
          setEdited(true);
        }}
      />
    );
  }
  function reset(clear: boolean) {
    setValues(
      clear
        ? (Object.fromEntries(Object.keys(EXAMPLE).map((key) => [key, ""])) as Values)
        : { ...EXAMPLE },
    );
    setEdited(clear);
    setAnnouncement(
      clear ? "Campos limpos. Preencha seus custos." : "Exemplo carregado.",
    );
  }

  return (
    <>
      <div className={styles.workspaceBar}>
        <div>
          <span className={styles.statusDot} />
          <strong>{edited ? "Sua simulação" : "Exemplo preenchido"}</strong>
          <span>
            {edited
              ? "Ajuste os valores quando precisar."
              : "Troque os valores pelos seus."}
          </span>
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
              Considere uma unidade do que você vende: uma peça, uma caixa ou um serviço.
            </p>
          </div>
          <fieldset className={styles.fieldGroup}>
            <legend>Produto e embalagem</legend>
            <div className={styles.fieldsGrid}>
              {field(
                "materials",
                "Materiais ou ingredientes",
                "Custo do que você usa em uma unidade.",
              )}
              {field(
                "packaging",
                "Embalagem e acabamento",
                "Caixa, etiqueta, laço… Se não usa, deixe 0.",
              )}
            </div>
          </fieldset>
          <fieldset className={styles.fieldGroup}>
            <legend>Seu tempo também custa</legend>
            <div className={styles.fieldsGrid}>
              {field(
                "minutes",
                "Tempo por unidade",
                "Se faz em lote, divida o tempo pelas unidades.",
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
            Os valores ficam só nesta página. Nada é enviado ou salvo.
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
              <h2 id="result-title">Preço de venda sugerido</h2>
              <p className={styles.resultPrice}>{money(finalPrice)}</p>
              <p className={styles.priceNote}>{resultNote}</p>
            </div>
            <div className={styles.receiptBody}>
              <h3>Para onde vai cada real</h3>
              <dl className={styles.breakdown}>
                <div>
                  <dt>Materiais ou ingredientes</dt>
                  <dd>{money(number("materials"))}</dd>
                </div>
                <div>
                  <dt>Embalagem e acabamento</dt>
                  <dd>{money(number("packaging"))}</dd>
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
                <p>Seu lucro depois dos custos e das taxas informadas.</p>
              </div>
              <p className={styles.resultTip}>
                <Check size={18} aria-hidden="true" />
                {number("fees") > 0
                  ? "O preço já inclui as taxas para manter o lucro que você escolheu."
                  : "Seu tempo já está pago nos custos. O lucro é o que sobra além dele."}
              </p>
            </div>
          </div>
          <div className={styles.resultCta}>
            <p>Leve essa organização para o dia a dia.</p>
            <a
              href={PLAY_STORE_URL}
              data-pointer-ripple
              data-analytics="play_store_calculator_result"
            >
              Baixar o Lucro Caseiro <ArrowRight size={19} aria-hidden="true" />
            </a>
            <small>Disponível para Android · Plano gratuito</small>
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
        <a href="/landing#recursos" data-analytics="calculator_view_features">
          Ver recursos do app <ArrowRight size={20} aria-hidden="true" />
        </a>
      </div>
    </>
  );
}
