import type {Mock, MockedObject} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {
  CommentPermissionSetting,
  provideGlobalEventLogging,
  provideMatFormFieldDefaultOptions,
  provideMatIconRegistry,
  provideMatSnackBarDefaultOptions,
  provideStorageSetup,
} from './utils';
import {
  ApplicationInitStatus,
  provideZonelessChangeDetection,
} from '@angular/core';
import {ANALYTICS, Analytics} from './google-analytics';
import {vi, beforeEach, describe, it, expect} from 'vitest';

describe('provideStorageSetup', () => {
  let setSpy: Mock;
  let getSpy: Mock;

  beforeEach(() => {
    const storageSpy = {
      sync: {
        get: vi.fn().mockName('chrome.storage.sync.get'),
        set: vi.fn().mockName('chrome.storage.sync.set'),
      },
    };
    setSpy = storageSpy.sync.set.mockResolvedValue(undefined);
    getSpy = storageSpy.sync.get;
    (chrome.storage as unknown) = storageSpy;
  });

  describe('with no saved values', () => {
    beforeEach(async () => {
      getSpy.mockResolvedValue({
        options: undefined,
        workbody: undefined,
        title_template: undefined,
        summary_template: undefined,
        notes_template: undefined,
        privacy_template: undefined,
      });

      await TestBed.configureTestingModule({
        providers: [
          provideStorageSetup(),
          provideMatFormFieldDefaultOptions(),
          provideMatIconRegistry(),
          provideMatSnackBarDefaultOptions(),
          provideZonelessChangeDetection(),
        ],
      }).compileComponents();
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });

    it('sets default values', () => {
      expect(setSpy).toHaveBeenCalledTimes(6);
      expect(setSpy).toHaveBeenCalledWith({
        options: {
          url: '',
          podfic_label: true,
          podfic_length_label: true,
          podfic_length_value: '0-10 Minutes',
          title_format: 'default',
          summary_format: 'default',
        },
      });
      expect(setSpy).toHaveBeenCalledWith({
        workbody: {
          default: expect.stringContaining('Here are a few building blocks'),
        },
      });
      expect(setSpy).toHaveBeenCalledWith({
        title_template: {
          default: '[Podfic] ${title}',
        },
      });
      expect(setSpy).toHaveBeenCalledWith({
        summary_template: {
          default: '${blocksummary}Podfic of ${title} by ${authors}.',
        },
      });
      expect(setSpy).toHaveBeenCalledWith({
        notes_template: {
          default: '',
          begin: false,
          end: false,
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        privacy_template: {
          onlyShowToRegisteredUsers: false,
          enableCommentModeration: false,
          commentPermissionSetting:
            CommentPermissionSetting.REGISTERED_USERS_ONLY,
        },
      });
    });
  });

  describe('with legacy transform options set to true', () => {
    beforeEach(async () => {
      getSpy.mockResolvedValue({
        options: {transform_title: true, transform_summary: true},
        workbody: undefined,
        title_template: undefined,
        summary_template: undefined,
        notes_template: undefined,
        privacy_template: undefined,
      });

      await TestBed.configureTestingModule({
        providers: [provideStorageSetup(), provideZonelessChangeDetection()],
      }).compileComponents();
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });

    it('sets default values', () => {
      expect(setSpy).toHaveBeenCalledTimes(6);
      expect(setSpy as Mock).toHaveBeenCalledWith({
        options: {
          url: '',
          podfic_label: true,
          podfic_length_label: true,
          podfic_length_value: '0-10 Minutes',
          title_format: 'default',
          summary_format: 'default',
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        workbody: {
          default: expect.stringContaining('Here are a few building blocks'),
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        title_template: {
          default: '[Podfic] ${title}',
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        summary_template: {
          default: '${blocksummary}Podfic of ${title} by ${authors}.',
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        notes_template: {
          default: '',
          begin: false,
          end: false,
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        privacy_template: {
          onlyShowToRegisteredUsers: false,
          enableCommentModeration: false,
          commentPermissionSetting:
            CommentPermissionSetting.REGISTERED_USERS_ONLY,
        },
      });
    });
  });

  describe('with legacy transform options set to false', () => {
    beforeEach(async () => {
      getSpy.mockResolvedValue({
        options: {transform_title: false, transform_summary: false},
        workbody: undefined,
        title_template: undefined,
        summary_template: undefined,
        notes_template: undefined,
        privacy_template: undefined,
      });

      await TestBed.configureTestingModule({
        providers: [provideStorageSetup(), provideZonelessChangeDetection()],
      }).compileComponents();
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });

    it('sets default values', () => {
      expect(setSpy).toHaveBeenCalledTimes(6);
      expect(setSpy as Mock).toHaveBeenCalledWith({
        options: {
          url: '',
          podfic_label: true,
          podfic_length_label: true,
          podfic_length_value: '0-10 Minutes',
          title_format: 'orig',
          summary_format: 'orig',
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        workbody: {
          default: expect.stringContaining('Here are a few building blocks'),
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        title_template: {
          default: '[Podfic] ${title}',
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        summary_template: {
          default: '${blocksummary}Podfic of ${title} by ${authors}.',
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        notes_template: {
          default: '',
          begin: false,
          end: false,
        },
      });
      expect(setSpy as Mock).toHaveBeenCalledWith({
        privacy_template: {
          onlyShowToRegisteredUsers: false,
          enableCommentModeration: false,
          commentPermissionSetting:
            CommentPermissionSetting.REGISTERED_USERS_ONLY,
        },
      });
    });
  });

  describe('with full saved values', () => {
    beforeEach(async () => {
      getSpy.mockResolvedValue({
        options: {
          url: 'foo',
          podfic_label: false,
          podfic_length_label: false,
          podfic_length_value: '0-10 Minutes',
          title_format: 'orig',
          summary_format: 'custom',
        },
        workbody: {default: 'workbody'},
        title_template: {default: 'title_template'},
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
          provideStorageSetup(),
          provideMatFormFieldDefaultOptions(),
          provideMatIconRegistry(),
          provideMatSnackBarDefaultOptions(),
          provideZonelessChangeDetection(),
        ],
      }).compileComponents();
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });

    it('does not set any storage item', () => {
      expect(
        setSpy,
        JSON.stringify(vi.mocked(setSpy).mock.calls),
      ).not.toHaveBeenCalled();
    });
  });
});

describe('provideGlobalEventLogging', () => {
  let analytics: MockedObject<Analytics>;

  beforeEach(async () => {
    analytics = vi.mockObject(Analytics.prototype);
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ANALYTICS,
          useValue: analytics,
        },
        provideGlobalEventLogging(),
        provideMatFormFieldDefaultOptions(),
        provideMatIconRegistry(),
        provideMatSnackBarDefaultOptions(),
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it('sets up a load listener', () => {
    window.dispatchEvent(new Event('load'));

    expect(analytics.firePageViewEvent).toHaveBeenCalledWith(
      document.title,
      document.location.href,
    );
  });

  it('sets up a click listener', () => {
    const button = document.createElement('button');
    button.id = 'foo';
    document.body.appendChild(button);
    button.dispatchEvent(new Event('click', {bubbles: true}));

    expect(analytics.fireEvent).toHaveBeenCalledWith('click_button', {
      id: 'foo',
    });
  });

  it('sets up a change listener', () => {
    const input = document.createElement('input');
    input.id = 'bar';
    document.body.appendChild(input);
    input.dispatchEvent(new Event('change', {bubbles: true}));

    expect(analytics.fireEvent).toHaveBeenCalledWith('input_changed', {
      id: 'bar',
    });
  });
});
