import {
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  ReceiptText,
  Store,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import {
  ESSENTIAL_TRIAL_DAYS,
  FREE_CATALOG_MAX_PRODUCTS,
  PLAN_LIMITS,
  PLAN_PRICING,
} from "@lucro-caseiro/contracts";

import styles from "./landing-page.module.css";
import { AppDemo } from "./app-demo";
import { HeroActions, StartCta } from "./hero-actions";
import { LandingMotion } from "./landing-motion";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { PricingPlans, type PricingPlan } from "./pricing-plans";
import { SupportWhatsApp } from "./site-chrome";
import { TESTIMONIALS } from "./testimonials";

const exampleRows = [
  { label: "Insumos", value: "R$ 10,00" },
  { label: "Embalagem", value: "R$ 2,00" },
  { label: "Seu tempo", value: "R$ 8,10" },
  { label: "Custos fixos", value: "R$ 3,00" },
] as const;

const problems = [
  {
    title: "Custos ficam esquecidos",
    text: "Embalagem, gás, energia, taxa e transporte somem da conta sem você perceber.",
  },
  {
    title: "Seu tempo fica de graça",
    text: "Horas de produção ou atendimento muitas vezes ficam fora do preço.",
  },
  {
    title: "O dinheiro se mistura",
    text: "Você vende, recebe e compra de novo sem enxergar quanto realmente sobrou.",
  },
] as const;

const features = [
  {
    title: "Vendas organizadas",
    text: "Registre pedidos e pagamentos e veja o que entrou sem depender do caderno.",
  },
  {
    title: "Agenda de encomendas",
    text: "Prazos e entregas em um só lugar para não perder nenhum pedido.",
  },
  {
    title: "Clientes e fiado",
    text: "Contatos, valores pendentes e quem ainda precisa pagar, sem anotação solta.",
  },
  {
    title: "Dinheiro mais claro",
    text: "Quanto entrou, quanto saiu e quanto realmente sobrou no mês.",
  },
] as const;

const steps = [
  {
    label: "Calcular",
    title: "Comece pelo que sobra.",
    text: "Inclua os materiais, seu tempo e os gastos do negócio. Veja o preço sugerido e o lucro por unidade.",
    src: "/landing/current-pricing.png",
    alt: "Precificação atual do app com preço e lucro",
    caption: "Preço definido",
  },
  {
    label: "Cadastrar",
    title: "Transforme a conta em produto.",
    text: "Aproveite a precificação para cadastrar o produto com preço, custo e estoque. Sem digitar tudo de novo.",
    src: "/landing/current-products.png",
    alt: "Lista de produtos da conta de testes, com preço e estoque",
    caption: "Produto organizado",
  },
  {
    label: "Compartilhar",
    title: "Mostre. Compartilhe. Venda.",
    text: "Leve seus produtos para o catálogo e compartilhe o link. O cliente escolhe e inicia o pedido pelo WhatsApp.",
    src: "/landing/current-catalog.png",
    alt: "Tela de catálogo da conta de testes, com link e botão para compartilhar",
    caption: "Vitrine pronta",
  },
] as const;

const audiences: readonly {
  readonly id?: string;
  readonly name: string;
  readonly text: string;
  readonly href?: string;
}[] = [
  {
    name: "Confeitaria e doces",
    text: "Bolos, brigadeiros e encomendas de festa.",
    href: "/landing/app-para-confeitaria",
  },
  {
    id: "marmitas",
    name: "Marmitas e salgados",
    text: "Gás, embalagem e entrega no preço, e o fiado dos clientes fixos.",
    href: "/landing/app-para-marmita",
  },
  {
    id: "revenda-comercio",
    name: "Revenda e comércio",
    text: "Preço de compra, estoque e vendas de roupas, presentes ou papelaria.",
  },
  {
    id: "artesanato-costura",
    name: "Artesanato e costura",
    text: "Peças com material e horas de trabalho.",
  },
  {
    id: "beleza-servicos",
    name: "Beleza e serviços",
    text: "Manicure, cabelo e estética com material e tempo na conta.",
    href: "/landing/app-para-manicure",
  },
  {
    name: "Outros negócios",
    text: "Quem produz, revende ou atende e quer saber o que sobra.",
  },
];

const trialDays = ESSENTIAL_TRIAL_DAYS;

const plans: readonly PricingPlan[] = [
  {
    name: "Gratuito",
    monthly: null,
    annual: null,
    description: "Calcule, organize e faça suas primeiras vendas.",
    features: [
      "Vendas ilimitadas",
      `${PLAN_LIMITS.free.maxProducts} produtos e ${PLAN_LIMITS.free.maxClients} clientes`,
      "Fiado, agenda de encomendas e financeiro",
      "Cálculo com materiais, trabalho, gastos fixos e taxas",
      `Catálogo com até ${FREE_CATALOG_MAX_PRODUCTS} produtos publicados`,
      "Resumo do mês e orçamentos em PDF",
      "Lembretes diários e resumo da semana",
    ],
    featured: false,
    badge: null,
    ctaLabel: "Começar grátis",
  },
  {
    name: "Essencial",
    monthly: PLAN_PRICING.essential.monthly,
    annual: PLAN_PRICING.essential.annual,
    description: "Para usar no dia a dia sem limites de volume.",
    features: [
      "Tudo do Gratuito",
      "Clientes e produtos ilimitados",
      "Catálogo completo e personalizado, com mais fotos",
      "Sem anúncios",
    ],
    featured: true,
    badge: `${trialDays} dias grátis`,
    ctaLabel: `Testar ${trialDays} dias grátis`,
  },
  {
    name: "Profissional",
    monthly: PLAN_PRICING.professional.monthly,
    annual: PLAN_PRICING.professional.annual,
    description: "Para automatizar custos e aprofundar o controle do negócio.",
    features: [
      "Tudo do Essencial",
      "Rateio por faturamento e perfis salvos de taxas",
      "Relatórios e exportações avançadas",
      "Compras, gastos recorrentes e rótulos",
      "Produtos compostos e kits",
    ],
    featured: false,
    badge: null,
    ctaLabel: "Começar grátis",
  },
];

export const landingFaqs = [
  {
    question: "Posso usar no computador ou no iPhone?",
    answer:
      "Sim. Abra o Lucro Caseiro no navegador do computador, iPhone ou Android. No Android, você também pode instalar pela Google Play. Entre com a mesma conta para acessar seus dados.",
  },
  {
    question: "O que está incluído no Gratuito?",
    answer: `Você pode registrar vendas sem limite, cadastrar ${PLAN_LIMITS.free.maxProducts} produtos e ${PLAN_LIMITS.free.maxClients} clientes, anotar o fiado, organizar encomendas, gerar orçamentos em PDF e publicar até ${FREE_CATALOG_MAX_PRODUCTS} produtos no catálogo. O cálculo inclui materiais, embalagem, mão de obra, rateio por produção e taxas informadas manualmente.`,
  },
  {
    question: "Posso testar o Essencial antes de assinar?",
    answer: `Sim. Toda conta nova ganha ${ESSENTIAL_TRIAL_DAYS} dias do Essencial grátis, sem cartão. É só criar a sua conta e usar.`,
  },
  {
    question: "Tem alguma cobrança quando o teste acabar?",
    answer: `Não. O teste não pede cartão, então nada é cobrado. No fim dos ${ESSENTIAL_TRIAL_DAYS} dias a conta volta sozinha para o Gratuito e seus dados continuam salvos. Só paga quem escolher assinar.`,
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim, sem multa. Se assinou pelo Android, cancele na Google Play, em Pagamentos e assinaturas. Se assinou pelo navegador, fale com o nosso suporte. Você usa até o fim do período pago e depois volta para o Gratuito, sem perder seus dados.",
  },
  {
    question: "O Lucro Caseiro cobra comissão pelos pedidos do catálogo?",
    answer:
      "Não. O cliente escolhe no seu catálogo e o pedido vai direto para o seu WhatsApp. O combinado e o pagamento ficam entre vocês, sem taxa por venda.",
  },
  {
    question: "Meus dados ficam salvos se eu trocar de celular?",
    answer:
      "Sim. Suas vendas, clientes e fiado ficam salvos na sua conta, na nuvem. No celular novo ou no computador, é só entrar com o mesmo e-mail.",
  },
  {
    question: "Preciso do Profissional para calcular mão de obra e taxas?",
    answer:
      "Não. Esses valores podem ser informados em todos os planos. O Profissional acrescenta rateio de custos por faturamento e perfis salvos de taxas, além de relatórios, exportações e outras ferramentas de gestão.",
  },
  {
    question: "Preciso entender de administração para usar?",
    answer:
      "Não. O Lucro Caseiro foi feito para explicar custos, preço e lucro em português simples, com um passo de cada vez.",
  },
  {
    question: "Serve só para confeitaria?",
    answer:
      "Não. Ele atende quem produz, vende ou presta serviços: confeitaria, marmitas, artesanato, revenda, papelaria, beleza e outros serviços, de quem trabalha por conta própria a negócios em crescimento.",
  },
] as const;

const guides = [
  {
    title: "Como calcular o preço de venda",
    text: "O passo a passo completo para somar custos, lucro sobre o custo e taxas.",
    href: "/landing/guias/como-calcular-preco-de-venda",
  },
  {
    title: "Precificação para confeitaria",
    text: "Os custos que entram no preço de doces, bolos e encomendas.",
    href: "/landing/guias/precificacao-para-confeitaria",
  },
  {
    title: "Como cobrar pela mão de obra",
    text: "Transforme o tempo de produção em um custo justo e claro.",
    href: "/landing/guias/como-colocar-mao-de-obra-no-preco",
  },
] as const;

export function LandingPage() {
  return (
    <LandingMotion className={`${styles.page} ${styles.pageWineTop}`}>
      <SiteHeader tone="wine" />

      <main id="conteudo">
        <section className={styles.hero} id="inicio">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <h1>
                <span className={styles.heroLine}>
                  <span>Saiba quanto cobrar</span>
                </span>{" "}
                <span className={styles.heroLine}>
                  <span>e o que sobra</span>
                </span>{" "}
                <em className={styles.markedHeadline}>
                  de cada venda.
                  <svg
                    className={styles.headlineStroke}
                    viewBox="0 0 500 24"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 14C120 3 285 4 494 10M45 21C180 12 330 12 461 17"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </em>
              </h1>
              <p className={styles.heroText}>
                Para quem produz, revende ou presta serviços. Comece calculando um preço
                ou registrando uma venda. Organize produtos, clientes e recebimentos
                conforme precisar.
              </p>
              <HeroActions
                beside={
                  <p className={styles.heroNote}>
                    <Check aria-hidden="true" size={18} />
                    Grátis para sempre, e {trialDays} dias do Essencial para testar, sem
                    cartão
                  </p>
                }
                trailing={
                  <a
                    className={styles.heroCalculatorLink}
                    href="/landing/calculadora"
                    data-analytics="calculator_from_hero"
                  >
                    Testar a calculadora sem criar conta
                    <ArrowRight aria-hidden="true" size={18} />
                  </a>
                }
              />
            </div>

            <aside className={styles.card} aria-label="Exemplo de conta de um produto">
              <div className={styles.cardHeading}>
                <ReceiptText aria-hidden="true" size={24} />
                <p className={styles.cardTitle}>Uma venda, toda a conta.</p>
              </div>
              <div className={styles.cardProduct}>
                <strong>Caixa de brigadeiros</strong>
                <span>Exemplo ilustrativo</span>
              </div>
              <dl className={styles.cardRows}>
                {exampleRows.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className={styles.cardSubtotal}>
                <span>Custo total</span>
                <strong>R$ 23,10</strong>
              </div>
              <div className={styles.cardResult}>
                <div>
                  <p className={styles.cardPriceLabel}>Preço sugerido</p>
                  <p className={styles.cardPrice}>R$ 30,49</p>
                </div>
                <div className={styles.cardChip}>
                  <span>Sobra por caixa</span>
                  <strong>R$ 7,39</strong>
                </div>
              </div>
              <p className={styles.cardFootnote}>
                Seu trabalho já está no custo. Exemplo com 32% sobre o custo, sem taxas de
                venda.
              </p>
            </aside>
          </div>
          <ul className={styles.benefitStrip} aria-label="O que você pode fazer no app">
            <li>
              <Calculator aria-hidden="true" size={22} /> Calcular seu preço
            </li>
            <li>
              <Store aria-hidden="true" size={22} /> Compartilhar seu catálogo
            </li>
            <li>
              <Wallet aria-hidden="true" size={22} /> Acompanhar o que sobra
            </li>
          </ul>
        </section>

        <section className={styles.problemSection}>
          <div>
            <h2>
              Você vende.
              <br />
              Mas o dinheiro sobra?
            </h2>
            <p className={styles.problemIntro}>
              Uma conta completa muda a forma de olhar para cada venda.
            </p>
          </div>
          <div className={styles.problemList}>
            {problems.map((problem) => (
              <article key={problem.title}>
                <h3>{problem.title}</h3>
                <p>{problem.text}</p>
              </article>
            ))}
          </div>
        </section>

        <div id="como-funciona" />

        <section
          className={styles.journey}
          id="produto"
          data-product-journey
          aria-labelledby="journey-title"
        >
          <div className={styles.journeyHead}>
            <h2 id="journey-title">
              Do custo ao pedido.
              <br />
              No mesmo aplicativo.
            </h2>
            <p className={styles.journeyNote}>
              Telas reais do aplicativo, capturadas em 04/09/2026 numa conta de testes.
            </p>
          </div>
          <div className={styles.journeyTrack}>
            <div className={styles.journeyLine} aria-hidden="true">
              <span data-journey-progress />
            </div>
            <ol className={styles.journeySteps}>
              {steps.map((step, index) => (
                <li className={styles.journeyStep} key={step.label}>
                  <p className={styles.journeyIndex}>
                    <span data-journey-mark>{index + 1}</span>
                    {step.label}
                  </p>
                  <h3>{step.title}</h3>
                  <p className={styles.journeyText}>{step.text}</p>
                  <figure className={styles.journeyScreen}>
                    <Image
                      data-journey-screen
                      src={step.src}
                      alt={step.alt}
                      width={1080}
                      height={2400}
                      sizes="(max-width: 899px) 200px, 260px"
                    />
                    <figcaption>{step.caption}</figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <AppDemo />

        {TESTIMONIALS.length > 0 ? (
          <section className={styles.testimonialSection} aria-labelledby="depoimentos">
            <h2 id="depoimentos">Quem usa, conta.</h2>
            <div className={styles.testimonialGrid}>
              {TESTIMONIALS.map((item, index) => (
                <figure key={item.name} data-landing-reveal={(index % 3) * 60}>
                  <blockquote>“{item.quote}”</blockquote>
                  <figcaption>
                    <strong>{item.name}</strong>
                    <span>
                      {item.business} · {item.city}
                    </span>
                    {item.instagram ? (
                      <a
                        href={`https://www.instagram.com/${item.instagram}/`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        @{item.instagram}
                      </a>
                    ) : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.pricingSection} id="planos">
          <h2>Um plano para cada fase do seu negócio.</h2>
          <p className={styles.lede}>
            Comece grátis e teste o Essencial por {trialDays} dias. Escolha um plano só
            quando seu negócio precisar de mais.
          </p>
          <PricingPlans plans={plans} />
          <p className={styles.pricingNote}>
            Toda conta nova ganha {trialDays} dias do Essencial, sem cartão. Depois,
            continue no Gratuito ou escolha um plano no app. Cancele quando quiser.
          </p>
        </section>

        <section className={styles.indexSection} id="recursos">
          <div className={styles.indexHead}>
            <h2>Depois da venda, mantenha tudo em ordem.</h2>
            <p className={styles.lede}>
              Ferramentas práticas para organizar sem transformar seu dia em trabalho de
              escritório.
            </p>
          </div>
          <div className={styles.indexColumns}>
            <div>
              <h3>No app</h3>
              <ul>
                {features.map((feature) => (
                  <li key={feature.title}>
                    <strong>{feature.title}</strong>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Para quem</h3>
              <ul>
                {audiences.map((item) => (
                  <li key={item.name} id={item.id}>
                    {item.href ? (
                      <a href={item.href}>
                        <strong>
                          {item.name}
                          <ArrowRight aria-hidden="true" size={18} />
                        </strong>
                        <span>{item.text}</span>
                      </a>
                    ) : (
                      <>
                        <strong>{item.name}</strong>
                        <span>{item.text}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Guias</h3>
              <ul>
                {guides.map((guide) => (
                  <li key={guide.href}>
                    <a href={guide.href}>
                      <strong>
                        {guide.title}
                        <ArrowRight aria-hidden="true" size={18} />
                      </strong>
                      <span>{guide.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.faqSection} id="duvidas">
          <div className={styles.faqIntro}>
            <h2>Dúvidas antes de começar?</h2>
            <p>Ficou com outra dúvida? Fale com a gente pelo e-mail.</p>
            <a href="mailto:contato@orionseven.com.br">contato@orionseven.com.br</a>
          </div>
          <div className={styles.faqList}>
            {landingFaqs.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <ChevronDown aria-hidden="true" size={20} strokeWidth={2} />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <h2>
              Seu trabalho tem valor.
              <em>Coloque isso no preço.</em>
            </h2>
            <p>
              Calcule seu primeiro preço ou registre uma venda no app. Use no navegador ou
              no Android, com {trialDays} dias do Essencial sem cartão. Depois, continue
              no Gratuito ou escolha um plano.
            </p>
          </div>
          <StartCta
            placement="final"
            className={styles.finalActions}
            buttonClassName={styles.finalButton}
            alternativeClassName={styles.secondaryCta}
          />
        </section>
      </main>

      <SiteFooter />
      <SupportWhatsApp />
    </LandingMotion>
  );
}
