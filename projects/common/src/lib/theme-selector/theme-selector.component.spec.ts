import type {Mock} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ThemeSelectorComponent} from './theme-selector.component';
import {HarnessLoader, TestElement} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatIconHarness} from '@angular/material/icon/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatTooltipHarness} from '@angular/material/tooltip/testing';
import {provideZonelessChangeDetection} from '@angular/core';
import {vi, beforeEach, describe, it, expect} from 'vitest';
import axe from 'axe-core';

describe('ThemeSelectorComponent', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let matchMediaSpy: Mock;
  let storageGetSpy: Mock;
  let storageSetSpy: Mock;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList);
    const storageSpy = {
      sync: {
        get: vi.fn().mockName('chrome.storage.sync.get'),
        set: vi.fn().mockName('chrome.storage.sync.set'),
      },
    };
    storageGetSpy = storageSpy.sync.get;
    storageSetSpy = storageSpy.sync.set;
    (chrome.storage as unknown) = storageSpy;
    await TestBed.configureTestingModule({
      imports: [ThemeSelectorComponent],
      providers: [provideZonelessChangeDetection()],
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
      storageGetSpy.mockResolvedValue({themePreference: undefined});
    });

    it('respects the system preference for light mode', async () => {
      matchMediaSpy.mockReturnValue({matches: false} as MediaQueryList);

      const fixture = TestBed.createComponent(ThemeSelectorComponent);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.body.classList.contains('dark-mode')).toBe(false);
      expect(storageSetSpy).not.toHaveBeenCalled();

      const icon = await loader.getHarness(MatIconHarness);
      expect(await icon.getName()).toBe('dark_mode');
      const axeResults = await axe.run(fixture.nativeElement);
      expect(axeResults.violations).toEqual([]);
    });

    it('respects the system preference for dark mode', async () => {
      matchMediaSpy.mockReturnValue({matches: true} as MediaQueryList);

      const fixture = TestBed.createComponent(ThemeSelectorComponent);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.body.classList.contains('dark-mode')).toBe(true);
      expect(storageSetSpy).not.toHaveBeenCalled();

      const icon = await loader.getHarness(MatIconHarness);
      expect(await icon.getName()).toBe('light_mode');
      const axeResults = await axe.run(fixture.nativeElement);
      expect(axeResults.violations).toEqual([]);
    });
  });

  describe('with a storage preference of light', () => {
    let loader: HarnessLoader;
    let fixture: ComponentFixture<ThemeSelectorComponent>;
    let icon: MatIconHarness;
    let button: MatButtonHarness;
    let buttonHost: TestElement;
    let tooltip: MatTooltipHarness;

    beforeEach(async () => {
      // Dark mode preference is already in storage.
      storageGetSpy.mockResolvedValue({themePreference: 'light'});
      // Light mode is preferred at the system level.
      matchMediaSpy.mockReturnValue({matches: true} as MediaQueryList);

      fixture = TestBed.createComponent(ThemeSelectorComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
      await fixture.whenStable();

      icon = await loader.getHarness(MatIconHarness);
      button = await loader.getHarness(MatButtonHarness);
      buttonHost = await button.host();
      tooltip = await loader.getHarness(MatTooltipHarness);
    });

    it('respects the storage preference over the system preference', async () => {
      expect(document.body.classList.contains('dark-mode')).toBe(false);
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

    beforeEach(async () => {
      // Dark mode preference is already in storage.
      storageGetSpy.mockResolvedValue({themePreference: 'dark'});
      // Light mode is preferred at the system level.
      matchMediaSpy.mockReturnValue({matches: false} as MediaQueryList);

      fixture = TestBed.createComponent(ThemeSelectorComponent);
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
      await fixture.whenStable();

      icon = await loader.getHarness(MatIconHarness);
      button = await loader.getHarness(MatButtonHarness);
      buttonHost = await button.host();
      tooltip = await loader.getHarness(MatTooltipHarness);
    });

    it('respects the storage preference over the system preference', async () => {
      expect(document.body.classList.contains('dark-mode')).toBe(true);
      expect(storageSetSpy).not.toHaveBeenCalled();

      expect(await icon.getName()).toBe('light_mode');

      await tooltip.show();

      expect(await tooltip.getTooltipText()).toBe('Switch to light theme');
      expect(await buttonHost.getAttribute('aria-label')).toBe(
        'Switch to light theme',
      );
    });

    describe('the button is clicked', () => {
      beforeEach(async () => {
        await button.click();
        await fixture.whenStable();
      });

      it('toggles the theme preference', async () => {
        expect(document.body.classList.contains('dark-mode')).toBe(false);
        expect(storageSetSpy).toHaveBeenCalledWith({themePreference: 'light'});

        expect(await icon.getName()).toBe('dark_mode');

        await tooltip.show();

        expect(await tooltip.getTooltipText()).toBe('Switch to dark theme');
        expect(await buttonHost.getAttribute('aria-label')).toBe(
          'Switch to dark theme',
        );
      });

      describe('the button is clicked again', () => {
        beforeEach(async () => {
          await button.click();
          await fixture.whenStable();
        });

        it('toggles the theme preference back', async () => {
          expect(document.body.classList.contains('dark-mode')).toBe(true);
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
