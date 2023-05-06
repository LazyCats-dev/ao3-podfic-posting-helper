import {setCheckboxState, setInputValue, setupStorage} from './utils.js';

// Setup for the navbar used in all views.
const optionsButton = /** @type {HTMLAnchorElement} */ (
  document.getElementById('options_button')
);
optionsButton.href = browser.runtime.getURL('options.html');

/**
 * A list of URL patterns that the popup can operate on.
 * @type {Array<RegExp|string>}
 */
const ALLOWED_URL_PATTERNS = [
  // Standard new work
  'https://archiveofourown.org/works/new',
  // New work added to a collection
  /https:\/\/archiveofourown.org\/collections\/(.*)\/works\/new/,
  // Editing an existing work
  /https:\/\/archiveofourown.org\/works\/[0-9]+\/edit/,
];

(async () => {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  // If no allowed URL matches then we are not on a page we support.
  if (
    !ALLOWED_URL_PATTERNS.some(
      allowedUrlPattern => currentTab.url.match(allowedUrlPattern) !== null
    )
  ) {
    document.querySelector(
      '.page-content'
    ).innerHTML = `This extension can only be used on the AO3 page to create a new work,
        create a new work in a collection, or edit an existing work.
        Please go to a supported URL and click the extension icon again.
        To create a new work go to
        <a
            href="https://archiveofourown.org/works/new"
            target="_blank"
            rel="noopener">
                https://archiveofourown.org/works/new</a>`;
  } else {
    await setupPopup();
  }
})();

async function setupPopup() {
  const urlInput = /** @type {HTMLInputElement} */ (
    document.getElementById('url-input')
  );
  /** @type {HTMLFormElement} */
  const form = document.getElementsByTagName('form')[0];
  const podficLabel = /** @type {HTMLInputElement} */ (
    document.getElementById('podfic_label')
  );
  const podficLengthLabel = /** @type {HTMLInputElement} */ (
    document.getElementById('podfic_length_label')
  );
  const podficLengthValue = /** @type {HTMLInputElement} */ (
    document.getElementById('podfic_length_value')
  );
  const titleFormatValue = /** @type {HTMLInputElement} */ (
    document.getElementById('title_template_value')
  );
  const summaryFormatValue = /** @type {HTMLInputElement} */ (
    document.getElementById('summary_template_value')
  );
  /** @type {mdc.textField.MDCTextField} */
  const urlTextField = document.querySelector('.mdc-text-field').MDCTextField;
  const snackbar = document.querySelector('.mdc-snackbar').MDCSnackbar;
  /** @type {HTMLButtonElement} */
  const submitButton = document.querySelector('#import');
  const titleSectionLink = /** @type {HTMLAnchorElement} */ (
    document.getElementById('title-section-link')
  );
  titleSectionLink.href = browser.runtime.getURL('options.html#title-section');
  const summarySectionLink =
    /** @type {HTMLAnchorElement} */
    (document.getElementById('summary-section-link'));
  summarySectionLink.href = browser.runtime.getURL(
    'options.html#summary-section'
  );
  const notesSectionLink =
    /** @type {HTMLAnchorElement} */
    (document.getElementById('notes-section-link'));
  notesSectionLink.href = browser.runtime.getURL('options.html#notes-section');
  const workSectionLink =
    /** @type {HTMLAnchorElement} */
    (document.getElementById('work-section-link'));
  workSectionLink.href = browser.runtime.getURL('options.html#work-section');
  const optionsLink = /** @type {HTMLAnchorElement} */ (
    document.getElementById('options-link')
  );
  optionsLink.href = browser.runtime.getURL('options.html');

  // Setting this means that we have to update the validity of the text field
  // when native validation shows the field as invalid. This is the only way
  // we can keep validation in sync with our submit only validity checks.
  urlTextField.useNativeValidation = false;

  // Defensively, we add the listeners first, so even if we fail to read some
  // information from storage we should be able to recover on submit.

  urlInput.addEventListener('input', () => {
    // Always clear the custom error when the user changes the value.
    urlTextField.helperTextContent = '';
    // Keep the text field in sync with the input.
    urlTextField.valid = urlInput.validity.valid;
  });

  // When the form is submitted, import metadata from original work.
  form.addEventListener('submit', async submitEvent => {
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
      options: {
        url: urlInput.value.trim(),
        podfic_label: podficLabel.checked,
        podfic_length_label: podficLengthLabel.checked,
        podfic_length_value: podficLengthValue.value,
        title_format: titleFormatValue.value,
        summary_format: summaryFormatValue.value,
      },
    });

    const [tab] = await browser.tabs.query({active: true, currentWindow: true});
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['/resources/browser-polyfill.min.js', '/inject.js'],
    });
  });

  // Used for injected scripts.
  // We can't get a response back from the script because we are using promise
  // based APIs and chrome doesn't support getting a promise back as a result
  // so instead we listen for a message we expect to the send from the script.
  browser.runtime.onMessage.addListener(injectedScriptResult => {
    // Enable submitting the form again
    submitButton.disabled = false;
    if (injectedScriptResult.result === 'error') {
      urlTextField.valid = false;
      urlTextField.helperTextContent = injectedScriptResult.message;
      urlTextField.focus();
    } else {
      snackbar.open();
    }
  });

  await setupStorage();

  // Import pop-up options from storage.
  const {options} = await browser.storage.sync.get('options');

  setInputValue(urlInput, options['url']);
  setCheckboxState(podficLabel, options['podfic_label']);
  setCheckboxState(podficLengthLabel, options['podfic_length_label']);

  /**
   * For some reason a select is really stupid so we have to find the option
   * with the correct text and click it.
   * @param selectElement {HTMLElement}
   * @param optionValue {string}
   */
  function clickSelectOption(selectElement, optionValue) {
    const optionElements = selectElement.querySelectorAll('li');
    const optionMatchingValue = Array.from(optionElements).find(
      option => option.dataset.value === optionValue
    );
    if (optionMatchingValue) {
      optionMatchingValue.click();
    }
  }

  // Podfic length value has special considerations
  const selectElement = document.getElementById('podfic-length-select');
  const selectInputElement = selectElement.querySelector('input');
  setInputValue(selectInputElement, options['podfic_length_value']);
  clickSelectOption(selectElement, options['podfic_length_value']);

  // Now do the same again for the title format
  const titleSelectElement = document.getElementById('title-template-select');
  const titleSelectInputElement = titleSelectElement.querySelector('input');
  setInputValue(titleSelectInputElement, options['title_format']);
  clickSelectOption(titleSelectElement, options['title_format']);

  // And again for the summary format
  const summarySelectElement = document.getElementById(
    'summary-template-select'
  );
  const summarySelectInputElement = summarySelectElement.querySelector('input');
  setInputValue(summarySelectInputElement, options['summary_format']);
  clickSelectOption(summarySelectElement, options['summary_format']);

  // Focus the URL input for a11y.
  urlInput.focus();
}
