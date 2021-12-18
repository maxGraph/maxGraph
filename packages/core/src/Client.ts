/**
 * Copyright (c) 2006-2017, JGraph Ltd
 * Copyright (c) 2006-2017, Gaudenz Alder
 */

class Client {
  /**
   * Class: Client
   *
   * Bootstrapping mechanism for the mxGraph thin client. The production version
   * of this file contains all code required to run the mxGraph thin client, as
   * well as global constants to identify the browser and operating system in
   * use. You may have to load chrome://global/content/contentAreaUtils.js in
   * your page to disable certain security restrictions in Mozilla.
   *
   * Variable: VERSION
   *
   * Contains the current version of the mxGraph library. The strings that
   * communicate versions of mxGraph use the following format.
   *
   * versionMajor.versionMinor.buildNumber.revisionNumber
   *
   * Current version is 4.2.2.
   */
  static VERSION = '4.2.2';

  /**
   * Variable: mxResourceExtension
   *
   * Optional global config variable to specify the extension of resource files.
   * Default is true. NOTE: This is a global variable, not a variable of Client.
   *
   * (code)
   * <script type="text/javascript">
   *     let mxResourceExtension = '.txt';
   * </script>
   * <script type="text/javascript" src="/path/to/core/directory/js/Client.js"></script>
   * (end)
   */
  static mxResourceExtension = '.txt';

  static setResourceExtension = value => {
    Client.mxResourceExtension = value;
    
    // Removes dependency with mxResources.
    // Client.mxResourceExtension can be used instead.
    // mxResources.extension = value;
  };

  /**
   * Variable: mxLoadResources
   *
   * Optional global config variable to toggle loading of the two resource files
   * in <mxGraph> and <Editor>. Default is true. NOTE: This is a global variable,
   * not a variable of Client. If this is false, you can use <Client.loadResources>
   * with its callback to load the default bundles asynchronously.
   *
   * (code)
   * <script type="text/javascript">
   *     let mxLoadResources = false;
   * </script>
   * <script type="text/javascript" src="/path/to/core/directory/js/Client.js"></script>
   * (end)
   */
  static mxLoadResources = true;

  static setLoadResources = value => {};

  /**
   * Variable: mxForceIncludes
   *
   * Optional global config variable to force loading the JavaScript files in
   * development mode. Default is undefined. NOTE: This is a global variable,
   * not a variable of Client.
   *
   * (code)
   * <script type="text/javascript">
   *     let mxForceIncludes = false;
   * </script>
   * <script type="text/javascript" src="/path/to/core/directory/js/Client.js"></script>
   * (end)
   */
  static mxForceIncludes = false;

  static setForceIncludes = value => {
    Client.mxForceIncludes = value;
  };

  /**
   * Variable: mxLoadStylesheets
   *
   * Optional global config variable to toggle loading of the CSS files when
   * the library is initialized. Default is true. NOTE: This is a global variable,
   * not a variable of Client.
   *
   * (code)
   * <script type="text/javascript">
   *     let mxLoadStylesheets = false;
   * </script>
   * <script type="text/javascript" src="/path/to/core/directory/js/Client.js"></script>
   * (end)
   */
  static mxLoadStylesheets = true;

  static setLoadStylesheets = value => {
    Client.mxLoadStylesheets = value;
  };

  /**
   * Variable: basePath
   *
   * Basepath for all URLs in the core without trailing slash. Default is '.'.
   * Set mxBasePath prior to loading the Client library as follows to override
   * this setting:
   *
   * (code)
   * <script type="text/javascript">
   *     mxBasePath = '/path/to/core/directory';
   * </script>
   * <script type="text/javascript" src="/path/to/core/directory/js/Client.js"></script>
   * (end)
   *
   * When using a relative path, the path is relative to the URL of the page that
   * contains the assignment. Trailing slashes are automatically removed.
   */
  static basePath = '.';

