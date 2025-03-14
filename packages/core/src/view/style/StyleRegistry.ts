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
 * Singleton class that acts as a global converter from string to object values in a style.
 *
 * This is currently only used for handling perimeters and edge styles.
 *
 * @category Style
 */
class StyleRegistry {
  /**
   * Maps from strings to objects.
   */
  static values = <any>{};

  /**
   * Puts the given object into the registry under the given name.
   */
  static putValue(name: string, obj: any): void {
    StyleRegistry.values[name] = obj;
  }

  /**
   * Returns the value associated with the given name.
   */
  static getValue(name: string): any {
    return StyleRegistry.values[name];
  }

  /**
   * Returns the name for the given value.
   */
  static getName(value: any): string | null {
    for (const key in StyleRegistry.values) {
      if (StyleRegistry.values[key] === value) {
        return key;
      }
    }
    return null;
  }
}

export default StyleRegistry;
