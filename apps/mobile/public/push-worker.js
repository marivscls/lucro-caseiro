/* Included in the generated PWA worker. Push does not require an open page. */
function notificationUrl(value) {
  try {
    const url = new URL(value || "/", self.location.origin);
    if (url.origin === self.location.origin) return url.href;
  } catch {
    /* Fall back to the app, never to a remote destination. */
  }
  return self.location.origin + "/";
}

self.addEventListener("push", (event) => {
  let message = {};
  try {
    message = event.data?.json() || {};
  } catch {
    /* Show a safe fallback. */
  }
  event.waitUntil(
    self.registration.showNotification(message.title || "Lembrete do seu negócio", {
      body: message.body || "Abra o app para conferir seus lembretes.",
      icon: "/icon-192.png",
      tag: message.tag || "business-reminder",
      data: { url: notificationUrl(message.url) },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = notificationUrl(event.notification.data?.url);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.navigate(url);
        return client.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
