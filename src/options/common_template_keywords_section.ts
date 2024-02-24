import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {SectionMixin} from './utils';

declare global {
  interface HTMLElementTagNameMap {
    'common-template-keywords-section': CommonTemplateKeywordsSection;
  }
}

@customElement('common-template-keywords-section')
export class CommonTemplateKeywordsSection extends SectionMixin(LitElement) {
  override readonly sectionId = 'common-template-keywords-section';

  override render() {
    return html`
      <section class="main-section">
        <div class="mdc-card mdc-card--outlined">
          <header id="common-template-keywords">
            <h1 class="mdc-typography--headline5">Template keywords</h1>
          </header>
          <p>
            These template keywords are shared between all templates that
            support html, which means summary, notes, and work body, but not the
            custom title template.
          </p>
          <p>The following sequences in your templates will be replaced:</p>
          <dl>
            <dt>
              <strong><code>\${blocksummary}</code></strong>
            </dt>
            <dd>
              The summary of the original work wrapped in a
              <code>blockquote</code>
              , which will indent it. Because of the way ao3 handles block
              quotes, you should put whatever you want to follow this on the
              same line.
            </dd>
            <dt>
              <strong><code>\${summary}</code></strong>
            </dt>
            <dd>The summary of the original work.</dd>
            <dt>
              <strong><code>\${title}</code></strong>
            </dt>
            <dd>
              The title of the original work. This will be a link to the
              original work.
            </dd>
            <dt>
              <strong><code>\${title-unlinked}</code></strong>
            </dt>
            <dd>
              The title of the original work, without a link to the original
              work.
            </dd>
            <dt>
              <strong><code>\${authors}</code></strong>
            </dt>
            <dd>
              A comma-separated list of the authors of the original work. Each
              author is a link to their AO3 page.
            </dd>
            <dt>
              <strong><code>\${authors-unlinked}</code></strong>
            </dt>
            <dd>
              A comma-separated list of the authors of the original work,
              without links to their AO3 page.
            </dd>
          </dl>
        </div>
      </section>
    `;
  }
}
