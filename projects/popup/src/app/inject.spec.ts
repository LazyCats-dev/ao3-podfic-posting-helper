import {CommentPermissionSetting} from 'common';
import './inject/index';
import './inject/inject';

const MIN_URL = '/assets/work_with_min_metadata.html';
const MIN_URL_FETCHED = MIN_URL + '?view_adult=true';
const MIN_IMPORTED_METADATA = {
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
  parentWorkUrl: '/assets/work_with_min_metadata.html',
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
  commentPermissions: 'disable_anon',
  workText: '',
};
const UNCHANGED_METADATA = {
  rating: 'Not Rated',
  archiveWarnings: [],
  fandoms: [],
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
  isPodifc: false,
  parentWorkUrl: '',
  parentWorkTitle: '',
  parentWorkAuthor: '',
  parentWorkLanguage: '',
  isTranslation: false,
  isPartOfSeries: false,
  hasMultipleChapters: false,
  hasDifferentPublicationDate: false,
  language: '',
  workSkin: '',
  isRestricted: false,
  moderationEnabled: false,
  commentPermissions: 'disable_anon',
  workText: '',
};

describe('injectImportAndFillMetadata', () => {
  let testContent: HTMLElement;
  let fetchSpy: jasmine.Spy<typeof window.fetch>;

  beforeEach(async () => {
    const response = await fetch('/assets/new_work_page.html');
    const text = await response.text();
    testContent = document.createElement('div');
    testContent.id = 'test-content';
    testContent.innerHTML = text;
    document.body.appendChild(testContent);
    fetchSpy = spyOn(window, 'fetch').and.callThrough();
  });

  afterEach(() => {
    document.body.removeChild(testContent);
  });

  it('fills the metadata for a work with minimal metadata', async () => {
    const response = await window.injectImportAndFillMetadata(
      minimalArgs(MIN_URL),
    );

    expect(response).toEqual({result: 'success'});
    expect(getImportedWorkMetadata()).toEqual(MIN_IMPORTED_METADATA);
    expect(fetchSpy).toHaveBeenCalledOnceWith(MIN_URL_FETCHED, {
      credentials: 'omit',
    });
  });

  it('fills the metadata for using the original title and summary', async () => {
    const response = await window.injectImportAndFillMetadata({
      ...minimalArgs(MIN_URL),
      titleFormat: 'orig',
      summaryFormat: 'orig',
    });

    expect(response).toEqual({result: 'success'});
    expect(getImportedWorkMetadata()).toEqual({
      ...MIN_IMPORTED_METADATA,
      workTitle: 'Test',
      summary: 'Summary',
    });
    expect(fetchSpy).toHaveBeenCalledOnceWith(MIN_URL_FETCHED, {
      credentials: 'omit',
    });
  });

  it('fills the metadata for using the default title and summary', async () => {
    const response = await window.injectImportAndFillMetadata({
      ...minimalArgs(MIN_URL),
      titleFormat: 'anything',
      summaryFormat: 'anything',
    });

    expect(response).toEqual({result: 'success'});
    expect(getImportedWorkMetadata()).toEqual({
      ...MIN_IMPORTED_METADATA,
      workTitle: '[Podfic] Test',
      summary: jasmine.stringContaining(
        '<blockquote>Summary</blockquote>Podfic of <a href',
      ),
    });

    expect(fetchSpy).toHaveBeenCalledOnceWith(MIN_URL_FETCHED, {
      credentials: 'omit',
    });
  });

  it('fills the metadata for a work with max metadata', async () => {
    const fullTemplate =
      '${blocksummary} ${summary} ${title} ${title-unlinked} ${authors} ${authors-unlinked}';
    const response = await window.injectImportAndFillMetadata({
      url: '/assets/work_with_max_metadata.html',
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
      onlyShowToRegisteredUsers: true,
      enableCommentModeration: true,
      commentPermissionSetting: CommentPermissionSetting.NO_ONE,
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
      parentWorkUrl: '/assets/work_with_max_metadata.html',
      parentWorkTitle: '',
      parentWorkAuthor: '',
      parentWorkLanguage: '',
      isTranslation: false,
      isPartOfSeries: false,
      hasMultipleChapters: false,
      hasDifferentPublicationDate: false,
      language: '7', // Deutsch
      workSkin: '',
      isRestricted: true,
      moderationEnabled: true,
      commentPermissions: 'disable_all',
      workText: jasmine.stringContaining(
        'Work: <blockquote>Work for testing ao3 podfic posting helper',
      ),
    });
    expect(fetchSpy).toHaveBeenCalledOnceWith(
      '/assets/work_with_max_metadata.html?view_adult=true',
      {credentials: 'omit'},
    );
  });

  it('returns an error if fetch throws', async () => {
    fetchSpy.and.rejectWith(new Error('I always get the shemp'));

    const response = await window.injectImportAndFillMetadata(
      minimalArgs(MIN_URL),
    );

    expect(response).toEqual({
      result: 'error',
      message: jasmine.stringContaining(
        'Error: Failed to fetch the work! I always get the shemp',
      ),
    });
    expect(fetchSpy).toHaveBeenCalledOnceWith(MIN_URL_FETCHED, {
      credentials: 'omit',
    });
  });

  it('returns an error if the work does not exist', async () => {
    const response = await window.injectImportAndFillMetadata(
      minimalArgs('/does/not/exist'),
    );
    expect(response).toEqual({
      result: 'error',
      message: jasmine.stringContaining(
        'Error: Failed to fetch the work! Error: 404 Not Found',
      ),
    });
    expect(getImportedWorkMetadata()).toEqual(UNCHANGED_METADATA);
    expect(fetchSpy).toHaveBeenCalledOnceWith(
      '/does/not/exist?view_adult=true',
      {credentials: 'omit'},
    );
  });

  it('returns an error if the new work page is broken', async () => {
    testContent.innerHTML = '<marquee>I always get the shemp</marquee>';
    const response = await window.injectImportAndFillMetadata(
      minimalArgs(MIN_URL),
    );

    expect(response).toEqual({
      result: 'error',
      message: jasmine.stringContaining(
        'Unhandled error while importing metadata',
      ),
    });
    expect(fetchSpy).toHaveBeenCalledOnceWith(MIN_URL_FETCHED, {
      credentials: 'omit',
    });
  });

  it('partially fills the form and returns an error if user is hiding tags and categories', async () => {
    const url = '/assets/work_with_min_metadata_hidden_warnings_and_tags.html';
    const response = await window.injectImportAndFillMetadata(minimalArgs(url));

    expect(response).toEqual({
      result: 'error',
      message:
        'Warning: some data could not be imported, the most likely reasonis that you set your AO3' +
        ' preferences to hide warnings or tags',
    });
    expect(getImportedWorkMetadata()).toEqual({
      ...MIN_IMPORTED_METADATA,
      archiveWarnings: [],
      additionalTags: ['Show additional tags'],
      parentWorkUrl: url,
    });
    expect(fetchSpy).toHaveBeenCalledOnceWith(url + '?view_adult=true', {
      credentials: 'omit',
    });
  });

  it('follows the first redirection if login is not required', async () => {
    fetchSpy
      .withArgs(MIN_URL_FETCHED, {credentials: 'omit'})
      .and.callFake(() => {
        // This is a terrible thing to do but we don't have a good way let the next call get
        // the real text.
        fetchSpy
          .withArgs(MIN_URL_FETCHED, {credentials: 'omit'})
          .and.callThrough();
        return Promise.resolve({
          redirected: true,
          url: MIN_URL,
          ok: true,
          text: () => Promise.resolve(''),
        } as Response);
      });

    const response = await window.injectImportAndFillMetadata(
      minimalArgs(MIN_URL),
    );
    expect(response).toEqual({result: 'success'});
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
      credentials: 'omit',
    });
    expect(getImportedWorkMetadata()).toEqual(MIN_IMPORTED_METADATA);
  });

  it('fetches the work with creds if the work is unrevealed', async () => {
    fetchSpy.withArgs(MIN_URL_FETCHED, {credentials: 'omit'}).and.callFake(() =>
      // Load the unrevealed work from the test data.
      fetch('/assets/unrevealed_work.html'),
    );
    const response = await window.injectImportAndFillMetadata(
      minimalArgs(MIN_URL),
    );
    expect(response).toEqual({result: 'success'});
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
      credentials: 'omit',
    });
    expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
      credentials: 'include',
    });
    expect(getImportedWorkMetadata()).toEqual(MIN_IMPORTED_METADATA);
  });

  describe('when the work is only available to logged in users', () => {
    beforeEach(() => {
      fetchSpy.withArgs(MIN_URL_FETCHED, {credentials: 'omit'}).and.resolveTo({
        redirected: true,
        url: 'https://archiveofourown.org/users/login',
        ok: true,
        text: () => Promise.resolve(''),
      } as Response);
    });

    it('tries again with the user credentials', async () => {
      const response = await window.injectImportAndFillMetadata(
        minimalArgs(MIN_URL),
      );
      expect(response).toEqual({result: 'success'});
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'omit',
      });
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'include',
      });
      expect(getImportedWorkMetadata()).toEqual(MIN_IMPORTED_METADATA);
    });

    it('returns an error if the user does not have access to the work', async () => {
      fetchSpy
        .withArgs(MIN_URL_FETCHED, {credentials: 'include'})
        .and.resolveTo({
          redirected: true,
          url: 'https://archiveofourown.org/users/jermowery',
          ok: true,
          text: () => Promise.resolve(''),
        } as Response);

      const response = await window.injectImportAndFillMetadata(
        minimalArgs(MIN_URL),
      );

      expect(response).toEqual({
        result: 'error',
        message: jasmine.stringContaining('please contact the work author'),
      });
      expect(getImportedWorkMetadata()).toEqual(UNCHANGED_METADATA);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'omit',
      });
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'include',
      });
    });

    it('returns an error if the work has not been revealed', async () => {
      fetchSpy
        .withArgs(MIN_URL_FETCHED, {credentials: 'include'})
        .and.callFake(() =>
          // Load the unrevealed work from the test data.
          fetch('/assets/unrevealed_work.html'),
        );

      const response = await window.injectImportAndFillMetadata(
        minimalArgs(MIN_URL),
      );

      expect(response).toEqual({
        result: 'error',
        message: jasmine.stringContaining('please contact the work author'),
      });
      expect(getImportedWorkMetadata()).toEqual(UNCHANGED_METADATA);
      // 2 times because we call it once.
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'omit',
      });
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'include',
      });
    });

    it('imports the metadata if the redirection leads to the adult warning page', async () => {
      fetchSpy
        .withArgs(MIN_URL_FETCHED, {credentials: 'include'})
        .and.callFake(() => {
          // This is a terrible thing to do but we don't have a good way let the next call get
          // the real text.
          fetchSpy
            .withArgs(MIN_URL_FETCHED, {credentials: 'include'})
            .and.callThrough();
          return Promise.resolve({
            redirected: true,
            url: MIN_URL,
            ok: true,
            text: () =>
              fetch('/assets/adult_warning_page.html').then(response =>
                response.text(),
              ),
          } as Response);
        });

      const response = await window.injectImportAndFillMetadata(
        minimalArgs(MIN_URL),
      );
      expect(response).toEqual({result: 'success'});
      expect(fetchSpy).toHaveBeenCalledTimes(4);
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'omit',
      });
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'include',
      });
      expect(getImportedWorkMetadata()).toEqual(MIN_IMPORTED_METADATA);
    });

    it('returns an error if the work has not been revealed after a redirect', async () => {
      fetchSpy
        .withArgs(MIN_URL_FETCHED, {credentials: 'include'})
        .and.callFake(() => {
          // This is a terrible thing to do but we don't have a good way let the next call get
          // the real text.
          fetchSpy
            .withArgs(MIN_URL_FETCHED, {credentials: 'include'})
            .and.callThrough();
          return Promise.resolve({
            redirected: true,
            url: MIN_URL,
            ok: true,
            text: () =>
              fetch('/assets/unrevealed_work.html').then(response =>
                response.text(),
              ),
          } as Response);
        });

      const response = await window.injectImportAndFillMetadata(
        minimalArgs(MIN_URL),
      );
      expect(response).toEqual({
        result: 'error',
        message: jasmine.stringContaining('please contact the work author'),
      });
      expect(getImportedWorkMetadata()).toEqual(UNCHANGED_METADATA);
      // 2 times because we call it once.
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'omit',
      });
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'include',
      });
    });

    it('imports the metadata if the redirection leads to a real work', async () => {
      fetchSpy
        .withArgs(MIN_URL_FETCHED, {credentials: 'include'})
        .and.resolveTo({
          redirected: true,
          url: 'https://archiveofourown.org/some/other/work/',
          ok: true,
          text: () => fetch(MIN_URL).then(response => response.text()),
        } as Response);

      const response = await window.injectImportAndFillMetadata(
        minimalArgs(MIN_URL),
      );
      expect(response).toEqual({result: 'success'});
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'omit',
      });
      expect(fetchSpy).toHaveBeenCalledWith(MIN_URL_FETCHED, {
        credentials: 'include',
      });
      expect(getImportedWorkMetadata()).toEqual(MIN_IMPORTED_METADATA);
    });
  });

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
      onlyShowToRegisteredUsers: false,
      enableCommentModeration: false,
      commentPermissionSetting: CommentPermissionSetting.REGISTERED_USERS_ONLY,
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
      document.getElementById('work_restricted') as HTMLInputElement
    ).checked;
    const moderationEnabled = (
      document.getElementById(
        'work_moderated_commenting_enabled',
      ) as HTMLInputElement
    ).checked;
    const commentPermissions = getAllInputsByName(
      'work[comment_permissions]',
    ).filter(element => element.checked)[0].value;
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
