# Component Patterns

## APG Patterns

Use these patterns when native HTML elements don't provide the needed functionality.

### Combobox with Autocomplete

https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/

For custom select dropdowns with search/filter functionality. Includes keyboard navigation and ARIA attributes.

### Switch Button Pattern

https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch-button/

For toggle controls representing on/off states. Use `role="switch"` with `aria-checked`.

### Manual Tabs Pattern

https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/

For tabbed interfaces requiring manual activation. Includes proper focus management and ARIA relationships.

### WAI Carousel Tutorial

https://www.w3.org/WAI/tutorials/carousels/

For building accessible carousels and slideshows. Covers controls, announcements, and pause functionality.

## Carousel / Scrollable Content

Prefer native HTML over a carousel library or hand-rolled carousel ARIA. Native scrolling keeps the content usable when JavaScript fails, and the browser handles keyboard and touch interaction for free. Two patterns cover almost everything.

### Scroll-snap track

A horizontally scrolling row of cards. Use a `<ul>` (native list semantics) with `overflow-x: auto` and CSS scroll snap. The browser owns all scrolling — arrow keys, wheel, swipe, and trackpad all work with no JS. Prev/next buttons are a progressive enhancement that call `scrollBy()` by roughly one card width, and should only render when the content actually overflows.

- At each end, the exhausted arrow uses `aria-disabled="true"`, **not** the native `disabled` attribute. Native `disabled` drops the button from the tab order and the accessibility tree, so a keyboard or screen reader user reaching the end of a track would have the "scroll" control vanish from under them. `aria-disabled` keeps it focusable and announced as unavailable while JS suppresses the action.
- Gate `scroll-behavior: smooth` behind `@media (prefers-reduced-motion: no-preference)`.

```html
<ul
  class="track"
  style="overflow-x: auto; display: flex; gap: 1rem; scroll-snap-type: x mandatory;"
>
  <li style="flex: 0 0 auto; scroll-snap-align: start;">...</li>
</ul>
<button
  type="button"
  aria-label="Scroll to previous"
  aria-disabled="true"
  onclick="scrollPrev()"
>
  <svg aria-hidden="true">...</svg>
</button>
<button type="button" aria-label="Scroll to next" onclick="scrollNext()">
  <svg aria-hidden="true">...</svg>
</button>
```

### Single-slide swap

One slide visible at a time. Render only the active slide and swap it on prev/next.

- Place the prev/next controls **before** the slide in source order so keyboard and screen reader users reach them first; reorder visually with CSS `order` if the design needs the controls elsewhere.
- Announce the current position with a polite live region (`aria-live="polite"`), e.g. "Slide 2 of 5", so screen reader users know the slide changed.

```html
<div aria-live="polite" class="visuallyhidden">Slide 2 of 5</div>
```

### On carousel roles

Default to native list/scroll semantics. `role="region"` + `aria-roledescription="carousel"` is only worth adding for a genuinely interactive widget where a persistent named region helps — and even then, prefer `aria-labelledby` pointing at a visible heading, falling back to `aria-label` only when there's no heading. Don't sprinkle carousel roles onto a simple scrollable row of cards.

For the general keyboard interaction reference, see the WAI Carousel Tutorial linked above.

## Live regions & alerts

`role="alert"` is one point on a spectrum. Any element becomes a **live region** by setting `aria-live`, which tells assistive tech to watch it and announce changes even when focus is elsewhere. The value is a politeness level:

- `aria-live="assertive"` (what `role="alert"` gives you) interrupts whatever the screen reader is saying. Reserve it for genuinely urgent, time-sensitive messages — interruptions are disorienting.
- `aria-live="polite"` (what `role="status"` gives you) waits for a natural pause before announcing. Use it for everything non-urgent: "3 results found", "Draft saved", a slide-position update.

The two hard rules that make live regions actually fire:

1. **The region must exist in the DOM before you put content in it.** Screen readers only announce _changes_ to a region they're already watching, so render an empty `<div role="alert">` (or `aria-live` container) up front, then inject the text. Adding the element and its text in the same paint often announces nothing.
2. **Don't stack redundant attributes.** `role="alert"` already implies `aria-live="assertive"` and `aria-atomic="true"`; adding them by hand is noise. Reach for a bare `aria-live` only when you need `role="status"`-style politeness on an element whose role you don't want to change.

```html
<!-- Urgent: interrupts immediately -->
<div role="alert">Payment failed — please try again.</div>

<!-- Non-urgent: announced at the next pause -->
<div role="status">Draft saved.</div>

<!-- Same politeness as role="status", without changing the element's role -->
<p aria-live="polite">3 results found.</p>
```

If you're unsure exactly what a state or property does before hand-authoring it, confirm the definition in [aria.md](aria.md) (`aria-*` defs from line 2916); the underlying requirement is WCAG 2.2 — 4.1.3 Status Messages in [wcag.json](wcag.json) (`ref_id` `4.1.3`).

## Form errors

Validation errors are the one place you should _not_ reach for `aria-live`. An error isn't an ambient update that arrives while attention is elsewhere — it's the direct result of the user pressing "Submit", so they're already waiting for the answer. The reliable move is to take them _to_ the error, which both announces it and shows them where to fix it. A live region only announces; it's also timing-fragile (see above), and for a list of errors it reads a wall of text without moving anyone anywhere.

**Inline errors — tie the message to its field with `aria-describedby`.** Mark the field `aria-invalid="true"` and point `aria-describedby` at the `id` of the element holding the error text. The message becomes part of the field's accessible description, so it's read every time focus lands there — while filling in, tabbing back, or correcting — with no live region and no timing games. When the field becomes valid, drop `aria-invalid` and the error link (or repoint `aria-describedby` at a plain hint).

```html
<label for="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error">Enter a valid email address, e.g. name@example.com.</p>
```

**Error summary — move focus to it on submit.** When submission fails, render a summary at the top of the form that lists each error linked to its field, give the container a unique `id` and `tabindex="-1"`, and move focus to it. Focusing the container announces its contents for free — no `aria-live` needed — and, just as importantly, it _relocates_ the user back to the top of the form so they can read the whole list and jump to the first broken field, instead of being stranded wherever the submit button was. `tabindex="-1"` makes the container programmatically focusable via `.focus()` without adding it to the tab order. Render the summary only while errors exist, so focus is never sent to an empty container.

```html
<div id="error-summary" tabindex="-1">
  <h2>There are 2 problems with your submission</h2>
  <ul>
    <li><a href="#email">Enter a valid email address</a></li>
    <li><a href="#password">Password must be at least 8 characters</a></li>
  </ul>
</div>
```

```js
// After validation fails, orient the user at the summary
document.getElementById("error-summary").focus();
```

## Testing

### APG Gherkin

https://github.com/AFixt/apg-gherkin

Web accessibility component test cases in Gherkin format. Use for testing component behavior and keyboard interactions.

## Additional Resources

### Inclusive Components

https://inclusive-components.design/

Accessible component patterns with detailed explanations. Written by Heydon Pickering.

### The A11y Project

https://www.a11yproject.com/

Community-driven accessibility resources, checklists, and articles.

### WebAIM Articles

https://webaim.org/articles/

In-depth articles on accessibility topics, techniques, and best practices.
