export const globalTypes = {
  width: {
    type: 'number',
    defaultValue: 800,
  },
  height: {
    type: 'number',
    defaultValue: 600,
  },
};

export const rubberBandTypes = {
  // rubberBand use the mouse right button, so disable the context-menu to not overlap
  contextMenu: {
    type: 'boolean',
    defaultValue: false,
  },
  rubberBand: {
    type: 'boolean',
    defaultValue: true,
  },
};
