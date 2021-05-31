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

  const {options, metadata, workbody} =
      await browser.storage.sync.get(['metadata', 'options', 'workbody']);

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
  metadata['warnings'].forEach(
      warning => warningBoxes.get(warning).checked = true);

  // Find the fandom text input, and insert a comma-separated list of
  // fandoms. Tell ao3 we did so.
  const fandomInput =
      queryElement(queryElement(newWorkPage, 'dd.fandom'), 'input');
  setTagsInputValue(fandomInput, metadata['fandoms'].join(', '));

  // Find the category check boxes, and check all the ones that apply.
  const categoryBoxes = mapInputs(
      queryElements(queryElement(newWorkPage, 'dd.category'), 'input'));
  metadata['categories'].forEach(
      category => categoryBoxes.get(category).checked = true);

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
})();