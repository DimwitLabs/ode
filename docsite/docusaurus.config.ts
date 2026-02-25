import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Ode',
  tagline: 'Documentation',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://ode.dimwit.me',
  baseUrl: '/',

  organizationName: 'DeepanshKhurana',
  projectName: 'ode',

  onBrokenLinks: 'throw',

  markdown: {
    format: 'detect',
    preprocessor: ({fileContent}) => {
      let processed = fileContent.replace(
        /import (\w+) from '@site\/\.\.\/([^']+)';\s*\n\n<\1 \/>/g,
        (match, name, filePath) => {
          try {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.resolve(__dirname, '..', filePath);
            if (fs.existsSync(fullPath)) {
              return fs.readFileSync(fullPath, 'utf8');
            }
          } catch (e) {
            console.error(`Failed to inline ${filePath}:`, e);
          }
          return match;
        }
      );

      processed = processed.replace(
        /^> ?\[!(NOTE|TIP|WARNING|DANGER|CAUTION)\]\s*\n((?:>.*\n?)*)/gm,
        (match, type, content) => {
          const cleanContent = content.split('\n').map(line => line.replace(/^> ?/, '')).join('\n');
          return `:::${type.toLowerCase()}\n${cleanContent}\n:::\n`;
        }
      );

      processed = processed.replace(
        /!\[(.*?)\]\(\.github\/media\/(.*?)\)/g,
        '<a href={require("@site/../.github/media/$2").default} target="_blank"><img src={require("@site/../.github/media/$2").default} alt="$1" /></a>'
      );

      processed = processed.replace(
        /\[([^\]]+)\]\((?:\.\/|https:\/\/github\.com\/DeepanshKhurana\/ode\/blob\/main\/)?(README\.md|ETHOS\.md|WRITING\.md|THEMING\.md|REFERENCES\.md|CHANGELOG\.md|LICENSE)\)/g,
        (match, text, file) => {
          const slug = file.toLowerCase().replace('.md', '');
          const route = slug === 'readme' ? '/' : `/${slug}`;
          return `[${text}](${route})`;
        }
      );

      processed = processed.replace(
        /\[!\[Build and Publish\].*?\]\(.*?\)\s*\n/g,
        ''
      );

      return processed;
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/DeepanshKhurana/ode/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: "/",
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Ode',
      logo: {
        alt: 'Ode Logo',
        src: 'img/favicon.ico',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'html',
          position: 'right',
          value: '<span style="padding: 0.25rem 0.5rem; background: var(--ifm-color-primary); color: white; border-radius: 4px; font-size: 0.875rem; font-weight: 600;">v1.4.0</span>',
        },
        {
          href: 'https://demo.ode.dimwit.me/',
          label: 'Live Demo',
          position: 'right',
        },
        {
          href: 'https://github.com/DeepanshKhurana/ode/',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Ethos', to: '/ethos' },
            { label: 'Writing', to: '/writing' },
            { label: 'Theming', to: '/theming' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'References', to: '/references' },
            { label: 'Changelog', to: '/changelog' },
            { label: 'License', to: '/license' },
          ],
        },
        {
          title: 'Links',
          items: [
            { label: 'GitHub', href: 'https://github.com/DeepanshKhurana/ode/' },
            { label: 'GitHub Sponsors', href: 'https://github.com/sponsors/deepanshkhurana' },
            { label: 'Buy Me a Coffee', href: 'https://www.buymeacoffee.com/deepansh' },
          ],
        },
      ],
      copyright: `Made with love and labour by Deepansh Khurana | MIT License`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
