import {InjectionToken, provideAppInitializer} from '@angular/core';

const defaultFormValuesFromStorage = {
  url: '',
  podficLabel: false,
  podficLengthLabel: false,
  podficLengthValue: '',
  titleFormat: '',
  summaryFormat: '',
  audioFormatTagOptionIds: [] as readonly string[],
};

function resetDefaultFormValuesForTest() {
  defaultFormValuesFromStorage.url = '';
  defaultFormValuesFromStorage.podficLabel = false;
  defaultFormValuesFromStorage.podficLengthLabel = false;
  defaultFormValuesFromStorage.podficLengthValue = '';
  defaultFormValuesFromStorage.titleFormat = '';
  defaultFormValuesFromStorage.summaryFormat = '';
  defaultFormValuesFromStorage.audioFormatTagOptionIds =
    [] as readonly string[];
}

async function setInitialFormValues() {
  const {options} = await chrome.storage.sync.get('options');
  if (!options) {
    return;
  }

  const {
    url,
    podfic_label,
    podfic_length_label,
    podfic_length_value,
    title_format,
    summary_format,
    audioFormatTagOptionIds,
  } = options;

  defaultFormValuesFromStorage.url = url ?? '';
  defaultFormValuesFromStorage.podficLabel = podfic_label ?? false;
  defaultFormValuesFromStorage.podficLengthLabel = podfic_length_label ?? false;
  defaultFormValuesFromStorage.podficLengthValue = podfic_length_value ?? '';
  defaultFormValuesFromStorage.titleFormat = title_format ?? '';
  defaultFormValuesFromStorage.summaryFormat = summary_format ?? '';
  defaultFormValuesFromStorage.audioFormatTagOptionIds =
    audioFormatTagOptionIds ?? ([] as readonly string[]);
}

export function provideInitialFormValuesFromStorage() {
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
