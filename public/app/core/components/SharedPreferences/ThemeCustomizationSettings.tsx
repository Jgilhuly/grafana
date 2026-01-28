import { css } from '@emotion/css';
import { useState } from 'react';
import * as React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { ThemeCustomization } from '@grafana/schema/src/raw/preferences/x/preferences_types.gen';
import { Field, Input, RadioButtonGroup, Stack, useStyles2 } from '@grafana/ui';

interface Props {
  customization?: ThemeCustomization;
  onChange: (customization: ThemeCustomization) => void;
  disabled?: boolean;
}

const contrastOptions = [
  { label: t('theme-customization.contrast.default', 'Default'), value: 'default' },
  { label: t('theme-customization.contrast.high', 'High contrast'), value: 'high' },
  { label: t('theme-customization.contrast.low', 'Low contrast'), value: 'low' },
];

export function ThemeCustomizationSettings({ customization, onChange, disabled }: Props) {
  const styles = useStyles2(getStyles);
  const [localCustomization, setLocalCustomization] = useState<ThemeCustomization>(
    customization || { contrastLevel: 'default' }
  );

  const handleChange = (updates: Partial<ThemeCustomization>) => {
    const updated = { ...localCustomization, ...updates };
    setLocalCustomization(updated);
    onChange(updated);
  };

  const handleColorChange = (field: keyof ThemeCustomization) => (event: React.FormEvent<HTMLInputElement>) => {
    handleChange({ [field]: event.currentTarget.value });
  };

  const handleColorClear = (field: keyof ThemeCustomization) => () => {
    handleChange({ [field]: undefined });
  };

  const renderColorField = (
    field: keyof ThemeCustomization,
    label: string,
    description: string,
    defaultValue?: string
  ) => {
    const value = localCustomization[field] as string | undefined;
    return (
      <Field label={label} description={description}>
        <Stack gap={1} alignItems="flex-start">
          <Input
            type="color"
            value={value || defaultValue || '#000000'}
            onChange={handleColorChange(field)}
            disabled={disabled}
            width={20}
          />
          {value && (
            <button type="button" onClick={handleColorClear(field)} className={styles.clearButton} disabled={disabled}>
              <Trans i18nKey="theme-customization.reset">Reset to default</Trans>
            </button>
          )}
        </Stack>
      </Field>
    );
  };

  return (
    <div className={styles.container}>
      <Field label={t('theme-customization.contrast.label', 'Contrast level')}>
        <RadioButtonGroup
          options={contrastOptions}
          value={localCustomization.contrastLevel || 'default'}
          onChange={(value) => handleChange({ contrastLevel: value })}
          disabled={disabled}
        />
      </Field>

      {renderColorField(
        'accentColor',
        t('theme-customization.accent-color.label', 'Accent color'),
        t('theme-customization.accent-color.description', 'Custom accent color for buttons and interactive elements')
      )}

      {renderColorField(
        'primaryColor',
        t('theme-customization.primary-color.label', 'Primary color'),
        t('theme-customization.primary-color.description', 'Primary color for important UI elements')
      )}

      {renderColorField(
        'backgroundColor',
        t('theme-customization.background-color.label', 'Background color'),
        t('theme-customization.background-color.description', 'Main background color')
      )}

      {renderColorField(
        'textColor',
        t('theme-customization.text-color.label', 'Text color'),
        t('theme-customization.text-color.description', 'Primary text color')
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      borderTop: `1px solid ${theme.colors.border.weak}`,
    }),
    clearButton: css({
      background: 'none',
      border: 'none',
      color: theme.colors.text.link,
      cursor: 'pointer',
      padding: theme.spacing(0.5, 1),
      textDecoration: 'underline',
      '&:hover': {
        color: theme.colors.text.primary,
      },
      '&:disabled': {
        color: theme.colors.text.disabled,
        cursor: 'not-allowed',
      },
    }),
  };
};
