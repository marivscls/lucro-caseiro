"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { StartCta } from "./hero-actions";
import styles from "./landing-page.module.css";
import { annualMonthlyEquivalent, annualSavings, formatBrl } from "./plan-price";

export type PricingPlan = {
  readonly name: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly featured: boolean;
  readonly badge: string | null;
  readonly ctaLabel: string;
  /** null = plano grátis, sem período. */
  readonly monthly: number | null;
  readonly annual: number | null;
};

export type Period = "monthly" | "annual";

/**
 * Preço de um plano: o destaque é sempre o valor por mês (no anual, o
 * equivalente) e a linha de baixo diz o que é cobrado de fato e quando,
 * igual à tela de planos do app.
 */
export function priceFor(plan: PricingPlan, period: Period) {
  if (plan.monthly === null || plan.annual === null) {
    return {
      price: "R$ 0",
      period: "para sempre",
      note: "Continue grátis dentro dos limites do plano.",
    };
  }
  const perMonthInAnnual = formatBrl(annualMonthlyEquivalent(plan.annual));
  if (period === "annual") {
    const savings = annualSavings(plan.monthly, plan.annual);
    return {
      price: perMonthInAnnual,
      period: "por mês, no plano anual",
      note:
        `${formatBrl(plan.annual)} cobrados uma vez por ano.` +
        (savings > 0 ? ` Economia de ${formatBrl(savings)} no ano.` : ""),
    };
  }
  return {
    price: formatBrl(plan.monthly),
    period: "por mês",
    note: `${formatBrl(plan.monthly)} cobrados todo mês. No plano anual, sai por ${perMonthInAnnual} por mês.`,
  };
}

export function PricingPlans({ plans }: { readonly plans: readonly PricingPlan[] }) {
  // O anual é a escolha recomendada e já vem marcado, como no app.
  const [period, setPeriod] = useState<Period>("annual");

  return (
    <>
      <div className={styles.periodToggle} role="group" aria-label="Período de cobrança">
        <button
          type="button"
          aria-pressed={period === "monthly"}
          onClick={() => setPeriod("monthly")}
        >
          Mensal
        </button>
        <button
          type="button"
          aria-pressed={period === "annual"}
          onClick={() => setPeriod("annual")}
        >
          Anual
          <span className={styles.periodSaving}>Mais vantajoso</span>
        </button>
      </div>
      <div className={styles.pricingGrid}>
        {plans.map((plan, index) => {
          const shown = priceFor(plan, period);
          const slug = plan.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          return (
            <article
              key={plan.name}
              data-landing-reveal={index * 60}
              className={`${styles.planCard} ${plan.featured ? styles.planFeatured : ""}`}
            >
              <div className={styles.planHeading}>
                <h3>{plan.name}</h3>
                {plan.badge ? <p className={styles.planBadge}>{plan.badge}</p> : null}
              </div>
              <p className={styles.planDescription}>{plan.description}</p>
              <p className={styles.planPrice} aria-live="polite">
                {shown.price}
                <small>{shown.period}</small>
              </p>
              <p className={styles.planAnnual}>{shown.note}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check aria-hidden="true" size={17} strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>
              <StartCta
                placement={`plan_${slug}`}
                label={plan.ctaLabel}
                className={styles.planActions}
                buttonClassName={styles.planButton}
                alternativeClassName={styles.planAlternative}
              />
            </article>
          );
        })}
      </div>
    </>
  );
}
