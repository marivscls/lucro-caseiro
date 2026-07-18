# Design System Audit — Lucro Caseiro

**Date:** 2026-02-14 · **Scope:** `packages/ui`, `apps/mobile` (Expo RN), `apps/web` (Next.js PWA)
**Method:** static analysis (ripgrep counts + manual reading of ~60 files). All counts exclude `node_modules`; mobile counts exclude `src/test/` unless noted.

---

## Executive summary

The **mobile app has a real design system** (`@lucro-caseiro/ui`: tokens + 10 components + theme context) and uses it heavily — 93 files call `useTheme()`, `theme.colors.*` appears ~1 757 times in 92 files. However, a long tail of hardcoded values survives: **295 hex literals (38 files), 196 numeric `fontSize` (47 files), 127 numeric `borderRadius` (34 files), 378 numeric padding/margin/gap (70 files)**, and the `fontSizes` token is **not imported anywhere** in the app. The **`apps/web` PWA does not depend on `@lucro-caseiro/ui` at all** and maintains a completely separate token set — including a **green dashboard palette and DM Sans/Playfair fonts that contradict the mobile brand (rose palette, Fraunces/Nunito Sans per ADR-0008)**. Several token pairs fail WCAG AA contrast, a concern given the elderly audience.

---

## 1. Token usage & inconsistencies

### 1.1 Where tokens live

- `packages/ui/src/theme.ts` — `colors` (static palette, light + dark variants), `fontSizes` (13→64; comment at L61: _"Público inclui idosos: nada abaixo de 13"_), `fonts` (Fraunces/Nunito Sans family names), `spacing` (4→48), `radii` (8→9999). `lightTheme` re-tones `alert`/`premium`/`yellow` for AA contrast (`theme.ts:156-166`); `darkTheme` does **not** get the same treatment (see §3).
- `packages/ui/src/theme-context.tsx` — `ThemeProvider`/`useTheme`; default context value is `darkTheme` (`theme-context.tsx:12-17`).

### 1.2 Token consumption in `apps/mobile` (291 source files: 109 `.tsx` + 182 `.ts`)

| Signal                                                                       | Count                                                  | Verdict                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| Files calling `useTheme()`                                                   | 93 files / 207 calls                                   | ✅ dominant pattern                               |
| `theme.colors.*` references                                                  | 1 757 in 92 files                                      | ✅ dominant pattern                               |
| Files importing tokens (`spacing`/`radii`/`fonts`…) from `@lucro-caseiro/ui` | 63                                                     | ✅ good                                           |
| Files importing static `colors` (bypasses theme)                             | **1** — `apps/mobile/src/app/recurring-expenses.tsx:3` | ⚠️ lone offender                                  |
| Files importing `fontSizes` token                                            | **0**                                                  | ❌ token is dead in the app                       |
| Hardcoded hex `#[0-9a-fA-F]{3,8}`                                            | **295 in 38 files**                                    | ⚠️                                                |
| Hardcoded `fontSize: NN`                                                     | **196 in 47 files**                                    | ❌ violates ADR-0008 rule "nunca fontSize inline" |
| Hardcoded `borderRadius: NN`                                                 | **127 in 34 files**                                    | ⚠️                                                |
| Hardcoded `padding*/margin*/gap: NN`                                         | **378 in 70 files**                                    | ⚠️                                                |
| `fontWeight:` usage                                                          | 2 (both in `apps/mobile/src/app/pricing.tsx:263`)      | ❌ explicitly forbidden (faux-bold on Android)    |
| `StyleSheet.create`                                                          | 4 files (rest is inline styles)                        | ⚠️ two style idioms coexist                       |
| `TouchableOpacity` (legacy)                                                  | 29 refs, all in `features/finance/components/*`        | ⚠️ rest of app uses `Pressable`                   |

Legitimate hex exceptions: PDF generators (`features/quotes/quote-pdf.ts` 22, `features/sales/receipt-pdf.ts` 23, `features/recipes/recipe-pdf.ts` 14), print label editors (`features/labels/*`), the catalog accent-color picker data (`app/catalog.tsx:40-45`), and `shared/components/color-picker-modal.tsx` (color data). Roughly **150 of the 295 hex literals are print/data-legit**; the remaining ~145 are UI colors bypassing the theme.

