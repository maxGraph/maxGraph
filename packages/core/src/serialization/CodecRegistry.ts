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
   * Registers a new codec and associates the name of the template constructor in the codec with the codec object.
   *
   * @param codec ObjectCodec to be registered.
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
   * Adds an alias for mapping a classname to a codec name.
   */
  static addAlias(classname: string, codecname: string): void {
    CodecRegistry.aliases[classname] = codecname;
  }

  /**
   * Returns a codec that handles objects that are constructed using the given constructor.
   *
   * @param constructor_ JavaScript constructor function.
   */
  static getCodec(constructor_: any): ObjectCodec | null {
    // TODO simplify implementation
    // if (constructor_ == null) {
    //   return null;
    // }

    // TODO wrong JSDoc the parameter is a string or a constructor + rename parameter for clarity
    // if a string, try to get the codec by name and by alias (should probably use the code of getCodecByName)
    // if no codec, it register a new codec for the providing "type" pass as constructor
    let codec = null;

    // console.info('CodecRegistry.getCodec - parameter as string: %s', constructor_);

    if (constructor_ != null) {
      console.info('CodecRegistry.getCodec - parameter type:', typeof constructor_);
      // let { name } = constructor_;
      // Equivalent of calling import { getFunctionName } from '../util/StringUtils';
      let name = typeof constructor_ === 'string' ? constructor_ : constructor_.name;
      // console.info(
      //   'CodecRegistry.getCodec - name (direct or assume from constructor):',
      //   name
      // );
      //
      // const tmp = CodecRegistry.aliases[name];
      // console.info('CodecRegistry.getCodec - alias resolution:', tmp);
      //
      // if (tmp != null) {
      //   name = tmp;
      // }
      // console.info('CodecRegistry.getCodec - used name to find codec:', name);

      // codec = CodecRegistry.codecs[name] ?? null;

      // TODO this change is required when introducing an alias for mxCell
      codec = this.getCodecByName(name);

      console.info('CodecRegistry.getCodec - found codec:', codec != null);
      // console.info('CodecRegistry.getCodec - found codec:', codec);

      // Registers a new default codec for the given constructor if no codec has been previously defined.
      if (codec == null) {
        try {
          codec = new ObjectCodec(new constructor_());
          console.info('CodecRegistry.getCodec - no codec, so register:', codec);
          CodecRegistry.register(codec);
        } catch (e) {
          // ignore
        }
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
    // TODO the implementation in getCodec differs, it first tries to resolve the alias
    // this is the compact form
    // const codecName = CodecRegistry.aliases[name] ?? name;
    // return  CodecRegistry.codecs[codecName] ?? null;

    // Also use alias
    console.info('CodecRegistry.getCodecByName - name:', name);
    let codec = CodecRegistry.codecs[name];
    // let codec = CodecRegistry.codecs[name] ?? null;
    if (!codec) {
      const alias = CodecRegistry.aliases[name];
      console.info('CodecRegistry.getCodecByName - NO codec - alias:', alias);
      if (alias) {
        codec = CodecRegistry.codecs[alias];
        console.info(
          'CodecRegistry.getCodecByName - NO codec - codec from alias:',
          !!codec
          // codec
        );
      }
    }

    console.info('CodecRegistry.getCodecByName - found codec:', !!codec);
    // console.info('CodecRegistry.getCodecByName - found codec:', codec);
    return codec ?? null;
  }
}

export default CodecRegistry;
