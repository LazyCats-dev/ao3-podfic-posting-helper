import mdcAutoInit from '@material/auto-init';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/textfield/filled-text-field.js';
import {setupGlobalEventLogging, setupStorage} from '../utils';
import './about_section.js';
import './common_template_keywords_section.js';
import './drawer';
import './notes_section.js';
import './options.scss';
import './summary_section.js';
import './title_section.js';
import './top_app_bar.js';
import './work_section.js';

import {provide} from '@lit/context';
import {MDCSnackbar} from '@material/snackbar';
import {LitElement, html, unsafeCSS} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {createRef, ref, type Ref} from 'lit/directives/ref.js';
import styles from './options.scss';
import {snackbarContext} from './utils';

declare global {
  interface HTMLElementTagNameMap {
    'options-page': OptionsPage;
  }
}

@customElement('options-page')
export class OptionsPage extends LitElement {
  static override styles = [unsafeCSS(styles)];

  @provide({context: snackbarContext})
  @state()
  private snackbar!: MDCSnackbar;

  private snackBarRef: Ref<HTMLElement> = createRef();

  override render() {
    return html`
      <options-top-app-bar></options-top-app-bar>
      <options-drawer></options-drawer>
      <div class="mdc-drawer-app-content mdc-top-app-bar--fixed-adjust">
        <main class="page-content">
          <title-section></title-section>
          <common-template-keywords-section></common-template-keywords-section>
          <summary-section></summary-section>
          <notes-section></notes-section>
          <work-section></work-section>
          <about-section></about-section>
        </main>
      </div>
      <div class="mdc-snackbar" ${ref(this.snackBarRef)}>
        <div
          class="mdc-snackbar__surface"
          role="status"
          aria-relevant="additions">
          <div class="mdc-snackbar__label" aria-atomic="false">
            Options saved
          </div>
          <div class="mdc-snackbar__actions" aria-atomic="true"></div>
        </div>
      </div>
    `;
  }

  override async firstUpdated() {
    setupGlobalEventLogging();
    mdcAutoInit();
    await setupStorage();
    this.snackbar = new MDCSnackbar(this.snackBarRef.value!);
  }
}
