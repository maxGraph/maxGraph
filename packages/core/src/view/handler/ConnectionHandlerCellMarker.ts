import CellMarker from "../cell/CellMarker";
import {Graph} from "../Graph";
import {ColorValue} from "../../types";
import {DEFAULT_HOTSPOT, DEFAULT_INVALID_COLOR, DEFAULT_VALID_COLOR, NONE} from "../../util/Constants";
import InternalMouseEvent from "../event/InternalMouseEvent";
import CellState from "../cell/CellState";
import ConnectionHandler from "./ConnectionHandler";

class ConnectionHandlerCellMarker extends CellMarker {
    connectionHandler: ConnectionHandler;

    hotspotEnabled = true;

    constructor(
        graph: Graph,
        connectionHandler: ConnectionHandler,
        validColor: ColorValue = DEFAULT_VALID_COLOR,
        invalidColor: ColorValue = DEFAULT_INVALID_COLOR,
        hotspot: number = DEFAULT_HOTSPOT
    ) {
        super(graph, validColor, invalidColor, hotspot);
        this.connectionHandler = connectionHandler;
    }

    // Overrides to return cell at location only if valid (so that
    // there is no highlight for invalid cells)
    getCell(me: InternalMouseEvent) {
        let cell = super.getCell(me);
        this.connectionHandler.error = null;

        // Checks for cell at preview point (with grid)
        if (!cell && this.connectionHandler.currentPoint) {
            cell = this.connectionHandler.graph.getCellAt(
                this.connectionHandler.currentPoint.x,
                this.connectionHandler.currentPoint.y
            );
        }

        // Uses connectable parent vertex if one exists
        if (cell && !cell.isConnectable() && this.connectionHandler.cell) {
            const parent = this.connectionHandler.cell.getParent();

            if (parent && parent.isVertex() && parent.isConnectable()) {
                cell = parent;
            }
        }

        if (cell) {
            if (
                (this.connectionHandler.graph.isSwimlane(cell) &&
                    this.connectionHandler.currentPoint != null &&
                    this.connectionHandler.graph.hitsSwimlaneContent(
                        cell,
                        this.connectionHandler.currentPoint.x,
                        this.connectionHandler.currentPoint.y
                    )) ||
                !this.connectionHandler.isConnectableCell(cell)
            ) {
                cell = null;
            }
        }

        if (cell) {
            if (this.connectionHandler.isConnecting()) {
                if (this.connectionHandler.previous) {
                    this.connectionHandler.error = this.connectionHandler.validateConnection(
                        this.connectionHandler.previous.cell,
                        cell
                    );

                    if (this.connectionHandler.error && this.connectionHandler.error.length === 0) {
                        cell = null;

                        // Enables create target inside groups
                        if (this.connectionHandler.isCreateTarget(me.getEvent())) {
                            this.connectionHandler.error = null;
                        }
                    }
                }
            } else if (!this.connectionHandler.isValidSource(cell, me)) {
                cell = null;
            }
        } else if (
            this.connectionHandler.isConnecting() &&
            !this.connectionHandler.isCreateTarget(me.getEvent()) &&
            !this.connectionHandler.graph.isAllowDanglingEdges()
        ) {
            this.connectionHandler.error = '';
        }

        return cell;
    }

    // Sets the highlight color according to validateConnection
    isValidState(state: CellState) {
        if (this.connectionHandler.isConnecting()) {
            return !this.connectionHandler.error;
        }
        return super.isValidState(state);
    }

    // Overrides to use marker color only in highlight mode or for
    // target selection
    getMarkerColor(evt: Event, state: CellState, isValid: boolean) {
        return !this.connectionHandler.connectImage || this.connectionHandler.isConnecting()
            ? super.getMarkerColor(evt, state, isValid)
            : NONE;
    }

    // Overrides to use hotspot only for source selection otherwise
    // intersects always returns true when over a cell
    intersects(state: CellState, evt: InternalMouseEvent) {
        if (this.connectionHandler.connectImage || this.connectionHandler.isConnecting()) {
            return true;
        }
        return super.intersects(state, evt);
    }
}

export default ConnectionHandlerCellMarker;
