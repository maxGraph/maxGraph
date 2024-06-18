/*
Copyright 2023-present The maxGraph project Contributors

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
  ChildChangeCodec,
  EditorCodec,
  EditorKeyHandlerCodec,
  EditorPopupMenuCodec,
  EditorToolbarCodec,
  GenericChangeCodec,
  GraphCodec,
  GraphViewCodec,
  ModelCodec,
  mxCellCodec,
  mxGeometryCodec,
  RootChangeCodec,
  StylesheetCodec,
  TerminalChangeCodec,
} from './codecs';
import ObjectCodec from './ObjectCodec';
import Geometry from '../view/geometry/Geometry';
import Point from '../view/geometry/Point';
import CellAttributeChange from '../view/undoable_changes/CellAttributeChange';
import CollapseChange from '../view/undoable_changes/CollapseChange';
import GeometryChange from '../view/undoable_changes/GeometryChange';
import StyleChange from '../view/undoable_changes/StyleChange';
import ValueChange from '../view/undoable_changes/ValueChange';
import VisibleChange from '../view/undoable_changes/VisibleChange';

const registerGenericChangeCodecs = () => {
  const __dummy: any = undefined;
  CodecRegistry.register(
    new GenericChangeCodec(new CellAttributeChange(__dummy, __dummy, __dummy), 'value')
  );
  CodecRegistry.register(
    new GenericChangeCodec(new CollapseChange(__dummy, __dummy, __dummy), 'collapsed')
  );
  CodecRegistry.register(
    new GenericChangeCodec(new GeometryChange(__dummy, __dummy, __dummy), 'geometry')
  );
  CodecRegistry.register(
    new GenericChangeCodec(new StyleChange(__dummy, __dummy, __dummy), 'style')
  );
  CodecRegistry.register(
    new GenericChangeCodec(new ValueChange(__dummy, __dummy, __dummy), 'value')
  );
  CodecRegistry.register(
    new GenericChangeCodec(new VisibleChange(__dummy, __dummy, __dummy), 'visible')
  );
};

const createObjectCodec = (template: any, name: string): ObjectCodec => {
  const objectCodec = new ObjectCodec(template);
  objectCodec.setName(name);
  return objectCodec;
};

let isModelCodecsRegistered = false;
/**
 * Register model codecs i.e. codecs used to import/export the Graph Model, see {@link GraphDataModel}.
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.10.0
 * @category Configuration
 */
export const registerModelCodecs = (force = false) => {
  if (!isModelCodecsRegistered || force) {
    CodecRegistry.register(new CellCodec());
    CodecRegistry.register(new ModelCodec());

    // To support decode/import executed before encode/export (see https://github.com/maxGraph/maxGraph/issues/178)
    // Codecs are currently only registered automatically during encode/export
    // in js-example, project built with webpack
    // the name of the Geometry constructor is sometimes the same as the name of the Cell constructor
    // registering an alias here would override the alias for Cell.
    // Cell is the top level element while encoding, so the Cell alias must be set, otherwise "Uncaught InternalError: too much recursion" occurs
    // But, then, the Geometry elements are not correctly encoded
    // This hasn't been managed as part of https://github.com/maxGraph/maxGraph/issues/169 which only dealt with the encode/import feature.
    CodecRegistry.register(createObjectCodec(new Geometry(), 'Geometry'), false);
    CodecRegistry.register(createObjectCodec(new Point(), 'Point'));
    CodecRegistry.register(new ObjectCodec({})); // Object
    CodecRegistry.register(new ObjectCodec([])); // Array

    // mxGraph support
    CodecRegistry.addAlias('mxGraphModel', 'GraphDataModel');
    CodecRegistry.addAlias('mxPoint', 'Point');
    CodecRegistry.register(new mxCellCodec(), false);
    CodecRegistry.register(new mxGeometryCodec(), false);

    isModelCodecsRegistered = true;
  }
};

let isCoreCodecsRegistered = false;
/**
 * Register core codecs i.e. codecs that don't relate to editor. This includes model codecs that can be registered individually with {@link registerModelCodecs}.
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
 * @category Configuration
 */
export const registerCoreCodecs = (force = false) => {
  if (!isCoreCodecsRegistered || force) {
    CodecRegistry.register(new ChildChangeCodec());
    CodecRegistry.register(new GraphCodec());
    CodecRegistry.register(new GraphViewCodec());
    CodecRegistry.register(new RootChangeCodec());
    CodecRegistry.register(new StylesheetCodec());
    CodecRegistry.register(new TerminalChangeCodec());
    registerGenericChangeCodecs();

    registerModelCodecs(force);

    isCoreCodecsRegistered = true;
  }
};

let isEditorCodecsRegistered = false;
/**
 * Register only editor codecs.
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
 * @category Configuration
 */
export const registerEditorCodecs = (force = false) => {
  if (!isEditorCodecsRegistered || force) {
    CodecRegistry.register(new EditorCodec());
    CodecRegistry.register(new EditorKeyHandlerCodec());
    CodecRegistry.register(new EditorPopupMenuCodec());
    CodecRegistry.register(new EditorToolbarCodec());

    isEditorCodecsRegistered = true;
  }
};

/**
 * Register all codecs i.e. core codecs (as done by {@link registerCoreCodecs}) and editor codecs (as done by {@link registerEditorCodecs}).
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
 * @category Configuration
 */
export const registerAllCodecs = (force = false) => {
  registerCoreCodecs(force);
  registerEditorCodecs(force);
};
