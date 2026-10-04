# React (and Next.js / Preact)

The HTML/CSS rules in `SKILL.md` all hold — React renders the same DOM. This file covers only what changes when the source is JSX. Native `<button>`, `<dialog>`, `<details>`, and `<label>` work exactly as documented; prefer them here too.

## Attribute translation

JSX renames a few HTML attributes and passes the rest through untouched:

- `class` → `className`, `for` → `htmlFor`.
- `aria-*`, `data-*`, and `role` are written **as-is** (kebab-case): `aria-expanded`, `aria-labelledby`. They render to the DOM unchanged, so every ARIA rule in `SKILL.md` applies verbatim.
- Boolean-ish ARIA takes a string, not a JS boolean, when the spec expects a token: `aria-disabled={isBusy ? "true" : "false"}` reads cleaner than relying on coercion, and `hidden` is a real boolean prop.

```jsx
<button type="button" aria-expanded={open} aria-controls="menu" aria-label="Menu">
  <svg aria-hidden="true">...</svg>
</button>
```

## Generate ids with useId

`aria-labelledby`, `aria-describedby`, and `htmlFor` need stable, unique ids. Hand-rolled ids collide across component instances and mismatch between server and client render (a hydration bug). Use `useId()`.

```jsx
const hintId = useId();
return (
  <>
    <input aria-describedby={hintId} />
    <p id={hintId}>Must be at least 8 characters.</p>
  </>
);
```

## Don't put onClick on a div

The single most common React a11y regression: a clickable `<div>`/`<span>`. It's not focusable, not keyboard-operable, and absent from the accessibility tree. Use a real `<button>` (see "Use Native Elements"). If you truly can't, you owe it `role`, `tabIndex={0}`, and `onKeyDown` for Enter/Space — which is strictly more code than a button.

## Fragments keep markup valid

Wrapper `<div>`s break required parent/child relationships — a `<div>` between `<ul>` and `<li>`, or inside `<tr>`, is invalid and confuses assistive tech. Use `<>...</>` to group without emitting an element.

## Route changes must move focus and announce

Client-side navigation swaps content without a page load, so focus stays where it was (often on a now-gone link) and screen readers announce nothing. On every route change:

- Move focus to the new page's `<h1>` or `<main>` (give it `tabIndex={-1}` and `.focus()` in an effect), **or** render a visually-hidden `role="status"` live region and write the new page title into it.
- Ensure each route renders a unique `<title>` (Next.js: the Metadata API / `next/head`) and a single `<h1>`.

```jsx
useEffect(() => {
  headingRef.current?.focus();
}, [pathname]);
```

## Manage focus with refs, not the DOM

Reach for elements with `useRef` + `useEffect`, never `document.getElementById` — the latter fights React's ownership of the DOM and runs before paint. This is how you call `dialogRef.current.showModal()` on a native `<dialog>`, or move focus into a newly opened panel.

## dangerouslySetInnerHTML is an XSS hole

It bypasses React's escaping. Avoid it; render data as children instead. If you genuinely must inject HTML, sanitize it first (e.g. DOMPurify) — unsanitized user or CMS content is a security bug, not just an a11y one.

## Portals for overlays

Render modals/toasts through `createPortal` to `document.body` so a `overflow:hidden` or `transform` ancestor can't clip them or trap focus. Still use native `<dialog>` + `showModal()` inside the portal — it keeps the built-in focus trap, Escape handling, and inertness.

## Live regions must be mounted before they update

A `role="alert"`/`role="status"` region is only announced when text is inserted into an **already-present** region. Conditionally mounting the region at the same moment you fill it (`{msg && <div role="alert">{msg}</div>}`) often fires nothing. Keep the region rendered and change its text content instead.
