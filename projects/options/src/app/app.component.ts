import {Component, inject} from '@angular/core';
import {MatButton, MatIconAnchor} from '@angular/material/button';
import {MatToolbar, MatToolbarRow} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import {
  MatNavList,
  MatListItem,
  MatListItemIcon,
  MatListItemTitle,
} from '@angular/material/list';
import {MatDivider} from '@angular/material/divider';
import {
  MatCard,
  MatCardActions,
  MatCardAvatar,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatCheckbox} from '@angular/material/checkbox';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
} from '@angular/forms';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {default as sanitize, default as sanitizeHtml} from 'sanitize-html';
import {map, startWith} from 'rxjs/operators';
import {HighlightModule} from 'ngx-highlightjs';
import {MonoTypeOperatorFunction, pipe} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {INITIAL_FORM_VALUES} from './utils';

const SANITIZE_HTML_OPTIONS: sanitize.IOptions = {
  allowedTags: [
    'a',
    'abbr',
    'acronym',
    'address',
    'audio',
    'b',
    'big',
    'blockquote',
    'br',
    'caption',
    'center',
    'cite',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'dfn',
    'div',
    'dl',
    'dt',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'iframe',
    'img',
    'ins',
    'kbd',
    'li',
    'ol',
    'p',
    'pre',
    'q',
    's',
    'samp',
    'small',
    'span',
    'strike',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'tt',
    'u',
    'ul',
    'var',
  ],
  allowedAttributes: {
    '*': [
      'rel',
      'alt',
      'crossorigin',
      'preload',
      'href',
      'src',
      'height',
      'width',
      'controls',
    ],
  },
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AsyncPipe,
    HighlightModule,
    MatButton,
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCheckbox,
    MatDivider,
    MatError,
    MatFormField,
    MatIcon,
    MatIconAnchor,
    MatInput,
    MatLabel,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatNavList,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatSnackBarModule,
    MatToolbar,
    MatToolbarRow,
    ReactiveFormsModule,
    MatSnackBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly initialFormValues = inject(INITIAL_FORM_VALUES);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly version = chrome.runtime.getManifest().version;

  protected readonly titleTemplateFormGroup = new FormGroup({
    template: new FormControl<string>(this.initialFormValues.titleTemplate, {
      nonNullable: true,
      validators: control => {
        if (isHtml(control.value)) {
          return {html: true};
        }
        return null;
      },
    }),
  });

  protected readonly titleTemplatePreview =
    this.titleTemplateFormGroup.controls.template.valueChanges.pipe(
      startWith(this.titleTemplateFormGroup.controls.template.value),
      map(value =>
        value
          .replaceAll('${title}', 'TITLE_TEXT')
          .replaceAll('${title-unlinked}', 'TITLE_TEXT')
          .replaceAll('${authors}', 'AUTHOR_1, AUTHOR_2')
          .replaceAll('${author}', 'AUTHOR_1, AUTHOR_2')
          .replaceAll('${authors-unlinked}', 'AUTHOR_1, AUTHOR_2')
          .replaceAll('${author-unlinked}', 'AUTHOR_1, AUTHOR_2'),
      ),
    );

  protected readonly workTemplateFormGroup = new FormGroup({
    template: new FormControl<string>(this.initialFormValues.workTemplate, {
      nonNullable: true,
      validators: isValidAo3ValidHtmlValidator,
    }),
  });

  protected readonly workTemplatePreview =
    this.workTemplateFormGroup.controls.template.valueChanges.pipe(
      startWith(this.workTemplateFormGroup.controls.template.value),
      mapToSanitizedHtml(),
    );

  protected readonly summaryTemplateFormGroup = new FormGroup({
    template: new FormControl<string>(this.initialFormValues.summaryTemplate, {
      nonNullable: true,
      validators: isValidAo3ValidHtmlValidator,
    }),
  });

  protected readonly summaryTemplatePreview =
    this.summaryTemplateFormGroup.controls.template.valueChanges.pipe(
      startWith(this.summaryTemplateFormGroup.controls.template.value),
      mapToSanitizedHtml(),
    );

  protected readonly notesTemplateFormGroup = new FormGroup({
    template: new FormControl<string>(this.initialFormValues.notesTemplate, {
      nonNullable: true,
      validators: isValidAo3ValidHtmlValidator,
    }),
    beginningNotes: new FormControl<boolean>(
      this.initialFormValues.beginningNotes,
      {nonNullable: true},
    ),
    endNotes: new FormControl<boolean>(this.initialFormValues.endNotes, {
      nonNullable: true,
    }),
  });

  protected readonly notesTemplatePreview =
    this.notesTemplateFormGroup.controls.template.valueChanges.pipe(
      startWith(this.notesTemplateFormGroup.controls.template.value),
      mapToSanitizedHtml(),
    );

  protected resetTitleTemplate(event: Event): void {
    event.preventDefault();
    this.titleTemplateFormGroup.controls.template.setValue('[Podfic] ${title}');
  }

  protected async saveTitleTemplate(): Promise<void> {
    await chrome.storage.sync.set({
      title_template: {
        default: this.titleTemplateFormGroup.controls.template.value,
      },
    });
    this.snackBar.open('Title template saved');
  }

  protected resetSummaryTemplate(event: Event): void {
    event.preventDefault();
    this.summaryTemplateFormGroup.controls.template.setValue(
      '${blocksummary}Podfic of ${title} by ${authors}.',
    );
  }

  protected async saveSummaryTemplate(): Promise<void> {
    await chrome.storage.sync.set({
      summary_template: {
        default: this.summaryTemplateFormGroup.controls.template.value,
      },
    });
    this.snackBar.open('Summary template saved');
  }

  protected resetNotesTemplate(event: Event): void {
    event.preventDefault();
    this.notesTemplateFormGroup.controls.template.setValue('');
    this.notesTemplateFormGroup.controls.beginningNotes.setValue(false);
    this.notesTemplateFormGroup.controls.endNotes.setValue(false);
  }

  protected async saveNotesTemplate(): Promise<void> {
    await chrome.storage.sync.set({
      notes_template: {
        default: this.notesTemplateFormGroup.controls.template.value,
        begin: this.notesTemplateFormGroup.controls.beginningNotes.value,
        end: this.notesTemplateFormGroup.controls.endNotes.value,
      },
    });
    this.snackBar.open('Notes template saved');
  }

  protected async saveWorkTemplate(): Promise<void> {
    await chrome.storage.sync.set({
      workbody: {
        default: this.workTemplateFormGroup.controls.template.value,
      },
    });
    this.snackBar.open('Work template saved');
  }
}

