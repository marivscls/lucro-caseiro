// Stub for expo-modules-core — native module that can't run in jsdom
export function requireNativeModule() {
  return {};
}
export function requireOptionalNativeModule() {
  return null;
}
export class NativeModule {}
export const NativeModulesProxy = {};
export class EventEmitter {
  addListener() {}
  removeAllListeners() {}
  emit() {}
}
export const Platform = {
  OS: "android" as const,
  select: <T>(opts: { android?: T; ios?: T; default?: T }) =>
    opts.android ?? opts.default,
};
export const CodedError = class extends Error {};
export const UnavailabilityError = class extends Error {};
