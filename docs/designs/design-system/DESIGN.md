# Design System Document

## 1. Overview & Creative North Star: "Profissional Quente"

O Lucro Caseiro precisa transmitir acolhimento sem parecer restrito à confeitaria. O norte
criativo canônico é **Profissional Quente**: canvas neutro, tipografia humana, dados legíveis e
rosa usado como assinatura — não como preenchimento dominante.

O app atende da confeiteira ao eletricista. Por isso, ilustrações artesanais podem aparecer em
momentos editoriais, onboarding e estados vazios, mas não definem todos os fluxos operacionais.
Telas de trabalho priorizam clareza, previsibilidade e decisões rápidas.

---

## 2. Color Palette & Tonal Architecture

Os valores executáveis em `packages/ui/src/theme.ts` são a fonte da verdade.

### Primary & Functional

- **Primary (Rosa Queimado):** `#B65F72` — assinatura de marca e destaques sem texto pequeno.
- **Primary Interactive:** `#A85A67` — botões preenchidos com contraste AA.
- **Background:** `#FAF8F6` — canvas neutro quente.
- **Surface:** `#F5F3F1` — agrupamentos discretos.
- **Surface Elevated:** `#FFFFFF` — cards e campos que precisam se separar do canvas.
- **Text:** `#2C2A29`.
- **Text Secondary:** `#6B6660`.
- **Border:** `#E9E5E2`.

### Semantic Accents

- **Success:** `#6BBF96` (Verde Menta)
- **Alert:** `#E07272` (Coral Suave)
- **Premium:** `#D4A054` (Dourado)
- **Info/Tags:** `#B8A9D4` (Lavanda) / `#89A5B5` (Azul Acinzentado)

### Regra de borda flat

Cards operacionais usam fundo opaco, raio da escala `radii` e borda hairline do token
`theme.colors.border`. Divisores internos só entram quando ajudam a comparar dados ou alinhar
linhas; para separar seções, preferir espaço e mudança de superfície. Bordas escuras, sombras
hardcoded e raios mágicos são proibidos.

---

## 3. Typography: The Editorial Voice

Usamos uma única família em toda a interface, conforme o ADR-0008:

- **Nunito Sans 400/600/700/800:** display, títulos, corpo, controles, labels e números.
- **Hierarquia:** display, h1, h2 e h3 usam Bold; ExtraBold fica reservado a números de destaque.
- **Hierarquia visível:** display 36/42, h1 28/34 e h2 22/28 permanecem grandes; textos
  corridos usam body 15/22 e legendas usam caption 13/18.
- **Dados financeiros:** variantes `money*` do componente `Typography`, com Nunito Sans
  ExtraBold e números tabulares.

Nunca definir `fontFamily`, `fontWeight` ou tamanhos soltos na tela quando uma variante de
`Typography` resolve.

---

## 4. Elevation & Depth: Tonal Layering

We do not use shadows to create depth. We use the **Layering Principle**.

- **Surface Nesting:** `surfaceElevated` sobre `surface` ou `background`.
- **Hairline Border:** `theme.colors.border`, nunca hex/rgba local.
- **Elevation:** exclusivamente `theme.shadows.sm|md|lg`; cards operacionais comuns permanecem
  flat.
- **Glassmorphism:** não é identidade principal. Só pode aparecer quando o componente canônico e
  a plataforma garantirem contraste e fallback.

---

## 5. Components

### Botões: hierarquia calma

- **Primário:** preenchimento `theme.colors.primaryInteractive`, texto
  `theme.colors.textOnPrimary`; existe no máximo um preenchido de rosa por viewport.
- **Secundário:** superfície neutra, texto grafite e borda hairline. Nunca disputa atenção com o
  primário.
- **Texto:** sem superfície; use `text` para ações de marca e `ghost` para voltar, cancelar ou
  adiar.
- **CTA de estado vazio:** largura intrínseca, centralizado e próximo da explicação. Se ele existe,
  a mesma ação não aparece simultaneamente em FAB, cabeçalho ou barra inferior.
- **Densidade:** `sm` 40 px visuais (alvo de toque 44), `md` 44 px e `lg` 48 px; raio canônico
  `radii.md`, texto semibold e padding horizontal proporcional ao conteúdo.
- **Largura:** intrínseca por padrão. Ocupar toda a linha somente em formulários/modais onde a ação
  precisa compartilhar a barra com outra ação ou onde a ergonomia móvel justificar.
- **Dourado:** reservado a badge, ícone ou detalhe de plano/conquista; CTA de assinatura continua
  rosa.

### Inputs: The Soft Entry

- **Field:** 48 px, `surfaceElevated`, `radii.lg`, borda `theme.colors.border`.
- **Focus State:** foco visível com cor primária AA; no PWA, nunca remover o indicador sem
  substituto.

### Cards: The Organic Canvas

- **Architecture:** `Card` canônico, raios `xl`/`2xl`, fundo opaco e borda hairline quando
  `outlined`.
- **Illustration Integration:** opcional e contextual; nunca presumir confeitaria para todos os
  públicos.
- **Spacing:** usar exclusivamente a escala `spacing`.

### Lists: The Invisible Flow

- **Rule:** priorizar espaço; divisores hairline são permitidos dentro de listas densas quando
  melhoram varredura.
- **Grouping:** itens relacionados podem compartilhar um `ListCard` ou `Card`.

---

## 6. Do’s and Don’ts

### Do:

- **Use espaço suficiente:** sem sacrificar densidade operacional ou criar scroll desnecessário.
- **Use rosa com função:** ação primária, seleção, link ou momento de marca.
- **Use semântica:** verde, âmbar e vermelho carregam significado operacional.

### Don’t:

- **No paletas locais:** usar `theme.colors`.
- **No gradients/glass como identidade:** preservar a linguagem flat.
- **No sombras pesadas/hardcoded:** usar tokens somente quando necessário.
- **No fontes de sistema em novos componentes:** usar Nunito Sans pelos tokens.
- **No mobile esticado no desktop:** conter superfícies, formulários e ações.

---

## 7. Dark Mode: "The Midnight Kitchen"

In Dark Mode, we maintain warmth by avoiding pure blacks.

- **Background:** `#1B1917`.
- **Surface:** `#272422`.
- **Surface Elevated:** `#33302D`.
- **Text:** `#F5F4F2`.
- **Interaction:** usar os pares claros/escuros definidos em `darkTheme`; nunca reutilizar um
  fill claro sem validar contraste.
