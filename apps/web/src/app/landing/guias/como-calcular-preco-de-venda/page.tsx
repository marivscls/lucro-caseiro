import type { Metadata } from "next";

import { GuidePage } from "@/features/landing/guide-page";
import { publicPageStyles as styles } from "@/features/landing/public-page";

const title = "Como calcular o preço de venda sem trabalhar no prejuízo";
const description =
  "Um passo a passo simples para somar custos, valorizar seu tempo, escolher uma margem e incluir taxas.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/landing/guias/como-calcular-preco-de-venda" },
};

export default function SellingPriceGuidePage() {
  return (
    <GuidePage
      title={title}
      description={description}
      slug="como-calcular-preco-de-venda"
    >
      <p className={styles.articleLead}>
        O preço precisa pagar tudo que o produto consome, remunerar o seu trabalho e ainda
        deixar lucro. Copiar a concorrência ou multiplicar o material por um número
        qualquer não garante isso.
      </p>
      <h2>1. Some os custos diretos</h2>
      <p>
        Liste ingredientes ou materiais usados em uma unidade. Se uma embalagem de farinha
        custa R$ 8 e rende quatro receitas, cada receita usa R$ 2 desse custo. Faça o
        mesmo com recheio, decoração, tecido, linha ou qualquer item consumido.
      </p>
      <h2>2. Inclua embalagem e acabamento</h2>
      <p>
        Caixa, saco, etiqueta, fita, colher, guardanapo e cartão também custam dinheiro.
        Mesmo valores pequenos se tornam relevantes quando você vende muitas unidades.
      </p>
      <h2>3. Coloque o valor do seu tempo</h2>
      <p>
        Defina quanto vale uma hora do seu trabalho e multiplique pelo tempo usado. Se sua
        hora vale R$ 20 e você gasta 90 minutos, a mão de obra dessa produção é R$ 30.
      </p>
      <div className={styles.formula}>Mão de obra = minutos ÷ 60 × valor da hora</div>
      <h2>4. Rateie os custos fixos</h2>
      <p>
        Some gastos mensais como energia, gás, aluguel, internet e manutenção. Divida pelo
        número de unidades que espera produzir no mês. Esse valor entra no custo de cada
        unidade.
      </p>
      <div className={styles.formula}>
        Custo fixo por unidade = custos fixos mensais ÷ produção mensal
      </div>
      <h2>5. Aplique a margem desejada</h2>
      <p>
        Depois de encontrar o custo total, aplique uma margem coerente com seu negócio.
        Uma margem de 50% sobre um custo de R$ 20 adiciona R$ 10, formando um preço-base
        de R$ 30.
      </p>
      <div className={styles.formula}>Preço-base = custo total × (1 + margem ÷ 100)</div>
      <h2>6. Não esqueça as taxas sobre a venda</h2>
      <p>
        Cartão, marketplace e comissão costumam descontar uma porcentagem do preço
        cobrado. Para preservar o valor líquido, a taxa precisa ser calculada sobre o
        preço final, não apenas somada ao custo.
      </p>
      <h2>Revise antes de publicar</h2>
      <ul>
        <li>Compare o resultado com o posicionamento e a qualidade do produto.</li>
        <li>Confira tributos e particularidades da sua atividade.</li>
        <li>Atualize a conta quando materiais ou taxas mudarem.</li>
        <li>Evite descontos que eliminem o lucro calculado.</li>
      </ul>
    </GuidePage>
  );
}
