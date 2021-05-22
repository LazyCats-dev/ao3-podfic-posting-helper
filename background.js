// Set default options
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        'options': {
            'url': '',
            'podfic_label': true,
            'podfic_length_label': true,
            'podfic_length_value': '0-10 Minutes',
            'transform_summary': true,
            'transform_title': true
        }
    });
});