function mapToSanitizedHtml(): MonoTypeOperatorFunction<string> {
  return pipe(
    map(value =>
      sanitizeHtml(
        value
          .replaceAll(
            '${blocksummary}',
            '<blockquote>BLOCK_SUMMARY_TEXT</blockquote>',
          )
          .replaceAll('${summary}', 'SUMMARY_TEXT')
          .replaceAll('${title}', '<a>TITLE_TEXT</a>')
          .replaceAll('${title-unlinked}', 'TITLE_TEXT')
          .replaceAll('${authors}', '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>')
          .replaceAll('${author}', '<a>AUTHOR_1</a>, <a>AUTHOR_2</a>')
          .replaceAll('${authors-unlinked}', 'AUTHOR_1, AUTHOR_2')
          .replaceAll('${author-unlinked}', 'AUTHOR_1, AUTHOR_2'),
        SANITIZE_HTML_OPTIONS,
      ),
    ),
  );
}

function isHtml(str: string) {
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

const DOM_PARSER = new DOMParser();

function isValidAo3Html(html: string) {
  const sanitized = sanitizeHtml(html.trim(), SANITIZE_HTML_OPTIONS);
  const userDocument = DOM_PARSER.parseFromString(html.trim(), 'text/html');
  const sanitizedDocument = DOM_PARSER.parseFromString(sanitized, 'text/html');
  return (
    userDocument.documentElement.innerHTML ===
    sanitizedDocument.documentElement.innerHTML
  );
}

const isValidAo3ValidHtmlValidator: ValidatorFn = control => {
  if (!control.value || isValidAo3Html(control.value)) {
    return null;
  }
  return {invalidAo3Html: true};
};
