# Svelte (and SvelteKit)

The HTML/CSS rules in `SKILL.md` all hold — Svelte templates are close to plain HTML (`class`, `for`, `aria-*` are written as-is), so most examples transfer verbatim. This file covers the Svelte-specific deltas. Prefer native `<button>`, `<dialog>`, `<details>`, `<label>` here too.

## The compiler lints accessibility — don't silence it

Svelte's compiler emits accessibility warnings (`a11y-*` in Svelte 4, `a11y_*` in Svelte 5) for things like a click handler on a non-interactive element, an `<img>` without `alt`, or a `<label>` with no associated control. These are real defects, not noise. **Fix the markup rather than suppressing the warning** — reaching for `<!-- svelte-ignore -->` should be rare and justified (e.g. a genuinely decorative element), never a reflex.

```svelte
<!-- Triggers a11y warning — and rightly so -->
<div on:click={submit}>Submit</div>

<!-- Fix: use a real button -->
<button type="button" on:click={submit}>Submit</button>
```

## Event / attribute syntax

- Svelte 4: `on:click`, `class:active={isActive}`. Svelte 5: `onclick`, same `class:` directive.
- `aria-*` and `role` are plain attributes and pass through to the DOM, so every ARIA rule applies unchanged. Bind dynamically with `aria-expanded={open}`.

## {@html ...} is an XSS hole

It injects raw markup and skips Svelte's escaping. Avoid it; render text normally. If unavoidable, sanitize first (e.g. DOMPurify) — never pass user or CMS content straight in.

## SvelteKit already handles route focus — verify it

On client-side navigation SvelteKit moves focus to `<body>` (or an element you mark) and announces the new page via a built-in live region that reads the document `<title>`. That baseline is good, but it only works if you give it something to announce:

- Every route must set a unique, descriptive `<svelte:head><title>` and render a single `<h1>`.
- To send focus somewhere more useful than `<body>`, use `afterNavigate` to focus the main heading (`tabindex="-1"`).

## Live regions must be mounted before they update

A `role="alert"`/`role="status"` region is only announced when text enters an **existing** region. Don't create it with `{#if}` at announce time; keep it rendered and change its text.

```svelte
<p role="status">{statusMessage}</p>
```

## Reach elements with bind:this

Use `bind:this={dialogEl}` and then `dialogEl.showModal()` on a native `<dialog>`, or to move focus — not `document.querySelector`.
