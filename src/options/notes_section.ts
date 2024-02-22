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
    'notes-section': NotesSection;
  }
}

@customElement('notes-section')
export class NotesSection extends LitElement {
  static override styles = [
    unsafeCSS(hljsAllyStyles),
    unsafeCSS(hljsStyles),
    unsafeCSS(styles),
  ];

  private textFieldRef: Ref<MdFilledTextField> = createRef();
  private preview: Ref<HTMLElement> = createRef();
  private form: Ref<HTMLFormElement> = createRef();

  override render() {
    return html`
      <section id="notes-section" class="main-section">
        <form
          ${ref(this.form)}
          @reset="${this.reset}"
          @submit="${this.updateStoredValue}">
          <div class="mdc-card mdc-card--outlined">
            <header>
              <h1 class="mdc-typography--headline5">Notes template</h1>
            </header>
            <p>Set the template to use for beginning and/or end notes.</p>
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
            <div class="form-item">
              <label class="checkbox-container">
                <md-checkbox
                  touch-target="wrapper"
                  name="beginning-notes"></md-checkbox>
                Use as beginning notes
              </label>
            </div>
            <div class="form-item">
              <label class="checkbox-container">
                <md-checkbox
                  touch-target="wrapper"
                  name="end-notes"></md-checkbox>
                Use as end notes
              </label>
            </div>
            <md-filled-text-field
              ${ref(this.textFieldRef)}
              type="textarea"
              label="Notes template"
              rows="5"
              cols="100"
              class="code-editor-textarea"
              name="template"></md-filled-text-field>
            <h2 class="mdc-typography--subtitle2">Preview of generated HTML</h2>
            <pre>
                <code ${ref(this.preview)} class="language-html"></code>
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
    const {notes_template} = await chrome.storage.sync.get('notes_template');
    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = notes_template['default'];
    this.updatePreview();
    textField.focus();
  }

  private reset(e: Event) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = '';
  }

  private async updateStoredValue(e: SubmitEvent) {
    e.preventDefault();

    const formData = new FormData(this.form.value);

    await chrome.storage.sync.set({
      notes_template: {
        default: formData.get('template'),
        begin: formData.get('beginning-notes'),
        end: formData.get('end-notes'),
      },
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
