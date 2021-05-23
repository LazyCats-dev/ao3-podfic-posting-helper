// Set default options when you install the extension for the first time.
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        'options': {
            'url': '',
            'podfic_label': true,
            'podfic_length_label': true,
            'podfic_length_value': '0-10 Minutes',
            'transform_summary': true,
            'transform_title': true,
            'default_body': 'Here are a few building blocks that that show how you can include an image, audio, or a link to your podfic in your post. They\'re all optional, and you can change these defaults to match your own default posting template by going to the option page for this extension. Happy posting!\n\n<img src="IMAGE_URL" width="500px" alt="Cover art. COVER_DESCRIPTION." />\n\n<audio src="PODFIC_URL_ENDING_IN_MP3" controls="controls" crossorigin="anonymous" preload="metadata"></audio>\n\n<a href="PODFIC_URL" rel="nofollow">Download the podfic here (FILE_SIZE MB/FILE_MINUTES minutes)</a>.'
        }
    });
});