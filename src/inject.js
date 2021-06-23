(async () => {
  // Duplicated because they need to exist in the injected script.
  /**
   * Query a (potentially empty) list of HTMLElements
   * @param parent {HTMLElement}
   * @param query {string}
   * @return {HTMLElement[]}
   */
  function queryElements(parent, query) {
    if (parent === undefined) {
      return [];
    }
    return Array.from(parent.querySelectorAll(query));
  }

  /**
   * Query to get the first matching HTMLElement
   * @param parent {HTMLElement}
   * @param query {string}
   * @return {HTMLElement}
   */
  function queryElement(parent, query) {
    return queryElements(parent, query)[0];
  }

  /**
   * Return a map from option text to option value.
   * @param options {HTMLOptionElement[]}
   * @returns {Map<string,string>}
   */
  function mapOptions(options) {
    return queryElements(options, 'option').reduce((total, optionElement) => {
      total.set(optionElement.innerText.trim(), optionElement.value);
      return total;
    }, new Map());
  }

  /**
   * Return a map from input text to input element.
   * @param inputs {HTMLElement[]}
   * @returns {Map<string,HTMLElement>}
   */
  function mapInputs(inputs) {
    return inputs.reduce((total, inputElement) => {
      total.set(inputElement.value.trim(), inputElement);
      return total;
    }, new Map());
  }

  /**
   * @param url {string}
   */
  function canonicalUrl(url) {
    // https://archiveofourown.org/
    if (url.startsWith('http')) {
      return url;
    } else {
      return 'https://archiveofourown.org' + url;
    }
  }

  /**
   * Format a url and some text as a (string) <a> tag.
   * @param url {string}
   * @param text {string}
   * @returns {string}
   */
  function link(url, text) {
    return '<a href="' + canonicalUrl(url) + '">' + text + '</a>';
  }

  /**
   * Transform a summary by wrapping it in a <blockquote> and linking the
   * original work/authors.
   * @param summary {string}
   * @param title {string}
   * @param url {string}
   * @param authors {Map<string,string>}
   * @returns
   */
  function transform(summary, title, url, authors) {
    const newSummary = '<blockquote>' + summary + '</blockquote>Podfic of ' +
        link(url, title) + ' by ';
    const newAuthors =
        Array.from(authors)
            .map(([author, authorUrl]) => (link(authorUrl, author)))
            .join(', ');
    return newSummary + newAuthors + '.';
  }

  /**
   * Sets the value of a tag input, triggering all necessary events.
   * @param inputElement {HTMLInputElement}
   * @param value {string}
   */
  function setTagsInputValue(inputElement, value) {
    const event = new InputEvent('input', {bubbles: true, data: value});
    inputElement.value = value;
    // Replicates the value changing.
    inputElement.dispatchEvent(event);
    // Replicates the user hitting comma.
    inputElement.dispatchEvent(new KeyboardEvent('keydown', {'key': ','}));
  }

  /**
   * Strip <p> tags, since AO3 doesn't like them in the summary.
   * @param {HTMLElement|undefined} summary
   */
  function sanitizeSummary(summary) {
    if (!summary) {
      return '';
    }
    // An opening <p> tag (shouldn't have attributes,
    // but even if it does we can still strip it)
    const pOpen = /\s*<p(\s[^>]*)?>\s*/g;
    // A closing </p> tag
    const pClose = /\s*<\/p>\s*/g;
    const atats = /@@@+/g;
    return summary.innerHTML.replace(pOpen, '@@@')
        .replace(pClose, '@@@')
        .replace(atats, '\n\n')
        .trim();
  }

  /**
   * Transform a list of <a> html elements into a map from link text to link
   * url.
   * @param authors {HTMLElement[]}
   * @returns {Array<[string,string]>}
   */
  function mapAuthors(authors) {
    return Array.from(authors
                          .reduce(
                              (total, authorLink) => {
                                total.set(
                                    authorLink.innerText.trim(),
                                    authorLink.getAttribute('href'));
                                return total;
                              },
                              new Map())
                          .entries());
  }

  /**
   * Parse the metadata from a work page.
   * @param doc {Document}
   * @param url {string}
   * @returns
   */
  function parseGenMetadata(doc, url) {
    const meta = queryElement(doc, '.meta');
    const rating = queryElement(meta, 'dd.rating.tags').innerText.trim();
    const warnings = queryElements(queryElement(meta, 'dd.warning.tags'), 'a')
                         .map(a => a.innerText.trim());
    const relationships =
        queryElements(queryElement(meta, 'dd.relationship.tags'), 'a')
            .map(a => a.innerText.trim());
    const characters =
        queryElements(queryElement(meta, 'dd.character.tags'), 'a')
            .map(a => a.innerText.trim());
    const categories =
        queryElements(queryElement(meta, 'dd.category.tags'), 'a')
            .map(a => a.innerText.trim());
    const fandoms = queryElements(queryElement(meta, 'dd.fandom.tags'), 'a')
                        .map(a => a.innerText.trim());
    const freeformTags =
        queryElements(queryElement(meta, 'dd.freeform.tags'), 'a')
            .map(a => a.innerText.trim());
    const language = queryElement(meta, 'dd.language').innerText.trim();

    const work = doc.getElementById('workskin');
    const title = queryElement(work, 'h2.title').innerText.trim();
    const authors =
        mapAuthors(queryElements(queryElement(work, '.byline'), 'a'));
    // The actual html of the summary, with <p>s replaced.
    const summary = sanitizeSummary(
        queryElement(queryElement(work, 'div.summary.module'), '.userstuff'));

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
      url,
    };
  }

  /**
   * Parse the metadata from an adult work warning page.
   * @param doc {Document}
   * @param url {string}
   * @returns
   */
  function parseMatureMetadata(doc, url) {
    const work = queryElement(doc, '.blurb');

    const headerModule = queryElement(work, 'div.header.module');
    const heading = queryElement(headerModule, 'h4.heading');
    // Note: this is a list of elements where the first element
    // is the title, and the remaining are the authors.
    const titleAndAuthors = queryElements(heading, 'a');
    const title = titleAndAuthors[0].innerText.trim();
    // This removes the title, so the array just contains the authors.
    titleAndAuthors.shift();
    const authors = mapAuthors(titleAndAuthors);
    const fandoms =
        queryElements(queryElement(headerModule, 'h5.fandoms.heading'), 'a')
            .map(a => a.innerText.trim());
    const requiredTagsEl = queryElement(headerModule, 'ul.required-tags');
    const rating = queryElement(requiredTagsEl, 'span.rating').innerText.trim();
    const categories = queryElement(requiredTagsEl, 'span.category')
                           .innerText.split(',')
                           .map(a => a.trim());

    const superTags = queryElement(work, 'ul.tags.commas');
    const warnings =
        queryElements(superTags, '.warnings').map(a => a.innerText.trim());
    const relationships =
        queryElements(superTags, '.relationships').map(a => a.innerText.trim());
    const characters =
        queryElements(superTags, '.characters').map(a => a.innerText.trim());
    const freeformTags =
        queryElements(superTags, '.freeforms').map(a => a.innerText.trim());
    const summary =
        sanitizeSummary(queryElement(work, 'blockquote.userstuff.summary'));
    const language = queryElement(work, 'dd.language').innerText.trim();

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
      url,
    };
  }

  /**
   * @callback FetchFn
   * @param {string} url
   * @param {RequestInit=} init
   * @returns {Promise<Response>}
   */

  /** @type {FetchFn} */
  let fetchFn;
  if (!!window.content && typeof content.fetch === 'function') {
    fetchFn = content.fetch;
  } else {
    fetchFn = window.fetch;
  }

  /**
   * Parse the metadata for the work at this url.
   * @param {string} url
   */
  async function importMetadata(url) {
    // Initially try to get the work without credentials, this handles cases
    // where the user has tags or warnings hidden but can fail if the work
    // the user is importing from is only available to logged-in users.
    let result;
    try {
      result = await fetchFn(url, {credentials: 'omit'});
    } catch (e) {
      return {
        result: 'error',
        message: `Failed to fetch the work! ${e.message}`
      };
    }
    if (!result.ok) {
      return {
        result: 'error',
        message: `Failed to fetch the work! Error: ${result.status} ${
            result.statusText}`
      };
    }

    // If we end up in this case it means that the work was not available to
    // logged out users so we will attempt the fetch again but this time we will
    // forward the user's credentials. If the user has warnings or tags hidden
    // then there will be errors later on but these are handled.
    if (result.redirected) {
      try {
        result = await fetchFn(url, {credentials: 'include'});
      } catch (e) {
        return {
          result: 'error',
          message: `Failed to fetch the work! ${e.message}`
        };
      }
      if (!result.ok) {
        return {
          result: 'error',
          message: `Failed to fetch the work! Error: ${result.status} ${
              result.statusText}`
        };
      }
    }

    const html = await result.text();
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(html, 'text/html');
    // The "This work could have adult content. If you proceed...." blurb.
    const caution = queryElements(doc, '.caution');
    if (caution.length == 0) {
      // Doc structure for gen pages (or if you're logged in and turned
      // the warning off).
      return {
        result: 'success',
        metadata: parseGenMetadata(doc, url),
      };
    } else {
      // Doc structure for pages with a warning.
      return {
        result: 'success',
        metadata: parseMatureMetadata(doc, url),
      };
    }
  }

  async function importAndFillMetadata() {
    let showPartialCompletionWarning = false;
    const {options, workbody} =
        await browser.storage.sync.get(['options', 'workbody']);

    const importResult = await importMetadata(options['url']);

    if (importResult.result === 'error') {
      // Tell the popup that the import failed and the reason why it failed.
      browser.runtime.sendMessage(importResult);
      return;
    }
    const metadata = importResult.metadata;

    const newWorkPage = document.getElementById('main');

    // Find the rating drop down, and pick the correct value.
    const ratingSelect = queryElement(newWorkPage, '#work_rating_string');
    const ratingOptions = mapOptions(ratingSelect);
    ratingSelect.value = ratingOptions.get(metadata['rating']);

    // Find the warning check boxes, and check all the ones that apply.
    const warningBoxes = mapInputs(
        queryElements(queryElement(newWorkPage, 'fieldset.warnings'), 'input'));
    warningBoxes.set(
        'Creator Chose Not To Use Archive Warnings',
        warningBoxes.get('Choose Not To Use Archive Warnings'));
    // Somehow it is possible for the imported metadata to have different
    // warnings than new work form. In this case we just ignore the warning
    // we failed to map.
    for (const warning of metadata['warnings']) {
      if (warningBoxes.has(warning)) {
        warningBoxes.get(warning).checked = true;
      } else {
        showPartialCompletionWarning = true;
      }
    }

    // Find the fandom text input, and insert a comma-separated list of
    // fandoms. Tell ao3 we did so.
    const fandomInput =
        queryElement(queryElement(newWorkPage, 'dd.fandom'), 'input');
    setTagsInputValue(fandomInput, metadata['fandoms'].join(', '));

    // Find the category check boxes, and check all the ones that apply.
    const categoryBoxes = mapInputs(
        queryElements(queryElement(newWorkPage, 'dd.category'), 'input'));
    // Somehow it is possible for the imported metadata to have different
    // categories than new work form. In this case we just ignore the warning
    // we failed to map.
    for (const category of metadata['categories']) {
      if (categoryBoxes.has(category)) {
        categoryBoxes.get(category).checked = true;
      } else {
        showPartialCompletionWarning = true;
      }
    }

    // Find the relationship text input, and insert a comma-separated list
    // of relationships. Tell ao3 we did so.
    const relationshipInput =
        queryElement(queryElement(newWorkPage, 'dd.relationship'), 'input');
    setTagsInputValue(relationshipInput, metadata['relationships'].join(', '));

    // Find the character input, and insert a comma-separated list of
    // characters. Tell ao3 we did so.
    const characterInput =
        queryElement(queryElement(newWorkPage, 'dd.character'), 'input');
    setTagsInputValue(characterInput, metadata['characters'].join(', '));

    // Find the freeform tags input, and insert a comma-separated list of
    // freeform tags. (potentially auto-adding "Podfic" and "Podfic
    // Length" tags) Tell ao3 we did so.
    const additionalTagsInput =
        queryElement(queryElement(newWorkPage, 'dd.freeform'), 'input');
    if (options['podfic_label']) {
      metadata['freeformTags'].push('Podfic');
    }
    if (options['podfic_length_label']) {
      metadata['freeformTags'].push(
          'Podfic Length: ' + options['podfic_length_value']);
    }
    setTagsInputValue(additionalTagsInput, metadata['freeformTags'].join(', '));

    // Set the title.
    const titleInput =
        queryElement(queryElement(newWorkPage, 'dd.title'), 'input');
    if (options['transform_title']) {
      titleInput.value = '[Podfic] ' + metadata['title'];
    } else {
      titleInput.value = metadata['title'];
    }

    // Set the summary, optionally wrapping it in a block quote.
    const summaryTextArea =
        queryElement(queryElement(newWorkPage, 'dd.summary'), 'textarea');
    if (options['transform_summary']) {
      summaryTextArea.value = transform(
          metadata['summary'], metadata['title'], metadata['url'],
          new Map(metadata['authors']));
    } else {
      summaryTextArea.value = metadata['summary'];
    }

    // Set the "inspired by" work url.
    const parentCheckmark =
        queryElement(queryElement(newWorkPage, 'dt.parent'), 'input');
    if (!parentCheckmark.checked) {
      parentCheckmark.click();
    }
    const parentUrl = queryElement(newWorkPage, '#work_parent_attributes_url');
    parentUrl.value = metadata['url'];

    // Set the same language as the original work.
    const languageSelect = queryElement(newWorkPage, '#work_language_id');
    const languageOptions = mapOptions(languageSelect);
    languageSelect.value = languageOptions.get(metadata['language']);

    // Set the new work text.
    const workText = queryElement(newWorkPage, '.mce-editor');
    // If there's nothing here yet, over-write it.
    if (workText.value == '') {
      workText.value = workbody['default'];
    }

    if (showPartialCompletionWarning) {
      browser.runtime.sendMessage({
        result: 'error',
        message:
            'Warning: some data could not be imported, the most likely reason' +
            'is that you set your AO3 preferences to hide warnings or tags',
      });
    } else {
      // Tell the popup that the import worked as expected.
      browser.runtime.sendMessage({
        result: 'success',
      });
    }
  }

  // A cheap way to get a general unhandled error listener.
  try {
    await importAndFillMetadata();
  } catch (e) {
    let debugMessage;
    if (e instanceof Error) {
      debugMessage = `${e.message}: ${e.stack}`;
    } else {
      // Not much we can do here besides just try to coerce this to a string.
      debugMessage = `${e}`;
    }
    browser.runtime.sendMessage({
      result: 'error',
      message:
          `Unhandled error while importing metadata and filling in the form: ${
              debugMessage}`,
    });
  }
})();