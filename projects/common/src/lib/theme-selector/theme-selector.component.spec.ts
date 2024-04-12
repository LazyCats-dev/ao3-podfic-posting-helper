import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
} from '@angular/core/testing';

import {ThemeSelectorComponent} from './theme-selector.component';
import {HarnessLoader, TestElement} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatIconHarness} from '@angular/material/icon/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatTooltipHarness} from '@angular/material/tooltip/testing';

describe('ThemeSelectorComponent', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let matchMediaSpy: jasmine.Spy<typeof window.matchMedia>;
  let storageGetSpy: jasmine.Spy<(key: string) => Promise<unknown>>;
  let storageSetSpy: jasmine.Spy;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
    } as MediaQueryList);
    const storageSpy = jasmine.createSpyObj<typeof chrome.storage>(
      'chrome.storage',
      ['sync'],
    );
    const syncSpy = jasmine.createSpyObj<typeof chrome.storage.sync>(
      'chrome.storage.sync',
      ['get', 'set'],
    );
    storageGetSpy = (syncSpy.get as jasmine.Spy).withArgs('themePreference');
    storageSetSpy = syncSpy.set;
    storageSpy.sync = syncSpy;
    chrome.storage = storageSpy;
    await TestBed.configureTestingModule({
      imports: [ThemeSelectorComponent],
    }).compileComponents();
  });

  afterEach(() => {
    // Reset global state outside of our component.
    document.body.classList.remove('dark-mode');
    window.matchMedia = originalMatchMedia;
  });

  describe('with no storage preference', () => {
    beforeEach(() => {
      // No theme preference is stored.
      storageGetSpy.and.resolveTo({themePreference: undefined});
    });

    it('respects the system preference for light mode', fakeAsync(async () => {
      matchMediaSpy.and.returnValue({matches: false} as MediaQueryList);

      const fixture = TestBed.createComponent(ThemeSelectorComponent);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
      flush();

      expect(document.body.classList.contains('dark-mode')).toBeFalse();
      expect(storageSetSpy).not.toHaveBeenCalled();

      const icon = await loader.getHarness(MatIconHarness);
      expect(await icon.getName()).toBe('dark_mode');
    }));

    it('respects the system preference for dark mode', fakeAsync(async () => {
      matchMediaSpy.and.returnValue({matches: true} as MediaQueryList);

      const fixture = TestBed.createComponent(ThemeSelectorComponent);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
      flush();

      expect(document.body.classList.contains('dark-mode')).toBeTrue();
      expect(storageSetSpy).not.toHaveBeenCalled();

      const icon = await loader.getHarness(MatIconHarness);
      expect(await icon.getName()).toBe('light_mode');
    }));
  });

  describe('with a storage preference of light', () => {
    let loader: HarnessLoader;
    let fixture: ComponentFixture<ThemeSelectorComponent>;
    let icon: MatIconHarness;
    let button: MatButtonHarness;
    let buttonHost: TestElement;
    let tooltip: MatTooltipHarness;

    beforeEach(fakeAsync(async () => {
      // Dark mode preference is already in storage.
      storageGetSpy.and.resolveTo({themePreference: 'light'});
      // Light mode is preferred at the system level.
      matchMediaSpy.and.returnValue({matches: true} as MediaQueryList);

      fixture = TestBed.createComponent(ThemeSelectorComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
      flush();

      icon = await loader.getHarness(MatIconHarness);
      button = await loader.getHarness(MatButtonHarness);
      buttonHost = await button.host();
      tooltip = await loader.getHarness(MatTooltipHarness);
    }));

    it('respects the storage preference over the system preference', async () => {
      expect(document.body.classList.contains('dark-mode')).toBeFalse();
      expect(storageSetSpy).not.toHaveBeenCalled();

      expect(await icon.getName()).toBe('dark_mode');

      await tooltip.show();

      expect(await tooltip.getTooltipText()).toBe('Switch to dark theme');
      expect(await buttonHost.getAttribute('aria-label')).toBe(
        'Switch to dark theme',
      );
    });
  });

  describe('with a storage preference of dark', () => {
    let loader: HarnessLoader;
    let fixture: ComponentFixture<ThemeSelectorComponent>;
    let icon: MatIconHarness;
    let button: MatButtonHarness;
    let buttonHost: TestElement;
    let tooltip: MatTooltipHarness;

    beforeEach(fakeAsync(async () => {
      // Dark mode preference is already in storage.
      storageGetSpy.and.resolveTo({themePreference: 'dark'});
      // Light mode is preferred at the system level.
      matchMediaSpy.and.returnValue({matches: false} as MediaQueryList);

      fixture = TestBed.createComponent(ThemeSelectorComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
      flush();

      icon = await loader.getHarness(MatIconHarness);
      button = await loader.getHarness(MatButtonHarness);
      buttonHost = await button.host();
      tooltip = await loader.getHarness(MatTooltipHarness);
    }));

    it('respects the storage preference over the system preference', async () => {
      expect(document.body.classList.contains('dark-mode')).toBeTrue();
      expect(storageSetSpy).not.toHaveBeenCalled();

      expect(await icon.getName()).toBe('light_mode');

      await tooltip.show();

      expect(await tooltip.getTooltipText()).toBe('Switch to light theme');
      expect(await buttonHost.getAttribute('aria-label')).toBe(
        'Switch to light theme',
      );
    });

    describe('the button is clicked', () => {
      beforeEach(fakeAsync(async () => {
        await button.click();
        flush();
      }));

      it('toggles the theme preference', async () => {
        expect(document.body.classList.contains('dark-mode')).toBeFalse();
        expect(storageSetSpy).toHaveBeenCalledWith({themePreference: 'light'});

        expect(await icon.getName()).toBe('dark_mode');

        await tooltip.show();

        expect(await tooltip.getTooltipText()).toBe('Switch to dark theme');
        expect(await buttonHost.getAttribute('aria-label')).toBe(
          'Switch to dark theme',
        );
      });

      describe('the button is clicked again', () => {
        beforeEach(fakeAsync(async () => {
          await button.click();
          flush();
        }));

        it('toggles the theme preference back', async () => {
          expect(document.body.classList.contains('dark-mode')).toBeTrue();
          expect(storageSetSpy).toHaveBeenCalledWith({themePreference: 'dark'});

          expect(await icon.getName()).toBe('light_mode');

          await tooltip.show();

          expect(await tooltip.getTooltipText()).toBe('Switch to light theme');
          expect(await buttonHost.getAttribute('aria-label')).toBe(
            'Switch to light theme',
          );
        });
      });
    });
  });
});
