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

import { registerModelCodecs } from './register';
import { getPrettyXml, parseXml } from '../util/xmlUtils';
import { Codec } from '../index';
import type GraphDataModel from '../view/GraphDataModel';

/**
 * Export options of {@link ModelXmlSerializer}.
 *
 * **WARN**: this is an experimental feature that is subject to change.
 *
 * @alpha
 * @experimental
 * @since 0.6.0
 */
export type ModelExportOptions = {
  /**
   * If `true`, prettify the exported xml.
   * @default true
   */
  pretty?: boolean;
};

/**
 * Convenient utility class using {@link Codec} to manage maxGraph model import and export.
 *
 * **WARN**: this is an experimental feature that is subject to change (class and method names).
 *
 * @alpha
 * @experimental
 * @since 0.6.0
 */
// Include 'XML' in the class name as there were past discussions about supporting other format like JSON for example
// See https://github.com/maxGraph/maxGraph/discussions/60 for more details.
export class ModelXmlSerializer {
  constructor(private dataModel: GraphDataModel) {
    this.registerCodecs();
  }

  import(xml: string): void {
    const doc = parseXml(xml);
    new Codec(doc).decode(doc.documentElement, this.dataModel);
  }

  export(options?: ModelExportOptions): string {
    const encodedNode = new Codec().encode(this.dataModel);
    return options?.pretty ?? true
      ? getPrettyXml(encodedNode)
      : getPrettyXml(encodedNode, '', '', '');
  }

  /**
   * Hook for replacing codecs registered by default (core codecs).
   */
  protected registerCodecs(): void {
    registerModelCodecs();
  }
}
