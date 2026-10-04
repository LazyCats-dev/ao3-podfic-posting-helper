# Web Components (and Lit / Stencil)

The HTML/CSS rules in `SKILL.md` all hold inside a component's template. The complications come from the **Shadow DOM boundary**, which changes how names, roles, and references work. Prefer native `<button>`, `<dialog>`, `<details>`, `<label>` inside your shadow root too.

## ID references don't cross the shadow boundary

This is the defining web-components a11y trap. `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-activedescendant`, and `for` all resolve ids **within a single tree**. An id inside your shadow root is invisible to the light DOM (and vice versa), so a control in one root cannot point at a label in another. Cross-root ARIA (the "reference target" proposal) is not yet universally supported — don't rely on it.

Practical consequences:

- Keep an element and everything it references (its label, its description, its controlled panel) in the **same** root.
- Content passed via `<slot>` stays in the light DOM, so light-DOM ids can reference each other normally — associate a slotted `<label>` and `<input>` on the author's side.

## Set roles and state with ElementInternals

To give the *host* element semantics without leaking implementation ids, use `attachInternals()` and the ARIAMixin properties. These set the accessibility role/state directly on the element, no attribute-id plumbing required.

```js
class MyToggle extends HTMLElement {
  #internals = this.attachInternals();
  connectedCallback() {
    this.#internals.role = "switch";
    this.#internals.ariaChecked = "false";
    this.tabIndex = 0; // custom interactive elements aren't focusable by default
  }
}
```

## Form-associated custom elements

For a custom control that participates in a form, set `static formAssociated = true` and use `ElementInternals`: `setFormValue()` to submit a value, `setValidity()` for validation, and the `aria*` props for state. This is how a custom input gets real label association and form semantics.

## Focus and the boundary

- Custom interactive elements need an explicit `tabindex` — they aren't focusable just because they handle clicks.
- Set `delegatesFocus: true` in `attachShadow({ mode: "open", delegatesFocus: true })` so focusing the host forwards focus to the first focusable element inside.
- Native `<dialog>` + `showModal()` works inside a shadow root and keeps its focus trap.

## Lit / Stencil specifics

- Lit: bind ARIA with `aria-expanded=${open}` in the template; state on the host still goes through `ElementInternals`. Watch that `render()` output lands in the shadow root — the id-reference rule above applies to it.
- Stencil: `@Prop({ reflect: true })` mirrors a prop to an attribute so it's visible/stylable in the DOM; use it for state you need to expose. Set `shadow: true` deliberately, knowing the id-boundary tradeoff.
