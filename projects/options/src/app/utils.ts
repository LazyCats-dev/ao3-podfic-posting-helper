import {
  FactoryProvider,
  InjectionToken,
  provideAppInitializer,
} from '@angular/core';

const defaultFormValuesFromStorage = {
  titleTemplate: '',
  workTemplate: '',
  summaryTemplate: '',
  notesTemplate: '',
  beginningNotes: false,
  endNotes: false,
};

function resetDefaultFormValuesForTest() {
  defaultFormValuesFromStorage.titleTemplate = '';
  defaultFormValuesFromStorage.workTemplate = '';
  defaultFormValuesFromStorage.summaryTemplate = '';
  defaultFormValuesFromStorage.notesTemplate = '';
  defaultFormValuesFromStorage.beginningNotes = false;
  defaultFormValuesFromStorage.endNotes = false;
}

async function setInitialFormValues() {
  const {title_template, workbody, summary_template, notes_template} =
    await chrome.storage.sync.get([
      'title_template',
      'workbody',
      'summary_template',
      'notes_template',
    ]);

  defaultFormValuesFromStorage.titleTemplate = title_template?.default ?? '';
  defaultFormValuesFromStorage.workTemplate = workbody?.default ?? '';
  defaultFormValuesFromStorage.summaryTemplate =
    summary_template?.default ?? '';
  defaultFormValuesFromStorage.notesTemplate = notes_template?.default ?? '';
  defaultFormValuesFromStorage.beginningNotes = notes_template?.begin ?? false;
  defaultFormValuesFromStorage.endNotes = notes_template?.end ?? false;
}

export function provideInitialFormValuesFromStorage(): FactoryProvider {
  return provideAppInitializer(() => {
    const initializerFn = (() => setInitialFormValues)();
    return initializerFn();
  });
}

export const INITIAL_FORM_VALUES = new InjectionToken<
  Readonly<typeof defaultFormValuesFromStorage>
>('INITIAL_FORM_VALUES', {
  providedIn: 'root',
  factory: () => defaultFormValuesFromStorage,
});

export const TEST_ONLY = {resetDefaultFormValuesForTest};
