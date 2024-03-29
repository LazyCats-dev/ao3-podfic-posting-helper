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

  it('fills the metadata for a work with minimal metadata', async () => {
    const response = await injectImportAndFillMetadata(
      minimalArgs('/base/src/app/testdata/work_with_min_metadata.html'),
    );

    expect(response).toEqual({result: 'success'});
    expect(getImportedWorkMetadata()).toEqual({
      rating: 'Not Rated',
      archiveWarnings: ['Choose Not To Use Archive Warnings'],
      fandoms: ['Testing'],
      categories: [],
      relationships: [],
      characters: [],
      additionalTags: [],
      workTitle: '',
      coCreators: [],
      summary: '',
      useBeginNotes: false,
      beginNotes: '',
      useEndNotes: false,
      endNotes: '',
      collections: [],
      workRecipients: [],
      isPodifc: true,
      parentWorkUrl: '/base/src/app/testdata/work_with_min_metadata.html',
      parentWorkTitle: '',
      parentWorkAuthor: '',
      parentWorkLanguage: '',
      isTranslation: false,
      isPartOfSeries: false,
      hasMultipleChapters: false,
      hasDifferentPublicationDate: false,
      language: '1', // English
      workSkin: '',
      isRestricted: false,
      moderationEnabled: false,
      commentPermissions: 'enable_all',
      workText: '',
    });
  });

  it('fills the metadata for a work with max metadata', async () => {
    const fullTemplate =
      '${blocksummary} ${summary} ${title} ${title-unlinked} ${authors} ${authors-unlinked}';
    const response = await injectImportAndFillMetadata({
      url: '/base/src/app/testdata/work_with_max_metadata.html',
      podficLabel: true,
      podficLengthLabel: true,
      podficLengthValue: '20-30 Minutes',
      titleFormat: 'custom',
      summaryFormat: 'custom',
      audioFormatTagOptionIds: ['1', '2'],
      workTemplate: 'Work: ' + fullTemplate,
      userSummaryTemplate: 'Summary: ' + fullTemplate,
      userTitleTemplate:
        '${title} ${authors} ${title-unlinked} ${author} ${authors-unlinked} ${author-unlinked}',
      userNotesTemplate: 'Notes: ' + fullTemplate,
      beginNotes: true,
      endNotes: true,
    });

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
      workTitle:
        'Testing: simple case jermowery Testing: simple case jermowery jermowery jermowery',
      coCreators: [],
      summary: jasmine.stringContaining(
        'Summary: <blockquote>Work for testing ao3 podfic posting helper',
      ),
      useBeginNotes: true,
      beginNotes: jasmine.stringContaining(
        'Notes: <blockquote>Work for testing ao3 podfic posting helper',
      ),
      useEndNotes: true,
      endNotes: jasmine.stringContaining(
        'Notes: <blockquote>Work for testing ao3 podfic posting helper',
      ),
      collections: [],
      workRecipients: [],
      isPodifc: true,
      parentWorkUrl: '/base/src/app/testdata/work_with_max_metadata.html',
      parentWorkTitle: '',
      parentWorkAuthor: '',
      parentWorkLanguage: '',
      isTranslation: false,
      isPartOfSeries: false,
      hasMultipleChapters: false,
      hasDifferentPublicationDate: false,
      language: '7', // Deutsch
      workSkin: '',
      isRestricted: false,
      moderationEnabled: false,
      commentPermissions: 'enable_all',
      workText: jasmine.stringContaining(
        'Work: <blockquote>Work for testing ao3 podfic posting helper',
      ),
    });
  });

  it('returns an error if the work does not exist', async () => {
    const response = await injectImportAndFillMetadata(
      minimalArgs('/does/not/exist'),
    );
    expect(response).toEqual({
      result: 'error',
      message: jasmine.stringContaining(
        'Error: Failed to fetch the work! Error: 404 Not Found',
      ),
    });
  });

  it('tries again when the work requires the user to be logged in', async () => {});

  function minimalArgs(url: string) {
    return {
      url,
      podficLabel: false,
      podficLengthLabel: false,
      podficLengthValue: '',
      titleFormat: 'blank',
      summaryFormat: 'blank',
      audioFormatTagOptionIds: [],
      workTemplate: '',
      userSummaryTemplate: '',
      userTitleTemplate: '',
      userNotesTemplate: '',
      beginNotes: false,
      endNotes: false,
    };
  }

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
    const useBeginNotes = (
      getInputByName('front-notes-options-show') as HTMLInputElement
    ).checked;
    const beginNotes = getInputByName('work[notes]').value;
    const useEndNotes = (
      getInputByName('end-notes-options-show') as HTMLInputElement
    ).checked;
    const endNotes = getInputByName('work[endnotes]').value;
    const collections = getAutocompleteInputValuesById(
      'work_collection_names_autocomplete',
    );
    const workRecipients = getAutocompleteInputValuesById(
      'work_recipients_autocomplete',
    );
    const isPodifc = (getInputByName('parent-options-show') as HTMLInputElement)
      .checked;
    const parentWorkUrl = getInputByName(
      'work[parent_work_relationships_attributes][0][url]',
    ).value;
    const parentWorkTitle = getInputByName(
      'work[parent_work_relationships_attributes][0][title]',
    ).value;
    const parentWorkAuthor = getInputByName(
      'work[parent_work_relationships_attributes][0][author]',
    ).value;
    const parentWorkLanguage = getInputByName(
      'work[parent_work_relationships_attributes][0][language_id]',
    ).value;
    const isTranslation = (
      getInputByName(
        'work[parent_work_relationships_attributes][0][translation]',
      ) as HTMLInputElement
    ).checked;
    const isPartOfSeries = (
      getInputByName('series-options-show') as HTMLInputElement
    ).checked;
    const hasMultipleChapters = (
      getInputByName('chapters-options-show') as HTMLInputElement
    ).checked;
    const hasDifferentPublicationDate = (
      getInputByName('work[backdate]') as HTMLInputElement
    ).checked;
    const language = getInputByName('work[language_id]').value;
    const workSkin = getInputByName('work[work_skin_id]').value;
    const isRestricted = (
      getInputByName('work[restricted]') as HTMLInputElement
    ).checked;
    const moderationEnabled = (
      getInputByName('work[moderated_commenting_enabled]') as HTMLInputElement
    ).checked;
    const commentPermissions = getInputByName(
      'work[comment_permissions]',
    ).value;
    const workText = getInputByName('work[chapter_attributes][content]').value;

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
      useBeginNotes,
      beginNotes,
      useEndNotes,
      endNotes,
      collections,
      workRecipients,
      isPodifc,
      parentWorkUrl,
      parentWorkTitle,
      parentWorkAuthor,
      parentWorkLanguage,
      isTranslation,
      isPartOfSeries,
      hasMultipleChapters,
      hasDifferentPublicationDate,
      language,
      workSkin,
      isRestricted,
      moderationEnabled,
      commentPermissions,
      workText,
    };
  }

  function getAutocompleteInputValuesById(
    id: string,
  ): undefined | readonly string[] {
    const valueString = (
      testContent.querySelector(`#${id}`) as HTMLInputElement
    ).value;

    if (!valueString) {
      return [];
    }
    return valueString.split(', ');
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
