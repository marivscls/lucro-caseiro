// Generic stub for expo modules that can't run in jsdom
import { vi } from "vitest";

export const router = {
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
};

export function useRouter() {
  return router;
}

export function useLocalSearchParams() {
  return {};
}

export const Stack = { Screen: () => null };
export const Link = () => null;

export default {};
