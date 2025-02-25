import type { Preview } from '@storybook/html';
import {
  Client,
  CodecRegistry,
  GlobalConfig,
  NoOpLogger,
  ObjectCodec,
  resetEdgeHandlerConfig,
  resetEntityRelationConnectorConfig,
  resetHandleConfig,
  resetManhattanConnectorConfig,
  resetOrthogonalConnectorConfig,
  resetStyleDefaultsConfig,
  resetTranslationsConfig,
  resetVertexHandlerConfig,
  StencilShapeRegistry,
  StylesheetCodec,
  Translations,
} from '@maxgraph/core';

const defaultLogger = new NoOpLogger();
// if you want to debug using the browser console, use the following configuration
// const defaultLogger = new ConsoleLogger();
// defaultLogger.infoEnabled = true;
// defaultLogger.debugEnabled = true;
// defaultLogger.traceEnabled = true;

defaultLogger.info('[sb-config] Loading i18n resources for Graph...');
Translations.add(`${Client.basePath}/i18n/graph`, null, (): void => {
  defaultLogger.info('[sb-config] i18n resources loaded for Graph');
});

const originalAllowEvalConfig = {
  objectCodec: ObjectCodec.allowEval,
  stylesheetCodec: StylesheetCodec.allowEval,
};

const resetMaxGraphConfigs = (): void => {
  GlobalConfig.logger = defaultLogger;

  resetEdgeHandlerConfig();
  resetEntityRelationConnectorConfig();
  resetHandleConfig();
  resetManhattanConnectorConfig();
  resetOrthogonalConnectorConfig();
  resetStyleDefaultsConfig();
  resetTranslationsConfig();
  resetVertexHandlerConfig();

  // Reset registries to remove additional elements registered in a story
  // The objects storing the registered elements are currently public, but they should not be part of the public API.
  // They will be marked as private in the future and clear functions will probably provide instead.
  // Codec resets
  CodecRegistry.aliases = {};
  CodecRegistry.codecs = {};
  ObjectCodec.allowEval = originalAllowEvalConfig.objectCodec;
  StylesheetCodec.allowEval = originalAllowEvalConfig.stylesheetCodec;

  // The following registries are filled by stories only
  StencilShapeRegistry.stencils = {};
};

// This function is a workaround to destroy mxGraph elements that are not released by the previous story.
// See https://github.com/maxGraph/maxGraph/issues/400
function destroyUnreleasedElements() {
  document
    .querySelectorAll('.mxPopupMenu,.mxTooltip,.mxWindow')
    .forEach((e) => e.remove());
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    // reset the global configurations, as they may have been globally changed in a story (for example, the Window story updates the logger configuration)
    // inspired by https://github.com/storybookjs/storybook/issues/4997#issuecomment-447301514
    (storyFn) => {
      resetMaxGraphConfigs();
      destroyUnreleasedElements();
      return storyFn();
    },
  ],
};

export default preview;
