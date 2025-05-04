import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {Subject, firstValueFrom} from 'rxjs';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatToolbarHarness} from '@angular/material/toolbar/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatProgressSpinnerHarness} from '@angular/material/progress-spinner/testing';
import {ANALYTICS, Analytics} from 'common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatInputHarness} from '@angular/material/input/testing';
import {MatFormFieldHarness} from '@angular/material/form-field/testing';
import {INITIAL_FORM_VALUES} from '../utils';
import {MatCheckboxHarness} from '@angular/material/checkbox/testing';
import {MatSelectHarness} from '@angular/material/select/testing';
import './inject/index';
import './inject/inject';
import {MatSnackBarHarness} from '@angular/material/snack-bar/testing';
import {axe, toHaveNoViolations} from 'jasmine-axe';

describe('AppComponent', () => {
  beforeAll(() => {
    jasmine.addMatchers(toHaveNoViolations);
  });

  let tabsQuerySubject: Subject<chrome.tabs.Tab[]>;
  let analytics: jasmine.SpyObj<Analytics>;

  beforeEach(async () => {
    tabsQuerySubject = new Subject<chrome.tabs.Tab[]>();

    const runtimeSpy = jasmine.createSpyObj<typeof chrome.runtime>(
      'chrome.runtime',
      ['getURL'],
    );
    runtimeSpy.getURL
      .withArgs('options/browser/index.html')
      .and.returnValue('options-url');

    const tabsSpy = jasmine.createSpyObj<typeof chrome.tabs>('chrome.tabs', [
      'query',
    ]);
    tabsSpy.query
      .withArgs({
        active: true,
        currentWindow: true,
      })
      .and.returnValue(firstValueFrom(tabsQuerySubject));

    chrome.runtime = runtimeSpy;
    chrome.tabs = tabsSpy;

    analytics = jasmine.createSpyObj<Analytics>('Analytics', [
      'firePageViewEvent',
      'fireErrorEvent',
      'fireEvent',
    ]);
  });

  describe('with saved values', () => {
    let loader: HarnessLoader;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(fakeAsync(async () => {
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
            },
          },
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
      flush();
      fixture.detectChanges();
    }));

    it('passes a11y tests', async () => {
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });

    it('enables the podfic length select because a length is being added', async () => {
      const podficLengthFormField = await loader.getHarness(
        MatFormFieldHarness.with({floatingLabelText: 'Podfic Length'}),
      );

      expect(await podficLengthFormField.isDisabled()).toBeFalse();
    });

    it('sets the input values to the intial values', async () => {
      const podficTagCheckbox = await loader.getHarness(
        MatCheckboxHarness.with({label: 'Add the tag "Podfic"'}),
      );
      expect(await podficTagCheckbox.isChecked()).toBeTrue();

      const podficLengthCheckbox = await loader.getHarness(
        MatCheckboxHarness.with({label: 'Add a "Podfic Length" tag'}),
      );
      expect(await podficLengthCheckbox.isChecked()).toBeTrue();

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
            },
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AppComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    });

    it('has options button in the toolbar with the correct link', async () => {
      fixture.detectChanges();

      const toolbarHarness = await loader.getHarness(MatToolbarHarness);
      const optionsButton = await toolbarHarness.getHarness(
        MatButtonHarness.with({text: /settings/}),
      );
      const optionsButtonHost = await optionsButton.host();
      expect(await optionsButtonHost.getProperty('href')).toContain(
        'options-url',
      );
    });

    it('shows a spinner because the tabs are loading', async () => {
      fixture.detectChanges();

      expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBeTrue();
    });

    it('shows an error message if the opened on a page that is not allowed', fakeAsync(async () => {
      fixture.detectChanges();
      tabsQuerySubject.next([{url: 'https://example.com'} as chrome.tabs.Tab]);
      flush();

      expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBeFalse();

      expect(fixture.nativeElement.textContent).toContain(
        'This extension can only be used on the AO3 page',
      );
      expect(fixture.nativeElement.querySelector('form')).toBeNull();
      expect(analytics.firePageViewEvent).toHaveBeenCalledOnceWith(
        'Not on new work URL page',
      );
      expect(analytics.fireEvent).not.toHaveBeenCalled();
      expect(analytics.fireErrorEvent).not.toHaveBeenCalled();
    }));

    describe('when the user is on the ao3 new work page', () => {
      let submitButton: MatButtonHarness;
      let urlInputFormField: MatFormFieldHarness;
      let urlInput: MatInputHarness;

      beforeEach(fakeAsync(async () => {
        fixture.detectChanges();
        tabsQuerySubject.next([
          {
            url: 'https://archiveofourown.org/works/new',
            id: 666,
          } as chrome.tabs.Tab,
        ]);
        flush();
        fixture.detectChanges();

        submitButton = await loader.getHarness(
          MatButtonHarness.with({text: /Import/}),
        );
        urlInputFormField = await loader.getHarness(
          MatFormFieldHarness.with({
            floatingLabelText: 'URL of work to import from',
          }),
        );
        urlInput = (await urlInputFormField.getControl(MatInputHarness))!;
      }));

      it('is not loading', async () => {
        expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBeFalse();
      });

      it('does not contain the error message', () => {
        expect(fixture.nativeElement.textContent).not.toContain(
          'This extension can only be used on the AO3 page',
        );
      });

      it('fired a page view event', () => {
        expect(analytics.firePageViewEvent).toHaveBeenCalledOnceWith('Form');
        expect(analytics.fireEvent).not.toHaveBeenCalled();
        expect(analytics.fireErrorEvent).not.toHaveBeenCalled();
      });

      // Check that the page hasn't changed
      it('ignores the tab updates', fakeAsync(async () => {
        tabsQuerySubject.next([
          {url: 'https://example.com'} as chrome.tabs.Tab,
        ]);
        flush();

        expect(fixture.nativeElement.textContent).not.toContain(
          'This extension can only be used on the AO3 page',
        );
        expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBeFalse();
        expect(analytics.firePageViewEvent).toHaveBeenCalledTimes(1);
      }));

      it('does not import when the url is empty', async () => {
        await submitButton.click();
        fixture.detectChanges();

        expect(await urlInput?.isFocused()).toBeTrue();
        expect(await urlInputFormField.getTextErrors()).toContain(
          'This field is required',
        );
      });

      it('does not import when the url is invalid', async () => {
        await urlInput.setValue('invalid url');

        await submitButton.click();
        fixture.detectChanges();

        expect(await urlInput.isFocused()).toBeTrue();
        expect(await urlInputFormField.getTextErrors()).toContain(
          'Must be an AO3 work URL',
        );
      });

      it('disables the podfic length select when a podfic length will not be added', async () => {
        const podficLengthFormField = await loader.getHarness(
          MatFormFieldHarness.with({floatingLabelText: 'Podfic Length'}),
        );

        expect(await podficLengthFormField.isDisabled()).toBeTrue();

        const podficLengthCheckbox = await loader.getHarness(
          MatCheckboxHarness.with({label: 'Add a "Podfic Length" tag'}),
        );

        await podficLengthCheckbox.check();

        expect(await podficLengthFormField.isDisabled()).toBeFalse();

        await podficLengthCheckbox.uncheck();

        expect(await podficLengthFormField.isDisabled()).toBeTrue();
      });

      describe('when the form is filled with valid values and submitted', () => {
        let executeScriptResolve: (
          value: chrome.scripting.InjectionResult[],
        ) => void;
        let executeScriptReject: (error: Error) => void;
        let setSpy: jasmine.Spy<typeof chrome.storage.sync.set>;
        let executeScriptSpy: jasmine.Spy<
          typeof chrome.scripting.executeScript
        >;

        beforeEach(fakeAsync(async () => {
          const storageSpy = jasmine.createSpyObj<typeof chrome.storage>(
            'chrome.storage',
            ['sync'],
          );
          const syncSpy = jasmine.createSpyObj<typeof chrome.storage.sync>(
            'chrome.storage.sync',
            ['get', 'set'],
          );
          storageSpy.sync = syncSpy;
          setSpy = syncSpy.set.and.resolveTo(undefined);
          (syncSpy.get as jasmine.Spy)
            .withArgs([
              'workbody',
              'title_template',
              'summary_template',
              'notes_template',
            ])
            .and.resolveTo({
              workbody: {default: 'workbody'},
              title_template: {default: 'title_template'},
              summary_template: {default: 'summary_template'},
              notes_template: {
                default: 'notes_template',
                begin: true,
                end: false,
              },
            });

          const scriptingSpy = jasmine.createSpyObj<typeof chrome.scripting>(
            'chrome.scripting',
            ['executeScript'],
          );
          executeScriptSpy = scriptingSpy.executeScript.and.callFake(() => {
            return new Promise<chrome.scripting.InjectionResult[]>(
              (resolve, reject) => {
                executeScriptResolve = resolve;
                executeScriptReject = reject;
              },
            );
          });

          chrome.storage = storageSpy;
          chrome.scripting = scriptingSpy;

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
        }));

        it('starts loading', async () => {
          expect(await loader.hasHarness(MatProgressSpinnerHarness)).toBeTrue();
        });

        it('stores form values', () => {
          expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
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
          expect(analytics.fireEvent).toHaveBeenCalledOnceWith(
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
          expect(executeScriptSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
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
              },
            ],
          });
        });

        describe('the script execution succeeds', () => {
          beforeEach(fakeAsync(() => {
            executeScriptResolve([
              {
                documentId: '666',
                frameId: 777,
                result: {
                  result: 'success',
                },
              },
            ]);
            flush();
          }));

          it('shows a snack bar', async () => {
            const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

            expect(await snackBar.getMessage()).toBe('Import finished');
          });

          it('finishes loading', async () => {
            expect(
              await loader.hasHarness(MatProgressSpinnerHarness),
            ).toBeFalse();
          });
        });

        describe('the script execution throws', () => {
          beforeEach(fakeAsync(() => {
            executeScriptReject(new Error('I always get the shemp'));
            flush();
          }));

          it('shows a snack bar', async () => {
            const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

            expect(await snackBar.getMessage()).toBe(
              'Failed to import metadata',
            );
          });

          it('finishes loading', async () => {
            expect(
              await loader.hasHarness(MatProgressSpinnerHarness),
            ).toBeFalse();
          });

          it('set a form error', async () => {
            expect(await urlInputFormField.getTextErrors()).toContain(
              jasmine.stringContaining('I always get the shemp'),
            );
          });

          it('shifted the focus to the url input', async () => {
            expect(await urlInput.isFocused()).toBeTrue();
          });

          it('fired an analytics error event', () => {
            expect(analytics.fireErrorEvent).toHaveBeenCalledOnceWith(
              jasmine.stringContaining('I always get the shemp'),
            );
          });
        });

        describe('the script execution fails', () => {
          beforeEach(fakeAsync(() => {
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
            flush();
          }));

          it('shows a snack bar', async () => {
            const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

            expect(await snackBar.getMessage()).toBe(
              'Failed to import metadata',
            );
          });

          it('finishes loading', async () => {
            expect(
              await loader.hasHarness(MatProgressSpinnerHarness),
            ).toBeFalse();
          });

          it('set a form error', async () => {
            expect(await urlInputFormField.getTextErrors()).toContain(
              jasmine.stringContaining('I always get the shemp'),
            );
          });

          it('shifted the focus to the url input', async () => {
            expect(await urlInput.isFocused()).toBeTrue();
          });

          it('fired an analytics error event', () => {
            expect(analytics.fireErrorEvent).toHaveBeenCalledOnceWith(
              jasmine.stringContaining('I always get the shemp'),
            );
          });
        });
      });
    });
  });
});
