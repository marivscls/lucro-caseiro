import type { Metadata } from "next";

import { GuidePage } from "@/features/landing/guide-page";
import { publicPageStyles as styles } from "@/features/landing/public-page";

const title = "Precificação para confeitaria: o que entra no preço do doce";
const description =
  "Veja os custos que uma confeiteira precisa considerar para cobrar por bolos, brigadeiros e encomendas.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/landing/guias/precificacao-para-confeitaria" },
};

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
        Para grandes quantidades, recalcule tempo, embalagem e perdas. O pedido maior pode
        ser mais eficiente, mas não deve receber um desconto automático que apague sua
        margem.
      </p>
      <h2>Quando revisar o preço</h2>
      <p>
        Revise sempre que ingredientes, embalagem, energia ou taxas subirem. Também revise
        quando o processo ficar mais demorado ou o produto ganhar um acabamento mais
        elaborado.
      </p>
    </GuidePage>
  );
}
