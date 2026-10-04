---
name: frontend-a11y
description: Write minimal, accessible web UI without over-engineering, adapting to whatever stack the project uses — React, Vue, Svelte, Angular, web components, or plain HTML. Use this skill on every project and every task that writes or reviews markup or components, builds forms, adds interactive elements like buttons, dialogs, accordions, or tabs, or audits code for accessibility — even when the user never mentions accessibility, and even inside a framework, CMS, or design system. It's non-negotiable regardless of project type, stack, or deadline. About to reach for ARIA attributes, a dialog library, a focus-trap package, or a headless UI component? Use this skill first.
---

# Frontend A11y

Write as little code as possible. Reach for a native HTML element before an ARIA attribute or a JavaScript library — the browser already ships the accessibility, and every attribute you don't write is one less thing to break.

---

## Adapt to the Project's Stack

Every rule here is framework-agnostic. Frameworks compile to HTML, so `<button>` vs `<div role="button">`, contrast ratios, WCAG criteria, and landmark rules are identical whether the source is JSX, a Vue template, Svelte, Angular, or raw HTML. **The HTML/CSS examples below are the canonical source of truth** — the concepts never change, only the syntax.

So don't rewrite this file — take one beat before writing code to fit the output to the project:

1. **Detect the stack.** Check `package.json`, file extensions (`.jsx`/`.tsx`, `.vue`, `.svelte`), and framework config. When unsure, match how existing components in the repo are written.
2. **Translate the examples.** Re-express each snippet in the project's idioms — attribute names (`class` → `className`, `for` → `htmlFor` in React), event binding, id generation — keeping the semantics identical.
3. **Mind the footguns.** Frameworks reintroduce hazards plain HTML doesn't have: client-side routing that never moves focus, template escape hatches that enable XSS, component libraries that bury native semantics. When the stack matches a reference file below, **read it first** — it covers only the deltas from the HTML baseline.

| Stack                          | Read                                              |
| ------------------------------ | ------------------------------------------------- |
| React / Next.js / Preact       | [react.md](references/react.md)                   |
| Vue / Nuxt                     | [vue.md](references/vue.md)                       |
| Svelte / SvelteKit             | [svelte.md](references/svelte.md)                 |
| Angular                        | [angular.md](references/angular.md)               |
| Web components / Lit / Stencil | [web-components.md](references/web-components.md) |

Plain HTML, or a stack not listed here? The examples below apply as written.

---

## HTML Guidelines

### Use Native Elements

The browser already provides accessible elements. Use them.

```html
<!-- Don't do this — too much code -->
<div role="button" tabindex="0" onclick="submit()">Submit</div>

<!-- Do this — native button is already accessible -->
<button type="submit">Submit</button>
```

### Don't Add Redundant Roles

Landmark elements already have implicit roles. Don't repeat them.

```html
<!-- Don't do this -->
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<footer role="contentinfo">...</footer>

<!-- Do nothing — the browser already handles this -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<footer>...</footer>
```

### Don't Name Landmarks Redundantly

A screen reader announces a landmark by its **role** — "navigation", "banner", "main", "content info". Repeating that word in the accessible name doubles the announcement ("navigation, navigation"). A name should _distinguish_ a landmark from its siblings, never restate what it already is.

- A `<nav>`'s `aria-label` must not contain "navigation". Name it for _what it navigates_ — "Primary", "Footer", "Breadcrumb" — so the reader says "Primary, navigation".
- `<header>` (banner), `<main>`, and `<footer>` (contentinfo) need no `aria-label`. A page has one of each, so there are no siblings to disambiguate. Only name a landmark when more than one of the same role coexists (e.g. two `<nav>`s).

```html
<!-- Don't — "Main navigation, navigation", and single landmarks labelled with their own role -->
<nav aria-label="Main navigation">...</nav>
<header aria-label="Header">...</header>
<main aria-label="Main content">...</main>

<!-- Do — the role supplies the type; label only to disambiguate siblings -->
<nav aria-label="Primary">...</nav>
<nav aria-label="Footer">...</nav>
<header>...</header>
<main>...</main>
```

