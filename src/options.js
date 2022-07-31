import {setInputValue} from './utils.js';

hljs.highlightAll();

/** @type {HTMLInputElement} */
const titleTemplate = document.getElementById('title_template');
/** @type {HTMLFormElement} */
const titleForm = document.getElementById('title_form');
/** @type {HTMLInputElement} */
const titlePreview = document.getElementById('title_preview');
/** @type {HTMLInputElement} */
const summaryTemplate = document.getElementById('summary_template');
/** @type {HTMLElement} */
const summaryPreview = document.getElementById('summary_preview');
/** @type {HTMLFormElement} */
const summaryForm = document.getElementById('summary_form');
/** @type {HTMLInputElement} */
const defaultBody = document.getElementById('default_body');
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
      const {title_template} = await browser.storage.sync.get('title_template');
      setInputValue(titleTemplate, '[Podfic] ${title}');
    }));

summaryResetButton.addEventListener(
    'click', (async () => {
      const {summary_template} =
          await browser.storage.sync.get('summary_template');
      setInputValue(
          summaryTemplate, '${blocksummary}Podfic of ${title} by ${authors}.');
    }));

titleTemplate.addEventListener('input', event => {
  titlePreview.textContent =
      event.target.value.replaceAll('${title}', 'TITLE_TEXT')
          .replaceAll('${authors}', 'AUTHOR_1, AUTHOR_2')
          .replaceAll('${author}', 'AUTHOR_1');
  hljs.highlightElement(titlePreview);
});

summaryTemplate.addEventListener('input', event => {
  const summaryPreviewHtml =
      event.target.value
          .replaceAll(
              '${blocksummary}', '<blockquote>BLOCK_SUMMARY_TEXT</blockquote>')
          .replaceAll('${summary}', 'SUMMARY_TEXT')
          .replaceAll('${title}', '<a>TITLE_TEXT</a>')
          .replaceAll('${authors}', '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>')
          .replaceAll('${author}', '<a>AUTHOR_1</a>');

  summaryPreview.textContent = summaryPreviewHtml;
  hljs.highlightElement(summaryPreview);
});

defaultBody.addEventListener('input', event => {
  defaultBodyPreview.textContent = event.target.value;
  hljs.highlightElement(defaultBodyPreview);
});


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
  await browser.storage.sync.set({'workbody': {'default': defaultBody.value}});
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