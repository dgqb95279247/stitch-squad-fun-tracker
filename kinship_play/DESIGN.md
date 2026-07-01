---
name: Kinship & Play
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424754'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built for a tight-knit circle of friends, focusing on the shared joy of leisure and the friendly friction of competition. The brand personality is **vibrant, celebratory, and approachable**, aiming to transform data tracking into a social experience.

The design style leverages **Modern Minimalism with Tactile Softness**. It avoids the sterility of enterprise tools by using "Soft UI" principles—large radii, gentle depth, and high-energy color accents. The interface should feel like a physical game board: inviting to touch, easy to read, and emotionally rewarding.

**Key visual principles:**
- **Shared Energy:** Every interaction should feel like a high-five or a friendly nudge.
- **Clarity in Competition:** Use whitespace and clear hierarchy to ensure game stats are legible at a glance.
- **Playful Precision:** While the aesthetic is soft, the alignment and systematic logic remain disciplined and professional.

## Colors

The palette is designed to categorize activities and celebrate milestones through a "Logic & Emotion" framework.

- **Social Blue (#3B82F6):** The primary engine. Used for main actions, navigation, and core brand elements. It represents the "Social Glue" of the group.
- **Winner Gold (#F59E0B):** Reserved for achievements, first-place badges, and "MVP" moments. Use sparingly to maintain its high-value impact.
- **Activity Accents:**
    - **Soft Green (#10B981):** Logic-based activities (Mahjong, Poker).
    - **Coral Pink (#F43F5E):** Social-heavy activities (Dining, Party Games).
- **Neutral Palette:** Utilizes cool slates rather than pure greys to maintain a modern, "tech-forward" feel. Backgrounds should use a very light tint of Social Blue (#F8FAFC) to keep the UI feeling "airy."

## Typography

This design system employs a dual-font strategy to balance personality with legibility.

1.  **Quicksand (Headlines):** Used for all display and headline levels. Its rounded terminals mirror the "Soft UI" shape language, making titles feel friendly and non-intimidating.
2.  **Be Vietnam Pro (Body & Labels):** A contemporary sans-serif used for data, descriptions, and UI controls. It provides a more structured contrast to Quicksand, ensuring that even dense game statistics remain highly readable.

**Styling Rules:**
- **Weight over Color:** Use font weight (SemiBold/Bold) to create hierarchy rather than just shifting colors.
- **Numbers:** When displaying scores or currency, use **Be Vietnam Pro Medium** with slightly increased letter spacing for maximum clarity.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid with Generous Safe Areas**. Given the social nature of the app, content is often grouped into cards that reflow based on the device width.

- **The 8pt Rhythm:** All padding, margins, and heights must be multiples of 4px (with 8px being the base increment).
- **Mobile First:** The 4-friend limit allows for a compact "Grid of 4" or a "Leaderboard List." On mobile, prioritize vertical scrolling with sticky headers for the active game session.
- **Card-Centric:** Information is almost always encapsulated in containers. Use 16px (gutter) to separate cards and 20px (margin) to provide a "breathing room" frame around the viewport.

## Elevation & Depth

To achieve the "Soft UI" look, this design system avoids harsh borders and heavy black shadows. Instead, it uses **Ambient Tonal Shadows**.

- **Surface Levels:**
    - **Level 0 (Background):** A soft, cool-tinted white (#F8FAFC).
    - **Level 1 (Cards/Basics):** Pure white surface with a very soft, diffused shadow: `0px 4px 20px rgba(59, 130, 246, 0.08)`. The shadow should be tinted with the Primary color.
    - **Level 2 (Interactive/Floating):** Used for buttons or active state cards. A more pronounced shadow: `0px 8px 30px rgba(59, 130, 246, 0.15)`.
- **Inner Depth:** For input fields or "empty" slots, use a subtle inner shadow or a 1px soft-grey stroke (#E2E8F0) to create a recessed effect.

## Shapes

The shape language is **distinctly rounded** to reinforce the friendly and leisure-focused nature of the app. 

- **Primary Radius (16px):** Used for all standard cards, modals, and larger containers. 
- **Component Radius (12px):** Used for buttons and input fields to maintain a cohesive look with the larger cards.
- **Avatar Shapes:** While most of the UI is rounded-square, player avatars should be **perfectly circular** with a 2px offset border to differentiate people from interactive buttons.
- **Badges:** Win/Loss badges use a "Pill" shape (full rounding) to sit comfortably on top of circular avatars.

## Components

### Activity Cards
The centerpiece of the UI. Each card should feature:
- A soft-colored icon background corresponding to the game type (e.g., a soft green circle for Mahjong).
- A 16px corner radius and Level 1 elevation.
- A "Participants" row showing the 4 friends' avatars.

### Player Avatars & Badges
- **Avatars:** Circular, 48px base size.
- **Win Badges:** A small 'Winner Gold' star or crown icon positioned at the top-right (2 o'clock) of the avatar.
- **Status Indicators:** Use a subtle ring around the avatar (Social Blue) to indicate the "Current Dealer" or "Active Player."

### Buttons
- **Primary:** Full-width Social Blue with white text, 12px radius.
- **Secondary:** White background with a 1px Social Blue border and blue text.
- **Ghost:** No background, Blue text, used for "Cancel" or "Back" actions.

### Expressive Data Viz
- **The "Win/Loss" Bar:** Use a rounded, horizontal progress bar style to show the balance of power between friends.
- **Trend Lines:** Use smooth, curved paths (Spline) for history charts, never jagged lines.

### Playful Icons
Icons should use a **2px stroke weight** with rounded caps and joins. Avoid filled-in icons unless they are being used in a "Selected" state. Use metaphors like a steaming bowl for Dining, a stylized tile for Mahjong, and a 3-stack of cards for Poker.