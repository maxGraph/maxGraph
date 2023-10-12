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

export const globalTypes = {
  width: {
    control: {
      type: 'range',
      min: 100,
      max: 1000,
      step: 10,
    },
  },
  height: {
    control: {
      type: 'range',
      min: 100,
      max: 1000,
      step: 10,
    },
  },
};

export const globalValues = {
  height: 600,
  width: 800,
};

export const rubberBandTypes = {
  rubberBand: {
    type: 'boolean',
    defaultValue: true,
  },
};

export const rubberBandValues = {
  rubberBand: true,
};

export const contextMenuTypes = {
  // by default, the panning uses the right button of the mouse, so disable the context-menu to not overlap
  contextMenu: {
    type: 'boolean',
  },
};

export const contextMenuValues = {
  contextMenu: false,
};
