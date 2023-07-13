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
