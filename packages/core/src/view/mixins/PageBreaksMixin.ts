import Rectangle from '../geometry/Rectangle';
import Point from '../geometry/Point';
import PolylineShape from '../geometry/edge/PolylineShape';
import { Graph } from '../Graph';
import { mixInto } from '../../util/Utils';

declare module '../Graph' {
  interface Graph {
    horizontalPageBreaks: any[] | null;
    verticalPageBreaks: any[] | null;

    updatePageBreaks: (visible: boolean, width: number, height: number) => void;
  }
}

type PartialGraph = Pick<
  Graph,
  | 'getView'
  | 'getGraphBounds'
  | 'getPageFormat'
  | 'getPageScale'
  | 'getMinPageBreakDist'
  | 'getPageBreakColor'
  | 'getDialect'
  | 'isPageBreakDashed'
>;
type PartialPageBreaks = Pick<
  Graph,
  'horizontalPageBreaks' | 'verticalPageBreaks' | 'updatePageBreaks'
>;
type PartialType = PartialGraph & PartialPageBreaks;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const PageBreaksMixin: PartialType = {
  horizontalPageBreaks: null,
  verticalPageBreaks: null,

  /**
   * Invokes from {@link sizeDidChange} to redraw the page breaks.
   *
   * @param visible Boolean that specifies if page breaks should be shown.
   * @param width Specifies the width of the container in pixels.
   * @param height Specifies the height of the container in pixels.
   */
  updatePageBreaks(visible, width, height) {
    const { scale, translate: tr } = this.getView();
    const fmt = this.getPageFormat();
    const ps = scale * this.getPageScale();
    const bounds = new Rectangle(0, 0, fmt.width * ps, fmt.height * ps);

    const gb = Rectangle.fromRectangle(this.getGraphBounds());
    gb.width = Math.max(1, gb.width);
    gb.height = Math.max(1, gb.height);

    bounds.x =
      Math.floor((gb.x - tr.x * scale) / bounds.width) * bounds.width + tr.x * scale;
    bounds.y =
      Math.floor((gb.y - tr.y * scale) / bounds.height) * bounds.height + tr.y * scale;

    gb.width = Math.ceil((gb.width + (gb.x - bounds.x)) / bounds.width) * bounds.width;
    gb.height =
      Math.ceil((gb.height + (gb.y - bounds.y)) / bounds.height) * bounds.height;

    // Does not show page breaks if the scale is too small
    visible =
      visible && Math.min(bounds.width, bounds.height) > this.getMinPageBreakDist();

    const horizontalCount = visible ? Math.ceil(gb.height / bounds.height) + 1 : 0;
    const verticalCount = visible ? Math.ceil(gb.width / bounds.width) + 1 : 0;
    const right = (verticalCount - 1) * bounds.width;
    const bottom = (horizontalCount - 1) * bounds.height;

    if (this.horizontalPageBreaks == null && horizontalCount > 0) {
      this.horizontalPageBreaks = [];
    }

    if (this.verticalPageBreaks == null && verticalCount > 0) {
      this.verticalPageBreaks = [];
    }

    const drawPageBreaks = (breaks: any) => {
      if (breaks != null) {
        const count =
          breaks === this.horizontalPageBreaks ? horizontalCount : verticalCount;

        for (let i = 0; i <= count; i += 1) {
          const pts =
            breaks === this.horizontalPageBreaks
              ? [
                  new Point(
                    Math.round(bounds.x),
                    Math.round(bounds.y + i * bounds.height)
                  ),
                  new Point(
                    Math.round(bounds.x + right),
                    Math.round(bounds.y + i * bounds.height)
                  ),
                ]
              : [
                  new Point(
                    Math.round(bounds.x + i * bounds.width),
                    Math.round(bounds.y)
                  ),
                  new Point(
                    Math.round(bounds.x + i * bounds.width),
                    Math.round(bounds.y + bottom)
                  ),
                ];

          if (breaks[i] != null) {
            breaks[i].points = pts;
            breaks[i].redraw();
          } else {
            const pageBreak = new PolylineShape(pts, this.getPageBreakColor());
            pageBreak.dialect = this.getDialect();
            pageBreak.pointerEvents = false;
            pageBreak.isDashed = this.isPageBreakDashed();
            pageBreak.init(this.getView().backgroundPane);
            pageBreak.redraw();

            breaks[i] = pageBreak;
          }
        }

        for (let i = count; i < breaks.length; i += 1) {
          breaks[i].destroy();
        }

        breaks.splice(count, breaks.length - count);
      }
    };

    drawPageBreaks(this.horizontalPageBreaks);
    drawPageBreaks(this.verticalPageBreaks);
  },
};

mixInto(Graph)(PageBreaksMixin);
