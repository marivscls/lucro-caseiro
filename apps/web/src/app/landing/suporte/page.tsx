import { publicMetadata } from "@/features/landing/public-metadata";
import type { Metadata } from "next";
import { ArrowRight, CircleHelp, KeyRound, ShieldCheck, WalletCards } from "lucide-react";

import { PublicPage, publicPageStyles as styles } from "@/features/landing/public-page";
import { SUPPORT_EMAIL } from "@/features/landing/site-constants";

export const metadata: Metadata = publicMetadata({
  title: "Ajuda e suporte",
  description:
    "Canais de ajuda para conta, assinatura, privacidade e uso do Lucro Caseiro.",
  alternates: { canonical: "/landing/suporte" },
});

const topics = [
  {
    icon: CircleHelp,
    title: "Dúvida sobre o aplicativo",
    text: "Explique o que estava tentando fazer e, se puder, envie uma captura da tela.",
    subject: "Ajuda com o Lucro Caseiro",
  },
  {
    icon: KeyRound,
    title: "Conta e acesso",
    text: "Ajuda com login, troca de senha, confirmação de e-mail ou exclusão da conta.",
    subject: "Ajuda com minha conta",
  },
  {
    icon: WalletCards,
    title: "Plano e assinatura",
    text: "Informe a loja usada na compra e o e-mail da conta, sem enviar senhas.",
    subject: "Ajuda com assinatura",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade",
    text: "Solicite acesso, correção ou exclusão de dados associados à sua conta.",
    subject: "Solicitação de privacidade",
  },
] as const;

export default function SupportPage() {
  return (
    <PublicPage
      eyebrow="Estamos por perto"
      title="Como podemos ajudar?"
      description={`O canal oficial de suporte é ${SUPPORT_EMAIL}. Nunca pediremos sua senha.`}
      wide
      updatedAt="10 de setembro de 2026"
    >
      <article className={styles.document}>
        <h2>Antes de enviar uma mensagem</h2>
        <ul>
          <li>
            <strong>Não consegue entrar?</strong> Confira se está usando o e-mail da conta
            e use a opção de recuperação de senha na tela de acesso. Verifique também a
            pasta de spam.
          </li>
          <li>
            <strong>Quer gerenciar o plano?</strong> Abra Configurações e procure
            “Gerenciar assinatura”. Compras pela Google Play são gerenciadas na loja;
            outras formas de pagamento seguem o canal indicado na conta.
          </li>
          <li>
            <strong>Precisa excluir a conta?</strong> Veja o{" "}
            <a href="/landing/excluir-conta">passo a passo de exclusão</a> e confira
            separadamente o cancelamento da assinatura.
          </li>
          <li>
            <strong>Dúvida no cálculo?</strong> Consulte a{" "}
            <a href="/landing/calculadora">calculadora com explicações</a> ou o{" "}
            <a href="/landing/guias/como-calcular-preco-de-venda">
              guia de preço de venda
            </a>
            .
          </li>
        </ul>
        <p className={styles.callout}>
          O Lucro Caseiro é operado pela ORIONSEVEN SOFTWARE. Ao pedir ajuda, informe a
          tela, o aparelho e o que ocorreu. Não envie senha, código de acesso nem dados
          completos do cartão.
        </p>
      </article>
      <div className={styles.supportGrid}>
        {topics.map(({ icon: Icon, title, text, subject }) => (
          <article className={styles.supportCard} key={title}>
            <div className={styles.supportIcon}>
              <Icon aria-hidden="true" size={24} />
            </div>
            <h2>{title}</h2>
            <p>{text}</p>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`}>
              Enviar e-mail <ArrowRight aria-hidden="true" size={17} />
            </a>
          </article>
        ))}
      </div>
    </PublicPage>
  );
}
