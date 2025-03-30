/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import { htmlEntities } from '../util/StringUtils';
import Client from '../Client';
import { utils } from '../util/Utils';
import { br, write } from '../util/domUtils';
import { translate } from '../internal/i18n-utils';
import InternalEvent from '../view/event/InternalEvent';
import MaxWindow from './MaxWindow';

/**
 * Shows the specified text content in a new {@link MaxWindow} or a new browser window if `isInternalWindow` is `false`.
 *
 * @param content String that specifies the text to be displayed.
 * @param isInternalWindow Optional boolean indicating if an {@link MaxWindow} should be used instead of a new browser window. Default is `false`.
 */
export const popup = (content: string, isInternalWindow = false) => {
  if (isInternalWindow) {
    const div = document.createElement('div');

    div.style.overflow = 'scroll';
    div.style.width = '636px';
    div.style.height = '460px';

    const pre = document.createElement('pre');
    pre.innerHTML = htmlEntities(content, false)
      .replace(/\n/g, '<br>')
      .replace(/ /g, '&nbsp;');

    div.appendChild(pre);

    const w = document.body.clientWidth;
    const h = Math.max(
      document.body.clientHeight || 0,
      document.documentElement.clientHeight
    );
    const wnd = new MaxWindow(
      'Popup Window',
      div,
      w / 2 - 320,
      h / 2 - 240,
      640,
      480,
      false,
      true
    );

    wnd.setClosable(true);
    wnd.setVisible(true);
  } else {
    // Wraps up the XML content in a textarea
    if (Client.IS_NS) {
      const wnd = window.open();
      if (!wnd) {
        throw new Error('Permission not granted to open popup window');
      }
      wnd.document.writeln(`<pre>${htmlEntities(content)}</pre`);
      wnd.document.close();
    } else {
      const wnd = window.open();
      if (!wnd) {
        throw new Error('Permission not granted to open popup window');
      }
      const pre = wnd.document.createElement('pre');
      pre.innerHTML = htmlEntities(content, false)
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
      wnd.document.body.appendChild(pre);
    }
  }
};

/**
 * Displays the given error message in a new <MaxWindow> of the given width.
 * If close is true then an additional close button is added to the window.
 * The optional icon specifies the icon to be used for the window. Default is {@link utils.errorImage}.
 *
 * @param message String specifying the message to be displayed.
 * @param width Integer specifying the width of the window.
 * @param close Optional boolean indicating whether to add a close button.
 * @param icon Optional icon for the window decoration.
 */
export const error = (
  message: string,
  width: number,
  close: boolean,
  icon: string | null = null
) => {
  const div = document.createElement('div');
  div.style.padding = '20px';

  const img = document.createElement('img');
  img.setAttribute('src', icon || utils.errorImage);
  img.setAttribute('valign', 'bottom');
  img.style.verticalAlign = 'middle';
  div.appendChild(img);

  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
  write(div, message);

  const w = document.body.clientWidth;
  const h = document.body.clientHeight || document.documentElement.clientHeight;
  const warn = new MaxWindow(
    translate(utils.errorResource) || utils.errorResource,
    div,
    (w - width) / 2,
    h / 4,
    width,
    null,
    false,
    true
  );

  if (close) {
    br(div);

    const tmp = document.createElement('p');
    const button = document.createElement('button');

    button.setAttribute('style', 'float:right');

    InternalEvent.addListener(button, 'click', (evt: MouseEvent) => {
      warn.destroy();
    });

    write(button, translate(utils.closeResource) || utils.closeResource);

    tmp.appendChild(button);
    div.appendChild(tmp);

    br(div);

    warn.setClosable(true);
  }

  warn.setVisible(true);

  return warn;
};
