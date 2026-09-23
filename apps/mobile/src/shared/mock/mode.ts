/**
 * Modo demonstração (build-time). Ligado apenas quando o bundle é gerado com
 * `EXPO_PUBLIC_MOCK_MODE=1`: auth, API e integrações externas passam a ser
 * simuladas localmente, sem servidor. Sem a flag, nada muda no app.
 */
export const isMockMode = process.env.EXPO_PUBLIC_MOCK_MODE === "1";