### Name a Region Only When It Has a Real Heading

A `<section>` becomes a landmark (implicit `role="region"`) **only when it has an accessible name**, and it then appears in the screen reader's landmarks menu. Landmarks are navigation shortcuts, so they help only when they mark a genuinely distinct, named region. Generically named regions ("Cards", "Updates") are _noise_ that clutters the menu.

- Add the region only when the block renders a real, visible heading, and name it with `aria-labelledby` pointing at the heading's `id`. The accessible name then _is_ the on-screen text — one source of truth that stays in sync as copy changes.
- Never invent a synthetic `aria-label` to satisfy a region. No heading? Use a plain `<div>` wrapper — same styling, no landmark.

```html
<!-- Don't — always a landmark, named by a made-up string nobody sees -->
<section aria-label="Article cards">...</section>

<!-- Do — landmark only with a real heading, named by that heading -->
<section aria-labelledby="latest-heading">
  <h2 id="latest-heading">Latest articles</h2>
  ...
</section>

<!-- No heading? No landmark — a plain wrapper keeps the styling without the noise -->
<div class="cards">...</div>
```

### Use Semantic Elements Over Divs

Replace generic containers with meaningful elements.

```html
<!-- Don't do this -->
<div class="header">
  <div class="nav">...</div>
</div>

<!-- Do this -->
<header>
  <nav>...</nav>
</header>
```

### Set the Button Type

Inside a form, a `<button>` with no `type` defaults to `submit` and submits on click. Always set `type` explicitly.

```html
<!-- Don't — an untyped button submits the form unexpectedly -->
<button onclick="toggle()">Toggle</button>

<!-- Do — say what the button is for -->
<button type="button" onclick="toggle()">Toggle</button>
<button type="submit">Submit</button>
```

### Never Disable a Button — Use aria-disabled

The native `disabled` attribute removes a `<button>` from the tab order **and** the accessibility tree, so keyboard and screen reader users can't focus it to discover it exists or learn _why_ it's unavailable — an avoidable regression.

- **Non-submit control needing an inactive state → `aria-disabled="true"`.** It stays focusable, is announced as "dimmed"/"unavailable", and you suppress the action in JavaScript. Canonical case: navigation controls like carousel arrows, where the user must still _find_ the control and perceive it's inactive rather than have it vanish.
- **Submit button → always active**, with neither `disabled` nor `aria-disabled`. Let the press fire validation so errors are announced, instead of a dead button that never explains what's missing.
- **Form _fields_ (`<input>`, `<select>`, `<textarea>`) → native `disabled` is correct.** There it governs whether the value is submitted — a different concern from control interactivity.

```html
<!-- Submit — always active; let validation surface errors -->
<button type="submit">Submit</button>

<!-- Non-submit control — focusable, announced as unavailable, action suppressed in JS -->
<button
  type="button"
  aria-label="Scroll to next"
  aria-disabled="true"
  onclick="scrollNext()"
>
  <svg aria-hidden="true">...</svg>
</button>
```

### Keep the Button Name Constant When It Toggles

A toggle button with `aria-expanded` already announces its state — "Menu, button, collapsed" → "Menu, button, expanded". The _name_ should describe what the button controls and stay constant across both states. Swapping it to "Open menu" / "Close menu" duplicates the state into the name and can even contradict the announced state.

```html
<!-- Don't — the name flips with state, fighting aria-expanded -->
<button aria-expanded="false" aria-label="Open menu">...</button>

<!-- Do — constant name; aria-expanded carries open/closed -->
<button aria-expanded="false" aria-controls="menu" aria-label="Menu">
  ...
</button>
```

### Icon-Only Controls Need an Accessible Name

A control whose only content is an icon has no text for a screen reader to announce. Give it a name with `aria-label` and hide the decorative icon from the accessibility tree.

```html
<button type="button" aria-label="Close">
  <svg aria-hidden="true">...</svg>
</button>
```

