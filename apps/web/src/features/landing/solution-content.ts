import { ESSENTIAL_TRIAL_DAYS } from "@lucro-caseiro/contracts";

/**
 * Páginas por funcionalidade e por tipo de negócio (SEO). Cada uma responde a
 * uma busca ("controle de fiado", "app para confeitaria") e leva ao cadastro.
 * Só descreva o que o app faz hoje (ver ai.context.* das features).
 */
export type SolutionSlug =
  | "controle-de-fiado"
  | "app-para-confeitaria"
  | "catalogo-digital-whatsapp"
  | "controle-de-vendas"
  | "app-para-marmita"
  | "app-para-manicure";

export type SolutionContent = {
  readonly slug: SolutionSlug;
  /** Título da aba e do Google (até ~60 caracteres). */
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly example: {
    readonly heading: string;
    readonly rows: readonly { readonly label: string; readonly value: string }[];
    readonly totalLabel: string;
    readonly total: string;
  };
  readonly image: { readonly src: string; readonly alt: string };
  readonly benefits: readonly { readonly title: string; readonly text: string }[];
  readonly steps: readonly string[];
  readonly faqs: readonly { readonly question: string; readonly answer: string }[];
  readonly related: readonly SolutionSlug[];
};

export const SOLUTION_LABELS: Record<SolutionSlug, string> = {
  "controle-de-fiado": "Controle de fiado",
  "app-para-confeitaria": "App para confeitaria",
  "catalogo-digital-whatsapp": "Catálogo no WhatsApp",
  "controle-de-vendas": "Controle de vendas",
  "app-para-marmita": "App para marmitas",
  "app-para-manicure": "App para manicure e beleza",
};

const freeAnswer = `Sim. Crie a conta grátis no Android ou no navegador. Toda conta nova ainda ganha ${ESSENTIAL_TRIAL_DAYS} dias do Essencial, sem cartão.`;

