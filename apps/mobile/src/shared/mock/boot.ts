import { isMockMode } from "./mode";
import { resetBrowserDemoIfRequested } from "./reset";

// Importado primeiro pelo layout raiz: no modo demonstração, trata `?reset=1`
// antes de qualquer store ler o que está salvo. Fora dele, não faz nada.
if (isMockMode) resetBrowserDemoIfRequested();
