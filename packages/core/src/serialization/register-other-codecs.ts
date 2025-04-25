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
  ChildChangeCodec,
  EditorCodec,
  EditorKeyHandlerCodec,
  EditorPopupMenuCodec,
  EditorToolbarCodec,
  GenericChangeCodec,
  GraphCodec,
  GraphViewCodec,
  RootChangeCodec,
  StylesheetCodec,
  TerminalChangeCodec,
} from './codecs/_other-codecs';
import Rectangle from '../view/geometry/Rectangle';
import ImageBox from '../view/image/ImageBox';
import CellAttributeChange from '../view/undoable_changes/CellAttributeChange';
import CollapseChange from '../view/undoable_changes/CollapseChange';
import GeometryChange from '../view/undoable_changes/GeometryChange';
import StyleChange from '../view/undoable_changes/StyleChange';
import ValueChange from '../view/undoable_changes/ValueChange';
import VisibleChange from '../view/undoable_changes/VisibleChange';
import {
  CodecRegistrationStates,
  createObjectCodec,
  registerBaseCodecs,
} from './register-shared';
import { registerModelCodecs } from './register-model-codecs';

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

/**
 * Register core codecs i.e. codecs that don't relate to editor. This includes model codecs that can be registered individually with {@link registerModelCodecs}.
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
 * @category Configuration
 * @category Serialization with Codecs
 */
export const registerCoreCodecs = (force = false) => {
  if (!CodecRegistrationStates.core || force) {
    CodecRegistry.register(new ChildChangeCodec());
    CodecRegistry.register(new GraphCodec());
    CodecRegistry.register(new GraphViewCodec());
    CodecRegistry.register(new RootChangeCodec());
    CodecRegistry.register(new StylesheetCodec());
    CodecRegistry.register(new TerminalChangeCodec());
    registerGenericChangeCodecs();

    // Needed at least by Graph
    CodecRegistry.register(createObjectCodec(new Rectangle(), 'Rectangle'));
    CodecRegistry.register(createObjectCodec(new ImageBox(undefined!, 0, 0), 'ImageBox'));

    registerModelCodecs(force);

    CodecRegistrationStates.core = true;
  }
};

/**
 * Register only editor codecs.
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
 * @category Configuration
 * @category Serialization with Codecs
 */
export const registerEditorCodecs = (force = false) => {
  if (!CodecRegistrationStates.editor || force) {
    registerBaseCodecs(force);

    CodecRegistry.register(new EditorCodec());
    CodecRegistry.register(new EditorKeyHandlerCodec());
    CodecRegistry.register(new EditorPopupMenuCodec());
    CodecRegistry.register(new EditorToolbarCodec());

    CodecRegistrationStates.editor = true;
  }
};

/**
 * Register all codecs i.e. core codecs (as done by {@link registerCoreCodecs}) and editor codecs (as done by {@link registerEditorCodecs}).
 *
 * @param force if `true` register the codecs even if they were already registered. If false, only register them
 *              if they have never been registered before.
 * @since 0.6.0
 * @category Configuration
 * @category Serialization with Codecs
 */
export const registerAllCodecs = (force = false) => {
  registerCoreCodecs(force);
  registerEditorCodecs(force);
};

/**
 * Unregister all codecs from {@link CodecRegistry}.
 *
 * @since 0.18.0
 * @category Configuration
 * @category Serialization with Codecs
 */
export const unregisterAllCodecs = () => {
  CodecRegistry.codecs = {};
  CodecRegistry.aliases = {};

  // reset the state to ensure that the codecs are registered again when the "register" functions are called
  for (const key of Object.keys(CodecRegistrationStates)) {
    CodecRegistrationStates[key] = false;
  }
};
