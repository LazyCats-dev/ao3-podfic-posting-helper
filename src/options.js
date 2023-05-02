import {setCheckboxState, setInputValue, setupStorage} from './utils.js';

(async () => {
  await setupStorage();

  // Sets up the HTMlSanitizer with the tags that ao3 allows.
  ['a',
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
  ].forEach((tag) => {
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

  /** @type {HTMLInputElement} */
  const titleTemplate = document.getElementById('title_template');
  /** @type {HTMLFormElement} */
  const titleForm = document.getElementById('title_form');
  /** @type {HTMLInputElement} */
  const titlePreview = document.getElementById('title_preview');
  /** @type {MDCTextField} */
  const titleTextField = titleTemplate.closest('.mdc-text-field').MDCTextField;
  /** @type {HTMLInputElement} */
  const summaryTemplate = document.getElementById('summary_template');
  const summaryTemplateTextField =
      summaryTemplate.closest('.mdc-text-field').MDCTextField;
  /** @type {HTMLElement} */
  const summaryPreview = document.getElementById('summary_preview');
  /** @type {HTMLFormElement} */
  const summaryForm = document.getElementById('summary_form');
  const notesTemplate = document.getElementById('notes_template');
  const notesTemplateTextField =
      notesTemplate.closest('.mdc-text-field').MDCTextField;
  /** @type {HTMLElement} */
  const notesPreview = document.getElementById('notes_preview');
  /** @type {HTMLFormElement} */
  const notesForm = document.getElementById('notes_form');
  /** @type {HTMLInputElement} */
  const defaultBody = document.getElementById('default_body');
  const defaultBodyTextField =
      defaultBody.closest('.mdc-text-field').MDCTextField;
  /** @type {HTMLElement} */
  const defaultBodyPreview = document.getElementById('default_body_preview');
  /** @type {HTMLFormElement} */
  const workForm = document.getElementById('work_form');
  const snackbar = document.querySelector('.mdc-snackbar').MDCSnackbar;
  /** @type {HTMLButtonElement} */
  const titleResetButton = document.getElementById('title_reset');
  /** @type {HTMLButtonElement} */
  const summaryResetButton = document.getElementById('summary_reset');
  /** @type {HTMLButtonElement} */
  const notesResetButton = document.getElementById('notes_reset');
  /** @type {HTMLInputElement} */
  const beginningNotesCheckbox = document.getElementById('beginning_notes');
  /** @type {HTMLInputElement} */
  const endNotesCheckbox = document.getElementById('end_notes');
  const navList = document.getElementById('nav-list').MDCList;
  navList.wrapFocus = true;

  titleResetButton.addEventListener('click', async () => {
    const {title_template} = await browser.storage.sync.get('title_template');
    setInputValue(titleTemplate, '[Podfic] ${title}');
  });

  summaryResetButton.addEventListener('click', async () => {
    const {summary_template} =
        await browser.storage.sync.get('summary_template');
    setInputValue(
        summaryTemplate, '${blocksummary}Podfic of ${title} by ${authors}.');
  });

  notesResetButton.addEventListener('click', async () => {
    const {notes_template} = await browser.storage.sync.get('notes_template');

    setInputValue(notesTemplate, '');
    setCheckboxState(beginningNotesCheckbox, false);
    setCheckboxState(endNotesCheckbox, false);
  });

  titleTextField.useNativeValidation = false;

  titleTemplate.addEventListener('input', (event) => {
    titlePreview.textContent =
        event.target.value.replaceAll('${title}', 'TITLE_TEXT')
            .replaceAll('${title-unlinked}', 'TITLE_TEXT')
            .replaceAll('${authors}', 'AUTHOR_1, AUTHOR_2')
            .replaceAll('${author}', 'AUTHOR_1, AUTHOR_2')
            .replaceAll('${authors-unlinked}', 'AUTHOR_1, AUTHOR_2')
            .replaceAll('${author-unlinked}', 'AUTHOR_1, AUTHOR_2');
    hljs.highlightElement(titlePreview);
    if (isHtml(event.target.value)) {
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
      summaryTemplateTextField, summaryTemplate, summaryPreview);

  attachHTMLPreviewAndValidateListeners(
      notesTemplateTextField, notesTemplate, notesPreview);

  attachHTMLPreviewAndValidateListeners(
      defaultBodyTextField, defaultBody, defaultBodyPreview);

  function attachHTMLPreviewAndValidateListeners(
      /** @type{MDCTextField}*/ templateTextField,
      /** @type{HTMLInputElement}*/ template,
      /** @type{HTMLElement}*/ preview) {
    templateTextField.useNativeValidation = false;

    template.addEventListener('input', (event) => {
      const previewHtml = HtmlSanitizer.SanitizeHtml(
          event.target.value
              .replaceAll(
                  '${blocksummary}',
                  '<blockquote>BLOCK_SUMMARY_TEXT</blockquote>')
              .replaceAll('${summary}', 'SUMMARY_TEXT')
              .replaceAll('${title}', '<a>TITLE_TEXT</a>')
              .replaceAll('${title-unlinked}', 'TITLE_TEXT')
              .replaceAll('${authors}', '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>')
              .replaceAll('${author}', '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>')
              .replaceAll('${authors-unlinked}', 'AUTHOR_1, AUTHOR_2')
              .replaceAll('${author-unlinked}', 'AUTHOR_1, AUTHOR_2'));

      preview.textContent = previewHtml;
      hljs.highlightElement(preview);

      if (!isValidAo3ValidHtml(event.target.value)) {
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
    const sanitizedDocument =
        DOM_PARSER.parseFromString(sanitized, 'text/html');
    return (
        userDocument.documentElement.innerHTML ===
        sanitizedDocument.documentElement.innerHTML);
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
  workForm.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      workbody: {default: defaultBody.value},
    });
    snackbar.open();
  });
  titleForm.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      title_template: {default: titleTemplate.value},
    });
    snackbar.open();
  });
  summaryForm.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    await browser.storage.sync.set({
      summary_template: {default: summaryTemplate.value},
    });
    snackbar.open();
  });
  notesForm.addEventListener('submit', async (submitEvent) => {
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
