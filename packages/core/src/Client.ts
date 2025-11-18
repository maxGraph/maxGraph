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

import { NS_SVG } from './util/Constants.js';

const isWindowObjectAvailable = (): boolean => typeof window !== 'undefined';

const isUserAgentAvailable = (): boolean => !!navigator.userAgent;

const isUserAgentIncludes = (substring: string): boolean =>
  navigator.userAgent.includes(substring);

const isAppVersionAvailable = (): boolean => !!navigator.appVersion;

const isAppVersionIncludes = (substring: string): boolean =>
  navigator.appVersion.includes(substring);

/**
 * @category Configuration
 */
class Client {
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
   * `true` if the current browser is Microsoft Edge.
   */
  static IS_EDGE =
    isWindowObjectAvailable() &&
    isUserAgentAvailable() &&
    !!navigator.userAgent.match(/Edge\//);

  /**
   * `true` if the current browser is Netscape (including Firefox).
   */
  static IS_NS =
    isWindowObjectAvailable() &&
    isUserAgentAvailable() &&
    isUserAgentIncludes('Mozilla/') &&
    !isUserAgentIncludes('MSIE') &&
    !isUserAgentIncludes('Edge/');

  /**
   * `true` if the current browser is Safari.
   */
  static IS_SF =
    isWindowObjectAvailable() && /Apple Computer, Inc/.test(navigator.vendor);

  /**
   * Returns `true` if the user agent contains Android.
   */
  static IS_ANDROID =
    isWindowObjectAvailable() &&
    isAppVersionAvailable() &&
    isAppVersionIncludes('Android');

  /**
   * Returns `true` if the user agent is an iPad, iPhone or iPod.
   */
  static IS_IOS = isWindowObjectAvailable() && /iP(hone|od|ad)/.test(navigator.platform);

  /**
   * `true` if the current browser is Google Chrome.
   */
  static IS_GC = isWindowObjectAvailable() && /Google Inc/.test(navigator.vendor);

  /**
   * `true` if the this is running inside a Chrome App.
   */
  static IS_CHROMEAPP =
    isWindowObjectAvailable() &&
    // @ts-ignore
    window.chrome != null &&
    // @ts-ignore
    chrome.app != null &&
    // @ts-ignore
    chrome.app.runtime != null;

  /**
   * `true` if the current browser is Firefox.
   */
  static IS_FF =
    isUserAgentAvailable() && navigator.userAgent.toLowerCase().includes('firefox');

  /**
   * `true` if -moz-transform is available as a CSS style. This is the case
   * for all Firefox-based browsers newer than or equal 3, such as Camino,
   * Iceweasel, Seamonkey and Iceape.
   */
  static IS_MT =
    isWindowObjectAvailable() &&
    isUserAgentAvailable() &&
    ((isUserAgentIncludes('Firefox/') &&
      !isUserAgentIncludes('Firefox/1.') &&
      !isUserAgentIncludes('Firefox/2.')) ||
      (isUserAgentIncludes('Iceweasel/') &&
        !isUserAgentIncludes('Iceweasel/1.') &&
        !isUserAgentIncludes('Iceweasel/2.')) ||
      (isUserAgentIncludes('SeaMonkey/') && !isUserAgentIncludes('SeaMonkey/1.')) ||
      (isUserAgentIncludes('Iceape/') && !isUserAgentIncludes('Iceape/1.')));

  /**
   * `true` if the browser supports SVG.
   */
  static IS_SVG =
    isWindowObjectAvailable() &&
    navigator.appName?.toUpperCase() !== 'MICROSOFT INTERNET EXPLORER';

  /**
   * `true` if foreignObject support is not available. This is the case for
   * Opera, older SVG-based browsers and all versions of IE.
   */
  static NO_FO =
    isWindowObjectAvailable() &&
    (!document.createElementNS ||
      document.createElementNS(NS_SVG, 'foreignObject').toString() !==
        '[object SVGForeignObjectElement]' ||
      isUserAgentIncludes('Opera/'));

  /**
   * `true` if the client is a Windows.
   */
  static IS_WIN =
    isWindowObjectAvailable() && isAppVersionAvailable() && isAppVersionIncludes('Win');

  /**
   * `true` if the client is a Mac.
   */
  static IS_MAC =
    isWindowObjectAvailable() && isAppVersionAvailable() && isAppVersionIncludes('Mac');

  /**
   * `true` if the client is a Chrome OS.
   */
  static IS_CHROMEOS = isWindowObjectAvailable() && /\bCrOS\b/.test(navigator.appVersion);

  /**
   * `true` if this device supports touchstart/-move/-end events (Apple iOS,
   * Android, Chromebook and Chrome Browser on touch-enabled devices).
   */
  static IS_TOUCH =
    isWindowObjectAvailable() && 'ontouchstart' in document.documentElement;

  /**
   * `true` if this device supports Microsoft pointer events (always false on Macs).
   */
  static IS_POINTER =
    isWindowObjectAvailable() &&
    !!window.PointerEvent &&
    isAppVersionAvailable() &&
    !isAppVersionIncludes('Mac');

  /**
   * `true` if the documents location does not start with http:// or https://.
   */
  static IS_LOCAL =
    isWindowObjectAvailable() &&
    !document.location.href.includes('http://') &&
    !document.location.href.includes('https://');
}

export default Client;
