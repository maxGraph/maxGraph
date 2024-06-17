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

// TODO TMP workaround, need an import, otherwise TSC complains
// TS2436: Ambient module declaration cannot specify relative module name.
export {};

declare module '../Graph' {
  interface Graph {
    /** @default null */
    horizontalPageBreaks: any[] | null;

    /** @default null */
    verticalPageBreaks: any[] | null;

    /**
     * Invokes from {@link sizeDidChange} to redraw the page breaks.
     *
     * @param visible Boolean that specifies if page breaks should be shown.
     * @param width Specifies the width of the container in pixels.
     * @param height Specifies the height of the container in pixels.
     */
    updatePageBreaks: (visible: boolean, width: number, height: number) => void;
  }
}
