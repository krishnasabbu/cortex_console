import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light' | 'monokai';

export const kTheme = 'cortex_theme';

export function themeIsDark() {
  return themeStore.get() === 'dark' || themeStore.get() === 'monokai';
}

export const DEFAULT_THEME = 'light';

export const themeStore = atom<Theme>(initStore());

function initStore() {
  if (!import.meta.env.SSR) {
    const persistedTheme = (localStorage.getItem(kTheme) || localStorage.getItem('bolt_theme')) as Theme | undefined;
    const themeAttribute = document.querySelector('html')?.getAttribute('data-theme');

    if (persistedTheme) {
      return persistedTheme;
    }

    // specific check: if data-theme is empty or null, treat as dark (per user preference)
    if (themeAttribute === '' || themeAttribute === null) {
      return 'dark';
    }

    return (themeAttribute as Theme) ?? DEFAULT_THEME;
  }

  return DEFAULT_THEME;
}

export function toggleTheme() {
  const currentTheme = themeStore.get();
  let newTheme: Theme;

  if (currentTheme === 'light') {
    newTheme = 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'monokai';
  } else {
    newTheme = 'light';
  }

  // Update the theme store
  themeStore.set(newTheme);

  // Update localStorage
  localStorage.setItem(kTheme, newTheme);

  // Update the HTML attribute
  const attributeValue = newTheme === 'dark' ? '' : newTheme;
  console.log(`Setting theme to ${newTheme}, attribute to "${attributeValue}"`);

  if (attributeValue === '') {
    document.querySelector('html')?.removeAttribute('data-theme');
  } else {
    document.querySelector('html')?.setAttribute('data-theme', attributeValue);
  }

  // Update user profile if it exists
  try {
    const userProfile = localStorage.getItem('cortex_user_profile') || localStorage.getItem('bolt_user_profile');

    if (userProfile) {
      const profile = JSON.parse(userProfile);
      profile.theme = newTheme;
      localStorage.setItem('cortex_user_profile', JSON.stringify(profile));
    }
  } catch (error) {
    console.error('Error updating user profile theme:', error);
  }

  logStore.logSystem(`Theme changed to ${newTheme} mode`);
}
