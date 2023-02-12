import {setInputValue, setupStorage} from './utils.js';


(async () => {
  await setupStorage();

  // Sets up the HTMlSanitizer with the tags that ao3 allows.
  [
    "a",
    "abbr",
    "acronym",
    "address",
    "audio",
    "b",
    "big",
    "blockquote",
    "br",
    "caption",
    "center",
    "cite",
    "code",
    "col",
    "colgroup",
    "dd",
    "del",
    "dfn",
    "div",
    "dl",
    "dt",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "iframe",
    "img",
    "ins",
    "kbd",
    "li",
    "ol",
    "p",
    "pre",
    "q",
    "s",
    "samp",
    "small",
    "span",
    "strike",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "tt",
    "u",
    "ul",
    "var",
  ].forEach((tag) => {
    HtmlSanitizer.AllowedTags[tag.toLocaleUpperCase("en-US")] = true;
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

  titleResetButton.addEventListener(
      'click', (async () => {
        const {title_template} =
            await browser.storage.sync.get('title_template');
        setInputValue(titleTemplate, '[Podfic] ${title}');
      }));

  summaryResetButton.addEventListener(
      'click', (async () => {
        const {summary_template} =
            await browser.storage.sync.get('summary_template');
        setInputValue(
            summaryTemplate,
            '${blocksummary}Podfic of ${title} by ${authors}.');
      }));

  titleTextField.useNativeValidation = false;

  titleTemplate.addEventListener('input', event => {
    titlePreview.textContent =
        event.target.value.replaceAll('${title}', 'TITLE_TEXT')
            .replaceAll('${authors}', 'AUTHOR_1, AUTHOR_2')
            .replaceAll('${author}', 'AUTHOR_1');
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

  summaryTemplateTextField.useNativeValidation = false;

  summaryTemplate.addEventListener('input', event => {
    const summaryPreviewHtml = HtmlSanitizer.SanitizeHtml(
        event.target.value
            .replaceAll(
                '${blocksummary}',
                '<blockquote>BLOCK_SUMMARY_TEXT</blockquote>')
            .replaceAll('${summary}', 'SUMMARY_TEXT')
            .replaceAll('${title}', '<a>TITLE_TEXT</a>')
            .replaceAll('${authors}', '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>')
            .replaceAll('${author}', '<a>AUTHOR_1</a>'));

    summaryPreview.textContent = summaryPreviewHtml;
    hljs.highlightElement(summaryPreview);

    if (!isValidAo3ValidHtml(event.target.value)) {
      summaryTemplateTextField.helperTextContent =
          'This template appears to contain HTML tags that cannot be used on ' +
          'AO3, they have been removed from the preview';
      summaryTemplateTextField.valid = false;
    } else {
      summaryTemplateTextField.helperTextContent = '';
      summaryTemplateTextField.valid = true;
    }
  });

  defaultBodyTextField.useNativeValidation = false;

  defaultBody.addEventListener('input', event => {
    defaultBodyPreview.textContent =
        HtmlSanitizer.SanitizeHtml(event.target.value);
    hljs.highlightElement(defaultBodyPreview);

    if (!isValidAo3ValidHtml(event.target.value)) {
      defaultBodyTextField.helperTextContent =
          'This template appears to contain HTML tags that cannot be used on ' +
          'AO3, they have been removed from the preview';
      defaultBodyTextField.valid = false;
    } else {
      defaultBodyTextField.helperTextContent = '';
      defaultBodyTextField.valid = true;
    }
  });


  function isValidAo3ValidHtml(/** @type{string} */ html) {
    const sanitized = HtmlSanitizer.SanitizeHtml(html.trim());
    const userDocument = DOM_PARSER.parseFromString(html.trim(), 'text/html');
    const sanitizedDocument =
        DOM_PARSER.parseFromString(sanitized, 'text/html');
    return userDocument.documentElement.innerHTML ===
        sanitizedDocument.documentElement.innerHTML;
  }

  // Import default body text from storage.
  (async () => {
    const {title_template, summary_template, workbody} =
        await browser.storage.sync.get(
            ['title_template', 'summary_template', 'workbody']);
    setInputValue(titleTemplate, title_template['default']);
    setInputValue(defaultBody, workbody['default']);
    setInputValue(summaryTemplate, summary_template['default']);
  })();

  // When the form is submitted, save the default body text (without overriding
  // other options).
  workForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set(
        {'workbody': {'default': defaultBody.value}});
    snackbar.open();
  });
  titleForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set(
        {'title_template': {'default': titleTemplate.value}});
    snackbar.open();
  });
  summaryForm.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    await browser.storage.sync.set(
        {'summary_template': {'default': summaryTemplate.value}});
    snackbar.open();
  });

  document.querySelector('.version').textContent =
      browser.runtime.getManifest().version;

  // Set focus for a11y.
  titleTemplate.focus();
})();