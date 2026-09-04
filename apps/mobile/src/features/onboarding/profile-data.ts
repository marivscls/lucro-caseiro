import type { AppIconName } from "../../shared/components/app-icon";

export type ProfileChoice = {
  value: string;
  label: string;
  detail: string;
  icon: AppIconName;
};
export const profileSegments: ProfileChoice[] = [
  {
    value: "food",
    label: "Comida e bebidas",
    detail: "Marmitas, salgados, refeições",
    icon: "restaurant-outline",
  },
  {
    value: "sweets",
    label: "Doces e confeitaria",
    detail: "Bolos, doces, encomendas",
    icon: "ice-cream-outline",
  },
  {
    value: "craft",
    label: "Artesanato e criação",
    detail: "Costura, peças, personalizados",
    icon: "color-palette-outline",
  },
  {
    value: "services",
    label: "Beleza e serviços",
    detail: "Atendimentos e cuidado",
    icon: "heart",
  },
  {
    value: "retail",
    label: "Comércio e revenda",
    detail: "Produtos prontos para vender",
    icon: "bag-handle-outline",
  },
  {
    value: "other",
    label: "Outro negócio",
    detail: "Meu trabalho não está aqui",
    icon: "storefront-outline",
  },
];
export const profileStages: ProfileChoice[] = [
  {
    value: "starting",
    label: "Estou começando",
    detail: "Quero preparar minhas primeiras vendas.",
    icon: "leaf-outline",
  },
  {
    value: "selling",
    label: "Já vendo de vez em quando",
    detail: "Quero organizar melhor o que faço.",
    icon: "bag-handle-outline",
  },
  {
    value: "growing",
    label: "Já tenho uma rotina de vendas",
    detail: "Quero acompanhar os resultados e crescer.",
    icon: "storefront-outline",
  },
];
export const profileGoals: ProfileChoice[] = [
  {
    value: "price",
    label: "Saber quanto cobrar",
    detail: "Colocar todos os custos na conta.",
    icon: "cash-outline",
  },
  {
    value: "orders",
    label: "Organizar minhas vendas",
    detail: "Ter pedidos e prazos em um só lugar.",
    icon: "checkmark-done-outline",
  },
  {
    value: "money",
    label: "Entender o que sobra",
    detail: "Enxergar entradas, gastos e resultado.",
    icon: "leaf-outline",
  },
  {
    value: "catalog",
    label: "Divulgar meu trabalho",
    detail: "Montar uma vitrine para compartilhar.",
    icon: "storefront-outline",
  },
];
export const profileChannels: ProfileChoice[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    detail: "Conversas e grupos",
    icon: "logo-whatsapp",
  },
  {
    value: "instagram",
    label: "Instagram",
    detail: "Publicações, stories e mensagens",
    icon: "camera-outline",
  },
  {
    value: "in_person",
    label: "Presencial",
    detail: "Loja, feiras ou atendimento local",
    icon: "location-outline",
  },
  {
    value: "referral",
    label: "Indicação",
    detail: "Clientes que recomendam meu trabalho",
    icon: "people-outline",
  },
];

export function stagesForProfile(segment: string): ProfileChoice[] {
  if (segment !== "services") return profileStages;
  return [
    { ...profileStages[0], detail: "Quero preparar meus primeiros atendimentos." },
    {
      ...profileStages[1],
      label: "Já atendo de vez em quando",
      detail: "Quero organizar melhor meus atendimentos.",
    },
    {
      ...profileStages[2],
      label: "Já tenho uma rotina de atendimentos",
      detail: "Quero acompanhar os resultados e crescer.",
    },
  ];
}

