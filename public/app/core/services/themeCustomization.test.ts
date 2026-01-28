import { createTheme } from '@grafana/data';
import { ThemeCustomization } from '@grafana/schema/src/raw/preferences/x/preferences_types.gen';

import {
  applyThemeCustomization,
  getContrastMultiplier,
  isValidHexColor,
  getCustomizedThemePreview,
} from './themeCustomization';

describe('themeCustomization', () => {
  describe('applyThemeCustomization', () => {
    it('returns base theme when no customization is provided', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const result = applyThemeCustomization(baseTheme);

      expect(result.name).toBe(baseTheme.name);
      expect(result.colors.mode).toBe('dark');
    });

    it('returns base theme when empty customization is provided', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const result = applyThemeCustomization(baseTheme, {});

      expect(result.name).toBe(baseTheme.name);
    });

    it('applies high contrast level', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const customization: ThemeCustomization = {
        contrastLevel: 'high',
      };

      const result = applyThemeCustomization(baseTheme, customization);

      // With high contrast, the contrast threshold should be multiplied by 1.3
      expect(result.colors.contrastThreshold).toBeGreaterThan(baseTheme.colors.contrastThreshold);
    });

    it('applies low contrast level', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const customization: ThemeCustomization = {
        contrastLevel: 'low',
      };

      const result = applyThemeCustomization(baseTheme, customization);

      // With low contrast, the contrast threshold should be multiplied by 0.7
      expect(result.colors.contrastThreshold).toBeLessThan(baseTheme.colors.contrastThreshold);
    });

    it('applies custom accent color', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const customization: ThemeCustomization = {
        accentColor: '#ff5500',
      };

      const result = applyThemeCustomization(baseTheme, customization);

      expect(result.colors.primary.main).toBe('#ff5500');
    });

    it('applies custom primary color', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const customization: ThemeCustomization = {
        primaryColor: '#00ff00',
      };

      const result = applyThemeCustomization(baseTheme, customization);

      expect(result.colors.info.main).toBe('#00ff00');
    });

    it('applies custom background color', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const customization: ThemeCustomization = {
        backgroundColor: '#1a1a1a',
      };

      const result = applyThemeCustomization(baseTheme, customization);

      expect(result.colors.background.canvas).toBe('#1a1a1a');
    });

    it('applies custom text color', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const customization: ThemeCustomization = {
        textColor: '#ffffff',
      };

      const result = applyThemeCustomization(baseTheme, customization);

      expect(result.colors.text.primary).toBe('#ffffff');
    });

    it('applies multiple customizations at once', () => {
      const baseTheme = createTheme({ colors: { mode: 'dark' } });
      const customization: ThemeCustomization = {
        contrastLevel: 'high',
        accentColor: '#ff5500',
        backgroundColor: '#1a1a1a',
      };

      const result = applyThemeCustomization(baseTheme, customization);

      expect(result.colors.contrastThreshold).toBeGreaterThan(baseTheme.colors.contrastThreshold);
      expect(result.colors.primary.main).toBe('#ff5500');
      expect(result.colors.background.canvas).toBe('#1a1a1a');
    });
  });

  describe('getContrastMultiplier', () => {
    it('returns 1.3 for high contrast', () => {
      expect(getContrastMultiplier('high')).toBe(1.3);
    });

    it('returns 0.7 for low contrast', () => {
      expect(getContrastMultiplier('low')).toBe(0.7);
    });

    it('returns 1.0 for default contrast', () => {
      expect(getContrastMultiplier('default')).toBe(1.0);
    });

    it('returns 1.0 for undefined contrast', () => {
      expect(getContrastMultiplier()).toBe(1.0);
    });
  });

  describe('isValidHexColor', () => {
    it('validates correct hex colors', () => {
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#ff5500')).toBe(true);
      expect(isValidHexColor('#ABC123')).toBe(true);
    });

    it('rejects invalid hex colors', () => {
      expect(isValidHexColor('#FFF')).toBe(false); // Too short
      expect(isValidHexColor('000000')).toBe(false); // Missing #
      expect(isValidHexColor('#GGGGGG')).toBe(false); // Invalid characters
      expect(isValidHexColor('#12345')).toBe(false); // Wrong length
      expect(isValidHexColor('')).toBe(false); // Empty
    });
  });

  describe('getCustomizedThemePreview', () => {
    it('creates dark theme preview without customization', () => {
      const result = getCustomizedThemePreview('dark');

      expect(result.colors.mode).toBe('dark');
      expect(result.isDark).toBe(true);
    });

    it('creates light theme preview without customization', () => {
      const result = getCustomizedThemePreview('light');

      expect(result.colors.mode).toBe('light');
      expect(result.isLight).toBe(true);
    });

    it('creates customized dark theme preview', () => {
      const customization: ThemeCustomization = {
        accentColor: '#ff5500',
        contrastLevel: 'high',
      };

      const result = getCustomizedThemePreview('dark', customization);

      expect(result.colors.mode).toBe('dark');
      expect(result.colors.primary.main).toBe('#ff5500');
      expect(result.colors.contrastThreshold).toBeGreaterThan(3); // Base contrast is 3
    });
  });
});
