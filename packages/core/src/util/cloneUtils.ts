import ObjectIdentity from './ObjectIdentity';

/**
 * Recursively clones the specified object ignoring all fieldnames in the
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
export const clone = function _clone(obj: any, transients: string[] | null=null, shallow: boolean=false) {
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
