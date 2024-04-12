import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ThemeSelectorComponent} from './theme-selector.component';

describe('ThemeSelectorComponent', () => {
  let matchMediaSpy: jasmine.Spy<typeof window.matchMedia>;
  let storageSpy: jasmine.Spy;

  beforeEach(async () => {
    matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
    } as MediaQueryList);
    storageSpy = spyOn(chrome.storage.sync, 'get');
    storageSpy
      .withArgs(['themePreference'])
      .and.resolveTo({themePreference: undefined});
    await TestBed.configureTestingModule({
      imports: [ThemeSelectorComponent],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.classList.remove('dark-mode');
  });

  describe('with no storage preference', () => {
    beforeEach(() => {
      // No theme preference is stored.
      storageSpy.and.returnValue({themePreference: undefined});
    });

    it('respect the system preference for light mode', () => {
      matchMediaSpy.and.returnValue({matches: false} as MediaQueryList);

      const fixture = TestBed.createComponent(ThemeSelectorComponent);
      fixture.detectChanges();
      expect(document.body.classList.contains('dark-mode')).toBeFalse();
    });

    it('respect the system preference for dark mode', () => {
      matchMediaSpy.and.returnValue({matches: true} as MediaQueryList);

      const fixture = TestBed.createComponent(ThemeSelectorComponent);
      fixture.detectChanges();
      expect(document.body.classList.contains('dark-mode')).toBeTrue();
    });
  });

  describe('with a storage preference of dark', () => {
    beforeEach(() => {
      // Dark mode preference is already in storage.
      storageSpy.and.returnValue({themePreference: 'dark'});
      // Light mode is preferred at the system level.
      matchMediaSpy.and.returnValue({matches: false} as MediaQueryList);
    });
  });

  let component: ThemeSelectorComponent;
  let fixture: ComponentFixture<ThemeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