### Describe Images by Content, Not Type

A screen reader already announces an `<img>` as "image" (or "graphic"), so `alt` is for the _content_, not the category. Words like "image", "photo", "graphic", "icon", or "logo" inside `alt` just restate the role.

- A brand logo's `alt` is the brand name, not "logo". A decorative logo that adds nothing beyond adjacent text gets `alt=""` so it's skipped.
- Describe the subject for content images.

```html
<!-- Don't — restates the role / vague -->
<img src="logo.svg" alt="Acme logo" />
<img src="team.jpg" alt="photo of a family" />

<!-- Do — the brand name for a logo; the subject for a photo -->
<img src="logo.svg" alt="Acme" />
<img src="team.jpg" alt="Family reviewing plan options at a table" />
```

### A Linked Image's alt Is the Link's Name

When an `<img>` is a link's only content (a logo linking home, a card thumbnail), the image's `alt` _is_ the link's accessible name. An `aria-label` on the wrapping `<a>` overrides that name and collapses the image's semantics — the picture effectively disappears. Describe the destination through `alt` and leave the link unlabelled. Add an `aria-label` to the link only as a _fallback_ when there's genuinely no image to carry the name.

```html
<!-- Don't — aria-label on the link wipes out the image's name -->
<a href="/" aria-label="Home page"><img src="logo.svg" alt="" /></a>

<!-- Do — the image's alt is the link name -->
<a href="/"><img src="logo.svg" alt="Acme" /></a>

<!-- Fallback only — no image, so the link needs its own name -->
<a href="/"><span class="brand">Acme</span></a>
```

### Visually Hidden Text Is for Names, Not Hints

Use a `visuallyhidden` utility (sometimes `sr-only`) to give an element a screen-reader-only **accessible name** — e.g. a panel whose only visible header is a logo still needs a heading for its name. But `visuallyhidden` text _inside_ an interactive control becomes part of that control's name, so it's the wrong tool for a supplementary _hint_ (like "opens in a new tab") — see the next section.

```html
<span class="visuallyhidden">Main navigation</span>
```

```css
.visuallyhidden:not(:focus):not(:active) {
  position: absolute;
  clip-path: inset(50%);
  overflow: hidden;
  block-size: 1px;
  inline-size: 1px;
  white-space: nowrap;
}
```

### Supplementary Hints Go in aria-describedby, Not the Name

A control has two distinct accessible strings, and conflating them causes real bugs:

- **Accessible name** — the short, primary label a user acts on ("Share on Facebook"). Built from visible text, `visuallyhidden` text inside the element, or `aria-label`.
- **Accessible description** — secondary detail announced _after_ the name and a pause ("opens in a new tab"). Built from `aria-describedby`.

Folding a hint into the name breaks three ways: `aria-label` overrides inner content (so a `visuallyhidden` hint is silently dropped when the element also has `aria-label`); it breaks voice control (users say the _name_ to activate a control, and a padded name may no longer match); and it makes every announcement noisy. Keep the name clean and attach the hint with `aria-describedby`.

```html
<!-- Don't — an visuallyhidden hint inside the control pollutes the name (and is dropped if aria-label wins) -->
<button aria-label="Share on Facebook">
  <svg aria-hidden="true">...</svg>
  <span class="visuallyhidden">opens in a new tab</span>
</button>

<!-- Do — clean name, hint as a description -->
<a href="..." target="_blank" rel="noopener" aria-describedby="new-tab-hint"
  >Share on Facebook</a
>

<!-- Render a repeated hint once, reference it everywhere by id -->
<span id="new-tab-hint" hidden>opens in a new tab</span>
```

When the same hint applies to many controls (every external link on the page), render the description **once** in a globally hidden element and point each control at it via a shared `id`, rather than duplicating a span per control. `hidden` is fine here — `aria-describedby` still resolves a hidden target.

### Skip the Title Attribute

The `title` attribute is poorly supported. Only use it on `<iframe>`.

