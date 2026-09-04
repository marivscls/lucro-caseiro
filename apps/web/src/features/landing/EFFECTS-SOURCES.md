# Referências externas de efeitos

Pesquisadas e integradas em 2026-09-04, a pedido da dona do produto.

## Revisão com efeitos mais visíveis

A dona do produto considerou a primeira versão sutil demais. Novas referências:

- Aceternity Container Scroll Animation: https://ui.aceternity.com/components/container-scroll-animation — inspiração visual para as duas telas reais entrarem em perspectiva 3D. Implementação própria em `LandingMotion`, acionada uma vez, com 1000ms, deslocamento de 64px, rotação Y de 18° e Z de 5°, menores deslocamentos laterais no celular. Não é uma cópia do componente nem adiciona Motion como dependência.
- Magic UI Text Highlighter: https://magicui.design/docs/components/highlighter — inspiração para um traço SVG duplo sob “Agora você sabe.”, revelado em 1000ms com `clip-path`. SVG próprio e CSS, sem rough-notation.
- O percurso dos quatro passos agora é desenhado conforme os itens aparecem; vertical no celular. Demais entradas passam a 700ms e deslocamento de 32px. Foco causado pelo mouse não desliga mais as entradas; teclado e preferência de movimento reduzido continuam interrompendo-as.

## Onda de clique — Magic UI

- Demo: https://magicui.design/docs/components/ripple-button
- Código: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/ripple-button.tsx
- Licença: https://github.com/magicuidesign/magicui/blob/main/LICENSE.md
- Adaptação local: `pointer-feedback.tsx` e `pointer-feedback.module.css`.

Preserva o cálculo da origem a partir do ponto de interação e o círculo recortado pelo botão. A versão local usa Pointer Events (mouse, toque e caneta), Web Animations API com duração de 280ms, cor herdada da marca e remoção ao terminar/cancelar. Não altera o clique, a navegação ou os cálculos. Teclado não dispara ondas; redução de movimento cancela as ondas ativas e impede novas. Nenhuma dependência ou requisição externa em tempo de execução.

Aplicado aos CTAs do cabeçalho, hero, planos, fechamento e calculadora, além de limpar/restaurar o exemplo.

### Licença do código adaptado

MIT License

Copyright (c) Magic UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Sublinhado de navegação — Tobias Ahlin

- Referência: https://tobiasahlin.com/blog/css-trick-animating-link-underlines/
- Implementação local em `landing-page.module.css`, nos links `.nav a`.

Inspirado no padrão de revelar uma linha sob o link. Implementação própria com `clip-path`, 160ms, token `--ease-out` existente e cor herdada. Sem JavaScript. Hover só em ponteiro preciso; foco de teclado e redução de movimento mostram o estado imediatamente.

## Direção atual: rolagem como narrativa (GSAP)

A segunda revisão também foi considerada rápida e básica. Foram consultados os sete sites indicados pela dona do produto: React Bits, 21st, Universe, GSAP, Unlumen, GetLayers e MotionSites. O link específico `motionsites.ai/?prompt=vision-reveal` falhou na consulta, mas a página inicial foi acessível; nenhum conteúdo pago ou prompt privado foi utilizado.

Referências efetivamente usadas:

- React Bits Scroll Stack: https://reactbits.dev/components/scroll-stack — ideia visual de telas em pilha que se substituem ao rolar. O código foi consultado, sem copiá-lo e sem adicionar Lenis.
- React Bits Scroll Reveal: https://reactbits.dev/text-animations/scroll-reveal — referência de texto dividido e revelação ligada à leitura.
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — dependência instalada no pacote web. Jornada original em `product-journey-motion.ts`, com timeline de 3 capítulos, scroll nativo e scrub de 1.6s; sticky em CSS, sem pin artificial, snap ou scroll-jacking.
- GSAP matchMedia: https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ — reversão ao mudar viewport/preferência e desmontar.

As referências anteriores ficam registradas como histórico. A antiga entrada rápida das duas telas foi substituída pela jornada de três capturas. A nova dependência GSAP é distribuída pelo pacote instalado, com sua licença própria; nenhuma biblioteca de componentes dos catálogos foi copiada.
