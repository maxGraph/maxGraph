/*
Copyright 2023-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import type { Preview } from '@storybook/html-vite';
import {
  Client,
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
  StylesheetCodec,
  Translations,
  TranslationsAsI18n,
  unregisterAllCodecs,
  unregisterAllEdgeMarkers,
  unregisterAllEdgeStylesAndPerimeters,
  unregisterAllShapes,
  unregisterAllStencilShapes,
} from '@maxgraph/core';

const defaultLogger = new NoOpLogger();
// if you want to debug using the browser console, use the following configuration
// const defaultLogger = new ConsoleLogger();
// defaultLogger.infoEnabled = true;
// defaultLogger.debugEnabled = true;
// defaultLogger.traceEnabled = true;

defaultLogger.info('[sb-config] Loading i18n resources for Graph...');

const i18nProvider = new TranslationsAsI18n();
Translations.add(`${Client.basePath}/i18n/graph`, null, (): void => {
  defaultLogger.info('[sb-config] i18n resources loaded for Graph');
});

const originalAllowEvalConfig = {
  objectCodec: ObjectCodec.allowEval,
  stylesheetCodec: StylesheetCodec.allowEval,
};

const resetMaxGraphConfigs = (): void => {
  // Global configuration
  GlobalConfig.i18n = i18nProvider;
  GlobalConfig.logger = defaultLogger;

  resetEdgeHandlerConfig();
  resetEntityRelationConnectorConfig();
  resetHandleConfig();
  resetManhattanConnectorConfig();
  resetOrthogonalConnectorConfig();
  resetStyleDefaultsConfig();
  resetTranslationsConfig();
  resetVertexHandlerConfig();

  // Codecs
  unregisterAllCodecs();
  ObjectCodec.allowEval = originalAllowEvalConfig.objectCodec;
  StylesheetCodec.allowEval = originalAllowEvalConfig.stylesheetCodec;

  // Style configuration
  unregisterAllEdgeMarkers();
  unregisterAllEdgeStylesAndPerimeters();
  unregisterAllShapes();

  // The following registries are filled by stories only
  unregisterAllStencilShapes();
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

    docs: {
      codePanel: true,
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
