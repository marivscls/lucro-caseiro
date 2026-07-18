"use client";

import {
  finalPriceWithFees,
  laborCost,
  profitPerUnit,
  suggestedPrice,
  totalCost,
} from "@lucro-caseiro/contracts";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  CircleDollarSign,
  Copy,
  FileText,
  Info,
  MessageCircle,
  PackageCheck,
  Store,
} from "lucide-react";
import { useState } from "react";

import { PLAY_STORE_URL } from "./site-constants";
import styles from "./price-calculator.module.css";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type FeatureKey = "whatsapp" | "quote" | "catalog" | "reports";
type MessageKey = "confirmed" | "ready" | "payment" | "birthday";

const FEATURE_OPTIONS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    detail: "Mensagens prontas",
    icon: MessageCircle,
  },
  { key: "quote", label: "Orçamentos", detail: "PDF profissional", icon: FileText },
  { key: "catalog", label: "Catálogo", detail: "Sua vitrine online", icon: Store },
  { key: "reports", label: "Relatórios", detail: "Visão do negócio", icon: BarChart3 },
] as const;

const MESSAGE_OPTIONS: ReadonlyArray<{ key: MessageKey; label: string }> = [
  { key: "confirmed", label: "Confirmar encomenda" },
  { key: "ready", label: "Avisar que está pronto" },
  { key: "payment", label: "Lembrar pagamento" },
  { key: "birthday", label: "Parabenizar cliente · Profissional" },
];

function firstName(name: string): string {
  return name.trim().split(" ")[0] || "cliente";
}

function readyMessage(type: MessageKey, client: string, product: string): string {
  const name = firstName(client);
  if (type === "ready") {
    return `Oi, ${name}! Seu pedido de ${product} está pronto 😊 Quando puder buscar ou combinar a entrega, me avisa.`;
  }
  if (type === "payment") {
    return `Oi, ${name}! Passando para lembrar do pagamento do pedido de ${product}. Se já pagou, pode desconsiderar esta mensagem 😊`;
  }
  if (type === "birthday") {
    return `Oi, ${name}! 🎉 Passando para desejar um feliz aniversário! Muitas felicidades e um novo ciclo cheio de coisas boas. 🥳`;
  }
  return `Oi, ${name}! Confirmando sua encomenda de ${product}. Está tudo anotado por aqui e eu te aviso assim que ficar pronto 😊`;
}

function safeNumber(value: string, maximum = 1_000_000): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number, 0), maximum);
}

type MoneyFieldProps = {
  readonly label: string;
  readonly help: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly suffix?: string;
  readonly max?: number;
};

function NumberField({
  label,
  help,
  value,
  onChange,
  suffix = "R$",
  max,
}: MoneyFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <small>{help}</small>
      <div className={styles.inputWrap}>
        <span aria-hidden="true">{suffix}</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max={max}
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function WhatsAppDemo() {
  const [messageType, setMessageType] = useState<MessageKey>("confirmed");
  const [client, setClient] = useState("Mariana");
  const [product, setProduct] = useState("bolo de aniversário");
  const [copied, setCopied] = useState(false);
  const message = readyMessage(messageType, client, product);
  const isProfessionalMessage = messageType === "birthday";

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.demoLayout}>
      <div className={styles.demoControls}>
        <span
          className={
            isProfessionalMessage ? styles.professionalBadge : styles.featureBadge
          }
        >
          {isProfessionalMessage ? "Recurso Profissional" : "Incluído no aplicativo"}
        </span>
        <h3>Responda clientes sem escrever tudo de novo</h3>
        <p>
          Escolha o momento da venda e o Lucro Caseiro monta uma mensagem com os dados do
          pedido.
        </p>
        <label className={styles.demoField}>
          <span>Momento da conversa</span>
          <select
            value={messageType}
            onChange={(event) => {
              setMessageType(event.target.value as MessageKey);
              setCopied(false);
            }}
          >
            {MESSAGE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.demoFieldsRow}>
          <label className={styles.demoField}>
            <span>Cliente</span>
            <input
              value={client}
              onChange={(event) => {
                setClient(event.target.value);
                setCopied(false);
              }}
            />
          </label>
          <label className={styles.demoField}>
            <span>Pedido</span>
            <input
              value={product}
              onChange={(event) => {
                setProduct(event.target.value);
                setCopied(false);
              }}
            />
          </label>
        </div>
      </div>

      <div className={styles.phonePreview}>
        <div className={styles.phoneTopbar}>
          <span className={styles.avatar}>M</span>
          <span>
            <strong>{client || "Cliente"}</strong>
            <small>online</small>
          </span>
          <MessageCircle aria-hidden="true" size={20} />
        </div>
        <div className={styles.chatArea}>
          <div className={styles.messageBubble}>{message}</div>
          <small>10:42 ✓✓</small>
        </div>
        <button
          className={styles.copyButton}
          type="button"
          onClick={() => void copyMessage()}
        >
          {copied ? (
            <Check aria-hidden="true" size={18} />
          ) : (
            <Copy aria-hidden="true" size={18} />
          )}
          {copied ? "Mensagem copiada" : "Copiar mensagem"}
        </button>
      </div>
    </div>
  );
}

