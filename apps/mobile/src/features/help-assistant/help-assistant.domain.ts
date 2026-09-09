import { PLAN_LABELS, PLAN_LIMITS, PLAN_PRICING } from "@lucro-caseiro/contracts";

export interface HelpAnswer {
  kind: "guide" | "handoff" | "unknown";
  text: string;
  steps: string[];
  action?: {
    label: string;
    route:
      | "/products"
      | "/services"
      | "/pricing"
      | "/plans"
      | "/finance"
      | "/recipes"
      | "/materials"
      | "/catalog"
      | "/tabs/new-sale"
      | "/tabs/clients"
      | "/tabs/agenda"
      | "/settings";
  };
}

function has(question: string, terms: readonly string[]): boolean {
  return terms.some((term) => question.includes(term));
}

function planPrice(plan: keyof typeof PLAN_PRICING): string {
  const { monthly, annual } = PLAN_PRICING[plan];
  return `R$ ${monthly.toFixed(2).replace(".", ",")}/mês ou R$ ${annual.toFixed(2).replace(".", ",")}/ano`;
}

export const HELP_SUGGESTIONS = [
  "Como calculo meu preço?",
  "Como cadastro um produto?",
  "Como registro uma venda?",
  "Como compartilho meu catálogo?",
];

export function answerHelpQuestion(question: string, profile: string): HelpAnswer {
  const q = question
    .slice(0, 400)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const service = profile === "beauty" || profile === "services";
  if (
    has(q, [
      "erro",
      "travou",
      "travando",
      "nao funciona",
      "nao consigo",
      "nao abre",
      "sumiu",
      "desapareceu",
      "duplicou",
      "cobranca duplicada",
      "reembolso",
      "estorno",
    ])
  ) {
    return {
      kind: "handoff",
      text: "Para entender o que aconteceu, precisamos da ajuda da equipe. Toque em Falar por email e conte em qual tela ocorreu. Sua pergunta já vai no rascunho para você revisar.",
      steps: [],
    };
  }
  if (
    has(q, ["cancelar", "cancelo", "cancelamento"]) &&
    has(q, ["assinatura", "plano", "cobranca"])
  ) {
    return {
      kind: "guide",
      text: "O caminho depende de onde você contratou a assinatura.",
      steps: [
        "Confira o recibo para identificar o provedor.",
        "Google Play: abra Assinaturas na loja e gerencie o plano por lá.",
        "Stripe: fale com a equipe por email para solicitar o cancelamento. Apagar a conta não cancela a assinatura.",
      ],
    };
  }
  // Subscription questions take precedence over product pricing and feature guides.
  // Keep incidents and cancellation above this comparison.
  if (
    /\b(planos?|assinaturas?|assinar|essencial|profissional|premium|gratuito|gratis)\b/.test(
      q,
    )
  ) {
    return {
      kind: "guide",
      text: "Temos três planos disponíveis. Os planos pagos têm opções mensal e anual.",
      steps: [
        `${PLAN_LABELS.free}: sem mensalidade, com até ${PLAN_LIMITS.free.maxSalesPerMonth} vendas por mês, ${PLAN_LIMITS.free.maxClients} clientes e ${PLAN_LIMITS.free.maxProducts} produtos.`,
        `${PLAN_LABELS.essential}: ${planPrice("essential")}. Vendas, clientes e produtos ilimitados, catálogo completo e personalizado e resumo do mês em PDF.`,
        `${PLAN_LABELS.professional}: ${planPrice("professional")}. Tudo do Essencial, mais relatórios avançados, exportação em PDF/Excel, compras e suporte prioritário.`,
        "Toque em Ver planos para comparar os recursos e conferir o valor antes de assinar.",
      ],
      action: { label: "Ver planos", route: "/plans" },
    };
  }
  if (
    has(q, ["senha", "login", "entrar na conta", "troquei de celular", "outro celular"])
  ) {
    return {
      kind: "guide",
      text: "Use o mesmo email do cadastro para acessar sua conta.",
      steps: [
        "Se esqueceu a senha, use a recuperação na tela de login e confira seu email.",
        "Ao trocar de aparelho, entre com a mesma conta para acessar seus registros.",
        "Se ainda tiver dificuldade, fale por email. Não envie sua senha.",
      ],
    };
  }
  if (
    has(q, ["lucro", "financeiro", "caixa", "faturamento", "despesa", "gasto"]) &&
    !has(q, ["preco", "cobrar", "precifica", "custo"])
  ) {
    return {
      kind: "guide",
      text: "Eu explico como usar o app, mas não consulto os dados da sua conta.",
      steps: [
        "Abra o Financeiro e selecione o período que deseja conferir.",
        "Revise as entradas e despesas registradas. Uma venda paga gera sua entrada vinculada.",
        "Confira se os custos e gastos estão completos antes de interpretar os resultados.",
      ],
      action: { label: "Abrir Financeiro", route: "/finance" },
    };
  }
  if (has(q, ["preco", "cobrar", "precifica", "margem", "calcular custo"])) {
    return service
      ? {
          kind: "guide",
          text: "Para um atendimento, considere os custos e o seu tempo.",
          steps: [
            "Abra Serviços e escolha ou cadastre o serviço.",
            "Informe os materiais utilizados, a duração e os custos do atendimento.",
            "Revise o preço e salve as informações.",
          ],
          action: { label: "Abrir Serviços", route: "/services" },
        }
      : {
          kind: "guide",
          text: "Comece reunindo os custos de um produto.",
          steps: [
            "Inclua materiais ou ingredientes, embalagem e outras despesas.",
            "Abra Precificação e preencha os custos conforme o seu negócio.",
            "Revise o resultado antes de salvar e usar o preço nas vendas.",
          ],
          action: { label: "Abrir Precificação", route: "/pricing" },
        };
  }
  if (has(q, ["catalogo", "vitrine", "divulgar"])) {
    return {
      kind: "guide",
      text: "O catálogo reúne os itens que você quer mostrar aos clientes.",
      steps: [
        "Abra Catálogo e confira os itens que serão exibidos.",
        "Revise as informações e ative o catálogo nas configurações da tela.",
        "Use a opção de compartilhar o link para enviar aos clientes. Alguns recursos dependem do seu plano.",
      ],
      action: { label: "Abrir Catálogo", route: "/catalog" },
    };
  }
  if (has(q, ["receita", "ficha tecnica"])) {
    return {
      kind: "guide",
      text: "A receita ajuda a organizar os ingredientes e o rendimento da produção.",
      steps: [
        "Cadastre os insumos em Materiais com suas unidades e custos.",
        "Em Receitas, informe os ingredientes usados e o rendimento.",
        "Revise o custo por unidade antes de usar a receita na precificação.",
      ],
      action: { label: "Abrir Receitas", route: "/recipes" },
    };
  }
  if (has(q, ["material", "ingrediente", "insumo"])) {
    return {
      kind: "guide",
      text: "Cadastre os materiais que você utiliza para acompanhar os custos.",
      steps: [
        "Informe o nome, a unidade de medida e o custo de compra.",
        "Confira a quantidade por unidade para evitar diferenças no cálculo.",
        "Use esses materiais nas receitas ou fichas de custo.",
      ],
      action: { label: "Abrir Materiais", route: "/materials" },
    };
  }
  if (has(q, ["produto", "mercadoria", "item para vender"])) {
    return {
      kind: "guide",
      text: "Você pode começar com as informações básicas do produto.",
      steps: [
        "Abra Produtos e toque na opção de cadastrar.",
        "Preencha nome, categoria e preço.",
        "Revise e salve. Foto, código e detalhes de estoque podem ser preenchidos depois.",
      ],
      action: { label: "Abrir Produtos", route: "/products" },
    };
  }
  if (has(q, ["servico", "atendimento", "agendar", "agenda", "encomenda", "pedido"])) {
    return {
      kind: "guide",
      text: "Use a Agenda para organizar os próximos compromissos.",
      steps: [
        "Abra a Agenda e escolha o dia.",
        "Selecione o tipo de registro e preencha cliente, data e detalhes solicitados.",
        "Revise as informações antes de salvar.",
      ],
      action: { label: "Abrir Agenda", route: "/tabs/agenda" },
    };
  }
  if (has(q, ["venda", "vender", "vendido"])) {
    return {
      kind: "guide",
      text: "Registre uma venda real para acompanhar o movimento do negócio.",
      steps: [
        "Abra Nova venda e selecione os itens vendidos.",
        "Confira quantidades, cliente e forma de pagamento.",
        "Finalize a venda. Se estiver paga, a entrada fica vinculada no Financeiro.",
      ],
      action: { label: "Abrir Nova venda", route: "/tabs/new-sale" },
    };
  }
  if (has(q, ["cliente"])) {
    return {
      kind: "guide",
      text: "Cadastre seus clientes para localizar os contatos nas próximas vendas.",
      steps: [
        "Abra Clientes e escolha a opção de cadastrar.",
        "Informe o nome e os dados de contato disponíveis.",
        "Confira o telefone e salve.",
      ],
      action: { label: "Abrir Clientes", route: "/tabs/clients" },
    };
  }
  return {
    kind: "unknown",
    text: "Ainda não encontrei uma orientação para essa pergunta. Tente dizer a tarefa, como “cadastrar produto” ou “calcular preço”. Se preferir, fale com a equipe por email.",
    steps: [],
  };
}
