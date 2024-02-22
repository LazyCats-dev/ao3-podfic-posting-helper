import type {MdFilledTextField} from '@material/web/textfield/filled-text-field';
import hljs from 'highlight.js/lib/core';
import plaintext from 'highlight.js/lib/languages/plaintext';
import {LitElement, html, unsafeCSS} from 'lit';
import {customElement} from 'lit/decorators.js';
import {createRef, ref, type Ref} from 'lit/directives/ref.js';
import hljsAllyStyles from '../resources/highlight-a11y-light.min.css';
import hljsStyles from '../resources/highlight.min.css';
import styles from './options.scss';

declare global {
  interface HTMLElementTagNameMap {
    'title-section': TitleSection;
  }
}

@customElement('title-section')
export class TitleSection extends LitElement {
  static override styles = [
    unsafeCSS(hljsAllyStyles),
    unsafeCSS(hljsStyles),
    unsafeCSS(styles),
  ];

  private textFieldRef: Ref<MdFilledTextField> = createRef();
  private preview: Ref<HTMLElement> = createRef();

  override render() {
    return html`
      <section id="title-section" class="main-section">
        <form @reset="${this.reset}" @submit="${this.updateStoredValue}">
          <div class="mdc-card mdc-card--outlined">
            <header>
              <h1 class="mdc-typography--headline5">Title template</h1>
            </header>
            <p>
              Set the title template to use with the "Custom" title format
              option.
              <br />
              The following sequences in your template will be replaced:
            </p>
            <dl>
              <dt>
                <strong><code>\${title}</code></strong>
              </dt>
              <dd>The title of the original work.</dd>
              <dt>
                <strong><code>\${authors}</code></strong>
              </dt>
              <dd>
                A comma-separated list of the authors of the original work.
              </dd>
            </dl>
            <p>
              This template does
              <strong>not</strong>
              support HTML.
            </p>
            <md-filled-text-field
              ${ref(this.textFieldRef)}
              @input="${this.updatePreview}"
              type="textarea"
              label="Title template"
              rows="1"
              cols="100"></md-filled-text-field>
            <h2 class="mdc-typography--subtitle2">Preview</h2>
            <pre>
                <code ${ref(this.preview)} class="language-plaintext"></code>
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
    const {title_template} = await chrome.storage.sync.get('title_template');
    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = title_template['default'];
    this.updatePreview();
    textField.focus();
  }

  private reset(e: Event) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }
    textField.value = '[Podfic] ${title}';
  }

  private async updateStoredValue(e: SubmitEvent) {
    e.preventDefault();

    const textField = this.textFieldRef.value;
    if (!textField) {
      return;
    }

    await chrome.storage.sync.set({
      title_template: {default: textField.value},
    });
    // snackbar.labelText = 'Title template saved';
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

    previewElement.textContent = textField.value
      .replaceAll('${title}', 'TITLE_TEXT')
      .replaceAll('${title-unlinked}', 'TITLE_TEXT')
      .replaceAll('${authors}', 'AUTHOR_1, AUTHOR_2')
      .replaceAll('${author}', 'AUTHOR_1, AUTHOR_2')
      .replaceAll('${authors-unlinked}', 'AUTHOR_1, AUTHOR_2')
      .replaceAll('${author-unlinked}', 'AUTHOR_1, AUTHOR_2');

    previewElement.dataset.highlighted = '';
    hljs.highlightElement(previewElement);

    if (isHtml(textField.value)) {
      textField.errorText =
        'This template should not contain HTML but it appears to contain HTML';
      textField.error = true;
    } else {
      textField.errorText = '';
      textField.error = false;
    }
  }
}

function isHtml(str: string) {
  return /<\/?[a-z][\s\S]*>/i.test(str);
}
