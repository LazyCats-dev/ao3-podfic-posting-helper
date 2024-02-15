import type {NotesTemplateData, PopupFormData, TemplateData} from './utils';

(async () => {
  const ACCESS_ERROR_MESSAGE =
    'The selected work appears to be unrevealed or a draft, ' +
    'please contact the work author to get permission to view ' +
    'the work then try again. Error ';

  /**
   * Object representing the data available to the injected script.
   */
  interface InjectedScriptStorageData {
    readonly options: PopupFormData;
    readonly workbody: TemplateData;
    readonly summary_template: TemplateData;
    readonly title_template: TemplateData;
    readonly notes_template: NotesTemplateData;
  }

  // Duplicated because they need to exist in the injected script.
  /**
   * Query a (potentially empty) list of HTMLElements
   */
  function queryElements(parent: ParentNode, query: string): HTMLElement[] {
    if (parent === undefined) {
      return [];
    }
    return Array.from(parent.querySelectorAll(query));
  }

  /**
   * Query to get the first matching HTMLElement
   */
  function queryElement(parent: ParentNode, query: string): HTMLElement {
    return queryElements(parent, query)[0];
  }

  /**
   * Return a map from option text to option value.
   */
  function mapOptions(
    select: HTMLSelectElement | undefined
  ): ReadonlyMap<string, string> {
    return Array.from(select?.querySelectorAll('option') || []).reduce(
      (total, optionElement) => {
        total.set(optionElement.innerText.trim(), optionElement.value);
        return total;
      },
      new Map()
    );
  }

  /**
   * Return a map from input text to input element.
   */
  function mapInputs(
    inputs: HTMLInputElement[]
  ): Map<string, HTMLInputElement> {
    return inputs.reduce((total, inputElement) => {
      total.set(inputElement.value.trim(), inputElement);
      return total;
    }, new Map());
  }

  function canonicalUrl(url: string) {
    // https://archiveofourown.org/
    if (url.startsWith('http')) {
      return url;
    } else {
      return 'https://archiveofourown.org' + url;
    }
  }

  /**
   * Format a url and some text as a (string) <a> tag.
   */
  function link(url: string, text: string) {
    return '<a href="' + canonicalUrl(url) + '">' + text + '</a>';
  }

  /**
   * Transform a summary according to keywords in the template string.
   * Keywords must be wrapped by ${} (e.g. ${title}). Keywords are not
   * case-sensitive, and include:
   *   * blocksummary
   *   * summary
   *   * title
   *   * author
   *   * authors
   */
  function transformHtmlTemplate(
    template: string,
    summary: string,
    title: string,
    url: string,
    authors: ReadonlyMap<string, string>
  ) {
    const titleLink = link(url, title);
    const authorsLinks = Array.from(authors)
      .map(([author, authorUrl]) => link(authorUrl, author))
      .join(', ');
    const authorsText = Array.from(authors)
      .map(([author]) => author)
      .join(', ');
    const blockSummaryText = '<blockquote>' + summary + '</blockquote>';

    let newSummary = template;
    newSummary = newSummary.replaceAll('${blocksummary}', blockSummaryText);
    newSummary = newSummary.replaceAll('${summary}', summary);
    newSummary = newSummary.replaceAll('${title}', titleLink);
    newSummary = newSummary.replaceAll('${title-unlinked}', title);
    newSummary = newSummary.replaceAll('${authors}', authorsLinks);
    newSummary = newSummary.replaceAll('${author}', authorsLinks);
    newSummary = newSummary.replaceAll('${authors-unlinked}', authorsText);
    newSummary = newSummary.replaceAll('${author-unlinked}', authorsText);

    return newSummary;
  }

  /**
   * Transform a title according to keywords in the template string.
   * Keywords must be wrapped by ${} (e.g. ${title}). Keywords are not
   * case-sensitive, and include:
   *   * title
   *   * author
   *   * authors
   */
  function transformTitle(
    template: string,
    title: string,
    authors: ReadonlyMap<string, string>
  ) {
    const authorsText = Array.from(authors)
      .map(([author]) => author)
      .join(', ');

    let newTitle = template;
    newTitle = newTitle.replaceAll('${title}', title);
    newTitle = newTitle.replaceAll('${title-unlinked}', title);
    newTitle = newTitle.replaceAll('${authors}', authorsText);
    newTitle = newTitle.replaceAll('${author}', authorsText);
    newTitle = newTitle.replaceAll('${authors-unlinked}', authorsText);
    newTitle = newTitle.replaceAll('${author-unlinked}', authorsText);

    return newTitle;
  }

  /**
   * Figure out what template to use based on the title options and
   * custom template.
   */
  function getTitleTemplate(titleOption: string, customTemplate: string) {
    switch (titleOption) {
      case 'blank':
        return '';
      case 'orig':
        return '${title}';
      case 'custom':
        return customTemplate;
      default:
        return '[Podfic] ${title}';
    }
  }

  /**
   * Figure out what template to use based on the summary options and
   * custom template.
   */
  function getSummaryTemplate(summaryOption: string, customTemplate: string) {
    switch (summaryOption) {
      case 'blank':
        return '';
      case 'orig':
        return '${summary}';
      case 'custom':
        return customTemplate;
      default:
        return '${blocksummary}Podfic of ${title} by ${authors}.';
    }
  }

  /**
   * Sets the value of a tag input, triggering all necessary events.
   */
  function setTagsInputValue(inputElement: HTMLInputElement, value: string) {
    const event = new InputEvent('input', {bubbles: true, data: value});
    inputElement.value = value;
    // Replicates the value changing.
    inputElement.dispatchEvent(event);
    // Replicates the user hitting comma.
    inputElement.dispatchEvent(new KeyboardEvent('keydown', {key: ','}));
  }

  /**
   * Strip <p> tags, since AO3 doesn't like them in the summary.
   */
  function sanitizeSummary(summary: HTMLElement | undefined) {
    if (!summary) {
      return '';
    }
    // An opening <p> tag (shouldn't have attributes,
    // but even if it does we can still strip it)
    const pOpen = /\s*<p(\s[^>]*)?>\s*/g;
    // A closing </p> tag
    const pClose = /\s*<\/p>\s*/g;
    const atats = /@@@+/g;
    return summary.innerHTML
      .replace(pOpen, '@@@')
      .replace(pClose, '@@@')
      .replace(atats, '\n\n')
      .trim();
  }

  /**
   * Transform a list of <a> html elements into a map from link text (author) to link
   * url (author's user page).
   */
  function mapAuthors(authors: HTMLElement[]): ReadonlyMap<string, string> {
    return authors.reduce((total, authorLink) => {
      // Check that this is actually a link to an
      // author--it could be a giftee.
      if (authorLink.getAttribute('rel') == 'author') {
        total.set(authorLink.innerText.trim(), authorLink.getAttribute('href'));
      }
      return total;
    }, new Map());
  }

  /**
   * Parse the metadata from a work page.
   */
  function parseGenMetadata(doc: Document) {
    const meta = queryElement(doc, '.meta');
    const rating = queryElement(meta, 'dd.rating.tags').innerText.trim();
    const warnings = queryElements(
      queryElement(meta, 'dd.warning.tags'),
      'a'
    ).map(a => a.innerText.trim());
    const relationships = queryElements(
      queryElement(meta, 'dd.relationship.tags'),
      'a'
    ).map(a => a.innerText.trim());
    const characters = queryElements(
      queryElement(meta, 'dd.character.tags'),
      'a'
    ).map(a => a.innerText.trim());
    const categories = queryElements(
      queryElement(meta, 'dd.category.tags'),
      'a'
    ).map(a => a.innerText.trim());
    const fandoms = queryElements(
      queryElement(meta, 'dd.fandom.tags'),
      'a'
    ).map(a => a.innerText.trim());
    const freeformTags = queryElements(
      queryElement(meta, 'dd.freeform.tags'),
      'a'
    )
      .map(a => a.innerText.trim())
      .filter(tag => tag.toLowerCase() !== 'podfic welcome'.toLowerCase());
    const language = queryElement(meta, 'dd.language').innerText.trim();

    const work = doc.getElementById('workskin')!;
    const title = queryElement(work, 'h2.title').innerText.trim();
    const authors = mapAuthors(
      queryElements(queryElement(work, '.byline'), 'a')
    );
    // The actual html of the summary, with <p>s replaced.
    const summary = sanitizeSummary(
      queryElement(queryElement(work, 'div.summary.module'), '.userstuff')
    );

    return {
      title,
      authors,
      rating,
      warnings,
      relationships,
      characters,
      categories,
      fandoms,
      freeformTags,
      language,
      summary,
    };
  }

  /**
   */
  async function importMetadata(url: string) {
    // Attempt to validate the URL.
    const fetchUrl = createUrl(url);
    const response = await fetchWork(fetchUrl, 'omit');

    if (response.redirected) {
      if (response.url.includes('users/login')) {
        return await fetchWithCurrentCreds(fetchUrl, url);
      }
      // We reach this case if we were redirected to a specific chapter and then
      // hit the adult warning page.
      const newUrl = createUrl(response.url);
      const newResponse = await fetchWork(newUrl, 'omit');
      // If we've gotten this far, there are no more error cases.
      return {
        result: 'success',
        // We return back the original URL so that storage only ever contains
        // the URL the user input instead of the one we used for fetching.
        metadata: await parseMetadataFromResponse(newResponse, url),
      };
    }

    const doc = await parseDocFromResponse(response);

    if (looksLikeUnrevealedWork(doc)) {
      return await fetchWithCurrentCreds(fetchUrl, url);
    }

    return {
      result: 'success',
      // We return back the original URL so that storage only ever contains
      // the URL the user input instead of the one we used for fetching.
      metadata: {...parseGenMetadata(doc), url: url},
    };
  }

  /**
   **/
  async function fetchWithCurrentCreds(url: URL, originalUrl: string) {
    const response = await fetchWork(url, 'include');
    const doc = await parseDocFromResponse(response);
    if (response.redirected) {
      // If the user doesn't have access they will be redirected to their
      // profile.
      if (response.url.includes('users/')) {
        throw new Error(ACCESS_ERROR_MESSAGE);
      }
      if (looksLikeAdultWarning(doc)) {
        const redirectUrl = createUrl(response.url);
        const adultWarningBypassResponse = await fetchWork(
          redirectUrl,
          'include'
        );
        // At this point it is impossible to hit an error case.
        return {
          result: 'success',
          // We return back the original URL so that storage only ever contains
          // the URL the user input instead of the one we used for fetching.
          metadata: await parseMetadataFromResponse(
            adultWarningBypassResponse,
            originalUrl
          ),
        };
      }
    }
    if (looksLikeUnrevealedWork(doc)) {
      throw new Error(ACCESS_ERROR_MESSAGE);
    }
    return {
      result: 'success',
      // We return back the original URL so that storage only ever contains
      // the URL the user input instead of the one we used for fetching.
      metadata: {...parseGenMetadata(doc), url: originalUrl},
    };
  }

  /**
   */
  async function parseDocFromResponse(response: Response) {
    const domParser = new DOMParser();
    const html = await response.text();
    return domParser.parseFromString(html, 'text/html');
  }

  /**
   */
  async function parseMetadataFromResponse(
    response: Response,
    originalUrl: string
  ) {
    // We return back the original URL so that storage only ever contains
    // the URL the user input instead of the one we used for fetching.
    const doc = await parseDocFromResponse(response);
    return {...parseGenMetadata(doc), url: originalUrl};
  }

  /**
   */
  function createUrl(url: string) {
    // Attempt to parse the URL
    let fetchUrl: URL;
    try {
      fetchUrl = new URL(url);
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(`Invalid work URL: ${e.message}: ${e.stack}`);
      }
      throw new Error(`Invalid work URL: {${e}}`);
    }
    // Always consent to seeing "adult content" to simplify parsing
    fetchUrl.searchParams.set('view_adult', 'true');
    return fetchUrl;
  }

  /**
   */
  async function fetchWork(url: URL, credentials: RequestCredentials) {
    let result;
    try {
      result = await window.fetch(url, {credentials});
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(`Failed to fetch the work! ${e.message}: ${e.stack}`);
      }
      throw new Error(`Failed to fetch the work! {${e}}`);
    }
    if (!result.ok) {
      throw new Error(
        `Failed to fetch the work! Error: ${result.status} ${result.statusText}`
      );
    }
    return result;
  }

  function looksLikeUnrevealedWork(doc: Document) {
    // The page has a notice saying that the work is yet to be revealed, and
    // there is no user content.
    return (
      Array.from(doc.querySelectorAll('p.notice')).some(notice =>
        notice!.textContent!.includes(
          'This work is part of an ongoing challenge and will ' +
            'be revealed soon'
        )
      ) && !doc.querySelector('#workskin')
    );
  }

  function looksLikeAdultWarning(doc: Document) {
    // The page has a notice saying that the work may contain adult content.
    return Array.from(doc.querySelectorAll('p.caution')).some(notice =>
      notice!.textContent!.includes('This work could have adult content')
    );
  }

  /** */
  async function importAndFillMetadata() {
    let showPartialCompletionWarning = false;
    const {
      options,
      workbody,
      summary_template,
      title_template,
      notes_template,
    }: InjectedScriptStorageData = (await chrome.storage.sync.get([
      'options',
      'workbody',
      'summary_template',
      'title_template',
      'notes_template',
    ])) as InjectedScriptStorageData;

    let importResult;
    try {
      importResult = await importMetadata(options['url']);
    } catch (e: unknown) {
      if (e instanceof Error) {
        return {
          result: 'error',
          message: `${e.stack}`,
        };
      }
      return {
        result: 'error',
        message: `{${e}}`,
      };
    }

    if (importResult.result === 'error') {
      // Tell the popup that the import failed and the reason why it failed.
      return importResult;
    }
    const metadata = importResult.metadata;

    const newWorkPage = document.getElementById('main')!;

    // Find the rating drop down, and pick the correct value.
    const ratingSelect = queryElement(
      newWorkPage,
      '#work_rating_string'
    )! as HTMLSelectElement;
    const ratingOptions = mapOptions(ratingSelect);
    ratingSelect.value = ratingOptions.get(metadata['rating'])!;

    // Find the warning check boxes, and check all the ones that apply.
    const warningBoxes = mapInputs(
      queryElements(
        queryElement(newWorkPage, 'fieldset.warnings'),
        'input'
      ) as HTMLInputElement[]
    );
    warningBoxes.set(
      'Creator Chose Not To Use Archive Warnings',
      warningBoxes.get('Choose Not To Use Archive Warnings')!
    );
    // Somehow it is possible for the imported metadata to have different
    // warnings than new work form. In this case we just ignore the warning
    // we failed to map.
    for (const warning of metadata['warnings']) {
      if (warningBoxes.has(warning)) {
        warningBoxes.get(warning)!.checked = true;
      } else {
        showPartialCompletionWarning = true;
      }
    }

    // Find the fandom text input, and insert a comma-separated list of
    // fandoms. Tell ao3 we did so.
    const fandomInput = queryElement(
      queryElement(newWorkPage, 'dd.fandom'),
      'input'
    ) as HTMLInputElement;
    setTagsInputValue(fandomInput, metadata['fandoms'].join(', '));

    // Find the category check boxes, and check all the ones that apply.
    const categoryBoxes = mapInputs(
      queryElements(
        queryElement(newWorkPage, 'dd.category'),
        'input'
      ) as HTMLInputElement[]
    );
    // Somehow it is possible for the imported metadata to have different
    // categories than new work form. In this case we just ignore the warning
    // we failed to map.
    for (const category of metadata['categories']) {
      if (categoryBoxes.has(category)) {
        categoryBoxes.get(category)!.checked = true;
      } else {
        showPartialCompletionWarning = true;
      }
    }

    // Find the relationship text input, and insert a comma-separated list
    // of relationships. Tell ao3 we did so.
    const relationshipInput = queryElement(
      queryElement(newWorkPage, 'dd.relationship'),
      'input'
    ) as HTMLInputElement;
    setTagsInputValue(relationshipInput, metadata['relationships'].join(', '));

    // Find the character input, and insert a comma-separated list of
    // characters. Tell ao3 we did so.
    const characterInput = queryElement(
      queryElement(newWorkPage, 'dd.character'),
      'input'
    ) as HTMLInputElement;
    setTagsInputValue(characterInput, metadata['characters'].join(', '));

    // Find the freeform tags input, and insert a comma-separated list of
    // freeform tags. (potentially auto-adding "Podfic" and "Podfic
    // Length" tags) Tell ao3 we did so.
    const additionalTagsInput = queryElement(
      queryElement(newWorkPage, 'dd.freeform'),
      'input'
    ) as HTMLInputElement;
    if (options['podfic_label']) {
      metadata['freeformTags'].push('Podfic');
    }
    if (options['podfic_length_label']) {
      metadata['freeformTags'].push(
        'Podfic Length: ' + options['podfic_length_value']
      );
    }
    for (const tagId of options.audioFormatTagOptionIds || []) {
      metadata['freeformTags'].push(
        `Audio Format: ${tagId.replace('audio-format-tag-', '')}`
      );
    }
    setTagsInputValue(additionalTagsInput, metadata['freeformTags'].join(', '));

    // Set the title.
    const titleInput = queryElement(
      queryElement(newWorkPage, 'dd.title'),
      'input'
    ) as HTMLInputElement;
    const titleTemplate = getTitleTemplate(
      options['title_format'],
      title_template['default']
    );
    titleInput.value = transformTitle(
      titleTemplate,
      metadata['title'],
      metadata['authors']
    );

    // Set the summary, optionally wrapping it in a block quote.
    const summaryTextArea = queryElement(
      queryElement(newWorkPage, 'dd.summary'),
      'textarea'
    ) as HTMLTextAreaElement;
    const summaryTemplate = getSummaryTemplate(
      options['summary_format'],
      summary_template['default']
    );
    summaryTextArea.value = transformHtmlTemplate(
      summaryTemplate,
      metadata['summary'],
      metadata['title'],
      metadata['url'],
      metadata['authors']
    );

    const notesTemplate = transformHtmlTemplate(
      notes_template['default'],
      metadata['summary'],
      metadata['title'],
      metadata['url'],
      metadata['authors']
    );
    if (notes_template['begin']) {
      const beginNotesCheckmark = queryElement(
        newWorkPage,
        '#front-notes-options-show'
      ) as HTMLInputElement;
      if (!beginNotesCheckmark.checked) {
        beginNotesCheckmark.click();
      }
      const beginNotesTextArea = queryElement(
        newWorkPage,
        '#work_notes'
      ) as HTMLTextAreaElement;
      beginNotesTextArea.value = notesTemplate;
    }
    if (notes_template['end']) {
      const endNotesCheckmark = queryElement(
        newWorkPage,
        '#end-notes-options-show'
      ) as HTMLInputElement;
      if (!endNotesCheckmark.checked) {
        endNotesCheckmark.click();
      }
      const endNotesTextArea = queryElement(
        newWorkPage,
        '#work_endnotes'
      ) as HTMLTextAreaElement;
      endNotesTextArea.value = notesTemplate;
    }

    // Set the "inspired by" work url.
    const parentCheckmark = queryElement(
      queryElement(newWorkPage, 'dt.parent'),
      'input'
    ) as HTMLInputElement;
    if (!parentCheckmark.checked) {
      parentCheckmark.click();
    }
    const parentUrl = queryElement(
      newWorkPage,
      '#work_parent_work_relationships_attributes_0_url'
    ) as HTMLInputElement;
    parentUrl.value = metadata['url'];

    // Set the same language as the original work.
    const languageSelect = queryElement(
      newWorkPage,
      '#work_language_id'
    ) as HTMLSelectElement;
    const languageOptions = mapOptions(languageSelect);
    languageSelect.value = languageOptions.get(metadata['language'])!;

    // Set the new work text.
    const workText = queryElement(
      newWorkPage,
      '.mce-editor'
    ) as HTMLInputElement;
    // If there's nothing here yet, over-write it.
    if (workText.value == '') {
      workText.value = transformHtmlTemplate(
        workbody['default'],
        metadata['summary'],
        metadata['title'],
        metadata['url'],
        metadata['authors']
      );
    }

    if (showPartialCompletionWarning) {
      return {
        result: 'error',
        message:
          'Warning: some data could not be imported, the most likely reason' +
          'is that you set your AO3 preferences to hide warnings or tags',
      };
    } else {
      // Tell the popup that the import worked as expected.
      return {
        result: 'success',
      };
    }
  }

  // A cheap way to get a general unhandled error listener.
  try {
    return await importAndFillMetadata();
  } catch (e: unknown) {
    let debugMessage;
    if (e instanceof Error) {
      debugMessage = `${e.message}: ${e.stack}`;
    } else {
      // Not much we can do here besides just try to coerce this to a string.
      debugMessage = `${e}`;
    }
    return {
      result: 'error',
      message: `Unhandled error while importing metadata and filling in the form: ${debugMessage}`,
    };
  }
})();
