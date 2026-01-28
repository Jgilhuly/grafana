import { createTheme, GrafanaTheme2, NewThemeOptions } from '@grafana/data';
import { ThemeCustomization } from '@grafana/schema/src/raw/preferences/x/preferences_types.gen';

/**
 * Apply theme customization to create a custom theme
 */
export function applyThemeCustomization(
  baseTheme: GrafanaTheme2,
  customization?: ThemeCustomization
): GrafanaTheme2 {
  if (!customization) {
    return baseTheme;
  }

  const themeOptions: NewThemeOptions = {
    name: baseTheme.name,
    colors: {
      mode: baseTheme.colors.mode,
    },
  };

  // Apply contrast level adjustments
  if (customization.contrastLevel && customization.contrastLevel !== 'default') {
    const contrastFactor = customization.contrastLevel === 'high' ? 1.3 : 0.7;
    
    // Adjust contrast threshold based on user preference
    if (themeOptions.colors) {
      themeOptions.colors.contrastThreshold = baseTheme.colors.contrastThreshold * contrastFactor;
    }
  }

  // Apply custom accent color
  if (customization.accentColor) {
    if (!themeOptions.colors) {
      themeOptions.colors = {};
    }
    themeOptions.colors.primary = {
      main: customization.accentColor,
    };
  }

  // Apply custom primary color
  if (customization.primaryColor) {
    if (!themeOptions.colors) {
      themeOptions.colors = {};
    }
    themeOptions.colors.info = {
      main: customization.primaryColor,
    };
  }

  // Apply custom background color
  if (customization.backgroundColor) {
    if (!themeOptions.colors) {
      themeOptions.colors = {};
    }
    themeOptions.colors.background = {
      canvas: customization.backgroundColor,
    };
  }

  // Apply custom text color
  if (customization.textColor) {
    if (!themeOptions.colors) {
      themeOptions.colors = {};
    }
    themeOptions.colors.text = {
      primary: customization.textColor,
    };
  }

  return createTheme(themeOptions);
}

/**
 * Get contrast level multiplier based on customization
 */
export function getContrastMultiplier(contrastLevel?: string): number {
  switch (contrastLevel) {
    case 'high':
      return 1.3;
    case 'low':
      return 0.7;
    default:
      return 1.0;
  }
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Get a preview theme with customization applied
 */
export function getCustomizedThemePreview(
  themeName: string,
  customization?: ThemeCustomization
): GrafanaTheme2 {
  const baseTheme = createTheme({
    name: themeName,
    colors: {
      mode: themeName === 'dark' ? 'dark' : 'light',
    },
  });

  return applyThemeCustomization(baseTheme, customization);
}