```html
<!-- Don't do this -->
<button title="Submit form">Submit</button>

<!-- Only use title on iframe -->
<iframe src="..." title="Video player"></iframe>
```

---

## Component Patterns

Use native elements that already have the behavior you need. For a widget native HTML can't cover — combobox, tabs, switch — see [patterns.md](references/patterns.md), which carries the APG references and the project's preferred approach.

### Accordion

Use native `<details>` and `<summary>`. No JavaScript needed.

```html
<!-- Don't do this — too much code -->
<div class="accordion">
  <button aria-expanded="false" aria-controls="panel-1">Section</button>
  <div id="panel-1" hidden>Content</div>
</div>

<!-- Do this — zero JavaScript required -->
<details>
  <summary>Section</summary>
  <p>Content</p>
</details>
```

### Modal Dialog

Use native `<dialog>` with `showModal()`. Focus trapping and Escape key handling are built-in.

```html
<!-- Don't do this — requires focus trap JavaScript -->
<div role="dialog" aria-modal="true" aria-labelledby="title">
  <h2 id="title">Title</h2>
  <p>Content</p>
</div>

<!-- Do this — focus trap is automatic; aria-labelledby gives the dialog its name -->
<dialog id="my-dialog" aria-labelledby="my-dialog-title">
  <h2 id="my-dialog-title">Title</h2>
  <p>Content</p>
  <button type="button" onclick="this.closest('dialog').close()">Close</button>
</dialog>

<button
  type="button"
  onclick="document.getElementById('my-dialog').showModal()"
>
  Open dialog
</button>
```

The `showModal()` method automatically:

- Traps focus inside the dialog
- Closes on Escape key
- Adds the `::backdrop` pseudo-element
- Marks content behind as inert

