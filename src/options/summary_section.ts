import type {MdFilledTextField} from '@material/web/textfield/filled-text-field';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import {LitElement, html, unsafeCSS} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createRef, ref, type Ref} from 'lit/directives/ref.js';
import {SectionMixin, updatePreviewAndErrorState} from './utils';

declare global {
  interface HTMLElementTagNameMap {
    'summary-section': SummarySection;
  }
}

@customElement('summary-section')
export class SummarySection extends SectionMixin(LitElement) {
  override readonly sectionId = 'summary-section';

  private textFieldRef: Ref<MdFilledTextField> = createRef();
  private preview: Ref<HTMLElement> = createRef();

  override render() {
    return html`
      <section class="main-section" part="section">
        <form @reset="${this.reset}" @submit="${this.updateStoredValue}">
          <div class="mdc-card mdc-card--outlined">
            <header>
              <h1 class="headline-small">Summary template</h1>
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
    const {summary_template} = await chrome.storage.sync.get(
      'summary_template'
    );
    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = summary_template['default'];
    this.updatePreview();
  }

  private reset(e: Event) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = '${blocksummary}Podfic of ${title} by ${authors}.';
    this.updatePreview();
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
    this.snackbar.labelText = 'Summary template saved';
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
