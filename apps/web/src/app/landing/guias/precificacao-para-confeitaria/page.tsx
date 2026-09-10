import { publicMetadata } from "@/features/landing/public-metadata";
import type { Metadata } from "next";

import { GuidePage } from "@/features/landing/guide-page";
import { publicPageStyles as styles } from "@/features/landing/public-page";

const title = "Precificação para confeitaria: o que entra no preço do doce";
const description =
  "Veja os custos que uma confeiteira precisa considerar para cobrar por bolos, brigadeiros e encomendas.";

export const metadata: Metadata = publicMetadata({
  title,
  description,
  alternates: { canonical: "/landing/guias/precificacao-para-confeitaria" },
});

export default function ConfectioneryPricingGuidePage() {
  return (
    <GuidePage
      title={title}
      description={description}
      slug="precificacao-para-confeitaria"
    >
      <p className={styles.articleLead}>
        Farinha, chocolate e leite condensado são apenas o começo. Um preço seguro também
        precisa pagar embalagem, gás, energia, perdas, tempo de produção e taxas de
        pagamento.
      </p>
      <h2>Comece pela ficha da receita</h2>
      <p>
        Registre a quantidade comprada, o preço pago e quanto foi usado. Se um pacote
        custa R$ 10 e você usa metade, o custo daquela receita é R$ 5. Some todos os
        ingredientes e divida pelo rendimento real.
      </p>
      <h2>Use o rendimento real, não o ideal</h2>
      <p>
        Se a receita normalmente rende 22 brigadeiros prontos, não calcule como se
        rendesse 25. Considere perdas, sobras e variações que acontecem na sua cozinha.
      </p>
      <h2>Custos frequentemente esquecidos</h2>
      <ul>
        <li>Forminha, caixa, base de bolo, fita, etiqueta e colher.</li>
        <li>Gás, energia, água e produtos de limpeza.</li>
        <li>Transporte para comprar insumos ou entregar a encomenda.</li>
        <li>Tempo de compras, preparo, decoração, embalagem e atendimento.</li>
        <li>Taxas do cartão, aplicativo, marketplace ou link de pagamento.</li>
      </ul>
      <h2>Exemplo simples de brigadeiro</h2>
      <p>
        Imagine uma receita com R$ 28 de ingredientes, R$ 6 de embalagem, R$ 24 de mão de
        obra e R$ 4 de custos fixos rateados. O custo total é R$ 62. Se render 20
        unidades, cada brigadeiro custa R$ 3,10 antes do lucro.
      </p>
      <div className={styles.formula}>
        R$ 62 ÷ 20 unidades = R$ 3,10 de custo por brigadeiro
      </div>
      <h2>Preço por unidade e preço por cento</h2>
      <p>
        Para fechar o exemplo, escolha um lucro de 50% sobre o custo: R$ 3,10 × 1,50 = R$
        4,65 por doce, sem taxas. Com taxa de pagamento de 5%, divida por 0,95: o preço
        calculado é aproximadamente R$ 4,89. Para não perder centavos no arredondamento,
        você pode trabalhar com R$ 4,90: a taxa aproximada é R$ 0,25 e a sobra é R$ 1,55
        por doce. A mão de obra já está no custo.
      </p>
      <p>
        Para grandes quantidades, recalcule tempo, embalagem e perdas. O pedido maior pode
        ser mais eficiente, mas não deve receber um desconto automático que apague sua
        margem.
      </p>
      <p>
        Se todos os custos fossem proporcionais, 100 doces custariam R$ 310. Com 50% sobre
        o custo, o preço-base seria R$ 465; com taxa de 5%, R$ 489,47, ou R$ 489,48
        arredondando para cima. Isso é apenas uma referência: para vender o cento, faça a
        ficha do pedido inteiro. Uma caixa para 100 doces pode custar menos que cinco
        caixas para 20; produção em lote também pode mudar o tempo de trabalho.
      </p>
      <h2>Como preencher a calculadora por doce</h2>
      <ul>
        <li>Ingredientes: R$ 28 ÷ 20 = R$ 1,40 por doce.</li>
        <li>Embalagem: R$ 6 ÷ 20 = R$ 0,30 por doce.</li>
        <li>
          Se a hora vale R$ 24 e o lote leva 60 minutos, informe 3 minutos por doce.
        </li>
        <li>
          Para R$ 0,20 de fixos por doce, um exemplo é R$ 200 mensais divididos por 1.000
          doces.
        </li>
        <li>Informe 50% em lucro sobre o custo e 5% em taxas para repetir o exemplo.</li>
      </ul>
      <p>
        A calculadora usa uma unidade de venda. Se você vende uma caixa fechada, use os
        materiais, o tempo e a embalagem da caixa inteira. Não misture custo por doce com
        tempo do lote: isso distorce o resultado.
      </p>
      <h2>Perdas e encomendas especiais</h2>
      <p>
        Pese os doces prontos e registre quantos ficaram em condições de venda. Se o lote
        de R$ 62 render apenas 18 unidades vendáveis, o custo sobe para cerca de R$ 3,44
        por doce. Não acrescente a mesma perda outra vez como percentual se ela já foi
        considerada no rendimento. Para decoração personalizada, acrescente o material
        extra, a embalagem especial e os minutos adicionais daquele pedido.
      </p>
      <h2>Quando revisar o preço</h2>
      <p>
        Revise sempre que ingredientes, embalagem, energia ou taxas subirem. Também revise
        quando o processo ficar mais demorado ou o produto ganhar um acabamento mais
        elaborado.
      </p>
      <h2>Referência e limites do exemplo</h2>
      <p>
        Os valores são ilustrativos e não incluem outros tributos, entrega ou despesas que
        você não tenha informado. Use seus comprovantes e rendimento real. O Sebrae
        orienta a considerar custos e despesas na{" "}
        <a href="https://meuatendimento.sebrae.com.br/sites/PortalSebrae/artigos/como-definir-o-preco-de-venda-de-um-produto-ou-servico,cc9836627a963410VgnVCM1000003b74010aRCRD">
          definição do preço de venda
        </a>{" "}
        e conferir sua viabilidade no mercado.
      </p>
    </GuidePage>
  );
}
