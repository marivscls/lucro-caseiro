import {
  ArrowRight,
  ArrowDown,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  ReceiptText,
  Smartphone,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import styles from "./landing-page.module.css";
import { LandingMotion } from "./landing-motion";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { PLAY_STORE_URL, PWA_URL } from "./site-constants";

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

const flowSteps = [
  {
    title: "Coloque o que você gasta",
    text: "Ingredientes, materiais, embalagem, seu tempo, custos fixos e taxas entram na conta.",
  },
  {
    title: "Descubra o preço certo",
    text: "Veja o custo real, o preço recomendado e quanto vai sobrar em cada venda.",
  },
  {
    title: "Crie o produto uma vez",
    text: "Use a mesma precificação para deixar o produto pronto, sem digitar tudo novamente.",
  },
  {
    title: "Publique ou venda",
    text: "Compartilhe seu catálogo no WhatsApp ou registre a venda e acompanhe seu resultado.",
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
    title: "Precificação completa",
    icon: Calculator,
    plan: "Profissional",
    text: "Inclua cada custo e o valor do seu tempo para parar de cobrar no chute.",
    image: {
      src: "/landing/current-pricing.png",
      alt: "Tela de precificação do Lucro Caseiro com preço sugerido e lucro por unidade",
      crop: "phone",
    },
    span: "hero",
  },
  {
    title: "Catálogo online",
    icon: Store,
    text: "Tenha uma vitrine com seus produtos e receba pedidos direto no WhatsApp.",
    image: {
      src: "/landing/current-catalog.png",
      alt: "Tela de catálogo online do Lucro Caseiro pronta para compartilhar",
      crop: "screen",
    },
    span: "shot",
  },
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

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para começar",
    description: "Calcule, organize e faça suas primeiras vendas.",
    features: ["30 vendas por mês", "15 produtos", "Catálogo online básico"],
    featured: false,
  },
  {
    name: "Essencial",
    price: "R$ 29,90",
    period: "por mês",
    description: "Para usar no dia a dia sem limites de volume.",
    features: [
      "Vendas, clientes e produtos ilimitados",
      "Agenda, fiado e financeiro",
      "Resumo mensal em PDF",
    ],
    featured: true,
  },
  {
    name: "Profissional",
    price: "R$ 69,90",
    period: "por mês",
    description: "Para ganhar tempo e apresentar melhor seu negócio.",
    features: [
      "Catálogo personalizado",
      "Relatórios e exportações avançadas",
      "Compras, rótulos e orçamentos",
    ],
    featured: false,
  },
] as const;

const faqs = [
  {
    question: "Preciso entender de administração para usar?",
    answer:
      "Não. O Lucro Caseiro foi feito para explicar custos, preço e lucro em português simples, com um passo de cada vez.",
  },
  {
    question: "Posso testar antes de assinar?",
    answer:
      "Sim. O plano Gratuito permite fazer o fluxo real de precificação, cadastrar produtos, montar um catálogo básico e registrar suas primeiras vendas.",
  },
  {
    question: "Serve só para confeitaria?",
    answer:
      "Não. Ele atende quem produz ou vende em diferentes segmentos e estágios, de quem trabalha por conta própria a negócios estruturados e em crescimento. Marmitas, salgados, artesanato e costura são apenas alguns exemplos.",
  },
  {
    question: "O catálogo recebe pedidos pelo WhatsApp?",
    answer:
      "Sim. Você compartilha o seu link e a pessoa pode escolher um produto e iniciar o pedido pelo WhatsApp.",
  },
] as const;

const guides = [
  {
    title: "Como calcular o preço de venda",
    text: "O passo a passo completo para somar custos, margem e taxas.",
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

function CtaArrow() {
  return (
    <span className={styles.ctaGlyph} aria-hidden="true">
      <ArrowRight size={16} strokeWidth={2} />
    </span>
  );
}

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
                  <span>Quanto sobra</span>
                </span>{" "}
                <span className={styles.heroLine}>
                  <span>de cada venda?</span>
                </span>{" "}
                <em className={styles.markedHeadline}>
                  Agora você sabe.
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
                Descubra quanto cobrar, valorize seu tempo e organize suas vendas. Tudo no
                mesmo app, sem cadastrar de novo.
              </p>
              <div className={styles.heroActions}>
                <a
                  className={styles.primaryCta}
                  data-pointer-ripple
                  href={PLAY_STORE_URL}
                  data-analytics="play_store_hero"
                >
                  <Smartphone aria-hidden="true" size={20} />
                  Baixar no Google Play
                </a>
                <a
                  className={styles.secondaryCta}
                  href={PWA_URL}
                  data-analytics="pwa_hero"
                >
                  Usar no navegador
                  <ArrowRight aria-hidden="true" size={18} />
                </a>
              </div>
              <p className={styles.heroNote}>
                <Check aria-hidden="true" size={18} />
                Plano gratuito no app e no navegador
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
                  <span>Sobra por unidade</span>
                  <strong>R$ 7,39</strong>
                </div>
              </div>
              <p className={styles.cardFootnote}>
                Seu tempo de trabalho já está nessa conta.
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

        <section className={styles.flowSection} id="como-funciona">
          <h2>Da primeira conta à próxima venda.</h2>
          <p className={styles.lede}>
            A informação anda com você: o que começa na precificação vira produto,
            catálogo ou venda.
          </p>
          <ol className={styles.flowTrack}>
            {flowSteps.map((step, index) => (
              <li
                key={step.title}
                data-landing-reveal={index * 80}
                data-motion-kind="step"
              >
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

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
                Uma conta.
                <br />
                Muitas possibilidades.
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
          <h2>O essencial do seu negócio, direto do celular.</h2>
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

        <section className={styles.pricingSection} id="planos">
          <h2>Um plano para cada fase do seu negócio.</h2>
          <p className={styles.lede}>
            Comece no Gratuito. Escolha outro plano quando seu negócio precisar de mais.
          </p>
          <div className={styles.pricingGrid}>
            {plans.map((plan, index) => (
              <article
                key={plan.name}
                data-landing-reveal={index * 60}
                className={`${styles.planCard} ${plan.featured ? styles.planFeatured : ""}`}
              >
                <div className={styles.planHeading}>
                  <h3>{plan.name}</h3>
                  {plan.featured ? <p className={styles.planBadge}>Recomendado</p> : null}
                </div>
                <p className={styles.planDescription}>{plan.description}</p>
                <p className={styles.planPrice}>
                  {plan.price}
                  <small>{plan.period}</small>
                </p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check aria-hidden="true" size={17} strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={PLAY_STORE_URL}
                  data-analytics={`play_store_plan_${plan.name.toLowerCase()}`}
                  data-pointer-ripple
                >
                  {plan.name === "Gratuito" ? "Começar grátis" : "Baixar o app"}
                  <CtaArrow />
                </a>
              </article>
            ))}
          </div>
          <p className={styles.pricingNote}>
            Escolha seu plano no aplicativo. Planos anuais com dois meses de economia.
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
            {faqs.map((faq) => (
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
              Baixe o app ou use pelo navegador. Faça a primeira conta no plano gratuito.
            </p>
          </div>
          <div className={styles.finalActions}>
            <a
              className={styles.finalButton}
              data-pointer-ripple
              href={PLAY_STORE_URL}
              data-analytics="play_store_final"
            >
              Baixar no Google Play
            </a>
            <a className={styles.secondaryCta} href={PWA_URL} data-analytics="pwa_final">
              Usar no navegador
              <ArrowRight aria-hidden="true" size={18} />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </LandingMotion>
  );
}
