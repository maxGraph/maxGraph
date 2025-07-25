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
}

export default Client;
