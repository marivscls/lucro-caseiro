import type { AnalyticsActionName, GuidanceArea } from "@lucro-caseiro/contracts";
const areas: Partial<Record<AnalyticsActionName, readonly GuidanceArea[]>> = {
  product_created: ["products"],
  service_created: ["services"],
  client_created: ["clients"],
  sale_payment_received: ["fiado"],
  sale_completed: ["sales", "new_sale"],
  order_created: ["agenda"],
  finance_entry_created: ["finance"],
  recurring_expense_created: ["recurring_expenses"],
  material_created: ["materials"],
  recipe_created: ["recipes"],
  packaging_created: ["packaging"],
  supplier_created: ["suppliers"],
  purchase_created: ["purchases"],
  quote_created: ["quotes"],
  label_created: ["labels"],
  catalog_content_published: ["catalog"],
  pricing_result_viewed: ["pricing"],
};
export function completedAreas(action: AnalyticsActionName): readonly GuidanceArea[] {
  return areas[action] ?? [];
}
