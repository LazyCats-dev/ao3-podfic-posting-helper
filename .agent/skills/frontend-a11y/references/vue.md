# Vue (and Nuxt)

The HTML/CSS rules in `SKILL.md` all hold — Vue renders the same DOM, and templates use real HTML attribute names (`class`, `for`, `aria-*`), so most examples transfer verbatim. This file covers only the Vue-specific deltas. Prefer native `<button>`, `<dialog>`, `<details>`, `<label>` here too.

## Binding syntax

- `:class` / `:aria-expanded` for dynamic values, `@click` for events. Static ARIA is written plain: `aria-label="Menu"`.
- `aria-*` and `role` pass straight through to the DOM, so every ARIA rule applies unchanged.

```vue
<button type="button" :aria-expanded="open" aria-controls="menu" aria-label="Menu">
  <svg aria-hidden="true">...</svg>
</button>
```

## Generate ids with useId

`aria-describedby`/`aria-labelledby`/`for` need unique, SSR-stable ids. Use `useId()` (Vue 3.5+) rather than hand-rolled strings, which collide across instances and break hydration.

```vue
<script setup>
const hintId = useId();
</script>
<template>
  <input :aria-describedby="hintId" />
  <p :id="hintId">Must be at least 8 characters.</p>
</template>
```

## v-html is an XSS hole

`v-html` injects raw markup and bypasses Vue's escaping. Avoid it; bind text with `{{ }}` or `:textContent`. If unavoidable, sanitize first (e.g. DOMPurify) — never feed it user or CMS content directly.

## v-if vs v-show for live regions

A `role="alert"`/`role="status"` region is only announced when text lands in an **existing** region. `v-if` creates the element at announce time, so nothing fires. Keep the region in the DOM and change its text — use `v-show` (toggles `display`, element stays mounted) or leave it mounted and update its content.

```vue
<!-- Do — region persists, text changes -->
<p role="status">{{ statusMessage }}</p>
```

## Route changes must move focus and announce

`vue-router` swaps views without a page load: focus is stranded and screen readers stay silent. In a global `router.afterEach` hook (or per-view `onMounted`):

- Move focus to the new view's `<h1>`/`<main>` (`tabindex="-1"` + `.focus()`), or write the new page title into a persistent `role="status"` region.
- Give each route a unique document title (Nuxt: `useHead`) and a single `<h1>`.

## Reach elements with template refs

Use `ref="..."` + a ref variable, not `document.querySelector`, to call `dialogRef.value.showModal()` on a native `<dialog>` or to move focus into an opened panel.

## Teleport overlays to body

Wrap modals/toasts in `<Teleport to="body">` so an `overflow:hidden`/`transform` ancestor can't clip them or break the focus trap. Keep native `<dialog>` + `showModal()` inside.

## Component libraries: verify the rendered element

Wrappers like `<AppButton>` or a UI-kit `<Dropdown>` may emit a `<div>`, not a native control. Confirm the DOM output is a real `<button>`/`<input>` with the right role and keyboard behavior before trusting it — the a11y lives in the rendered element, not the component name.
