/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

/**
 * A singleton class that provides cross-browser helper methods.
 * This is a global functionality. To access the functions in this
 * class, use the global classname appended by the functionname.
 * You may have to load chrome://global/content/contentAreaUtils.js
 * to disable certain security restrictions in Mozilla for the <open>,
 * <save>, <saveAs> and <copy> function.
 *
 * For example, the following code displays an error message:
 *
 * ```javascript
 * mxUtils.error('Browser is not supported!', 200, false);
 * ```
 */
export const utils = {
  /*
   * Specifies the resource key for the title of the error window. If the
   * resource for this key does not exist then the value is used as
   * the title. Default is 'error'.
   */
  errorResource: 'error',

  /**
   * Specifies the resource key for the label of the close button. If the
   * resource for this key does not exist then the value is used as
   * the label. Default is 'close'.
   */
  closeResource: 'close',

  /**
   * Defines the image used for error dialogs.
   */
  errorImage: '/error.gif', // Client.imageBasePath + '/error.gif',
};

export const isNullish = (v: string | object | null | undefined | number) =>
  v === null || v === undefined;
export const isNotNullish = (v: string | object | null | undefined | number) =>
  !isNullish(v);

// Merge a mixin into the destination
export const mixInto = (dest: any) => (mixin: any) => {
  const keys = Reflect.ownKeys(mixin);
  try {
    for (const key of keys) {
      Object.defineProperty(dest.prototype, key, {
        value: mixin[key],
        writable: true,
      });
    }
  } catch (e) {
    console.error('Error while mixing', e);
  }
};

/**
 * Returns the value for the given key in the given associative array or
 * the given default value if the value is null.
 *
 * @param array Associative array that contains the value for the key.
 * @param key Key whose value should be returned.
 * @param defaultValue Value to be returned if the value for the given
 * key is null.
 */
 export const getValue = (array: any, key: string, defaultValue?: any) => {
  let value = array != null ? array[key] : null;
  if (value == null) {
    value = defaultValue;
  }
  return value;
};

export const copyTextToClipboard = (text: string): void => {
  // Credit: https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}

const fallbackCopyTextToClipboard = (text: string):void => {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
