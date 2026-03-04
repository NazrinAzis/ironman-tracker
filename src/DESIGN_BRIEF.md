# Design Brief: Ironman Tracker Redesign
> Based on fitness dashboard reference design

## Overall Aesthetic
- **Style**: Soft, friendly, modern health/fitness dashboard
- **Mood**: Clean, approachable, motivating — not clinical or harsh
- **Layout**: Left sidebar navigation + main content area with card grid
- **Background**: Off-white / very light grey (`#F7F8FA`) — never pure white

---

## Layout Structure

### Sidebar (left, fixed, ~240px wide)
- White background, subtle right border or shadow
- Top: User avatar (circular, illustrated/emoji style), name, membership tier badge
- Middle: Vertical nav menu with icon + label items
  - Items: Dashboard, Workout, Schedule, Program
  - Active item: Filled green pill/rounded-rect background
  - Inactive items: Grey text, no background
- Bottom: Membership expiry card ("2 days left" style CTA) + illustrated character mascot

### Main Content Area
- Greeting header top-left: "Good Morning 👋" in large, light + bold weight combination
  - "Good" → light weight
  - "Morning" → bold weight
- Top-right: Date chip + weather chip + action button (green circle with `+`)
- Content is organized in **sections** with section titles

---

## Component Patterns

### Stat Widget Cards
- White background, rounded corners (`border-radius: 20px`)
- Soft drop shadow (`box-shadow: 0 4px 20px rgba(0,0,0,0.06)`)
- Label (small, grey) on top, large bold value below
- Decorative emoji/icon on the right side (not flat icons — illustrated, colorful)
- Examples for Ironman tracker:
  - 🏃 Active Steps / Distance
  - ⚖️ Weight / Body metrics
  - 💧 Water intake
  - 🔥 Calories burned
  - 🏊 Swim distance
  - 🚴 Bike distance
  - 👟 Run distance

### Schedule / Event Cards
- White background, rounded corners
- Left accent: small colored emoji/sport icon
- Reminder toggle (green pill toggle switch)
- Bold title, grey description text
- "when:" label + bold datetime
- Avatar cluster (small overlapping circular avatars) for participants

### Body Analysis / Chart Section
- Bar chart with rounded tops
- Bars colored per activity type (teal for swim, green for bike, orange for run, etc.)
- Today's bar slightly highlighted or labeled
- X-axis: dates, Y-axis implied by bar height
- Hover state: tooltip with activity + kcal/distance

### Schedule Timeline (top right)
- Horizontal time axis (9am, 10am, 11am, 12pm, 1pm...)
- Colored pill/chip events overlaid on the timeline
- Each chip has small emoji icon + label

---

## Color Palette

```css
--color-primary: #3DBE7A;         /* Main green — buttons, active states */
--color-primary-light: #E8F8EF;   /* Light green tint — backgrounds */
--color-bg: #F7F8FA;              /* App background */
--color-card: #FFFFFF;            /* Card backgrounds */
--color-text-primary: #1A1A2E;    /* Headings, key values */
--color-text-secondary: #8A8FA8;  /* Labels, meta text */
--color-accent-teal: #4ECDC4;     /* Swim / water activities */
--color-accent-orange: #FFB347;   /* Run / high intensity */
--color-accent-blue: #74B9FF;     /* Bike / moderate */
--color-accent-pink: #FF7675;     /* Alerts, heart rate */
--color-border: #EEEEF2;          /* Subtle borders */
--color-shadow: rgba(0,0,0,0.06); /* Card shadows */
```

---

## Typography

```css
--font-display: 'Nunito', 'Poppins', sans-serif;  /* Headings, greeting */
--font-body: 'DM Sans', 'Nunito', sans-serif;     /* Body text, labels */

--text-greeting-light: 500 48px var(--font-display);   /* "Good" */
--text-greeting-bold: 800 48px var(--font-display);    /* "Morning" */
--text-stat-value: 700 28px var(--font-display);       /* "5902", "80.2 kg" */
--text-stat-label: 400 13px var(--font-body);          /* "Active steps" */
--text-section-title: 700 20px var(--font-display);    /* "In schedule" */
--text-card-title: 700 17px var(--font-display);
--text-body: 400 14px var(--font-body);
--text-meta: 400 12px var(--font-body);                /* Timestamps, labels */
```

---

## Spacing & Radius

```css
--radius-card: 20px;
--radius-pill: 100px;
--radius-button: 14px;

--spacing-card-padding: 24px;
--spacing-section-gap: 32px;
--spacing-card-gap: 16px;
--sidebar-width: 240px;
```

---

## Iconography Style
- **Do NOT use flat line icons** (no Heroicons, no Feather plain style)
- Use illustrated emoji-style icons or colorful rounded icons
- Each sport/activity has a dedicated color-coded emoji or illustrated icon
- Recommended: Use actual emoji characters where possible for that friendly feel
- Examples: 🏊‍♂️ 🚴‍♂️ 🏃‍♂️ 💧 🔥 ⚖️ 📅

---

## Interactive States

### Buttons
- Primary: Green background (`--color-primary`), white text, rounded
- Hover: Slightly darker green, subtle scale up (`transform: scale(1.02)`)
- Active nav item: Green pill background with white icon/text

### Cards
- Default: White, soft shadow
- Hover: Shadow deepens slightly (`box-shadow: 0 8px 30px rgba(0,0,0,0.10)`)
- Transition: `0.2s ease`

### Toggle Switch
- On: Green track (`--color-primary`), white knob
- Off: Grey track, white knob
- Smooth transition animation

---

## Ironman-Specific Adaptations

Since this is an **Ironman triathlon tracker** (not a general fitness app), adapt the reference design with:

1. **Three sport pillars** always visible: Swim 🏊 / Bike 🚴 / Run 🏃
2. **Training zones** instead of generic calorie cards (Zone 2, Threshold, VO2Max)
3. **Weekly TSS (Training Stress Score)** as a key stat widget
4. **Race countdown widget** — e.g., "87 days to race day" with a progress ring
5. **Triathlon bar chart** — color-coded bars per discipline (teal=swim, blue=bike, orange=run)
6. **Nutrition section** (if applicable) — macros, hydration for long training days
7. Personalize greeting: "Good Morning, Naz 👋"

---

## What to Tell Claude Code

When prompting Claude Code to implement this, say:

> "Redesign the Ironman Tracker UI based on DESIGN_BRIEF.md and design-system.css.
> Apply the card-based layout with sidebar nav, use the color tokens from design-system.css,
> and follow the component patterns described in the brief.
> Keep all existing data logic — only change the visual layer."
