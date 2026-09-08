import type { AppIconName } from "../components/app-icon";
import type { GuidanceArea } from "./guidance.domain";
export interface GuidancePreviewRow {
  icon: AppIconName;
  label: string;
  value?: string;
}
export interface GuidancePreview {
  heading: string;
  rows: readonly GuidancePreviewRow[];
}
export interface GuidanceContent {
  title: string;
  description: string;
  action: string;
  steps: readonly string[];
  next: string;
  preview: GuidancePreview;
}
export const guidanceContent: Record<GuidanceArea, GuidanceContent> = {
  home: {
    title: "O que você quer resolver agora?",
    description:
      "Escolha uma tarefa do seu negócio. Você pode conhecer as outras ferramentas depois.",
    action: "Escolher por onde começar",
    steps: [
      "Comece pelo objetivo que trouxe você ao aplicativo.",
      "Registre informações reais; não é preciso inventar uma venda para aprender.",
      "Quando houver registros, os resumos ajudam a acompanhar seu negócio.",
    ],
    next: "Retome sua prioridade ou confira o próximo compromisso.",
    preview: {
      heading: "Assim fica o seu dia",
      rows: [
        { icon: "trending-up", label: "Vendas hoje", value: "R$ 120,00" },
        { icon: "cash-outline", label: "Entradas", value: "R$ 150,00" },
      ],
    },
  },
  products: {
    title: "Cadastre o que você vende",
    description:
      "Informe nome, categoria e preço. Fotos, código e estoque podem ficar para depois.",
    action: "Cadastrar primeiro produto",
    steps: [
      "Dê um nome que você reconheça e escolha ou crie uma categoria.",
      "Informe o preço cobrado por unidade ou por peso, quando disponível.",
      "Abra os detalhes opcionais somente se precisar de fotos, estoque ou código.",
    ],
    next: "Calcule os custos ou use o produto em uma venda.",
    preview: {
      heading: "Assim fica o seu produto",
      rows: [
        { icon: "cube-outline", label: "Brigadeiro gourmet" },
        { icon: "pricetag-outline", label: "Categoria", value: "Doces" },
        { icon: "cash-outline", label: "Preço", value: "R$ 3,50" },
      ],
    },
  },
  services: {
    title: "Prepare seu primeiro atendimento",
    description: "Informe o serviço e sua duração. Você pode definir o preço depois.",
    action: "Cadastrar serviço",
    steps: [
      "Descreva o serviço que oferece e o tempo necessário para realizá-lo.",
      "Preencha preço e custos quando souber; o aplicativo sinaliza o que precisa de revisão.",
      "Configure local, intervalos e divulgação conforme sua forma de atender.",
    ],
    next: "Agende um atendimento para colocar o serviço na sua rotina.",
    preview: {
      heading: "Assim fica o seu serviço",
      rows: [
        { icon: "briefcase-outline", label: "Corte + escova" },
        { icon: "time-outline", label: "Duração", value: "45 min" },
      ],
    },
  },
  sales: {
    title: "Acompanhe o que você vendeu",
    description: "Registre uma venda para consultar os itens, o pagamento e o recibo.",
    action: "Registrar primeira venda",
    steps: [
      "Abra Nova venda e selecione os itens vendidos.",
      "Confirme a forma de pagamento e revise antes de registrar.",
      "Abra uma venda da lista para consultar detalhes e recibo.",
    ],
    next: "Confira o recebimento e o resultado do período.",
    preview: {
      heading: "Assim fica uma venda",
      rows: [
        { icon: "person-outline", label: "Maria Silva" },
        { icon: "cart-outline", label: "2 itens", value: "R$ 45,00" },
        { icon: "card-outline", label: "Pagamento", value: "Pix" },
      ],
    },
  },
  new_sale: {
    title: "Registre a venda passo a passo",
    description:
      "O cliente é opcional. Depois escolha os produtos, informe o pagamento e revise.",
    action: "Começar venda",
    steps: [
      "Escolha um cliente ou continue como venda avulsa.",
      "Adicione os produtos e quantidades. Se faltar um produto, cadastre aqui e continue.",
      "Confira o pagamento e o total antes de confirmar. Sem internet, acompanhe a sincronização.",
    ],
    next: "Abra Vendas para consultar o registro e preparar o recibo.",
    preview: {
      heading: "Assim fica a venda pronta",
      rows: [
        { icon: "cart-outline", label: "2 itens", value: "R$ 45,00" },
        { icon: "card-outline", label: "Pagamento", value: "Pix" },
        { icon: "checkmark-circle-outline", label: "Situação", value: "Concluída" },
      ],
    },
  },
  agenda: {
    title: "Organize seus próximos compromissos",
    description:
      "Informe título e data. Para atendimentos, escolha também serviço, horário e local. O cliente é opcional.",
    action: "Adicionar compromisso",
    steps: [
      "Informe o que será entregue ou realizado e a data combinada.",
      "Para um atendimento, selecione o serviço ou cadastre-o sem sair do formulário. Vincule o cliente se precisar.",
      "Registre valores e sinal somente quando fizerem parte do combinado.",
    ],
    next: "Consulte a agenda para acompanhar o compromisso.",
    preview: {
      heading: "Assim fica o seu compromisso",
      rows: [
        { icon: "calendar-outline", label: "Corte de cabelo" },
        { icon: "time-outline", label: "Horário", value: "14:00" },
        { icon: "person-outline", label: "Cliente", value: "Ana" },
      ],
    },
  },
  clients: {
    title: "Guarde seus contatos de trabalho",
    description: "Comece pelo nome. Telefone, endereço e observações são opcionais.",
    action: "Cadastrar cliente",
    steps: [
      "Use um nome que facilite encontrar a pessoa ou empresa.",
      "Adicione telefone e informações úteis quando precisar.",
      "Selecione o cliente ao registrar uma venda ou compromisso para relacionar o histórico.",
    ],
    next: "Vincule o contato à próxima venda ou atendimento.",
    preview: {
      heading: "Assim fica o seu cliente",
      rows: [
        { icon: "person-outline", label: "Ana Souza" },
        { icon: "call-outline", label: "Telefone", value: "(11) 90000-0000" },
      ],
    },
  },
  pricing: {
    title: "Descubra um preço com os custos que conhece",
    description:
      "Informe o custo por unidade e quanto deseja ganhar. Você pode calcular sem cadastrar uma ficha.",
    action: "Começar cálculo",
    steps: [
      "Some os materiais ou informe o custo de aquisição por unidade.",
      "Inclua embalagem ou acabamento e o ganho desejado. Informe taxas se houver.",
      "Confira o que ficou fora da estimativa. Mão de obra e gastos mensais exigem atenção; salvar é opcional.",
    ],
    next: "Confira as premissas antes de aplicar o preço ao seu produto ou serviço.",
    preview: {
      heading: "Assim fica o seu preço",
      rows: [
        { icon: "calculator-outline", label: "Custo", value: "R$ 10,00" },
        { icon: "trending-up", label: "Ganho desejado", value: "30%" },
        { icon: "cash-outline", label: "Preço sugerido", value: "R$ 14,30" },
      ],
    },
  },
  finance: {
    title: "Comece pelos movimentos do seu negócio",
    description: "Registre uma entrada ou uma despesa para acompanhar o período.",
    action: "Registrar entrada",
    steps: [
      "Escolha Entrada para dinheiro recebido ou Saída para um gasto.",
      "Informe valor, descrição e categoria. A data em branco usa o dia de hoje.",
      "O resumo considera os lançamentos do período. Custos ausentes deixam o resultado incompleto.",
    ],
    next: "Confira os movimentos e acrescente os gastos que ainda faltam.",
    preview: {
      heading: "Assim fica o seu lançamento",
      rows: [
        { icon: "cash-outline", label: "Entrada", value: "R$ 150,00" },
        { icon: "pricetag-outline", label: "Categoria", value: "Venda" },
      ],
    },
  },
  recurring_expenses: {
    title: "Lembre dos custos que se repetem",
    description:
      "Cadastre valor e vencimento mensal de um gasto fixo, conforme os recursos do seu plano.",
    action: "Adicionar gasto fixo",
    steps: [
      "Identifique um custo mensal, como aluguel, internet ou espaço de trabalho.",
      "Informe valor, categoria e dia do vencimento entre 1 e 28.",
      "Confira os lançamentos gerados no financeiro para o mês corrente.",
    ],
    next: "Considere esses custos ao analisar o resultado e formar preços.",
    preview: {
      heading: "Assim fica o seu gasto fixo",
      rows: [
        { icon: "wallet-outline", label: "Aluguel do espaço", value: "R$ 300,00" },
        { icon: "calendar-outline", label: "Vencimento", value: "Dia 10" },
      ],
    },
  },
  materials: {
    title: "Organize o que você utiliza no trabalho",
    description:
      "Cadastre um material e sua unidade de medida. Estoque e custo podem ser completados depois.",
    action: "Cadastrar material",
    steps: [
      "Dê um nome ao material e escolha a unidade em que será controlado.",
      "Confira se quantidade e custo usam a mesma unidade.",
      "Use o cadastro para acompanhar consumo ou compor uma ficha de custo.",
    ],
    next: "Monte a composição de um produto ou serviço com os materiais utilizados.",
    preview: {
      heading: "Assim fica o seu material",
      rows: [
        { icon: "cube-outline", label: "Farinha de trigo" },
        { icon: "scale-outline", label: "Unidade", value: "kg" },
      ],
    },
  },
  recipes: {
    title: "Entenda o custo de uma produção",
    description:
      "Reúna os materiais consumidos e o rendimento. Se faltar um material, cadastre e continue a ficha.",
    action: "Criar ficha de custo",
    steps: [
      "Identifique a preparação ou composição e a quantidade final produzida.",
      "Escolha os materiais e informe quanto de cada um é consumido.",
      "Confira unidades e rendimento para obter o custo por unidade.",
    ],
    next: "Leve o custo apurado para a precificação.",
    preview: {
      heading: "Assim fica a sua ficha",
      rows: [
        { icon: "beaker-outline", label: "Bolo de cenoura" },
        { icon: "cash-outline", label: "Custo por unidade", value: "R$ 4,20" },
      ],
    },
  },
  packaging: {
    title: "Inclua embalagem e acabamento na conta",
    description:
      "Cadastre o que acompanha cada unidade vendida para reutilizar esse custo no preço.",
    action: "Cadastrar embalagem ou acabamento",
    steps: [
      "Identifique a embalagem ou acabamento.",
      "Quando informar custo, use o valor de uma unidade, não do pacote inteiro.",
      "Selecione esse cadastro na precificação quando ele fizer parte do produto.",
    ],
    next: "Confira o custo total antes de definir seu preço.",
    preview: {
      heading: "Assim fica a sua embalagem",
      rows: [
        { icon: "cube-outline", label: "Caixa para bolo" },
        { icon: "cash-outline", label: "Custo unitário", value: "R$ 1,20" },
      ],
    },
  },
  suppliers: {
    title: "Tenha seus fornecedores à mão",
    description:
      "Comece pelo nome de quem abastece seu negócio. Contatos e imagem são opcionais.",
    action: "Cadastrar fornecedor",
    steps: [
      "Identifique o fornecedor e o tipo de fornecimento.",
      "Acrescente telefone e o que costuma comprar quando precisar.",
      "Vincule o fornecedor às compras para consultar seu histórico.",
    ],
    next: "Registre uma compra e acompanhe se ela já foi paga.",
    preview: {
      heading: "Assim fica o seu fornecedor",
      rows: [
        { icon: "business-outline", label: "Distribuidora Doce Sabor" },
        { icon: "call-outline", label: "Telefone", value: "(11) 98888-0000" },
      ],
    },
  },
  purchases: {
    title: "Acompanhe suas compras e pagamentos",
    description: "Informe o que comprou e o valor. O fornecedor é opcional.",
    action: "Registrar compra",
    steps: [
      "Descreva a compra e informe o valor e a data.",
      "Escolha A pagar ou Já paguei conforme a situação real.",
      "Confira as compras pendentes e marque o pagamento quando acontecer.",
    ],
    next: "Acompanhe as despesas no financeiro.",
    preview: {
      heading: "Assim fica a sua compra",
      rows: [
        { icon: "cart-outline", label: "Embalagens", value: "R$ 80,00" },
        { icon: "checkmark-circle-outline", label: "Situação", value: "A pagar" },
      ],
    },
  },
  fiado: {
    title: "Saiba o que ainda falta receber",
    description:
      "As vendas com saldo em aberto aparecem aqui. Comece registrando a venda a prazo.",
    action: "Registrar venda",
    steps: [
      "Registre a venda e identifique o cliente quando houver valor a receber.",
      "Consulte o saldo de cada cliente e as vendas relacionadas.",
      "Confirme um recebimento somente quando ele acontecer; revise qualquer cobrança antes de compartilhar.",
    ],
    next: "Confira se o saldo restante corresponde ao combinado.",
    preview: {
      heading: "Assim fica o fiado",
      rows: [
        { icon: "person-outline", label: "Ana Souza" },
        { icon: "wallet-outline", label: "Saldo em aberto", value: "R$ 35,00" },
      ],
    },
  },
  quotes: {
    title: "Prepare uma proposta para seu cliente",
    description:
      "Adicione itens e preços, mesmo sem produtos cadastrados. O cliente é opcional.",
    action: "Criar orçamento",
    steps: [
      "Dê um título à proposta e descreva os produtos ou serviços.",
      "Informe quantidades, preços e eventual desconto. Custos estimados ficam na visão interna.",
      "Revise total, validade e observações antes de salvar e compartilhar.",
    ],
    next: "Acompanhe a resposta e transforme a proposta aprovada em pedido.",
    preview: {
      heading: "Assim fica o seu orçamento",
      rows: [
        {
          icon: "document-text-outline",
          label: "Kit festa 20 docinhos",
          value: "R$ 180,00",
        },
        { icon: "calendar-outline", label: "Validade", value: "7 dias" },
      ],
    },
  },
  catalog: {
    title: "Prepare sua vitrine para os clientes",
    description:
      "Escolha produtos ou serviços e confira o contato. Um link publicado pode ainda estar sem conteúdo.",
    action: "Preparar vitrine",
    steps: [
      "Cadastre ao menos um produto ou serviço e escolha o que aparece na vitrine.",
      "Confira nome do negócio, apresentação e contato necessário para receber pedidos.",
      "Abra Ver como cliente antes de compartilhar o link.",
    ],
    next: "Compartilhe quando a oferta e o contato estiverem conferidos.",
    preview: {
      heading: "Assim fica a sua vitrine",
      rows: [
        { icon: "storefront-outline", label: "Loja publicada" },
        { icon: "logo-whatsapp", label: "Contato", value: "WhatsApp" },
      ],
    },
  },
  labels: {
    title: "Identifique seus produtos",
    description:
      "Escolha um produto e um modelo de etiqueta. Se faltar o produto, cadastre e retome aqui.",
    action: "Criar etiqueta",
    steps: [
      "Selecione o produto e confira o nome que será impresso.",
      "Escolha modelo e formato; datas e contato são opcionais.",
      "Confira a prévia antes de imprimir. A etiqueta de identificação não substitui exigências específicas do produto.",
    ],
    next: "Salve para reutilizar a etiqueta nas próximas impressões.",
    preview: {
      heading: "Assim fica a sua etiqueta",
      rows: [
        { icon: "pricetags-outline", label: "Brigadeiro gourmet" },
        { icon: "calendar-outline", label: "Validade", value: "10/09" },
      ],
    },
  },
  insights: {
    title: "Entenda seus resultados com registros reais",
    description:
      "Registre suas vendas para acompanhar os gráficos. Sem registros, ainda não há um resultado para analisar.",
    action: "Registrar venda",
    steps: [
      "Escolha um período que tenha movimentações.",
      "Compare vendas e itens com os registros do negócio.",
      "Confira a cobertura dos custos antes de interpretar o lucro. Uma tela vazia não indica prejuízo nem lucro zero.",
    ],
    next: "Use o resultado para decidir o que repor, revisar ou divulgar.",
    preview: {
      heading: "Assim fica o seu resultado",
      rows: [
        { icon: "trending-up", label: "Lucro do mês", value: "R$ 480,00" },
        { icon: "bar-chart", label: "Produto mais vendido", value: "Brigadeiro" },
      ],
    },
  },
};
