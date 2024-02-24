import {consume, createContext} from '@lit/context';
import {type MDCSnackbar} from '@material/snackbar';
import type {MdFilledTextField} from '@material/web/textfield/filled-text-field';
import hljs from 'highlight.js/lib/core';
import {unsafeCSS, type LitElement} from 'lit';
import {default as sanitize, default as sanitizeHtml} from 'sanitize-html';
import hljsAllyStyles from '../resources/highlight-a11y-light.min.css';
import hljsStyles from '../resources/highlight.min.css';
import styles from './options.scss';

/** @see {@link https://archiveofourown.org/faq/formatting-content-on-ao3-with-html} */
const SANITIZE_HTML_OPTIONS: sanitize.IOptions = {
  allowedTags: [
    'a',
    'abbr',
    'acronym',
    'address',
    'audio',
    'b',
    'big',
    'blockquote',
    'br',
    'caption',
    'center',
    'cite',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'dfn',
    'div',
    'dl',
    'dt',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'iframe',
    'img',
    'ins',
    'kbd',
    'li',
    'ol',
    'p',
    'pre',
    'q',
    's',
    'samp',
    'small',
    'span',
    'strike',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'tt',
    'u',
    'ul',
    'var',
  ],
  allowedAttributes: {
    '*': [
      'rel',
      'alt',
      'crossorigin',
      'preload',
      'href',
      'src',
      'height',
      'width',
      'controls',
    ],
  },
};

const DOM_PARSER = new DOMParser();

function replaceCommonTemplateValuesAndSanitize(value: string) {
  return sanitizeHtml(
    value
      .replaceAll(
        '${blocksummary}',
        '<blockquote>BLOCK_SUMMARY_TEXT</blockquote>'
      )
      .replaceAll('${summary}', 'SUMMARY_TEXT')
      .replaceAll('${title}', '<a>TITLE_TEXT</a>')
      .replaceAll('${title-unlinked}', 'TITLE_TEXT')
      .replaceAll('${authors}', '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>')
      .replaceAll('${author}', '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>')
      .replaceAll('${authors-unlinked}', 'AUTHOR_1, AUTHOR_2')
      .replaceAll('${author-unlinked}', 'AUTHOR_1, AUTHOR_2'),
    SANITIZE_HTML_OPTIONS
  );
}

function isValidAo3ValidHtml(html: string) {
  const sanitized = sanitizeHtml(html.trim(), SANITIZE_HTML_OPTIONS);
  const userDocument = DOM_PARSER.parseFromString(html.trim(), 'text/html');
  const sanitizedDocument = DOM_PARSER.parseFromString(sanitized, 'text/html');
  return (
    userDocument.documentElement.innerHTML ===
    sanitizedDocument.documentElement.innerHTML
  );
}

export function updatePreviewAndErrorState(
  templateTextField: MdFilledTextField,
  preview: HTMLElement
) {
  const previewHtml = replaceCommonTemplateValuesAndSanitize(
    templateTextField.value
  );

  preview.textContent = previewHtml;
  preview.dataset.highlighted = '';
  hljs.highlightElement(preview);

  if (!isValidAo3ValidHtml(templateTextField.value)) {
    templateTextField.errorText =
      'This template appears to contain HTML tags that cannot be used on ' +
      'AO3, they have been removed from the preview';
    templateTextField.error = true;
  } else {
    templateTextField.errorText = '';
    templateTextField.error = false;
  }
}

type Constructor<T = {}> = new (...args: any[]) => T;

export interface SectionMixinInterface {
  readonly sectionId: string;
  readonly snackbar: MDCSnackbar;
}

export const SectionMixin = <T extends Constructor<LitElement>>(
  superClass: T
) => {
  class SectionMixinClass extends superClass {
    static styles = [
      (superClass as unknown as typeof LitElement).styles ?? [],
      unsafeCSS(hljsAllyStyles),
      unsafeCSS(hljsStyles),
      unsafeCSS(styles),
    ];

    @consume({context: snackbarContext, subscribe: true})
    readonly snackbar!: MDCSnackbar;

    readonly sectionId = '';

    override connectedCallback(): void {
      super.connectedCallback();
      window.addEventListener('hashchange', () => this.scrollSectionIntoView());
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      window.removeEventListener('hashchange', () =>
        this.scrollSectionIntoView()
      );
    }

    private scrollSectionIntoView() {
      if (location.hash !== `#${this.sectionId}`) {
        return;
      }
      const section = this.renderRoot?.querySelector('section');
      if (section) {
        section.scrollIntoView({behavior: 'smooth'});
        section.classList.add('highlight');
        // Remove the hash from the URL so that we can scroll to the same section again.
        history.pushState(
          '',
          document.title,
          window.location.pathname + window.location.search
        );
        setTimeout(() => section.classList.remove('highlight'), 2000);
      }
    }
  }
  return SectionMixinClass as Constructor<SectionMixinInterface> & T;
};

/** Snackbar context. */
export const snackbarContext = createContext<MDCSnackbar>(
  Symbol('snackbarContext')
);
