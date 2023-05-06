import {setCheckboxState, setInputValue, setupStorage} from './utils.js';
import hljs from './resources/highlight.min.js';
import HtmlSanitizer from './resources/html-sanitizer.js';

(async () => {
  await setupStorage();

  // Sets up the HTMlSanitizer with the tags that ao3 allows.
  [
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
  ].forEach(tag => {
    HtmlSanitizer.AllowedTags[tag.toLocaleUpperCase('en-US')] = true;
  });

  // AO3 does not allow styles
  HtmlSanitizer.AllowedAttributes['style'] = false;
  HtmlSanitizer.AllowedAttributes['rel'] = true;
  HtmlSanitizer.AllowedAttributes['alt'] = true;
  HtmlSanitizer.AllowedAttributes['crossorigin'] = true;
  HtmlSanitizer.AllowedAttributes['preload'] = true;

  const DOM_PARSER = new DOMParser();

  hljs.highlightAll();

  const titleTemplate = /** @type {HTMLTextAreaElement} */ (
    document.getElementById('title_template')
  );
  const titleForm = /** @type {HTMLFormElement} */ (
    document.getElementById('title_form')
  );
  const titlePreview = /** @type {HTMLTextAreaElement} */ (
    document.getElementById('title_preview')
  );
  /** @type {mdc.textField.MDCTextField} */
  const titleTextField = titleTemplate.closest('.mdc-text-field').MDCTextField;
  const summaryTemplate = /** @type {HTMLTextAreaElement} */ (
    document.getElementById('summary_template')
  );
  /** @type {mdc.textField.MDCTextField} */
  const summaryTemplateTextField =
    summaryTemplate.closest('.mdc-text-field').MDCTextField;
  /** @type {HTMLElement} */
  const summaryPreview = document.getElementById('summary_preview');
  const summaryForm = /** @type {HTMLFormElement} */ (
    document.getElementById('summary_form')
  );
  const notesTemplate = /** @type {HTMLTextAreaElement} */ (
    document.getElementById('notes_template')
  );
  /** @type {mdc.textField.MDCTextField} */
  const notesTemplateTextField =
    notesTemplate.closest('.mdc-text-field').MDCTextField;
  /** @type {HTMLElement} */
  const notesPreview = document.getElementById('notes_preview');
  const notesForm = /** @type {HTMLFormElement} */ (
    document.getElementById('notes_form')
  );
  const defaultBody = /** @type {HTMLTextAreaElement} */ (
    document.getElementById('default_body')
  );
  /** @type {mdc.textField.MDCTextField} */
  const defaultBodyTextField =
    defaultBody.closest('.mdc-text-field').MDCTextField;
  /** @type {HTMLElement} */
  const defaultBodyPreview = document.getElementById('default_body_preview');
  const workForm = document.getElementById('work_form');
  /** @type {mdc.snackbar.MDCSnackbar} */
  const snackbar = document.querySelector('.mdc-snackbar').MDCSnackbar;
  const titleResetButton = document.getElementById('title_reset');
  const summaryResetButton = document.getElementById('summary_reset');
  const notesResetButton = document.getElementById('notes_reset');
  const beginningNotesCheckbox =
    /** @type {HTMLInputElement} */
    (document.getElementById('beginning_notes'));
  const endNotesCheckbox =
    /** @type {HTMLInputElement} */
    (document.getElementById('end_notes'));
  /** @type {mdc.list.MDCList} */
  const navList = document.querySelector('.mdc-deprecated-list').MDCList;
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

  function isHtml(str) {
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
    /** @type {mdc.textField.MDCTextField}*/ templateTextField,
    /** @type {HTMLInputElement|HTMLTextAreaElement}*/ template,
    /** @type {HTMLElement}*/ preview
  ) {
    templateTextField.useNativeValidation = false;

    template.addEventListener('input', () => {
      const previewHtml = HtmlSanitizer.SanitizeHtml(
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
          .replaceAll('${author-unlinked}', 'AUTHOR_1, AUTHOR_2')
      );

      preview.textContent = previewHtml;
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

  function isValidAo3ValidHtml(/** @type{string} */ html) {
    const sanitized = HtmlSanitizer.SanitizeHtml(html.trim());
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

  document.querySelector('.version').textContent =
    browser.runtime.getManifest().version;

  // Set focus for a11y.
  titleTemplate.focus();
})();
