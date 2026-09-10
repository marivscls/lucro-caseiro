import { publicMetadata } from "@/features/landing/public-metadata";
import type { Metadata } from "next";

import { GuidePage } from "@/features/landing/guide-page";
import { publicPageStyles as styles } from "@/features/landing/public-page";

const title = "Como calcular o preço de venda sem trabalhar no prejuízo";
const description =
  "Aprenda a somar custos, incluir mão de obra e taxas e diferenciar lucro sobre o custo de margem sobre a venda, com exemplos completos.";

export const metadata: Metadata = publicMetadata({
  title,
  description,
  alternates: { canonical: "/landing/guias/como-calcular-preco-de-venda" },
});

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
      <h2>5. Defina o lucro sobre o custo</h2>
      <p>
        Depois de encontrar o custo total, escolha quanto quer acrescentar sobre ele. Um
        acréscimo de 50% sobre um custo de R$ 20 adiciona R$ 10, formando um preço-base de
        R$ 30. Esse percentual sobre o custo é chamado de markup percentual.
      </p>
      <div className={styles.formula}>
        Preço-base = custo total × (1 + lucro sobre o custo ÷ 100)
      </div>
      <p>
        A margem sobre a venda usa outra base: lucro dividido pelo preço de venda. Nesse
        exemplo sem taxas, R$ 10 ÷ R$ 30 = 33,3%. Portanto, acrescentar 50% ao custo não
        gera uma margem de 50% sobre a venda. Na calculadora do Lucro Caseiro, o campo
        “Lucro sobre o custo” usa a primeira conta.
      </p>
      <h2>6. Não esqueça as taxas sobre a venda</h2>
      <p>
        Cartão, marketplace e comissão costumam descontar uma porcentagem do preço
        cobrado. Para preservar o valor líquido, a taxa precisa ser calculada sobre o
        preço final, não apenas somada ao custo.
      </p>
      <div className={styles.formula}>Preço final = preço-base ÷ (1 − taxas ÷ 100)</div>
      <p>
        Se o preço-base é R$ 30 e a taxa é 10%, a conta é R$ 30 ÷ 0,90 = R$ 33,33 após
        arredondar. A taxa fica próxima de R$ 3,33 e restam R$ 30: R$ 20 de custo e R$ 10
        de lucro. Somar apenas 10% daria R$ 33; após a taxa de R$ 3,30, sobrariam R$
        29,70, abaixo do valor-base planejado.
      </p>
      <h2>Um exemplo completo para conferir na calculadora</h2>
      <p>
        Considere uma peça artesanal. Os valores são ilustrativos, não uma referência de
        preço para o seu mercado. Materiais custam R$ 12,50 e a embalagem, R$ 3. A
        produção leva 90 minutos, com hora de trabalho de R$ 20: são R$ 30 de mão de obra.
        Os gastos fixos do negócio são R$ 400 por mês para 100 peças, ou R$ 4 por peça.
      </p>
      <ul>
        <li>Custo por peça: R$ 12,50 + R$ 3 + R$ 30 + R$ 4 = R$ 49,50.</li>
        <li>Lucro escolhido: 50% sobre R$ 49,50 = R$ 24,75.</li>
        <li>Preço sem taxas: R$ 49,50 + R$ 24,75 = R$ 74,25.</li>
        <li>Com taxa de 10%: R$ 74,25 ÷ 0,90 = R$ 82,50.</li>
        <li>Conferência: R$ 82,50 − R$ 8,25 de taxa − R$ 49,50 de custo = R$ 24,75.</li>
      </ul>
      <p>
        Esses são os valores iniciais da calculadora, com taxa zero. Altere a taxa para
        10% e confira a segunda situação. O pagamento do seu trabalho já faz parte do
        custo; os R$ 24,75 representam a sobra além dele, considerando apenas os gastos
        informados.
      </p>
      <h2>Evite contar o mesmo gasto duas vezes</h2>
      <p>
        Inclua apenas a parcela dos gastos da casa usada pelo negócio. Se o gás de uma
        receita já entrou no custo direto, não some o mesmo consumo novamente no rateio. A
        divisão por unidades é uma aproximação útil quando os produtos consomem recursos
        parecidos; produtos muito diferentes podem exigir critérios específicos.
      </p>
      <h2>Revise antes de publicar</h2>
      <ul>
        <li>Compare o resultado com o posicionamento e a qualidade do produto.</li>
        <li>Confira tributos e particularidades da sua atividade.</li>
        <li>Atualize a conta quando materiais ou taxas mudarem.</li>
        <li>Evite descontos que eliminem o lucro calculado.</li>
      </ul>
      <h2>Referências para aprofundar</h2>
      <p>
        O Sebrae explica a{" "}
        <a href="https://blog.rn.sebrae.com.br/markup/">formação de preços pelo markup</a>{" "}
        e a diferença de base no cálculo da{" "}
        <a href="https://sebrae.com.br/sites/PortalSebrae/artigos/entenda-e-calcule-corretamente-a-margem-de-lucro,f2bbca017749e410VgnVCM1000003b74010aRCRD">
          margem de lucro
        </a>
        . Os exemplos numéricos desta página foram elaborados pela equipe Lucro Caseiro.
      </p>
    </GuidePage>
  );
}
