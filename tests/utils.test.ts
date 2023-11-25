/**
 * @jest-environment jsdom
 */

import {setInputValue, setupStorage} from '../src/utils';
import {chrome} from 'jest-chrome';

describe('setInputValue', () => {
  test('fires input and change events', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    expect(input.value).toBe('');

    const changeSpy = jest.fn();
    const inputSpy = jest.fn();

    input.addEventListener('input', inputSpy);
    input.addEventListener('change', changeSpy);

    setInputValue(input, 'I always get the shemp');

    expect(input.value).toBe('I always get the shemp');
    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(inputSpy).toHaveBeenCalledTimes(1);
    expect(inputSpy).toHaveBeenCalledWith(
      expect.objectContaining({data: 'I always get the shemp'})
    );
  });
});

describe('setupStorage', () => {
  beforeEach(() => {
    chrome.storage.sync.set.mockReset();
    chrome.storage.sync.get.mockReset();
    chrome.storage.sync.set.mockImplementation(() => Promise.resolve());
  });

  test('sets defaults when no options are set', async () => {
    chrome.storage.sync.get.mockImplementation(() =>
      Promise.resolve({
        options: undefined,
        workbody: undefined,
        title_template: undefined,
        summary_template: undefined,
        notes_template: undefined,
      })
    );

    await setupStorage();

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      options: {
        url: '',
        podfic_label: true,
        podfic_length_label: true,
        podfic_length_value: '0-10 Minutes',
        transform_summary: true,
        transform_title: true,
        title_format: 'default',
        summary_format: 'default',
      },
    });
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      workbody: {
        default: expect.stringContaining('Here are a few building blocks'),
      },
    });
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      title_template: {default: '[Podfic] ${title}'},
    });
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      summary_template: {
        default: '${blocksummary}Podfic of ${title} by ${authors}.',
      },
    });
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      notes_template: {
        default: '',
        begin: false,
        end: false,
      },
    });
  });

  test('loads all values were set from a modern version', async () => {
    chrome.storage.sync.get.mockImplementation(() =>
      Promise.resolve({
        options: {
          title_format: 'foo',
          summary_format: 'bar',
        },
        workbody: {
          default: 'shemp',
        },
        title_template: {
          default: 'tango',
        },
        summary_template: {
          default: 'barvo',
        },
        notes_template: {
          default: 'alpha',
          begin: true,
          end: true,
        },
      })
    );

    await setupStorage();

    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });
});
