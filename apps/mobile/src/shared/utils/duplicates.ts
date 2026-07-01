import { showAlert } from "../components/alert-store";

export function duplicateKey(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function phoneDuplicateKey(value: string | null | undefined): string {
  const digits = digitsOnly(value);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

export function confirmPossibleDuplicate(
  title: string,
  message: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    showAlert({
      title,
      message,
      buttons: [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: "Continuar", onPress: () => resolve(true) },
      ],
    });
  });
}
