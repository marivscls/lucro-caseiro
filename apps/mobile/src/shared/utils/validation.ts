interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email.trim()) {
    errors.push("E-mail é obrigatório");
    return { valid: false, errors };
  }

  const hasAtSign = email.trim().includes("@");
  const [local, domain] = email.trim().split("@");
  const isValidFormat = hasAtSign && !!local && !!domain && domain.includes(".");
  if (!isValidFormat) {
    errors.push("E-mail inválido. Use o formato: nome@exemplo.com");
  }

  return { valid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Senha é obrigatória");
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push("Mínimo 8 caracteres");
  }

  return { valid: errors.length === 0, errors };
}

export function validateName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push("Nome é obrigatório");
  } else if (name.trim().length < 2) {
    errors.push("Nome deve ter pelo menos 2 caracteres");
  }

  return { valid: errors.length === 0, errors };
}
