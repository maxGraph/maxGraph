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

import CodecRegistry from './CodecRegistry';
import {
  CellCodec,
  ModelCodec,
  mxCellCodec,
  mxGeometryCodec,
} from './codecs/_model-codecs';
import Geometry from '../view/geometry/Geometry';
import Point from '../view/geometry/Point';
import ObjectCodec from './ObjectCodec';
import { CodecRegistrationStates, registerBaseCodecs } from './register-shared';

const createObjectCodec = (template: any, name: string): ObjectCodec => {
  const objectCodec = new ObjectCodec(template);
  objectCodec.setName(name);
  return objectCodec;
};

/**
 * Register model codecs i.e. codecs used to import/export the Graph Model, see {@link GraphDataModel}.
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.10.0
 * @category Configuration
 * @category Serialization with Codecs
 */
export const registerModelCodecs = (force = false) => {
  if (!CodecRegistrationStates.model || force) {
    CodecRegistry.register(new CellCodec());
    CodecRegistry.register(new ModelCodec());

    // To support decode/import executed before encode/export (see https://github.com/maxGraph/maxGraph/issues/178)
    // Codecs are currently only registered automatically during encode/export
    CodecRegistry.register(createObjectCodec(new Geometry(), 'Geometry'));
    CodecRegistry.register(createObjectCodec(new Point(), 'Point'));
    registerBaseCodecs(force);

    // mxGraph support
    CodecRegistry.addAlias('mxGraphModel', 'GraphDataModel');
    CodecRegistry.addAlias('mxPoint', 'Point');
    CodecRegistry.register(new mxCellCodec(), false);
    CodecRegistry.register(new mxGeometryCodec(), false);

    CodecRegistrationStates.model = true;
  }
};