### 1.3 Worst offender files (mobile)

| File                                                   | hex | fontSize | borderRadius | pad/margin/gap | Notes                                                                                                                                                                            |
| ------------------------------------------------------ | --- | -------- | ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/finance/components/finance-dashboard.tsx`    | 13  | 6        | 24           | 65             | Hardcoded dark-hero colors (`#D0C0B7` L335, `#6ED0A1` L340, `#D6748B` L547), `isDark` ternaries with raw hex (L1093-1115), `StyleSheet.create`, `TouchableOpacity`, raw `<Text>` |
| `app/recurring-expenses.tsx`                           | 0\* | 24       | 16           | 46             | \*Only file importing static `colors`; font sizes 12/13/14/15/16/17/22 (L662-930) — half are off-scale                                                                           |
| `app/tabs/agenda.tsx`                                  | 0   | 23       | 7            | 5              | Also `rgba(196, 112, 126, 0.22)` literal = primary in disguise (L1158)                                                                                                           |
| `app/tabs/clients.tsx`                                 | 2   | 18       | 5            | 3              | `fontSize: 25` override on `h1` (L890)                                                                                                                                           |
| `app/settings.tsx`                                     | 0   | 2        | 10           | 33             |                                                                                                                                                                                  |
| `features/insights/components/monthly-bars.tsx`        | 0   | 15       | 0            | 4              | Chart labels all hardcoded                                                                                                                                                       |
| `app/fiado.tsx`                                        | 4   | 6        | 11           | 6              | Own `fiadoPalette()` duplicating theme derivation (L52-100)                                                                                                                      |
| `features/finance/components/create-finance-entry.tsx` | 7   | 2        | 7            | 20             |                                                                                                                                                                                  |

### 1.4 Token consumption in `apps/web`

**There is none.** `apps/web/package.json` has no `@lucro-caseiro/ui` dependency. Tokens are re-defined as CSS custom properties in `app/globals.css:3-17` (`--ink/--muted/--paper/--green/--amber-soft/…`) with a **different palette** (green `#005c3a` vs mobile rose `#C4707E`), and even then the file hardcodes **138 hex literals** instead of using its own variables (e.g. `#dcffc4` 7×, `#005c3a` repeated at L100,144,196,239,376…). See §4.

---

## 2. Component inventory & API inconsistencies

### 2.1 `packages/ui/src/components` (702 LOC total)

| Component        | Props                                             | Variants                                                                       | Sizes                                      | Theme source | Notes                                                                                                                                                   |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`         | `title, variant, size, loading, icon, style`      | primary, secondary, outline, ghost, success, premium                           | sm 48 / md 48 / lg 56 (sm = md!)           | `useTheme`   | `success`/`premium` hardcode `#FFFFFF` text instead of `textOnPrimary` (`button.tsx:67-68`)                                                             |
| `Card`           | `children, onPress, variant, style, padding`      | surface, elevated, transparent                                                 | padding via `keyof spacing` (default `xl`) | `useTheme`   | Canonical flat style: **no shadow ever** (`card.tsx:31-34`)                                                                                             |
| `Input`          | `label, error, icon, containerStyle`              | —                                                                              | fixed height 52                            | `useTheme`   | Competes with `TextFieldCard` (height 60, border) — see 2.2                                                                                             |
| `Typography`     | `variant, color, serif`                           | display, h1, h2, h3, body, bodyBold, caption, label, money, moneyLg, moneyHero | via `fontSizes`                            | `useTheme`   | Docs forbid style overrides; screens override anyway (47 files)                                                                                         |
| `Badge`          | `label, variant, style`                           | success, warning, danger, info, neutral, premium, lavender, primary            | one size                                   | `useTheme`   | Variant names ≠ Button's (`warning/danger/info` vs `success/premium`); `primary` variant maps to `surface` bg + `primary` text — inconsistent semantics |
| `Chip`           | `label, selected, onPress, icon, disabled, style` | boolean `selected` (not a variant enum)                                        | one size (minHeight 44)                    | `useTheme`   | Only 2 imports in the app; every screen rolls its own pill                                                                                              |
| `IconButton`     | `icon, size (number), variant, style`             | surface, primary                                                               | **raw number** (default 48), not sm/md/lg  | `useTheme`   | Only 1 import in the app — effectively dead                                                                                                             |
| `EmptyState`     | `icon, title, description, action, style`         | —                                                                              | —                                          | `useTheme`   | Used by ~11 screens; sales/home roll custom ones                                                                                                        |
| `ModalHeader`    | `title, onClose, closeLabel`                      | —                                                                              | —                                          | `useTheme`   | 3 imports; `recipes.tsx` defines a local `RecipeModalHeader` with a **different API** (`leftIcon, badgeIcon`) and `fontSize: 26` override               |
| `PressableScale` | `scaleTo, …PressableProps`                        | —                                                                              | —                                          | — (no theme) | 1 import; `Button` and `Card` inline the same spring logic instead of reusing it                                                                        |

