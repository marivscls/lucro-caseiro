export const GUIDANCE_AREAS = [
  "home",
  "products",
  "services",
  "sales",
  "new_sale",
  "agenda",
  "clients",
  "pricing",
  "finance",
  "recurring_expenses",
  "materials",
  "recipes",
  "packaging",
  "suppliers",
  "purchases",
  "fiado",
  "quotes",
  "catalog",
  "labels",
  "insights",
] as const;
export type GuidanceArea = (typeof GUIDANCE_AREAS)[number];
export const GUIDANCE_EVENTS = [
  "presented",
  "dismissed",
  "help_opened",
  "task_started",
  "task_completed",
  "prerequisite_resumed",
] as const;
export type GuidanceEvent = (typeof GUIDANCE_EVENTS)[number];
export type GuidanceActionName = `guidance_${GuidanceArea}_${GuidanceEvent}`;
export const GUIDANCE_ACTION_NAMES: GuidanceActionName[] = GUIDANCE_AREAS.flatMap(
  (area) =>
    GUIDANCE_EVENTS.map((event): GuidanceActionName => `guidance_${area}_${event}`),
);
export const GUIDANCE_VALIDATION_ACTIONS = [
  "product_name_required",
  "product_category_required",
  "product_price_invalid",
  "product_components_required",
  "finance_amount_invalid",
  "finance_description_required",
  "finance_category_required",
  "finance_date_invalid",
] as const;
