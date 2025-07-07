/*
Copyright 2021-present The maxGraph project Contributors

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

import { NODE_TYPE } from './Constants.js';
import { getTextContent } from './domUtils.js';

import type { Properties } from '../types.js';

/**
 * Strips all whitespaces from the beginning of the string. Without the
 * second parameter, this will trim these characters:
 *
 * - " " (ASCII 32 (0x20)), an ordinary space
 * - "\t" (ASCII 9 (0x09)), a tab
 * - "\n" (ASCII 10 (0x0A)), a new line (line feed)
 * - "\r" (ASCII 13 (0x0D)), a carriage return
 * - "\0" (ASCII 0 (0x00)), the NUL-byte
 * - "\x0B" (ASCII 11 (0x0B)), a vertical tab
 */
export const ltrim = (str: string | null, chars = '\\s'): string | null =>
  str != null ? str.replace(new RegExp(`^[${chars}]+`, 'g'), '') : null;

/**
 * Strips all whitespaces from the end of the string. Without the second
 * parameter, this will trim these characters:
 *
 * - " " (ASCII 32 (0x20)), an ordinary space
 * - "\t" (ASCII 9 (0x09)), a tab
 * - "\n" (ASCII 10 (0x0A)), a new line (line feed)
 * - "\r" (ASCII 13 (0x0D)), a carriage return
 * - "\0" (ASCII 0 (0x00)), the NUL-byte
 * - "\x0B" (ASCII 11 (0x0B)), a vertical tab
 */
export const rtrim = (str: string | null, chars = '\\s'): string | null =>
  str != null ? str.replace(new RegExp(`[${chars}]+$`, 'g'), '') : null;

/**
 * Strips all whitespaces from both end of the string.
 * Without the second parameter, Javascript function will trim these
 * characters:
 *
 * - " " (ASCII 32 (0x20)), an ordinary space
 * - "\t" (ASCII 9 (0x09)), a tab
 * - "\n" (ASCII 10 (0x0A)), a new line (line feed)
 * - "\r" (ASCII 13 (0x0D)), a carriage return
 * - "\0" (ASCII 0 (0x00)), the NUL-byte
 * - "\x0B" (ASCII 11 (0x0B)), a vertical tab
 */
export const trim = (str: string | null, chars?: string): string | null =>
  ltrim(rtrim(str, chars), chars);

/**
 * Returns the name for the given function.
 *
 * @param f JavaScript object that represents a function.
 */
export const getFunctionName = (f: any): string => {
  let str = null;

  if (f != null) {
    if (f.name != null) {
      str = f.name;
    } else {
      str = trim(f.toString());

      if (str !== null && /^function\s/.test(str)) {
        str = ltrim(str.substring(9));

        if (str !== null) {
          const idx2 = str.indexOf('(');

          if (idx2 > 0) {
            str = str.substring(0, idx2);
          }
        }
      }
    }
  }
  return str;
};

/**
 * Replaces each trailing newline with the given pattern.
 */
export const replaceTrailingNewlines = (str: string, pattern: string): string => {
  // LATER: Check is this can be done with a regular expression
  let postfix = '';

  while (str.length > 0 && str.charAt(str.length - 1) == '\n') {
    str = str.substring(0, str.length - 1);
    postfix += pattern;
  }
  return str + postfix;
};

/**
 * Removes the sibling text nodes for the given node that only consists
 * of tabs, newlines and spaces.
 *
 * @param node DOM node whose siblings should be removed.
 * @param before Optional boolean that specifies the direction of the traversal.
 */
export const removeWhitespace = (node: HTMLElement, before: boolean) => {
  let tmp = before ? node.previousSibling : node.nextSibling;

  while (tmp != null && tmp.nodeType === NODE_TYPE.TEXT) {
    const next = before ? tmp.previousSibling : tmp.nextSibling;
    const text = getTextContent(<Text>tmp);

    if (trim(text)?.length === 0) {
      tmp.parentNode?.removeChild(tmp);
    }

    tmp = next;
  }
};

/**
 * Replaces characters (less than, greater than, newlines and quotes) with
 * their HTML entities in the given string and returns the result.
 *
 * @param s String that contains the characters to be converted.
 * @param newline If newlines should be replaced. Default is `true`.
 */
export const htmlEntities = (s: string, newline = true): string => {
  s = String(s || '');

  s = s.replace(/&/g, '&amp;'); // 38 26
  s = s.replace(/"/g, '&quot;'); // 34 22
  s = s.replace(/'/g, '&#39;'); // 39 27
  s = s.replace(/</g, '&lt;'); // 60 3C
  s = s.replace(/>/g, '&gt;'); // 62 3E

  if (newline) {
    s = s.replace(/\n/g, '&#xa;');
  }
  return s;
};

/**
 * Returns a textual representation of the specified object.
 *
 * @param obj Object to return the string representation for.
 */
export const toString = (obj: Properties) => {
  let output = '';

  for (const i in obj) {
    try {
      if (obj[i] == null) {
        output += `${i} = [null]\n`;
      } else if (typeof obj[i] === 'function') {
        output += `${i} => [Function]\n`;
      } else if (typeof obj[i] === 'object') {
        const ctor = getFunctionName(obj[i].constructor);
        output += `${i} => [${ctor}]\n`;
      } else {
        output += `${i} = ${obj[i]}\n`;
      }
    } catch (e: any) {
      output += `${i}=${e.message}`;
    }
  }

  return output;
};
