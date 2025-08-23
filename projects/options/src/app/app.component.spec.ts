import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {INITIAL_FORM_VALUES} from './utils';
import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessLoader,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatCardHarness, MatCardSection} from '@angular/material/card/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {HIGHLIGHT_OPTIONS} from 'ngx-highlightjs';
import {MatFormFieldHarness} from '@angular/material/form-field/testing';
import {MatInputHarness} from '@angular/material/input/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatSnackBarHarness} from '@angular/material/snack-bar/testing';
import {MatCheckboxHarness} from '@angular/material/checkbox/testing';
import {axe, toHaveNoViolations} from 'jasmine-axe';
import {provideZonelessChangeDetection} from '@angular/core';
import {CommentPermissionSetting} from 'common';
import {MatRadioGroupHarness} from '@angular/material/radio/testing';
import {MatRadioButtonHarness} from '@angular/material/radio/testing';

const VERSION = 'version-shemp';

describe('AppComponent', () => {
  beforeAll(() => {
    jasmine.addMatchers(toHaveNoViolations);
  });

  let setSpy: jasmine.Spy<typeof chrome.storage.sync.set>;

  beforeEach(() => {
    const runtimeSpy = jasmine.createSpyObj<typeof chrome.runtime>(
      'chrome.runtime',
      ['getManifest'],
    );
    runtimeSpy.getManifest.and.returnValue({
      version: VERSION,
      manifest_version: 3,
      name: '',
    });

    chrome.runtime = runtimeSpy;

    const storageSpy = jasmine.createSpyObj<typeof chrome.storage>(
      'chrome.storage',
      ['sync'],
    );
    const syncSpy = jasmine.createSpyObj<typeof chrome.storage.sync>(
      'chrome.storage.sync',
      ['set', 'get'],
    );
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    (syncSpy.get as any).and.resolveTo({});

    storageSpy.sync = syncSpy;
    setSpy = syncSpy.set.and.resolveTo(undefined);
    chrome.storage = storageSpy;
  });

  describe('with saved values', () => {
    const TEMPLATE_VALUE =
      '<video>video</video><strong>strong</strong>${blocksummary} ${title} ${title-unlinked} ' +
      '${authors} ${author} ${authors-unlinked} ${author-unlinked} ${ignored}';
    const PREVIEW_VALUE =
      'video<strong>strong</strong><blockquote>BLOCK_SUMMARY_TEXT</blockquote> ' +
      '<a>TITLE_TEXT</a> TITLE_TEXT <a>AUTHOR_1</a>, <a>AUTHOR_2</a> <a>AUTHOR_1</a>, ' +
      '<a>AUTHOR_2</a> AUTHOR_1, AUTHOR_2 AUTHOR_1, AUTHOR_2 ${ignored}';
    let loader: HarnessLoader;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AppComponent, NoopAnimationsModule, MatIconTestingModule],
        providers: [
          {
            provide: INITIAL_FORM_VALUES,
            useValue: {
              titleTemplate: 'title: ' + TEMPLATE_VALUE,
              workTemplate: 'work: ' + TEMPLATE_VALUE,
              summaryTemplate: 'summary: ' + TEMPLATE_VALUE,
              notesTemplate: 'notes: ' + TEMPLATE_VALUE,
              beginningNotes: true,
              endNotes: true,
              privacyTemplate: {
                onlyShowToRegisteredUsers: true,
                enableCommentModeration: true,
                commentPermissionSetting: CommentPermissionSetting.NO_ONE,
              },
            },
          },
          {
            provide: HIGHLIGHT_OPTIONS,
            useValue: {
              coreLibraryLoader: () => import('highlight.js/lib/core'),
              languages: {
                plaintext: () => import('highlight.js/lib/languages/plaintext'),
                xml: () => import('highlight.js/lib/languages/xml'),
              },
            },
          },
          provideZonelessChangeDetection(),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AppComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);

      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for previews.
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });

    it('passes a11y tests', async () => {
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });

    describe('title section', () => {
      let formField: MatFormFieldHarness;
      let input: MatInputHarness;
      let preview: TemplatePreviewHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Title template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        formField = await cardContentLoader.getHarness(MatFormFieldHarness);
        input = (await formField.getControl(MatInputHarness))!;
        preview = await cardContentLoader.getHarness(TemplatePreviewHarness);
      });

      it('should display the saved template', async () => {
        expect(await input.getValue()).toBe('title: ' + TEMPLATE_VALUE);
      });

      it('should display a preview with the saved value', async () => {
        expect(await preview.getText()).toBe(
          'title: <video>video</video><strong>strong</strong>${blocksummary} TITLE_TEXT ' +
            'TITLE_TEXT AUTHOR_1, AUTHOR_2 AUTHOR_1, AUTHOR_2 AUTHOR_1, AUTHOR_2 AUTHOR_1, ' +
            'AUTHOR_2 ${ignored}',
        );
      });
    });

    describe('summary section', () => {
      let formField: MatFormFieldHarness;
      let input: MatInputHarness;
      let preview: TemplatePreviewHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Summary template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        formField = await cardContentLoader.getHarness(MatFormFieldHarness);
        input = (await formField.getControl(MatInputHarness))!;
        preview = await cardContentLoader.getHarness(TemplatePreviewHarness);
      });

      it('should display the saved template', async () => {
        expect(await input.getValue()).toBe('summary: ' + TEMPLATE_VALUE);
      });

      it('should display a preview with the saved value', async () => {
        expect(await preview.getText()).toBe('summary: ' + PREVIEW_VALUE);
      });
    });

    describe('notes section', () => {
      let formField: MatFormFieldHarness;
      let input: MatInputHarness;
      let preview: TemplatePreviewHarness;
      let beginNotesCheckbox: MatCheckboxHarness;
      let endNotesCheckbox: MatCheckboxHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Notes template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        formField = await cardContentLoader.getHarness(MatFormFieldHarness);
        input = (await formField.getControl(MatInputHarness))!;
        preview = await cardContentLoader.getHarness(TemplatePreviewHarness);
        beginNotesCheckbox = await cardContentLoader.getHarness(
          MatCheckboxHarness.with({label: 'Use as beginning notes'}),
        );
        endNotesCheckbox = await cardContentLoader.getHarness(
          MatCheckboxHarness.with({label: 'Use as end notes'}),
        );
      });

      it('should display the saved template', async () => {
        expect(await input.getValue()).toBe('notes: ' + TEMPLATE_VALUE);
        expect(await beginNotesCheckbox.isChecked()).toBeTrue();
        expect(await endNotesCheckbox.isChecked()).toBeTrue();
      });

      it('should display a preview with the saved value', async () => {
        expect(await preview.getText()).toBe('notes: ' + PREVIEW_VALUE);
      });
    });

    describe('work section', () => {
      let formField: MatFormFieldHarness;
      let input: MatInputHarness;
      let preview: TemplatePreviewHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Work template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        formField = await cardContentLoader.getHarness(MatFormFieldHarness);
        input = (await formField.getControl(MatInputHarness))!;
        preview = await cardContentLoader.getHarness(TemplatePreviewHarness);
      });

      it('should display the saved template', async () => {
        expect(await input.getValue()).toBe('work: ' + TEMPLATE_VALUE);
      });

      it('should display a preview with the saved value', async () => {
        expect(await preview.getText()).toBe('work: ' + PREVIEW_VALUE);
      });
    });

    describe('privacy section', () => {
      let onlyRegisteredCheckbox: MatCheckboxHarness;
      let commentModerationCheckbox: MatCheckboxHarness;
      let commentPermissionRadioGroup: MatRadioGroupHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Privacy template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        onlyRegisteredCheckbox = await cardContentLoader.getHarness(
          MatCheckboxHarness.with({label: 'Only show to registered users'}),
        );
        commentModerationCheckbox = await cardContentLoader.getHarness(
          MatCheckboxHarness.with({label: 'Enable comment moderation'}),
        );
        commentPermissionRadioGroup =
          await cardContentLoader.getHarness(MatRadioGroupHarness);
      });

      it('should display the saved values', async () => {
        expect(await onlyRegisteredCheckbox.isChecked()).toBeTrue();
        expect(await commentModerationCheckbox.isChecked()).toBeTrue();
        expect(await commentPermissionRadioGroup.getCheckedValue()).toEqual(
          String(CommentPermissionSetting.NO_ONE),
        );
      });
    });
  });

  describe('with no saved values', () => {
    let loader: HarnessLoader;
    let rootLoader: HarnessLoader;
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AppComponent, NoopAnimationsModule, MatIconTestingModule],
        providers: [
          {
            provide: INITIAL_FORM_VALUES,
            useValue: {
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
                  CommentPermissionSetting.REGISTERED_USERS_ONLY,
              },
            },
          },
          {
            provide: HIGHLIGHT_OPTIONS,
            useValue: {
              coreLibraryLoader: () => import('highlight.js/lib/core'),
              languages: {
                plaintext: () => import('highlight.js/lib/languages/plaintext'),
                xml: () => import('highlight.js/lib/languages/xml'),
              },
            },
          },
          provideZonelessChangeDetection(),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AppComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for previews.
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });

    describe('title section', () => {
      let formField: MatFormFieldHarness;
      let input: MatInputHarness;
      let preview: TemplatePreviewHarness;
      let submitButton: MatButtonHarness;
      let resetButton: MatButtonHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Title template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        formField = await cardContentLoader.getHarness(MatFormFieldHarness);
        input = (await formField.getControl(MatInputHarness))!;
        preview = await cardContentLoader.getHarness(TemplatePreviewHarness);

        const cardActionsLoader = await card.getChildLoader(
          MatCardSection.ACTIONS,
        );

        submitButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Save/}),
        );
        resetButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Reset/}),
        );
      });

      it('should display the default title template', async () => {
        expect(await input.getValue()).toBe('');
      });

      it('should display an empty preview', async () => {
        expect(await preview.getText()).toBe('');
      });

      it('clicking the reset button resets without saving', async () => {
        await resetButton.click();

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await input.getValue()).toBe('[Podfic] ${title}');
        expect(await preview.getText()).toBe('[Podfic] TITLE_TEXT');
        expect(setSpy).not.toHaveBeenCalled();
      });

      it('entering html shows a warning', async () => {
        await input.setValue('<b>bold</b>');
        await input.blur();

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await formField.getTextErrors()).toContain(
          'This template should not contain HTML but it appears to contain HTML',
        );
        expect(await preview.getText()).toBe('<b>bold</b>');
      });

      it('can save an empty value', async () => {
        await input.setValue('');
        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Title template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          title_template: {
            default: '',
          },
        });
      });

      it('can save a fully templated value', async () => {
        await input.setValue(
          '${title} ${title-unlinked} ${authors} ${author} ${authors-unlinked} ' +
            '${author-unlinked} ${ignored}',
        );
        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await preview.getText()).toBe(
          'TITLE_TEXT TITLE_TEXT AUTHOR_1, AUTHOR_2 AUTHOR_1, AUTHOR_2 AUTHOR_1, AUTHOR_2 ' +
            'AUTHOR_1, AUTHOR_2 ${ignored}',
        );

        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Title template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          title_template: {
            default:
              '${title} ${title-unlinked} ${authors} ${author} ${authors-unlinked} ${author-unlinked} ${ignored}',
          },
        });
      });
    });

    describe('summary section', () => {
      let formField: MatFormFieldHarness;
      let input: MatInputHarness;
      let preview: TemplatePreviewHarness;
      let submitButton: MatButtonHarness;
      let resetButton: MatButtonHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Summary template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        formField = await cardContentLoader.getHarness(MatFormFieldHarness);
        input = (await formField.getControl(MatInputHarness))!;
        preview = await cardContentLoader.getHarness(TemplatePreviewHarness);

        const cardActionsLoader = await card.getChildLoader(
          MatCardSection.ACTIONS,
        );

        submitButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Save/}),
        );
        resetButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Reset/}),
        );
      });

      it('should display the default title template', async () => {
        expect(await input.getValue()).toBe('');
      });

      it('should display an empty preview', async () => {
        expect(await preview.getText()).toBe('');
      });

      it('clicking the reset button resets without saving', async () => {
        await resetButton.click();

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1_00));

        expect(await input.getValue()).toBe(
          '${blocksummary}Podfic of ${title} by ${authors}.',
        );
        expect(await preview.getText()).toBe(
          '<blockquote>BLOCK_SUMMARY_TEXT</blockquote>Podfic of <a>TITLE_TEXT</a> by ' +
            '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>.',
        );
        expect(setSpy).not.toHaveBeenCalled();
      });

      it('entering invalid ao3 html shows a warning', async () => {
        await input.setValue('<b>bold</b><video>video</video>');
        await input.blur();

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await formField.getTextErrors()).toContain(
          'This template appears to contain HTML tags that cannot be used on AO3, they have been removed from the preview',
        );
        expect(await preview.getText()).toBe('<b>bold</b>video');
      });

      it('can save an empty value', async () => {
        await input.setValue('');
        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Summary template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          summary_template: {
            default: '',
          },
        });
      });

      it('can save a fully templated value', async () => {
        const value =
          '<video>video</video><strong>strong</strong>${blocksummary} ${title} ${title-unlinked} ' +
          '${authors} ${author} ${authors-unlinked} ${author-unlinked} ${ignored}';
        await input.setValue(value);

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await preview.getText()).toBe(
          'video<strong>strong</strong><blockquote>BLOCK_SUMMARY_TEXT</blockquote> ' +
            '<a>TITLE_TEXT</a> TITLE_TEXT <a>AUTHOR_1</a>, <a>AUTHOR_2</a> <a>AUTHOR_1</a>, ' +
            '<a>AUTHOR_2</a> AUTHOR_1, AUTHOR_2 AUTHOR_1, AUTHOR_2 ${ignored}',
        );

        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Summary template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          summary_template: {
            default: value,
          },
        });
      });
    });

    describe('notes section', () => {
      let formField: MatFormFieldHarness;
      let input: MatInputHarness;
      let preview: TemplatePreviewHarness;
      let beginNotesCheckbox: MatCheckboxHarness;
      let endNotesCheckbox: MatCheckboxHarness;
      let submitButton: MatButtonHarness;
      let resetButton: MatButtonHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Notes template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        formField = await cardContentLoader.getHarness(MatFormFieldHarness);
        input = (await formField.getControl(MatInputHarness))!;
        preview = await cardContentLoader.getHarness(TemplatePreviewHarness);
        beginNotesCheckbox = await cardContentLoader.getHarness(
          MatCheckboxHarness.with({label: 'Use as beginning notes'}),
        );
        endNotesCheckbox = await cardContentLoader.getHarness(
          MatCheckboxHarness.with({label: 'Use as end notes'}),
        );

        const cardActionsLoader = await card.getChildLoader(
          MatCardSection.ACTIONS,
        );

        submitButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Save/}),
        );
        resetButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Reset/}),
        );
      });

      it('should display the default template', async () => {
        expect(await input.getValue()).toBe('');
        expect(await beginNotesCheckbox.isChecked()).toBeFalse();
        expect(await endNotesCheckbox.isChecked()).toBeFalse();
      });

      it('should display an empty preview', async () => {
        expect(await preview.getText()).toBe('');
      });

      it('clicking the reset button resets without saving', async () => {
        await resetButton.click();

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await input.getValue()).toBe('');
        expect(await preview.getText()).toBe('');
        expect(setSpy).not.toHaveBeenCalled();
      });

      it('entering invalid ao3 html shows a warning', async () => {
        await input.setValue('<b>bold</b><video>video</video>');
        await input.blur();

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await formField.getTextErrors()).toContain(
          'This template appears to contain HTML tags that cannot be used on AO3, they have been removed from the preview',
        );
        expect(await preview.getText()).toBe('<b>bold</b>video');
      });

      it('can save an empty value', async () => {
        await input.setValue('');
        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Notes template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          notes_template: {
            default: '',
            begin: false,
            end: false,
          },
        });
      });

      it('can save a fully templated value', async () => {
        await beginNotesCheckbox.check();
        await endNotesCheckbox.check();
        const value =
          '<video>video</video><strong>strong</strong>${blocksummary} ${title} ${title-unlinked} ' +
          '${authors} ${author} ${authors-unlinked} ${author-unlinked} ${ignored}';
        await input.setValue(value);

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await preview.getText()).toBe(
          'video<strong>strong</strong><blockquote>BLOCK_SUMMARY_TEXT</blockquote> ' +
            '<a>TITLE_TEXT</a> TITLE_TEXT <a>AUTHOR_1</a>, <a>AUTHOR_2</a> <a>AUTHOR_1</a>, ' +
            '<a>AUTHOR_2</a> AUTHOR_1, AUTHOR_2 AUTHOR_1, AUTHOR_2 ${ignored}',
        );

        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Notes template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          notes_template: {
            default: value,
            begin: true,
            end: true,
          },
        });
      });
    });

    describe('work section', () => {
      let formField: MatFormFieldHarness;
      let input: MatInputHarness;
      let preview: TemplatePreviewHarness;
      let submitButton: MatButtonHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Work template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        formField = await cardContentLoader.getHarness(MatFormFieldHarness);
        input = (await formField.getControl(MatInputHarness))!;
        preview = await cardContentLoader.getHarness(TemplatePreviewHarness);

        const cardActionsLoader = await card.getChildLoader(
          MatCardSection.ACTIONS,
        );

        submitButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Save/}),
        );
      });

      it('should display the default template', async () => {
        expect(await input.getValue()).toBe('');
      });

      it('should display an empty preview', async () => {
        expect(await preview.getText()).toBe('');
      });

      it('entering invalid ao3 html shows a warning', async () => {
        await input.setValue('<b>bold</b><video>video</video>');
        await input.blur();

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await formField.getTextErrors()).toContain(
          'This template appears to contain HTML tags that cannot be used on AO3, they have been removed from the preview',
        );
        expect(await preview.getText()).toBe('<b>bold</b>video');
      });

      it('can save an empty value', async () => {
        await input.setValue('');
        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Work template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          workbody: {
            default: '',
          },
        });
      });

      it('can save a fully templated value', async () => {
        const value =
          '<video>video</video><strong>strong</strong>${blocksummary} ${title} ${title-unlinked} ' +
          '${authors} ${author} ${authors-unlinked} ${author-unlinked} ${ignored}';
        await input.setValue(value);

        // Wait for previews.
        await new Promise<void>(resolve => setTimeout(() => resolve(), 10));

        expect(await preview.getText()).toBe(
          'video<strong>strong</strong><blockquote>BLOCK_SUMMARY_TEXT</blockquote> ' +
            '<a>TITLE_TEXT</a> TITLE_TEXT <a>AUTHOR_1</a>, <a>AUTHOR_2</a> <a>AUTHOR_1</a>, ' +
            '<a>AUTHOR_2</a> AUTHOR_1, AUTHOR_2 AUTHOR_1, AUTHOR_2 ${ignored}',
        );

        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Work template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          workbody: {
            default: value,
          },
        });
      });
    });

    describe('privacy section', () => {
      let onlyRegisteredCheckbox: MatCheckboxHarness;
      let commentModerationCheckbox: MatCheckboxHarness;
      let commentPermissionRadioGroup: MatRadioGroupHarness;
      let submitButton: MatButtonHarness;
      let resetButton: MatButtonHarness;

      beforeEach(async () => {
        const card = await loader.getHarness(
          MatCardHarness.with({title: 'Privacy template'}),
        );
        const cardContentLoader = await card.getChildLoader(
          MatCardSection.CONTENT,
        );
        onlyRegisteredCheckbox = await cardContentLoader.getHarness(
          MatCheckboxHarness.with({label: 'Only show to registered users'}),
        );
        commentModerationCheckbox = await cardContentLoader.getHarness(
          MatCheckboxHarness.with({label: 'Enable comment moderation'}),
        );
        commentPermissionRadioGroup =
          await cardContentLoader.getHarness(MatRadioGroupHarness);

        const cardActionsLoader = await card.getChildLoader(
          MatCardSection.ACTIONS,
        );

        submitButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Save/}),
        );
        resetButton = await cardActionsLoader.getHarness(
          MatButtonHarness.with({text: /Reset/}),
        );
      });

      it('should display the default values', async () => {
        expect(await onlyRegisteredCheckbox.isChecked()).toBeFalse();
        expect(await commentModerationCheckbox.isChecked()).toBeFalse();
        expect(await commentPermissionRadioGroup.getCheckedValue()).toEqual(
          String(CommentPermissionSetting.REGISTERED_USERS_ONLY),
        );
      });

      it('clicking the reset button resets without saving', async () => {
        await onlyRegisteredCheckbox.check();
        await commentModerationCheckbox.check();
        await commentPermissionRadioGroup.checkRadioButton({
          label: 'No one can comment',
        });

        await resetButton.click();

        expect(await onlyRegisteredCheckbox.isChecked()).toBeFalse();
        expect(await commentModerationCheckbox.isChecked()).toBeFalse();
        expect(await commentPermissionRadioGroup.getCheckedValue()).toEqual(
          String(CommentPermissionSetting.REGISTERED_USERS_ONLY),
        );
      });

      it('can save changed values', async () => {
        await onlyRegisteredCheckbox.check();
        await commentModerationCheckbox.check();
        await commentPermissionRadioGroup.checkRadioButton({
          label: 'No one can comment',
        });

        await submitButton.click();

        const snackBar = await rootLoader.getHarness(MatSnackBarHarness);

        expect(await snackBar.getMessage()).toBe('Privacy template saved');
        expect(setSpy as jasmine.Spy).toHaveBeenCalledOnceWith({
          privacy_template: {
            onlyShowToRegisteredUsers: true,
            enableCommentModeration: true,
            commentPermissionSetting: CommentPermissionSetting.NO_ONE,
          },
        });
      });
    });

    describe('about section', () => {
      let card: MatCardHarness;

      beforeEach(async () => {
        card = await loader.getHarness(MatCardHarness.with({title: 'About'}));
      });

      it('should display the version', async () => {
        expect(await card.getText()).toContain(VERSION);
      });
    });
  });

  class TemplatePreviewHarness extends ComponentHarness {
    static hostSelector = 'pre > code';

    static with(
      options: BaseHarnessFilters,
    ): HarnessPredicate<TemplatePreviewHarness> {
      return new HarnessPredicate(TemplatePreviewHarness, options);
    }

    async getText() {
      return (await this.host()).text();
    }
  }
});
