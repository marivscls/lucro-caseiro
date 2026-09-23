import type { DemoData } from "./fixtures";
import { readMockJson, writeMockJson } from "./storage";

// Estado da API simulada, por conta. Fica em memória e é espelhado no storage
// para sobreviver a um recarregamento da página.
const cache = new Map<string, DemoData>();

const dataKey = (userId: string) => `data:${userId}`;

export function loadDemoData(userId: string): DemoData | null {
  const cached = cache.get(userId);
  if (cached) return cached;
  const stored = readMockJson<DemoData>(dataKey(userId));
  if (stored) cache.set(userId, stored);
  return stored;
}

export function saveDemoData(userId: string, data: DemoData): void {
  cache.set(userId, data);
  writeMockJson(dataKey(userId), data);
}

export function clearDemoDataCache(): void {
  cache.clear();
}
