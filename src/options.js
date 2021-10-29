import { setInputValue } from './utils.js';

/** @type {HTMLInputElement} */
const titleTemplate = document.getElementById('title_template');
/** @type {HTMLFormElement} */
const titleForm = document.getElementById('title_form');
/** @type {HTMLInputElement} */
const summaryTemplate = document.getElementById('summary_template');
/** @type {HTMLFormElement} */
const summaryForm = document.getElementById('summary_form');
/** @type {HTMLInputElement} */
const defaultBody = document.getElementById('default_body');
/** @type {HTMLFormElement} */
const workForm = document.getElementById('work_form');
const snackbar = document.querySelector('.mdc-snackbar').MDCSnackbar;
/** @type {HTMLButtonElement} */
const titleResetButton = document.getElementById('title_reset');
/** @type {HTMLButtonElement} */
const summaryResetButton = document.getElementById('summary_reset');

titleResetButton.addEventListener('click', (async () => {
  const { title_template } = await browser.storage.sync.get('title_template');
  setInputValue(titleTemplate, '[Podfic] ${title}');
}));

summaryResetButton.addEventListener('click', (async () => {
  const { summary_template } = await browser.storage.sync.get('summary_template');
  setInputValue(summaryTemplate, '${blocksummary}Podfic of ${title} by ${authors}.');
}));

// Import default body text from storage.
(async () => {
  const { title_template, summary_template, workbody } =
    await browser.storage.sync.get(['title_template', 'summary_template', 'workbody']);
  setInputValue(titleTemplate, title_template['default']);
  setInputValue(defaultBody, workbody['default']);
  setInputValue(summaryTemplate, summary_template['default']);
})();

// When the form is submitted, save the default body text (without overriding
// other options).
workForm.addEventListener('submit', async submitEvent => {
  submitEvent.preventDefault();
  await browser.storage.sync.set({ 'workbody': { 'default': defaultBody.value } });
  snackbar.open();
});
titleForm.addEventListener('submit', async submitEvent => {
  submitEvent.preventDefault();
  await browser.storage.sync.set({ 'title_template': { 'default': titleTemplate.value } });
  snackbar.open();
});
summaryForm.addEventListener('submit', async submitEvent => {
  submitEvent.preventDefault();
  await browser.storage.sync.set({ 'summary_template': { 'default': summaryTemplate.value } });
  snackbar.open();
});

document.querySelector('.version').textContent =
  browser.runtime.getManifest().version;

// Set focus for a11y.
titleTemplate.focus();