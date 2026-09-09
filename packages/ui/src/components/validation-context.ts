import { createContext, useContext } from "react";
import type { TextInput, View } from "react-native";

export const FieldInputContext = createContext<{
  register: (input: TextInput | null, previous: TextInput | null, value?: string) => void;
  error?: string;
  errorId: string;
} | null>(null);

/** The closest scroll container reveals text fields as well as pickers. */
export const ValidationScrollContext = createContext<((target: View) => void) | null>(
  null,
);

export function useFieldValidationError() {
  return useContext(FieldInputContext)?.error;
}
