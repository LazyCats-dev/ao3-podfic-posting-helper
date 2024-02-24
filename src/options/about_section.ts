import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {SectionMixin} from './utils';

declare global {
  interface HTMLElementTagNameMap {
    'about-section': AboutSection;
  }
}

@customElement('about-section')
export class AboutSection extends SectionMixin(LitElement) {
  override readonly sectionId = 'about-section';

  private version = chrome.runtime.getManifest().version;

  override render() {
    return html`
      <section class="main-section" id="about-section">
        <div class="mdc-card mdc-card--outlined">
          <header id="about">
            <h1 class="mdc-typography--headline5">About</h1>
          </header>
          <section>
            <header>
              <h2 class="mdc-typography--headline6">Version</h2>
              <p class="version">${this.version}</p>
            </header>
          </section>
          <section>
            <header>
              <h2 class="mdc-typography--headline6">Distributions</h2>
              <ul>
                <li>
                  <a
                    href="https://chrome.google.com/webstore/detail/ao3-podfic-posting-helper/liceoplaldpcfdkndimfppgdcbophgma?utm_source=cextension&utm_medium=extension&utm_campaign=options"
                    target="_blank"
                    rel="noopener"
                    id="distrubtions-chrome">
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://microsoftedge.microsoft.com/addons/detail/ao3-podfic-posting-helper/bhggifekpnmhgpnpgngnfkfjdehlfaoj"
                    target="_blank"
                    rel="noopener"
                    id="distributions-edge">
                    Microsoft Edge
                  </a>
                </li>
                <li>
                  <a
                    href="https://addons.mozilla.org/en-US/firefox/addon/ao3-podfic-posting-helper/"
                    target="_blank"
                    rel="noopener"
                    id="distributions-firefox">
                    Firefox
                  </a>
                </li>
              </ul>
            </header>
          </section>
          <section>
            <header>
              <h2 class="mdc-typography--headline6">Feedback and bugs</h2>
              <p>There are a few ways to submit feedback or report bugs:</p>
              <ul>
                <li>
                  By asking a question in our
                  <a
                    href="https://discord.gg/rhynWjrCw2"
                    target="_blank"
                    rel="noopener"
                    id="feedback-discord">
                    Discord server
                  </a>
                </li>
                <li>
                  From the "Support" tab of the
                  <a
                    href="https://chrome.google.com/webstore/detail/ao3-podfic-posting-helper/liceoplaldpcfdkndimfppgdcbophgma?utm_source=cextension&utm_medium=extension&utm_campaign=options"
                    target="_blank"
                    rel="noopener"
                    id="feedback-chrome-web-store">
                    official chrome web store listing
                  </a>
                </li>
                <li>
                  By
                  <a
                    href="https://github.com/LazyCats-dev/ao3-podfic-posting-helper/issues/new"
                    target="_blank"
                    rel="noopener"
                    id="feedback-github">
                    submitting an issue on GitHub
                  </a>
                </li>
              </ul>
              <p>We will try to respond to any issue as soon as possible.</p>
            </header>
          </section>
          <section>
            <header>
              <h2 class="mdc-typography--headline6">Contributing</h2>
              <p>
                This extension is open source. Source code is available on
                <a
                  href="https://github.com/LazyCats-dev/ao3-podfic-posting-helper"
                  target="_blank"
                  rel="noopener"
                  id="contributing-github">
                  GitHub
                </a>
                . Feel free to send a pull request, we will try our best to
                review it in a timely manner.
              </p>
            </header>
          </section>
          <section>
            <header>
              <h2 class="mdc-typography--headline6">Credits</h2>
              <p>This extension was created by:</p>
              <ul>
                <li>
                  <a
                    href="https://archiveofourown.org/users/irrationalpie/pseuds/irrationalpie"
                    target="_blank"
                    rel="noopener"
                    id="credits-irrationalpie">
                    irrationalpie
                  </a>
                </li>
                <li>
                  <a
                    href="https://mowery.dev"
                    target="_blank"
                    rel="noopener"
                    id="credits-jeremy">
                    Jeremy Mowery
                  </a>
                </li>
                <li>
                  <a
                    href="https://archiveofourown.org/users/lastontheboat"
                    target="_blank"
                    rel="noopener"
                    id="credits-lastontheboat">
                    lastontheboat
                  </a>
                </li>
              </ul>
            </header>
          </section>
          <section>
            <header>
              <h2 class="mdc-typography--headline6">Website</h2>
              <p>
                <a
                  href="https://lazycats.dev?utm_source=cextension&utm_medium=extension&utm_campaign=options"
                  target="_blank"
                  id="website">
                  https://lazycats.dev
                </a>
              </p>
            </header>
          </section>
        </div>
      </section>
    `;
  }
}
