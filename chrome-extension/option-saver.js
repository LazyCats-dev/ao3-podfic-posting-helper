// Default options.
const default_options = {
    'url': '',
    'podfic_label': true,
    'podfic_length_label': true,
    'podfic_length_value': '0-10 Minutes',
    'transform_summary': true,
    'transform_title': true,
    'default_body': 'Here are a few building blocks that that show how you can include an image, audio, or a link to your podfic in your post. They\'re all optional, and you can change these defaults to match your own default posting template by going to the option page for this extension. Happy posting!\n\n<img src="IMAGE_URL" width="500px" alt="Cover art. COVER_DESCRIPTION." />\n\n<audio src="PODFIC_URL_ENDING_IN_MP3" controls="controls" crossorigin="anonymous" preload="metadata"></audio>\n\n<a href="PODFIC_URL" rel="nofollow">Download the podfic here (FILE_SIZE MB/FILE_MINUTES minutes)</a>.'
};

/**
 * Fetches options, setting them all to defaults if it can't find them.
 * @param callBack 
 */
export function getOptionsWithDefaults(callBack) {
    chrome.storage.sync.get("options", ({ options }) => {
        if (typeof options === 'undefined') {
            options = default_options;
        }
        callBack(options);
    });
}

/**
 * Save pop-up options while leaving option-page options alone.
 * @param popUpOptions 
 */
export function savePopUpOptions(popUpOptions) {
    chrome.storage.sync.get("options", ({ options }) => {
        // If there aren't any other default options, set them.
        if (typeof options === 'undefined') {
            options = default_options;
        }
        // Use saved default_body value rather than whatever is in popUpOptions.
        popUpOptions['default_body'] = options['default_body'];
        options = popUpOptions;
        // Save.
        chrome.storage.sync.set({ options });
    });
}

/**
 * Save option-page options while leaving pop-up options alone.
 * @param optionPageOptions 
 */
export function saveOptionPageOptions(optionPageOptions) {
    chrome.storage.sync.get("options", ({ options }) => {
        // If there aren't any other default options, set them.
        if (typeof options === 'undefined') {
            options = default_options;
        }
        // Override the new default_body value.
        options['default_body'] = optionPageOptions['default_body'];
        // Save.
        chrome.storage.sync.set({ options });
    });
}