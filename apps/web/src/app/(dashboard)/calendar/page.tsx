"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/features/marketing/page-header";
import {
  editorialWeekDays,
  itemsForEditorialDay,
  pedalIntentClass,
} from "@/features/marketing/calendar-week";
import { contentIntentOptions } from "@/features/marketing/content-brief";
import { apiClient } from "@/shared/lib/api-client";
import type { MarketingResource } from "@/shared/types";

export default function CalendarPage() {
  const [week, setWeek] = useState(1);
  const query = useQuery({
    queryKey: ["calendar-content"],
    queryFn: () => apiClient<MarketingResource[]>("/resources?kind=content"),
  });
  const items = query.data ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Semana PEDAL"
        title="Calendário semanal"
        description="Cada carta representa um post. Distribua as intenções editoriais pelos dias conforme a pauta pedir."
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
      <div className="pedal-legend" aria-label="Intenções editoriais PEDAL">
        {contentIntentOptions.map((intent) => (
          <span className={`pedal-${pedalIntentClass(intent.value)}`} key={intent.value}>
            {intent.value}
          </span>
        ))}
      </div>
      <section className="calendar-list" aria-label={`Planejamento da semana ${week}`}>
        {editorialWeekDays.map((day) => {
          const dayItems = itemsForEditorialDay(items, week, day.number);
          return (
            <article className="calendar-day" key={day.number}>
              <header>
                <span>{day.short}</span>
                <strong>{day.label}</strong>
                <small>{dayItems.length || "—"}</small>
              </header>
              <div className="calendar-day-posts">
                {dayItems.map((item) => {
                  const intent = asText(item.data.contentIntent, "Sem intenção");
                  return (
                    <Link
                      aria-label={`Abrir ${item.title}`}
                      className={`calendar-card pedal-${pedalIntentClass(item.data.contentIntent)}`}
                      href={`/content?edit=${encodeURIComponent(item.id)}`}
                      key={item.id}
                    >
                      <span className="calendar-card-intent">{intent}</span>
                      <span className="calendar-card-format">
                        {asText(item.data.format, "Conteúdo")}
                      </span>
                      <h2>{item.summary || titleWithoutDay(item.title)}</h2>
                      <p>{titleWithoutDay(item.title)}</p>
                      <span className="calendar-card-action">
                        Abrir carta <ChevronRight aria-hidden="true" />
                      </span>
                    </Link>
                  );
                })}
                {!dayItems.length && (
                  <Link className="calendar-day-empty" href="/content">
                    <span>+</span>
                    Planejar um post
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}

function titleWithoutDay(title: string) {
  const separator = title.indexOf(":");
  return separator >= 0 ? title.slice(separator + 1).trim() : title;
}

function asText(value: unknown, fallback: string) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}
