import { NODETYPE } from './constants';
import { getTextContent } from './domUtils';

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
export const ltrim = (str: string | null, chars: string = '\\s'): string =>
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
export const rtrim = (str: string | null, chars: string = '\\s'): string =>
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
export const trim = (str: string | null, chars?: string): string =>
  ltrim(rtrim(str, chars), chars);

/**
 * Returns the name for the given function.
 *
 * Parameters:
 *
 * f - JavaScript object that represents a function.
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
 * Parameters:
 *
 * node - DOM node whose siblings should be removed.
 * before - Optional boolean that specifies the direction of the traversal.
 */
export const removeWhitespace = (node: HTMLElement, before: boolean) => {
  let tmp = before ? node.previousSibling : node.nextSibling;

  while (tmp != null && tmp.nodeType === NODETYPE.TEXT) {
    const next = before ? tmp.previousSibling : tmp.nextSibling;
    const text = getTextContent(tmp);

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
 * @param {string} s String that contains the characters to be converted.
 * @param {boolean} newline If newlines should be replaced. Default is true.
 */
export const htmlEntities = (s: string, newline: boolean): string => {
  s = String(s || '');

  s = s.replace(/&/g, '&amp;'); // 38 26
  s = s.replace(/"/g, '&quot;'); // 34 22
  s = s.replace(/\'/g, '&#39;'); // 39 27
  s = s.replace(/</g, '&lt;'); // 60 3C
  s = s.replace(/>/g, '&gt;'); // 62 3E

  if (newline == null || newline) {
    s = s.replace(/\n/g, '&#xa;');
  }
  return s;
};
