/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Color Palette
export const AppColors = {
  primary: '#007AFF', // Electric Blue - main buttons/headers
  background: '#F5F7FA', // Very light blue-grey
  card: '#FFFFFF', // Pure White
  text: '#2D3436', // Charcoal
  success: '#00B894', // Mint Green
  error: '#FF7675', // Soft Red
  textSecondary: '#636E72', // Secondary text
  border: '#E1E8ED', // Light border
  shadow: '#000000', // Shadow color
};

const tintColorLight = AppColors.primary;
const tintColorDark = AppColors.primary;

export const Colors = {
  light: {
    text: AppColors.text,
    background: AppColors.background,
    tint: tintColorLight,
    icon: AppColors.textSecondary,
    tabIconDefault: AppColors.textSecondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: AppColors.text,
    background: AppColors.background,
    tint: tintColorLight,
    icon: AppColors.textSecondary,
    tabIconDefault: AppColors.textSecondary,
    tabIconSelected: tintColorLight,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
