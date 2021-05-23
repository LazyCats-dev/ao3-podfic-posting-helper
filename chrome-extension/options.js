import { getOptionsWithDefaults, saveOptionPageOptions } from './option-saver.js';
import { setInputValue } from './utils.js';

/** @type {HTMLInputElement} */
const defaultBody = document.getElementById("default_body");
/** @type {HTMLFormElement} */
const form = document.getElementById("form");
const snackbar = document.querySelector(".mdc-snackbar").MDCSnackbar;

// Import default body text from storage.
getOptionsWithDefaults((options) => {
    setInputValue(defaultBody, options['default_body']);
});

// When the form is submitted, save the default body text (without overriding other options).
form.addEventListener("submit", async submitEvent => {
    submitEvent.preventDefault();
    saveOptionPageOptions({ 'default_body': defaultBody.value });
    snackbar.open();
});

// Set focus for a11y.
defaultBody.focus();