**Cross-component inconsistencies:**

1. **Size scales differ**: Button `sm/md/lg` (with sm == md == 48), IconButton raw `size: number`, Chip/Input/Badge fixed single size.
2. **Variant taxonomies differ**: Button has `outline/ghost`, Badge has `warning/danger/info/neutral`, Chip uses a boolean, Card has `surface/elevated/transparent`. No shared `Variant` type.
3. **Label prop differs**: `title` (Button, ModalHeader) vs `label` (Badge, Chip, Input).
4. **Style prop differs**: most take `style?: ViewStyle`, Input takes `containerStyle`, PressableScale takes `StyleProp<ViewStyle>`.
5. `Button` hardcodes `#FFFFFF` for two variants; `IconButton` has no border/hairline treatment so it looks different from Card containers.
6. Nothing in `packages/ui` is reused by `apps/web` (no dependency), so the component inventory is mobile-only.

### 2.2 `apps/mobile/src/shared/components` (24 files) — overlaps with `packages/ui`

| Shared component                                                                                                                                                                                                                         | Overlap / note                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `form-field.tsx` (`TextFieldCard`, `FieldLabel`, `useFieldPalette`)                                                                                                                                                                      | **Duplicates `packages/ui` `Input`** with different metrics (60 vs 52 height, border vs borderless, `fontSize: 16` hardcoded, `FieldLabel` forces `fontSize: 15` — off-scale). 7 files use `TextFieldCard`, 15 use ui `Input` — two field systems in active use |
| `form-section.tsx`                                                                                                                                                                                                                       | Collapsible section; no ui equivalent (fine)                                                                                                                                                                                                                    |
| `toast.tsx` / `alert-host.tsx`                                                                                                                                                                                                           | App-level feedback; fine, theme-aware                                                                                                                                                                                                                           |
| `desktop-shell.tsx`                                                                                                                                                                                                                      | Sidebar nav for the desktop-web build of the RN app; **third nav implementation** (bottom tabs, More screen, this sidebar)                                                                                                                                      |
| `responsive-modal-surface.tsx`                                                                                                                                                                                                           | Modal wrapper; fine                                                                                                                                                                                                                                             |
| `calendar-modal`, `calculator-modal`, `color-picker-modal`, `barcode-scanner`, `date-field`, `email-typo-hint`, `offline-banner`, `ad-banner.*`, `brand-intro`, `animated-list-item`, `keyboard-aware-scroll-view`, `desktop-pagination` | Feature-specific; mostly theme-aware                                                                                                                                                                                                                            |

**Most-used ui symbols (import count, mobile):** `useTheme` 67 · `Typography` 65 · `spacing` 56 · `radii` 43 · `Button` 23 · `fonts` 17 · `Input` 15 · `Card` 13 · `Badge` 5 · `ModalHeader` 3 · `Chip` 2 · `IconButton` 1 · `PressableScale` 1 · static `colors` 1 (`EmptyState` ~11, multi-line imports). Meanwhile `Pressable` is used raw **370+ times** across screens (`new-sale.tsx` 45, `agenda.tsx` 31, `settings.tsx` 27, `fiado.tsx` 27…) — many of those are button-shaped and bypass `Button`.

---

## 3. Dark mode

