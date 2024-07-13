import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {
  provideGlobalEventLogging,
  provideStorageSetup,
  provideMatFormFieldDefaultOptions,
  provideMatIconRegistry,
  provideMatSnackBarDefaultOptions,
  provideAnimationsRespectingMotionPreferences,
} from 'common';
import {HIGHLIGHT_OPTIONS} from 'ngx-highlightjs';
import {provideInitialFormValuesFromStorage} from './utils';
import {MAT_CARD_CONFIG, MatCardConfig} from '@angular/material/card';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimationsRespectingMotionPreferences(),
    provideGlobalEventLogging(),
    provideStorageSetup(),
    provideInitialFormValuesFromStorage(),
    provideMatFormFieldDefaultOptions(),
    provideMatIconRegistry(),
    provideMatSnackBarDefaultOptions(),
    provideExperimentalZonelessChangeDetection(),
    {
      provide: MAT_CARD_CONFIG,
      useValue: {appearance: 'outlined'} as MatCardConfig,
    },
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
