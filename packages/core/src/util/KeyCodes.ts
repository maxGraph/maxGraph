/*
Copyright 2026-present The maxGraph project Contributors

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

/**
 * Values of `KeyboardEvent.keyCode` for the keys handled by maxGraph.
 *
 * Use them instead of magic numbers when comparing `evt.keyCode` or when binding keys with {@link KeyHandler.bindKey} and its siblings.
 *
 * ```javascript
 * const keyHandler = new KeyHandler(graph);
 * keyHandler.bindKey(KeyCodes.Delete, () => graph.removeCells());
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
 * @category Utils
 * @since 0.26.0
 */
export const KeyCodes = {
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
  ArrowUp: 38,
  Backspace: 8,
  Control: 17,
  Delete: 46,
  Enter: 13,
  Escape: 27,
  F2: 113,
  /**
   * Command key (left or right) on macOS, as reported by Firefox, which uses `DOM_VK_META` for both keys.
   * Other browsers report {@link MetaLeft} and {@link MetaRight} instead.
   *
   * @see https://github.com/mozilla-firefox/firefox/blob/a82bcf39e8d23e7b06e021044db52f74210862ce/widget/cocoa/TextInputHandler.mm#L1470-L1472
   * @see https://github.com/mozilla-firefox/firefox/blob/a82bcf39e8d23e7b06e021044db52f74210862ce/dom/webidl/KeyEvent.webidl#L196
   */
  FirefoxMeta: 224,
  /**
   * Left Meta key: left Command key on macOS (except in Firefox, see {@link FirefoxMeta}), Windows logo key on Windows.
   */
  MetaLeft: 91,
  /**
   * Right Command key on macOS (except in Firefox, see {@link FirefoxMeta}).
   * On Windows, this code is the ContextMenu key.
   */
  MetaRight: 93,
} as const;
