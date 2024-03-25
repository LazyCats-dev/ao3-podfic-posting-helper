import {ApplicationConfig} from '@angular/core';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideHttpClient} from '@angular/common/http';
import {
  provideGlobalEventLogging,
  provideStorageSetup,
  provideMatFormFieldDefaultOptions,
  provideMatIconRegistry,
  provideMatSnackBarDefaultOptions,
} from 'common';
import {HIGHLIGHT_OPTIONS} from 'ngx-highlightjs';
import {provideInitialFormValuesFromStorage} from './utils';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimationsAsync(),
    provideGlobalEventLogging(),
    provideStorageSetup(),
    provideInitialFormValuesFromStorage(),
    provideMatFormFieldDefaultOptions(),
    provideMatIconRegistry(),
    provideMatSnackBarDefaultOptions(),
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        languages: {
          plaintext: () => import('highlight.js/lib/languages/plaintext'),
          xml: () => import('highlight.js/lib/languages/xml'),
        },
      },
    },
  ],
};
