import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'maxGraph',
  tagline: 'A TypeScript library which can display and allow interaction with vector diagrams.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://maxgraph.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/', // TODO   baseUrl: '/maxGraph/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'maxGraph', // Usually your GitHub org/user name.
  projectName: 'maxGraph', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
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
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/maxGraph/maxGraph/tree/main/packages/docs/',
        },
        // blog: {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        // },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    // image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'maxGraph',
      logo: {
        alt: 'maxGraph Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        // {to: '/docs/api', label: 'API', position: 'left'},
        {
          href: 'https://github.com/maxGraph/maxGraph',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Documentation',
              to: '/docs/intro',
            },
            // {
            //   label: 'API',
            //   to: '/docs/api',
            // },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Questions',
              href: 'https://github.com/maxGraph/maxGraph/discussions/categories/q-a',
            },
            {
              label: 'Issues',
              href: 'https://github.com/maxGraph/maxGraph/issues',
            },
            {
              label: 'Announces',
              href: 'https://github.com/maxGraph/maxGraph/discussions/categories/announces',
            },
            // {
            //   label: 'Twitter',
            //   href: 'https://twitter.com/docusaurus',
            // },
          ],
        },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'GitHub',
              href: 'https://github.com/maxGraph/maxGraph',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} - The maxGraph project Contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
