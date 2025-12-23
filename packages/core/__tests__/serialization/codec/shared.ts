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

import { getPrettyXml, parseXml } from '../../../src/util/xmlUtils';
import Codec from '../../../src/serialization/Codec';

export const importToObject = (obj: object, xml: string): void => {
  const doc = parseXml(xml);
  new Codec(doc).decode(doc.documentElement, obj);
};

export const exportObject = (obj: object): string => {
  const encodedNode = new Codec().encode(obj);
  return getPrettyXml(encodedNode);
};