**Mechanism (mobile, solid):** `ThemeProvider` in `app/_layout.tsx:421-430` with persisted preference (`useThemePref`) hydrated before mount (no flash), defaulting to the system scheme. Toggle lives in `settings.tsx:552`. `lightTheme` deliberately re-tones `alert`→`#B04545`, `premium`→`#8F6620`, `yellow`→`#7E660F` for AA (`theme.ts:156-166`).

**Gaps:**

1. **`darkTheme` never got the same AA pass** — it reuses raw accent colors; `lavender`/`blue`/`success` on their dark backgrounds fail AA (see §3.1). `theme.ts:171-198`.
2. **Hardcoded dark-assuming colors survive**: `finance-dashboard.tsx` hero text `#D0C0B7` (L335), badge `#EF8DA1`/`#B04559` via `isDark` ternaries with raw hex (L1093-1115), icon `#D6748B` (L547); `agenda.tsx:1158` `rgba(196,112,126,0.22)`; `catalog.tsx` `#fff` for on-primary icons (L175, L760). These either break in light mode or silently bypass the token pipeline.
3. **Per-screen palette re-derivation**: `fiado.tsx` `fiadoPalette()`, `agenda.tsx` `agColors`, `form-field.tsx` `useFieldPalette()`, `tabs/index.tsx` inline `theme.mode === "dark"` ternaries — at least 4 independent derivations of the same "dark border/fill" values, with **different rgba alphas** (borders at 0.08 vs 0.1 vs 0.12 vs 0.13).
4. **Web has no dark mode at all**: `layout.tsx:20` `colorScheme: "light"`; no `prefers-color-scheme` anywhere in `apps/web/src`.

### 3.1 Measured contrast (WCAG, computed in this audit)

| Pair                                                | Ratio      | AA normal text (4.5:1)                         |
| --------------------------------------------------- | ---------- | ---------------------------------------------- |
| primary `#C4707E` on light bg `#FFFAF8`             | **3.40:1** | ❌ (links/labels in light mode)                |
| white `textOnPrimary` on primary `#C4707E` (Button) | **3.52:1** | ❌ for 16 px bold; passes only as "large text" |
| `textSecondary` `#8B7355` on light bg               | **4.33:1** | ❌ marginal fail                               |
| Badge lavender `#B8A9D4` on `#F0ECF7` (light)       | **1.87:1** | ❌❌                                           |
| Badge info `#89A5B5` on `#E8EFF3` (light)           | **2.23:1** | ❌❌                                           |
| Badge success `#6BBF96` on `#E8F5EE` (light)        | **1.97:1** | ❌❌                                           |
| Badge success `#6BBF96` on `#2D5A42` (dark)         | **3.59:1** | ❌                                             |
| Badge premium `#D4A054` on `#5A4222` (dark)         | **4.00:1** | ❌                                             |
| `textSecondaryDark` `#B8A090` on dark bg            | 7.08:1     | ✅                                             |
| Web `--muted` `#7d8778` on white card               | **3.60:1** | ❌ (used at 10–13 px)                          |

Given the elderly audience, the Badge system and primary-on-light failures are the highest-impact a11y defects.

---

## 4. Web (PWA) styling

**Stack:** Tailwind CSS v4 is installed (`tailwindcss@4.1.18` + `@tailwindcss/postcss`) and imported via `@import "tailwindcss"` in `globals.css:1` — **but zero utility classes are used**. All styling is (a) a 2 171-line hand-written `app/globals.css` with global classes (`.sidebar`, `.panel`, `.button`, `.metric-grid`, `.status`, `.empty-state`, marketing-brief classes…), and (b) CSS modules for the landing site (`features/landing/landing-page.module.css` 1 181 lines, `price-calculator.module.css` 975, `site-page.module.css` 255).

**Token duplication/drift — three brand identities:**

| Surface                                | Palette                                                         | Fonts                             | Source                                                                                |
| -------------------------------------- | --------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| Mobile app                             | rose `#C4707E`, bg `#FFFAF8`, text `#4A3228`                    | Fraunces + Nunito Sans (ADR-0008) | `packages/ui/src/theme.ts`                                                            |
| Web landing                            | _near_-rose `#c86f82` / `#9e4f63`, bg `#fff9f6`, text `#4a3228` | Fraunces + Nunito Sans ✓          | `landing/layout.tsx`, `*.module.css` (~130 hardcoded hex, values drifted from tokens) |
| Web dashboard ("Central de Marketing") | **green `#005c3a` + lime `#c8ff9a`, bg `#fafbf7`**              | **DM Sans + Playfair Display**    | `globals.css:3-17`, `layout.tsx:2-8`                                                  |

