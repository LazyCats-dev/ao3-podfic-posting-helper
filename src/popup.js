import {
  setCheckboxState,
  setInputValue,
  setupStorage,
  setupGlobalEventLogging,
} from './utils.js';
import {ANALYTICS} from './google-analytics.js';

setupGlobalEventLogging();

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
  if (!currentTab.url) {
    throw new Error('current tab does not have a URL');
  }
  const currentTabUrl = currentTab.url;
  // If no allowed URL matches then we are not on a page we support.
  if (
    !ALLOWED_URL_PATTERNS.some(
      allowedUrlPattern => currentTabUrl.match(allowedUrlPattern) !== null
    )
  ) {
    const pageContentElement = document.querySelector('.page-content');
    if (!pageContentElement) {
      throw new Error('.page-content not found');
    }
    pageContentElement.innerHTML = `This extension can only be used on the AO3
        page to create a new work, create a new work in a collection, or edit an
        existing work.
        Please go to a supported URL and click the extension icon again.
        To create a new work go to
        <a
            href="https://archiveofourown.org/works/new"
            target="_blank"
            rel="noopener"
            id="ao3-new-work">
                https://archiveofourown.org/works/new</a>`;
    ANALYTICS.firePageViewEvent('Not on new work URL page');
  } else {
    ANALYTICS.firePageViewEvent('Form');
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
  /** @type {MDCTextField} */
  const urlTextField = document.querySelector('.mdc-text-field').MDCTextField;
  const snackbar = document.querySelector('.mdc-snackbar').MDCSnackbar;
  /** @type {HTMLButtonElement} */
  const submitButton = document.querySelector('#import');
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

  /** @type {mdc.chips.MDCChipSet} */
  const audioFormatTagsChipSet =
    document.querySelector('#audio-format-tags').MDCChipSet;

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
        audioFormatTagOptionIds: audioFormatTagsChipSet.selectedChipIds,
      },
    });

    ANALYTICS.fireEvent('popup_form_submit', {
      podfic_label: String(podficLabel.checked),
      podfic_length_value: podficLengthValue.value,
      title_format: titleFormatValue.value,
      summary_format: summaryFormatValue.value,
      audio_formats: audioFormatTagsChipSet.selectedChipIds.join(','),
    });

    const [tab] = await browser.tabs.query({active: true, currentWindow: true});
    let result;
    try {
      const injectedScriptResults = await browser.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['/resources/browser-polyfill.min.js', '/inject.js'],
      });
      // We only have one target so there is only one result.
      result = injectedScriptResults[0].result;
    } catch (e) {
      result = {result: 'error', message: `${e.message}: ${e.stack}`};
    }
    submitButton.disabled = false;
    if (result.result === 'error') {
      urlTextField.valid = false;
      urlTextField.helperTextContent = result.message;
      urlTextField.focus();
      ANALYTICS.fireErrorEvent(result.message);
    } else {
      snackbar.open();
    }
  });

  await setupStorage();

  // Import pop-up options from storage.
  const data = await browser.storage.sync.get('options');

  /** @type {import("./utils.js").PopupFormData} */
  const options = data['options'];

  setInputValue(urlInput, options['url']);
  setCheckboxState(podficLabel, options['podfic_label']);
  setCheckboxState(podficLengthLabel, options['podfic_length_label']);
  setAudioFormatChips();

  function setAudioFormatChips() {
    for (const tagOptionId of options.audioFormatTagOptionIds || []) {
      const chip = audioFormatTagsChipSet.chips.find(
        chip => chip.id === tagOptionId
      );
      if (chip) {
        chip.selected = true;
      }
    }
  }

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
  if (!selectElement) {
    throw new Error('selectElement missing');
  }
  const selectInputElement = selectElement.querySelector('input');
  if (!selectInputElement) {
    throw new Error('selectInputElement missing');
  }
  setInputValue(selectInputElement, options['podfic_length_value']);
  clickSelectOption(selectElement, options['podfic_length_value']);

  // Now do the same again for the title format
  const titleSelectElement = document.getElementById('title-template-select');
  if (!titleSelectElement) {
    throw new Error('titleSelectElement missing');
  }
  const titleSelectInputElement = titleSelectElement?.querySelector('input');
  if (!titleSelectInputElement) {
    throw new Error('titleSelectInputElement missing');
  }
  setInputValue(titleSelectInputElement, options['title_format']);
  clickSelectOption(titleSelectElement, options['title_format']);

  // And again for the summary format
  const summarySelectElement = document.getElementById(
    'summary-template-select'
  );
  if (!summarySelectElement) {
    throw new Error('summarySelectElement missing');
  }
  const summarySelectInputElement = summarySelectElement.querySelector('input');
  if (!summarySelectInputElement) {
    throw new Error('summarySelectInputElement missing');
  }
  setInputValue(summarySelectInputElement, options['summary_format']);
  clickSelectOption(summarySelectElement, options['summary_format']);

  // Focus the URL input for a11y.
  urlInput.focus();
}
