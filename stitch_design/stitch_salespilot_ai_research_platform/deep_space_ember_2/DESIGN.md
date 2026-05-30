---
name: Deep Space & Ember
colors:
  surface: '#081425'
  surface-dim: '#081425'
  surface-bright: '#2f3a4c'
  surface-container-lowest: '#040e1f'
  surface-container-low: '#111c2d'
  surface-container: '#152031'
  surface-container-high: '#1f2a3c'
  surface-container-highest: '#2a3548'
  on-surface: '#d8e3fb'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#d8e3fb'
  inverse-on-surface: '#263143'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#8fd5ff'
  on-tertiary: '#00344a'
  tertiary-container: '#1abdff'
  on-tertiary-container: '#004966'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#c5e7ff'
  tertiary-fixed-dim: '#7fd0ff'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#004c6a'
  background: '#081425'
  on-background: '#d8e3fb'
  surface-variant: '#2a3548'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.04em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.03em
  headline-sm:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style

This design system evokes the precision and isolation of deep space exploration, punctuated by the intense energy of a re-entry glow. The target audience includes developers, data scientists, and technical enthusiasts who value high-performance interfaces that minimize visual noise while maximizing clarity.

The aesthetic is a fusion of **Minimalism** and **High-Contrast / Bold** styles. It utilizes a true obsidian foundation to create an infinite depth of field, allowing primary "Ember" elements to radiate with tactical importance. The emotional response is one of focus, technical mastery, and premium reliability. All interfaces must feel like high-end instrumentation: deliberate, responsive, and sharp.

## Colors

The palette is anchored in **Obsidian Black (#050505)** to ensure the highest possible contrast ratios and to eliminate the "milky" grayness of standard dark modes. 

- **Cyber Amber (#f59e0b):** Used exclusively for primary actions, critical state indicators, and active selection states. It represents the "Ember" energy.
- **Emerald Glow (#10b981):** Reserved for positive signals, success states, and growth metrics.
- **Slate Smoke (#1e293b):** Used for container surfaces, cards, and section dividers to provide subtle structural hierarchy against the obsidian background.
- **Text & UI Elements:** Use pure white (#ffffff) for high-emphasis text and Slate 400 (#94a3b8) for secondary metadata to maintain a clean, technical hierarchy.

## Typography

The design system utilizes **Sora** across all levels to leverage its geometric, technical structure. To achieve a more premium and "instrument-grade" feel, letter spacing has been increased on all headline levels.

- **Headlines:** Feature wide tracking and heavy weights to act as anchors for the page.
- **Labels:** Use uppercase with aggressive letter spacing (0.08em) to mimic technical readouts and data labels.
- **Body Text:** Standard tracking is maintained for maximum readability on dark backgrounds. Avoid weights below 400 to ensure stroke clarity against the obsidian backdrop.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for desktop to maintain a sense of controlled, precise data density. 

- **Grid:** A 12-column grid with 24px gutters. 
- **Rhythm:** All spacing is based on a 4px baseline unit. 
- **Containers:** Use generous outer margins (64px) on desktop to emphasize the "void" of the obsidian background, making the central content area feel like a floating tactical console.
- **Reflow:** On mobile, margins shrink to 16px and the grid collapses to a single column, with vertical stack spacing increasing to maintain legibility.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines** rather than traditional shadows. 

- **Z-Index 0:** Pure Obsidian Black (#050505) for the base environment.
- **Z-Index 1:** Slate Smoke (#1e293b) for primary containers.
- **Z-Index 2:** Slate 800 (#1e293b) with a 1px solid border of Slate 700 to create a "raised" effect for modals or popovers.
- **Accents:** Use a subtle outer glow (0px 0px 12px) of Cyber Amber at low opacity (15%) for primary buttons to simulate a radiant heat source.

## Shapes

The shape language is **Soft (0.25rem)**. This slight rounding provides a modern, machined feel—reminiscent of aerospace components—without becoming too friendly or organic. Large containers and cards should use `rounded-lg` (0.5rem) to provide a clear distinction from smaller UI elements like inputs and chips.

## Components

- **Buttons:** Primary buttons use Cyber Amber with black text for maximum contrast. Secondary buttons use an outline of Slate Smoke with white text.
- **Chips/Badges:** Success badges use a dark Emerald tint (10% opacity) with a solid Emerald Glow border and text. Technical tags use Slate Smoke backgrounds.
- **Input Fields:** Backgrounds must be pure Obsidian with a 1px Slate Smoke border. On focus, the border transitions to Cyber Amber with a subtle glow.
- **Progress Bars:** Backgrounds use Slate Smoke. The fill uses a gradient from Cyber Amber to a slightly more orange hue to simulate intensity.
- **Charts:** Use Cyber Amber for primary data series and Emerald Glow for secondary/positive series. Grid lines should be faint Slate Smoke (20% opacity).
- **Cards:** Defined by Slate Smoke backgrounds and 0.5rem rounded corners. Avoid shadows; use 1px borders to separate from the obsidian base if necessary.