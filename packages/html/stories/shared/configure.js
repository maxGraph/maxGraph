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

import { Client, ImageBox as Image } from '@maxgraph/core';

export const configureImagesBasePath = () => {
  Client.setImageBasePath('./images');
};

/**
 * @param args {Record<string, string>}
 * @return {HTMLDivElement}
 */
export const createGraphContainer = (args) => {
  const container = document.createElement('div');
  const style = container.style;
  style.position = 'relative';
  style.overflow = 'hidden';
  style.width = `${args.width}px`;
  style.height = `${args.height}px`;
  style.background = 'url(./images/grid.gif)';
  style.cursor = 'default';
  return container;
};

// TODO update the maxGraph behavior to prevent to have to call this function
// The graph options seem to be set at maxGraph import, prior we set the Client.imageBasePath so it is using the former imageBasePath value.
// Redefine here to ensure that the updated Client.imageBasePath value is used
export function configureExpandedAndCollapsedImages(graph) {
  graph.options.collapsedImage = new Image(`${Client.imageBasePath}/collapsed.gif`, 9, 9);
  graph.options.expandedImage = new Image(`${Client.imageBasePath}/expanded.gif`, 9, 9);
}
