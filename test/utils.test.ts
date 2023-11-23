import {setInputValue, setupStorage} from '../src/utils';

describe('setInputValue', () => {
  it('fires input and change events', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    expect(input.value).toBe('');

    const changeSpy = jasmine.createSpy('change');
    const inputSpy = jasmine.createSpy('input');

    input.addEventListener('input', inputSpy);
    input.addEventListener('change', changeSpy);

    setInputValue(input, 'I always get the shemp');

    expect(input.value).toBe('I always get the shemp');
    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(inputSpy).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({data: 'I always get the shemp'})
    );
    expect(inputSpy).toHaveBeenCalledBefore(changeSpy);
  });
});

describe('setupStorage', () => {
  let setSpy: jasmine.Spy<typeof browser.storage.sync.set>;
  let getSpy: jasmine.Spy<typeof browser.storage.sync.get>;

  beforeEach(() => {
    setSpy = jasmine.createSpy('browser.storage.sync.set');
    getSpy = jasmine.createSpy('browser.storage.sync.get');

    // This just returns so we don't care what it resolves to.
    setSpy.and.returnValue(Promise.resolve());

    const mockBrowser = {
      storage: {
        sync: {
          set: setSpy,
          get: getSpy,
        },
      },
    };

    (window.browser as unknown) = mockBrowser;
  });

  it('sets defaults when no options are set', async () => {
    getSpy.and.returnValue(
      Promise.resolve({
        options: undefined,
        workbody: undefined,
        title_template: undefined,
        summary_template: undefined,
        notes_template: undefined,
      })
    );

    await setupStorage();

    expect(setSpy).toHaveBeenCalledWith({
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
    expect(setSpy).toHaveBeenCalledWith({
      workbody: {
        default: jasmine.stringContaining('Here are a few building blocks'),
      },
    });
    expect(setSpy).toHaveBeenCalledWith({
      title_template: {default: '[Podfic] ${title}'},
    });
    expect(setSpy).toHaveBeenCalledWith({
      summary_template: {
        default: '${blocksummary}Podfic of ${title} by ${authors}.',
      },
    });
    expect(setSpy).toHaveBeenCalledWith({
      notes_template: {
        default: '',
        begin: false,
        end: false,
      },
    });
  });

  it('loads all values were set from a modern version', async () => {
    getSpy.and.returnValue(
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

    expect(setSpy)
      .withContext(
        'setupStorage was called when all data had a value, no set calls were expected'
      )
      .not.toHaveBeenCalled();
  });
});
