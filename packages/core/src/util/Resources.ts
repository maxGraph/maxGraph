/**
 * Copyright (c) 2006-2016, JGraph Ltd
 * Copyright (c) 2006-2016, Gaudenz Alder
 */
import Client from '../Client';
import { NONE } from './constants';
import { get, load } from './MaxXmlRequest';

/**
 * Class: mxResources
 *
 * Implements internationalization. You can provide any number of
 * resource files on the server using the following format for the
 * filename: name[-en].properties. The en stands for any lowercase
 * 2-character language shortcut (eg. de for german, fr for french).
 *
 * If the optional language extension is omitted, then the file is used as a
 * default resource which is loaded in all cases. If a properties file for a
 * specific language exists, then it is used to override the settings in the
 * default resource. All entries in the file are of the form key=value. The
 * values may then be accessed in code via <get>. Lines without
 * equal signs in the properties files are ignored.
 *
 * Resource files may either be added programmatically using
 * <add> or via a resource tag in the UI section of the
 * editor configuration file, eg:
 *
 * (code)
 * <Editor>
 *   <ui>
 *     <resource basename="examples/resources/mxWorkflow"/>
 * (end)
 *
 * The above element will load examples/resources/mxWorkflow.properties as well
 * as the language specific file for the current language, if it exists.
 *
 * Values may contain placeholders of the form {1}...{n} where each placeholder
 * is replaced with the value of the corresponding array element in the params
 * argument passed to <mxResources.get>. The placeholder {1} maps to the first
 * element in the array (at index 0).
 *
 * See <Client.language> for more information on specifying the default
 * language or disabling all loading of resources.
 *
 * Lines that start with a # sign will be ignored.
 *
 * Special characters
 *
 * To use unicode characters, use the standard notation (eg. \u8fd1) or %u as a
 * prefix (eg. %u20AC will display a Euro sign). For normal hex encoded strings,
 * use % as a prefix, eg. %F6 will display a "o umlaut" (&ouml;).
 *
 * See <resourcesEncoded> to disable this. If you disable this, make sure that
 * your files are UTF-8 encoded.
 *
 * Asynchronous loading
 *
 * By default, the core adds two resource files synchronously at load time.
 * To load these files asynchronously, set <mxLoadResources> to false
 * before loading Client.js and use <mxResources.loadResources> instead.
 */
