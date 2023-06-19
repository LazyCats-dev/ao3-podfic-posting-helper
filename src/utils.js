/**
 * Object representing the data collected by the form.
 * @typedef {Object} PopupFormData
 * @property {string} url
 * @property {boolean} podfic_label
 * @property {boolean} podfic_length_label
 * @property {string} podfic_length_value
 * @property {string} title_format
 * @property {string} summary_format
 * @property {(readonly string[])=} audioFormatTagOptionIds
 */

/**
 * Object representing the value of a template from the options page.
 * @typedef {Object} TemplateData
 * @property {string} default
 */

/**
 * Sets the value of the input, triggering all necessary events.
 * @param {HTMLInputElement|HTMLTextAreaElement} inputElement
 * @param {string} value
 */
export function setInputValue(inputElement, value) {
  const event = new InputEvent('input', {bubbles: true, data: value});
  inputElement.value = value;
  // Replicates the value changing.
  inputElement.dispatchEvent(event);
  // Replicates the user leaving focus of the input element.
  inputElement.dispatchEvent(new Event('change'));
}

/**
 * Sets the state of a checkbox, triggering all necessary events.
 * @param checkboxElement {HTMLInputElement}
 * @param isChecked {boolean}
 */
export function setCheckboxState(checkboxElement, isChecked) {
  checkboxElement.checked = isChecked;
  // Replicates the user leaving focus of the input element.
  checkboxElement.dispatchEvent(new Event('change'));
}

const DEFAULT_WORKBODY =
  'Here are a few building blocks that that show how you can include an ' +
  "image, audio, or a link to your podfic in your post. They're all " +
  'optional, and you can change these defaults to match your own default ' +
  'posting template by going to the option page for this extension. Happy ' +
  'posting!\n\n' +
  '<img src="IMAGE_URL" width="500px" alt="Cover art. COVER_DESCRIPTION." />\n\n' +
  '<audio src="PODFIC_URL_ENDING_IN_MP3" controls="controls" ' +
  'crossorigin="anonymous" preload="metadata"> </audio>\n\n' +
  '<a href="PODFIC_URL" rel="nofollow">Download the podfic here (FILE_SIZE ' +
  'MB/FILE_MINUTES minutes)</a>.';

const DEFAULT_OPTIONS = {
  url: '',
  podfic_label: true,
  podfic_length_label: true,
  podfic_length_value: '0-10 Minutes',
  transform_summary: true,
  transform_title: true,
  title_format: 'default',
  summary_format: 'default',
};

export async function setupStorage() {
  const {options, workbody, title_template, summary_template, notes_template} =
    await browser.storage.sync.get([
      'options',
      'workbody',
      'title_template',
      'summary_template',
      'notes_template',
    ]);

  if (options === undefined) {
    await browser.storage.sync.set({options: DEFAULT_OPTIONS});
  } else if (
    options['title_format'] === undefined ||
    options['summary_format'] === undefined
  ) {
    // Preserve behavior for existing extension users.
    if (options['title_format'] === undefined) {
      if (options['transform_title']) {
        options['title_format'] = 'default';
      } else {
        options['title_format'] = 'orig';
      }
    }
    if (options['summary_format'] === undefined) {
      if (options['transform_summary']) {
        options['summary_format'] = 'default';
      } else {
        options['summary_format'] = 'orig';
      }
    }
    await browser.storage.sync.set({options});
  }
  if (workbody === undefined) {
    await browser.storage.sync.set({
      workbody: {
        default: DEFAULT_WORKBODY,
      },
    });
  }
  if (title_template === undefined) {
    await browser.storage.sync.set({
      title_template: {default: '[Podfic] ${title}'},
    });
  }
  if (summary_template === undefined) {
    await browser.storage.sync.set({
      summary_template: {
        default: '${blocksummary}Podfic of ${title} by ${authors}.',
      },
    });
  }
  if (notes_template === undefined) {
    await browser.storage.sync.set({
      notes_template: {
        default: '',
        begin: false,
        end: false,
      },
    });
  }
}