type DemoValues = {
  readonly client: string;
  readonly product: string;
  readonly price: number;
  readonly monthlyRevenue: number;
  readonly monthlyProfit: number;
};

function QuoteDemo({ client, product, price }: DemoValues) {
  return (
    <div className={styles.demoLayout}>
      <div className={styles.demoControls}>
        <span className={styles.professionalBadge}>Recurso Profissional</span>
        <h3>Orçamento bonito, pronto para enviar</h3>
        <p>
          Monte a proposta com os dados do cliente e compartilhe um PDF organizado pelo
          WhatsApp.
        </p>
        <ul className={styles.benefitList}>
          <li>
            <Check aria-hidden="true" size={17} /> Totais calculados automaticamente
          </li>
          <li>
            <Check aria-hidden="true" size={17} /> Dados e identidade do seu negócio
          </li>
          <li>
            <Check aria-hidden="true" size={17} /> Vira encomenda depois da aprovação
          </li>
        </ul>
      </div>
      <div className={styles.documentPreview}>
        <div className={styles.documentBrand}>Lucro da Mariana</div>
        <small>ORÇAMENTO Nº 024</small>
        <h4>{client}</h4>
        <div className={styles.documentLine}>
          <span>{product}</span>
          <strong>{currency.format(price)}</strong>
        </div>
        <div className={styles.documentTotal}>
          <span>Total</span>
          <strong>{currency.format(price)}</strong>
        </div>
        <p>Validade: 7 dias · Produção após confirmação</p>
        <span className={styles.pdfChip}>
          <FileText aria-hidden="true" size={16} /> PDF pronto
        </span>
      </div>
    </div>
  );
}

function CatalogDemo({ product, price }: DemoValues) {
  const [orderStarted, setOrderStarted] = useState(false);

  return (
    <div className={styles.demoLayout}>
      <div className={styles.demoControls}>
        <span className={styles.professionalBadge}>Recurso Profissional</span>
        <h3>Uma vitrine que recebe pedidos por você</h3>
        <p>
          Compartilhe um link com sua marca, seus produtos e um botão direto para o
          WhatsApp.
        </p>
        <ul className={styles.benefitList}>
          <li>
            <Check aria-hidden="true" size={17} /> Catálogo completo e personalizado
          </li>
          <li>
            <Check aria-hidden="true" size={17} /> Várias fotos por produto
          </li>
          <li>
            <Check aria-hidden="true" size={17} /> Pedido iniciado no WhatsApp
          </li>
        </ul>
      </div>
      <div className={styles.catalogPreview}>
        <div className={styles.catalogCover}>
          <span>Feito com carinho</span>
          <strong>Doces da Mariana</strong>
        </div>
        <div className={styles.catalogProduct}>
          <div className={styles.productIllustration}>
            <PackageCheck aria-hidden="true" size={48} />
          </div>
          <span>
            <small>Mais pedido</small>
            <strong>{product}</strong>
            <b>{currency.format(price)}</b>
          </span>
        </div>
        <button type="button" onClick={() => setOrderStarted(true)}>
          {orderStarted ? (
            <Check aria-hidden="true" size={18} />
          ) : (
            <MessageCircle aria-hidden="true" size={18} />
          )}
          {orderStarted ? "Pedido iniciado" : "Pedir no WhatsApp"}
        </button>
        <span className={styles.catalogFeedback} aria-live="polite">
          {orderStarted ? "A conversa abriria com o produto já identificado." : ""}
        </span>
      </div>
    </div>
  );
}

