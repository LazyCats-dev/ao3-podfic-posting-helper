import {MDCTopAppBar} from '@material/top-app-bar';
import {TOP_APP_BAR_STYLES} from '../common/top_app_bar/top_app_bar';

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createRef, ref, type Ref} from 'lit/directives/ref.js';

declare global {
  interface HTMLElementTagNameMap {
    'options-top-app-bar': OptionsTopAppBar;
  }
}

@customElement('options-top-app-bar')
export class OptionsTopAppBar extends LitElement {
  static override styles = [TOP_APP_BAR_STYLES];

  private topAppBarRef: Ref<HTMLElement> = createRef();

  override render() {
    return html`
      <header
        class="mdc-top-app-bar app-bar"
        data-mdc-auto-init="MDCTopAppBar"
        ${ref(this.topAppBarRef)}>
        <div class="mdc-top-app-bar__row">
          <section
            class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
            <img
              class="material-icons mdc-top-app-bar__navigation-icon header-icon"
              role="presentation"
              alt=""
              src="/icons/icon-32.png" />
            <span class="mdc-top-app-bar__title">
              AO3 Podfic Posting Helper Extension Options
            </span>
          </section>
          <section
            class="mdc-top-app-bar__section mdc-top-app-bar__section--align-end"
            role="toolbar">
            <md-icon-button
              class="mdc-top-app-bar__action-item"
              aria-label="View code for this extension on Github"
              href="https://github.com/LazyCats-dev/ao3-podfic-posting-helper"
              target="_blank"
              rel="noopener">
              <md-icon>code</md-icon>
            </md-icon-button>
            <md-icon-button
              class="mdc-top-app-bar__action-item"
              aria-label="Submit feedback"
              href="https://github.com/LazyCats-dev/ao3-podfic-posting-helper/issues/new?title=%5BOptions%5D%3A%20"
              target="_blank"
              rel="noopener">
              <md-icon>feedback</md-icon>
            </md-icon-button>
          </section>
        </div>
      </header>
    `;
  }

  override firstUpdated(): void {
    new MDCTopAppBar(this.topAppBarRef.value!);
  }
}
