import {APP_INITIALIZER, FactoryProvider, Provider} from '@angular/core';
import {ANALYTICS} from './google-analytics';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {MAT_SNACK_BAR_DEFAULT_OPTIONS} from '@angular/material/snack-bar';

/**
 * Object representing the data collected by the form.
 */
export interface PopupFormData {
  readonly url: string;
  readonly podfic_label: boolean;
  readonly podfic_length_label: boolean;
  readonly podfic_length_value: string;
  readonly title_format: string;
  readonly summary_format: string;
  readonly audioFormatTagOptionIds: readonly string[];
}

/**
 * Object representing the value of a template from the options page.
 */
export interface TemplateData {
  readonly default: string;
}

/**
 * Object representing the value of a notes template from the options page.
 */
export interface NotesTemplateData {
  readonly default: string;
  readonly begin: boolean;
  readonly end: boolean;
}

/**
 * Sets the value of the input, triggering all necessary events.
 */
export function setInputValue(
  inputElement: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const event = new InputEvent('input', {bubbles: true, data: value});
  inputElement.value = value;
  // Replicates the value changing.
  inputElement.dispatchEvent(event);
  // Replicates the user leaving focus of the input element.
  inputElement.dispatchEvent(new Event('change'));
}

/**
 * Sets the state of a checkbox, triggering all necessary events.
 */
export function setCheckboxState(
  checkboxElement: HTMLInputElement,
  isChecked: boolean,
) {
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
    await chrome.storage.sync.get([
      'options',
      'workbody',
      'title_template',
      'summary_template',
      'notes_template',
    ]);

  if (options === undefined) {
    await chrome.storage.sync.set({options: DEFAULT_OPTIONS});
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
    await chrome.storage.sync.set({options});
  }
  if (workbody === undefined) {
    await chrome.storage.sync.set({
      workbody: {
        default: DEFAULT_WORKBODY,
      },
    });
  }
  if (title_template === undefined) {
    await chrome.storage.sync.set({
      title_template: {default: '[Podfic] ${title}'},
    });
  }
  if (summary_template === undefined) {
    await chrome.storage.sync.set({
      summary_template: {
        default: '${blocksummary}Podfic of ${title} by ${authors}.',
      },
    });
  }
  if (notes_template === undefined) {
    await chrome.storage.sync.set({
      notes_template: {
        default: '',
        begin: false,
        end: false,
      },
    });
  }
}

export function setupGlobalEventLogging() {
  // Fire a page view event on load
  window.addEventListener('load', () => {
    ANALYTICS.firePageViewEvent(document.title, document.location.href);
  });

  // Listen globally for all button events
  document.addEventListener('click', event => {
    if (event.target && 'id' in event.target) {
      ANALYTICS.fireEvent('click_button', {id: event.target.id});
    }
  });

  // Listen globally for all input events
  document.addEventListener('change', event => {
    if (event.target && 'id' in event.target) {
      ANALYTICS.fireEvent('input_changed', {id: event.target.id});
    }
  });
}

export function provideGlobalEventLogging(): FactoryProvider {
  return {
    provide: APP_INITIALIZER,
    useFactory: () => setupGlobalEventLogging,
    multi: true,
  };
}

export function provideStorageSetup(): FactoryProvider {
  return {
    provide: APP_INITIALIZER,
    useFactory: () => setupStorage,
    multi: true,
  };
}

export function provideMatFormFieldDefaultOptions() {
  return {
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: {subscriptSizing: 'dynamic'},
  };
}

function setupMatIconRegistry(
  matIconRegistry: MatIconRegistry,
  sanitizer: DomSanitizer,
) {
  return () => {
    ('');
    matIconRegistry.addSvgIcon(
      'logo',
      sanitizer.bypassSecurityTrustResourceUrl('/common/assets/logo.svg'),
    );
  };
}

export function provideMatIconRegistry(): Provider {
  return {
    provide: APP_INITIALIZER,
    useFactory: setupMatIconRegistry,
    deps: [MatIconRegistry, DomSanitizer],
    multi: true,
  };
}

export function provideMatSnackBarDefaultOptions() {
  return {
    provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
    useValue: {duration: 5000},
  };
}
