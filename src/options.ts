import './options.scss';

import mdcAutoInit from '@material/auto-init';
import {MDCCheckbox} from '@material/checkbox';
import {MDCFormField} from '@material/form-field';
import {MDCList} from '@material/list';
import {MDCRipple} from '@material/ripple';
import {MDCSnackbar} from '@material/snackbar';
import {MDCTextField} from '@material/textfield';
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
import browser from 'webextension-polyfill';

setupGlobalEventLogging();
mdcAutoInit.register('MDCTopAppBar', MDCTopAppBar);
mdcAutoInit.register('MDCRipple', MDCRipple);
mdcAutoInit.register('MDCFormField', MDCFormField);
mdcAutoInit.register('MDCCheckbox', MDCCheckbox);
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
    allowedAttributes: {'*': ['rel', 'alt', 'crossorigin', 'preload']},
  };

  const DOM_PARSER = new DOMParser();
  const titleTemplate = document.getElementById(
    'title_template'
  ) as HTMLTextAreaElement;
  const titleForm = document.getElementById('title_form') as HTMLFormElement;
  const titlePreview = document.getElementById(
    'title_preview'
  ) as HTMLTextAreaElement;
  const titleTextField = new MDCTextField(
    titleTemplate.closest('.mdc-text-field')!
  );
  const summaryTemplate = document.getElementById(
    'summary_template'
  ) as HTMLTextAreaElement;
  const summaryTemplateTextField = new MDCTextField(
    summaryTemplate.closest('.mdc-text-field')!
  );
  const summaryPreview = document.getElementById('summary_preview')!;
  const summaryForm = document.getElementById(
    'summary_form'
  ) as HTMLFormElement;
  const notesTemplate = document.getElementById(
    'notes_template'
  ) as HTMLTextAreaElement;
  const notesTemplateTextField = new MDCTextField(
    notesTemplate.closest('.mdc-text-field')!
  );
  const notesPreview = document.getElementById('notes_preview')!;
  const notesForm = document.getElementById('notes_form') as HTMLFormElement;
  const defaultBody = document.getElementById(
    'default_body'
  ) as HTMLTextAreaElement;
  const defaultBodyTextField = new MDCTextField(
    defaultBody.closest('.mdc-text-field')!
  );
  const defaultBodyPreview = document.getElementById('default_body_preview')!;
  const workForm = document.getElementById('work_form')!;
  const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar')!);
  const titleResetButton = document.getElementById('title_reset')!;
  const summaryResetButton = document.getElementById('summary_reset')!;
  const notesResetButton = document.getElementById('notes_reset')!;
  const beginningNotesCheckbox = document.getElementById(
    'beginning_notes'
  ) as HTMLInputElement;
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

  titleTextField.useNativeValidation = false;

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
      titleTextField.helperTextContent =
        'This template should not contain HTML but it appears to contain HTML';
      titleTextField.valid = false;
    } else {
      titleTextField.helperTextContent = '';
      titleTextField.valid = true;
    }
  });

  function isHtml(str: string) {
    return /<\/?[a-z][\s\S]*>/i.test(str);
  }

  attachHTMLPreviewAndValidateListeners(
    summaryTemplateTextField,
    summaryTemplate,
    summaryPreview
  );

  attachHTMLPreviewAndValidateListeners(
    notesTemplateTextField,
    notesTemplate,
    notesPreview
  );

  attachHTMLPreviewAndValidateListeners(
    defaultBodyTextField,
    defaultBody,
    defaultBodyPreview
  );

  function attachHTMLPreviewAndValidateListeners(
    templateTextField: MDCTextField,
    template: HTMLInputElement | HTMLTextAreaElement,
    preview: HTMLElement
  ) {
    templateTextField.useNativeValidation = false;

    template.addEventListener('input', () => {
      const previewHtml = sanitizeHtml(
        template.value
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

      if (!isValidAo3ValidHtml(template.value)) {
        templateTextField.helperTextContent =
          'This template appears to contain HTML tags that cannot be used on ' +
          'AO3, they have been removed from the preview';
        templateTextField.valid = false;
      } else {
        templateTextField.helperTextContent = '';
        templateTextField.valid = true;
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
    snackbar.open();
  });
  titleForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      title_template: {default: titleTemplate.value},
    });
    snackbar.open();
  });
  summaryForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      summary_template: {default: summaryTemplate.value},
    });
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
    snackbar.open();
  });

  document.querySelector('.version')!.textContent =
    browser.runtime.getManifest().version;

  // Set focus for a11y.
  titleTemplate.focus();
})();
