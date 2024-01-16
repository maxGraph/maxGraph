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
 * ### Adding a Codec
 *
 * 1. Define a default codec with a new instance of the object to be handled.
 *
 *     ```javascript
 *     const codec = new ObjectCodec(new Transactions());
 *     ```
 *
 * 2. Define the functions required for encoding and decoding objects.
 *
 *     ```javascript
 *     codec.encode = function(enc, obj) { ... }
 *     codec.decode = function(dec: Codec, node: Element, into: any): any { ... }
 *     ```
 *
 * 3. Register the codec in the CodecRegistry.
 *
 *     ```javascript
 *     CodecRegistry.register(codec);
 *     ```
 *
 * {@link ObjectCodec.decode} may be used to either create a new instance of an object or to configure an existing instance,
 * in which case the into argument points to the existing object. In this case, we say the codec "configures" the object.
 */
class CodecRegistry {
  static codecs: { [key: string]: ObjectCodec | undefined } = {};

  /**
   * Maps from classnames to codec names.
   */
  static aliases: { [key: string]: string | undefined } = {};

  /**
   * Registers a new codec and associates the name of the codec via {@link ObjectCodec.getName} with the codec object.
   *
   * @param codec ObjectCodec to be registered.
   * @param registerAlias if `true`, register an alias if the codec name doesn't match the name of {@link ObjectCodec.template}.
   */
  static register(codec: ObjectCodec, registerAlias = true): ObjectCodec {
    if (codec != null) {
      const name = codec.getName();
      CodecRegistry.codecs[name] = codec;

      const classname: string = codec.template.constructor.name;
      if (registerAlias && classname !== name) {
        CodecRegistry.addAlias(classname, name);
      }
    }
    return codec;
  }

  /**
   * Adds an alias for mapping a classname to a codec name.
   */
  static addAlias(classname: string, codecname: string): void {
    CodecRegistry.aliases[classname] = codecname;
  }

  /**
   * Returns a codec that handles objects that are constructed using the given constructor or a codec registered under the provided name.
   *
   * When passing a name, the method first check if an alias exists for the name, and if so, it uses it to retrieve the codec.
   *
   * If there is no registered Codec, the method tries to register a new Codec using the provided constructor.
   *
   * @param constructorOrName JavaScript constructor function of the Codec or Codec name.
   */
  static getCodec(constructorOrName: any): ObjectCodec | null {
    if (constructorOrName == null) {
      return null;
    }

    let codec = null;

    // Equivalent of calling import { getFunctionName } from '../util/StringUtils';
    let name =
      typeof constructorOrName === 'string' ? constructorOrName : constructorOrName.name;

    const tmp = CodecRegistry.aliases[name];
    if (tmp != null) {
      name = tmp;
    }

    codec = CodecRegistry.codecs[name] ?? null;

    // Registers a new default codec for the given constructor if no codec has been previously defined.
    if (codec == null) {
      try {
        codec = new ObjectCodec(new constructorOrName());
        CodecRegistry.register(codec);
      } catch (e) {
        // ignore
      }
    }
    return codec;
  }

  /**
   * First try to get the codec by the name it is registered with. If it doesn't exist, use the alias eventually declared
   * to get the codec.
   * @param name the name of the codec that is willing to be retrieved.
   */
  static getCodecByName(name: string) {
    let codec = CodecRegistry.codecs[name];
    if (!codec) {
      const alias = CodecRegistry.aliases[name];
      if (alias) {
        codec = CodecRegistry.codecs[alias];
      }
    }

    return codec ?? null;
  }
}

export default CodecRegistry;
