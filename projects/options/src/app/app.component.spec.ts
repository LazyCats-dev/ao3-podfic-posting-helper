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

const VERSION = 'version-shemp';

describe('AppComponent', () => {
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
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AppComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
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
  });

  describe('with no saved values', () => {
    let loader: HarnessLoader;
    let rootLoader: HarnessLoader;
    let fixture: ComponentFixture<AppComponent>;
    let setSpy: jasmine.Spy<typeof chrome.storage.sync.set>;

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
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AppComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

      const storageSpy = jasmine.createSpyObj<typeof chrome.storage>(
        'chrome.storage',
        ['sync'],
      );
      const syncSpy = jasmine.createSpyObj<typeof chrome.storage.sync>(
        'chrome.storage.sync',
        ['set'],
      );
      storageSpy.sync = syncSpy;
      setSpy = syncSpy.set.and.resolveTo(undefined);
      chrome.storage = storageSpy;
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

        expect(await input.getValue()).toBe('[Podfic] ${title}');
        expect(await preview.getText()).toBe('[Podfic] TITLE_TEXT');
        expect(setSpy).not.toHaveBeenCalled();
      });

      it('entering html shows a warning', async () => {
        await input.setValue('<b>bold</b>');
        await input.blur();

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

        expect(await input.getValue()).toBe('');
        expect(await preview.getText()).toBe('');
        expect(setSpy).not.toHaveBeenCalled();
      });

      it('entering invalid ao3 html shows a warning', async () => {
        await input.setValue('<b>bold</b><video>video</video>');
        await input.blur();

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
