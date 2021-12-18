/**
 * Copyright (c) 2006-2013, JGraph Ltd
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import mxRubberband from '../mxgraph/handler/mxRubberband';
import { error } from '../../packages/core/src/util/gui/MaxWindow';
import { load } from '../../packages/core/src/util/network/MaxXmlRequest';

class MYNAMEHERE extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A container for the graph
    return (
      <>
        <h1>UIConfig example</h1>
        This example demonstrates using a config
        file to configure the toolbar and popup menu in Editor.

        <div
          ref={el => {
            this.el = el;
          }}
          style={{

          }}
        />
      </>
    );
  };

  componentDidMount() {

  };
}

export default MYNAMEHERE;


    function main()
    {
      // Checks if the browser is supported
      if (!Client.isBrowserSupported())
      {
        // Displays an error message if the browser is not supported.
        error('Browser is not supported!', 200, false);
      }
      else
      {
        MaxLog.show();

        // Creates the graph inside the given container. The
        // editor is used to create certain functionality for the
        // graph, such as the rubberband selection, but most parts
        // of the UI are custom in this example.
        let editor = new Editor();

        // Configures the editor's UI, the toolbar and the popupmenu.
        // Note that the element with the id toolbox is used in the
        // config file, the toolbar element (top element) is used below
        // to create a second toolbar programmatically.
        // The cells to be created via drag and drop are added
        // in the templates array in Editor, and a custom action is
        // added to the built-in actions in the editor, as well.
        // The ui section maps the existing DOM elements to the graph
        // and toolbar objects, respectively.
        // Keep in mind that the as-attributes of the add-items in the
        // toolbar and popupmenu sections refer to keys in mxResources.
        let config = load('uiconfig.xml').getDocumentElement();
        ObjectCodec.allowEval = true;
        editor.configure(config);
        ObjectCodec.allowEval = false;

        // Enables new connections in the graph
        editor.graph.setConnectable(true);

        // Creates the second toolbar programmatically
        let container = document.getElementById('toolbar');
        let toolbar = new DefaultToolbar(container, editor);

        // Use eg. mxResources.get("delete") to translate tooltip
        toolbar.addItem('Show XML', 'images/icons48/gear.png', 'myFirstAction');
        toolbar.addItem('Delete', 'images/icons48/keys.png', 'delete');

        console.log('editor', editor);
      }
    }
  </script>
</head>

<!-- Page passes the container for the graph to the program -->
<body onload="main();" style="margin:0px;height:100%;">
  <table width="100%" height="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td id="toolbar" colspan="2" height="80px" style="background:#7F7F7F;padding:10px;">
    </td>
  </tr>
  <tr>
    <td id="toolbox" valign="top" width="70px" style="min-width:70px;background:#7F7F7F;padding:12px;">
    </td>
    <td width="100%" style="background:url('editors/images/grid.gif');border: solid gray 1px;height:100%;">
      <div id="graph" style="overflow:auto;width:100%;height:100%;">
      </div>
    </td>
  </tr>
  </table>
</body>
</html>
