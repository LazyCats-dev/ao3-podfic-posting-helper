import {TestBed} from '@angular/core/testing';

import {
  ApplicationInitStatus,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  INITIAL_FORM_VALUES,
  provideInitialFormValuesFromStorage,
  TEST_ONLY,
} from './utils';

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
      (getSpy as jasmine.Spy).withArgs('options').and.resolveTo({});
      await TestBed.configureTestingModule({
        providers: [
          provideInitialFormValuesFromStorage(),
          provideZonelessChangeDetection(),
        ],
      }).compileComponents();
      const applicationInitStatus = TestBed.inject(ApplicationInitStatus);
      await applicationInitStatus.donePromise;
    });

    it('uses default values', () => {
      expect(TestBed.inject(INITIAL_FORM_VALUES)).toEqual({
        url: '',
        podficLabel: false,
        podficLengthLabel: false,
        podficLengthValue: '',
        titleFormat: '',
        summaryFormat: '',
        audioFormatTagOptionIds: [] as readonly string[],
      });
    });
  });

  describe('with empty values populated in storage', () => {
    beforeEach(async () => {
      (getSpy as jasmine.Spy).withArgs('options').and.resolveTo({
        options: {},
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
        url: '',
        podficLabel: false,
        podficLengthLabel: false,
        podficLengthValue: '',
        titleFormat: '',
        summaryFormat: '',
        audioFormatTagOptionIds: [] as readonly string[],
      });
    });
  });

  describe('with values populated in storage', () => {
    beforeEach(async () => {
      (getSpy as jasmine.Spy).withArgs('options').and.resolveTo({
        options: {
          url: 'https://acrhiveofourown.org/works/12345678',
          podfic_label: true,
          podfic_length_label: true,
          podfic_length_value: 'Over 20 Hours',
          title_format: 'custom',
          summary_format: 'orig',
          audioFormatTagOptionIds: [
            'audio-format-tag-MP3',
            'audio-format-tag-Streaming',
          ],
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
        url: 'https://acrhiveofourown.org/works/12345678',
        podficLabel: true,
        podficLengthLabel: true,
        podficLengthValue: 'Over 20 Hours',
        titleFormat: 'custom',
        summaryFormat: 'orig',
        audioFormatTagOptionIds: [
          'audio-format-tag-MP3',
          'audio-format-tag-Streaming',
        ],
      });
    });
  });
});
