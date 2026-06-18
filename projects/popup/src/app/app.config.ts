import {ApplicationConfig, provideZonelessChangeDetection} from '@angular/core';
import {provideHttpClient, withXhr} from '@angular/common/http';
import {
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
    provideHttpClient(withXhr()),
    provideStorageSetup(),
    provideInitialFormValuesFromStorage(),
    provideMatFormFieldDefaultOptions(),
    provideMatIconRegistry(),
    provideMatSnackBarDefaultOptions(),
    provideZonelessChangeDetection(),
  ],
};
