export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email.trim()) {
    errors.push("E-mail e obrigatorio");
    return { valid: false, errors };
  }

  const hasAtSign = email.trim().includes("@");
  const [local, domain] = email.trim().split("@");
  const isValidFormat = hasAtSign && !!local && !!domain && domain.includes(".");
  if (!isValidFormat) {
    errors.push("E-mail invalido. Use o formato: nome@exemplo.com");
  }

  return { valid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Senha e obrigatoria");
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push("Minimo 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Pelo menos 1 letra maiuscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Pelo menos 1 letra minuscula");
  }

  if (!/\d/.test(password)) {
    errors.push("Pelo menos 1 numero");
  }

  return { valid: errors.length === 0, errors };
}

export function validateName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push("Nome e obrigatorio");
  } else if (name.trim().length < 2) {
    errors.push("Nome deve ter pelo menos 2 caracteres");
  }

  return { valid: errors.length === 0, errors };
}

export function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
  if (!password || password.length < 8) return "weak";

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}
