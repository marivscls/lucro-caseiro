import { Platform } from "react-native";
import { authStorage } from "../utils/supabase";

export interface CreateDraftStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Web drafts end with the tab; native drafts use the existing SecureStore adapter. */
export const createDraftStorage: CreateDraftStorage = {
  async getItem(key) {
    return Platform.OS === "web" ? sessionStorage.getItem(key) : authStorage.getItem(key);
  },
  async setItem(key, value) {
    if (Platform.OS === "web") sessionStorage.setItem(key, value);
    else {
      // Auth storage chunks by characters. Escaping Unicode makes its byte limit safe.
      const ascii = value
        .split("")
        .map((character) => {
          if (character.charCodeAt(0) <= 127) return character;
          return `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
        })
        .join("");
      await authStorage.setItem(key, ascii);
    }
  },
  async removeItem(key) {
    if (Platform.OS === "web") sessionStorage.removeItem(key);
    else await authStorage.removeItem(key);
  },
};
