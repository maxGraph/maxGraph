---
sidebar_position: 10
description: How-to use built-in EdgeStyles and create new EdgeStyles.
---

# EdgeStyles

:::info
The examples in this page use `TypeScript`; adapt them if you write `JavaScript`.
:::

## What is an EdgeStyle?

An `EdgeStyle` is a function that calculates the precise points along an edge, ensuring it follows a specific layout pattern - such as maintaining orthogonal segments or forming an "elbow" shape.
It can also implement sophisticated routing algorithms like the `ManhattanConnector`, which finds the shortest path between vertices while avoiding obstacles, using manhattan distance as its metric.

An `EdgeStyle` is configured within the style properties of the Cell that relates to the Edge.  
By default, an edge `EdgeStyle` is unset.

:::note
All EdgeStyles provided by `maxGraph` are automatically registered in the `StyleRegistry` when a `Graph` instance is created. For more details, see the [Global Configuration](global-configuration.md#styles) documentation.  
To check the list of registered EdgeStyles, refer to the `registerDefaultStyleElements` function.
:::


## How to Use a Specific EdgeStyle

:::info
For more details about the usage of EdgeStyles, see the documentation of `CellStateStyle.edgeStyle`.
:::

`maxGraph` provides various edgeStyle functions under the `EdgeStyle` namespace to be used in the `style` property of an Edge as the value of `CellStateStyle.edgeStyle`.

The following example uses the built-in `ElbowConnector` (registered under the `elbowEdgeStyle` key in `StyleRegistry`):

```javascript
style.edgeStyle = 'elbowEdgeStyle';
```

:::tip

The `CellStateStyle.edgeStyle` type guides you on how to set the EdgeStyle value when configuring the value with a string.

:::

It is possible to configure the default EdgeStyle for all edges in the `Graph`, for example to use `SegmentConnector` (registered by default under the `segmentEdgeStyle` key in the `StyleRegistry`), as follows:

```javascript
const style = stylesheet.getDefaultEdgeStyle();
style.edgeStyle = 'segmentEdgeStyle';
```


## Custom EdgeStyle

### Creating a Custom EdgeStyle

An `EdgeStyle` is a function matching the `EdgeStyleFunction` type. To write a custom edge style, create a function as follows.

In the example below, a right angle is created using a point on the horizontal center of the target vertex and the vertical center of the source vertex.
The code checks if that point intersects the source vertex and makes the edge straight if it does.
The point is then added into the result array, which acts as the return value of the function.

```typescript
const MyStyle: EdgeStyleFunction = (state, source, target, points, result) => {
  if (source && target) {
    const pt = new Point(target.getCenterX(), source.getCenterY());

    if (mathUtils.contains(source, pt.x, pt.y)) {
      pt.y = source.y + source.height;
    }

    result.push(pt);
  }
};
```

The new edge style can then be registered in the `StyleRegistry` as follows:
```javascript
StyleRegistry.putValue('myEdgeStyle', MyStyle);
```


### Using a Custom EdgeStyle

The custom edge style above can now be used in a specific edge as follows:
```javascript
style.edgeStyle = 'myEdgeStyle';
```

Or it can be used for all edges in the `Graph` as follows:

```javascript
const style = graph.getStylesheet().getDefaultEdgeStyle();
style.edgeStyle = 'myEdgeStyle';
```

### Example of custom EdgeStyle

See the **Wires** story in the Storybook demo:
- live demo: [Wires](https://maxgraph.github.io/maxGraph/demo/?path=/story/connections-wires--default)
- source code: [Wires.stories.js](https://github.com/maxGraph/maxGraph/blob/main/packages/html/stories/Wires.stories.js)
