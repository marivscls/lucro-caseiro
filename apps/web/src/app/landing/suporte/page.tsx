import type { Metadata } from "next";
import { ArrowRight, CircleHelp, KeyRound, ShieldCheck, WalletCards } from "lucide-react";

import { PublicPage, publicPageStyles as styles } from "@/features/landing/public-page";
import { SUPPORT_EMAIL } from "@/features/landing/site-constants";

export const metadata: Metadata = {
  title: "Ajuda e suporte",
  description:
    "Canais de ajuda para conta, assinatura, privacidade e uso do Lucro Caseiro.",
  alternates: { canonical: "/landing/suporte" },
};

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
    >
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
