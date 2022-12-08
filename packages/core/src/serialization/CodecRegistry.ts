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

import ObjectCodec from './ObjectCodec';

/**
 * Singleton class that acts as a global registry for codecs.
 *
 * ### Adding an <Codec>:
 *
 * 1. Define a default codec with a new instance of the object to be handled.
 *
 *     ```javascript
 *     var codec = new ObjectCodec(new Transactions());
 *     ```
 *
 * 2. Define the functions required for encoding and decoding objects.
 *
 *     ```javascript
 *     codec.encode = function(enc, obj) { ... }
 *     codec.decode = function(dec: Codec, node: Element, into: any): any { ... }
 *     ```
 *
 * 3. Register the codec in the <CodecRegistry>.
 *
 *     ```javascript
 *     CodecRegistry.register(codec);
 *     ```
 *
 * {@link ObjectCodec.decode} may be used to either create a new
 * instance of an object or to configure an existing instance,
 * in which case the into argument points to the existing
 * object. In this case, we say the codec "configures" the
 * object.
 *
 * @class CodecRegistry
 */
class CodecRegistry {
  static codecs: { [key: string]: ObjectCodec | undefined } = {};

  /**
   * Maps from classnames to codecnames.
   * @static
   */
  static aliases: { [key: string]: string | undefined } = {};

  /**
   * Registers a new codec and associates the name of the template
   * constructor in the codec with the codec object.
   *
   * @static
   *
   * @param codec - {@link ObjectCodec} to be registered.
   */
  static register(codec: ObjectCodec): ObjectCodec {
    if (codec != null) {
      const name = codec.getName();
      CodecRegistry.codecs[name] = codec;

      const classname: string = codec.template.constructor.name;
      if (classname !== name) {
        CodecRegistry.addAlias(classname, name);
      }
    }
    return codec;
  }

  /**
   * Adds an alias for mapping a classname to a codecname.
   * @static
   */
  static addAlias(classname: string, codecname: string): void {
    CodecRegistry.aliases[classname] = codecname;
  }

  /**
   * Returns a codec that handles objects that are constructed
   * using the given constructor.
   *
   * @static
   *
   * @param ctor - JavaScript constructor function.
   */
  static getCodec(constructor_: any): ObjectCodec | null {
    let codec = null;

    if (constructor_ != null) {
      let { name } = constructor_;
      const tmp = CodecRegistry.aliases[name];

      if (tmp != null) {
        name = tmp;
      }

      codec = CodecRegistry.codecs[name] ?? null;

      // Registers a new default codec for the given constructor
      // if no codec has been previously defined.
      if (codec == null) {
        try {
          codec = new ObjectCodec(new constructor_());
          CodecRegistry.register(codec);
        } catch (e) {
          // ignore
        }
      }
    }
    return codec;
  }

  static getCodecByName(name: string) {
    return CodecRegistry.codecs[name] ?? null;
  }
}

export default CodecRegistry;
