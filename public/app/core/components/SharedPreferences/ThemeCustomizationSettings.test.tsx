import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { ThemeCustomization } from '@grafana/schema/src/raw/preferences/x/preferences_types.gen';

import { ThemeCustomizationSettings } from './ThemeCustomizationSettings';

describe('ThemeCustomizationSettings', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all customization fields', () => {
    render(<ThemeCustomizationSettings onChange={mockOnChange} />);

    expect(screen.getByText(/Contrast level/i)).toBeInTheDocument();
    expect(screen.getByText(/Accent color/i)).toBeInTheDocument();
    expect(screen.getByText(/Primary color/i)).toBeInTheDocument();
    expect(screen.getByText(/Background color/i)).toBeInTheDocument();
    expect(screen.getByText(/Text color/i)).toBeInTheDocument();
  });

  it('displays default contrast level', () => {
    render(<ThemeCustomizationSettings onChange={mockOnChange} />);

    const defaultOption = screen.getByRole('radio', { name: /Default/i });
    expect(defaultOption).toBeChecked();
  });

  it('calls onChange when contrast level changes', () => {
    render(<ThemeCustomizationSettings onChange={mockOnChange} />);

    const highContrastOption = screen.getByRole('radio', { name: /High contrast/i });
    fireEvent.click(highContrastOption);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        contrastLevel: 'high',
      })
    );
  });

  it('initializes with provided customization values', () => {
    const customization: ThemeCustomization = {
      contrastLevel: 'low',
      accentColor: '#ff0000',
      primaryColor: '#00ff00',
      backgroundColor: '#0000ff',
      textColor: '#ffffff',
    };

    render(<ThemeCustomizationSettings customization={customization} onChange={mockOnChange} />);

    const lowContrastOption = screen.getByRole('radio', { name: /Low contrast/i });
    expect(lowContrastOption).toBeChecked();
  });

  it('calls onChange when accent color changes', () => {
    render(<ThemeCustomizationSettings onChange={mockOnChange} />);

    const colorInputs = screen.getAllByRole('textbox');
    const accentColorInput = colorInputs[0]; // First color input is accent color
    
    fireEvent.change(accentColorInput, { target: { value: '#ff5500' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        accentColor: '#ff5500',
      })
    );
  });

  it('shows reset button when custom color is set', () => {
    const customization: ThemeCustomization = {
      accentColor: '#ff0000',
    };

    render(<ThemeCustomizationSettings customization={customization} onChange={mockOnChange} />);

    expect(screen.getByText(/Reset to default/i)).toBeInTheDocument();
  });

  it('clears custom color when reset button is clicked', () => {
    const customization: ThemeCustomization = {
      accentColor: '#ff0000',
    };

    render(<ThemeCustomizationSettings customization={customization} onChange={mockOnChange} />);

    const resetButton = screen.getByText(/Reset to default/i);
    fireEvent.click(resetButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        accentColor: undefined,
      })
    );
  });

  it('disables all inputs when disabled prop is true', () => {
    render(<ThemeCustomizationSettings onChange={mockOnChange} disabled={true} />);

    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });

    const colorInputs = screen.getAllByRole('textbox');
    colorInputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });
});
