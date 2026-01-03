import type {Mock, MockedObject} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {Subject, firstValueFrom} from 'rxjs';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {HarnessLoader, manualChangeDetection} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatToolbarHarness} from '@angular/material/toolbar/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatProgressSpinnerHarness} from '@angular/material/progress-spinner/testing';
import {
  ANALYTICS,
  Analytics,
  CommentPermissionSetting,
  provideMatFormFieldDefaultOptions,
} from 'common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatInputHarness} from '@angular/material/input/testing';
import {MatFormFieldHarness} from '@angular/material/form-field/testing';
import {INITIAL_FORM_VALUES} from '../utils';
import {MatCheckboxHarness} from '@angular/material/checkbox/testing';
import {MatSelectHarness} from '@angular/material/select/testing';
import './inject/index';
import './inject/inject';
import {MatSnackBarHarness} from '@angular/material/snack-bar/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {beforeEach, describe, it, expect, vi} from 'vitest';
import axe from 'axe-core';

describe('AppComponent', () => {
  let tabsQuerySubject: Subject<chrome.tabs.Tab[]>;
  let analytics: MockedObject<Analytics>;

  beforeEach(async () => {
    tabsQuerySubject = new Subject<chrome.tabs.Tab[]>();

    const runtimeSpy = {
      getURL: vi.fn().mockName('chrome.runtime.getURL'),
    };
    runtimeSpy.getURL.mockReturnValue('options-url');

    const tabsSpy = {
      query: vi.fn().mockName('chrome.tabs.query'),
    };
    tabsSpy.query.mockReturnValue(firstValueFrom(tabsQuerySubject));

    (chrome.runtime as unknown) = runtimeSpy;
    (chrome.tabs as unknown) = tabsSpy;
    const syncSpy = {
      get: vi.fn().mockName('chrome.storage.sync.get'),
      set: vi.fn().mockName('chrome.storage.sync.set'),
    };
    (syncSpy.get as Mock).mockResolvedValue({});
    chrome.storage = {sync: syncSpy} as unknown as typeof chrome.storage;
    analytics = vi.mockObject(Analytics.prototype);
  });

  describe('with saved values', () => {
    let loader: HarnessLoader;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AppComponent, MatIconTestingModule, NoopAnimationsModule],
        providers: [
          {provide: ANALYTICS, useValue: analytics},
          {
            provide: INITIAL_FORM_VALUES,
            useValue: {
              url: 'https://archiveofourown.org/works/12345',
              podficLabel: true,
              podficLengthLabel: true,
              podficLengthValue: '7-10 Hours',
              titleFormat: 'custom',
              summaryFormat: 'orig',
              audioFormatTagOptionIds: [
                'audio-format-tag-MP3',
                'audio-format-tag-Streaming',
                'audio-format-tag-Download',
              ],
              privacyTemplate: {
                onlyShowToRegisteredUsers: true,
                enableCommentModeration: true,
                commentPermissionSetting: CommentPermissionSetting.NO_ONE,
              },
            },
          },
          provideZonelessChangeDetection(),
          provideMatFormFieldDefaultOptions(),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AppComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      tabsQuerySubject.next([
        {
          url: 'https://archiveofourown.org/works/new',
          id: 666,
        } as chrome.tabs.Tab,
      ]);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('passes a11y tests', async () => {
      const axeResults = await axe.run(fixture.nativeElement);
      expect(axeResults.violations).toEqual([]);
    });

    it('enables the podfic length select because a length is being added', async () => {
      const podficLengthFormField = await loader.getHarness(
        MatFormFieldHarness.with({floatingLabelText: 'Podfic Length'}),
      );

      expect(await podficLengthFormField.isDisabled()).toBe(false);
    });

    it('sets the input values to the intial values', async () => {
      const podficTagCheckbox = await loader.getHarness(
        MatCheckboxHarness.with({label: 'Add the tag "Podfic"'}),
      );
      expect(await podficTagCheckbox.isChecked()).toBe(true);

      const podficLengthCheckbox = await loader.getHarness(
        MatCheckboxHarness.with({label: 'Add a "Podfic Length" tag'}),
      );
      expect(await podficLengthCheckbox.isChecked()).toBe(true);

      const podficLengthFormField = await loader.getHarness(
        MatFormFieldHarness.with({floatingLabelText: 'Podfic Length'}),
      );
      const podficLengthSelect =
        (await podficLengthFormField.getControl(MatSelectHarness))!;

      expect(await podficLengthSelect.getValueText()).toBe('7-10 Hours');

      const titleFormatFormField = await loader.getHarness(
        MatFormFieldHarness.with({floatingLabelText: 'Title format'}),
      );
      const titleFormatSelect =
        (await titleFormatFormField.getControl(MatSelectHarness))!;

      expect(await titleFormatSelect.getValueText()).toBe('Custom');

      const summaryFormatFormField = await loader.getHarness(
        MatFormFieldHarness.with({floatingLabelText: 'Summary format'}),
      );
      const summaryFormatSelect =
        (await summaryFormatFormField.getControl(MatSelectHarness))!;

      expect(await summaryFormatSelect.getValueText()).toBe('Original summary');

      const audioFormatTagsFormField = await loader.getHarness(
        MatFormFieldHarness.with({floatingLabelText: '"Audio Format" tags'}),
      );
      const audioFormatTagsSelect =
        (await audioFormatTagsFormField.getControl(MatSelectHarness))!;

      expect(await audioFormatTagsSelect.getValueText()).toBe(
        'MP3, Streaming, Download',
      );
    });
  });

  describe('with no saved values', () => {
    let loader: HarnessLoader;
    let rootLoader: HarnessLoader;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AppComponent, MatIconTestingModule, NoopAnimationsModule],
        providers: [
          {provide: ANALYTICS, useValue: analytics},
          {
            provide: INITIAL_FORM_VALUES,
            useValue: {
              url: '',
              podficLabel: false,
              podficLengthLabel: false,
              podficLengthValue: '',
              titleFormat: '',
              summaryFormat: '',
              audioFormatTagOptionIds: [] as readonly string[],
              privacyTemplate: {
                onlyShowToRegisteredUsers: false,
                enableCommentModeration: false,
                commentPermissionSetting:
                  CommentPermissionSetting.REGISTERED_USERS_ONLY,
              },
            },
          },
          provideZonelessChangeDetection(),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AppComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    });

    it('has options button in the toolbar with the correct link', async () => {
      fixture.detectChanges();

      const toolbarHarness = await manualChangeDetection(() =>
        loader.getHarness(MatToolbarHarness),
      );
      const optionsButton = await manualChangeDetection(() =>
        toolbarHarness.getHarness(MatButtonHarness.with({text: /settings/})),
      );
      const optionsButtonHost = await manualChangeDetection(() =>
        optionsButton.host(),
      );
      expect(
        await manualChangeDetection(() =>
          optionsButtonHost.getProperty('href'),
        ),
      ).toContain('options-url');
    });

    it('shows a spinner because the tabs are loading', async () => {
      fixture.detectChanges();

      expect(
        await manualChangeDetection(() =>
          loader.hasHarness(MatProgressSpinnerHarness),
        ),
      ).toBe(true);
    });

    it('shows an error message if the opened on a page that is not allowed', async () => {
      fixture.detectChanges();
      tabsQuerySubject.next([{url: 'https://example.com'} as chrome.tabs.Tab]);
      await fixture.whenStable();

      expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBe(false);

      expect(fixture.nativeElement.textContent).toContain(
        'This extension can only be used on the AO3 page',
      );
      expect(fixture.nativeElement.querySelector('form')).toBeNull();
      expect(analytics.firePageViewEvent).toHaveBeenCalledTimes(1);
      expect(analytics.firePageViewEvent).toHaveBeenCalledWith(
        'Not on new work URL page',
      );
      expect(analytics.fireEvent).not.toHaveBeenCalled();
      expect(analytics.fireErrorEvent).not.toHaveBeenCalled();
    });

    describe('when the user is on the ao3 new work page', () => {
      let submitButton: MatButtonHarness;
      let urlInputFormField: MatFormFieldHarness;
      let urlInput: MatInputHarness;

      beforeEach(async () => {
        fixture.detectChanges();
        tabsQuerySubject.next([
          {
            url: 'https://archiveofourown.org/works/new',
            id: 666,
          } as chrome.tabs.Tab,
        ]);
        fixture.detectChanges();
        await fixture.whenStable();

        submitButton = await loader.getHarness(
          MatButtonHarness.with({text: /Import/}),
        );
        urlInputFormField = await loader.getHarness(
          MatFormFieldHarness.with({
            floatingLabelText: 'URL of work to import from',
          }),
        );
        urlInput = (await urlInputFormField.getControl(MatInputHarness))!;
      });

      it('is not loading', async () => {
        expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBe(false);
      });

      it('does not contain the error message', () => {
        expect(fixture.nativeElement.textContent).not.toContain(
          'This extension can only be used on the AO3 page',
        );
      });

      it('fired a page view event', () => {
        expect(analytics.firePageViewEvent).toHaveBeenCalledTimes(1);
        expect(analytics.firePageViewEvent).toHaveBeenCalledWith('Form');
        expect(analytics.fireEvent).not.toHaveBeenCalled();
        expect(analytics.fireErrorEvent).not.toHaveBeenCalled();
      });

      // Check that the page hasn't changed
      it('ignores the tab updates', async () => {
        tabsQuerySubject.next([
          {url: 'https://example.com'} as chrome.tabs.Tab,
        ]);
        await fixture.whenStable();

        expect(fixture.nativeElement.textContent).not.toContain(
          'This extension can only be used on the AO3 page',
        );
        expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBe(false);
        expect(analytics.firePageViewEvent).toHaveBeenCalledTimes(1);
      });

      it('does not import when the url is empty', async () => {
        await submitButton.click();
        fixture.detectChanges();

        expect(await urlInput?.isFocused()).toBe(true);
        expect(await urlInputFormField.getTextErrors()).toContain(
          'This field is required',
        );
      });

      it('does not import when the url is invalid', async () => {
        await urlInput.setValue('invalid url');

        await submitButton.click();
        fixture.detectChanges();

        expect(await urlInput.isFocused()).toBe(true);
        expect(await urlInputFormField.getTextErrors()).toContain(
          'Must be an AO3 work URL',
        );
      });

      it('disables the podfic length select when a podfic length will not be added', async () => {
        const podficLengthFormField = await loader.getHarness(
          MatFormFieldHarness.with({floatingLabelText: 'Podfic Length'}),
        );

        expect(await podficLengthFormField.isDisabled()).toBe(true);

        const podficLengthCheckbox = await loader.getHarness(
          MatCheckboxHarness.with({label: 'Add a "Podfic Length" tag'}),
        );

        await podficLengthCheckbox.check();

        expect(await podficLengthFormField.isDisabled()).toBe(false);

        await podficLengthCheckbox.uncheck();

        expect(await podficLengthFormField.isDisabled()).toBe(true);
      });

      describe('when the form is filled with valid values and submitted', () => {
        let executeScriptResolve: (
          value: chrome.scripting.InjectionResult[],
        ) => void;
        let executeScriptReject: (error: Error) => void;
        let setSpy: Mock;
        let executeScriptSpy: Mock;

        beforeEach(async () => {
          const storageSpy = {
            sync: {
              get: vi.fn().mockName('chrome.storage.sync.get'),
              set: vi.fn().mockName('chrome.storage.sync.set'),
            },
          };
          setSpy = storageSpy.sync.set.mockResolvedValue(undefined);
          storageSpy.sync.get.mockResolvedValue({});
          storageSpy.sync.get.mockResolvedValue({
            workbody: {default: 'workbody'},
            title_template: {default: 'title_template'},
            summary_template: {default: 'summary_template'},
            notes_template: {
              default: 'notes_template',
              begin: true,
              end: false,
            },
            privacy_template: {
              onlyShowToRegisteredUsers: true,
              enableCommentModeration: true,
              commentPermissionSetting: CommentPermissionSetting.NO_ONE,
            },
          });

          const scriptingSpy = {
            executeScript: vi.fn().mockName('chrome.scripting.executeScript'),
          };
          executeScriptSpy = scriptingSpy.executeScript.mockImplementation(
            () => {
              return new Promise<chrome.scripting.InjectionResult[]>(
                (resolve, reject) => {
                  executeScriptResolve = resolve;
                  executeScriptReject = reject;
                },
              );
            },
          );

          (chrome.storage as unknown) = storageSpy;
          (chrome.scripting as unknown) = scriptingSpy;

          // Spaces are intentional to verify that we trim the value.
          await urlInput.setValue(' https://archiveofourown.org/works/12345 ');
          const podficTagCheckbox = await loader.getHarness(
            MatCheckboxHarness.with({label: 'Add the tag "Podfic"'}),
          );
          await podficTagCheckbox.check();

          const podficLengthCheckbox = await loader.getHarness(
            MatCheckboxHarness.with({label: 'Add a "Podfic Length" tag'}),
          );
          await podficLengthCheckbox.check();

          const podficLengthFormField = await loader.getHarness(
            MatFormFieldHarness.with({floatingLabelText: 'Podfic Length'}),
          );
          const podficLengthSelect =
            (await podficLengthFormField.getControl(MatSelectHarness))!;
          await podficLengthSelect.clickOptions({text: '3-3.5 Hours'});

          const titleFormatFormField = await loader.getHarness(
            MatFormFieldHarness.with({floatingLabelText: 'Title format'}),
          );
          const titleFormatSelect =
            (await titleFormatFormField.getControl(MatSelectHarness))!;
          await titleFormatSelect.clickOptions({text: 'Leave blank'});

          const summaryFormatFormField = await loader.getHarness(
            MatFormFieldHarness.with({floatingLabelText: 'Summary format'}),
          );
          const summaryFormatSelect =
            (await summaryFormatFormField.getControl(MatSelectHarness))!;
          await summaryFormatSelect.clickOptions({text: 'Original summary'});

          const audioFormatTagsFormField = await loader.getHarness(
            MatFormFieldHarness.with({
              floatingLabelText: '"Audio Format" tags',
            }),
          );
          const audioFormatTagsSelect =
            (await audioFormatTagsFormField.getControl(MatSelectHarness))!;
          await audioFormatTagsSelect.clickOptions({text: 'MP3'});
          await audioFormatTagsSelect.clickOptions({text: 'Streaming'});

          await submitButton.click();
          fixture.detectChanges();
        });

        it('starts loading', async () => {
          expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBe(true);
        });

        it('stores form values', () => {
          expect(setSpy as Mock).toHaveBeenCalledTimes(1);
          expect(setSpy as Mock).toHaveBeenCalledWith({
            options: {
              url: 'https://archiveofourown.org/works/12345',
              podfic_label: true,
              podfic_length_label: true,
              podfic_length_value: '3-3.5 Hours',
              title_format: 'blank',
              summary_format: 'orig',
              audioFormatTagOptionIds: [
                'audio-format-tag-MP3',
                'audio-format-tag-Streaming',
              ],
            },
          });
        });

        it('fires an analytics event', () => {
          expect(analytics.fireEvent).toHaveBeenCalledTimes(1);
          expect(analytics.fireEvent).toHaveBeenCalledWith(
            'popup_form_submit',
            {
              podfic_label: 'true',
              podfic_length_value: '3-3.5 Hours',
              title_format: 'blank',
              summary_format: 'orig',
              audio_formats: 'audio-format-tag-MP3,audio-format-tag-Streaming',
            },
          );
        });

        it('executes the inject script', () => {
          expect(executeScriptSpy as Mock).toHaveBeenCalledTimes(1);
          expect(executeScriptSpy as Mock).toHaveBeenCalledWith({
            target: {tabId: 666},
            func: window.injectImportAndFillMetadata,
            world: 'MAIN',
            args: [
              {
                url: 'https://archiveofourown.org/works/12345',
                podficLabel: true,
                podficLengthLabel: true,
                podficLengthValue: '3-3.5 Hours',
                titleFormat: 'blank',
                summaryFormat: 'orig',
                audioFormatTagOptionIds: [
                  'audio-format-tag-MP3',
                  'audio-format-tag-Streaming',
                ],
                workTemplate: 'workbody',
                userSummaryTemplate: 'summary_template',
                userTitleTemplate: 'title_template',
                userNotesTemplate: 'notes_template',
                beginNotes: true,
                endNotes: false,
                onlyShowToRegisteredUsers: true,
                enableCommentModeration: true,
                commentPermissionSetting: CommentPermissionSetting.NO_ONE,
              },
            ],
          });
        });

        describe('the script execution succeeds', () => {
          beforeEach(async () => {
            executeScriptResolve([
              {
                documentId: '666',
                frameId: 777,
                result: {
                  result: 'success',
                },
              },
            ]);
            await fixture.whenStable();
          });

          it('shows a snack bar', async () => {
            const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

            expect(await snackBar.getMessage()).toBe('Import finished');
          });

          it('finishes loading', async () => {
            expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBe(
              false,
            );
          });
        });

        describe('the script execution throws', () => {
          beforeEach(async () => {
            executeScriptReject(new Error('I always get the shemp'));
            await fixture.whenStable();
          });

          it('shows a snack bar', async () => {
            const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

            expect(await snackBar.getMessage()).toBe(
              'Failed to import metadata',
            );
          });

          it('finishes loading', async () => {
            expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBe(
              false,
            );
          });

          it('set a form error', async () => {
            expect(await urlInputFormField.getTextErrors()).toEqual([
              expect.stringContaining('I always get the shemp'),
            ]);
          });

          it('shifted the focus to the url input', async () => {
            expect(await urlInput.isFocused()).toBe(true);
          });

          it('fired an analytics error event', () => {
            expect(analytics.fireErrorEvent).toHaveBeenCalledTimes(1);
            expect(analytics.fireErrorEvent).toHaveBeenCalledWith(
              expect.stringContaining('I always get the shemp'),
            );
          });
        });

        describe('the script execution fails', () => {
          beforeEach(async () => {
            executeScriptResolve([
              {
                documentId: '666',
                frameId: 777,
                result: {
                  result: 'error',
                  message: 'I always get the shemp',
                },
              },
            ]);
            await fixture.whenStable();
          });

          it('shows a snack bar', async () => {
            const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

            expect(await snackBar.getMessage()).toBe(
              'Failed to import metadata',
            );
          });

          it('finishes loading', async () => {
            expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBe(
              false,
            );
          });

          it('set a form error', async () => {
            expect(await urlInputFormField.getTextErrors()).toEqual([
              expect.stringContaining('I always get the shemp'),
            ]);
          });

          it('shifted the focus to the url input', async () => {
            expect(await urlInput.isFocused()).toBe(true);
          });

          it('fired an analytics error event', () => {
            expect(analytics.fireErrorEvent).toHaveBeenCalledTimes(1);
            expect(analytics.fireErrorEvent).toHaveBeenCalledWith(
              expect.stringContaining('I always get the shemp'),
            );
          });
        });
      });
    });
  });
});
