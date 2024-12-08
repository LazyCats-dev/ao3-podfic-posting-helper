import {
  FactoryProvider,
  Provider,
  inject,
  provideAppInitializer,
} from '@angular/core';
import {ANALYTICS, Analytics} from './google-analytics';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {MAT_SNACK_BAR_DEFAULT_OPTIONS} from '@angular/material/snack-bar';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

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
  title_format: 'default',
  summary_format: 'default',
};

export function setupGlobalEventLoggingFactory(analytics: Analytics) {
  return () => {
    // Fire a page view event on load
    window.addEventListener('load', () => {
      analytics.firePageViewEvent(document.title, document.location.href);
    });

    // Listen globally for all button events
    document.addEventListener('click', event => {
      if (event.target && 'id' in event.target) {
        analytics.fireEvent('click_button', {id: event.target.id});
      }
    });

    // Listen globally for all input events
    document.addEventListener('change', event => {
      if (event.target && 'id' in event.target) {
        analytics.fireEvent('input_changed', {id: event.target.id});
      }
    });
  };
}

export function provideGlobalEventLogging(): FactoryProvider {
  return provideAppInitializer(() => {
    const initializerFn = setupGlobalEventLoggingFactory(inject(ANALYTICS));
    return initializerFn();
  });
}

export async function setupStorage() {
  const {options, workbody, title_template, summary_template, notes_template} =
    await chrome.storage.sync.get([
      'options',
      'workbody',
      'title_template',
      'summary_template',
      'notes_template',
    ]);

  const optionsToSave = {...DEFAULT_OPTIONS, ...options};

  // Preserve behavior for existing extension users.
  if ('transform_title' in optionsToSave) {
    const transformTitle = optionsToSave['transform_title'];
    if (transformTitle) {
      optionsToSave['title_format'] = 'default';
    } else {
      optionsToSave['title_format'] = 'orig';
    }

    // Do not perpetuate the old options.
    delete optionsToSave['transform_title'];
  }
  if ('transform_summary' in optionsToSave) {
    const transformSumamry = optionsToSave['transform_summary'];
    if (transformSumamry) {
      optionsToSave['summary_format'] = 'default';
    } else {
      optionsToSave['summary_format'] = 'orig';
    }

    // Do not perpetuate the old options.
    delete optionsToSave['transform_summary'];
  }
  if (JSON.stringify(options) !== JSON.stringify(optionsToSave)) {
    await chrome.storage.sync.set({options: optionsToSave});
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

export function provideStorageSetup(): FactoryProvider {
  return provideAppInitializer(() => {
    const initializerFn = (() => setupStorage)();
    return initializerFn();
  });
}

export function provideMatFormFieldDefaultOptions() {
  const options: MatFormFieldDefaultOptions = {
    subscriptSizing: 'dynamic',
    appearance: 'outline',
  };
  return {
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: options,
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
  return provideAppInitializer(() => {
    const initializerFn = setupMatIconRegistry(
      inject(MatIconRegistry),
      inject(DomSanitizer),
    );
    return initializerFn();
  });
}

export function provideMatSnackBarDefaultOptions() {
  return {
    provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
    useValue: {duration: 5000},
  };
}

export function provideAnimationsRespectingMotionPreferences() {
  return provideAnimationsAsync(
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches
      ? 'noop'
      : 'animations',
  );
}
