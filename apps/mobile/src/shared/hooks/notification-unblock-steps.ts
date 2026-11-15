/**
 * Passo a passo para liberar notificações que o navegador bloqueou.
 * Depois de "Bloquear" (ou de ignorar o pedido algumas vezes) o navegador não
 * mostra o pedido de novo: só a própria pessoa consegue liberar nas
 * configurações do site. Função pura: recebe o userAgent e se o app está
 * instalado (janela própria, sem barra de endereço).
 */
export function notificationUnblockSteps(
  userAgent: string,
  installed: boolean,
): string[] {
  const back = "Volte aqui e toque em Verificar novamente.";
  const ua = userAgent.toLowerCase();
  const ios = /iphone|ipad|ipod/.test(ua);
  const android = ua.includes("android");
  const firefox = ua.includes("firefox");
  const safari = ua.includes("safari") && !/chrome|crios|chromium|edg|android/.test(ua);

  if (ios)
    return [
      "Abra os Ajustes do iPhone ou iPad e toque em Notificações.",
      "Toque em Lucro Caseiro e ligue Permitir Notificações.",
      back,
    ];
  if (android && installed)
    return [
      "Abra as Configurações do celular e toque em Apps.",
      "Toque em Lucro Caseiro e depois em Notificações.",
      "Ligue Permitir notificações.",
      back,
    ];
  if (android)
    return [
      "Toque no ícone à esquerda do endereço do site, no alto da tela.",
      "Toque em Permissões (ou Notificações) e escolha Permitir.",
      back,
    ];
  if (safari)
    return [
      "No menu Safari, abra Ajustes e depois a aba Sites.",
      "Na lista da esquerda, clique em Notificações.",
      "Ao lado de app.lucrocaseiro.com.br, escolha Permitir.",
      back,
    ];
  if (firefox)
    return [
      "Clique no ícone à esquerda do endereço do site.",
      "Ao lado de Enviar notificações, clique no X para tirar o bloqueio.",
      "Recarregue a página e toque em Ativar notificações.",
    ];
  if (installed)
    return [
      "Clique nos três pontinhos no alto da janela do app.",
      "Clique em Informações do app e depois em Configurações (ou Permissões do site).",
      "Em Notificações, escolha Permitir.",
      back,
    ];
  return [
    "Clique no ícone à esquerda do endereço do site, ao lado de app.lucrocaseiro.com.br.",
    "Em Notificações, escolha Permitir (ou ligue a chave).",
    back,
  ];
}

export const NOTIFICATIONS_BLOCKED_MESSAGE =
  "O navegador bloqueou as notificações deste site e não deixa pedir de novo. Para liberar:";
