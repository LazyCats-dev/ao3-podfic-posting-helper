import {setCheckboxState, setInputValue} from './utils.js';

/** @type {HTMLButtonElement} */
const optionsButton = document.getElementById('options_button');

optionsButton.addEventListener('click', () => {
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    window.open(browser.runtime.getURL('options.html'));
  }
});

(async () => {
  const [currentTab] =
      await browser.tabs.query({active: true, currentWindow: true});
  if (currentTab.url !== 'https://archiveofourown.org/works/new') {
    document.querySelector('.page-content').innerHTML =
        `To use this extension go to
        <a
            href="https://archiveofourown.org/works/new"
            target="_blank"
            rel="noopener">
                https://archiveofourown.org/works/new</a>
        and then click on the extension icon again`;
  } else {
    await setupPopup();
  }
})();

async function setupPopup() {
  /** @type {HTMLInputElement} */
  const urlInput = document.getElementById('url-input');
  /** @type {HTMLFormElement} */
  const form = document.getElementById('form');
  /** @type {HTMLInputElement} */
  const podficLabel = document.getElementById('podfic_label');
  /** @type {HTMLInputElement} */
  const podficLengthLabel = document.getElementById('podfic_length_label');
  /** @type {HTMLInputElement} */
  const podficLengthValue = document.getElementById('podfic_length_value');
  /** @type {HTMLInputElement} */
  const transformSummary = document.getElementById('transform_summary');
  /** @type {HTMLInputElement} */
  const transformTitle = document.getElementById('transform_title');
  /** @type {HTMLElement} */
  const urlTextField = document.querySelector('.url-text-field').MDCTextField;
  const snackbar = document.querySelector('.mdc-snackbar').MDCSnackbar;

  // Import pop-up options from storage.

  const {options} = await browser.storage.sync.get('options');

  setInputValue(urlInput, options['url']);
  setCheckboxState(podficLabel, options['podfic_label']);
  setCheckboxState(podficLengthLabel, options['podfic_length_label']);
  setCheckboxState(transformSummary, options['transform_summary']);
  setCheckboxState(transformTitle, options['transform_title']);

  // Podfic length value has special considerations
  const selectElement = document.getElementById('podfic-length-select');
  const selectInputElement = selectElement.querySelector('input');
  setInputValue(selectInputElement, options['podfic_length_value']);
  // For some reason a select is really stupid so we have to find the option
  // with the correct text and click it.
  const optionElements = selectElement.querySelectorAll('.mdc-list-item');
  const optionMatchingValue = Array.from(optionElements)
                                  .find(
                                      option => option.dataset.value ===
                                          options['podfic_length_value']);
  if (optionMatchingValue) {
    optionMatchingValue.click();
  }

  // When the form is submitted, import metadata from original work.
  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    urlTextField.valid = true;
    urlTextField.helperTextContent = '';
    // Save the options, because we won't be able to access them later.

    await browser.storage.sync.set({
      'options': {
        'url': urlInput.value,
        'podfic_label': podficLabel.checked,
        'podfic_length_label': podficLengthLabel.checked,
        'podfic_length_value': podficLengthValue.value,
        'transform_summary': transformSummary.checked,
        'transform_title': transformTitle.checked
      }
    });

    await main();
  });

  // Focus the URL input for a11y.
  urlInput.focus();

  async function main() {
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
     * Strip <p> tags, since AO3 doesn't like them in the summary.
     * @param summary {HtmlElement}
     */
    function sanitizeSummary(summary) {
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
      const rating =
          queryElement(requiredTagsEl, 'span.rating').innerText.trim();
      const categories = queryElement(requiredTagsEl, 'span.category')
                             .innerText.split(',')
                             .map(a => a.trim());

      const superTags = queryElement(work, 'ul.tags.commas');
      const warnings =
          queryElements(superTags, '.warnings').map(a => a.innerText.trim());
      const relationships = queryElements(superTags, '.relationships')
                                .map(a => a.innerText.trim());
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
     * Parse the metadata for the work at this url.
     * @param url {string}
     */
    async function importMetadata(url) {
      let result;
      try {
        /**
         * @callback FetchFn
         * @param url {string}
         * @returns {Promise<Response>}
         */

        /** @type {FetchFn} */
        let fetchFn;
        if (!!window.content && typeof content.fetch === 'function') {
          fetchFn = content.fetch;
        } else {
          fetchFn = window.fetch;
        }
        result = await fetchFn(url);
      } catch (e) {
        urlTextField.valid = false;
        urlTextField.helperTextContent =
            `Failed to fetch the work! ${e.message}`;
        urlTextField.focus();
        return undefined;
      }
      if (!result.ok) {
        urlTextField.valid = false;
        urlTextField.helperTextContent = `Failed to fetch the work! Error: ${
            result.status} ${result.statusText}`;
        urlTextField.focus();
        return undefined;
      }
      const html = await result.text();
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');
      // The "This work could have adult content. If you proceed...." blurb.
      const caution = queryElements(doc, '.caution');
      if (caution.length == 0) {
        // Doc structure for gen pages (or if you're logged in and turned
        // the warning off).
        return parseGenMetadata(doc, url);
      } else {
        // Doc structure for pages with a warning.
        return parseMatureMetadata(doc, url);
      }
    }

    /**
     * Fill in the new work page with the extracted metadata.
     */
    async function fillMetadata() {
      const [tab] =
          await browser.tabs.query({active: true, currentWindow: true});
      await browser.tabs.executeScript(
          tab.id, {file: '/resources/browser-polyfill.min.js'});
      await browser.tabs.executeScript(tab.id, {file: '/inject.js'});
    }

    // The body of this function will be executed as a content script inside the
    // "new work" page.
    async function importAndFillMetadata() {
      const metadata = await importMetadata(urlInput.value);
      if (metadata) {
        await browser.storage.sync.set({metadata});
        await fillMetadata();
        snackbar.open();
      }
    }

    await importAndFillMetadata();
  }
}