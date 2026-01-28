---
title: Dark mode theme customization
menuTitle: Dark mode customization
description: Learn how to customize dark mode themes in Grafana
keywords:
  - theme
  - dark mode
  - customization
  - accessibility
  - contrast
weight: 400
---

# Dark mode theme customization

Grafana allows you to customize dark mode themes to better suit your preferences and accessibility needs. You can adjust contrast levels and customize colors for a personalized viewing experience.

## Before you begin

To customize dark mode themes, ensure you:

- Have access to your Grafana user preferences
- Are using a dark theme (dark, or any experimental dark theme)

## Customize your dark mode theme

To customize your dark mode theme:

1. Navigate to your profile settings by clicking on your avatar in the lower-left corner
1. Select **Preferences**
1. In the **Interface theme** dropdown, select a dark theme
1. The theme customization options appear below the theme selector

### Adjust contrast level

You can choose from three contrast levels:

- **Default**: Standard contrast ratios optimized for most users
- **High contrast**: Increased contrast for better visibility and accessibility
- **Low contrast**: Reduced contrast for a softer appearance

To adjust the contrast level:

1. In the **Contrast level** section, select your preferred option
1. The interface updates immediately to reflect your choice

### Customize colors

You can customize the following colors:

- **Accent color**: Primary accent color for buttons and interactive elements
- **Primary color**: Primary color for important UI elements
- **Background color**: Main background color for the application
- **Text color**: Primary text color throughout the interface

To customize a color:

1. Click on the color picker for the color you want to change
1. Select your desired color from the color picker
1. To reset a color to its default value, click **Reset to default** next to the color picker

### Save your preferences

After making your customizations:

1. Click **Save preferences** at the bottom of the form
1. The page reloads with your new theme settings applied

## Accessibility considerations

The theme customization feature includes several accessibility enhancements:

- **High contrast mode**: Improves visibility for users with visual impairments
- **Keyboard accessible**: All controls can be operated using keyboard navigation
- **ARIA labels**: Screen readers can properly announce all controls
- **Clear feedback**: Reset buttons provide clear visual and textual feedback

## Limitations

- Theme customization is only available for dark themes
- Customization applies to the current user only and is not shared across teams or organizations
- Some experimental themes may have limited customization options
- Custom color palettes for data visualization are not affected by theme customization

## Related information

- [Configure Grafana]({{< relref "../" >}})
- [User preferences]({{< relref "./preferences/" >}})
