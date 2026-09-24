import {
  ArrowRight,
  ArrowDown,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  ReceiptText,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import {
  ESSENTIAL_TRIAL_DAYS,
  PLAN_LIMITS,
  PLAN_PRICING,
} from "@lucro-caseiro/contracts";

import styles from "./landing-page.module.css";
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
    text: "Horas de produção entram no produto, mas muitas vezes não entram no preço.",
  },
  {
    title: "O dinheiro se mistura",
    text: "Você vende, recebe e compra de novo sem enxergar quanto realmente sobrou.",
  },
] as const;

type FeatureTile = {
  readonly title: string;
  readonly text: string;
  readonly span: "hero" | "shot" | "wide" | "text";
  readonly icon: LucideIcon;
  readonly plan?: string;
  readonly image?: {
    readonly src: string;
    readonly alt: string;
    readonly crop: "phone" | "screen";
  };
};

const featureTiles: readonly FeatureTile[] = [
  {
    title: "Vendas organizadas",
    icon: ReceiptText,
    text: "Registre pedidos, pagamentos e acompanhe o que entrou sem depender do caderno.",
    span: "text",
  },
  {
    title: "Agenda de encomendas",
    icon: CalendarDays,
    text: "Veja prazos e entregas em um só lugar para não perder nenhum pedido.",
    span: "text",
  },
  {
    title: "Clientes e fiado",
    icon: Users,
    text: "Guarde contatos, acompanhe valores pendentes e saiba quem ainda precisa pagar.",
    span: "text",
  },
  {
    title: "Dinheiro mais claro",
    icon: Wallet,
    text: "Entenda quanto entrou, quanto saiu e quanto realmente sobrou no mês.",
    image: {
      src: "/landing/current-finance.png",
      alt: "Tela financeira do Lucro Caseiro com lucro, entradas e saídas do mês",
      crop: "phone",
    },
    span: "wide",
  },
];

const audiences = [
  { name: "Confeitaria e doces", text: "Bolos, brigadeiros e encomendas de festa." },
  { name: "Marmitas e salgados", text: "Produção do dia com custo de gás e embalagem." },
  { name: "Artesanato e costura", text: "Peças com material e horas de trabalho." },
  { name: "Beleza e serviços", text: "Atendimentos com produto e tempo na conta." },
] as const;

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
      "Catálogo com até 3 produtos publicados",
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
      "Clientes e produtos ilimitados",
      "Catálogo completo e personalizado, com mais fotos",
      "Sem anúncios",
      "Resumo mensal em PDF",
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
      "Compras, gastos recorrentes, rótulos e orçamentos",
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
    answer: `Você pode registrar vendas sem limite, cadastrar ${PLAN_LIMITS.free.maxProducts} produtos e ${PLAN_LIMITS.free.maxClients} clientes, anotar o fiado, organizar encomendas e publicar até 3 produtos no catálogo. O cálculo inclui materiais, embalagem, mão de obra, rateio por produção e taxas informadas manualmente.`,
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
      "Não. Ele atende quem produz, vende ou presta serviços: confeitaria, marmitas, salgados, artesanato, costura, beleza e muito mais, de quem trabalha por conta própria a negócios em crescimento.",
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

