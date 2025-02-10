/*
Copyright 2025-present The maxGraph project Contributors

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

function getNavigatorLanguage() {
  return typeof window !== 'undefined' ? navigator.language : 'en';
}

// Implementation extracted from Client
// TODO find a better name or make anonymous
class TranslationsConfigBase {
  private language = getNavigatorLanguage();

  /**
   * Returns whether internationalization is enabled.
   */
  isI18nEnabled(): boolean {
    // TODO use the NONE constant here
    return this.getLanguage() !== 'none';
  }

  /**
   * Defines the language of the client, eg. `en` for english, `de` for german etc.
   * The special value `none` will disable all built-in internationalization and
   * resource loading. See {@link Translations.getSpecialBundle} for handling identifiers
   * with and without a dash.
   *
   * If internationalization is disabled, then the following variables should be
   * overridden to reflect the current language of the system. These variables are
   * cleared when i18n is disabled.
   * {@link Editor.askZoomResource}, {@link Editor.lastSavedResource},
   * {@link Editor.currentFileResource}, {@link Editor.propertiesResource},
   * {@link Editor.tasksResource}, {@link Editor.helpResource}, {@link Editor.outlineResource},
   * {@link ElbowEdgeHandler#doubleClickOrientationResource}, {@link utils.errorResource},
   * {@link utils.closeResource}, {@link GraphSelectionModel#doneResource},
   * {@link GraphSelectionModel#updatingSelectionResource}, {@link GraphView#doneResource},
   * {@link GraphView#updatingDocumentResource}, {@link CellRenderer#collapseExpandResource},
   * {@link Graph#containsValidationErrorsResource} and
   * {@link Graph#alreadyConnectedResource}.
   */
  getLanguage(): string {
    return this.language;
  }

  setLanguage(value: string | undefined | null): void {
    if (typeof value !== 'undefined' && value != null) {
      this.language = value;
    } else {
      this.language = getNavigatorLanguage();
    }
  }

  /**
   * Defines the optional array of all supported language extensions. The default
   * language does not have to be part of this list. See
   * {@link Translations#isLanguageSupported}.
   *
   * This is used to avoid unnecessary requests to language files, ie. if a 404
   * will be returned.
   * @default null
   */
  languages: string[] | null = null;

  setLanguages(value: string[] | null | undefined): void {
    if (typeof value !== 'undefined' && value != null) {
      this.languages = value;
    }
  }

  /**
   * Defines the default language which is used in the common resource files. Any
   * resources for this language will only load the common resource file, but not
   * the language-specific resource file.
   * @default 'en'
   */
  defaultLanguage = 'en';

  setDefaultLanguage(value: string | undefined | null): void {
    if (typeof value !== 'undefined' && value != null) {
      this.defaultLanguage = value;
    } else {
      this.defaultLanguage = 'en';
    }
  }
}

/**
 * Global configuration for {@link Translations}.
 */
// TODO export in root index.ts
// TODO add reference in documentation about global configuration
export const TranslationsConfig = new TranslationsConfigBase();
