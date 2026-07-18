import type { ReactNode } from "react";

import landingStyles from "./landing-page.module.css";
import { SiteFooter, SiteHeader } from "./site-chrome";
import styles from "./site-page.module.css";

type PublicPageProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly updatedAt?: string;
  readonly children: ReactNode;
  readonly wide?: boolean;
};

export function PublicPage({
  eyebrow,
  title,
  description,
  updatedAt,
  children,
  wide = false,
}: PublicPageProps) {
  return (
    <div className={landingStyles.page}>
      <SiteHeader />
      <main className={`${styles.main} ${wide ? styles.mainWide : ""}`}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
          {updatedAt ? (
            <p className={styles.updated}>Última atualização: {updatedAt}</p>
          ) : null}
        </header>
        <div className={styles.content}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export { styles as publicPageStyles };