The dashboard rebrand ("Selenita greens", commit `397d558`) contradicts ADR-0008 and the landing/mobile identity; the manifest uses a fourth green `#173f35` (`public/manifest.webmanifest:7-8`, `layout.tsx:20`) that exists nowhere in the CSS tokens. `globals.css` also ignores its own variables: `--green` is defined once and then `#005c3a` is hardcoded ~10 more times; eyebrow `#006f49` (L206) ≠ `--green`; `--amber: #05a66b` is literally green (L12, copy-paste artifact).

**Other web issues:** global element selectors (`label`, `input`, `summary`) leak styles app-wide (`globals.css:1038-1055`); tiny fonts for an elderly audience — 9 px (`.idea-context dt` L764), 10 px (`.field-help` L583), 11 px 20+ times; no dark mode; almost no shared components (`features/marketing/page-header.tsx` is the only reusable piece).

---

## 5. Typography

**Mobile (good foundation, leaky usage):** ADR-0008 (`docs/adr/0008-tipografia-fraunces-nunito-sans.md`) mandates Fraunces 600/700 display + Nunito Sans 400–800 text, loaded via `@expo-google-fonts` in `app/_layout.tsx:407-414`, exposed as `fonts` tokens and `Typography` variants. In practice: 196 hardcoded `fontSize` in 47 files; `fontWeight: "800"` in `pricing.tsx:263` (the exact faux-bold trap ADR-0008 warns about); off-scale overrides like `fontSize: 25` (`tabs/clients.tsx:890`), `fontSize: 26` (`recipes.tsx` `RecipeModalHeader`), `fontSize: 15` (`form-field.tsx:33`); tab-bar labels at **11 px** (`tabs/_layout.tsx:39-43`) and home shortcut tiles at **12 px with `minimumFontScale={0.78}`** (`tabs/index.tsx:172-178`) — effective ~9.4 px, far below the 13 px floor the token file itself mandates for an audience that includes elderly users.

**Web:** dashboard loads DM Sans + Playfair Display (`layout.tsx:7-8`) — different families from the brand; landing correctly loads Fraunces + Nunito Sans but through separate CSS-variable names (`--font-landing-*`). Web sizes are free-form px everywhere (`.page-header h1` `clamp(34px,4vw,54px)`, `.metric strong` 24 px, body 13–16 px…), with 9–11 px microcopy throughout the marketing-brief UI.

---

## 6. Screen-level patterns (sampled: tabs/index, tabs/sales, tabs/clients, tabs/agenda, tabs/new-sale, finance, fiado, products, catalog, pricing, settings + web dashboard)

**Headers — the biggest pattern inconsistency.** `app/_layout.tsx:244-369` declares native Stack header options (title, colors) for 15 screens — and **all 15 then set `headerShown: false` and hand-render the same back-header**: `Pressable(arrow-back, 32×40 hitbox) + Typography h1`, copy-pasted in `settings.tsx:310-335`, `products.tsx:656-685`, `catalog.tsx:914-940`, `materials.tsx`, `packaging.tsx`, `plans.tsx`, `pricing.tsx`, `quotes.tsx`, `purchases.tsx`, `recipes.tsx`, `insights.tsx`, `fiado.tsx`, `suppliers.tsx`, `support.tsx`, `labels.tsx`… with drift: icon size 24 vs 28 vs **29** (`fiado.tsx:809`), title variant h1 vs h2 (`pricing.tsx:259-265` + illegal `fontWeight`), some `serif`, some with trailing actions (search/history). `recipes.tsx` uses a local `RecipeModalHeader` for modals while `materials/quotes/new-sale` use ui `ModalHeader`. Home (`tabs/index.tsx:691`) and catalog use `h1 serif`; fiado uses its own `pal.text`.

**Layout idioms:** SafeAreaView + ScrollView with `padding: 20, gap: 20` literals (`settings.tsx:337-340`) vs `spacing` tokens elsewhere; 4 files use `StyleSheet.create`, the rest inline objects; finance mixes `Pressable`/`TouchableOpacity`/raw `<Text>`.