function ReportsDemo({ monthlyRevenue, monthlyProfit }: DemoValues) {
  return (
    <div className={styles.demoLayout}>
      <div className={styles.demoControls}>
        <span className={styles.professionalBadge}>Recurso Profissional</span>
        <h3>Entenda o resultado sem montar planilha</h3>
        <p>
          Veja faturamento, lucro e evolução do negócio com os números organizados em um
          só lugar.
        </p>
        <ul className={styles.benefitList}>
          <li>
            <Check aria-hidden="true" size={17} /> Relatórios e gráficos avançados
          </li>
          <li>
            <Check aria-hidden="true" size={17} /> Histórico financeiro completo
          </li>
          <li>
            <Check aria-hidden="true" size={17} /> Exportação em PDF e planilha
          </li>
        </ul>
      </div>
      <div className={styles.reportPreview}>
        <span className={styles.reportPeriod}>Este mês</span>
        <div className={styles.reportMetrics}>
          <span>
            <small>Faturamento</small>
            <strong>{currency.format(monthlyRevenue)}</strong>
          </span>
          <span>
            <small>Lucro estimado</small>
            <strong>{currency.format(monthlyProfit)}</strong>
          </span>
        </div>
        <div
          className={styles.chart}
          aria-label="Gráfico ilustrativo de crescimento mensal"
        >
          {[38, 54, 46, 72, 64, 88].map((height, index) => (
            <span key={height} style={{ height: `${height}%` }}>
              <i>{index + 1}</i>
            </span>
          ))}
        </div>
        <div className={styles.chartLegend}>
          <span /> Vendas dos últimos 6 meses
        </div>
      </div>
    </div>
  );
}

