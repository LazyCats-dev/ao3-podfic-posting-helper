import {MDCList} from '@material/list';
import iconsStyles from '../resources/material-icons.css';
import styles from './options.scss';

import {LitElement, html, unsafeCSS} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createRef, ref, type Ref} from 'lit/directives/ref.js';

declare global {
  interface HTMLElementTagNameMap {
    'options-drawer': Drawer;
  }
}

@customElement('options-drawer')
export class Drawer extends LitElement {
  static override styles = [unsafeCSS(styles), unsafeCSS(iconsStyles)];

  private drawerRef: Ref<HTMLElement> = createRef();

  override render() {
    return html`
      <aside
        class="mdc-drawer mdc-top-app-bar--fixed-adjust"
        ${ref(this.drawerRef)}>
        <div class="mdc-drawer__content">
          <nav class="mdc-deprecated-list" id="nav-list">
            <a
              class="mdc-deprecated-list-item"
              href="#title-section"
              aria-current="page"
              data-mdc-auto-init="MDCRipple"
              id="title-template-nav-list-button">
              <span class="mdc-deprecated-list-item__ripple"></span>
              <i
                class="material-icons mdc-deprecated-list-item__graphic"
                aria-hidden="true">
                title
              </i>
              <span class="mdc-deprecated-list-item__text">Title template</span>
            </a>
            <a
              class="mdc-deprecated-list-item"
              href="#common-template-keywords-section"
              data-mdc-auto-init="MDCRipple"
              id="template-keywords-nav-list-button">
              <span class="mdc-deprecated-list-item__ripple"></span>
              <i
                class="material-icons mdc-deprecated-list-item__graphic"
                aria-hidden="true">
                vpn_key
              </i>
              <span class="mdc-deprecated-list-item__text">
                Template keywords
              </span>
            </a>
            <a
              class="mdc-deprecated-list-item"
              href="#summary-section"
              data-mdc-auto-init="MDCRipple"
              id="summary-template-nav-list-button">
              <span class="mdc-deprecated-list-item__ripple"></span>
              <i
                class="material-icons mdc-deprecated-list-item__graphic"
                aria-hidden="true">
                summarize
              </i>
              <span class="mdc-deprecated-list-item__text">
                Summary template
              </span>
            </a>
            <a
              class="mdc-deprecated-list-item"
              href="#notes-section"
              data-mdc-auto-init="MDCRipple"
              id="notes-template-nav-list-button">
              <span class="mdc-deprecated-list-item__ripple"></span>
              <i
                class="material-icons mdc-deprecated-list-item__graphic"
                aria-hidden="true">
                notes
              </i>
              <span class="mdc-deprecated-list-item__text">Notes template</span>
            </a>
            <a
              class="mdc-deprecated-list-item"
              href="#work-section"
              data-mdc-auto-init="MDCRipple"
              id="work-template-nav-list-button">
              <span class="mdc-deprecated-list-item__ripple"></span>
              <i
                class="material-icons mdc-deprecated-list-item__graphic"
                aria-hidden="true">
                work
              </i>
              <span class="mdc-deprecated-list-item__text">Work template</span>
            </a>
            <hr class="mdc-deprecated-list-divider" />
            <a
              class="mdc-deprecated-list-item"
              href="#about-section"
              data-mdc-auto-init="MDCRipple"
              id="about-nav-list-button">
              <span class="mdc-deprecated-list-item__ripple"></span>
              <i
                class="material-icons mdc-deprecated-list-item__graphic"
                aria-hidden="true">
                info
              </i>
              <span class="mdc-deprecated-list-item__text">About and help</span>
            </a>
          </nav>
        </div>
      </aside>
    `;
  }

  override firstUpdated(): void {
    const navList = MDCList.attachTo(this.drawerRef.value!);
    navList.wrapFocus = true;
  }
}