**FABs — no shared component:** clients FAB 56×56, `bottom: 98/118`, shadow opacity 0.34 (`tabs/clients.tsx:563-579`); fiado CTA shadow 0.35 (`fiado.tsx:1018-1022`); recipes shadow 0.35 radius 16 (`recipes.tsx:190-194`); new-sale summary shadow 0.22 (`tabs/new-sale.tsx:938-942`); the tab-bar "+" is a 50×50 custom circle built from two rectangles (`tabs/_layout.tsx:82-116`) instead of an icon.

**Empty states:** ui `EmptyState` used in ~11 screens (agenda, clients, labels, materials, packaging, pricing, purchases, quotes…), often with per-screen PNG art (`assets/*-empty.png` — a nice, consistent touch). But `tabs/sales.tsx:409-424` builds its own copy/icon system, and home uses inline empty strings (`tabs/index.tsx:76`). Web has `.empty-state` / `.empty-inline` classes — different visuals again.

**Lists/cards:** home's canonical "flat container" (`tabs/index.tsx:82-88`: surfaceElevated + hairline border, no shadow) is well propagated through `Card`, but feature screens still hand-build containers with divergent radii (12/13/16/20/24/27/999 in `recurring-expenses.tsx` alone).

**Web dashboard:** consistent within itself (sidebar shell + `.page-header` + `.panel` grid, `dashboard-shell.tsx`, `page-header.tsx`) — but it is a _marketing CMS_, visually unrelated to the product app it markets.

---

## 7. Elevation / shadows

**No shadow tokens exist.** Policy is stated only in a comment: cards are flat, shadows reserved for floating overlays (`card.tsx:31-34`). In practice, shadows are ad-hoc recipes scattered across screens — at least 7 distinct combos:

| Where                                         | offset / opacity / radius / elevation    |
| --------------------------------------------- | ---------------------------------------- |
| `tabs/index.tsx:109-113` (avatars)            | 8 / 0.25 / 12 / 4                        |
| `tabs/_layout.tsx:91-95` (tab "+")            | 3 / 0.16 / 6 / 4                         |
| `tabs/clients.tsx:574-578` (FAB)              | 12 / 0.34 / 20 / 8                       |
| `tabs/new-sale.tsx:938-942`                   | 10 / 0.22 / 18 / 4                       |
| `fiado.tsx:1018-1022`                         | 8 / 0.35 / 18 / 8                        |
| `recipes.tsx:190-194`                         | 8 / 0.35 / 16 / 8                        |
| Web `globals.css:16` (`--shadow`), L312, L473 | 3 more recipes incl. `0 30px 80px` modal |

All mobile shadows use `shadowColor: theme.colors.primary` — the _idea_ is consistent; the values are not. Web has one `--shadow` var but bypasses it in 4 places.

---

## 8. Icons & imagery

- **Mobile:** `@expo/vector-icons` **Ionicons** only (75 files) — single library ✓. But sizing is chaotic: **23 distinct sizes** — 20 (66×), 28 (36×), 22 (36×), 24 (26×), 18 (21×), 26 (11×), 16 (9×), plus 13, 14, 17, 19, 21, 23, 25, 27, 29, 30, 31, 32, 34, 36, 44, 52, 64. No icon-size token exists. The back-arrow alone is 24/28/29. Weight inconsistency comes from mixing `-outline` and filled variants ad hoc.
- **Web:** `lucide-react@0.468`, sizes 14–48 including odd 15/17/19; default stroke, no wrapper enforcing size steps.
- **Imagery:** strong custom PNG set (`apps/mobile/src/assets/`: per-feature `*-empty.png`, `*-hero.png`, 9 onboarding niche illustrations, `auth-house.png`) used consistently in empty states and heroes (finance/fiado heroes with scrim overlays). Web landing reuses none of it — different illustration language.

---

## Top priority fixes (ranked)

**Accessibility (audience includes elderly users):**

