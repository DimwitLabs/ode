import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { loadTheme, ThemeConfig } from './utils/theme-loader';

interface RedeployPageConfig {
  title?: string;
  message?: string;
  submessage?: string;
  refreshInterval?: number;
  refreshNotice?: string;
}

interface Config {
  site: {
    name?: string;
    title?: string;
  };
  theme?: string;
  ui?: {
    lowercase?: boolean;
    theme?: {
      defaultMode?: 'light' | 'dark';
    };
  };
  redeployPage?: RedeployPageConfig;
}

const publicDir = path.join(process.cwd(), 'public');
const generatedDir = path.join(publicDir, 'generated');
const templateDir = path.join(process.cwd(), 'build', 'templates');

if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

const configPath = path.join(publicDir, 'config.yaml');
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = yaml.load(configContent) as Config;

const themeName = config.theme || 'journal';
const theme = loadTheme(themeName);

if (!theme) {
  console.error(`[redeploy]: could not load theme: ${themeName}`);
  process.exit(1);
}

const redeployConfig = config.redeployPage || {};
const useLowercase = config.ui?.lowercase || false;
const applyCase = (str: string) => useLowercase ? str.toLowerCase() : str;

const title = applyCase(redeployConfig.title || 'Just a moment...');
const message = applyCase(redeployConfig.message || "We're updating things behind the scenes.");
const submessage = applyCase(redeployConfig.submessage || 'Please refresh in a few seconds.');
const refreshInterval = redeployConfig.refreshInterval || 10;
const refreshNotice = applyCase((redeployConfig.refreshNotice || 'This page will refresh automatically in {interval} seconds.').replace('{interval}', String(refreshInterval)));
const siteName = config.site?.name || config.site?.title || 'Ode';

function generate502Page(theme: ThemeConfig): string {
  const mode = config.ui?.theme?.defaultMode || 'light';
  const colors = theme.colors[mode];

  const templatePath = path.join(templateDir, '502.html');
  let template = fs.readFileSync(templatePath, 'utf-8');

  const replacements: Record<string, string> = {
    title,
    siteName,
    fontUrl: theme.font.url,
    fontFamily: theme.font.family,
    bgColor: colors.background,
    fgColor: colors.text,
    accentColor: colors.primary,
    mutedColor: colors.grey2,
    message,
    submessage,
    refreshNotice,
    refreshInterval: String(refreshInterval),
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return template;
}

const html = generate502Page(theme);
fs.writeFileSync(path.join(generatedDir, '502.html'), html);
console.log('[redeploy]: generated 502.html');
