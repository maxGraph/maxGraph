/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { getFunctionName } from './StringUtils';

const FIELD_NAME = 'mxObjectId';

type IdentityObject = {
  [FIELD_NAME]?: string;
  [k: string]: any;
};

type IdentityFunction = {
  (): any;
  [FIELD_NAME]?: string;
};

/**
 * @class
 *
 * Identity for JavaScript objects and functions. This is implemented using
 * a simple incrementing counter which is stored in each object under
 * {@link FIELD_NAME}.
 *
 * The identity for an object does not change during its lifecycle.
 */
class ObjectIdentity {
  /**
   * Name of the field to be used to store the object ID. Default is
   * <code>mxObjectId</code>.
   */
  static FIELD_NAME = FIELD_NAME;

  /**
   * Current counter.
   */
  static counter = 0;

  /**
   * Returns the ID for the given object or function.
   */
  static get(obj: IdentityObject | IdentityFunction | null) {
    if (obj) {
      if (obj[FIELD_NAME] === null || obj[FIELD_NAME] === undefined) {
        if (typeof obj === 'object') {
          const ctor = getFunctionName(obj.constructor);
          obj[FIELD_NAME] = `${ctor}#${ObjectIdentity.counter++}`;
        } else if (typeof obj === 'function') {
          obj[FIELD_NAME] = `Function#${ObjectIdentity.counter++}`;
        }
      }
      return obj[FIELD_NAME] as string;
    }
    return null;
  }

  /**
   * Deletes the ID from the given object or function.
   */
  static clear(obj: IdentityObject | IdentityFunction) {
    delete obj[FIELD_NAME];
  }
}

export default ObjectIdentity;
