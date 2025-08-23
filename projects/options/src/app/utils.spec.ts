import {TestBed} from '@angular/core/testing';

import {
  ApplicationInitStatus,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  INITIAL_FORM_VALUES,
  TEST_ONLY,
  provideInitialFormValuesFromStorage,
} from './utils';
import {CommentPermissionSetting} from 'common';

describe('INITIAL_FORM_VALUES', () => {
  let getSpy: jasmine.Spy<typeof chrome.storage.sync.get>;

  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj<typeof chrome.storage>(
      'chrome.storage',
      ['sync'],
    );
    const syncSpy = jasmine.createSpyObj<typeof chrome.storage.sync>(
      'chrome.storage.sync',
      ['get', 'set'],
    );
    getSpy = syncSpy.get;
    storageSpy.sync = syncSpy;
    chrome.storage = storageSpy;
  });

  afterEach(TEST_ONLY.resetDefaultFormValuesForTest);

  describe('with no initial values in storage', () => {
    beforeEach(async () => {
      (getSpy as jasmine.Spy)
        .withArgs([
          'title_template',
          'workbody',
          'summary_template',
          'notes_template',
          'privacy_template',
        ])
        .and.resolveTo({
          title_template: undefined,
          workbody: undefined,
          summary_template: undefined,
          notes_template: undefined,
        });
      await TestBed.configureTestingModule({
        providers: [
          provideInitialFormValuesFromStorage(),
          provideZonelessChangeDetection(),
        ],
      }).compileComponents();
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });

    it('uses default values', () => {
      expect(TestBed.inject(INITIAL_FORM_VALUES)).toEqual({
        titleTemplate: '',
        workTemplate: '',
        summaryTemplate: '',
        notesTemplate: '',
        beginningNotes: false,
        endNotes: false,
        privacyTemplate: {
          onlyShowToRegisteredUsers: false,
          enableCommentModeration: false,
          commentPermissionSetting:
            CommentPermissionSetting.REGISTER_USERS_ONLY,
        },
      });
    });
  });

  describe('with values populated in storage', () => {
    beforeEach(async () => {
      (getSpy as jasmine.Spy)
        .withArgs([
          'title_template',
          'workbody',
          'summary_template',
          'notes_template',
          'privacy_template',
        ])
        .and.resolveTo({
          title_template: {default: 'title_template'},
          workbody: {default: 'workbody'},
          summary_template: {default: 'summary_template'},
          notes_template: {default: 'notes_template', begin: true, end: true},
          privacy_template: {
            onlyShowToRegisteredUsers: true,
            enableCommentModeration: true,
            commentPermissionSetting: CommentPermissionSetting.NO_ONE,
          },
        });
      await TestBed.configureTestingModule({
        providers: [
          provideInitialFormValuesFromStorage(),
          provideZonelessChangeDetection(),
        ],
      }).compileComponents();
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });

    it('uses storage values', () => {
      expect(TestBed.inject(INITIAL_FORM_VALUES)).toEqual({
        titleTemplate: 'title_template',
        workTemplate: 'workbody',
        summaryTemplate: 'summary_template',
        notesTemplate: 'notes_template',
        beginningNotes: true,
        endNotes: true,
        privacyTemplate: {
          onlyShowToRegisteredUsers: true,
          enableCommentModeration: true,
          commentPermissionSetting: CommentPermissionSetting.NO_ONE,
        },
      });
    });
  });
});