  static setBasePath = value => {
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
   * Variable: imageBasePath
   *
   * Basepath for all images URLs in the core without trailing slash. Default is
   * <Client.basePath> + '/images'. Set mxImageBasePath prior to loading the
   * Client library as follows to override this setting:
   *
   * (code)
   * <script type="text/javascript">
   *     mxImageBasePath = '/path/to/image/directory';
   * </script>
   * <script type="text/javascript" src="/path/to/core/directory/js/Client.js"></script>
   * (end)
   *
   * When using a relative path, the path is relative to the URL of the page that
   * contains the assignment. Trailing slashes are automatically removed.
   */
  static imageBasePath = '.';
  
  static setImageBasePath = value => {
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
   * Variable: language
   *
   * Defines the language of the client, eg. en for english, de for german etc.
   * The special value 'none' will disable all built-in internationalization and
   * resource loading. See <mxResources.getSpecialBundle> for handling identifiers
   * with and without a dash.
   *
   * Set mxLanguage prior to loading the Client library as follows to override
   * this setting:
   *
   * (code)
   * <script type="text/javascript">
   *     mxLanguage = 'en';
   * </script>
   * <script type="text/javascript" src="js/Client.js"></script>
   * (end)
   *
   * If internationalization is disabled, then the following variables should be
   * overridden to reflect the current language of the system. These variables are
   * cleared when i18n is disabled.
   * <Editor.askZoomResource>, <Editor.lastSavedResource>,
   * <Editor.currentFileResource>, <Editor.propertiesResource>,
   * <Editor.tasksResource>, <Editor.helpResource>, <Editor.outlineResource>,
   * <mxElbowEdgeHandler.doubleClickOrientationResource>, <mxUtils.errorResource>,
   * <mxUtils.closeResource>, <mxGraphSelectionModel.doneResource>,
   * <mxGraphSelectionModel.updatingSelectionResource>, <mxGraphView.doneResource>,
   * <mxGraphView.updatingDocumentResource>, <mxCellRenderer.collapseExpandResource>,
   * <mxGraph.containsValidationErrorsResource> and
   * <mxGraph.alreadyConnectedResource>.
   */
  static language = typeof window !== 'undefined' ? navigator.language : 'en';

  static setLanguage = value => {
    if (typeof value !== 'undefined' && value != null) {
      Client.language = value;
    } else {
      Client.language = navigator.language;
    }
  };

  /**
   * Variable: defaultLanguage
   *
   * Defines the default language which is used in the common resource files. Any
   * resources for this language will only load the common resource file, but not
   * the language-specific resource file. Default is 'en'.
   *
   * Set mxDefaultLanguage prior to loading the Client library as follows to override
   * this setting:
   *
   * (code)
   * <script type="text/javascript">
   *     mxDefaultLanguage = 'de';
   * </script>
   * <script type="text/javascript" src="js/Client.js"></script>
   * (end)
   */
  static defaultLanguage = 'en';

  static setDefaultLanguage = value => {
    if (typeof value !== 'undefined' && value != null) {
      Client.defaultLanguage = value;
    } else {
      Client.defaultLanguage = 'en';
    }
  };

  /**
   * Variable: languages
   *
   * Defines the optional array of all supported language extensions. The default
   * language does not have to be part of this list. See
   * <mxResources.isLanguageSupported>.
   *
   * (code)
   * <script type="text/javascript">
   *     mxLanguages = ['de', 'it', 'fr'];
   * </script>
   * <script type="text/javascript" src="js/Client.js"></script>
   * (end)
   *
   * This is used to avoid unnecessary requests to language files, ie. if a 404
   * will be returned.
   */

  static setLanguages = value => {
    if (typeof value !== 'undefined' && value != null) {
      Client.languages = value;
    }
  };

  /**
   * Variable: IS_EDGE
   *
   * True if the current browser is Microsoft Edge.
   */
  static IS_EDGE =
    typeof window !== 'undefined' &&
    navigator.userAgent != null &&
    !!navigator.userAgent.match(/Edge\//);

  /**
   * Variable: IS_NS
   *
   * True if the current browser is Netscape (including Firefox).
   */
  static IS_NS =
    typeof window !== 'undefined' &&
    navigator.userAgent != null &&
    navigator.userAgent.indexOf('Mozilla/') >= 0 &&
    navigator.userAgent.indexOf('MSIE') < 0 &&
    navigator.userAgent.indexOf('Edge/') < 0;

  /**
   * Variable: IS_SF
   *
   * True if the current browser is Safari.
   */
  static IS_SF =
    typeof window !== 'undefined' &&
    /Apple Computer, Inc/.test(navigator.vendor);

  /**
   * Variable: IS_ANDROID
   *
   * Returns true if the user agent contains Android.
   */
  static IS_ANDROID =
    typeof window !== 'undefined' &&
    navigator.appVersion.indexOf('Android') >= 0;

  /**
   * Variable: IS_IOS
   *
   * Returns true if the user agent is an iPad, iPhone or iPod.
   */
  static IS_IOS =
    typeof window !== 'undefined' && /iP(hone|od|ad)/.test(navigator.platform);

  /**
   * Variable: IS_GC
   *
   * True if the current browser is Google Chrome.
   */
  static IS_GC = typeof window !== 'undefined' && /Google Inc/.test(navigator.vendor);

  /**
   * Variable: IS_CHROMEAPP
   *
   * True if the this is running inside a Chrome App.
   */
  static IS_CHROMEAPP =
    typeof window !== 'undefined' &&
    window.chrome != null &&
    chrome.app != null &&
    chrome.app.runtime != null;

  /**
   * Variable: IS_FF
   *
   * True if the current browser is Firefox.
   */
  static IS_FF = typeof window !== 'undefined' && typeof InstallTrigger !== 'undefined';

  /**
   * Variable: IS_MT
   *
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
   * Variable: IS_SVG
   *
   * True if the browser supports SVG.
   */
  static IS_SVG =
    typeof window !== 'undefined' &&
    navigator.appName.toUpperCase() !== 'MICROSOFT INTERNET EXPLORER';

  /**
   * Variable: NO_FO
   *
   * True if foreignObject support is not available. This is the case for
   * Opera, older SVG-based browsers and all versions of IE.
   */
  static NO_FO =
    typeof window !== 'undefined' &&
    (!document.createElementNS ||
      document.createElementNS(
        'http://www.w3.org/2000/svg',
        'foreignObject'
      ) !== '[object SVGForeignObjectElement]' ||
      navigator.userAgent.indexOf('Opera/') >= 0);

  /**
   * Variable: IS_WIN
   *
   * True if the client is a Windows.
   */
  static IS_WIN =
    typeof window !== 'undefined' && navigator.appVersion.indexOf('Win') > 0;

  /**
   * Variable: IS_MAC
   *
   * True if the client is a Mac.
   */
  static IS_MAC =
    typeof window !== 'undefined' && navigator.appVersion.indexOf('Mac') > 0;

  /**
   * Variable: IS_CHROMEOS
   *
   * True if the client is a Chrome OS.
   */
  static IS_CHROMEOS =
    typeof window !== 'undefined' && /\bCrOS\b/.test(navigator.appVersion);

  /**
   * Variable: IS_TOUCH
   *
   * True if this device supports touchstart/-move/-end events (Apple iOS,
   * Android, Chromebook and Chrome Browser on touch-enabled devices).
   */
  static IS_TOUCH =
    typeof window !== 'undefined' && 'ontouchstart' in document.documentElement;

  /**
   * Variable: IS_POINTER
   *
   * True if this device supports Microsoft pointer events (always false on Macs).
   */
  static IS_POINTER =
    typeof window !== 'undefined' &&
    window.PointerEvent != null &&
    !(navigator.appVersion.indexOf('Mac') > 0);

  /**
   * Variable: IS_LOCAL
   *
   * True if the documents location does not start with http:// or https://.
   */
  static IS_LOCAL =
    typeof window !== 'undefined' &&
    document.location.href.indexOf('http://') < 0 &&
    document.location.href.indexOf('https://') < 0;

  /**
   * Function: isBrowserSupported
   *
   * Returns true if the current browser is supported, that is, if
   * <Client.IS_SVG> is true.
   *
   * Example:
   *
   * (code)
   * if (!Client.isBrowserSupported())
   * {
   *   mxUtils.error('Browser is not supported!', 200, false);
   * }
   * (end)
   */
  static isBrowserSupported = () => {
    return Client.IS_SVG;
  };

  /**
   * Function: link
   *
   * Adds a link node to the head of the document. Use this
   * to add a stylesheet to the page as follows:
   *
   * (code)
   * Client.link('stylesheet', filename);
   * (end)
   *
   * where filename is the (relative) URL of the stylesheet. The charset
   * is hardcoded to ISO-8859-1 and the type is text/css.
   *
   * Parameters:
   *
   * rel - String that represents the rel attribute of the link node.
   * href - String that represents the href attribute of the link node.
   * doc - Optional parent document of the link node.
   * id - unique id for the link element to check if it already exists
   */
  static link = (rel, href, doc, id) => {
    doc = doc || document;

    // Workaround for Operation Aborted in IE6 if base tag is used in head
    const link = doc.createElement('link');

    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    link.setAttribute('charset', 'UTF-8');
    link.setAttribute('type', 'text/css');

    if (id) {
      link.setAttribute('id', id);
    }

    const head = doc.getElementsByTagName('head')[0];
    head.appendChild(link);
  };
};

export default Client;
