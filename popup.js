import {
    getOptionsWithDefaults,
    savePopUpOptions
} from './option-saver.js';

/** @type {HTMLInputElement} */
const urlInput = document.getElementById("url-input");
/** @type {HTMLFormElement} */
const form = document.getElementById("form");
/** @type {HTMLInputElement} */
const podficLabel = document.getElementById("podfic_label");
/** @type {HTMLInputElement} */
const podficLengthLabel = document.getElementById("podfic_length_label");
/** @type {HTMLInputElement} */
const podficLengthValue = document.getElementById("podfic_length_value");
/** @type {HTMLInputElement} */
const transformSummary = document.getElementById("transform_summary");
/** @type {HTMLInputElement} */
const transformTitle = document.getElementById("transform_title");
const importButton = document.getElementById("import");

// Import pop-up options from storage.
getOptionsWithDefaults((options) => {
    setInputValue(urlInput, options['url']);
    podficLabel.checked = options['podfic_label'];
    podficLengthLabel.checked = options['podfic_length_label'];
    setInputValue(podficLengthValue, options['podfic_length_value']);
    podficLengthValue.value = options['podfic_length_value'];
    transformSummary.checked = options['transform_summary'];
    transformTitle.checked = options['transform_title'];

    // Podfic length value has special considerations
    const selectElement = document.getElementById("podfic-length-select");
    const selectInputElement = selectElement.querySelector('input');
    setInputValue(selectInputElement, options['podfic_length_value']);
    // For some reason a select is really stupid so we have to find the option
    // with the correct text and click it.
    const optionElements = selectElement.querySelectorAll(".mdc-list-item");
    const optionMatchingValue = Array.from(optionElements).find(option => option.dataset.value === options['podfic_length_value']);
    if (optionMatchingValue) {
        optionMatchingValue.click();
    }
});