export function PriceCalculator() {
  const [activeView, setActiveView] = useState<"calculator" | "features">("calculator");
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("whatsapp");
  const [ingredients, setIngredients] = useState("12.50");
  const [packaging, setPackaging] = useState("3");
  const [minutes, setMinutes] = useState("90");
  const [hourlyRate, setHourlyRate] = useState("20");
  const [monthlyFixed, setMonthlyFixed] = useState("400");
  const [monthlyUnits, setMonthlyUnits] = useState("100");
  const [margin, setMargin] = useState("50");
  const [fees, setFees] = useState("0");

  const ingredientValue = safeNumber(ingredients);
  const packagingValue = safeNumber(packaging);
  const laborValue = laborCost(safeNumber(minutes, 10_000), safeNumber(hourlyRate));
  const unitsValue = safeNumber(monthlyUnits, 1_000_000);
  const fixedShare = unitsValue > 0 ? safeNumber(monthlyFixed) / unitsValue : 0;
  const cost = totalCost(ingredientValue, packagingValue, laborValue, fixedShare);
  const marginValue = safeNumber(margin, 1_000);
  const basePrice = suggestedPrice(cost, marginValue);
  const feeValue = safeNumber(fees, 95);
  const { finalPrice, feesAmount } = finalPriceWithFees(basePrice, feeValue);
  const profit = profitPerUnit(basePrice, cost);

  const demoValues: DemoValues = {
    client: "Mariana Alves",
    product: "Bolo de aniversário",
    price: finalPrice,
    monthlyRevenue: finalPrice * unitsValue,
    monthlyProfit: profit * unitsValue,
  };

  let featureDemo = <WhatsAppDemo />;
  if (activeFeature === "quote") featureDemo = <QuoteDemo {...demoValues} />;
  if (activeFeature === "catalog") featureDemo = <CatalogDemo {...demoValues} />;
  if (activeFeature === "reports") featureDemo = <ReportsDemo {...demoValues} />;

  return (
    <div className={styles.experience}>
      <div className={styles.viewTabs} role="tablist" aria-label="Simulações disponíveis">
        <button
          id="calculator-tab"
          type="button"
          role="tab"
          aria-controls="calculator-panel"
          aria-selected={activeView === "calculator"}
          onClick={() => setActiveView("calculator")}
        >
          <Calculator aria-hidden="true" size={18} /> Calcular meu preço
        </button>
        <button
          id="features-tab"
          type="button"
          role="tab"
          aria-controls="features-panel"
          aria-selected={activeView === "features"}
          onClick={() => setActiveView("features")}
        >
          <MessageCircle aria-hidden="true" size={18} /> Conhecer recursos do app
        </button>
      </div>

      {activeView === "calculator" ? (
        <div
          id="calculator-panel"
          className={styles.calculatorGrid}
          role="tabpanel"
          aria-labelledby="calculator-tab"
        >
          <section className={styles.formPanel}>
            <div className={styles.panelHeading}>
              <div>
                <Calculator aria-hidden="true" size={24} />
              </div>
              <span>
                <strong>Seus custos</strong>Preencha com os valores de uma unidade.
              </span>
            </div>
            <div className={styles.fieldsGrid}>
              <NumberField
                label="Ingredientes ou materiais"
                help="Tudo usado para produzir uma unidade."
                value={ingredients}
                onChange={setIngredients}
              />
              <NumberField
                label="Embalagem"
                help="Caixa, saco, etiqueta e acabamento."
                value={packaging}
                onChange={setPackaging}
              />
              <NumberField
                label="Tempo de produção"
                help="Minutos gastos para produzir uma unidade."
                value={minutes}
                onChange={setMinutes}
                suffix="min"
                max={10_000}
              />
              <NumberField
                label="Valor da sua hora"
                help="Quanto vale uma hora do seu trabalho."
                value={hourlyRate}
                onChange={setHourlyRate}
              />
              <NumberField
                label="Custos fixos mensais"
                help="Energia, gás, aluguel, internet e outros."
                value={monthlyFixed}
                onChange={setMonthlyFixed}
              />
              <NumberField
                label="Produção mensal"
                help="Quantas unidades você espera produzir no mês."
                value={monthlyUnits}
                onChange={setMonthlyUnits}
                suffix="un."
                max={1_000_000}
              />
              <NumberField
                label="Margem desejada"
                help="Percentual de lucro aplicado sobre o custo."
                value={margin}
                onChange={setMargin}
                suffix="%"
                max={1_000}
              />
              <NumberField
                label="Taxas sobre a venda"
                help="Cartão, aplicativo ou comissão. Opcional."
                value={fees}
                onChange={setFees}
                suffix="%"
                max={95}
              />
            </div>
            <div className={styles.privacyNote}>
              <Info aria-hidden="true" size={18} />
              Esta simulação acontece no seu navegador. Os valores não são enviados nem
              salvos.
            </div>
          </section>

          <aside className={styles.resultPanel} aria-live="polite">
            <p className={styles.resultLabel}>Preço sugerido</p>
            <p className={styles.resultPrice}>{currency.format(finalPrice)}</p>
            <p className={styles.resultCaption}>por unidade</p>

            <div className={styles.profitHighlight}>
              <CircleDollarSign aria-hidden="true" size={22} />
              <span>
                <small>Lucro antes das taxas</small>
                <strong>{currency.format(profit)}</strong>
              </span>
            </div>

            <dl className={styles.breakdown}>
              <div>
                <dt>Ingredientes</dt>
                <dd>{currency.format(ingredientValue)}</dd>
              </div>
              <div>
                <dt>Embalagem</dt>
                <dd>{currency.format(packagingValue)}</dd>
              </div>
              <div>
                <dt>Mão de obra</dt>
                <dd>{currency.format(laborValue)}</dd>
              </div>
              <div>
                <dt>Custo fixo por unidade</dt>
                <dd>{currency.format(fixedShare)}</dd>
              </div>
              <div className={styles.breakdownTotal}>
                <dt>Custo total</dt>
                <dd>{currency.format(cost)}</dd>
              </div>
              {feeValue > 0 ? (
                <div>
                  <dt>Taxas incluídas</dt>
                  <dd>{currency.format(feesAmount)}</dd>
                </div>
              ) : null}
            </dl>

            <div className={styles.resultTip}>
              <Check aria-hidden="true" size={18} />
              {feeValue > 0
                ? "As taxas foram calculadas sobre o preço final para preservar sua margem."
                : "Nenhuma taxa foi informada; o preço considera seus custos e a margem desejada."}
            </div>

            <a href={PLAY_STORE_URL} data-analytics="play_store_calculator_result">
              Continuar no aplicativo <ArrowRight aria-hidden="true" size={18} />
            </a>
            <p className={styles.disclaimer}>
              Simulação educativa. Revise tributos e particularidades do seu negócio.
            </p>
          </aside>
        </div>
      ) : (
        <section
          id="features-panel"
          className={styles.featuresPanel}
          role="tabpanel"
          aria-labelledby="features-tab"
        >
          <header className={styles.featuresHeading}>
            <span>Experimente antes de entrar</span>
            <h2>Veja como o Lucro Caseiro ajuda na rotina</h2>
            <p>
              Teste uma prévia dos recursos que economizam tempo e organizam suas vendas.
            </p>
          </header>

          <div
            className={styles.featureTabs}
            role="tablist"
            aria-label="Recursos do aplicativo"
          >
            {FEATURE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.key}
                  id={`feature-${option.key}-tab`}
                  type="button"
                  role="tab"
                  aria-controls="feature-demo-panel"
                  aria-selected={activeFeature === option.key}
                  onClick={() => setActiveFeature(option.key)}
                >
                  <Icon aria-hidden="true" size={20} />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id="feature-demo-panel"
            className={styles.featureDemo}
            role="tabpanel"
            aria-labelledby={`feature-${activeFeature}-tab`}
          >
            {featureDemo}
          </div>

          <div className={styles.featuresCta}>
            <span>
              <strong>Gostou da prévia?</strong> No aplicativo, seus dados ficam
              conectados.
            </span>
            <a href={PLAY_STORE_URL} data-analytics="play_store_feature_demo">
              Começar grátis <ArrowRight aria-hidden="true" size={18} />
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
