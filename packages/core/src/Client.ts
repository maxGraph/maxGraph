/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2017, JGraph Ltd
Copyright (c) 2006-2017, Gaudenz Alder

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

import { NS_SVG } from './util/Constants';

class Client {
  /**
   * The version of the `maxGraph` library.
   */
  static VERSION = '0.14.0';

  /**
   * Base path for all URLs in the core without trailing slash.
   *
   * When using a relative path, the path is relative to the URL of the page that contains the assignment. Trailing slashes are automatically removed.
   * @default '.'
   */
  static basePath = '.';

  static setBasePath = (value: string) => {
    if (typeof value !== 'undefined' && value.length > 0) {
      // Adds a trailing slash if required
      if (value.substring(value.length - 1) === '/') {
        value = value.substring(0, value.length - 1);
      }
      Client.basePath = value;
    } else {
      Client.basePath = '.';
    }
  };

  /**
   * Base path for all images URLs in the core without trailing slash.
   *
   * When using a relative path, the path is relative to the URL of the page that
   * contains the assignment. Trailing slashes are automatically removed.
   * @default '.'
   */
  static imageBasePath = '.';

  static setImageBasePath = (value: string) => {
    if (typeof value !== 'undefined' && value.length > 0) {
      // Adds a trailing slash if required
      if (value.substring(value.length - 1) === '/') {
        value = value.substring(0, value.length - 1);
      }
      Client.imageBasePath = value;
    } else {
      Client.imageBasePath = `${Client.basePath}/images`;
    }
  };

  /**
   * Defines the language of the client, eg. `en` for english, `de` for german etc.
   * The special value `none` will disable all built-in internationalization and
   * resource loading. See {@link Resources#getSpecialBundle} for handling identifiers
   * with and without a dash.
   *
   * If internationalization is disabled, then the following variables should be
   * overridden to reflect the current language of the system. These variables are
   * cleared when i18n is disabled.
   * {@link Editor.askZoomResource}, {@link Editor.lastSavedResource},
   * {@link Editor.currentFileResource}, {@link Editor.propertiesResource},
   * {@link Editor.tasksResource}, {@link Editor.helpResource}, {@link Editor.outlineResource},
   * {@link ElbowEdgeHandler#doubleClickOrientationResource}, {@link Utils#errorResource},
   * {@link Utils#closeResource}, {@link GraphSelectionModel#doneResource},
   * {@link GraphSelectionModel#updatingSelectionResource}, {@link GraphView#doneResource},
   * {@link GraphView#updatingDocumentResource}, {@link CellRenderer#collapseExpandResource},
   * {@link Graph#containsValidationErrorsResource} and
   * {@link Graph#alreadyConnectedResource}.
   */
  static language = typeof window !== 'undefined' ? navigator.language : 'en';

  static setLanguage = (value: string | undefined | null) => {
    if (typeof value !== 'undefined' && value != null) {
      Client.language = value;
    } else {
      Client.language = navigator.language;
    }
  };

  /**
   * Defines the default language which is used in the common resource files. Any
   * resources for this language will only load the common resource file, but not
   * the language-specific resource file.
   * @default 'en'
   */
  static defaultLanguage = 'en';

  static setDefaultLanguage = (value: string | undefined | null) => {
    if (typeof value !== 'undefined' && value != null) {
      Client.defaultLanguage = value;
    } else {
      Client.defaultLanguage = 'en';
    }
  };

  /**
   * Defines the optional array of all supported language extensions. The default
   * language does not have to be part of this list. See
   * {@link Translations#isLanguageSupported}.
   *
   * This is used to avoid unnecessary requests to language files, ie. if a 404
   * will be returned.
   * @default null
   */
  static languages: string[] | null = null;

  static setLanguages = (value: string[] | null | undefined) => {
    if (typeof value !== 'undefined' && value != null) {
      Client.languages = value;
    }
  };