const Resources = {
  /*
   * Object that maps from keys to values.
   */
  resources: {},

  /**
   * Specifies the extension used for language files. Default is <mxResourceExtension>.
   */
  extension: '.txt',

  /**
   * Specifies whether or not values in resource files are encoded with \u or
   * percentage. Default is false.
   */
  resourcesEncoded: false,

  /**
   * Specifies if the default file for a given basename should be loaded.
   * Default is true.
   */
  loadDefaultBundle: true,

  /**
   * Specifies if the specific language file file for a given basename should
   * be loaded. Default is true.
   */
  loadSpecialBundle: true,

  /**
   * Hook for subclassers to disable support for a given language. This
   * implementation returns true if lan is in <Client.languages>.
   *
   * Parameters:
   *
   * lan - The current language.
   */
  isLanguageSupported: (lan) => {
    if (Client.languages != null) {
      return Client.languages.indexOf(lan) >= 0;
    }

    return true;
  },

  /**
   * Hook for subclassers to return the URL for the special bundle. This
   * implementation returns basename + <extension> or null if
   * <loadDefaultBundle> is false.
   *
   * Parameters:
   *
   * basename - The basename for which the file should be loaded.
   * lan - The current language.
   */
  getDefaultBundle: (basename, lan) => {
    if (
      Resources.loadDefaultBundle ||
      !Resources.isLanguageSupported(lan)
    ) {
      return basename + (Resources.extension ?? Client.mxResourceExtension);
    }
    return null;
  },

  /**
   * Hook for subclassers to return the URL for the special bundle. This
   * implementation returns basename + '_' + lan + <extension> or null if
   * <loadSpecialBundle> is false or lan equals <Client.defaultLanguage>.
   *
   * If <mxResources.languages> is not null and <Client.language> contains
   * a dash, then this method checks if <isLanguageSupported> returns true
   * for the full language (including the dash). If that returns false the
   * first part of the language (up to the dash) will be tried as an extension.
   *
   * If <mxResources.language> is null then the first part of the language is
   * used to maintain backwards compatibility.
   *
   * Parameters:
   *
   * basename - The basename for which the file should be loaded.
   * lan - The language for which the file should be loaded.
   */
  getSpecialBundle: (basename, lan) => {
    if (Client.languages == null || !this.isLanguageSupported(lan)) {
      const dash = lan.indexOf('-');

      if (dash > 0) {
        lan = lan.substring(0, dash);
      }
    }

    if (
      Resources.loadSpecialBundle &&
      Resources.isLanguageSupported(lan) &&
      lan != Client.defaultLanguage
    ) {
      return `${basename}_${lan}${
        Resources.extension ?? Client.mxResourceExtension
      }`;
    }
    return null;
  },

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
   * (code)
   * mxResources.add('resources/editor');
   * (end)
   *
   * Parameters:
   *
   * basename - The basename for which the file should be loaded.
   * lan - The language for which the file should be loaded.
   * callback - Optional callback for asynchronous loading.
   */
  add: (basename: string, lan: string, callback: (Function)) => {
    lan =
      lan != null
        ? lan
        : Client.language != null
        ? Client.language.toLowerCase()
        : NONE;

    if (lan !== NONE) {
      const defaultBundle = Resources.getDefaultBundle(basename, lan);
      const specialBundle = Resources.getSpecialBundle(basename, lan);

      const loadSpecialBundle = () => {
        if (specialBundle != null) {
          if (callback) {
            get(
              specialBundle,
              (req) => {
                Resources.parse(req.getText());
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
                Resources.parse(req.getText());
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
            (req) => {
              Resources.parse(req.getText());
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
              Resources.parse(req.getText());
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
  },

  /**
   * Parses the key, value pairs in the specified
   * text and stores them as local resources.
   */
  parse: (text: string) => {
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

            if (this.resourcesEncoded) {
              value = value.replace(/\\(?=u[a-fA-F\d]{4})/g, '%');
              Resources.resources[key] = unescape(value);
            } else {
              Resources.resources[key] = value;
            }
          }
        }
      }
    }
  },

  /**
   * Returns the value for the specified resource key.
   *
   * Example:
   * To read the value for 'welomeMessage', use the following:
   * (code)
   * let result = mxResources.get('welcomeMessage') || '';
   * (end)
   *
   * This would require an entry of the following form in
   * one of the English language resource files:
   * (code)
   * welcomeMessage=Welcome to mxGraph!
   * (end)
   *
   * The part behind the || is the string value to be used if the given
   * resource is not available.
   *
   * Parameters:
   *
   * key - String that represents the key of the resource to be returned.
   * params - Array of the values for the placeholders of the form {1}...{n}
   * to be replaced with in the resulting string.
   * defaultValue - Optional string that specifies the default return value.
   */
  get: (key: string, params: any[]|null=null, defaultValue?: string) => {
    let value = Resources.resources[key];

    // Applies the default value if no resource was found
    if (value == null) {
      value = defaultValue;
    }

    // Replaces the placeholders with the values in the array
    if (value != null && params != null) {
      value = Resources.replacePlaceholders(value, params);
    }

    return value;
  },

  /**
   * Replaces the given placeholders with the given parameters.
   *
   * Parameters:
   *
   * value - String that contains the placeholders.
   * params - Array of the values for the placeholders of the form {1}...{n}
   * to be replaced with in the resulting string.
   */
  replacePlaceholders: (value, params) => {
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
  },

  /**
   * Loads all required resources asynchronously. Use this to load the graph and
   * editor resources if <mxLoadResources> is false.
   *
   * Parameters:
   *
   * callback - Callback function for asynchronous loading.
   */
  loadResources: (callback) => {
    Resources.add(`${Client.basePath}/resources/editor`, null, () => {
      Resources.add(`${Client.basePath}/resources/graph`, null, callback);
    });
  },
};

export default Resources;
