# CSS and Images

## CSS

Some features of `maxGraph` create elements in the DOM to let interact with the `Graph`.
For instance, it happens hen using _Rubberband_, _Tooltip_, _MaxWindow_, _Editor_ and _Toolbar_.

These elements require the application to provide CSS rules for correct display.

`maxGraph` provides a default CSS file that can be used in the application like in the following:
```js
import '@maxgraph/core/css/common.css';
```

It is possible to customize the defaults by providing new CSS rules.

For example, create a `custom.css` file:
```css
/* For rubber band selection, override maxGraph defaults */
div.mxRubberband {
  border-color: #b18426;
  background: #db9b0b;
}
```
Then, import it in the application: 
```js
import '@maxgraph/core/css/common.css';
import './custom.css'
```

## Images

The `@maxgraph/core` npm package includes images that are required by some features.

When using these features, the images must be available in the application. `maxGraph` currently requires to configure the path to the images,
using `Client.setImageBasePath`.

This configuration is inherited from `mxGraph` and may be simplified in the future. 


**TODO: list some features requiring images**
