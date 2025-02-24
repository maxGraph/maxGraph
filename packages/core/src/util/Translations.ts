/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2016, JGraph Ltd
Copyright (c) 2006-2016, Gaudenz Alder

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

import Client from '../Client';
import { NONE } from './Constants';
import { get, load } from './MaxXmlRequest';
import type MaxXmlRequest from './MaxXmlRequest';

/**
 * Implements internationalization. You can provide any number of
 * resource files on the server using the following format for the
 * filename: name[-en].properties. The en stands for any lowercase
 * 2-character language shortcut (eg. de for german, fr for french).
 *
 * If the optional language extension is omitted, then the file is used as a
 * default resource which is loaded in all cases. If a properties file for a
 * specific language exists, then it is used to override the settings in the
 * default resource. All entries in the file are of the form key=value. The
 * values may then be accessed in code via {@link get}. Lines without
 * equal signs in the properties files are ignored.
 *
 * Resource files may either be added programmatically using
 * {@link add} or via a resource tag in the UI section of the
 * editor configuration file, eg:
 *
 * ```xml
 * <Editor>
 *   <ui>
 *     <resource basename="examples/resources/mxWorkflow"/>
 * ```
 *
 * The above element will load examples/resources/mxWorkflow.properties as well
 * as the language specific file for the current language, if it exists.
 *
 * Values may contain placeholders of the form {1}...{n} where each placeholder
 * is replaced with the value of the corresponding array element in the params
 * argument passed to {@link get}. The placeholder {1} maps to the first
 * element in the array (at index 0).
 *
 * See {@link Client.language} for more information on specifying the default
 * language or disabling all loading of resources.
 *
 * Lines that start with a # sign will be ignored.
 *
 * ## Special characters
 *
 * To use unicode characters, use the standard notation (eg. \u8fd1) or %u as a
 * prefix (eg. %u20AC will display a Euro sign). For normal hex encoded strings,
 * use % as a prefix, eg. %F6 will display a "o umlaut" (&ouml;).
 *
 * See {@link resourcesEncoded} to disable this. If you disable this, make sure that
 * your files are UTF-8 encoded.
 *
 * ## Loading default resources
 *
 * Call {@link loadResources} to load the default resources file for both {@link Graph} and {@link Editor}.
 */
class Translations {
  /*
   * Object that maps from keys to values.
   */
  static resources: { [key: string]: string } = {};

  /**
   * Specifies the extension used for language files.
   * @default '.txt'
   */
  static extension = '.txt';

  /**
   * Specifies whether values in resource files are encoded with \u or
   * percentage. Default is false.
   */
  static resourcesEncoded = false;

  /**
   * Specifies if the default file for a given basename should be loaded.
   * Default is true.
   */
  static loadDefaultBundle = true;

  /**
   * Specifies if the specific language file file for a given basename should
   * be loaded. Default is true.
   */
  static loadSpecialBundle = true;

  /**
   * Hook for subclassers to disable support for a given language. This
   * implementation returns true if lan is in <Client.languages>.
   *
   * @param lan The current language.
   */
  static isLanguageSupported = (lan: string): boolean => {
    if (Client.languages != null) {
      return Client.languages.indexOf(lan) >= 0;
    }
    return true;
  };

  /**
   * Hook for subclassers to return the URL for the special bundle. This
   * implementation returns basename + <extension> or null if
   * <loadDefaultBundle> is false.
   *
   * @param basename The basename for which the file should be loaded.
   * @param lan The current language.
   */
  static getDefaultBundle = (basename: string, lan: string): string | null => {
    if (Translations.loadDefaultBundle || !Translations.isLanguageSupported(lan)) {
      return basename + Translations.extension;
    }
    return null;
  };

  /**
   * Hook for subclassers to return the URL for the special bundle. This
   * implementation returns `basename + '_' + lan + <extension>` or `null` if
   * {@link Translations.loadSpecialBundle} is `false` or `lan` equals {@link Client.defaultLanguage}.
   *
   * If {@link Translations#languages} is not null and {@link Client.language} contains
   * a dash, then this method checks if {@link Translations.isLanguageSupported} returns `true`
   * for the full language (including the dash). If that returns false the
   * first part of the language (up to the dash) will be tried as an extension.
   *
   * If {@link Translations#language} is null then the first part of the language is
   * used to maintain backwards compatibility.
   *
   * @param basename The basename for which the file should be loaded.
   * @param lan The language for which the file should be loaded.
   */
  static getSpecialBundle = (basename: string, lan: string): string | null => {
    if (Client.languages == null || !Translations.isLanguageSupported(lan)) {
      const dash = lan.indexOf('-');

      if (dash > 0) {
        lan = lan.substring(0, dash);
      }
    }

    if (
      Translations.loadSpecialBundle &&
      Translations.isLanguageSupported(lan) &&
      lan != Client.defaultLanguage
    ) {
      return `${basename}_${lan}${Translations.extension}`;
    }
    return null;
  };

