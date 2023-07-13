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
  rubberBand: {
    type: 'boolean',
    defaultValue: true,
  },
};

export const panningTypes = {
  // by default, the panning uses the right button of the mouse, so disable the context-menu to not overlap
  contextMenu: {
    type: 'boolean',
    defaultValue: false,
  },
};