// When the button is clicked, import metadata from original work.
form.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    // Save the options, because we won't be able to access them later.
    savePopUpOptions({
        'url': urlInput.value,
        'podfic_label': podficLabel.checked,
        'podfic_length_label': podficLengthLabel.checked,
        'podfic_length_value': podficLengthValue.value,
        'transform_summary': transformSummary.checked,
        'transform_title': transformTitle.checked
    });

    chrome.scripting.executeScript({
        target: {
            tabId: tab.id
        },
        // main just waits for importAndFillMetadata
        function: main,
    });
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
     * @param url {string}
     */
    function canonicalUrl(url) {
        //https://archiveofourown.org/
        if (url.startsWith("http")) {
            return url;
        } else {
            return "https://archiveofourown.org" + url;
        }
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
        return summary.innerHTML
            .replace(pOpen, "@@@")
            .replace(pClose, "@@@")
            .replace(atats, "\n\n")
            .trim();
    }

    /**
     * Transform a list of <a> html elements into a map from link text to link url.
     * @param authors {HTMLElement[]}
     * @returns {Map<string,string>}
     */
    function mapAuthors(authors) {
        return authors.reduce((total, authorLink) => {
            total.set(authorLink.innerText.trim(), authorLink.href);
            return total;
        }, new Map());
    }

    /**
     * Parse the metadata from a work page.
     * @param doc {Document}
     * @param url {string}
     * @returns 
     */
    function parseGenMetadata(doc, url) {
        const meta = queryElement(doc, ".meta");
        const rating = queryElement(meta, "dd.rating.tags").innerText.trim();
        const warnings = queryElements(queryElement(meta, "dd.warning.tags"), "a").map(a => a.innerText.trim());
        const relationships = queryElements(queryElement(meta, "dd.relationship.tags"), "a").map(a => a.innerText.trim());
        const characters = queryElements(queryElement(meta, "dd.character.tags"), "a").map(a => a.innerText.trim());
        const categories = queryElements(queryElement(meta, "dd.category.tags"), "a").map(a => a.innerText.trim());
        const fandoms = queryElements(queryElement(meta, "dd.fandom.tags"), "a").map(a => a.innerText.trim());
        const freeformTags = queryElements(queryElement(meta, "dd.freeform.tags"), "a").map(a => a.innerText.trim());
        const language = queryElement(meta, "dd.language").innerText.trim();

        const work = doc.getElementById("workskin");
        const title = queryElement(work, "h2.title").innerText.trim();
        const authors = mapAuthors(queryElements(queryElement(work, ".byline"), "a"));
        // The actual html of the summary, with <p>s replaced.
        const summary = sanitizeSummary(queryElement(queryElement(work, "div.summary.module"), ".userstuff"));

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
        const work = queryElement(doc, ".blurb");

        const headerModule = queryElement(work, "div.header.module");
        const heading = queryElement(headerModule, "h4.heading");
        // Note: this is a list of elements where the first element
        // is the title, and the remaining are the authors.
        const titleAndAuthors = queryElements(heading, "a");
        const title = titleAndAuthors[0].innerText.trim();
        // This removes the title, so the array just contains the authors.
        titleAndAuthors.shift();
        const authors = mapAuthors(titleAndAuthors);
        const fandoms = queryElements(queryElement(headerModule, "h5.fandoms.heading"), "a").map(a => a.innerText.trim());
        const requiredTagsEl = queryElement(headerModule, "ul.required-tags");
        const rating = queryElement(requiredTagsEl, "span.rating").innerText.trim();
        const categories = queryElement(requiredTagsEl, "span.category").innerText.split(",").map(a => a.trim());

        const superTags = queryElement(work, "ul.tags.commas");
        const warnings = queryElements(superTags, ".warnings").map(a => a.innerText.trim());
        const relationships = queryElements(superTags, ".relationships").map(a => a.innerText.trim());
        const characters = queryElements(superTags, ".characters").map(a => a.innerText.trim());
        const freeformTags = queryElements(superTags, ".freeforms").map(a => a.innerText.trim());
        const summary = sanitizeSummary(queryElement(work, "blockquote.userstuff.summary"));
        const language = queryElement(work, "dd.language").innerText.trim();

        return {
            title,
            actualAuthors: authors,
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
     * @returns 
     */
    async function importMetadata(url) {
        console.log(url);
        const result = await window.fetch(url);
        const html = await result.text();
        const domParser = new DOMParser();
        const doc = domParser.parseFromString(html, "text/html");
        // The "This work could have adult content. If you proceed...." blurb.
        const caution = queryElements(doc, ".caution");
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
     * Return a map from option text to option value.
     * @param options {HTMLOptionElement[]}
     * @returns {Map<string,string>}
     */
    function mapOptions(options) {
        return queryElements(options, "option")
            .reduce((total, optionElement) => {
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
        return inputs
            .reduce((total, inputElement) => {
                total.set(inputElement.value.trim(), inputElement);
                return total;
            }, new Map());
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
     * Transform a summary by wrapping it in a <blockquote> and linking the original
     * work/authors.
     * @param summary {string}
     * @param title {string}
     * @param url {string}
     * @param authors {Map<string,string>}
     * @returns 
     */
    function transform(summary, title, url, authors) {
        const newSummary = "<blockquote>" + summary + "</blockquote>Podfic of " + link(url, title) + " by ";
        const newAuthors = Array.from(authors).map(([author, authorUrl]) => (link(authorUrl, author))).join(", ");
        return newSummary + newAuthors + ".";
    }

    /**
     * Sets the value of a tag input, triggering all necessary events.
     * @param inputElement {HTMLInputElement} 
     * @param value {string}
     */
    function setTagsInputValue(inputElement, value) {
        const event = new InputEvent('input', {
            bubbles: true,
            data: value
        });
        inputElement.value = value;
        // Replicates the value changing.
        inputElement.dispatchEvent(event);
        // Replicates the user hitting enter.
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { 'key': ',' }));
    }


    // Treat hitting "enter" in the url box the same as clicking the "import" button.
    // urlInput.addEventListener("keyup", (event) => {
    //     if (event.keyCode === 13) {
    //         importButton.click();
    //     }
    // });

    /**
     * Fill in the new work page with the extracted metadata.
     * @param metadata 
     * @param options 
     */
    async function fillMetadata(metadata, options) {
        const newWorkPage = document.getElementById("main");

        // Find the rating drop down, and pick the correct value.
        const ratingSelect = queryElement(newWorkPage, "#work_rating_string");
        const ratingOptions = mapOptions(ratingSelect);
        ratingSelect.value = ratingOptions.get(metadata['rating']);

        // Find the warning check boxes, and check all the ones that apply.
        const warningBoxes = mapInputs(queryElements(queryElement(newWorkPage, "fieldset.warnings"), "input"));
        metadata["warnings"].forEach(warning => warningBoxes.get(warning).checked = true);

        // Find the fandom text input, and insert a comma-separated list of fandoms.
        // Tell ao3 we did so.
        const fandomInput = queryElement(queryElement(newWorkPage, "dd.fandom"), "input");
        setTagsInputValue(fandomInput, metadata["fandoms"].join(", "));

        // Find the category check boxes, and check all the ones that apply.
        const categoryBoxes = mapInputs(queryElements(queryElement(newWorkPage, "dd.category"), "input"));
        metadata["categories"].forEach(category => categoryBoxes.get(category).checked = true);

        // Find the relationship text input, and insert a comma-separated list of relationships.
        // Tell ao3 we did so.
        const relationshipInput = queryElement(queryElement(newWorkPage, "dd.relationship"), "input");
        setTagsInputValue(relationshipInput, metadata["relationships"].join(", "));

        // Find the character input, and insert a comma-separated list of characters.
        // Tell ao3 we did so.
        const characterInput = queryElement(queryElement(newWorkPage, "dd.character"), "input");
        setTagsInputValue(characterInput, metadata["characters"].join(", "));

        // Find the freeform tags input, and insert a comma-separated list of freeform tags.
        // (potentially auto-adding "Podfic" and "Podfic Length" tags)
        // Tell ao3 we did so.
        const additionalTagsInput = queryElement(queryElement(newWorkPage, "dd.freeform"), "input");
        if (options['podfic_label']) {
            metadata["freeformTags"].push("Podfic");
        }
        if (options['podfic_length_label']) {
            metadata["freeformTags"].push("Podfic Length: " + options["podfic_length_value"]);
        }
        setTagsInputValue(additionalTagsInput, metadata["freeformTags"].join(", "));

        // Set the title.
        const titleInput = queryElement(queryElement(newWorkPage, "dd.title"), "input");
        if (options['transform_title']) {
            titleInput.value = "[Podfic] " + metadata["title"];
        } else {
            titleInput.value = metadata["title"];
        }

        // Set the summary, optionally wrapping it in a block quote.
        const summaryTextArea = queryElement(queryElement(newWorkPage, "dd.summary"), "textarea");
        if (options["transform_summary"]) {
            summaryTextArea.value =
                transform(metadata["summary"], metadata["title"], metadata["url"], metadata["authors"]);
        } else {
            summaryTextArea.value = metadata["summary"];
        }

        // Set the "inspired by" work url.
        const parentCheckmark = queryElement(queryElement(newWorkPage, "dt.parent"), "input");
        if (!parentCheckmark.checked) {
            parentCheckmark.click();
        }
        const parentUrl = queryElement(newWorkPage, "#work_parent_attributes_url");
        parentUrl.value = metadata["url"];

        // Set the same language as the original work.
        const languageSelect = queryElement(newWorkPage, "#work_language_id");
        const languageOptions = mapOptions(languageSelect);
        languageSelect.value = languageOptions.get(metadata["language"]);

        // Set the new work text.
        const workText = queryElement(newWorkPage, ".mce-editor");
        // If there's nothing here yet, over-write it.
        if (workText.value == "") {
            workText.value = options["default_body"];
        }
    }

    // The body of this function will be executed as a content script inside the
    // "new work" page.
    async function importAndFillMetadata() {
        chrome.storage.sync.get("options", async ({
            options
        }) => {
            const metadata = await importMetadata(options['url']);
            console.log(metadata);
            await fillMetadata(metadata, options);
        });
    }

    await importAndFillMetadata();
}

/**
 * Sets the value of the input, trigger all necessary events.
 * @param inputElement {HTMLInputElement} 
 * @param value {string}
 */
function setInputValue(inputElement, value) {
    const event = new InputEvent('input', {
        bubbles: true,
        data: value
    });
    inputElement.value = value;
    // Replicates the value changing.
    inputElement.dispatchEvent(event);
    // Replicates the user leaving focus of the input element.
    inputElement.dispatchEvent(new Event('change'));
}