1. **Badge contrast failures** — lavender 1.87:1, success 1.97:1 (light), info 2.23:1: re-tone `darkTheme` accents and light badge foregrounds the way `lightTheme` already re-toned alert/premium/yellow (`theme.ts:141-198`).
2. **Primary on light background 3.40:1** — darken `lightTheme.colors.primary` for text usage (or add a `primaryText` token) (`theme.ts:144`).
3. **Button text 3.52:1** (white on `#C4707E` at 16 px bold) — darken primary or bump size/weight; also replace hardcoded `#FFFFFF` with `textOnPrimary` (`button.tsx:67-68`).
4. **Sub-13 px text**: tab labels 11 px (`tabs/_layout.tsx:41`), home tiles 12 px × 0.78 scale (`tabs/index.tsx:172-178`), web 9–11 px microcopy (`globals.css` L367, L583, L764…), `textSecondary` light at 4.33:1.

**Design-token integrity:**

5. **Web dashboard contradicts the brand**: green `#005c3a`/`#c8ff9a` + DM Sans/Playfair vs ADR-0008 Fraunces/Nunito + rose — decide one identity; if the rebrand is intentional, migrate tokens + fonts into a shared package and update mobile/landing/manifest (4 different greens/pinks today).
6. **Create a shared token package for web** (or export tokens from `@lucro-caseiro/ui`) — landing drift (`#c86f82` vs `#C4707E`, `#fff9f6` vs `#FFFAF8`) proves copy-paste decay; remove the 138 hardcoded hex in `globals.css` in favor of its own vars.
7. **`fontSizes` token is dead** (0 imports) while 196 hardcoded `fontSize` survive in 47 files — sweep worst files first: `recurring-expenses.tsx` (24), `tabs/agenda.tsx` (23), `tabs/clients.tsx` (18), `monthly-bars.tsx` (15).
8. **Remove the lone static `colors` import** (`recurring-expenses.tsx:3`) — breaks dark mode silently.
9. **Fix `pricing.tsx:263` `fontWeight: "800"`** — ADR-0008 violation, faux-bold on Android.
10. **Theming leaks in finance**: `finance-dashboard.tsx` raw hero hexes (L335/340/547, L1093-1115) and `agenda.tsx:1158` `rgba(196,112,126,…)` — route through theme (hero scrim colors deserve tokens).

**Component & pattern consolidation:**

11. **One `ScreenHeader` component** — replace ~15 copy-pasted back-headers (icon 24/28/29, h1/h2 drift) and reconcile with the declared-but-disabled native headers in `_layout.tsx`.
12. **Merge the two text-field systems** (`ui/Input` 52 h vs `TextFieldCard` 60 h + `FieldLabel` 15 px) into one API.
13. **One filter-pill**: adopt `Chip` (2 imports today) or fold the 4 custom pills (sales `FilterPill`, fiado, agenda, recurring-expenses `categoryPill`) into it.
14. **One `FAB`** with shadow tokens; align the 5+ divergent FAB/CTA shadow recipes (§7) and add `shadows` tokens (`fab`, `overlay`) to `theme.ts`.
15. **Kill or justify dead components**: `IconButton` (1 use), `PressableScale` (1 use), `ModalHeader` (3 uses vs a competing local `RecipeModalHeader`).
16. **Icon size tokens** (e.g. 16/20/24/28) to collapse 23 sizes; fix back-arrow drift; align web lucide sizes to the same steps.
17. **Unify style idioms**: `StyleSheet.create` (4 files) vs inline; `TouchableOpacity` → `Pressable` in finance; finance's raw `<Text>` → `Typography`.
18. **Decide Tailwind's fate on web**: it's shipped but unused — either adopt utilities and delete swaths of `globals.css`, or drop the dependency.

---

### Appendix — reproduction commands

```bash
rg -c '#[0-9a-fA-F]{3,8}\b' apps/mobile/src apps/web/src   # hex literals
rg -c 'fontSize:\s*\d+' apps/mobile/src                    # hardcoded font sizes
rg -c 'borderRadius:\s*\d+' apps/mobile/src                # hardcoded radii
rg -c '(padding|margin|gap)(Horizontal|Vertical|Top|Bottom)?:\s*\d+' apps/mobile/src
rg -c 'useTheme\(' apps/mobile/src                         # token adoption
rg 'import\s*\{[^}]*\bcolors\b[^}]*\}\s*from' apps/mobile/src
```
