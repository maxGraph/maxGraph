import './style.css';
import { Client, Graph } from '@maxgraph/core';

// display the maxGraph version in the footer
const footer = document.querySelector<HTMLElement>('footer')!;
footer.innerText = `maxGraph ${Client.VERSION}`;

// Creates the graph inside the given container
const container = document.querySelector<HTMLDivElement>('#graph-container')!;
const graph = new Graph(container);

// Gets the default parent for inserting new cells. This
// is normally the first child of the root (ie. layer 0).
const parent = graph.getDefaultParent();

// Adds cells to the model in a single step
graph.batchUpdate(() => {
  const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
  const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
  graph.insertEdge(parent, null, '', v1, v2);
});