export function goalsForProfile(segment: string): ProfileChoice[] {
  if (segment !== "services") return profileGoals;
  return profileGoals.map((goal) => {
    if (goal.value === "orders")
      return {
        ...goal,
        label: "Organizar meus atendimentos",
        detail: "Ter clientes e horários em um só lugar.",
      };
    if (goal.value === "catalog")
      return {
        ...goal,
        label: "Divulgar meus serviços",
        detail: "Apresentar o que faço aos clientes.",
      };
    return goal;
  });
}
export const profileSteps = [
  {
    label: "Você",
    title: "Como podemos te chamar?",
    description: "Vamos deixar o Lucro Caseiro com a sua cara. Começando pelo básico.",
  },
  {
    label: "Seu negócio",
    title: "O que você faz por aí?",
    description: "Escolha o que mais se aproxima do seu trabalho.",
  },
  {
    label: "Seu momento",
    title: "Em que momento você está?",
    description: "Cada negócio tem seu próprio ritmo. Qual é o seu?",
  },
  {
    label: "Seus clientes",
    title: "Como os clientes chegam até você?",
    description: "Pode marcar mais de uma opção. Se ainda não divulga, é só continuar.",
  },
  {
    label: "Seu objetivo",
    title: "O que você quer resolver primeiro?",
    description: "Escolha uma prioridade. O resto pode vir depois.",
  },
];
export type BusinessProfileAnswers = {
  name: string;
  business: string;
  segment: string;
  stage: string;
  goal: string;
  channels: string[];
};
export const emptyBusinessProfile: BusinessProfileAnswers = {
  name: "",
  business: "",
  segment: "",
  stage: "",
  goal: "",
  channels: [],
};

export function toggleProfileChannel(channels: string[], channel: string): string[] {
  return channels.includes(channel)
    ? channels.filter((item) => item !== channel)
    : [...channels, channel];
}

export function profileRecommendation(profile: BusinessProfileAnswers) {
  const nouns: Record<string, string> = {
    services: "serviço",
    food: "prato",
    sweets: "doce",
    craft: "peça",
  };
  const noun = nouns[profile.segment] ?? "produto";
  const item = profile.segment === "craft" ? `uma ${noun}` : `um ${noun}`;
  const service = profile.segment === "services";
  const recommendations: Record<
    string,
    {
      title: string;
      text: string;
      action: string;
      route:
        | "/pricing"
        | "/services?create=onboarding"
        | "/tabs/new-sale"
        | "/agenda"
        | "/tabs/finance"
        | "/catalog";
    }
  > = {
    price: {
      title: `Comece pelo preço de ${item}`,
      text: `Separe os custos de ${item} e o tempo que você dedica a esse trabalho. Essa é a base para saber quanto cobrar.`,
      action: service ? "Cadastrar um serviço" : "Calcular meu primeiro preço",
      route: service ? "/services?create=onboarding" : "/pricing",
    },
    orders: {
      title:
        profile.stage === "starting"
          ? "Prepare sua primeira venda"
          : "Organize a próxima venda",
      text: "Reúna o que foi combinado: cliente, valor e prazo. Assim, cada pedido fica mais fácil de acompanhar.",
      action: "Organizar uma venda",
      route: "/tabs/new-sale",
    },
    money: {
      title: "Olhe para o dinheiro desta semana",
      text: "Comece anotando o que entrou e o que saiu. Um período curto já ajuda a entender sua rotina.",
      action: "Ver meu financeiro",
      route: "/tabs/finance",
    },
    catalog: {
      title: `Sua vitrine começa com ${item}`,
      text: "Escolha uma boa foto, escreva uma descrição clara e defina o preço antes de compartilhar.",
      action: service ? "Cadastrar um serviço" : "Montar meu catálogo",
      route: service ? "/services?create=onboarding" : "/catalog",
    },
  };
  const recommendation = recommendations[profile.goal];
  if (!recommendation) return undefined;
  if (service && profile.goal === "orders")
    return {
      ...recommendation,
      title: "Organize seu próximo atendimento",
      text: "Reúna o nome do cliente, o serviço e o horário combinado para preparar sua agenda.",
      action: "Abrir minha agenda",
      route: "/agenda" as const,
    };
  if (service && profile.goal === "catalog")
    return {
      ...recommendation,
      text: "Comece pelo nome, preço e duração de um serviço. Depois, apresente seu trabalho nos canais que você usa.",
    };
  if (profile.goal === "catalog" && profile.channels.includes("whatsapp"))
    return {
      ...recommendation,
      text: `${recommendation.text} O link do catálogo pode acompanhar suas conversas no WhatsApp.`,
    };
  if (profile.goal === "catalog" && profile.channels.includes("instagram"))
    return {
      ...recommendation,
      text: `${recommendation.text} Use o link do catálogo na divulgação pelo Instagram.`,
    };
  return recommendation;
}
