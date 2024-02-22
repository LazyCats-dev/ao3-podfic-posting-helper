import './options.scss';

import '../resources/highlight-a11y-light.min.css';
import '../resources/highlight.min.css';
import '../resources/roboto-mono.css';
import '../resources/roboto.css';

import './common_template_keywords_section.js';
import './drawer';
import './top_app_bar.js';

import mdcAutoInit from '@material/auto-init';
import {MDCSnackbar} from '@material/snackbar';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import {type MdFilledTextField} from '@material/web/textfield/filled-text-field';
import '@material/web/textfield/filled-text-field.js';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import {default as sanitize, default as sanitizeHtml} from 'sanitize-html';
import {setInputValue, setupGlobalEventLogging, setupStorage} from '../utils';
import './notes_section.js';
import './summary_section.js';
import './title_section.js';

setupGlobalEventLogging();
mdcAutoInit();

hljs.registerLanguage('xml', xml);

(async () => {
  await setupStorage();

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
      '*': ['rel', 'alt', 'crossorigin', 'preload', 'href', 'src'],
    },
  };

  const DOM_PARSER = new DOMParser();
  const notesTemplate = document.getElementById(
    'notes_template'
  ) as MdFilledTextField;
  const defaultBody = document.getElementById(
    'default_body'
  ) as MdFilledTextField;
  const defaultBodyPreview = document.getElementById('default_body_preview')!;
  const workForm = document.getElementById('work_form')!;
  const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar')!);

  attachHTMLPreviewAndValidateListeners(defaultBody, defaultBodyPreview);

  function attachHTMLPreviewAndValidateListeners(
    templateTextField: MdFilledTextField,
    preview: HTMLElement
  ) {
    templateTextField.addEventListener('input', () => {
      const previewHtml = sanitizeHtml(
        templateTextField.value
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
    });
  }

  function isValidAo3ValidHtml(html: string) {
    const sanitized = sanitizeHtml(html.trim(), SANITIZE_HTML_OPTIONS);
    const userDocument = DOM_PARSER.parseFromString(html.trim(), 'text/html');
    const sanitizedDocument = DOM_PARSER.parseFromString(
      sanitized,
      'text/html'
    );
    return (
      userDocument.documentElement.innerHTML ===
      sanitizedDocument.documentElement.innerHTML
    );
  }

  // Import default body text from storage.
  (async () => {
    const {workbody} = await chrome.storage.sync.get(['workbody']);
    setInputValue(defaultBody, workbody['default']);
  })();

  // When the form is submitted, save the default body text (without overriding
  // other options).
  workForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await chrome.storage.sync.set({
      workbody: {default: defaultBody.value},
    });
    snackbar.labelText = 'Work template saved';
    snackbar.open();
  });

  document.querySelector('.version')!.textContent =
    chrome.runtime.getManifest().version;
})();