  /**
   * Adds the default and current language properties file for the specified
   * basename. Existing keys are overridden as new files are added. If no
   * callback is used then the request is synchronous.
   *
   * Example:
   *
   * At application startup, additional resources may be
   * added using the following code:
   *
   * ```javascript
   * Translations.add('resources/editor');
   * ```
   *
   * @param basename The basename for which the file should be loaded.
   * @param lan The language for which the file should be loaded.
   * @param callback Optional callback for asynchronous loading.
   */
  static add = (
    basename: string,
    lan: string | null = null,
    callback: Function | null = null
  ): void => {
    lan =
      lan != null ? lan : Client.language != null ? Client.language.toLowerCase() : NONE;

    if (lan !== NONE) {
      const defaultBundle = Translations.getDefaultBundle(basename, lan);
      const specialBundle = Translations.getSpecialBundle(basename, lan);

      const loadSpecialBundle = () => {
        if (specialBundle != null) {
          if (callback) {
            get(
              specialBundle,
              (req: MaxXmlRequest) => {
                Translations.parse(req.getText());
                callback();
              },
              () => {
                callback();
              }
            );
          } else {
            try {
              const req = load(specialBundle);

              if (req.isReady()) {
                Translations.parse(req.getText());
              }
            } catch (e) {
              // ignore
            }
          }
        } else if (callback != null) {
          callback();
        }
      };

      if (defaultBundle != null) {
        if (callback) {
          get(
            defaultBundle,
            (req: MaxXmlRequest) => {
              Translations.parse(req.getText());
              loadSpecialBundle();
            },
            () => {
              loadSpecialBundle();
            }
          );
        } else {
          try {
            const req = load(defaultBundle);

            if (req.isReady()) {
              Translations.parse(req.getText());
            }

            loadSpecialBundle();
          } catch (e) {
            // ignore
          }
        }
      } else {
        // Overlays the language specific file (_lan-extension)
        loadSpecialBundle();
      }
    }
  };

  /**
   * Parses the key, value pairs in the specified
   * text and stores them as local resources.
   */
  static parse = (text: string): void => {
    if (text != null) {
      const lines = text.split('\n');

      for (let i = 0; i < lines.length; i += 1) {
        if (lines[i].charAt(0) !== '#') {
          const index = lines[i].indexOf('=');

          if (index > 0) {
            const key = lines[i].substring(0, index);
            let idx = lines[i].length;

            if (lines[i].charCodeAt(idx - 1) === 13) {
              idx--;
            }

            let value = lines[i].substring(index + 1, idx);

            if (Translations.resourcesEncoded) {
              value = value.replace(/\\(?=u[a-fA-F\d]{4})/g, '%');
              Translations.resources[key] = unescape(value);
            } else {
              Translations.resources[key] = value;
            }
          }
        }
      }
    }
  };

  /**
   * Returns the value for the specified resource key.
   *
   * Example:
   * To read the value for 'welcomeMessage', use the following:
   * ```javascript
   * let result = Translations.get('welcomeMessage') || '';
   * ```
   *
   * This would require an entry of the following form in
   * one of the English language resource files:
   * ```javascript
   * welcomeMessage=Welcome to mxGraph!
   * ```
   *
   * The part behind the || is the string value to be used if the given
   * resource is not available.
   *
   * @param key String that represents the key of the resource to be returned.
   * @param params Array of the values for the placeholders of the form {1}...{n}
   * to be replaced with in the resulting string.
   * @param defaultValue Optional string that specifies the default return value.
   */
  static get = (
    key: string,
    params: any[] | null = null,
    defaultValue: string | null = null
  ): string | null => {
    let value: string | null = Translations.resources[key];

    // Applies the default value if no resource was found
    if (value == null) {
      value = defaultValue;
    }

    // Replaces the placeholders with the values in the array
    if (value != null && params != null) {
      value = Translations.replacePlaceholders(value, params);
    }
    return value;
  };

  /**
   * Replaces the given placeholders with the given parameters.
   *
   * @param value String that contains the placeholders.
   * @param params Array of the values for the placeholders of the form {1}...{n}
   * to be replaced with in the resulting string.
   */
  static replacePlaceholders = (value: string, params: string[]): string => {
    const result = [];
    let index = null;

    for (let i = 0; i < value.length; i += 1) {
      const c = value.charAt(i);

      if (c === '{') {
        index = '';
      } else if (index != null && c === '}') {
        index = parseInt(index) - 1;

        if (index >= 0 && index < params.length) {
          result.push(params[index]);
        }

        index = null;
      } else if (index != null) {
        index += c;
      } else {
        result.push(c);
      }
    }

    return result.join('');
  };

  /**
   * Loads all required resources asynchronously. Use this to load the graph and editor resources.
   *
   * @param callback Callback function for asynchronous loading.
   */
  static loadResources = (callback: Function): void => {
    Translations.add(`${Client.basePath}/resources/editor`, null, () => {
      Translations.add(`${Client.basePath}/resources/graph`, null, callback);
    });
  };
}

export default Translations;
