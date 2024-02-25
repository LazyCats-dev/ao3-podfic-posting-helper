import type {MdCheckbox} from '@material/web/checkbox/checkbox';
import type {MdFilledTextField} from '@material/web/textfield/filled-text-field';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createRef, ref, type Ref} from 'lit/directives/ref.js';
import {SectionMixin, updatePreviewAndErrorState} from './utils';

declare global {
  interface HTMLElementTagNameMap {
    'notes-section': NotesSection;
  }
}

const SectionLitElement = SectionMixin(LitElement);

@customElement('notes-section')
export class NotesSection extends SectionLitElement {
  static override styles = [
    SectionLitElement.styles || [],
    css`
      .checkbox-container {
        display: flex;
        align-items: center;
      }
    `,
  ];

  override readonly sectionId = 'notes-section';

  private textFieldRef: Ref<MdFilledTextField> = createRef();
  private beginningNotesCheckbox: Ref<MdCheckbox> = createRef();
  private endNotesCheckbox: Ref<MdCheckbox> = createRef();
  private preview: Ref<HTMLElement> = createRef();
  private form: Ref<HTMLFormElement> = createRef();

  override render() {
    return html`
      <section class="main-section">
        <form
          ${ref(this.form)}
          @reset="${this.reset}"
          @submit="${this.updateStoredValue}">
          <div class="mdc-card mdc-card--outlined">
            <header>
              <h1 class="headline-small">Notes template</h1>
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
                  ${ref(this.beginningNotesCheckbox)}
                  touch-target="wrapper"
                  name="beginning-notes"></md-checkbox>
                Use as beginning notes
              </label>
            </div>
            <div class="form-item">
              <label class="checkbox-container">
                <md-checkbox
                  ${ref(this.endNotesCheckbox)}
                  touch-target="wrapper"
                  name="end-notes"></md-checkbox>
                Use as end notes
              </label>
            </div>
            <md-filled-text-field
              ${ref(this.textFieldRef)}
              @input="${this.updatePreview}"
              type="textarea"
              label="Notes template"
              rows="5"
              cols="100"
              class="code-editor-textarea"
              name="template"></md-filled-text-field>
            <h2 class="title-small">Preview of generated HTML</h2>
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
    hljs.registerLanguage('xml', xml);
    const {notes_template} = await chrome.storage.sync.get('notes_template');

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }

    const beginningNotes = this.beginningNotesCheckbox.value;
    if (!beginningNotes) {
      return;
    }

    const endNotes = this.endNotesCheckbox.value;
    if (!endNotes) {
      return;
    }

    textField.value = notes_template['default'];
    beginningNotes.checked = notes_template['begin'];
    endNotes.checked = notes_template['end'];

    this.updatePreview();
  }

  private reset(e: Event) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = '';
    this.updatePreview();
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
    this.snackbar.labelText = 'Notes template saved';
    this.snackbar.open();
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
