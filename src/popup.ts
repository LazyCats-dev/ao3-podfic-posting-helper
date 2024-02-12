import './popup.scss';

import mdcAutoInit from '@material/auto-init';
import {MDCCheckbox} from '@material/checkbox';
import {MDCFormField} from '@material/form-field';
import {MDCMenu} from '@material/menu';
import {MDCRipple} from '@material/ripple';
import {MDCSnackbar} from '@material/snackbar';
import {MDCTopAppBar} from '@material/top-app-bar';
import {ANALYTICS} from './google-analytics';
import {
  type PopupFormData,
  setCheckboxState,
  setInputValue,
  setupGlobalEventLogging,
  setupStorage,
} from './utils';
import '@material/web/icon/icon.js';
import '@material/web/button/filled-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/chips/chip-set';
import '@material/web/chips/filter-chip';

import {type MdFilledSelect} from '@material/web/select/filled-select.js';
import {type MdFilledTextField} from '@material/web/textfield/filled-text-field';
import {type MdCheckbox} from '@material/web/checkbox/checkbox.js';
import {type MdChipSet} from '@material/web/chips/chip-set';
import type {MdFilterChip} from '@material/web/chips/filter-chip';

setupGlobalEventLogging();

mdcAutoInit.register('MDCTopAppBar', MDCTopAppBar);
mdcAutoInit.register('MDCSnackbar', MDCSnackbar);

mdcAutoInit();

// Setup for the navbar used in all views.
const optionsButton = document.getElementById(
  'options_button'
) as HTMLAnchorElement;
optionsButton.href = browser.runtime.getURL('options.html');

/**
 * A list of URL patterns that the popup can operate on.
 * @type {Array<RegExp|string>}
 */
const ALLOWED_URL_PATTERNS: Array<RegExp | string> = [
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
  const urlInput = /** @type {HTMLInputElement} */ document.getElementById(
    'url-input'
  ) as MdFilledTextField;
  const form = document.getElementsByTagName('form')[0];
  const podficLabel = document.getElementById('podfic_label') as MdCheckbox;
  const podficLengthLabel = document.getElementById(
    'podfic_length_label'
  ) as MdCheckbox;
  const podficLengthValue = document.getElementById(
    'podfic_length_value'
  ) as MdFilledSelect;
  const titleFormatValue =
    /** @type {HTMLInputElement} */ document.getElementById(
      'title_template_value'
    ) as MdFilledSelect;
  const summaryFormatValue = document.getElementById(
    'summary_template_value'
  ) as MdFilledSelect;
  const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar')!);
  const submitButton = document.querySelector('#import') as HTMLButtonElement;
  const optionsLink = document.getElementById(
    'options-link'
  ) as HTMLAnchorElement;
  optionsLink.href = browser.runtime.getURL('options.html');

  // Defensively, we add the listeners first, so even if we fail to read some
  // information from storage we should be able to recover on submit.

  const audioFormatTagsChipSet = document.querySelector(
    '#audio-format-tags'
  ) as MdChipSet;

  // When the form is submitted, import metadata from original work.
  form.addEventListener('submit', async submitEvent => {
    // Need to prevent the default so that the popup doesn't refresh.
    submitEvent.preventDefault();
    // Clear any existing errors as they are no longer relevant
    urlInput.error = false;
    urlInput.errorText = '';
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
        audioFormatTagOptionIds: getChipSetValues(),
      },
    });

    ANALYTICS.fireEvent('popup_form_submit', {
      podfic_label: String(podficLabel.checked),
      podfic_length_value: podficLengthValue.value,
      title_format: titleFormatValue.value,
      summary_format: summaryFormatValue.value,
      audio_formats: getChipSetValues().join(','),
    });

    const [tab] = await browser.tabs.query({active: true, currentWindow: true});
    let result;
    try {
      const injectedScriptResults = await browser.scripting.executeScript({
        target: {tabId: tab.id!},
        files: ['/resources/browser-polyfill.min.js', '/inject.js'],
      });
      // We only have one target so there is only one result.
      result = injectedScriptResults[0].result;
    } catch (e: unknown) {
      if (e instanceof Error) {
        result = {result: 'error', message: `${e.message}: ${e.stack}`};
      } else {
        result = {result: 'error', message: `{${e}}`};
      }
    }
    submitButton.disabled = false;
    if (result.result === 'error') {
      urlInput.error = true;
      urlInput.errorText = result.message;
      urlInput.focus();
      ANALYTICS.fireErrorEvent(result.message);
    } else {
      snackbar.open();
    }
  });

  await setupStorage();

  // Import pop-up options from storage.
  const data = await browser.storage.sync.get('options');

  const options: PopupFormData = data['options'];

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
        (chip as MdFilterChip).selected = true;
      }
    }
  }

  // Podfic length value has special considerations
  const podficLengthSelect = document.getElementById(
    'podfic_length_value'
  ) as MdFilledSelect;
  podficLengthSelect.value = options['podfic_length_value'];

  const titleFormatSelect = document.getElementById(
    'title_template_value'
  ) as MdFilledSelect;

  titleFormatSelect.value = options['title_format'];

  const summaryFormatSelect = document.getElementById(
    'summary_template_value'
  ) as MdFilledSelect;

  summaryFormatSelect.value = options['summary_format'];

  // Focus the URL input for a11y.
  urlInput.focus();

  function getChipSetValues() {
    return audioFormatTagsChipSet.chips
      .filter(chip => (chip as MdFilterChip).selected)
      .map(chip => chip.id);
  }
}
