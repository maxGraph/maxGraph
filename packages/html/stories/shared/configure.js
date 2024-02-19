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

import { Client } from '@maxgraph/core';

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