const spanClass = {
  hero: styles.spanHero,
  shot: styles.spanShot,
  wide: styles.spanWide,
  text: styles.spanText,
} as const;

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
                Para quem produz, vende ou presta serviços. Some seus custos, valorize seu
                trabalho e transforme a conta em produto, catálogo ou venda no mesmo app.
              </p>
              <HeroActions />
              <p className={styles.heroNote}>
                <Check aria-hidden="true" size={18} />
                Grátis para sempre, e {trialDays} dias do Essencial para testar, sem
                cartão
              </p>
              <a
                className={styles.heroCalculatorLink}
                href="/landing/calculadora"
                data-analytics="calculator_from_hero"
              >
                Testar a calculadora sem criar conta
                <ArrowRight aria-hidden="true" size={18} />
              </a>
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
        </section>

        <div className={styles.benefitStrip} aria-label="O que você pode fazer no app">
          <span>
            <Calculator aria-hidden="true" size={22} /> Calcular seu preço
          </span>
          <span>
            <Store aria-hidden="true" size={22} /> Compartilhar seu catálogo
          </span>
          <span>
            <Wallet aria-hidden="true" size={22} /> Acompanhar o que sobra
          </span>
        </div>

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
          <div className={styles.journeyStage}>
            <div className={styles.journeyCopy}>
              <p className={styles.journeyKicker}>Do preço ao pedido</p>
              <h2 id="journey-title">
                Do custo ao pedido.
                <br />
                Sem começar de novo.
              </h2>
              <div className={styles.journeyChapters}>
                {[
                  {
                    title: "Comece pelo que sobra.",
                    text: "Inclua os materiais, seu tempo e os gastos do negócio. Veja o preço sugerido e o lucro por unidade.",
                    label: "Calcular",
                  },
                  {
                    title: "Transforme a conta em produto.",
                    text: "Aproveite a precificação para cadastrar o produto com preço, custo e estoque. Sem digitar tudo de novo.",
                    label: "Cadastrar",
                  },
                  {
                    title: "Mostre. Compartilhe. Venda.",
                    text: "Leve seus produtos para o catálogo e compartilhe o link. O cliente escolhe e inicia o pedido pelo WhatsApp.",
                    label: "Compartilhar",
                  },
                ].map((chapter, index) => (
                  <article
                    className={styles.journeyChapter}
                    data-journey-chapter
                    key={chapter.label}
                  >
                    <p className={styles.journeyIndex}>
                      0{index + 1} / {chapter.label}
                    </p>
                    <h3>{chapter.title}</h3>
                    <p>{chapter.text}</p>
                  </article>
                ))}
              </div>
              <div className={styles.journeyProgress} aria-hidden="true">
                <span data-journey-progress />
              </div>
              <p className={styles.journeyHint}>
                <span>Role para acompanhar</span>
                <ArrowDown aria-hidden="true" size={18} />
              </p>
            </div>
            <div className={styles.journeyDeck}>
              {[
                {
                  src: "/landing/current-pricing.png",
                  alt: "Precificação atual do app com preço e lucro",
                  label: "Preço definido",
                },
                {
                  src: "/landing/current-products.png",
                  alt: "Produtos atuais do app com preço e estoque",
                  label: "Produto organizado",
                },
                {
                  src: "/landing/current-catalog.png",
                  alt: "Catálogo atual do app pronto para compartilhar",
                  label: "Vitrine pronta",
                },
              ].map((screen, index) => (
                <figure
                  className={styles.journeyScreen}
                  data-journey-screen
                  key={screen.src}
                >
                  <figcaption>
                    <span>0{index + 1}</span>
                    {screen.label}
                  </figcaption>
                  <Image
                    src={screen.src}
                    alt={screen.alt}
                    width={1080}
                    height={2400}
                    sizes="(max-width: 900px) 230px, 300px"
                  />
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.featuresSection} id="recursos">
          <h2>Depois da venda, mantenha tudo em ordem.</h2>
          <p className={styles.lede}>
            Ferramentas práticas para organizar sem transformar seu dia em trabalho de
            escritório.
          </p>
          <p className={styles.captureNote}>
            Telas atuais do aplicativo no Android, com dados de uma conta de testes.
          </p>
          <div className={styles.featureBento}>
            {featureTiles.map((tile, index) => (
              <article
                key={tile.title}
                data-landing-reveal={(index % 2) * 60}
                className={`${styles.featureTile} ${spanClass[tile.span]}`}
              >
                {tile.image ? (
                  <div
                    className={`${styles.featureShot} ${tile.image.crop === "screen" ? styles.cropScreen : ""}`}
                  >
                    <Image
                      src={tile.image.src}
                      width={1080}
                      height={2400}
                      sizes="(max-width: 560px) calc(100vw - 64px), (max-width: 1050px) 45vw, 40vw"
                      alt={tile.image.alt}
                    />
                  </div>
                ) : null}
                <div className={styles.featureCopy}>
                  <tile.icon aria-hidden="true" size={24} strokeWidth={1.7} />
                  <h3>{tile.title}</h3>
                  {tile.plan ? (
                    <p className={styles.featurePlan}>No plano {tile.plan}</p>
                  ) : null}
                  <p>{tile.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.audienceSection}>
          <h2>
            Seu talento é produzir, vender ou cuidar. A organização fica mais fácil.
          </h2>
          <ul className={styles.audienceList}>
            {audiences.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

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

        <section className={styles.learningSection}>
          <h2>Uma ajuda para a sua próxima conta.</h2>
          <p className={styles.lede}>
            Guias curtos para consultar quando surgir uma dúvida no seu negócio.
          </p>
          <div className={styles.guidesList}>
            {guides.map((guide, index) => (
              <a href={guide.href} key={guide.href} data-landing-reveal={index * 60}>
                <h3>{guide.title}</h3>
                <p>{guide.text}</p>
                <strong>
                  Continuar lendo
                  <ArrowRight aria-hidden="true" size={17} strokeWidth={2} />
                </strong>
              </a>
            ))}
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
              Comece grátis no celular ou no computador. Os primeiros {trialDays} dias têm
              tudo do Essencial.
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
