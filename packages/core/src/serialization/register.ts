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
  GraphViewCodec,
  ModelCodec,
  mxCellCodec,
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

let isCoreCodecsRegistered = false;

/**
 * Register core editor i.e. codecs that don't relate to editor.
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
 */
export const registerCoreCodecs = (force = false) => {
  if (!isCoreCodecsRegistered || force) {
    CodecRegistry.register(new CellCodec());
    CodecRegistry.register(new ChildChangeCodec());
    CodecRegistry.register(new GraphViewCodec());
    CodecRegistry.register(new ModelCodec());
    CodecRegistry.register(new RootChangeCodec());
    CodecRegistry.register(new StylesheetCodec());
    CodecRegistry.register(new TerminalChangeCodec());
    registerGenericChangeCodecs();

    // To support decode/import executed before encode/export (see https://github.com/maxGraph/maxGraph/issues/178)
    // Codecs are currently only registered automatically during encode/export
    CodecRegistry.register(new ObjectCodec(new Geometry()));
    CodecRegistry.register(new ObjectCodec(new Point()));
    CodecRegistry.register(new ObjectCodec({})); // Object
    CodecRegistry.register(new ObjectCodec([])); // Array

    // mxGraph support
    CodecRegistry.addAlias('mxGraphModel', 'GraphDataModel');
    CodecRegistry.register(new mxCellCodec());
    // remove extra alias automatically added when registering mxCellCodec
    delete CodecRegistry.aliases['Cell'];
    CodecRegistry.addAlias('mxGeometry', 'Geometry');

    isCoreCodecsRegistered = true;
  }
};

let isEditorCodecsRegistered = false;
/**
 * Register only editor codecs.
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
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
 * Register all editors i.e. core codecs (as done by {@link registerCoreCodecs}) and editor codecs (as done by {@link registerEditorCodecs}).
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
 */
export const registerAllCodecs = (force = false) => {
  registerCoreCodecs(force);
  registerEditorCodecs(force);
};
