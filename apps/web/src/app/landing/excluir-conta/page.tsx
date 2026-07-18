import type { Metadata } from "next";

import { PublicPage, publicPageStyles as styles } from "@/features/landing/public-page";
import { SUPPORT_EMAIL } from "@/features/landing/site-constants";

export const metadata: Metadata = {
  title: "Como excluir sua conta",
  description: "Instruções para excluir a conta e os dados associados no Lucro Caseiro.",
  alternates: { canonical: "/landing/excluir-conta" },
};

export default function DeleteAccountPage() {
  return (
    <PublicPage
      eyebrow="Controle dos seus dados"
      title="Como excluir sua conta"
      description="Você pode apagar a conta pelo próprio aplicativo ou solicitar ajuda por e-mail."
      updatedAt="16 de julho de 2026"
    >
      <article className={styles.document}>
        <section>
          <h2>Opção 1 — Pelo aplicativo</h2>
          <ol>
            <li>Abra o Lucro Caseiro e entre na sua conta.</li>
            <li>
              Acesse <strong>Configurações</strong>.
            </li>
            <li>
              Role até o final e toque em <strong>Excluir conta</strong>.
            </li>
            <li>Leia o aviso e confirme a exclusão definitiva.</li>
          </ol>
        </section>
        <section>
          <h2>Opção 2 — Por e-mail</h2>
          <p>
            Envie uma mensagem para{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> com o assunto{" "}
            <strong>Excluir conta — Lucro Caseiro</strong> e informe o e-mail usado na
            conta. Poderemos solicitar uma confirmação de identidade antes de concluir.
          </p>
        </section>
        <section>
          <h2>O que é excluído</h2>
          <ul>
            <li>Perfil, nome, e-mail, telefone e dados do negócio.</li>
            <li>Clientes, produtos, receitas, ingredientes e embalagens.</li>
            <li>Vendas, lançamentos financeiros, precificações, fotos e rótulos.</li>
            <li>Tokens de autenticação e vínculos da conta.</li>
          </ul>
        </section>
        <section>
          <h2>O que pode ser retido</h2>
          <p>
            Registros financeiros, fiscais, de segurança ou prevenção a fraude podem ser
            mantidos pelo prazo exigido em lei ou contrato. Sempre que possível, são
            mantidos sem identificação direta da conta.
          </p>
        </section>
        <div className={styles.callout}>
          <p>
            <strong>Atenção:</strong> a exclusão é definitiva. Cancele antes qualquer
            assinatura ativa diretamente no Google Play ou na plataforma usada para
            pagamento; apagar a conta não interrompe automaticamente a cobrança da loja.
          </p>
        </div>
      </article>
    </PublicPage>
  );
}
