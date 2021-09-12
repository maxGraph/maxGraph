import '@maxgraph/css/common.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const globalTypes = {
  width: {
    type: 'number',
    defaultValue: 800,
  },
  height: {
    type: 'number',
    defaultValue: 600,
  },
};
