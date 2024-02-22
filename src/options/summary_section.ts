import type {MdFilledTextField} from '@material/web/textfield/filled-text-field';
import hljs from 'highlight.js/lib/core';
import plaintext from 'highlight.js/lib/languages/plaintext';
import {LitElement, html, unsafeCSS} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createRef, ref, type Ref} from 'lit/directives/ref.js';
import hljsAllyStyles from '../resources/highlight-a11y-light.min.css';
import hljsStyles from '../resources/highlight.min.css';
import styles from './options.scss';
import {updatePreviewAndErrorState} from './utils';

declare global {
  interface HTMLElementTagNameMap {
    'summary-section': SummarySection;
  }
}

@customElement('summary-section')
export class SummarySection extends LitElement {
  static override styles = [
    unsafeCSS(hljsAllyStyles),
    unsafeCSS(hljsStyles),
    unsafeCSS(styles),
  ];

  private textFieldRef: Ref<MdFilledTextField> = createRef();
  private preview: Ref<HTMLElement> = createRef();

  override render() {
    return html`
      <section id="summary-section" class="main-section">
        <form @reset="${this.reset}" @submit="${this.updateStoredValue}">
          <div class="mdc-card mdc-card--outlined">
            <header>
              <h1 class="mdc-typography--headline5">Summary template</h1>
            </header>
            <p>
              Set the summary template to use with the "Custom" summary format
              option.
            </p>
            <p>
              This template supports keyword substitution.
              <a href="#common-template-keywords-section">
                Learn more about keyword substitution
              </a>
            </p>
            <p>
              This template supports HTML.
              <a
                href="https://archiveofourown.org/faq/formatting-content-on-ao3-with-html?language_id=en#canihtml"
                target="_blank">
                Learn more about using HTML on AO3
              </a>
            </p>
            <md-filled-text-field
              ${ref(this.textFieldRef)}
              @input="${this.updatePreview}"
              type="textarea"
              label="Summary template"
              rows="5"
              cols="100"
              class="code-editor-textarea"></md-filled-text-field>
            <h2 class="mdc-typography--subtitle2">Preview of generated HTML</h2>
            <pre>
                <code ${ref(this.preview)} class="language-xml"></code>
            </pre>
            <div class="mdc-card__actions actions">
              <md-filled-button type="submit" has-icon>
                <md-icon slot="icon">save</md-icon>
                Save
              </md-filled-button>
              <md-outlined-button type="reset">
                <md-icon slot="icon">restart_alt</md-icon>
                Reset to default
              </md-outlined-button>
            </div>
          </div>
        </form>
      </section>
    `;
  }

  override async firstUpdated() {
    hljs.registerLanguage('plaintext', plaintext);
    const {summary_template} = await chrome.storage.sync.get(
      'summary_template'
    );
    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = summary_template['default'];
    this.updatePreview();
    textField.focus();
  }

  private reset(e: Event) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = '${blocksummary}Podfic of ${title} by ${authors}.';
  }

  private async updateStoredValue(e: SubmitEvent) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }

    await chrome.storage.sync.set({
      summary_template: {default: textField.value},
    });
    // snackbar.labelText = 'Summary template saved';
    // snackbar.open();
  }

  private updatePreview() {
    const previewElement = this.preview.value!;
    if (!previewElement) {
      return;
    }

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }

    updatePreviewAndErrorState(textField, previewElement);
  }
}
