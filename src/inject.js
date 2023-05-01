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
   * Transform a summary according to keywords in the template string.
   * Keywords must be wrapped by ${} (e.g. ${title}). Keywords are not
   * case-sensitive, and include:
   *   * blocksummary
   *   * summary
   *   * title
   *   * author
   *   * authors
   * @param template {string}
   * @param summary {string}
   * @param title {string}
   * @param url {string}
   * @param authors {Map<string,string>}
   * @returns
   */
  function transformHtmlTemplate(template, summary, title, url, authors) {
    const titleLink = link(url, title);
    const authorsLinks = Array.from(authors)
      .map(([author, authorUrl]) => link(authorUrl, author))
      .join(", ");
    const authorsText = Array.from(authors)
      .map(([author, authorUrl]) => author)
      .join(", ");
    const blockSummaryText = "<blockquote>" + summary + "</blockquote>";

    let newSummary = template;
    newSummary = newSummary.replaceAll("${blocksummary}", blockSummaryText);
    newSummary = newSummary.replaceAll("${summary}", summary);
    newSummary = newSummary.replaceAll("${title}", titleLink);
    newSummary = newSummary.replaceAll("${title-unlinked}", title);
    newSummary = newSummary.replaceAll("${authors}", authorsLinks);
    newSummary = newSummary.replaceAll("${author}", authorsLinks);
    newSummary = newSummary.replaceAll("${authors-unlinked}", authorsText);
    newSummary = newSummary.replaceAll("${author-unlinked}", authorsText);

    return newSummary;
  }

  /**
   * Transform a title according to keywords in the template string.
   * Keywords must be wrapped by ${} (e.g. ${title}). Keywords are not
   * case-sensitive, and include:
   *   * title
   *   * author
   *   * authors
   * @param template {string}
   * @param title {string}
   * @param authors {Map<string,string>}
   * @returns
   */
  function transformTitle(template, title, authors) {
    const authorsText = Array.from(authors)
      .map(([author, authorUrl]) => author)
      .join(", ");

    let newTitle = template;
    newTitle = newTitle.replaceAll("${title}", title);
    newTitle = newTitle.replaceAll("${title-unlinked}", title);
    newTitle = newTitle.replaceAll("${authors}", authorsText);
    newTitle = newTitle.replaceAll("${author}", authorsText);
    newTitle = newTitle.replaceAll("${authors-unlinked}", authorsText);
    newTitle = newTitle.replaceAll("${author-unlinked}", authorsText);

    return newTitle;
  }

  /**
   * Figure out what template to use based on the title options and
   * custom template.
   * @param titleOption {string}
   * @param customTemplate {string}
   * @returns
   */
  function getTitleTemplate(titleOption, customTemplate) {
    switch (titleOption) {
      case "blank":
        return "";
      case "orig":
        return "${title}";
      case "custom":
        return customTemplate;
      default:
        return "[Podfic] ${title}";
    }
  }

  /**
   * Figure out what template to use based on the summary options and
   * custom template.
   * @param summaryOption {string}
   * @param customTemplate {string}
   * @returns
   */
  function getSummaryTemplate(summaryOption, customTemplate) {
    switch (summaryOption) {
      case "blank":
        return "";
      case "orig":
        return "${summary}";
      case "custom":
        return customTemplate;
      default:
        return "${blocksummary}Podfic of ${title} by ${authors}.";
    }
  }

  /**
   * Sets the value of a tag input, triggering all necessary events.
   * @param inputElement {HTMLInputElement}
   * @param value {string}
   */
  function setTagsInputValue(inputElement, value) {
    const event = new InputEvent("input", { bubbles: true, data: value });
    inputElement.value = value;
    // Replicates the value changing.
    inputElement.dispatchEvent(event);
    // Replicates the user hitting comma.
    inputElement.dispatchEvent(new KeyboardEvent("keydown", { key: "," }));
  }

  /**
   * Strip <p> tags, since AO3 doesn't like them in the summary.
   * @param {HTMLElement|undefined} summary
   */
  function sanitizeSummary(summary) {
    if (!summary) {
      return "";
    }
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
   * Transform a list of <a> html elements into a map from link text to link
   * url.
   * @param authors {HTMLElement[]}
   * @returns {Array<[string,string]>}
   */
  function mapAuthors(authors) {
    return Array.from(
      authors
        .reduce((total, authorLink) => {
          // Check that this is actually a link to an
          // author--it could be a giftee.
          if (authorLink.getAttribute("rel") == "author") {
            total.set(
              authorLink.innerText.trim(),
              authorLink.getAttribute("href")
            );
          }
          return total;
        }, new Map())
        .entries()
    );
  }

  /**
   * Parse the metadata from a work page.
   * @param doc {Document}
   * @returns
   */
  function parseGenMetadata(doc) {
    const meta = queryElement(doc, ".meta");
    const rating = queryElement(meta, "dd.rating.tags").innerText.trim();
    const warnings = queryElements(
      queryElement(meta, "dd.warning.tags"),
      "a"
    ).map((a) => a.innerText.trim());
    const relationships = queryElements(
      queryElement(meta, "dd.relationship.tags"),
      "a"
    ).map((a) => a.innerText.trim());
    const characters = queryElements(
      queryElement(meta, "dd.character.tags"),
      "a"
    ).map((a) => a.innerText.trim());
    const categories = queryElements(
      queryElement(meta, "dd.category.tags"),
      "a"
    ).map((a) => a.innerText.trim());
    const fandoms = queryElements(
      queryElement(meta, "dd.fandom.tags"),
      "a"
    ).map((a) => a.innerText.trim());
    const freeformTags = queryElements(
      queryElement(meta, "dd.freeform.tags"),
      "a"
    ).map((a) => a.innerText.trim());
    const language = queryElement(meta, "dd.language").innerText.trim();

    const work = doc.getElementById("workskin");
    const title = queryElement(work, "h2.title").innerText.trim();
    const authors = mapAuthors(
      queryElements(queryElement(work, ".byline"), "a")
    );
    // The actual html of the summary, with <p>s replaced.
    const summary = sanitizeSummary(
      queryElement(queryElement(work, "div.summary.module"), ".userstuff")
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
   * Parse the metadata for the work at this url.
   * @param {string} url
   */
  async function importMetadata(url) {
    // Attempt to parse the URL
    /** @type {URL} */
    let fetchUrl;
    try {
      fetchUrl = new URL(url);
    } catch (e) {
      return { result: "error", message: `Invalid work URL: ${e.message}` };
    }
    // Always consent to seeing "adult content" to simplifying parsing
    fetchUrl.searchParams.set("view_adult", "true");
    // Initially try to get the work without credentials, this handles cases
    // where the user has tags or warnings hidden but can fail if the work
    // the user is importing from is only available to logged-in users.
    let result;
    try {
      result = await window.fetch(fetchUrl, { credentials: "omit" });
    } catch (e) {
      return {
        result: "error",
        message: `Failed to fetch the work! ${e.message}`,
      };
    }
    if (!result.ok) {
      return {
        result: "error",
        message: `Failed to fetch the work! Error: ${result.status} ${result.statusText}`,
      };
    }

    const domParser = new DOMParser();
    let html = await result.text();
    let doc = domParser.parseFromString(html, "text/html");

    // If we end up in this case it means that the work was not available to
    // logged out users so we will attempt the fetch again but this time we will
    // forward the user's credentials. If the user has warnings or tags hidden
    // then there will be errors later on but these are handled.
    if (result.redirected || looksLikeUnrevealedWork(doc)) {
      try {
        result = await window.fetch(fetchUrl, { credentials: "include" });
      } catch (e) {
        return {
          result: "error",
          message: `Failed to fetch the work! ${e.message}`,
        };
      }
      if (!result.ok) {
        return {
          result: "error",
          message: `Failed to fetch the work! Error: ${result.status} ${result.statusText}`,
        };
      }
      html = await result.text();
      doc = domParser.parseFromString(html, "text/html");

      if (looksLikeUnrevealedWork(doc)) {
        return {
          result: "error",
          message:
            "The selected work appears to be unrevealed please contact " +
            "the work author to get permission to view the work then try " +
            "again",
        };
      }
    }

    return {
      result: "success",
      // We return back the original URL so that storage only ever contains
      // the URL the user input instead of the one we used for fetching.
      metadata: { ...parseGenMetadata(doc), url },
    };
  }

  function looksLikeUnrevealedWork(/** @type {Document} */ doc) {
    // The page has a notice saying that the work is yet to be revealed, and
    // there is no user content.
    return (
      Array.from(doc.querySelectorAll("p.notice")).some((notice) =>
        notice.textContent.includes(
          "This work is part of an ongoing challenge and will " +
            "be revealed soon"
        )
      ) && !doc.querySelector(".userstuff")
    );
  }

  async function importAndFillMetadata() {
    let showPartialCompletionWarning = false;
    const {
      options,
      workbody,
      summary_template,
      title_template,
      notes_template,
    } = await browser.storage.sync.get([
      "options",
      "workbody",
      "summary_template",
      "title_template",
      "notes_template",
    ]);

    const importResult = await importMetadata(options["url"]);

    if (importResult.result === "error") {
      // Tell the popup that the import failed and the reason why it failed.
      browser.runtime.sendMessage(importResult);
      return;
    }
    const metadata = importResult.metadata;

    const newWorkPage = document.getElementById("main");

    // Find the rating drop down, and pick the correct value.
    const ratingSelect = queryElement(newWorkPage, "#work_rating_string");
    const ratingOptions = mapOptions(ratingSelect);
    ratingSelect.value = ratingOptions.get(metadata["rating"]);

    // Find the warning check boxes, and check all the ones that apply.
    const warningBoxes = mapInputs(
      queryElements(queryElement(newWorkPage, "fieldset.warnings"), "input")
    );
    warningBoxes.set(
      "Creator Chose Not To Use Archive Warnings",
      warningBoxes.get("Choose Not To Use Archive Warnings")
    );
    // Somehow it is possible for the imported metadata to have different
    // warnings than new work form. In this case we just ignore the warning
    // we failed to map.
    for (const warning of metadata["warnings"]) {
      if (warningBoxes.has(warning)) {
        warningBoxes.get(warning).checked = true;
      } else {
        showPartialCompletionWarning = true;
      }
    }

    // Find the fandom text input, and insert a comma-separated list of
    // fandoms. Tell ao3 we did so.
    const fandomInput = queryElement(
      queryElement(newWorkPage, "dd.fandom"),
      "input"
    );
    setTagsInputValue(fandomInput, metadata["fandoms"].join(", "));

    // Find the category check boxes, and check all the ones that apply.
    const categoryBoxes = mapInputs(
      queryElements(queryElement(newWorkPage, "dd.category"), "input")
    );
    // Somehow it is possible for the imported metadata to have different
    // categories than new work form. In this case we just ignore the warning
    // we failed to map.
    for (const category of metadata["categories"]) {
      if (categoryBoxes.has(category)) {
        categoryBoxes.get(category).checked = true;
      } else {
        showPartialCompletionWarning = true;
      }
    }

    // Find the relationship text input, and insert a comma-separated list
    // of relationships. Tell ao3 we did so.
    const relationshipInput = queryElement(
      queryElement(newWorkPage, "dd.relationship"),
      "input"
    );
    setTagsInputValue(relationshipInput, metadata["relationships"].join(", "));

    // Find the character input, and insert a comma-separated list of
    // characters. Tell ao3 we did so.
    const characterInput = queryElement(
      queryElement(newWorkPage, "dd.character"),
      "input"
    );
    setTagsInputValue(characterInput, metadata["characters"].join(", "));

    // Find the freeform tags input, and insert a comma-separated list of
    // freeform tags. (potentially auto-adding "Podfic" and "Podfic
    // Length" tags) Tell ao3 we did so.
    const additionalTagsInput = queryElement(
      queryElement(newWorkPage, "dd.freeform"),
      "input"
    );
    if (options["podfic_label"]) {
      metadata["freeformTags"].push("Podfic");
    }
    if (options["podfic_length_label"]) {
      metadata["freeformTags"].push(
        "Podfic Length: " + options["podfic_length_value"]
      );
    }
    setTagsInputValue(additionalTagsInput, metadata["freeformTags"].join(", "));

    // Set the title.
    const titleInput = queryElement(
      queryElement(newWorkPage, "dd.title"),
      "input"
    );
    const titleTemplate = getTitleTemplate(
      options["title_format"],
      title_template["default"]
    );
    titleInput.value = transformTitle(
      titleTemplate,
      metadata["title"],
      new Map(metadata["authors"])
    );

    // Set the summary, optionally wrapping it in a block quote.
    const summaryTextArea = queryElement(
      queryElement(newWorkPage, "dd.summary"),
      "textarea"
    );
    const summaryTemplate = getSummaryTemplate(
      options["summary_format"],
      summary_template["default"]
    );
    const authorMap = new Map(metadata["authors"]);
    summaryTextArea.value = transformHtmlTemplate(
      summaryTemplate,
      metadata["summary"],
      metadata["title"],
      metadata["url"],
      authorMap
    );

    const notesTemplate = transformHtmlTemplate(
      notes_template["default"],
      metadata["summary"],
      metadata["title"],
      metadata["url"],
      authorMap
    );
    if (notes_template["begin"]) {
      const beginNotesCheckmark = queryElement(
        newWorkPage,
        "#front-notes-options-show"
      );
      if (!beginNotesCheckmark.checked) {
        beginNotesCheckmark.click();
      }
      const beginNotesTextArea = queryElement(newWorkPage, "#work_notes");
      beginNotesTextArea.value = notesTemplate;
    }
    if (notes_template["end"]) {
      const endNotesCheckmark = queryElement(
        newWorkPage,
        "#end-notes-options-show"
      );
      if (!endNotesCheckmark.checked) {
        endNotesCheckmark.click();
      }
      const endNotesTextArea = queryElement(newWorkPage, "#work_endnotes");
      endNotesTextArea.value = notesTemplate;
    }

    // Set the "inspired by" work url.
    const parentCheckmark = queryElement(
      queryElement(newWorkPage, "dt.parent"),
      "input"
    );
    if (!parentCheckmark.checked) {
      parentCheckmark.click();
    }
    const parentUrl = queryElement(
      newWorkPage,
      "#work_parent_work_relationships_attributes_0_url"
    );
    parentUrl.value = metadata["url"];

    // Set the same language as the original work.
    const languageSelect = queryElement(newWorkPage, "#work_language_id");
    const languageOptions = mapOptions(languageSelect);
    languageSelect.value = languageOptions.get(metadata["language"]);

    // Set the new work text.
    const workText = queryElement(newWorkPage, ".mce-editor");
    // If there's nothing here yet, over-write it.
    if (workText.value == "") {
      workText.value = transformHtmlTemplate(
        workbody["default"],
        metadata["summary"],
        metadata["title"],
        metadata["url"],
        authorMap
      );
    }

    if (showPartialCompletionWarning) {
      browser.runtime.sendMessage({
        result: "error",
        message:
          "Warning: some data could not be imported, the most likely reason" +
          "is that you set your AO3 preferences to hide warnings or tags",
      });
    } else {
      // Tell the popup that the import worked as expected.
      browser.runtime.sendMessage({
        result: "success",
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
