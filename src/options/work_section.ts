import type {MdFilledTextField} from '@material/web/textfield/filled-text-field';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createRef, ref, type Ref} from 'lit/directives/ref.js';
import {DEFAULT_WORKBODY} from '../utils';
import {SectionMixin, updatePreviewAndErrorState} from './utils';

declare global {
  interface HTMLElementTagNameMap {
    'work-section': WorkSection;
  }
}

@customElement('work-section')
export class WorkSection extends SectionMixin(LitElement) {
  override readonly sectionId = 'work-section';

  private textFieldRef: Ref<MdFilledTextField> = createRef();
  private preview: Ref<HTMLElement> = createRef();

  override render() {
    return html`
      <section class="main-section">
        <form @reset="${this.reset}" @submit="${this.updateStoredValue}">
          <div class="mdc-card mdc-card--outlined">
            <header>
              <h1 class="headline-small">Work template</h1>
            </header>
            <p>Set the default work template for your work.</p>
            <p>
              Note: this will leave the body of your work alone if your draft
              already has text there.
            </p>
            <p>
              This template supports keyword substitution.
              <a
                href="#common-template-keywords-section"
                id="work-template-help-keywords">
                Learn more about keyword substitution
              </a>
            </p>
            <p>
              This template supports HTML.
              <a
                href="https://archiveofourown.org/faq/formatting-content-on-ao3-with-html?language_id=en#canihtml"
                target="_blank"
                id="work-template-help-html">
                Learn more about using HTML on AO3
              </a>
            </p>
            <md-filled-text-field
              ${ref(this.textFieldRef)}
              @input="${this.updatePreview}"
              type="textarea"
              label="Work template"
              rows="5"
              cols="100"
              class="code-editor-textarea"
              id="default_body"></md-filled-text-field>
            <h2 class="title-small">Preview of generated HTML</h2>
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
    hljs.registerLanguage('xml', xml);
    const {workbody} = await chrome.storage.sync.get('workbody');
    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = workbody['default'];
    this.updatePreview();
  }

  private reset(e: Event) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = DEFAULT_WORKBODY;
    this.updatePreview();
  }

  private async updateStoredValue(e: SubmitEvent) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }

    await chrome.storage.sync.set({
      workbody: {default: textField.value},
    });
    this.snackbar.labelText = 'Work template saved';
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
