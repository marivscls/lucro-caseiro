"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { StartCta } from "./hero-actions";
import styles from "./landing-page.module.css";

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

type Period = "monthly" | "annual";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Meses de mensalidade que o anual economiza, arredondado para baixo. */
export function freeMonthsInAnnual(monthly: number, annual: number): number {
  return Math.floor((monthly * 12 - annual) / monthly + 0.05);
}

export function priceFor(plan: PricingPlan, period: Period) {
  if (plan.monthly === null || plan.annual === null) {
    return {
      price: "R$ 0",
      period: "para sempre",
      note: "Continue grátis dentro dos limites do plano.",
    };
  }
  if (period === "annual") {
    return {
      price: money.format(plan.annual),
      period: "por ano, em cobrança única",
      note: `Sai por ${money.format(Math.round((plan.annual / 12) * 100) / 100)} por mês.`,
    };
  }
  return {
    price: money.format(plan.monthly),
    period: "por mês",
    note: `ou ${money.format(plan.annual)} no anual, com ${freeMonthsInAnnual(plan.monthly, plan.annual)} meses grátis`,
  };
}

export function PricingPlans({ plans }: { readonly plans: readonly PricingPlan[] }) {
  const [period, setPeriod] = useState<Period>("monthly");
  const paid = plans.find((plan) => plan.monthly !== null && plan.annual !== null);
  const freeMonths =
    paid && paid.monthly !== null && paid.annual !== null
      ? freeMonthsInAnnual(paid.monthly, paid.annual)
      : 0;

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
          {freeMonths > 0 ? (
            <span className={styles.periodSaving}>{freeMonths} meses grátis</span>
          ) : null}
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
