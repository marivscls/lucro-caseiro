"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/features/marketing/page-header";
import { apiClient } from "@/shared/lib/api-client";
import type { MarketingResource } from "@/shared/types";

export default function CalendarPage() {
  const [week, setWeek] = useState(1);
  const query = useQuery({
    queryKey: ["calendar-content"],
    queryFn: () => apiClient<MarketingResource[]>("/resources?kind=content"),
  });
  const items = (query.data ?? [])
    .filter((item) => Number(item.data.week ?? 1) === week)
    .sort((a, b) => Number(a.data.weekday ?? 0) - Number(b.data.weekday ?? 0));
  return (
    <>
      <PageHeader
        eyebrow="Ritmo editorial"
        title="Calendário de publicação"
        description="Uma cadência semanal equilibrada entre dor, educação, demonstração, objeção, prova e planejamento."
      />
      <div className="week-picker">
        {[1, 2, 3, 4].map((value) => (
          <button
            className={week === value ? "active" : ""}
            key={value}
            onClick={() => setWeek(value)}
          >
            Semana {value}
          </button>
        ))}
      </div>
      <section className="calendar-list">
        {items.map((item, index) => (
          <Link
            aria-label={`Abrir ${item.title}`}
            className="calendar-card"
            href={`/content?edit=${encodeURIComponent(item.id)}`}
            key={item.id}
          >
            <div className="calendar-day">
              <span>{index + 1}</span>
              <strong>{item.title.split(":")[0]}</strong>
            </div>
            <div className="calendar-copy">
              <span className="status idea">{asText(item.data.format, "Conteúdo")}</span>
              <h2>{item.summary}</h2>
              <p>
                <strong>Público:</strong> {asText(item.data.audience, "Geral")}
              </p>
              <p>
                <strong>CTA:</strong> {asText(item.data.cta, "Salvar e compartilhar")}
              </p>
            </div>
            <ChevronRight />
          </Link>
        ))}
      </section>
      {!items.length && (
        <section className="empty-state">
          <div className="empty-icon">
            <CalendarDays />
          </div>
          <h2>Calendário ainda vazio</h2>
          <p>
            Importe a estratégia inicial na página Hoje ou crie conteúdos e atribua semana
            e dia.
          </p>
        </section>
      )}
    </>
  );
}

function asText(value: unknown, fallback: string) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}
