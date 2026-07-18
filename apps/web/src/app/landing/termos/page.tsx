import type { Metadata } from "next";

import { PublicPage, publicPageStyles as styles } from "@/features/landing/public-page";
import { SUPPORT_EMAIL } from "@/features/landing/site-constants";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Condições para criação de conta, uso e assinatura do Lucro Caseiro.",
  alternates: { canonical: "/landing/termos" },
};

export default function TermsPage() {
  return (
    <PublicPage
      eyebrow="Condições do serviço"
      title="Termos de Uso"
      description="Regras simples e transparentes para usar o Lucro Caseiro."
      updatedAt="16 de julho de 2026"
    >
      <article className={styles.document}>
        <section>
          <p>
            Ao criar uma conta ou utilizar o Lucro Caseiro, você concorda com estes
            termos. Se não concordar com alguma condição, não utilize o serviço.
          </p>
        </section>
        <section>
          <h2>1. Sobre o serviço</h2>
          <p>
            O Lucro Caseiro auxilia profissionais autônomos e negócios de diferentes
            portes com precificação, produtos, receitas, catálogo, clientes, vendas,
            encomendas e organização financeira. Os cálculos são ferramentas de apoio e
            não substituem orientação contábil, fiscal ou jurídica.
          </p>
        </section>
        <section>
          <h2>2. Conta e cadastro</h2>
          <ul>
            <li>É necessário ter 18 anos ou mais para criar uma conta.</li>
            <li>As informações fornecidas devem ser verdadeiras e atualizadas.</li>
            <li>Você é responsável por proteger sua senha e o acesso ao aparelho.</li>
          </ul>
        </section>
        <section>
          <h2>3. Planos e assinaturas</h2>
          <p>
            O plano Gratuito possui limites informados no aplicativo. O Essencial remove
            limites de volume do uso diário. O Profissional inclui recursos avançados de
            apresentação, controle e exportação.
          </p>
          <ul>
            <li>Preço, período e benefícios são apresentados antes da contratação.</li>
            <li>
              Assinaturas podem ser renovadas automaticamente até o cancelamento na loja.
            </li>
            <li>
              Após cancelar, o acesso pago continua até o fim do período já contratado.
            </li>
            <li>Reembolsos seguem as regras da plataforma que processou a compra.</li>
          </ul>
        </section>
        <section>
          <h2>4. Uso aceitável</h2>
          <p>Você concorda em não:</p>
          <ul>
            <li>Usar o serviço para atividades ilegais ou não autorizadas.</li>
            <li>Acessar contas ou dados de terceiros.</li>
            <li>Contornar limites técnicos, descompilar ou atacar o serviço.</li>
            <li>
              Publicar conteúdo fraudulento, ofensivo ou que viole direitos de terceiros.
            </li>
          </ul>
        </section>
        <section>
          <h2>5. Conteúdo cadastrado</h2>
          <p>
            Você mantém a propriedade do conteúdo inserido. Concede apenas a autorização
            necessária para armazenar, processar e exibir esse conteúdo de volta enquanto
            usa o serviço.
          </p>
        </section>
        <section>
          <h2>6. Propriedade intelectual</h2>
          <p>
            Nome, marca, design, código e materiais do Lucro Caseiro são protegidos.
            Nenhum direito sobre esses elementos é transferido com o uso do aplicativo.
          </p>
        </section>
        <section>
          <h2>7. Disponibilidade e responsabilidade</h2>
          <p>
            O serviço pode passar por manutenção ou alterações. Buscamos estabilidade e
            precisão, mas você continua responsável por revisar preços, tributos e
            decisões do negócio. A responsabilidade será limitada conforme a legislação
            aplicável.
          </p>
        </section>
        <section>
          <h2>8. Encerramento</h2>
          <p>
            Você pode excluir a conta seguindo as instruções em{" "}
            <a href="/landing/excluir-conta">Como excluir sua conta</a>. A exclusão da
            conta não cancela automaticamente cobranças recorrentes na loja de
            aplicativos.
          </p>
        </section>
        <section>
          <h2>9. Lei aplicável e contato</h2>
          <p>
            Aplicam-se as leis brasileiras e o foro do domicílio do consumidor, quando
            cabível. Dúvidas: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>
      </article>
    </PublicPage>
  );
}
