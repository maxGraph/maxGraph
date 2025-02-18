import type { Preview } from '@storybook/html';
import {
  CellRenderer,
  Client,
  CodecRegistry,
  GlobalConfig,
  MarkerShape,
  NoOpLogger,
  ObjectCodec,
  registerDefaultEdgeMarkers,
  registerDefaultShapes,
  registerDefaultStyleElements,
  resetEdgeHandlerConfig,
  resetEntityRelationConnectorConfig,
  resetHandleConfig,
  resetManhattanConnectorConfig,
  resetOrthogonalConnectorConfig,
  resetStyleDefaultsConfig,
  resetVertexHandlerConfig,
  StencilShapeRegistry,
  StyleRegistry,
  StylesheetCodec,
} from '@maxgraph/core';

const defaultLogger = new NoOpLogger();
// if you want to debug using the browser console, use the following configuration
// const defaultLogger = new ConsoleLogger();
// defaultLogger.infoEnabled = true;
// defaultLogger.debugEnabled = true;
// defaultLogger.traceEnabled = true;

const originalObjectCodecAllowEval = ObjectCodec.allowEval;
const originalStylesheetCodecAllowEval = StylesheetCodec.allowEval;

const originalI18nConfig = {
  defaultLanguage: Client.defaultLanguage,
  language: Client.language,
  languages: Client.languages ? [...Client.languages] : null,
};

const resetMaxGraphConfigs = (): void => {
  GlobalConfig.logger = defaultLogger;

  resetEdgeHandlerConfig();
  resetEntityRelationConnectorConfig();
  resetHandleConfig();
  resetManhattanConnectorConfig();
  resetOrthogonalConnectorConfig();
  resetStyleDefaultsConfig();
  resetVertexHandlerConfig();

  // Reset registries to remove additional elements registered in a story
  // The objects storing the registered elements are currently public, but they should not be part of the public API.
  // They will be marked as private in the future and clear functions will probably provide instead.
  // Codec resets
  CodecRegistry.aliases = {};
  CodecRegistry.codecs = {};
  ObjectCodec.allowEval = originalObjectCodecAllowEval;
  StylesheetCodec.allowEval = originalStylesheetCodecAllowEval;

  // The following registries are filled at Graph initialization with the builtins/defaults provided by maxGraph
  // Here we are forced to register them again, because Graph doesn't force the registration
  CellRenderer.defaultShapes = {};
  registerDefaultShapes(true);
  MarkerShape.markers = {};
  registerDefaultEdgeMarkers(true);
  StyleRegistry.values = {};
  registerDefaultStyleElements(true);

  StencilShapeRegistry.stencils = {};

  // I18n support by maxGraph
  Client.defaultLanguage = originalI18nConfig.defaultLanguage;
  Client.language = originalI18nConfig.language;
  Client.languages = originalI18nConfig.languages;
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
