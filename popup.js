/** @type {HTMLInputElement} */
const urlInput = document.getElementById("url-input");
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

// Import options from storage
chrome.storage.sync.get("options", async ({ options }) => {
    urlInput.value = options['url'];
    podficLabel.checked = options['podfic_label'];
    podficLengthLabel.checked = options['podfic_length_label'];
    podficLengthValue.value = options['podfic_length_value'];
    transformSummary.checked = options['transform_summary'];
    transformTitle.checked = options['transform_title'];
});

urlInput.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) { importButton.click(); }
});

// When the button is clicked, import metadata from original work
importButton.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.storage.sync.set({
        'options': {
            'url': urlInput.value,
            'podfic_label': podficLabel.checked,
            'podfic_length_label': podficLengthLabel.checked,
            'podfic_length_value': podficLengthValue.value,
            'transform_summary': transformSummary.checked,
            'transform_title': transformTitle.checked
        }
    });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: main,
    });
});

async function main() {

    /**
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
     * @param parent {HTMLElement}
     * @param query {string}
     * @return {HTMLElement}
     */
    function queryElement(parent, query) {
        return queryElements(parent, query)[0];
    }

    /**@param url {string} */
    function canonicalUrl(url) {
        //https://archiveofourown.org/
        if (url.startsWith("http")) {
            return url;
        } else {
            return "https://archiveofourown.org" + url;
        }
    }

    /**
     * 
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
            title, authors, rating, warnings, relationships, characters, categories, fandoms,
            freeformTags, language, summary, url,
        };
    }

    function mapAuthors(authors) {
        return authors.reduce((total, authorLink) => {
            total.set(authorLink.innerText.trim(), authorLink.href); return total;
        }, new Map());
    }

    function parseMatureMetadata(doc, url) {
        const work = queryElement(doc, ".blurb");

        const headerModule = queryElement(work, "div.header.module");
        const heading = queryElement(headerModule, "h4.heading");
        // Note: the first "author" is actually the title.
        const authors = queryElements(heading, "a");
        const title = authors[0].innerText.trim();
        // This removes the title, so authors now actually contains just the authors.
        authors.shift();
        const actualAuthors = mapAuthors(authors);
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
            title, actualAuthors, rating, warnings, relationships, characters, categories, fandoms,
            freeformTags, language, summary, url,
        };
    }


    // Example mature work: https://archiveofourown.org/works/31337180
    // Example gen work: https://archiveofourown.org/works/28401015
    async function importMetadata(url) {
        console.log(url);
        const result = await window.fetch(url);
        const html = await result.text();
        const domParser = new DOMParser();
        const doc = domParser.parseFromString(html, "text/html");
        // The "This work could have adult content. If you proceed...." blurb
        const caution = queryElements(doc, ".caution");
        if (caution.length == 0) {
            // Doc structure for gen pages (or if you're logged in and turned
            // the warning off)
            return parseGenMetadata(doc, url);
        } else {
            // Doc structure for pages with a warning
            return parseMatureMetadata(doc, url);
        }
    }

    function mapOptions(options) {
        return queryElements(options, "option")
            .reduce((total, optionElement) => {
                total.set(optionElement.innerText.trim(), optionElement.value); return total;
            }, new Map());
    }

    function mapInputs(inputs) {
        return inputs
            .reduce((total, inputElement) => {
                total.set(inputElement.value.trim(), inputElement); return total;
            }, new Map());
    }

    function link(url, text) {
        return '<a href="' + canonicalUrl(url) + '">' + text + '</a>';
    }

    function transform(summary, title, url, authors) {
        const newSummary = "<blockquote>" + summary + "</blockquote>Podfic of " + link(url, title) + " by ";
        const newAuthors = Array.from(authors).map(([author, authorUrl]) => (link(authorUrl, author))).join(", ");
        return newSummary + newAuthors + ".";
    }

    async function fillMetadata(metadata, options) {
        const newWorkPage = queryElement(document, ".works-new ");

        const ratingSelect = queryElement(newWorkPage, "#work_rating_string");
        const ratingOptions = mapOptions(ratingSelect);
        ratingSelect.value = ratingOptions.get(metadata['rating']);
        const warningBoxes = mapInputs(queryElements(queryElement(newWorkPage, "fieldset.warnings"), "input"));
        metadata["warnings"].forEach(warning => warningBoxes.get(warning).checked = true);
        const fandomInput = queryElement(queryElement(newWorkPage, "dd.fandom"), "input");
        fandomInput.value = metadata["fandoms"].join(", ");
        const categoryBoxes = mapInputs(queryElements(queryElement(newWorkPage, "dd.category"), "input"));
        metadata["categories"].forEach(category => categoryBoxes.get(category).checked = true);
        const relationshipInput = queryElement(queryElement(newWorkPage, "dd.relationship"), "input");
        relationshipInput.value = metadata["relationships"].join(", ");
        const characterInput = queryElement(queryElement(newWorkPage, "dd.character"), "input");
        characterInput.value = metadata["characters"].join(", ");
        const additionalTagsInput = queryElement(queryElement(newWorkPage, "dd.freeform"), "input");
        if (options['podfic_label']) {
            metadata["freeformTags"].push("Podfic");
        }
        if (options['podfic_length_label']) {
            metadata["freeformTags"].push("Podfic Length: " + options["podfic_length_value"]);
        }
        additionalTagsInput.value = metadata["freeformTags"].join(", ");

        const titleInput = queryElement(queryElement(newWorkPage, "dd.title"), "input");
        if (options['transform_title']) {
            titleInput.value = "[Podfic] " + metadata["title"];
        } else {
            titleInput.value = metadata["title"];
        }
        const summaryTextArea = queryElement(queryElement(newWorkPage, "dd.summary"), "textarea");
        if (options["transform_summary"]) {
            summaryTextArea.value =
                transform(metadata["summary"], metadata["title"], metadata["url"], metadata["authors"]);
        } else {
            summaryTextArea.value = metadata["summary"];
        }

        const parentCheckmark = queryElement(queryElement(newWorkPage, "dt.parent"), "input");
        if (!parentCheckmark.checked) {
            parentCheckmark.click();
        }
        const parentUrl = queryElement(newWorkPage, "#work_parent_attributes_url");
        parentUrl.value = metadata["url"];

        const languageSelect = queryElement(newWorkPage, "#work_language_id");
        const languageOptions = mapOptions(languageSelect);
        languageSelect.value = languageOptions.get(metadata["language"]);

        const workText = queryElement(newWorkPage, ".mce-editor");
        if (workText.value == "") {
            workText.value = "Hello world!";
        }
    }

    // The body of this function will be executed as a content script inside the
    // current page
    async function importAndFillMetadata() {
        chrome.storage.sync.get("options", async ({ options }) => {
            const metadata = await importMetadata(options['url']);
            console.log(metadata);
            await fillMetadata(metadata, options);
        });
    }

    await importAndFillMetadata();

}