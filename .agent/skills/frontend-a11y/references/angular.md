# Angular

The HTML/CSS rules in `SKILL.md` all hold — Angular renders the same DOM. This file covers the Angular-specific deltas. Prefer native `<button>`, `<dialog>`, `<details>`, `<label>` here too.

## Bind ARIA with [attr.aria-*], not [aria-*]

The biggest Angular a11y gotcha: `aria-*` are HTML **attributes**, not DOM properties, so a dynamic binding needs the `attr.` prefix. `[aria-expanded]="open"` silently does nothing; `[attr.aria-expanded]="open"` works. Static ARIA is written plain.

```html
<!-- Don't — no such property, binding is dropped -->
<button [aria-expanded]="open">Menu</button>

<!-- Do — attribute binding -->
<button type="button" [attr.aria-expanded]="open" aria-controls="menu" aria-label="Menu">
  <svg aria-hidden="true">...</svg>
</button>
```

`role` is the same: `[attr.role]="..."` when dynamic. `[class]`/`[class.x]` and `(click)` follow normal Angular binding.

## Don't put (click) on a div

A `<div (click)>` isn't focusable or keyboard-operable and Angular's template linter will flag it. Use a native `<button>` (see "Use Native Elements").

## innerHTML is sanitized by default — keep it that way

Angular sanitizes `[innerHTML]` bindings, which protects you from XSS. `DomSanitizer.bypassSecurityTrustHtml` removes that protection — only use it on content you fully control, never on user or CMS input.

## Route changes must move focus and announce

The Angular Router swaps components without a page load, stranding focus and announcing nothing. Subscribe to `NavigationEnd` and:

- Move focus to the new view's `<h1>`/`<main>` (`tabindex="-1"` + `.focus()`), **or** use the CDK `LiveAnnouncer` (`announce()`) to speak the new page name.
- Set a unique page `<title>` per route (`Title` service or route `title`) and render one `<h1>`.

## Use the CDK a11y primitives

`@angular/cdk/a11y` gives you `LiveAnnouncer` (polite/assertive announcements), `cdkTrapFocus` (focus trapping for custom overlays), and `FocusMonitor` (focus-origin-aware styling). Prefer these over hand-rolled focus code. For dialogs, still prefer native `<dialog>` + `showModal()`; if you use Angular Material / CDK Dialog, it manages the trap for you.

## Component libraries: verify the rendered element

Angular Material and other kits usually render correct native semantics, but wrappers can emit a `<div>` styled as a control. Confirm the DOM output is a real `<button>`/`<input>` with the expected role and keyboard behavior — the a11y lives in the rendered element, not the selector.
