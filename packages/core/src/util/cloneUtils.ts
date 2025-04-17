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

import ObjectIdentity from './ObjectIdentity';

/**
 * Recursively clones the specified object ignoring all field names in the
 * given array of transient fields. {@link ObjectIdentity#FIELD_NAME} is always
 * ignored by this function.
 *
 * @param obj Object to be cloned.
 * @param transients Optional array of strings representing the fieldname to be
 * ignored.
 * @param shallow Optional boolean argument to specify if a shallow clone should
 * be created, that is, one where all object references are not cloned or,
 * in other words, one where only atomic (strings, numbers) values are
 * cloned. Default is false.
 */
export const clone = function _clone(
  obj: any,
  transients: string[] | null = null,
  shallow = false
) {
  shallow = shallow != null ? shallow : false;
  let clone = null;

  if (obj != null && typeof obj.constructor === 'function') {
    clone = new obj.constructor();

    for (const i in obj) {
      if (
        i != ObjectIdentity.FIELD_NAME &&
        (transients == null || transients.indexOf(i) < 0)
      ) {
        if (!shallow && typeof obj[i] === 'object') {
          clone[i] = _clone(obj[i]);
        } else {
          clone[i] = obj[i];
        }
      }
    }
  }

  return clone;
};