  /**
   * True if the current browser is Microsoft Edge.
   */
  static IS_EDGE =
    typeof window !== 'undefined' &&
    navigator.userAgent != null &&
    !!navigator.userAgent.match(/Edge\//);

  /**
   * True if the current browser is Netscape (including Firefox).
   */
  static IS_NS =
    typeof window !== 'undefined' &&
    navigator.userAgent != null &&
    navigator.userAgent.indexOf('Mozilla/') >= 0 &&
    navigator.userAgent.indexOf('MSIE') < 0 &&
    navigator.userAgent.indexOf('Edge/') < 0;

  /**
   * True if the current browser is Safari.
   */
  static IS_SF =
    typeof window !== 'undefined' && /Apple Computer, Inc/.test(navigator.vendor);

  /**
   * Returns true if the user agent contains Android.
   */
  static IS_ANDROID =
    typeof window !== 'undefined' && navigator.appVersion.indexOf('Android') >= 0;

  /**
   * Returns true if the user agent is an iPad, iPhone or iPod.
   */
  static IS_IOS =
    typeof window !== 'undefined' && /iP(hone|od|ad)/.test(navigator.platform);

  /**
   * True if the current browser is Google Chrome.
   */
  static IS_GC = typeof window !== 'undefined' && /Google Inc/.test(navigator.vendor);

  /**
   * True if the this is running inside a Chrome App.
   */
  static IS_CHROMEAPP =
    typeof window !== 'undefined' &&
    // @ts-ignore
    window.chrome != null &&
    // @ts-ignore
    chrome.app != null &&
    // @ts-ignore
    chrome.app.runtime != null;

  /**
   * True if the current browser is Firefox.
   */
  static IS_FF = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  /**
   * True if -moz-transform is available as a CSS style. This is the case
   * for all Firefox-based browsers newer than or equal 3, such as Camino,
   * Iceweasel, Seamonkey and Iceape.
   */
  static IS_MT =
    typeof window !== 'undefined' &&
    ((navigator.userAgent.indexOf('Firefox/') >= 0 &&
      navigator.userAgent.indexOf('Firefox/1.') < 0 &&
      navigator.userAgent.indexOf('Firefox/2.') < 0) ||
      (navigator.userAgent.indexOf('Iceweasel/') >= 0 &&
        navigator.userAgent.indexOf('Iceweasel/1.') < 0 &&
        navigator.userAgent.indexOf('Iceweasel/2.') < 0) ||
      (navigator.userAgent.indexOf('SeaMonkey/') >= 0 &&
        navigator.userAgent.indexOf('SeaMonkey/1.') < 0) ||
      (navigator.userAgent.indexOf('Iceape/') >= 0 &&
        navigator.userAgent.indexOf('Iceape/1.') < 0));

  /**
   * True if the browser supports SVG.
   */
  static IS_SVG =
    typeof window !== 'undefined' &&
    navigator.appName.toUpperCase() !== 'MICROSOFT INTERNET EXPLORER';

  /**
   * True if foreignObject support is not available. This is the case for
   * Opera, older SVG-based browsers and all versions of IE.
   */
  static NO_FO =
    typeof window !== 'undefined' &&
    (!document.createElementNS ||
      document.createElementNS(NS_SVG, 'foreignObject').toString() !==
        '[object SVGForeignObjectElement]' ||
      navigator.userAgent.indexOf('Opera/') >= 0);

  /**
   * True if the client is a Windows.
   */
  static IS_WIN =
    typeof window !== 'undefined' && navigator.appVersion.indexOf('Win') > 0;

  /**
   * True if the client is a Mac.
   */
  static IS_MAC =
    typeof window !== 'undefined' && navigator.appVersion.indexOf('Mac') > 0;

  /**
   * True if the client is a Chrome OS.
   */
  static IS_CHROMEOS =
    typeof window !== 'undefined' && /\bCrOS\b/.test(navigator.appVersion);

  /**
   * True if this device supports touchstart/-move/-end events (Apple iOS,
   * Android, Chromebook and Chrome Browser on touch-enabled devices).
   */
  static IS_TOUCH =
    typeof window !== 'undefined' && 'ontouchstart' in document.documentElement;

  /**
   * True if this device supports Microsoft pointer events (always false on Macs).
   */
  static IS_POINTER =
    typeof window !== 'undefined' &&
    window.PointerEvent != null &&
    !(navigator.appVersion.indexOf('Mac') > 0);

  /**
   * True if the documents location does not start with http:// or https://.
   */
  static IS_LOCAL =
    typeof window !== 'undefined' &&
    document.location.href.indexOf('http://') < 0 &&
    document.location.href.indexOf('https://') < 0;

  /**
   * Returns true if the current browser is supported, that is, if
   * <Client.IS_SVG> is true.
   *
   * Example:
   *
   * ```javascript
   * if (!Client.isBrowserSupported())
   * {
   *   mxUtils.error('Browser is not supported!', 200, false);
   * }
   * ```
   */
  static isBrowserSupported = () => {
    return Client.IS_SVG;
  };
}

export default Client;
