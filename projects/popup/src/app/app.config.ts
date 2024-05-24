import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideHttpClient} from '@angular/common/http';
import {
  provideGlobalEventLogging,
  provideStorageSetup,
  provideMatFormFieldDefaultOptions,
  provideMatIconRegistry,
  provideMatSnackBarDefaultOptions,
} from 'common';
import {provideInitialFormValuesFromStorage} from '../utils';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    provideGlobalEventLogging(),
    provideStorageSetup(),
    provideInitialFormValuesFromStorage(),
    provideMatFormFieldDefaultOptions(),
    provideMatIconRegistry(),
    provideMatSnackBarDefaultOptions(),
    provideExperimentalZonelessChangeDetection(),
  ],
};
