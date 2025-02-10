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

// Implementation extracted from Client
// TODO find a better name or make anonymous
export class TranslationsConfigBase {
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
export const TranslationsConfig = new TranslationsConfigBase();
