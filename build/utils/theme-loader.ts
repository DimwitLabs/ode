import fs from 'fs';
import path from 'path';

export interface ThemeConfig {
  font: {
    family: string;
    url: string;
    fallback: string;
  };
  colors: {
    light: {
      primary: string;
      secondary: string;
      grey: string;
      grey2: string;
      text: string;
      highlight: string;
      background: string;
    };
    dark: {
      primary: string;
      secondary: string;
      grey: string;
      grey2: string;
      text: string;
      highlight: string;
      background: string;
    };
  };
}

const themesDir = path.join(process.cwd(), 'src', 'assets', 'themes');

export function loadTheme(themeName: string): ThemeConfig | null {
  const themePath = path.join(themesDir, `${themeName}.js`);
  
  if (!fs.existsSync(themePath)) {
    console.error(`Theme file not found: ${themePath}`);
    return null;
  }

  try {
    const themeContent = fs.readFileSync(themePath, 'utf-8');
    
    const defaultExportMatch = themeContent.match(/export\s+default\s+({[\s\S]*});?\s*$/);
    if (!defaultExportMatch) {
      console.error(`Could not parse theme export in: ${themePath}`);
      return null;
    }

    const themeObjectStr = defaultExportMatch[1];
    const theme = eval(`(${themeObjectStr})`) as ThemeConfig;
    
    return theme;
  } catch (error) {
    console.error(`Error loading theme ${themeName}:`, error);
    return null;
  }
}

export function getAvailableThemes(): string[] {
  if (!fs.existsSync(themesDir)) {
    return [];
  }
  
  return fs.readdirSync(themesDir)
    .filter(file => file.endsWith('.js'))
    .map(file => file.replace('.js', ''));
}

export interface ThemeOverrides {
  font?: Partial<ThemeConfig['font']>;
  colors?: {
    light?: Partial<ThemeConfig['colors']['light']>;
    dark?: Partial<ThemeConfig['colors']['dark']>;
  };
}

export function applyOverrides(theme: ThemeConfig, overrides: ThemeOverrides): ThemeConfig {
  return {
    font: { ...theme.font, ...overrides.font },
    colors: {
      light: { ...theme.colors.light, ...overrides.colors?.light },
      dark: { ...theme.colors.dark, ...overrides.colors?.dark }
    }
  };
}
