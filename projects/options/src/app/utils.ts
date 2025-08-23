import {InjectionToken, provideAppInitializer} from '@angular/core';
import {CommentPermissionSetting} from 'common';

const defaultFormValuesFromStorage = {
  titleTemplate: '',
  workTemplate: '',
  summaryTemplate: '',
  notesTemplate: '',
  beginningNotes: false,
  endNotes: false,
  privacyTemplate: {
    onlyShowToRegisteredUsers: false,
    enableCommentModeration: false,
    commentPermissionSetting: CommentPermissionSetting.REGISTER_USERS_ONLY,
  },
};

function resetDefaultFormValuesForTest() {
  defaultFormValuesFromStorage.titleTemplate = '';
  defaultFormValuesFromStorage.workTemplate = '';
  defaultFormValuesFromStorage.summaryTemplate = '';
  defaultFormValuesFromStorage.notesTemplate = '';
  defaultFormValuesFromStorage.beginningNotes = false;
  defaultFormValuesFromStorage.endNotes = false;
  defaultFormValuesFromStorage.privacyTemplate = {
    onlyShowToRegisteredUsers: false,
    enableCommentModeration: false,
    commentPermissionSetting: CommentPermissionSetting.REGISTER_USERS_ONLY,
  };
}

async function setInitialFormValues() {
  const {
    title_template,
    workbody,
    summary_template,
    notes_template,
    privacy_template,
  } = await chrome.storage.sync.get([
    'title_template',
    'workbody',
    'summary_template',
    'notes_template',
    'privacy_template',
  ]);

  defaultFormValuesFromStorage.titleTemplate = title_template?.default ?? '';
  defaultFormValuesFromStorage.workTemplate = workbody?.default ?? '';
  defaultFormValuesFromStorage.summaryTemplate =
    summary_template?.default ?? '';
  defaultFormValuesFromStorage.notesTemplate = notes_template?.default ?? '';
  defaultFormValuesFromStorage.beginningNotes = notes_template?.begin ?? false;
  defaultFormValuesFromStorage.endNotes = notes_template?.end ?? false;
  defaultFormValuesFromStorage.privacyTemplate = {
    onlyShowToRegisteredUsers:
      privacy_template?.onlyShowToRegisteredUsers ?? false,
    enableCommentModeration: privacy_template?.enableCommentModeration ?? false,
    commentPermissionSetting:
      privacy_template?.commentPermissionSetting ??
      CommentPermissionSetting.REGISTER_USERS_ONLY,
  };
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
