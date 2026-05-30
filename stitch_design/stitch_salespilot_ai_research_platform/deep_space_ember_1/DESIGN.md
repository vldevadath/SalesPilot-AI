---
name: Deep Space & Ember
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#bbc7de'
  on-secondary: '#263143'
  secondary-container: '#3e495d'
  on-secondary-container: '#adb9d0'
  tertiary: '#cccccc'
  on-tertiary: '#303030'
  tertiary-container: '#b1b1b1'
  on-tertiary-container: '#444444'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#d7e3fb'
  secondary-fixed-dim: '#bbc7de'
  on-secondary-fixed: '#101c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Sora
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  column-gap: 24px
---

## Brand & Style
The design system is engineered for high-stakes environments, evoking the atmosphere of a professional command center or aerospace interface. It prioritizes information density, technical precision, and a sense of "quiet power." 

The style is a synthesis of **Dark Minimalism** and **Functional Glassmorphism**. It rejects the soft, approachable tropes of consumer SaaS in favor of a rigorous, tool-first aesthetic. Visual interest is generated through depth—achieved via stacked semi-transparent layers—and the sharp, rhythmic use of accent light against a vast, dark canvas. The emotional response is one of focus, reliability, and elite performance.

## Colors
The palette is rooted in the contrast between infinite depth and functional illumination.
- **Deep Space (#081425):** The primary structural color, used for sidebars, headers, and container backgrounds.
- **True Black (#000000):** Used for the base canvas to provide absolute contrast and visual grounding.
- **Ember (#f59e0b):** A high-utility accent color reserved for critical data points, active states, and call-to-actions.
- **Utility Neutrals:** A range of cool grays (Slate 400-900) used for secondary text and subtle UI borders to ensure the interface remains legible without overwhelming the eye.

Use low-alpha versions of the Ember accent for "glow" effects and interactive hover states to maintain a technical, "illuminated screen" feel.

## Typography
Sora is utilized across all levels to reinforce a technical, geometric identity. 
- **Display & Headlines:** Use tight letter-spacing and bold weights to create impact against the dark background.
- **Data Labels:** Always uppercase with increased letter-spacing (0.05em) for maximum legibility at small sizes, mimicking radar or instrument readouts.
- **Body Text:** Kept at a comfortable 14px or 16px to ensure long-form technical data remains readable. 
- **Hierarchy:** Primary emphasis is given to numerical data and status indicators; descriptive text should be set in lower-contrast neutrals.

## Layout & Spacing
The layout philosophy is **Asymmetrical & Data-Focused**. Instead of centered, marketing-style grids, this design system utilizes a modular, dashboard-oriented 12-column grid.

- **Asymmetry:** Use a 2-column or 3-column split where one sidebar remains narrow (navigation/metadata) while the primary stage handles dense data visualizations.
- **Density:** Spacing follows a strict 4px baseline. Gutters are kept tight (16px) to maximize screen real estate.
- **Reflow:** On desktop, components scale to fill the width. On mobile, containers stack vertically, but maintain horizontal scrolling for wide data tables to preserve data integrity.

## Elevation & Depth
Depth is created through **Subtle Glassmorphism** rather than traditional shadows.
- **Layer 0 (Canvas):** Pure #000000.
- **Layer 1 (Containers):** #081425 with a 1px solid border at 10% opacity.
- **Layer 2 (Overlays/Popovers):** Semi-transparent #081425 (0.8 alpha) with a `backdrop-filter: blur(12px)`.
- **Borders:** Every interactive element or container must have a precise 1px border. Use `rgba(255, 255, 255, 0.08)` for standard containers and `rgba(245, 158, 11, 0.3)` for active/selected states.
- **Glow:** For critical warnings or active "Ember" elements, use a very low-spread outer glow (0px 0px 8px) using the primary accent color at 20% opacity.

## Shapes
To maintain the "Command Center" feel, the shape language is sharp and precise.
- **Base Radius:** 4px for all buttons, inputs, and cards.
- **Large Components:** Even large modals or sections should not exceed an 8px radius. 
- **Interactive Elements:** Use hard lines and 45-degree chamfered corners for decorative elements or specialized "status tags" to emphasize the technical aesthetic.

## Components
- **Buttons:** Primary buttons are solid Ember (#f59e0b) with True Black text. Secondary buttons use a ghost style: 1px Ember border with transparent background.
- **Inputs:** Dark backgrounds (#040a12) with a 1px Slate border. On focus, the border turns Ember and the label text glows slightly.
- **Data Tables:** High-density. Zebra striping using a 2% opacity white overlay. No vertical borders; only 1px horizontal dividers.
- **Chips/Status:** Small, 4px rounded rectangles. Use a "dot" indicator next to the text for status (e.g., a pulsing Ember dot for "Live").
- **Cards:** No shadows. Depth is indicated solely by the 1px border contrast against the True Black canvas.
- **Navigation:** Vertical left-hand navigation with icon-only or icon+label states. The active state is indicated by a vertical Ember line (2px width) on the left edge of the menu item.