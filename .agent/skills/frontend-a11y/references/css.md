# CSS Accessibility Patterns

Full code and rationale for the CSS choices the SKILL.md body summarizes under "CSS Guidelines". Each section here matches a rule in the body.

## Relative length units, not absolute px

Fixed pixel sizing doesn't respond to the user's font-size preference and breaks at 200% text zoom and on reflow (WCAG 2.2 — 1.4.4 Resize Text, 1.4.10 Reflow). Size type, spacing, and layout in units that scale with the user's settings.

- **Default to `rem`** for font size, spacing, and layout — it scales with the root font size the user set in their browser. `px` locks that out.
- **Use `em`** when a value should scale relative to its own element's font size (e.g. an icon sized to the surrounding text).
- **Use `%`, `ch`, and viewport units** (`vi`, `vb`, `svh`, `dvh`) for fluid layout and line-length constraints.
- **`px` is fine only for hairline borders and fine optical nudges** (`1px`, `2px`) and for non-CSS hints like an `<img sizes="...">` attribute.

```css
/* Don't — fixed px ignores the user's font size and fails at zoom/reflow */
.card {
  width: 320px;
  padding: 16px;
  font-size: 14px;
}

/* Do — relative units scale with the user's preferences */
.card {
  inline-size: 20rem;
  padding: 1rem;
  font-size: 0.875rem;
  border: 1px solid; /* px is fine for a hairline border */
}
```

## Logical properties

Prefer logical properties (`inline-size`, `block-size`, `margin-inline`, `padding-block`, `inset-inline-start`) over physical ones (`width`, `height`, `margin-left`, `top`). They follow the writing mode and direction, so a layout built with them adapts to right-to-left and vertical languages without a rewrite — the same content stays usable across locales.

```css
/* Don't — physical properties break in RTL / vertical writing modes */
.note {
  margin-left: 1rem;
  border-left: 2px solid;
}

/* Do — logical properties follow the text direction */
.note {
  margin-inline-start: 1rem;
  border-inline-start: 2px solid;
}
```

## ARIA attributes as styling hooks

Don't create modifier classes when ARIA attributes already exist — style the ARIA state directly. This keeps one source of truth for the state and can't drift from the accessibility tree.

```css
/* Don't do this — extra classes */
.accordion-header--collapsed {
}
.accordion-header--expanded {
}

/* Do this — style the ARIA state */
[aria-expanded="false"] {
}
[aria-expanded="true"] {
}
```

More examples:

```css
[aria-current="page"] {
  font-weight: bold;
}
[aria-disabled="true"] {
  opacity: 0.6;
  cursor: not-allowed;
}
[aria-selected="true"] {
  background-color: highlight;
}
[aria-invalid="true"] {
  border-color: red;
}
```

## Cursor signals interactivity

The mouse cursor is an affordance — it tells sighted pointer users, before they click, whether something will respond. Keep it truthful.

- Interactive controls get `cursor: pointer`. Native links already do this; add it to `<button>` and any custom `onclick` target. (Genuine text inputs are the exception — they keep the I-beam.)
- Inactive controls get `cursor: not-allowed`. Because buttons signal "off" with `aria-disabled` rather than native `disabled` (see "Never Disable a Button"), style that state explicitly — `aria-disabled` changes nothing visually on its own, so without this a dimmed control still shows the pointer and falsely invites a click.

```css
button {
  cursor: pointer;
}
[aria-disabled="true"],
:disabled {
  cursor: not-allowed;
}
```

Cursor is a supplement, never the only signal — it's pointer-only and invisible to keyboard and screen reader users, so it always rides alongside the real semantics (`disabled` / `aria-disabled`), not in place of them.

## Uppercase via CSS, not HTML

Write text in normal case and uppercase it with CSS, so screen readers don't spell out the letters.

```html
<!-- Don't do this -->
<span>SUBMIT</span>

<!-- Do this -->
<span class="u-uppercase">Submit</span>
```

```css
.u-uppercase {
  text-transform: uppercase;
}
```

## Color contrast

Text must meet WCAG 2.2 AA minimum contrast ratios (`ref_id` `1.4.3` in [wcag.json](wcag.json)) — this is one of the most commonly failed accessibility checks. Always choose foreground/background color pairs that clear these thresholds, and verify any pairing you're unsure of with the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

- **Normal text** (below 18pt / 14pt bold): **4.5:1** minimum
- **Large text** (18pt+ / 14pt+ bold): **3:1** minimum
- **UI components and focus indicators**: **3:1** minimum against adjacent colors

Safe defaults that clear 4.5:1 without any calculation:

```css
/* Dark text on light backgrounds */
body {
  color: #404040;
  background: #f4f4f4;
} /* ~9.43:1 */
.muted {
  color: #636363;
  background: #f4f4f4;
} /* ~5.46:1 */

/* Light text on dark backgrounds */
.dark {
  color: #c9d4de;
  background: #040014;
} /* ~13.75:1 */

/* Avoid these common low-contrast mistakes */
/* color: #767676 on white = exactly 4.5:1 — pass, but use sparingly */
/* color: #999 on white = 2.85:1 — FAIL */
/* color: #888 on #eee = 3.05:1 — FAIL for normal text */
```

## Focus outlines

Give every interactive element a visible, high-contrast focus indicator, and target `:focus-visible` so the ring shows for keyboard users without flashing on mouse click.

```css
*:focus-visible {
  outline: 2px solid;
  outline-offset: 2px;
}
```

## Reduced transparency

Only apply translucent or glassy effects when the user hasn't requested reduced transparency.

```css
@media (prefers-reduced-transparency: no-preference) {
  .glass-panel {
    background: oklch(100% 0 0 / 0.8);
    backdrop-filter: blur(1rem);
  }
}
```

## Reduced motion

Only animate elements when the user hasn't requested reduced motion.

```css
@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    transition: transform 0.3s ease;
  }
}
```

## Fade in content safely

Never use `opacity: 0` alone to hide content before a fade-in animation. Screen readers ignore opacity — an element at `opacity: 0` is still in the accessibility tree and will be announced before sighted users can see it.

A safe fade-in layers two protections:

1. **JS-ready gating** so content stays visible by default if JavaScript fails to load
2. **IntersectionObserver** so the animation triggers when the element enters the viewport — including when a screen reader's virtual cursor scrolls to it

```html
<h1 class="fade-in">Welcome</h1>
```

```css
@media (prefers-reduced-motion: no-preference) {
  .js-ready .fade-in {
    opacity: 0;
  }

  .fade-in.is-visible {
    animation: fade-in 0.6s ease forwards;
  }
}

@keyframes fade-in {
  to {
    opacity: 1;
  }
}
```

```js
document.documentElement.classList.add("js-ready");

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
});

for (const el of document.querySelectorAll(".fade-in")) {
  observer.observe(el);
}
```

This works because:

- Without JavaScript, the `js-ready` class is never added — content stays fully visible and accessible
- When a screen reader's virtual cursor reaches the element, the browser scrolls it into view, firing the IntersectionObserver and triggering the fade-in before the content is announced
- Users who prefer reduced motion never get the hidden state applied — content is visible immediately
