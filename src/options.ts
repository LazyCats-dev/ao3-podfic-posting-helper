import './options.scss';

import mdcAutoInit from '@material/auto-init';
import {MDCList} from '@material/list';
import {MDCRipple} from '@material/ripple';
import {MDCSnackbar} from '@material/snackbar';
import {MDCTopAppBar} from '@material/top-app-bar';
import hljs from 'highlight.js/lib/core';
import plaintext from 'highlight.js/lib/languages/plaintext';
import xml from 'highlight.js/lib/languages/xml';
import {default as sanitize, default as sanitizeHtml} from 'sanitize-html';
import {
  setCheckboxState,
  setInputValue,
  setupGlobalEventLogging,
  setupStorage,
} from './utils';
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/checkbox/checkbox.js';
import {type MdFilledTextField} from '@material/web/textfield/filled-text-field';
import {type MdCheckbox} from '@material/web/checkbox/checkbox.js';

setupGlobalEventLogging();
mdcAutoInit.register('MDCTopAppBar', MDCTopAppBar);
mdcAutoInit.register('MDCRipple', MDCRipple);
mdcAutoInit();

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('plaintext', plaintext);

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
    allowedAttributes: {'*': ['rel', 'alt', 'crossorigin', 'preload', 'href']},
  };

  const DOM_PARSER = new DOMParser();
  const titleTemplate = document.getElementById(
    'title_template'
  ) as MdFilledTextField;
  const titleForm = document.getElementById('title_form') as HTMLFormElement;
  const titlePreview = document.getElementById('title_preview') as HTMLElement;
  const summaryTemplate = document.getElementById(
    'summary_template'
  ) as MdFilledTextField;
  const summaryPreview = document.getElementById('summary_preview')!;
  const summaryForm = document.getElementById(
    'summary_form'
  ) as HTMLFormElement;
  const notesTemplate = document.getElementById(
    'notes_template'
  ) as MdFilledTextField;
  const notesPreview = document.getElementById('notes_preview')!;
  const notesForm = document.getElementById('notes_form') as HTMLFormElement;
  const defaultBody = document.getElementById(
    'default_body'
  ) as MdFilledTextField;
  const defaultBodyPreview = document.getElementById('default_body_preview')!;
  const workForm = document.getElementById('work_form')!;
  const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar')!);
  const titleResetButton = document.getElementById('title_reset')!;
  const summaryResetButton = document.getElementById('summary_reset')!;
  const notesResetButton = document.getElementById('notes_reset')!;
  const beginningNotesCheckbox = document.getElementById(
    'beginning_notes'
  ) as MdCheckbox;
  const endNotesCheckbox = document.getElementById(
    'end_notes'
  ) as HTMLInputElement;
  const navList = new MDCList(document.querySelector('.mdc-deprecated-list')!);
  navList.wrapFocus = true;

  titleResetButton.addEventListener('click', async () => {
    setInputValue(titleTemplate, '[Podfic] ${title}');
  });

  summaryResetButton.addEventListener('click', async () => {
    setInputValue(
      summaryTemplate,
      '${blocksummary}Podfic of ${title} by ${authors}.'
    );
  });

  notesResetButton.addEventListener('click', async () => {
    setInputValue(notesTemplate, '');
    setCheckboxState(beginningNotesCheckbox, false);
    setCheckboxState(endNotesCheckbox, false);
  });

  titleTemplate.addEventListener('input', () => {
    titlePreview.textContent = titleTemplate.value
      .replaceAll('${title}', 'TITLE_TEXT')
      .replaceAll('${title-unlinked}', 'TITLE_TEXT')
      .replaceAll('${authors}', 'AUTHOR_1, AUTHOR_2')
      .replaceAll('${author}', 'AUTHOR_1, AUTHOR_2')
      .replaceAll('${authors-unlinked}', 'AUTHOR_1, AUTHOR_2')
      .replaceAll('${author-unlinked}', 'AUTHOR_1, AUTHOR_2');
    titlePreview.dataset.highlighted = '';
    hljs.highlightElement(titlePreview);
    if (isHtml(titleTemplate.value)) {
      titleTemplate.errorText =
        'This template should not contain HTML but it appears to contain HTML';
      titleTemplate.error = true;
    } else {
      titleTemplate.errorText = '';
      titleTemplate.error = false;
    }
  });

  function isHtml(str: string) {
    return /<\/?[a-z][\s\S]*>/i.test(str);
  }

  attachHTMLPreviewAndValidateListeners(summaryTemplate, summaryPreview);

  attachHTMLPreviewAndValidateListeners(notesTemplate, notesPreview);

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
    const {title_template, summary_template, notes_template, workbody} =
      await browser.storage.sync.get([
        'title_template',
        'summary_template',
        'notes_template',
        'workbody',
      ]);
    setInputValue(titleTemplate, title_template['default']);
    setInputValue(defaultBody, workbody['default']);
    setInputValue(summaryTemplate, summary_template['default']);
    setInputValue(notesTemplate, notes_template['default']);
    setCheckboxState(beginningNotesCheckbox, notes_template['begin']);
    setCheckboxState(endNotesCheckbox, notes_template['end']);
  })();

  // When the form is submitted, save the default body text (without overriding
  // other options).
  workForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      workbody: {default: defaultBody.value},
    });
    snackbar.labelText = 'Work template saved';
    snackbar.open();
  });
  titleForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      title_template: {default: titleTemplate.value},
    });
    snackbar.labelText = 'Title template saved';
    snackbar.open();
  });
  summaryForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      summary_template: {default: summaryTemplate.value},
    });
    snackbar.labelText = 'Summary template saved';
    snackbar.open();
  });
  notesForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      notes_template: {
        default: notesTemplate.value,
        begin: beginningNotesCheckbox.checked,
        end: endNotesCheckbox.checked,
      },
    });
    snackbar.labelText = 'Notes template saved';
    snackbar.open();
  });

  document.querySelector('.version')!.textContent =
    browser.runtime.getManifest().version;

  // Set focus for a11y.
  titleTemplate.focus();
})();
