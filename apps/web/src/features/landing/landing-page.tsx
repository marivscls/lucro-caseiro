import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  Store,
  UsersRound,
} from "lucide-react";
import Image from "next/image";

import styles from "./landing-page.module.css";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { PLAY_STORE_URL } from "./site-constants";

const flowSteps = [
  {
    number: "01",
    title: "Coloque o que você gasta",
    text: "Ingredientes, materiais, embalagem, seu tempo, custos fixos e taxas entram na conta.",
    icon: ReceiptText,
  },
  {
    number: "02",
    title: "Descubra o preço certo",
    text: "Veja o custo real, o preço recomendado e quanto vai sobrar em cada venda.",
    icon: Calculator,
  },
  {
    number: "03",
    title: "Crie o produto uma vez",
    text: "Use a mesma precificação para deixar o produto pronto, sem digitar tudo novamente.",
    icon: PackageCheck,
  },
  {
    number: "04",
    title: "Publique ou venda",
    text: "Compartilhe seu catálogo no WhatsApp ou registre a venda e acompanhe seu resultado.",
    icon: Store,
  },
] as const;

const features = [
  {
    icon: Calculator,
    title: "Precificação completa",
    text: "Inclua cada custo e o valor do seu tempo para parar de cobrar no chute.",
  },
  {
    icon: Store,
    title: "Catálogo online",
    text: "Tenha uma vitrine com seus produtos e receba pedidos direto no WhatsApp.",
  },
  {
    icon: ShoppingBag,
    title: "Vendas organizadas",
    text: "Registre pedidos, pagamentos e acompanhe o que entrou sem depender do caderno.",
  },
  {
    icon: CalendarDays,
    title: "Agenda de encomendas",
    text: "Veja prazos e entregas em um só lugar para não perder nenhum pedido.",
  },
  {
    icon: BarChart3,
    title: "Dinheiro mais claro",
    text: "Entenda quanto entrou, quanto saiu e quanto realmente sobrou no mês.",
  },
  {
    icon: UsersRound,
    title: "Clientes e fiado",
    text: "Guarde contatos, acompanhe valores pendentes e saiba quem ainda precisa pagar.",
  },
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
      "Não. Ele atende quem produz ou vende em diferentes segmentos e estágios — de quem trabalha por conta própria a negócios estruturados e em crescimento. Marmitas, salgados, artesanato e costura são apenas alguns exemplos.",
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

export function LandingPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main>
        <section className={styles.hero} id="inicio">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <BadgeCheck aria-hidden="true" size={18} />
              Feito para quem vive do próprio talento
            </p>
            <h1>
              Você sabe quanto realmente <em>sobra</em> de cada venda?
            </h1>
            <p className={styles.heroText}>
              Calcule o preço certo do seu produto e transforme o resultado em catálogo ou
              venda — sem preencher tudo de novo.
            </p>
            <div className={styles.heroActions}>
              <a
                className={styles.primaryCta}
                href="/landing/calculadora"
                data-analytics="calculator_from_hero"
              >
                <Calculator aria-hidden="true" size={20} />
                Calcular meu primeiro preço grátis
              </a>
              <a
                className={styles.textLink}
                href={PLAY_STORE_URL}
                data-analytics="play_store_hero"
              >
                Baixar o aplicativo
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
            <p className={styles.storeNote}>
              Disponível para Android · plano gratuito para começar
            </p>
          </div>

          <div
            className={styles.heroVisual}
            aria-label="Demonstração da precificação no aplicativo"
          >
            <div className={styles.heroBackdrop} />
            <div className={styles.phoneFrame}>
              <div className={styles.phoneSpeaker} />
              <Image
                src="/landing/app-precificacao.png"
                width={922}
                height={2048}
                alt="Tela de precificação do Lucro Caseiro"
                priority
              />
            </div>
            <Image
              className={styles.calculatorArt}
              src="/landing/calculadora.png"
              width={420}
              height={420}
              alt=""
              priority
            />
            <div className={styles.profitCard}>
              <span>Quanto sobra</span>
              <strong>R$ 38,40</strong>
              <small>em cada venda</small>
            </div>
          </div>
        </section>

        <div
          className={styles.proofStrip}
          aria-label="Custos considerados na precificação"
        >
          <span>Ingredientes</span>
          <span>Embalagem</span>
          <span>Mão de obra</span>
          <span>Custos fixos</span>
          <span>Lucro</span>
        </div>

        <section className={styles.problemSection}>
          <div className={styles.problemIntro}>
            <p className={styles.sectionTag}>Cobrar no chute custa caro</p>
            <h2>Vender bastante não significa ter lucro.</h2>
          </div>
          <div className={styles.problemGrid}>
            <article>
              <span>01</span>
              <h3>Custos ficam esquecidos</h3>
              <p>
                Embalagem, gás, energia, taxa e transporte somem da conta sem você
                perceber.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Seu tempo fica de graça</h3>
              <p>
                Horas de produção entram no produto, mas muitas vezes não entram no preço.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>O dinheiro se mistura</h3>
              <p>
                Você vende, recebe e compra de novo sem enxergar quanto realmente sobrou.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.flowSection} id="como-funciona">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionTag}>Um cálculo. Vários caminhos.</p>
            <h2>Do custo à venda, sem chute e sem retrabalho.</h2>
            <p>
              A informação anda com você: o que começa na precificação vira produto,
              catálogo ou venda.
            </p>
          </div>
          <div className={styles.flowGrid}>
            {flowSteps.map(({ number, title, text, icon: Icon }) => (
              <article key={number} className={styles.flowCard}>
                <div className={styles.flowCardTop}>
                  <span>{number}</span>
                  <Icon aria-hidden="true" size={24} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.productStory}>
          <div className={styles.storyCopy}>
            <p className={styles.sectionTag}>Preço certo. Venda pronta.</p>
            <h2>Seu produto sai do cálculo pronto para trabalhar por você.</h2>
            <p>
              Sem planilha de um lado e cadastro do outro. Você aproveita os mesmos dados
              para organizar o produto e mostrar uma vitrine bonita para seus clientes.
            </p>
            <ul>
              <li>
                <Check aria-hidden="true" size={18} /> Menos digitação e menos erro
              </li>
              <li>
                <Check aria-hidden="true" size={18} /> Link próprio para compartilhar
              </li>
              <li>
                <Check aria-hidden="true" size={18} /> Pedido iniciado pelo WhatsApp
              </li>
            </ul>
            <a
              className={styles.textLink}
              href={PLAY_STORE_URL}
              data-analytics="play_store_catalog"
            >
              Criar meu catálogo
              <ArrowRight aria-hidden="true" size={18} />
            </a>
          </div>
          <div className={styles.storyVisual}>
            <div className={`${styles.phoneFrame} ${styles.storyPhoneBack}`}>
              <div className={styles.phoneSpeaker} />
              <Image
                src="/landing/app-inicio.png"
                width={922}
                height={2048}
                alt="Tela inicial do Lucro Caseiro com atalhos do negócio"
              />
            </div>
            <div className={`${styles.phoneFrame} ${styles.storyPhoneFront}`}>
              <div className={styles.phoneSpeaker} />
              <Image
                src="/landing/app-catalogo.png"
                width={922}
                height={2048}
                alt="Tela de catálogo online do Lucro Caseiro"
              />
            </div>
            <div className={styles.catalogBadge}>
              <Store aria-hidden="true" size={20} />
              <span>
                <strong>Catálogo no ar</strong>Pronto para compartilhar
              </span>
            </div>
          </div>
        </section>

        <section className={styles.featuresSection} id="recursos">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionTag}>Tudo conversa entre si</p>
            <h2>O essencial do seu negócio, direto do celular.</h2>
            <p>
              Ferramentas práticas para organizar sem transformar seu dia em trabalho de
              escritório.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon aria-hidden="true" size={24} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.audienceSection}>
          <div>
            <p className={styles.sectionTag}>Feito para negócio de verdade</p>
            <h2>Para quem produz com as próprias mãos e vende pelo celular.</h2>
          </div>
          <div className={styles.audienceList}>
            {[
              "Confeitaria e doces",
              "Marmitas e salgados",
              "Artesanato e costura",
              "Beleza e serviços",
            ].map((item) => (
              <span key={item}>
                <CircleDollarSign aria-hidden="true" size={20} />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.pricingSection} id="planos">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionTag}>Comece grátis. Cresça no seu ritmo.</p>
            <h2>Um plano para cada fase do seu negócio.</h2>
            <p>
              Teste o fluxo completo sem pagar. Assine quando precisar remover limites ou
              profissionalizar mais.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`${styles.planCard} ${plan.featured ? styles.planFeatured : ""}`}
              >
                {plan.featured ? (
                  <span className={styles.planBadge}>Mais escolhido</span>
                ) : null}
                <h3>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
                <p className={styles.planPrice}>
                  {plan.price}
                  <small>{plan.period}</small>
                </p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check aria-hidden="true" size={17} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={PLAY_STORE_URL}
                  data-analytics={`play_store_plan_${plan.name.toLowerCase()}`}
                >
                  Começar com este plano
                  <ArrowRight aria-hidden="true" size={17} />
                </a>
              </article>
            ))}
          </div>
          <p className={styles.pricingNote}>
            Planos anuais disponíveis com dois meses de economia.
          </p>
        </section>

        <section className={styles.learningSection}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionTag}>Aprenda sem complicação</p>
            <h2>Preço e lucro explicados com exemplos reais.</h2>
            <p>Guias curtos para consultar quando surgir uma dúvida no seu negócio.</p>
          </div>
          <div className={styles.guidesGrid}>
            {guides.map((guide, index) => (
              <a href={guide.href} key={guide.href}>
                <span>0{index + 1}</span>
                <h3>{guide.title}</h3>
                <p>{guide.text}</p>
                <strong>
                  Continuar lendo <ArrowRight aria-hidden="true" size={17} />
                </strong>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.faqSection} id="duvidas">
          <div className={styles.faqIntro}>
            <p className={styles.sectionTag}>Perguntas frequentes</p>
            <h2>Antes de começar, talvez você queira saber.</h2>
            <p>Ficou com outra dúvida? Fale com a gente pelo e-mail.</p>
            <a href="mailto:contato@orionseven.com.br">contato@orionseven.com.br</a>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <ChevronDown aria-hidden="true" size={20} />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta}>
          <div>
            <p className={styles.sectionTag}>Seu talento merece dar lucro.</p>
            <h2>Seu próximo preço pode ser calculado com segurança.</h2>
            <p>Comece com um produto real do seu negócio. É grátis.</p>
          </div>
          <a
            className={styles.finalButton}
            href={PLAY_STORE_URL}
            data-analytics="play_store_final"
          >
            <Smartphone aria-hidden="true" size={20} />
            Baixar no Google Play
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
