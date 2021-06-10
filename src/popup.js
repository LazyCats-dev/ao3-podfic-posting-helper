import {setCheckboxState, setInputValue} from './utils.js';

/** @type {HTMLButtonElement} */
const optionsButton = document.getElementById('options_button');

optionsButton.addEventListener('click', () => {
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    window.open(browser.runtime.getURL('options.html'));
  }
});

(async () => {
  const [currentTab] =
      await browser.tabs.query({active: true, currentWindow: true});
  if (currentTab.url !== 'https://archiveofourown.org/works/new' &&
      !currentTab.url.match(/https:\/\/archiveofourown.org\/collections\/(.*)\/works\/new/)) {
    document.querySelector('.page-content').innerHTML =
        `To use this extension go to
        <a
            href="https://archiveofourown.org/works/new"
            target="_blank"
            rel="noopener">
                https://archiveofourown.org/works/new</a>
        and then click on the extension icon again`;
  } else {
    await setupPopup();
  }
})();

async function setupPopup() {
  /** @type {HTMLInputElement} */
  const urlInput = document.getElementById('url-input');
  /** @type {HTMLFormElement} */
  const form = document.getElementById('form');
  /** @type {HTMLInputElement} */
  const podficLabel = document.getElementById('podfic_label');
  /** @type {HTMLInputElement} */
  const podficLengthLabel = document.getElementById('podfic_length_label');
  /** @type {HTMLInputElement} */
  const podficLengthValue = document.getElementById('podfic_length_value');
  /** @type {HTMLInputElement} */
  const transformSummary = document.getElementById('transform_summary');
  /** @type {HTMLInputElement} */
  const transformTitle = document.getElementById('transform_title');
  const urlTextField = document.querySelector('.url-text-field').MDCTextField;
  const snackbar = document.querySelector('.mdc-snackbar').MDCSnackbar;
  /** @type {HTMLButtonElement} */
  const submitButton = document.querySelector('#import');
  // Import pop-up options from storage.

  const {options} = await browser.storage.sync.get('options');

  setInputValue(urlInput, options['url']);
  setCheckboxState(podficLabel, options['podfic_label']);
  setCheckboxState(podficLengthLabel, options['podfic_length_label']);
  setCheckboxState(transformSummary, options['transform_summary']);
  setCheckboxState(transformTitle, options['transform_title']);

  // Podfic length value has special considerations
  const selectElement = document.getElementById('podfic-length-select');
  const selectInputElement = selectElement.querySelector('input');
  setInputValue(selectInputElement, options['podfic_length_value']);
  // For some reason a select is really stupid so we have to find the option
  // with the correct text and click it.
  const optionElements = selectElement.querySelectorAll('.mdc-list-item');
  const optionMatchingValue = Array.from(optionElements)
                                  .find(
                                      option => option.dataset.value ===
                                          options['podfic_length_value']);
  if (optionMatchingValue) {
    optionMatchingValue.click();
  }

  // Used for injected scripts.
  // We can't get a response back from the script because we are using promise
  // based APIs and chrome doesn't support getting a promise back as a result
  // so instead we listen for a message we expect to the send from the script.
  browser.runtime.onMessage.addListener(injectedScriptResult => {
    // Enable submitting the form again
    submitButton.disabled = false;
    if (injectedScriptResult.result === 'error') {
      urlTextField.valid = false;
      urlTextField.focus();
      urlTextField.helperTextContent = injectedScriptResult.message;
    } else {
      snackbar.open();
    }
  });

  // When the form is submitted, import metadata from original work.
  form.addEventListener('submit', async (submitEvent) => {
    // Need to prevent the default so that the popup doesn't refresh.
    submitEvent.preventDefault();
    // Clear any existing errors as they are no longer relevant
    urlTextField.valid = true;
    urlTextField.helperTextContent = '';
    // Disable submitting the form until we get a result back
    submitButton.disabled = true;

    // Save the options, because we won't be able to access them in the injected
    // script.
    await browser.storage.sync.set({
      'options': {
        'url': urlInput.value,
        'podfic_label': podficLabel.checked,
        'podfic_length_label': podficLengthLabel.checked,
        'podfic_length_value': podficLengthValue.value,
        'transform_summary': transformSummary.checked,
        'transform_title': transformTitle.checked
      }
    });

    const [tab] = await browser.tabs.query({active: true, currentWindow: true});
    await browser.tabs.executeScript(
        tab.id, {file: '/resources/browser-polyfill.min.js'});
    await browser.tabs.executeScript(tab.id, {file: '/inject.js'});
  });

  // Focus the URL input for a11y.
  urlInput.focus();
}
