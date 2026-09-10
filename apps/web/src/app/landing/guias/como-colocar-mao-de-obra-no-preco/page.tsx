import { publicMetadata } from "@/features/landing/public-metadata";
import type { Metadata } from "next";

import { GuidePage } from "@/features/landing/guide-page";
import { publicPageStyles as styles } from "@/features/landing/public-page";

const title = "Como colocar sua mão de obra no preço do produto";
const description =
  "Aprenda a transformar tempo de produção em custo e parar de trabalhar de graça.";

export const metadata: Metadata = publicMetadata({
  title,
  description,
  alternates: { canonical: "/landing/guias/como-colocar-mao-de-obra-no-preco" },
});

export default function LaborPricingGuidePage() {
  return (
    <GuidePage
      title={title}
      description={description}
      slug="como-colocar-mao-de-obra-no-preco"
    >
      <p className={styles.articleLead}>
        O dinheiro que sobra depois dos materiais não é automaticamente o pagamento pelo
        seu trabalho. Mão de obra é custo; lucro é o retorno do negócio depois que esse
        custo foi pago.
      </p>
      <h2>Defina o valor da sua hora</h2>
      <p>
        Comece pela renda mensal que deseja receber pelo trabalho e pelas horas produtivas
        que realmente consegue vender. Nem toda hora do mês vira produção: compras,
        atendimento e organização também ocupam tempo.
      </p>
      <div className={styles.formula}>
        Valor da hora = remuneração mensal desejada ÷ horas produtivas
      </div>
      <p>
        Por exemplo, R$ 2.400 de remuneração desejada divididos por 100 horas produtivas
        resultam em R$ 24 por hora. É um ponto de partida para planejar, não uma promessa
        de renda. Se você só consegue vender 60 horas, a mesma remuneração exigiria R$ 40
        por hora. Compare essa necessidade com a demanda e a capacidade real do negócio.
      </p>
      <h2>Meça o tempo completo</h2>
      <p>
        Conte preparo, produção, acabamento e embalagem. Em encomendas personalizadas,
        inclua o tempo de conversa, planejamento e alterações. Use uma média realista de
        várias produções.
      </p>
      <h2>Transforme minutos em custo</h2>
      <p>
        Se sua hora vale R$ 24 e o produto consome 45 minutos, divida 45 por 60 e
        multiplique pelo valor da hora. A mão de obra desse produto será R$ 18.
      </p>
      <div className={styles.formula}>45 ÷ 60 × R$ 24 = R$ 18 de mão de obra</div>
      <h2>Quando a receita rende várias unidades</h2>
      <p>
        Calcule o tempo do lote inteiro e divida pelo rendimento. Se 90 minutos produzem
        30 doces, distribua o custo de 90 minutos entre as 30 unidades.
      </p>
      <div className={styles.formula}>
        90 ÷ 60 × R$ 24 = R$ 36 por lote; R$ 36 ÷ 30 = R$ 1,20 por doce
      </div>
      <p>
        Na calculadora, informe 3 minutos por doce e R$ 24 por hora. Não informe os 90
        minutos do lote como se fossem de cada doce. Se a unidade de venda for o lote
        inteiro, aí sim use 90 minutos e também todos os materiais desse lote.
      </p>
      <h2>Do tempo ao preço final</h2>
      <p>
        Imagine uma peça com R$ 12 de materiais, R$ 2 de embalagem, R$ 18 de trabalho e R$
        3 de gastos fixos rateados. O custo total é R$ 35. Com lucro de 40% sobre o custo,
        o preço-base fica R$ 49. Se houver uma taxa de venda de 2%, o preço final será R$
        49 ÷ 0,98 = R$ 50.
      </p>
      <ul>
        <li>Venda: R$ 50.</li>
        <li>Taxa: R$ 1.</li>
        <li>Custos, incluindo seu trabalho: R$ 35.</li>
        <li>Sobra além do trabalho: R$ 14.</li>
      </ul>
      <p>
        Nesse cenário, os R$ 18 remuneram o trabalho e os R$ 14 são a sobra do negócio. A
        margem sobre a venda é R$ 14 ÷ R$ 50 = 28%, diferente dos 40% acrescentados sobre
        o custo. Outros gastos não informados reduzem essa sobra.
      </p>
      <h2>Compras, atendimento e espera também precisam de um critério</h2>
      <p>
        Registre o tempo ligado a cada encomenda. Atividades gerais, como organizar o
        estoque, podem ser consideradas na disponibilidade de horas produtivas ou
        distribuídas entre os pedidos. Escolha um critério e evite remunerar as mesmas
        horas duas vezes. Se uma máquina trabalha sozinha enquanto você atende outro
        cliente, não confunda automaticamente tempo de máquina com tempo exclusivo de
        trabalho.
      </p>
      <h2>Mão de obra não é margem de lucro</h2>
      <ul>
        <li>
          <strong>Mão de obra</strong> remunera o tempo trabalhado.
        </li>
        <li>
          <strong>Lucro</strong> remunera o risco, investimento e crescimento do negócio.
        </li>
        <li>Os dois precisam aparecer na precificação.</li>
      </ul>
      <h2>Atualize quando seu processo mudar</h2>
      <p>
        Equipamentos, experiência e volume podem reduzir o tempo por unidade. Produtos
        mais personalizados podem aumentar. Revise a média para manter o preço coerente.
      </p>
      <p>
        Cronometre algumas produções normais, anote quantidade e retrabalho, e revise a
        média quando trocar equipamentos, contratar ajuda ou mudar o acabamento. Para
        trabalho contratado, use o custo efetivo aplicável ao negócio, não apenas a meta
        de remuneração do proprietário.
      </p>
      <h2>Referência para aprofundar</h2>
      <p>
        Consulte o material do Sebrae sobre{" "}
        <a href="https://sebrae.com.br/sites/PortalSebrae/ufs/ap/artigos/custos-e-preco-de-venda-no-comercio,e195164ce51b9410VgnVCM1000003b74010aRCRD">
          custos e preço de venda
        </a>
        . Os cálculos desta página são exemplos didáticos da equipe Lucro Caseiro;
        substitua valores, tempos e quantidades pela sua realidade.
      </p>
    </GuidePage>
  );
}
