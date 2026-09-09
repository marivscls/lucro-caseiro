import { useCallback, useEffect, useRef, useState } from "react";

type FieldError = string | false | null | undefined;

/** Keeps validation local to a form, including nested creation dialogs. */
export function useFormValidation<K extends string>(
  errors: Record<K, FieldError>,
  resetKey?: unknown,
) {
  const [attempted, setAttempted] = useState(false);
  const targets = useRef(new Map<K, () => void>());
  const registrations = useRef(new Map<K, (focus: () => void) => () => void>());
  const pendingFocus = useRef<K | undefined>(undefined);
  const first = (Object.keys(errors) as K[]).find((key) => !!errors[key]);
  const reset = useCallback(() => {
    setAttempted(false);
    pendingFocus.current = undefined;
  }, []);
  useEffect(reset, [reset, resetKey]);
  useEffect(() => {
    if (pendingFocus.current && !errors[pendingFocus.current])
      pendingFocus.current = undefined;
  }, [errors]);

  function field(key: K) {
    let registerFocus = registrations.current.get(key);
    if (!registerFocus) {
      registerFocus = (focus) => {
        targets.current.set(key, focus);
        if (pendingFocus.current === key) {
          pendingFocus.current = undefined;
          focus();
        }
        return () => {
          if (targets.current.get(key) === focus) targets.current.delete(key);
        };
      };
      registrations.current.set(key, registerFocus);
    }
    return {
      error: attempted && errors[key] ? String(errors[key]) : undefined,
      summary:
        attempted && first === key
          ? "Confira os campos destacados antes de continuar."
          : undefined,
      registerFocus,
    };
  }

  function validate(reveal?: (key: K) => void) {
    setAttempted(true);
    if (!first) {
      pendingFocus.current = undefined;
      return true;
    }
    reveal?.(first);
    const focus = targets.current.get(first);
    if (focus) focus();
    else pendingFocus.current = first;
    return false;
  }

  return { field, validate, reset };
}
