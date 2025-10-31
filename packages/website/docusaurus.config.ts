import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { PluginOptions as SearchPluginOptions } from '@easyops-cn/docusaurus-search-local';

const baseUrl = '/maxGraph/';
const editUrl = 'https://github.com/maxGraph/maxGraph/edit/main/packages/website/';

const config: Config = {
  title: 'maxGraph',
  // The "generated" directory contains the demo (storybook) and the API documentation (typedoc)
  staticDirectories: ['generated', 'static'],
  tagline:
    'A TypeScript library which can display and allow interaction with vector diagrams.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://maxgraph.github.io/', // mainly used for sitemap.xml
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'maxGraph', // Usually your GitHub org/username.
  projectName: 'maxGraph', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  onBrokenMarkdownLinks: 'throw',

  future: {
    // v3.8: `future.experimental_faster.ssgWorkerThreads` requires the future flag `future.v4.removeLegacyPostBuildHeadAttribute` to be turned on.
    v4: true,
    // Enable rspack build introduce in 3.6.0, see https://docusaurus.io/blog/releases/3.6#adoption-strategy
    experimental_faster: true,
  },

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
        blog: {
          editUrl: editUrl,
        },
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl,
          showLastUpdateAuthor: false,
          showLastUpdateTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    // image: 'img/docusaurus-social-card.jpg',
    // announcementBar: {
    //   content:
    //     '⚠️ This is a <b>work in progress</b>, the content of the original <i>mxGraph</i> documentation will be progressively migrated here ⚠️',
    //   backgroundColor: 'rgb(255, 248, 230)',
    //   isCloseable: false,
    // },
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    navbar: {
      title: 'maxGraph',
      logo: {
        alt: 'maxGraph Logo',
        src: 'img/logo.svg',
      },
      hideOnScroll: true,
      items: [
        // left items
        {
          label: 'Docs',
          position: 'left',
          sidebarId: 'docsSidebar',
          type: 'docSidebar',
        },
        {
          href: `${baseUrl}api-docs/`,
          label: 'API',
          position: 'left',
          target: '_blank',
        },
        {
          to: 'blog',
          label: 'Blog',
          position: 'left',
        },
        {
          href: `${baseUrl}demo/`,
          label: 'Demo',
          position: 'left',
          target: '_blank',
        },
        // right items
        {
          href: 'https://github.com/maxGraph/maxGraph',
          'aria-label': 'GitHub repository',
          position: 'right',
          className: 'header-github-link',
        },
      ],
    },
    colorMode: {
      respectPrefersColorScheme: true, // Enable system theme mode
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Content',
          items: [
            {
              label: 'Documentation',
              to: '/docs/intro',
            },
            {
              href: `${baseUrl}api-docs/`,
              label: 'API Reference',
              target: '_blank',
            },
            {
              href: `${baseUrl}demo/`,
              label: 'Demo',
              target: '_blank',
            },
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
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/maxGraph/maxGraph',
            },
          ],
        },
      ],
      copyright: `Copyright © 2021-${new Date().getFullYear()} - The maxGraph project Contributors.<br/> Built with <a class="footer__link-item" href="https://docusaurus.io" target="_blank" rel="noopener noreferrer">Docusaurus</a>.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        // `hashed` is recommended as long-term-cache of index file is possible.
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: false,
        explicitSearchResultPath: true,
      } satisfies SearchPluginOptions,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          // docs/manual/getting-started -> /docs/getting-started
          {
            to: '/docs/getting-started',
            from: '/docs/manual/getting-started',
          },
          // docs/manual/model-and-cells -> /docs/manual/model-and-transactions
          {
            to: '/docs/manual/model-and-transactions',
            from: '/docs/manual/model-and-cells',
          },
        ],
      },
    ],
  ],
};

export default config;
