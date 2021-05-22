import { getOptionsWithDefaults, saveOptionPageOptions } from './option-saver.js';

/** @type {HTMLInputElement} */
const defaultBody = document.getElementById("default_body");
const saveButton = document.getElementById("save");

// Import default body text from storage.
getOptionsWithDefaults((options) => {
    defaultBody.value = options['default_body'];
});

// When the button is clicked, save the default body text (without overriding other options).
saveButton.addEventListener("click", async () => {
    saveOptionPageOptions({ 'default_body': defaultBody.value });
});