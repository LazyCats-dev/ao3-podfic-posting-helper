import {injectImportAndFillMetadata} from './inject';

describe('injectImportAndFillMetadata', () => {
  let testContent: HTMLElement;

  beforeEach(async () => {
    const response = await fetch('/base/src/app/testdata/new_work_page.html');
    const text = await response.text();
    testContent = document.createElement('div');
    testContent.id = 'test-content';
    testContent.innerHTML = text;
    document.body.appendChild(testContent);
  });

  afterEach(() => {
    document.body.removeChild(testContent);
  });

  it('shows the new work page', () => {
    const header = testContent.querySelector('h2');

    expect(header?.textContent).toBe('Post New Work');
  });

  it('fills the metadata for a work with all metadata', async () => {
    const response = await injectImportAndFillMetadata(
      '/base/src/app/testdata/test_work.html',
      /* podficLabel= */ true,
      /* podficLengthLabel- */ true,
      /* podficLengthValue= */ '20-30 Minutes',
      /* titleFormat= */ 'Title',
      /* summaryFormat= */ 'Summary',
      /* audioFormatTagOptionIds= */ ['1', '2'],
      /* workTemplate= */ 'Work',
      /* userSummaryTemplate= */ 'User Summary',
      /* userTitleTemplate= */ 'User Title',
      /* userNotesTemplate= */ 'User Notes',
      /* beginNotes= */ true,
      /* endNotes= */ true,
    );

    expect(response).toEqual({result: 'success'});
    expect(getImportedWorkMetadata()).toEqual({
      rating: 'General Audiences',
      archiveWarnings: [
        'Graphic Depictions Of Violence',
        'Major Character Death',
      ],
      fandoms: ['Testing', 'ao3 podfic posting helper'],
      categories: ['F/F', 'F/M', 'Gen', 'Other'],
      relationships: ['testing/testing', 'Testing2/Testing2'],
      characters: ['testing - Character', 'Testing2 - Character'],
      additionalTags: [
        'Testing - Freeform',
        'testing2',
        'testing3',
        'Podfic',
        'Podfic Length: 20-30 Minutes',
        'Audio Format: 1',
        'Audio Format: 2',
      ],
      workTitle: '[Podfic] Testing: simple case',
      coCreators: [''],
      summary: jasmine.stringContaining(
        '<blockquote>Work for testing ao3 podfic posting helper',
      ),
      beginNotes: true,
    });
  });

  function getImportedWorkMetadata() {
    const rating = getInputByName('work[rating_string]').value;
    const archiveWarnings = getAllInputsByName(
      'work[archive_warning_strings][]',
    )
      .filter(element => element.checked)
      .map(element => element.value);
    const fandoms = getAutocompleteInputValuesById('work_fandom_autocomplete');
    const categories = getAllInputsByName('work[category_strings][]')
      .filter(element => element.checked)
      .map(element => element.value);
    const relationships = getAutocompleteInputValuesById(
      'work_relationship_autocomplete',
    );
    const characters = getAutocompleteInputValuesById(
      'work_character_autocomplete',
    );
    const additionalTags = getAutocompleteInputValuesById(
      'work_freeform_autocomplete',
    );
    const workTitle = getInputByName('work[title]').value;
    const coCreators = getAutocompleteInputValuesById(
      'pseud_byline_autocomplete',
    );
    const summary = getInputByName('work[summary]').value;
    const beginNotes = (
      getInputByName('front-notes-options-show') as HTMLInputElement
    ).checked;

    return {
      rating,
      archiveWarnings,
      fandoms,
      categories,
      relationships,
      characters,
      additionalTags,
      workTitle,
      coCreators,
      summary,
      beginNotes,
    };
  }

  function getAutocompleteInputValuesById(id: string) {
    return (
      testContent.querySelector(`#${id}`) as HTMLInputElement
    ).value.split(', ');
  }

  function getInputByName(name: string) {
    return testContent.querySelector(`[name="${name}"]`) as
      | HTMLInputElement
      | HTMLSelectElement;
  }

  function getAllInputsByName(name: string) {
    return Array.from(
      testContent.querySelectorAll(`[name="${name}"]`),
    ) as readonly HTMLInputElement[];
  }
});
