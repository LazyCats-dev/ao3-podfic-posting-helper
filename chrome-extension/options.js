import {setInputValue} from './utils.js';

/** @type {HTMLInputElement} */
const defaultBody = document.getElementById('default_body');
/** @type {HTMLFormElement} */
const form = document.getElementById('form');
const snackbar = document.querySelector('.mdc-snackbar').MDCSnackbar;

// Import default body text from storage.
chrome.storage.sync.get('workbody', async ({workbody}) => {
  setInputValue(defaultBody, workbody['default']);
});

// When the form is submitted, save the default body text (without overriding
// other options).
form.addEventListener('submit', async submitEvent => {
  submitEvent.preventDefault();
  chrome.storage.sync.set({'workbody': {'default': defaultBody.value}});
  snackbar.open();
});

document.querySelector('.version').textContent =
    chrome.runtime.getManifest().version

// Set focus for a11y.
defaultBody.focus();