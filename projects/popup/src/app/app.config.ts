import {ApplicationConfig, provideZonelessChangeDetection} from '@angular/core';
import {provideHttpClient} from '@angular/common/http';
import {
  provideGlobalEventLogging,
  provideStorageSetup,
  provideMatFormFieldDefaultOptions,
  provideMatIconRegistry,
  provideMatSnackBarDefaultOptions,
  provideAnimationsRespectingMotionPreferences,
} from 'common';
import {provideInitialFormValuesFromStorage} from '../utils';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsRespectingMotionPreferences(),
    provideHttpClient(),
    provideGlobalEventLogging(),
    provideStorageSetup(),
    provideInitialFormValuesFromStorage(),
    provideMatFormFieldDefaultOptions(),
    provideMatIconRegistry(),
    provideMatSnackBarDefaultOptions(),
    provideZonelessChangeDetection(),
  ],
};
