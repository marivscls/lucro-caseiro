import type { Metadata } from "next";

import { GuidePage } from "@/features/landing/guide-page";
import { publicPageStyles as styles } from "@/features/landing/public-page";

const title = "Como colocar sua mão de obra no preço do produto";
const description =
  "Aprenda a transformar tempo de produção em custo e parar de trabalhar de graça.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/landing/guias/como-colocar-mao-de-obra-no-preco" },
};

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
    </GuidePage>
  );
}
