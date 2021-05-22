import { getOptionsWithDefaults, saveOptionPageOptions } from './option-saver.js';
import { setInputValue } from './utils.js';

/** @type {HTMLInputElement} */
const defaultBody = document.getElementById("default_body");
const saveButton = document.getElementById("save");

// Import default body text from storage.
getOptionsWithDefaults((options) => {
    setInputValue(defaultBody, options['default_body']);
});

// When the button is clicked, save the default body text (without overriding other options).
saveButton.addEventListener("click", async () => {
    saveOptionPageOptions({ 'default_body': defaultBody.value });
});

// Set focus for a11y.
defaultBody.focus();