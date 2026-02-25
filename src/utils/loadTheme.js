const defaultTheme = "journal";

const themeModules = import.meta.glob('../assets/themes/*.js', { eager: true });

const themes = new Map();
Object.entries(themeModules).forEach(([path, module]) => {
  const themeName = path.split('/').pop().replace('.js', '');
  themes.set(themeName, module.default);
});

export function loadTheme(config) {
  const themeName = config?.ui?.theme?.preset || defaultTheme;
  const overrides = config?.ui?.theme?.overrides || {};
  const defaultMode = config?.ui?.theme?.defaultMode || null;

  if (!themes.has(themeName)) {
    console.warn(`[theme]: "${themeName}" not found, falling back to "${defaultTheme}"`);
  }

  const baseTheme = themes.get(themeName) || themes.get(defaultTheme);
  
  const mergedTheme = {
    font: { ...baseTheme.font, ...overrides.font },
    colors: {
      light: { ...baseTheme.colors.light, ...overrides.colors?.light },
      dark: { ...baseTheme.colors.dark, ...overrides.colors?.dark }
    }
  };

  const existingLink = document.querySelector('link[data-theme-font]');
  if (existingLink) existingLink.remove();
  
  const existingStyle = document.querySelector('style[data-theme-font]');
  if (existingStyle) existingStyle.remove();
  
  if (mergedTheme.font.url.match(/\.(woff2?|ttf|otf|eot)$/i)) {
    const style = document.createElement('style');
    style.setAttribute('data-theme-font', 'true');
    
    let format = 'woff2';
    if (mergedTheme.font.url.endsWith('.woff')) format = 'woff';
    if (mergedTheme.font.url.endsWith('.ttf')) format = 'truetype';
    if (mergedTheme.font.url.endsWith('.otf')) format = 'opentype';
    
    style.textContent = `
      @font-face {
        font-family: '${mergedTheme.font.family.split(',')[0].trim().replace(/['"]/g, '')}';
        src: url('${mergedTheme.font.url}') format('${format}');
      }
    `;
    document.head.appendChild(style);
  } else {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = mergedTheme.font.url;
    fontLink.setAttribute('data-theme-font', 'true');
    document.head.appendChild(fontLink);
  }

  const root = document.documentElement.style;
  root.setProperty('--font-family', mergedTheme.font.family);
  
  if (mergedTheme.font.scale) {
    root.setProperty('--font-scale', mergedTheme.font.scale);
  } else {
    root.setProperty('--font-scale', '1');
  }

  Object.entries(mergedTheme.colors.light).forEach(([key, value]) => {
    root.setProperty(`--color-${key}`, value);
  });

  Object.entries(mergedTheme.colors.dark).forEach(([key, value]) => {
    root.setProperty(`--color-${key}-dark`, value);
  });

  if (defaultMode && !localStorage.getItem("ode-dark-mode")) {
    const isDark = defaultMode === "dark";
    localStorage.setItem("ode-dark-mode", isDark);
    if (isDark) {
      document.body.classList.add("dark");
    }
  }

  return mergedTheme;
}