A dialog **must** have an accessible name: give it a heading and point `aria-labelledby` at it (or use `aria-label` when there's no visible heading).

### Navigation

Use `<nav>` with `<button>` and `aria-expanded` for dropdowns. When a page has more than one `<nav>`, name each for _what it navigates_ — never include the word "navigation" (see "Don't Name Landmarks Redundantly").

```html
<nav aria-label="Primary">
  <ul>
    <li>
      <button aria-expanded="false" aria-controls="submenu">Products</button>
      <ul id="submenu" hidden>
        <li><a href="/product-1">Product 1</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

**Don't use** `role="menu"`, `role="menuitem"`, or `aria-haspopup` for navigation.

### Skip Link

A skip link lets keyboard and screen reader users jump past repeated blocks straight to the main content ([WCAG 2.2 — 2.4.1 Bypass Blocks](references/wcag.json)). It earns its place when a site **repeats a complex navigation across pages** — a large menu, multi-level dropdowns, a search bar — because otherwise those users must tab through all of it again on every page load. With only a link or two of chrome there's nothing meaningful to bypass, so it adds little.

Make it the **first focusable element**, point it at the `id` of `<main>` (or the primary content container), and keep it hidden until focused — it must become visible when tabbed to, so sighted keyboard users can see where they've landed.

```html
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header>...</header>
  <nav aria-label="Primary">...</nav>
  <main id="main-content">...</main>
</body>
```

```css
.skip-link {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  transform: translateY(-100%);
}

/* Reveal it when a keyboard user tabs to it */
.skip-link:focus-visible {
  transform: translateY(0);
}
```

Don't hide it with `display: none` or the `.visuallyhidden` pattern — those stay hidden even on focus, so sighted keyboard users never see the target. It needs to be off-screen but able to animate back into view.

### Alert

For an urgent message use `role="alert"` (assertive); for non-urgent updates use `role="status"` or `aria-live="polite"`. The region must already exist in the DOM before you inject text, and don't hand-add `aria-live`/`aria-atomic` on top of `role="alert"` — they're implied ([WCAG 2.2 — 4.1.3 Status Messages](references/wcag.json)). Markup, the full politeness spectrum, and firing gotchas: [patterns.md](references/patterns.md).

### Form Errors

Don't announce validation errors with `aria-live` — take the user _to_ the error instead. Tie inline messages to their field with `aria-invalid="true"` + `aria-describedby`, and on submit failure move focus to an error summary (`tabindex="-1"`) at the top of the form. Markup and rationale: [patterns.md](references/patterns.md).

### Carousel / Scrollable Content

Build carousels from native HTML — don't reach for a carousel library or hand-roll carousel ARIA. Prefer a `<ul>` with `overflow-x: auto` + CSS scroll snap so the browser owns keyboard and touch scrolling, and use `aria-disabled` (not native `disabled`) on an exhausted arrow. The project default is native list/scroll semantics over `role="region"` + `aria-roledescription`. Markup and rationale for the scroll-snap track and single-slide swap: [patterns.md](references/patterns.md).

---

## CSS Guidelines

These CSS choices directly affect accessibility. Full code examples and rationale for every rule below live in [css.md](references/css.md).

### Use Relative Length Units, Not Absolute px

Fixed pixel sizing ignores the user's font-size preference and breaks at 200% zoom and on reflow ([WCAG 2.2 — 1.4.4 Resize Text, 1.4.10 Reflow](references/wcag.json)). Default to `rem` for type/spacing/layout, `em` for values that scale to their own element, `%`/`ch`/viewport units for fluid layout; reserve `px` for hairline borders and optical nudges.

### Use Logical Properties

Prefer logical properties (`inline-size`, `margin-inline`, `inset-inline-start`) over physical ones (`width`, `margin-left`, `top`) so layouts adapt to right-to-left and vertical writing modes without a rewrite.

### Use ARIA Attributes as Styling Hooks

Style ARIA state directly (`[aria-expanded="true"]`, `[aria-current="page"]`, `[aria-disabled="true"]`) instead of adding parallel modifier classes — one source of truth that can't drift from the accessibility tree.

### Let the Cursor Signal Interactivity

Give interactive controls `cursor: pointer` and inactive ones `cursor: not-allowed`. Since buttons signal "off" with `aria-disabled` rather than native `disabled` (see "Never Disable a Button"), style that state explicitly. Cursor is a pointer-only supplement — it rides alongside the real semantics, never replaces them.

### Don't Write All Caps in HTML

Write normal case and uppercase with CSS (`text-transform: uppercase`) so screen readers don't spell out the letters.

### Meet Color Contrast Requirements

Text must meet [WCAG 2.2 AA minimum contrast ratios](references/wcag.json) — one of the most commonly failed checks. Verify pairings with the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/). Minimums:

- **Normal text** (below 18pt / 14pt bold): **4.5:1**
- **Large text** (18pt+ / 14pt+ bold): **3:1**
- **UI components and focus indicators**: **3:1** against adjacent colors

`css.md` has a safe default palette that clears these without any calculation.

### Create Consistent Focus Outlines

Give every interactive element a visible, high-contrast focus indicator via `:focus-visible` (e.g. `outline: 2px solid; outline-offset: 2px`), so the ring shows for keyboard users without flashing on mouse click.

### Respect Reduced Motion and Transparency

Gate animation behind `@media (prefers-reduced-motion: no-preference)` and glassy/translucent effects behind `@media (prefers-reduced-transparency: no-preference)`, so users who opt out never get them.

### Fade In Content Safely

Never use `opacity: 0` alone to hide content before a fade-in — screen readers ignore opacity, so the element is announced before sighted users can see it. Gate the hidden state behind a JS-ready class and trigger the animation with an IntersectionObserver, so it fires when a screen reader's virtual cursor scrolls the element into view.

---

## Local reference specs (`references/`)

Everything you need to cite ships in `references/` as a local, offline source of truth. `wcag.json` is the full WCAG 2.2 spec as structured data — **query it by criterion id, never read it whole.** `aria.md` is a large verbatim spec dump — **never read it end to end; grep for the term you need.** `standards.md` indexes the canonical online sources, and `patterns.md` holds the component patterns native HTML can't cover.

The **per-stack files** (`react.md`, `vue.md`, `svelte.md`, `angular.md`, `web-components.md`) are the other half of "Adapt to the Project's Stack" above — read the one matching the detected framework. Each is short and covers only the deltas from the HTML baseline (attribute translation, id generation, routing focus, template XSS escape hatches, component-library caveats), never the shared rules.

### Look up a WCAG criterion in `wcag.json`

`wcag.json` is a JSON array of the four principles; each principle nests `guidelines`, and each guideline nests `success_criteria`. Every node carries a `ref_id` (`"1"`, `"1.4"`, `"1.4.3"`), `title`, `description`, and `url`; success criteria also carry `level` (`A`/`AA`/`AAA`), `special_cases`, `notes`, and `references`. Look a criterion up by its `ref_id` rather than by line — pull the exact object with `jq`:

```bash
jq '.. | objects | select(.ref_id? == "1.4.3")' references/wcag.json
```

If you only know the name, grep the title (`'Contrast (Minimum)'`, `'Bypass Blocks'`). It carries every success criterion through Level AAA — including `2.5 Input Modalities`, `2.4.2 Page Titled`, and `2.4.6 Headings and Labels` — so if a `ref_id` isn't in it, the criterion doesn't exist in WCAG 2.2.

### Grep the ARIA spec in `aria.md`

`aria.md` is a verbatim Markdown dump — grep by content keyword, not by guessing a heading. Search the role or attribute itself (`aria-expanded`, `Name, Role, Value`) — that always hits — then read around the hit or a known range from the table below.

| File                                                                     | Spec (size)                                            | Reach for it when                                                                                                                                                                                        | Key sections (line ranges)                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `standards.md`                                                           | External links index (~1 KB)                           | You need the canonical online source to cite — WCAG Understanding, quickref, WAI-ARIA spec, APG, WebAIM, W3C validator                                                                                   | Read whole; it's short                                                                                                                                                                                                                          |
| `react.md` · `vue.md` · `svelte.md` · `angular.md` · `web-components.md` | Per-stack a11y deltas (~2–3 KB each)                   | The project uses that framework — translate the HTML examples into its idioms and avoid its specific footguns (routing focus, template XSS, id/shadow-boundary rules)                                    | Read the one matching the stack, whole; each is short                                                                                                                                                                                           |
| `patterns.md`                                                            | Component patterns (~5 KB)                             | Full markup/rationale for the components the body summarizes — carousel, live regions & alerts, form errors — plus combobox, tabs, switch, and the APG links                                             | Read whole; it's short                                                                                                                                                                                                                          |
| `css.md`                                                                 | CSS a11y patterns (~6 KB)                              | Full code + rationale for any CSS rule the body summarizes — relative units, logical properties, ARIA styling hooks, cursor, contrast palette, focus outlines, reduced motion/transparency, safe fade-in | Read whole; it's short                                                                                                                                                                                                                          |
| `wcag.json`                                                              | WCAG 2.2, structured JSON — AA is the project baseline | Checking a success criterion: contrast, focus order, labels, error handling, status messages                                                                                                             | Array of principles `1`–`4` → `guidelines` → `success_criteria`, every node keyed by `ref_id`. Query by `ref_id` or `title` with `jq`/grep — don't read it whole. Holds every criterion through Level AAA.                                      |
| `aria.md`                                                                | WAI-ARIA 1.2 (515 KB)                                  | Only when you must hand-author ARIA (rare — native elements carry their own roles and states). Confirm a role supports an attribute before adding it                                                     | `4. Using WAI-ARIA` 464–568 · `5. The Roles Model` 569–2804 (role defs from 800) · `6. Supported States & Properties` 2805–4344 (`aria-*` defs from 2916) · `7. Accessibility Tree` 4345–4373 · `8. Implementation in Host Languages` 4374–4472 |

For tutorial-style guidance and keyboard patterns, the online [WCAG 2.2 Understanding](https://www.w3.org/WAI/WCAG22/Understanding/) and the [ARIA APG](https://www.w3.org/WAI/ARIA/apg/) stay more readable than the raw spec. Verify color pairings with the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