export const SOLUTIONS: Record<SolutionSlug, SolutionContent> = {
  "controle-de-fiado": {
    slug: "controle-de-fiado",
    metaTitle: "Controle de fiado grátis no celular",
    metaDescription:
      "Troque o caderno de fiado pelo celular: anote quem te deve, veja o total em aberto e cobre pelo WhatsApp. Grátis e salvo na nuvem.",
    eyebrow: "Controle de fiado",
    title: "Saiba quem te deve, sem caderno.",
    lead: "Anote a venda no fiado em segundos, veja quanto cada cliente deve e mande a cobrança pelo WhatsApp com uma mensagem pronta. Tudo fica salvo na sua conta, mesmo se o celular quebrar.",
    example: {
      heading: "Fiado em aberto",
      rows: [
        { label: "Dona Marta · 2 vendas", value: "R$ 64,00" },
        { label: "Júlia · bolo de pote", value: "R$ 24,00" },
        { label: "Seu Antônio · marmitas", value: "R$ 90,00" },
      ],
      totalLabel: "Para receber",
      total: "R$ 178,00",
    },
    image: {
      src: "/landing/current-finance.png",
      alt: "Tela financeira do Lucro Caseiro com entradas, saídas e o que sobrou no mês",
    },
    benefits: [
      {
        title: "Grátis em todos os planos",
        text: "O fiado não tem limite de uso no plano Gratuito. Você não paga nada para organizar o que tem a receber.",
      },
      {
        title: "Cobrança pelo WhatsApp",
        text: "Um toque abre o WhatsApp do cliente com a mensagem de cobrança pronta. Sem vergonha e sem esquecer ninguém.",
      },
      {
        title: "Salvo na nuvem",
        text: "Caderno molha, some e rasga. Aqui os valores ficam na sua conta e aparecem em qualquer celular ou computador.",
      },
    ],
    steps: [
      "Registre a venda e marque o pagamento como pendente.",
      "Veja na tela de fiado quem deve e quanto, do mais antigo ao mais novo.",
      "Toque em Cobrar no WhatsApp e marque como pago quando o dinheiro entrar.",
    ],
    faqs: [
      {
        question: "O controle de fiado é grátis mesmo?",
        answer:
          "Sim. O fiado está incluído no plano Gratuito, sem limite de vendas registradas.",
      },
      {
        question: "Perco o fiado se trocar de celular?",
        answer:
          "Não. Tudo fica salvo na sua conta. No celular novo, é só entrar com o mesmo e-mail.",
      },
      {
        question: "Preciso ter o WhatsApp do cliente?",
        answer:
          "Não é obrigatório. Com o número salvo, a cobrança abre direto na conversa. Sem ele, você escolhe para quem enviar a mensagem.",
      },
    ],
    related: ["controle-de-vendas", "app-para-marmita", "app-para-confeitaria"],
  },
  "app-para-confeitaria": {
    slug: "app-para-confeitaria",
    metaTitle: "App para confeitaria: preço, encomendas e fiado",
    metaDescription:
      "Calcule o preço do bolo e do doce com ingredientes, embalagem e seu tempo. Organize encomendas, vendas e fiado no celular. Comece grátis.",
    eyebrow: "Para confeitaria",
    title: "O preço certo do seu bolo, e o que sobra de cada encomenda.",
    lead: "Coloque a receita uma vez e o app calcula o custo com ingredientes, embalagem, gás e o seu tempo. Depois, a mesma conta vira produto, catálogo e venda, sem digitar tudo de novo.",
    example: {
      heading: "Bolo de pote · exemplo",
      rows: [
        { label: "Ingredientes", value: "R$ 4,20" },
        { label: "Pote e colher", value: "R$ 1,30" },
        { label: "Seu tempo", value: "R$ 2,50" },
        { label: "Gás e energia", value: "R$ 0,60" },
      ],
      totalLabel: "Preço sugerido",
      total: "R$ 12,90",
    },
    image: {
      src: "/landing/current-pricing.png",
      alt: "Precificação do Lucro Caseiro com custo, preço sugerido e lucro por unidade",
    },
    benefits: [
      {
        title: "Receita com custo automático",
        text: "Informe quanto pagou no pacote e quanto usou. O app divide pelo rendimento e mostra o custo de cada doce.",
      },
      {
        title: "Agenda de encomendas",
        text: "Veja as entregas da semana em um só lugar e não esqueça aquele bolo de aniversário.",
      },
      {
        title: "Catálogo para o WhatsApp",
        text: "Mostre seus doces com foto e preço num link. A cliente escolhe e o pedido chega no seu WhatsApp.",
      },
    ],
    steps: [
      "Cadastre a receita com ingredientes, embalagem e tempo de preparo.",
      "Veja o preço sugerido e quanto sobra por unidade.",
      "Transforme em produto, publique no catálogo e registre as vendas.",
    ],
    faqs: [
      {
        question: "Serve para bolo, doce e salgado?",
        answer:
          "Sim. Qualquer receita com ingredientes e rendimento funciona: bolos, brigadeiros, bolo de pote, salgados e tortas.",
      },
      {
        question: "Dá para colocar o valor da minha hora?",
        answer:
          "Sim. Você informa quanto quer ganhar por hora e o tempo de preparo. Esse valor entra no custo, em todos os planos.",
      },
      { question: "Posso começar grátis?", answer: freeAnswer },
    ],
    related: ["catalogo-digital-whatsapp", "controle-de-fiado", "app-para-marmita"],
  },
  "catalogo-digital-whatsapp": {
    slug: "catalogo-digital-whatsapp",
    metaTitle: "Catálogo digital com pedido pelo WhatsApp",
    metaDescription:
      "Monte seu catálogo com foto e preço e compartilhe um link. O cliente escolhe e o pedido chega no seu WhatsApp, sem comissão. Comece grátis.",
    eyebrow: "Catálogo no WhatsApp",
    title: "Seu catálogo num link. O pedido chega no WhatsApp.",
    lead: "Os produtos que você já cadastrou viram uma vitrine com foto e preço. Mande o link no status, no grupo ou na bio do Instagram. O cliente escolhe e inicia o pedido na sua conversa.",
    example: {
      heading: "Pedido pelo catálogo",
      rows: [
        { label: "2 × Caixa de brigadeiros", value: "R$ 60,98" },
        { label: "1 × Bolo de pote", value: "R$ 12,90" },
      ],
      totalLabel: "Total do pedido",
      total: "R$ 73,88",
    },
    image: {
      src: "/landing/current-catalog.png",
      alt: "Catálogo do Lucro Caseiro pronto para compartilhar pelo WhatsApp",
    },
    benefits: [
      {
        title: "Sem comissão por venda",
        text: "O pedido vai para o seu WhatsApp e o pagamento é combinado entre vocês. O Lucro Caseiro não cobra taxa por pedido.",
      },
      {
        title: "Sem cadastrar duas vezes",
        text: "O produto que saiu da precificação já tem foto, preço e descrição. É só escolher o que aparece no catálogo.",
      },
      {
        title: "Com a sua cara",
        text: "No Essencial, o catálogo fica completo e personalizado, com capa, cores e mais fotos por produto.",
      },
    ],
    steps: [
      "Cadastre os produtos com foto e preço.",
      "Escolha quais aparecem no catálogo e copie o link.",
      "Compartilhe no WhatsApp e no Instagram e receba os pedidos na conversa.",
    ],
    faqs: [
      {
        question: "Quantos produtos cabem no catálogo grátis?",
        answer:
          "No Gratuito, até 3 produtos publicados. No Essencial e no Profissional, o catálogo é completo e personalizado.",
      },
      {
        question: "O cliente precisa baixar algum app?",
        answer: "Não. O catálogo abre no navegador do celular, direto pelo link.",
      },
      {
        question: "O Lucro Caseiro cobra comissão?",
        answer: "Não. Não existe taxa por pedido ou por venda.",
      },
    ],
    related: ["app-para-confeitaria", "controle-de-vendas", "app-para-manicure"],
  },
  "controle-de-vendas": {
    slug: "controle-de-vendas",
    metaTitle: "Controle de vendas no celular, grátis",
    metaDescription:
      "Anote cada venda em poucos toques e veja quanto entrou, quanto saiu e quanto sobrou no mês. Vendas ilimitadas no plano grátis.",
    eyebrow: "Controle de vendas",
    title: "Do caderno para o celular, sem complicação.",
    lead: "Anote a venda em poucos toques, com cliente, produto e forma de pagamento. No fim do mês, o app mostra quanto entrou, quanto saiu e quanto realmente sobrou para você.",
    example: {
      heading: "Resumo do mês · exemplo",
      rows: [
        { label: "Vendas", value: "R$ 3.240,00" },
        { label: "Gastos", value: "R$ 1.380,00" },
        { label: "A receber no fiado", value: "R$ 178,00" },
      ],
      totalLabel: "Sobrou",
      total: "R$ 1.860,00",
    },
    image: {
      src: "/landing/current-finance.png",
      alt: "Tela financeira do Lucro Caseiro com lucro, entradas e saídas do mês",
    },
    benefits: [
      {
        title: "Vendas ilimitadas no grátis",
        text: "Registre todas as vendas do mês sem pagar nada. O hábito de anotar nunca trava.",
      },
      {
        title: "Venda rápida no dinheiro",
        text: "Vendeu um item no balcão? Registre em um toque, sem passar por todas as etapas.",
      },
      {
        title: "Lucro, não só caixa",
        text: "Como cada produto tem custo, o app mostra quanto sobrou de verdade, não só quanto entrou.",
      },
    ],
    steps: [
      "Escolha os produtos e o cliente, se quiser.",
      "Marque como pago, pendente ou no fiado.",
      "Acompanhe o resumo do mês e o que ainda falta receber.",
    ],
    faqs: [
      {
        question: "Existe limite de vendas no plano grátis?",
        answer: "Não. As vendas são ilimitadas em todos os planos.",
      },
      {
        question: "Funciona sem internet?",
        answer:
          "Sim. Se a internet cair, a venda fica guardada no celular e é enviada quando a conexão voltar.",
      },
      { question: "Posso começar grátis?", answer: freeAnswer },
    ],
    related: ["controle-de-fiado", "catalogo-digital-whatsapp", "app-para-marmita"],
  },
  "app-para-marmita": {
    slug: "app-para-marmita",
    metaTitle: "App para vender marmita: preço, vendas e fiado",
    metaDescription:
      "Calcule o preço da marmita com gás, embalagem e entrega. Anote as vendas do dia e o fiado dos clientes fixos no celular. Comece grátis.",
    eyebrow: "Para marmitas e salgados",
    title: "Quanto cobrar na marmita, e quanto sobra no fim do mês.",
    lead: "Gás, embalagem, talher e entrega somem da conta sem você perceber. Coloque tudo uma vez, veja o preço certo e anote as vendas e o fiado dos clientes fixos no mesmo app.",
    example: {
      heading: "Marmita de 500 g · exemplo",
      rows: [
        { label: "Ingredientes", value: "R$ 7,40" },
        { label: "Embalagem e talher", value: "R$ 1,60" },
        { label: "Seu tempo", value: "R$ 3,00" },
        { label: "Gás e energia", value: "R$ 1,10" },
      ],
      totalLabel: "Preço sugerido",
      total: "R$ 19,65",
    },
    image: {
      src: "/landing/current-pricing.png",
      alt: "Precificação do Lucro Caseiro com custo, preço sugerido e lucro por unidade",
    },
    benefits: [
      {
        title: "Custo da produção do dia",
        text: "Informe a receita e quantas marmitas rende. O app divide o gás, a energia e o seu tempo por unidade.",
      },
      {
        title: "Fiado dos clientes fixos",
        text: "Quem paga no fim da semana fica anotado, com o total em aberto e a cobrança pronta no WhatsApp.",
      },
      {
        title: "Cardápio num link",
        text: "Publique as opções do dia no catálogo e receba os pedidos pelo WhatsApp.",
      },
    ],
    steps: [
      "Monte a receita com ingredientes e rendimento.",
      "Some embalagem, gás e tempo e veja o preço sugerido.",
      "Anote as vendas do dia e o fiado de quem paga depois.",
    ],
    faqs: [
      {
        question: "Dá para colocar o custo da entrega?",
        answer:
          "Sim. Some o gasto com a entrega junto da embalagem e ele entra no preço sugerido.",
      },
      {
        question: "Serve para salgados e congelados?",
        answer:
          "Sim. Qualquer produção com receita e rendimento funciona do mesmo jeito.",
      },
      { question: "Posso começar grátis?", answer: freeAnswer },
    ],
    related: ["controle-de-fiado", "controle-de-vendas", "app-para-confeitaria"],
  },
  "app-para-manicure": {
    slug: "app-para-manicure",
    metaTitle: "App para manicure: preço do serviço e agenda",
    metaDescription:
      "Calcule o preço do atendimento com material e seu tempo, organize horários e clientes e controle o fiado. Para manicure, cabelo e estética.",
    eyebrow: "Para manicure e beleza",
    title: "O preço justo do seu atendimento, com o seu tempo na conta.",
    lead: "Esmalte, lixa, algodão e material descartável somam mais do que parece. Coloque o custo e a duração de cada serviço e veja quanto cobrar. Depois, organize clientes, horários e o que ainda falta receber.",
    example: {
      heading: "Pé e mão · exemplo",
      rows: [
        { label: "Material", value: "R$ 6,50" },
        { label: "Descartáveis", value: "R$ 2,00" },
        { label: "Seu tempo · 1h30", value: "R$ 30,00" },
        { label: "Aluguel e energia", value: "R$ 4,00" },
      ],
      totalLabel: "Preço sugerido",
      total: "R$ 59,50",
    },
    image: {
      src: "/landing/current-pricing.png",
      alt: "Precificação do Lucro Caseiro com custo, preço sugerido e lucro",
    },
    benefits: [
      {
        title: "Serviços e pacotes",
        text: "Cadastre cada serviço com duração, adicionais e pacotes, e veja o custo e o preço sugerido.",
      },
      {
        title: "Agenda de atendimentos",
        text: "Veja os horários do dia e da semana em um só lugar.",
      },
      {
        title: "Clientes e fiado",
        text: "Histórico de cada cliente, aniversário e quem ficou de pagar depois.",
      },
    ],
    steps: [
      "Cadastre o serviço com material e duração.",
      "Veja o preço sugerido com o seu tempo incluído.",
      "Organize os horários e anote cada atendimento como venda.",
    ],
    faqs: [
      {
        question: "Serve para cabeleireira, lash e sobrancelha?",
        answer:
          "Sim. Qualquer serviço com material e tempo funciona: cabelo, cílios, sobrancelha, estética e outros.",
      },
      {
        question: "Dá para vender pacotes?",
        answer: "Sim. Você pode montar pacotes e adicionais para cada serviço.",
      },
      { question: "Posso começar grátis?", answer: freeAnswer },
    ],
    related: ["controle-de-fiado", "catalogo-digital-whatsapp", "controle-de-vendas"],
  },
};
