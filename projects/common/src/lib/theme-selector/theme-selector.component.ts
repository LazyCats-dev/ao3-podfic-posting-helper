import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';

const THEME_PREFERENCES = ['light', 'dark', 'none'] as const;

type ThemePreference = (typeof THEME_PREFERENCES)[number];

@Component({
  selector: 'lib-theme-selector',
  standalone: true,
  imports: [MatIcon, MatIconButton, MatTooltip],
  templateUrl: './theme-selector.component.html',
  styleUrl: './theme-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSelectorComponent implements OnInit {
  private readonly errorHandler = inject(ErrorHandler);

  private readonly manualThemePreference = signal<ThemePreference>('none');
  private readonly systemThemePreference = signal<
    Exclude<ThemePreference, 'none'>
  >(
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );
  private readonly storageThemePreference = signal<ThemePreference>('none');

  protected readonly themePreference = computed(() => {
    const manualThemePreference = this.manualThemePreference();
    if (manualThemePreference !== 'none') {
      return manualThemePreference;
    }
    const storageThemePreference = this.storageThemePreference();
    if (storageThemePreference !== 'none') {
      return storageThemePreference;
    }
    return this.systemThemePreference();
  });

  protected readonly icon = computed(() => {
    const themePreference = this.themePreference();
    switch (themePreference) {
      case 'dark':
        return 'light_mode';
      case 'light':
        return 'dark_mode';
    }
  });

  protected readonly tooltipText = computed(() => {
    const themePreference = this.themePreference();
    switch (themePreference) {
      case 'dark':
        return 'Switch to light theme';
      case 'light':
        return 'Switch to dark theme';
    }
  });

  constructor() {
    effect(async () => {
      const themePreference = this.manualThemePreference();
      if (themePreference === 'none') {
        return;
      }
      await chrome.storage.sync.set({themePreference});
    });
    effect(async () => {
      const themePreference = this.themePreference();
      switch (themePreference) {
        case 'light':
          document.body.classList.remove('dark-mode');
          break;
        case 'dark':
          document.body.classList.add('dark-mode');
          break;
      }
    });
  }

  async ngOnInit() {
    let themePreference = 'none';
    try {
      const results = await chrome.storage.sync.get('themePreference');
      themePreference = results['themePreference'];
    } catch (e) {
      this.errorHandler.handleError(e);
    }
    if (!isThemePreference(themePreference)) {
      return;
    }
    this.storageThemePreference.set(themePreference);
  }

  protected toggleManualThemePreference() {
    const themePreference = this.themePreference();
    switch (themePreference) {
      case 'light':
        this.manualThemePreference.set('dark');
        break;
      case 'dark':
        this.manualThemePreference.set('light');
        break;
      default:
        throw new Error('Unknown theme preference');
    }
  }
}

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}
