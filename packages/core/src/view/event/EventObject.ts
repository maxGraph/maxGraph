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

type EventProperties = Record<string, any>;

/**
 * The mxEventObject is a wrapper for all properties of a single event.
 * Additionally, it also offers functions to consume the event and check if it
 * was consumed as follows:
 *
 * ```javascript
 * evt.consume();
 * INV: evt.isConsumed() == true
 * ```
 *
 * Constructor: mxEventObject
 *
 * Constructs a new event object with the specified name. An optional
 * sequence of key, value pairs can be appended to define properties.
 *
 * Example:
 *
 * ```javascript
 * new mxEventObject("eventName", key1, val1, .., keyN, valN)
 * ```
 */
class EventObject {
  constructor(name = '', ...args: any[]) {
    this.name = name;
    this.properties = {};

    if (!!args[0] && args[0].constructor === Object) {
      // A literal object ({})
      for (const [key, value] of Object.entries(args[0])) {
        this.properties[key] = value;
      }
    } else {
      // two-values [key, value, key, value, ...]
      for (let i = 0; i < args.length; i += 2) {
        if (args[i + 1] !== null) {
          this.properties[args[i]] = args[i + 1];
        }
      }
    }
  }

  /**
   * Holds the name.
   */
  name: string;

  /**
   * Holds the properties as an associative array.
   */
  properties: EventProperties;

  /**
   * Holds the consumed state. Default is false.
   */
  consumed: boolean = false;

  /**
   * Returns <name>.
   */
  getName() {
    return this.name;
  }

  /**
   * Returns <properties>.
   */
  getProperties() {
    return this.properties;
  }

  /**
   * Returns the property for the given key.
   */
  getProperty(key: string) {
    return this.properties[key];
  }

  /**
   * Returns true if the event has been consumed.
   */
  isConsumed() {
    return this.consumed;
  }

  /**
   * Consumes the event.
   */
  consume() {
    this.consumed = true;
  }
}

export default EventObject;
