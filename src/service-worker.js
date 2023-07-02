import {ANALYTICS} from './google-analytics.js';

addEventListener('unhandledrejection', async event => {
  ANALYTICS.fireErrorEvent(event.reason);
});

chrome.runtime.onInstalled.addListener(() => {
  ANALYTICS.fireEvent('install');
});
