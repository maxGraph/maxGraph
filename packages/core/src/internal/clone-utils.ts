/*
Copyright 2025-present The maxGraph project Contributors

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
 * Shallow copies properties from the source object to the target object.
 *
 * **WARNING**: This function performs only a **shallow** copy i.e. there is no deep copy of the properties that are objects, expect for arrays.
 *
 * @template T The type of the objects.
 *
 * @param source The source object from which properties will be copied.
 * @param target The target object to which properties will be copied.
 *
 * @private not part of the public API, can be removed or changed without prior notice
 * @since 0.14.0
 */
export const shallowCopy = <T extends object>(source: T, target: T): void => {
  for (const key in source) {
    // attempt to prevent prototype pollution
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      if (Array.isArray(sourceValue)) {
        // @ts-ignore source and target are of the same type
        target[key] = [...sourceValue];
      } else {
        target[key] = sourceValue;
      }
    }
  }
};
