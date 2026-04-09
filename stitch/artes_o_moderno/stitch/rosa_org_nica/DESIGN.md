# Design System Document

## 1. Overview & Creative North Star: "The Artisanal Atelier"

The "Artisanal Atelier" is our Creative North Star. This system rejects the industrial rigidity of modern software in favor of a digital environment that feels curated, tactile, and intentionally soft. Inspired by boutique editorial journals and high-end botanical apps, the interface avoids "app-like" containers. Instead, it treats the screen as a canvas of fine-pressed paper where elements breathe through generous white space (`Spacing 16` to `24`) and organic asymmetry.

We break the "template" look by allowing organic illustrations to bleed off the edges of cards and by using high-contrast typography scales that prioritize beauty over density. Every screen should feel like a deep breath—calm, sophisticated, and human.

---

## 2. Color Palette & Tonal Architecture

Our palette is rooted in warm, earthy tones that evoke home-baked warmth and professional craft.

### Primary & Functional

- **Primary (Rosa Chá):** `#C4707E` – Used for primary actions and brand emphasis.
- **Secondary (Rosa Suave):** `#D4919C` – Used for supportive elements.
- **Background (Creme Rosado):** `#FFF5F0` – The base "paper" of the experience.
- **Surface (Rosa Neve):** `#F5E1DB` – The primary card and container color.
- **Text (Marrom Quente):** `#4A3228` – High-contrast readability.
- **Subtext (Marrom Claro):** `#8B7355` – Secondary information.

### Semantic Accents

- **Success:** `#6BBF96` (Verde Menta)
- **Alert:** `#E07272` (Coral Suave)
- **Premium:** `#D4A054` (Dourado)
- **Info/Tags:** `#B8A9D4` (Lavanda) / `#89A5B5` (Azul Acinzentado)

### The "No-Line" Rule

**Strict Prohibition:** 1px solid borders are forbidden for sectioning.
Boundaries must be defined solely through background color shifts. A `surface-container` (`#F5E1DB`) sitting on a `background` (`#FFF5F0`) provides all the definition needed. If a visual break is required, use white space (from the `8.5rem` or `7rem` scale) rather than a line.

---

## 3. Typography: The Editorial Voice

We use a high-contrast typographic pairing to balance tradition (Serif) with modern approachability (Rounded Sans).

- **Display & Headlines (Playfair Display):** Our "Boutique" voice. Use `display-lg` (3.5rem) for hero screens with tight tracking to create an editorial feel.
- **Body & Labels (Quicksand):** Our "Welcoming" voice. The rounded terminals of Quicksand complement the 16px-24px corner radii of our UI components.
- **Data & Numerics (Poppins Bold):** Our "Precision" voice. Use Poppins exclusively for currency, percentages, and counts to ensure financial data feels authoritative and clear.

---

## 4. Elevation & Depth: Tonal Layering

We do not use shadows to create depth. We use the **Layering Principle**.

- **Surface Nesting:** Depth is achieved by "stacking" tones. Place a white (`#FFFFFF`) card on top of a `surface-container` (`#F5E1DB`), which itself sits on the `background` (`#FFF5F0`). This creates a three-dimensional "paper stack" effect without a single drop shadow.
- **The Ghost Border:** If a UI element (like an empty state or a subtle button) requires a boundary for accessibility, use the `outline-variant` token at 15% opacity. It should be felt, not seen.
- **Glassmorphism:** For floating navigation bars or "snack bar" alerts, use the surface color with a 70% opacity and a `20px` backdrop blur. This allows the organic illustrations underneath to bleed through softly, maintaining the "welcoming" atmosphere.

---

## 5. Components

### Buttons: The Tactile Touch

- **Primary:** Background `#C4707E`, Text `#FFFFFF`. Corners: `16px`. No shadows.
- **Secondary:** Background `#F5E1DB`, Text `#4A3228`. Corners: `16px`.
- **States:** On press, the primary button shifts to a 10% darker tint; no "lifting" animations.

### Inputs: The Soft Entry

- **Field:** Background `#FFFFFF`, Corners: `12px`.
- **Focus State:** Instead of a heavy border, use a soft glow (low-opacity Primary color) or a subtle shift in the label color to Marrom Quente.

### Cards: The Organic Canvas

- **Architecture:** Corners `xl` (24px) or `lg` (20px). No borders.
- **Illustration Integration:** Flat, organic illustrations (cakes, whisk, rolling pin) must "peek" from the bottom-right or top-left corners, partially masked by the card's radius.
- **Spacing:** Minimum internal padding of `Spacing 4` (1.4rem) to ensure elements never feel cramped.

### Lists: The Invisible Flow

- **Rule:** Forbid divider lines. Use vertical white space (`Spacing 3` or `3.5`) to separate list items.
- **Grouping:** Group related list items onto a single `Surface` card to create a visual "bucket" without needing structural lines.

---

## 6. Do’s and Don’ts

### Do:

- **Use "Aggressive" White Space:** If in doubt, add more space. The goal is to have "few elements per screen."
- **Embrace Asymmetry:** Place titles slightly off-center or allow images to overlap container edges to break the "grid" feel.
- **Prioritize Color Shifts:** Use the difference between `#FFF5F0` and `#F5E1DB` to guide the eye.

### Don’t:

- **No Material Design:** Avoid FABs (Floating Action Buttons), ripples, or standard Material icons.
- **No Gradients:** Keep colors flat and honest to maintain the "Sophisticated/Clean" aesthetic.
- **No Heavy Shadows:** Shadows make the interface feel "heavy" and "tech-focused." We want "light" and "home-grown."
- **No Roboto:** Never use standard system fonts. Stick strictly to the Playfair/Quicksand/Poppins triad.

---

## 7. Dark Mode: "The Midnight Kitchen"

In Dark Mode, we maintain warmth by avoiding pure blacks.

- **Background:** `#1E1814` (Deep Espresso)
- **Cards/Surface:** `#2C2420` (Roasted Cocoa)
- **Text:** `#F5E1DB` (Rosa Neve)
- **Interaction:** Maintain the primary `#C4707E` for buttons to ensure brand recognition remains consistent across modes.
