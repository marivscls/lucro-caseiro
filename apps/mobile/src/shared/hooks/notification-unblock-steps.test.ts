import { describe, expect, it } from "vitest";
import { notificationUnblockSteps } from "./notification-unblock-steps";

const CHROME_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A146M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const FIREFOX =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0";

describe("notificationUnblockSteps", () => {
  it("points a browser tab to the icon beside the address bar", () => {
    const steps = notificationUnblockSteps(CHROME_WINDOWS, false);

    expect(steps[0]).toMatch(/à esquerda do endereço/);
    expect(steps.at(-1)).toMatch(/Verificar novamente/);
  });

  it("points the installed app window to its own menu", () => {
    expect(notificationUnblockSteps(CHROME_WINDOWS, true)[0]).toMatch(/três pontinhos/);
  });

  it("sends the installed Android app to the phone settings", () => {
    expect(notificationUnblockSteps(CHROME_ANDROID, true)[0]).toMatch(
      /Configurações do celular/,
    );
    expect(notificationUnblockSteps(CHROME_ANDROID, false)[0]).toMatch(/endereço/);
  });

  it("sends iPhone users to the system settings", () => {
    expect(notificationUnblockSteps(IPHONE, true)[0]).toMatch(/Ajustes do iPhone/);
  });

  it("covers Safari on the Mac and Firefox", () => {
    expect(notificationUnblockSteps(SAFARI_MAC, false)[0]).toMatch(/menu Safari/);
    expect(notificationUnblockSteps(FIREFOX, false).join(" ")).toMatch(
      /Enviar notificações/,
    );
  });
});
