/*
Copyright 2024-present The maxGraph project Contributors

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

import { Client, constants } from '@maxgraph/core';

export const isElement = (node: ChildNode): node is Element =>
  node.nodeType === constants.NODE_TYPE.ELEMENT;

/**
 * Build the URL of an image of the stories from the image base path configured in {@link Client.imageBasePath}.
 *
 * @param path the path of the image relative to the images folder, for example `icons48/keys.png`
 */
export const getImagePath = (path: string): string => `${Client.imageBasePath}/${path}`;
