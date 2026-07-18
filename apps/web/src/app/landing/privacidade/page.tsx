import type { Metadata } from "next";

import { PublicPage, publicPageStyles as styles } from "@/features/landing/public-page";
import { SUPPORT_EMAIL } from "@/features/landing/site-constants";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Saiba como o Lucro Caseiro coleta, usa, protege e exclui dados.",
  alternates: { canonical: "/landing/privacidade" },
};

export default function PrivacyPage() {
  return (
    <PublicPage
      eyebrow="Privacidade e segurança"
      title="Política de Privacidade"
      description="Transparência sobre os dados necessários para o aplicativo funcionar e melhorar."
      updatedAt="16 de julho de 2026"
    >
      <article className={styles.document}>
        <section>
          <p>
            Esta política descreve como o aplicativo e o site Lucro Caseiro tratam dados
            pessoais. Para exercer seus direitos, escreva para{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2>Dados que podemos tratar</h2>
          <ul>
            <li>Dados de conta, como nome, e-mail e informações de autenticação.</li>
            <li>Dados do perfil e negócio, como nome comercial, atividade e telefone.</li>
            <li>
              Conteúdo cadastrado: clientes, produtos, receitas, custos, vendas e
              financeiro.
            </li>
            <li>Fotos adicionadas voluntariamente a produtos e receitas.</li>
            <li>
              Estado de assinatura, limites do plano e informações técnicas de
              funcionamento.
            </li>
            <li>
              Identificador aleatório da instalação, plataforma, versão, telas acessadas e
              conclusão de funcionalidades importantes para métricas agregadas.
            </li>
          </ul>
        </section>

        <section>
          <h2>Como usamos os dados</h2>
          <ul>
            <li>Criar e proteger a conta.</li>
            <li>Salvar e organizar o conteúdo cadastrado pela própria pessoa.</li>
            <li>
              Calcular preços, acompanhar vendas e apresentar resultados financeiros.
            </li>
            <li>Operar planos, assinaturas, segurança, suporte e prevenção de fraude.</li>
            <li>Medir estabilidade, ativação e uso agregado para melhorar o produto.</li>
          </ul>
        </section>

        <section>
          <h2>Câmera, galeria e notificações</h2>
          <p>
            O acesso à câmera ou galeria só é solicitado quando você escolhe adicionar uma
            foto. Notificações são usadas para lembretes e avisos do aplicativo. As
            permissões podem ser negadas ou revogadas nas configurações do aparelho.
          </p>
        </section>

        <section>
          <h2>Site público e métricas</h2>
          <p>
            O site pode registrar dados técnicos básicos, como página acessada, horário e
            tipo de dispositivo. Quando o Google Analytics estiver habilitado, ele será
            usado para medir visitas e cliques na loja de aplicativos com anonimização de
            IP. Não usamos esses eventos para armazenar o conteúdo inserido na calculadora
            pública.
          </p>
        </section>

        <section>
          <h2>Compartilhamento</h2>
          <p>
            Não vendemos dados pessoais. Dados podem ser processados por fornecedores
            necessários para autenticação, banco de dados, armazenamento, pagamentos,
            infraestrutura, notificações e análise de funcionamento, de acordo com a
            finalidade do serviço e a legislação aplicável.
          </p>
        </section>

        <section>
          <h2>Segurança e retenção</h2>
          <p>
            Aplicamos medidas razoáveis para proteger os dados. Eles são mantidos enquanto
            necessários para prestar o serviço, cumprir obrigações legais, resolver
            disputas ou preservar a segurança. Nenhuma transmissão ou armazenamento
            eletrônico é totalmente livre de risco.
          </p>
        </section>

        <section>
          <h2>Exclusão e direitos</h2>
          <p>
            Você pode acessar, corrigir ou pedir a exclusão dos dados. Consulte a página{" "}
            <a href="/landing/excluir-conta">Como excluir sua conta</a>. Registros
            exigidos por lei ou segurança podem ser retidos pelo prazo aplicável,
            preferencialmente sem identificação direta.
          </p>
        </section>

        <section>
          <h2>Crianças e adolescentes</h2>
          <p>
            O Lucro Caseiro não é direcionado a crianças. Se dados de uma criança forem
            identificados sem autorização adequada, o responsável poderá solicitar a
            exclusão.
          </p>
        </section>

        <section>
          <h2>Alterações e contato</h2>
          <p>
            Esta política pode ser atualizada para refletir mudanças no serviço ou na lei.
            A versão vigente ficará nesta página. Dúvidas ou solicitações:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>
      </article>
    </PublicPage>
  );
}
