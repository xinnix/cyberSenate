name: Warm Academic
colors:
surface: '#fcf8f7'
surface-dim: '#ddd9d8'
surface-bright: '#fcf8f7'
surface-container-lowest: '#ffffff'
surface-container-low: '#f7f3f2'
surface-container: '#f1edec'
surface-container-high: '#ebe7e6'
surface-container-highest: '#e5e2e1'
on-surface: '#1c1b1b'
on-surface-variant: '#454742'
inverse-surface: '#313030'
inverse-on-surface: '#f4f0ef'
outline: '#767872'
outline-variant: '#c6c7c0'
surface-tint: '#5e5e5c'
primary: '#5e5e5c'
on-primary: '#ffffff'
primary-container: '#fdfbf7'
on-primary-container: '#747471'
inverse-primary: '#c8c6c3'
secondary: '#5f5e5e'
on-secondary: '#ffffff'
secondary-container: '#e2dfde'
on-secondary-container: '#636262'
tertiary: '#605e5f'
on-tertiary: '#ffffff'
tertiary-container: '#fffafb'
on-tertiary-container: '#757374'
error: '#ba1a1a'
on-error: '#ffffff'
error-container: '#ffdad6'
on-error-container: '#93000a'
primary-fixed: '#e4e2de'
primary-fixed-dim: '#c8c6c3'
on-primary-fixed: '#1b1c1a'
on-primary-fixed-variant: '#474744'
secondary-fixed: '#e5e2e1'
secondary-fixed-dim: '#c8c6c5'
on-secondary-fixed: '#1c1b1b'
on-secondary-fixed-variant: '#474746'
tertiary-fixed: '#e6e1e2'
tertiary-fixed-dim: '#c9c5c6'
on-tertiary-fixed: '#1c1b1c'
on-tertiary-fixed-variant: '#484647'
background: '#fcf8f7'
on-background: '#1c1b1b'
surface-variant: '#e5e2e1'
typography:
display-lg:
fontFamily: Libre Caslon Text
fontSize: 48px
fontWeight: '700'
lineHeight: 56px
letterSpacing: -0.02em
headline-lg:
fontFamily: Libre Caslon Text
fontSize: 32px
fontWeight: '600'
lineHeight: 40px
headline-lg-mobile:
fontFamily: Libre Caslon Text
fontSize: 24px
fontWeight: '600'
lineHeight: 32px
body-md:
fontFamily: Hanken Grotesk
fontSize: 16px
fontWeight: '400'
lineHeight: 26px
label-sm:
fontFamily: Space Mono
fontSize: 12px
fontWeight: '500'
lineHeight: 16px
letterSpacing: 0.05em
rounded:
sm: 0.125rem
DEFAULT: 0.25rem
md: 0.375rem
lg: 0.5rem
xl: 0.75rem
full: 9999px
spacing:
unit: 4px
margin-page: 24px
gutter-card: 16px
padding-document: 32px

---

## Brand & Style

The design system embodies a "Warm Academic" persona, merging the intellectual weight of classical philosophy with the precision of cybernetic discourse. It targets a sophisticated audience that values deep thought, structured debate, and aesthetic longevity.

The visual style is a blend of **Minimalism** and **Tactile/Skeuomorphic** design. It avoids the coldness of traditional technology interfaces, opting instead for the warmth of high-grade stationery and historical documents. Every interface element is crafted to be "screenshot-ready," emphasizing balanced proportions and editorial-grade composition. The emotional response should be one of focused calm, intellectual rigor, and timeless authority.

## Colors

The palette is grounded in the tactile sensation of physical paper and archival ink.

- **Surface (Primary):** #FDFBF7 (Off-white paper). This is the foundation of all screens, providing a warm, non-glare background that mimics premium unbleached stock.
- **Ink (Secondary):** #1A1A1A (Deep Ink Black). Used for primary headings and critical UI elements to ensure maximum contrast and an authoritative presence.
- **Conflict (Accent):** #B23B3B (Muted Crimson). Reserved for highlighting divergent viewpoints, active debates, or "cyber" disruptions within the academic framework.
- **Order (Accent):** #2C3E50 (Deep Navy). Used for consensus, structural metadata, and navigation elements that ground the user in the system’s logic.
- **Subtext:** #4A4A4A. A softer ink shade for secondary information and body text to reduce visual fatigue during long-form reading.

## Typography

The typography strategy creates a tension between the classical past and the digital future.

- **Headings:** Utilizes **Libre Caslon Text**. This typeface provides the "Academic" authority. It should be set with tight tracking in display sizes to feel like a modern editorial masthead.
- **Body:** Utilizes **Hanken Grotesk**. A clean, contemporary sans-serif that ensures high readability for complex philosophical arguments and data-heavy discussions.
- **Metadata/Labels:** Utilizes **Space Mono**. This monospaced font introduces the "Cyber" element, used for timestamps, tags, and structural data, resembling a researcher's marginalia or terminal output.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy, treating every screen as a "Page" rather than an infinite scroll.

- **Structure:** A 12-column grid on desktop with generous margins (minimum 40px) to simulate the "safe area" of a printed book.
- **Card-Centric:** Information is encapsulated in "Document Cards." These cards do not sit flush; they float with intentional whitespace to emphasize their status as individual artifacts.
- **Responsive Behavior:** On mobile, margins reduce to 24px, and 12-column layouts collapse into a single-column stack. Vertical rhythm is strictly enforced using multiples of 4px to maintain a harmonious, "structured" appearance.

## Elevation & Depth

Depth is created through "Paper Stacking" rather than digital projection.

- **Tonal Layers:** The background is #FDFBF7. Elevated elements (Action Cards) use the same color but are defined by thin, 0.5px borders in #1A1A1A (at 10% opacity) and "Document Shadows."
- **Document Shadows:** Use high-diffusion, low-opacity shadows (e.g., `box-shadow: 0 10px 30px rgba(26, 26, 26, 0.05)`). This creates the illusion of one sheet of paper resting slightly above another.
- **Grain Effect:** A subtle, non-moving noise texture (overlay at 3% opacity) should be applied to all primary surfaces to break the digital flatness and provide a tactile, organic feel.

## Shapes

The shape language is "Softly Architectural."

- **Corners:** Use a consistent `0.25rem` (4px) radius for cards and UI containers. This provides a hint of softness while maintaining the structural integrity of a "document."
- **Buttons/Action Cards:** These are strictly rectangular or use the same 4px radius. Circles and high-rounded pills are avoided to maintain the serious, academic tone.
- **Dividers:** Use hairline strokes (0.5pt) that don't reach the edge of the container, mimicking the layout guides of a typewriter or printing press.

## Components

- **Action Cards:** Replace standard buttons. These are larger, interactive rectangular blocks containing a label (Space Mono) and a brief description (Hanken Grotesk). On hover, they shift 2px up with a slightly deepened shadow.
- **The "Round Table" Card:** A signature component for debates. It features a heavy top border in either "Conflict" Crimson or "Order" Navy to signify the nature of the content within.
- **Annotated Inputs:** Text fields look like underlined blank spaces on a form. The label sits above the line in a small monospaced font, mimicking a questionnaire.
- **Status Chips:** Small, rectangular tags with no border-radius. They use a light tint of the accent colors (10% opacity) with the text in the full-saturation accent color.
- **The "Manuscript" List:** Lists are separated by subtle horizontal lines and include "Folio Numbers" (e.g., 01, 02) in the left margin to aid the historical document aesthetic.
