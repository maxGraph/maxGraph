/**
 * Copyright (c) 2006-2012, JGraph Ltd
 */
const { mod } = require('../../../../../packages/core/src/util/Utils');
const { br } = require('../../../../../packages/core/src/util/DomUtils');
const { htmlEntities } = require('../../../../../packages/core/src/util/StringUtils');
const { getScaleForPageCount } = require('../../../../../packages/core/src/util/Utils');
const { button } = require('../../../../../packages/core/src/util/dom/DomHelpers');
const { write } = require('../../../../../packages/core/src/util/DomUtils');
const { getDocumentScrollOrigin } = require('../../../../../packages/core/src/util/Utils');
const { setOpacity } = require('../../../../../packages/core/src/util/Utils');
const { getDocumentSize } = require('../../../../../packages/core/src/util/Utils');
/**
 * Editor constructor executed on page load.
 */
Editor = function(chromeless, themes, model, graph, editable)
{
	EventSource.call(this);
	this.chromeless = (chromeless != null) ? chromeless : this.chromeless;
	this.initStencilRegistry();
	this.graph = graph || this.createGraph(themes, model);
	this.editable = (editable != null) ? editable : !chromeless;
	this.undoManager = this.createUndoManager();
	this.status = '';

	this.getOrCreateFilename = function()
	{
		return this.filename || Resources.get('drawing', [Editor.pageCounter]) + '.xml';
	};
	
	this.getFilename = function()
	{
		return this.filename;
	};
	
	// Sets the status and fires a statusChanged event
	this.setStatus = function(value)
	{
		this.status = value;
		this.fireEvent(new EventObject('statusChanged'));
	};
	
	// Returns the current status
	this.getStatus = function()
	{
		return this.status;
	};

	// Updates modified state if graph changes
	this.graphChangeListener = function(sender, eventObject) 
	{
		let edit = (eventObject != null) ? eventObject.getProperty('edit') : null;
				
		if (edit == null || !edit.ignoreEdit)
		{
			this.setModified(true);
		}
	};
	
	this.graph.getModel().addListener(mxEvent.CHANGE, (() =>
	{
		this.graphChangeListener.apply(this, arguments);
	}));

	// Sets persistent graph state defaults
	this.graph.resetViewOnRootChange = false;
	this.init();
};

/**
 * Counts open editor tabs (must be global for cross-window access)
 */
Editor.pageCounter = 0;

// Cross-domain window access is not allowed in FF, so if we
// were opened from another domain then this will fail.
(function()
{
	try
	{
		let op = window;

		while (op.opener != null && typeof op.opener.Editor !== 'undefined' &&
			!isNaN(op.opener.Editor.pageCounter) &&	
			// Workaround for possible infinite loop in FF https://drawio.atlassian.net/browse/DS-795
			op.opener != op)
		{
			op = op.opener;
		}
		
		// Increments the counter in the first opener in the chain
		if (op != null)
		{
			op.Editor.pageCounter++;
			Editor.pageCounter = op.Editor.pageCounter;
		}
	}
	catch (e)
	{
		// ignore
	}
})();

/**
 * Specifies if local storage should be used (eg. on the iPad which has no filesystem)
 */
Editor.useLocalStorage = typeof(Storage) != 'undefined' && Client.IS_IOS;

/**
 * 
 */
Editor.moveImage = (Client.IS_SVG) ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI4cHgiIGhlaWdodD0iMjhweCI+PGc+PC9nPjxnPjxnPjxnPjxwYXRoIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIuNCwyLjQpc2NhbGUoMC44KXJvdGF0ZSg0NSwxMiwxMikiIHN0cm9rZT0iIzI5YjZmMiIgZmlsbD0iIzI5YjZmMiIgZD0iTTE1LDNsMi4zLDIuM2wtMi44OSwyLjg3bDEuNDIsMS40MkwxOC43LDYuN0wyMSw5VjNIMTV6IE0zLDlsMi4zLTIuM2wyLjg3LDIuODlsMS40Mi0xLjQyTDYuNyw1LjNMOSwzSDNWOXogTTksMjEgbC0yLjMtMi4zbDIuODktMi44N2wtMS40Mi0xLjQyTDUuMywxNy4zTDMsMTV2Nkg5eiBNMjEsMTVsLTIuMywyLjNsLTIuODctMi44OWwtMS40MiwxLjQybDIuODksMi44N0wxNSwyMWg2VjE1eiIvPjwvZz48L2c+PC9nPjwvc3ZnPgo=' :
	IMAGE_PATH + '/move.png';

/**
 * 
 */
Editor.rowMoveImage = (Client.IS_SVG) ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAEBAMAAACw6DhOAAAAGFBMVEUzMzP///9tbW1QUFCKiopBQUF8fHxfX1/IXlmXAAAAFElEQVQImWNgNVdzYBAUFBRggLMAEzYBy29kEPgAAAAASUVORK5CYII=' :
	IMAGE_PATH + '/thumb_horz.png';

/**
 * Images below are for lightbox and embedding toolbars.
 */
Editor.helpImage = (Client.IS_SVG) ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTExIDE4aDJ2LTJoLTJ2MnptMS0xNkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bTAtMTRjLTIuMjEgMC00IDEuNzktNCA0aDJjMC0xLjEuOS0yIDItMnMyIC45IDIgMmMwIDItMyAxLjc1LTMgNWgyYzAtMi4yNSAzLTIuNSAzLTUgMC0yLjIxLTEuNzktNC00LTR6Ii8+PC9zdmc+' :
	IMAGE_PATH + '/help.png';

/**
 * Sets the default font size.
 */
Editor.checkmarkImage = (Client.IS_SVG) ? 'data:image/gif;base64,R0lGODlhFQAVAMQfAGxsbHx8fIqKioaGhvb29nJycvr6+sDAwJqamltbW5OTk+np6YGBgeTk5Ly8vJiYmP39/fLy8qWlpa6ursjIyOLi4vj4+N/f3+3t7fT09LCwsHZ2dubm5r6+vmZmZv///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OEY4NTZERTQ5QUFBMTFFMUE5MTVDOTM5MUZGMTE3M0QiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OEY4NTZERTU5QUFBMTFFMUE5MTVDOTM5MUZGMTE3M0QiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo4Rjg1NkRFMjlBQUExMUUxQTkxNUM5MzkxRkYxMTczRCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo4Rjg1NkRFMzlBQUExMUUxQTkxNUM5MzkxRkYxMTczRCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEAACH5BAEAAB8ALAAAAAAVABUAAAVI4CeOZGmeaKqubKtylktSgCOLRyLd3+QJEJnh4VHcMoOfYQXQLBcBD4PA6ngGlIInEHEhPOANRkaIFhq8SuHCE1Hb8Lh8LgsBADs=' :
	IMAGE_PATH + '/checkmark.gif';

/**
 * Images below are for lightbox and embedding toolbars.
 */
Editor.maximizeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVBAMAAABbObilAAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABXRSTlMA758vX1Pw3BoAAABJSURBVAjXY8AJQkODGBhUQ0MhbAUGBiYY24CBgRnGFmZgMISwgwwDGRhEhVVBbAVmEQYGRwMmBjIAQi/CTIRd6G5AuA3dzYQBAHj0EFdHkvV4AAAAAElFTkSuQmCC';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.zoomOutImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVBAMAAABbObilAAAAElBMVEUAAAAAAAAsLCxxcXEhISFgYGChjTUxAAAAAXRSTlMAQObYZgAAAEdJREFUCNdjIAMwCQrB2YKCggJQJqMwA7MglK1owMBgqABVApITgLJZXFxgbIQ4Qj3CHIT5ggoIe5kgNkM1KSDYKBKqxPkDAPo5BAZBE54hAAAAAElFTkSuQmCC';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.zoomInImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVBAMAAABbObilAAAAElBMVEUAAAAAAAAsLCwhISFxcXFgYGBavKaoAAAAAXRSTlMAQObYZgAAAElJREFUCNdjIAMwCQrB2YKCggJQJqMIA4sglK3owMzgqABVwsDMwCgAZTMbG8PYCHGEeoQ5CPMFFRD2MkFshmpSQLBRJFSJ8wcAEqcEM2uhl2MAAAAASUVORK5CYII=';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.zoomFitImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVBAMAAABbObilAAAAD1BMVEUAAAAAAAAwMDBwcHBgYGC1xl09AAAAAXRSTlMAQObYZgAAAEFJREFUCNdjIAMwCQrB2YKCggJQJqMwA7MglK1owMBgqABVApITwMdGqEeYgzBfUAFhLxPEZqgmBQQbRUKFOH8AAK5OA3lA+FFOAAAAAElFTkSuQmCC';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.layersImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAAaVBMVEUAAAAgICAICAgdHR0PDw8WFhYICAgLCwsXFxcvLy8ODg4uLi4iIiIqKiokJCQYGBgKCgonJycFBQUCAgIqKiocHBwcHBwODg4eHh4cHBwnJycJCQkUFBQqKiojIyMuLi4ZGRkgICAEBATOWYXAAAAAGnRSTlMAD7+fnz8/H7/ff18/77+vr5+fn39/b28fH2xSoKsAAACQSURBVBjTrYxJEsMgDARZZMAY73sgCcn/HxnhKtnk7j6oRq0psfuoyndZ/SuODkHPLzfVT6KeyPePnJ7KrnkRjWMXTn4SMnN8mXe2SSM3ts8L/ZUxxrbAULSYJJULE0Iw9pjpenoICcgcX61mGgTgtCv9Be99pzCoDhNQWQnchD1mup5++CYGcoQexajZbfwAj/0MD8ZOaUgAAAAASUVORK5CYII=';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.previousImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAAh0lEQVQ4je3UsQnCUBCA4U8hpa1NsoEjpHQJS0dxADdwEMuMIJkgA1hYChbGQgMi+JC8q4L/AB/vDu7x74cWWEZhJU44RmA1zujR5GIbXF9YNrjD/Q0bDRY4fEBZ4P4LlgTnCbAf84pUM8/9hY08tMUtEoQ1LpEgrNBFglChFXR6Q6GfwwR6AGKJMF74Vtt3AAAAAElFTkSuQmCC';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.nextImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAAi0lEQVQ4jeXUIQ7CUAwA0MeGxWI2yylwnALJUdBcgYvM7QYLmjOQIAkIPmJZghiIvypoUtX0tfnJL38X5ZfaEgUeUcManFBHgS0SLlhHggk3bCPBhCf2keCQR8wjwYTDp6YiZxJmOU1jGw7vGALescuBxsArNlOwd/CM1VSM/ut1qCIw+uOwiMJ+OF4CQzBCXm3hyAAAAABJRU5ErkJggg==';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.editImage = (Client.IS_SVG) ? 'data:image/gif;base64,R0lGODlhCwALAIABAFdXV////yH5BAEAAAEALAAAAAALAAsAAAIZjB8AiKuc4jvLOGqzrjX6zmkWyChXaUJBAQA7' : IMAGE_PATH + '/edit.gif';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.zoomOutLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAilBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2N2iNAAAALXRSTlMA+vTcKMM96GRBHwXxi0YaX1HLrKWhiHpWEOnOr52Vb2xKSDcT19PKv5l/Ngdk8+viAAABJklEQVQ4y4WT2XaDMAxEvWD2nSSUNEnTJN3r//+9Sj7ILAY6L0ijC4ONYVZRpo6cByrz2YKSUGorGTpz71lPVHvT+avoB5wIkU/mxk8veceSuNoLg44IzziXjvpih72wKQnm8yc2UoiP/LAd8jQfe2Xf4Pq+2EyYIvv9wbzHHCgwxDdlBtWZOdqDfTCVgqpygQpsZaojVAVc9UjQxnAJDIBhiQv84tq3gMQCAVTxVoSibXJf8tMuc7e1TB/DCmejBNg/w1Y3c+AM5vv4w7xM59/oXamrHaLVqPQ+OTCnmMZxgz0SdL5zji0/ld6j88qGa5KIiBB6WeJGKfUKwSMKLuXgvl1TW0tm5R9UQL/efSDYsnzxD8CinhBsTTdugJatKpJwf8v+ADb8QmvW7AeAAAAAAElFTkSuQmCC';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.zoomInLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAilBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2N2iNAAAALXRSTlMA+vTcKMM96GRBHwXxi0YaX1HLrKWhiHpWEOnOr52Vb2xKSDcT19PKv5l/Ngdk8+viAAABKElEQVQ4y4WT6WKCMBCENwkBwn2oFKvWqr3L+79es4EkQIDOH2d3Pxk2ABiJlB8JCXjqw4LikHVGLHTm3nM3UeVN5690GBBN0GwyV/3kkrUQR+WeKnREeKpzaXWd77CmJiXGfPIEI4V4yQ9TIW/ntlcMBe731Vts9w5TWG8F5j3mQI4hvrKpdGeYA7CX9qAcl650gVJartxRuhyHVghF8idQAIbFLvCLu28BsQEC6aKtCK6Pyb3JT7PmbmtNH8Ny56CotD/2qOs5cJbuffxgXmCib+xddVU5RNOhkvvkhTlFehzVWCOh3++MYElOhfdovaImnRYVmqDdsuhNp1QrBBE6uGC2+3ZNjGdg5B94oD+9uyVgWT79BwAxEBTWdOu3bWBVgsn/N/AHUD9IC01Oe40AAAAASUVORK5CYII=';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.actualSizeLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAilBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////2N2iNAAAALXRSTlMA+vTcKMM96GRBHwXxi0YaX1HLrKWhiHpWEOnOr52Vb2xKSDcT19PKv5l/Ngdk8+viAAABIUlEQVQ4y4WT2XqDIBCFBxDc9yTWNEnTJN3r+79eGT4BEbXnaubMr8dBBaM450dCQp4LWFAascGIRd48eB4cNYE7f6XjgGiCFs5c+dml6CFN6j1V6IQIlHPpdV/usKcmJcV88gQTRXjLD9Mhb+fWq8YG9/uCmTCFjeeDeY85UGKIUGUuqzN42kv7oCouq9oHamlzVR1lVfpAIu1QVRiW+sAv7r4FpAYIZZVsRXB9TP5Dfpo1d1trCgzz1iiptH/sUbdz4CzN9+mLeXHn3+hdddd4RDegsrvzwZwSs2GLPRJidAqCLTlVwaMPqpYMWjTWBB2WRW86pVkhSKyDK2bdt2tmagZG4sBD/evdLQHLEvQfAOKRoLCmG1FAB6uKmby+gz+REDn7O5+EwQAAAABJRU5ErkJggg==';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.printLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAXVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9RKvvlAAAAHnRSTlMAydnl77qbMLT093H7K4Nd4Ktn082+lYt5bkklEgP44nQSAAAApUlEQVQ4y73P2Q6DIBRF0cOgbRHHzhP//5m9mBAQKjG1cT0Yc7ITAMu1LNQgUZiQ2DYoNQ0sCQb6qgHAfRx48opq3J9AZ6xuF7uOew8Ik1OsCZRS2UAC9V+D9a+QZYxNA45YFQftPtSkATOhw7dAc0vPBwKWiIOjP0JZ0yMuQJ27g36DipOUsqRAM0dR8KD1/ILHaHSE/w8DIx09E3g/BTce6rHUB5sAPKvfF+JdAAAAAElFTkSuQmCC';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.layersLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAmVBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+/v7///+bnZkkAAAAMnRSTlMABPr8ByiD88KsTi/rvJb272mjeUA1CuPe1M/KjVxYHxMP6KZ0S9nYzGRGGRaznpGIbzaGUf0AAAHESURBVDjLbZLZYoIwEEVDgLCjbKIgAlqXqt3m/z+uNwu1rcyDhjl3ktnYL7OY254C0VX3yWFZfzDrOClbbgKxi0YDHjwl4jbnRkXxJS/C1YP3DbBhD1n7Ex4uaAqdVDb3yJ/4J/3nJD2to/ngQz/DfUvzMp4JJ5sSCaF5oXmemgQDfDxzbi+Kq4sU+vNcuAmx94JtyOP2DD4Epz2asWSCz4Z/4fECxyNj9zC9xNLHcdPEO+awDKeSaUu0W4twZQiO2hYVisTR3RCtK/c1X6t4xMEpiGqXqVntEBLolkZZsKY4QtwH6jzq67dEHlJysB1aNOD3XT7n1UkasQN59L4yC2RELMDSeCRtz3yV22Ub3ozIUTknYx8JWqDdQxbUes98cR2kZtUSveF/bAhcedwEWmlxIkpZUy4XOCb6VBjjxHvbwo/1lBAHHi2JCr0NI570QhyHq/DhJoE2lLgyA4RVe6KmZ47O/3b86MCP0HWa73A8/C3SUc5Qc1ajt6fgpXJ+RGpMvDSchepZDOOQRcZVIKcK90x2D7etqtI+56+u6n3sPriO6nfphitR4+O2m3EbM7lh3me1FM1o+LMI887rN+s3/wZdTFlpNVJiOAAAAABJRU5ErkJggg==';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.closeLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAUVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////8IN+deAAAAGnRSTlMAuvAIg/dDM/QlOeuFhj0S5s4vKgzjxJRQNiLSey0AAADNSURBVDjLfZLbEoMgDEQjRRRs1XqX///QNmOHJSnjPkHOGR7IEmeoGtJZstnwjqbRfIsmgEdtPCqe9Ynz7ZSc07rE2QiSc+qv8TvjRXA2PDUm3dpe82iJhOEUfxJJo3aCv+jKmRmH4lcCjCjeh9GWOdL/GZZkXH3PYYDrHBnfc4D/RVZf5sjoC1was+Y6HQxwaUxFvq/a0Pv343VCTxfBSRiB+ab3M3eiQZXmMNBJ3Y8pGRZtYQ7DgHMXJEdPLTaN/qBjzJOBc3nmNcbsA16bMR0oLqf+AAAAAElFTkSuQmCC';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.editLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAgVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9d3yJTAAAAKnRSTlMA+hzi3nRQWyXzkm0h2j3u54gzEgSXjlYoTBgJxL2loGpAOS3Jt7Wxm35Ga7gRAAAA6UlEQVQ4y63Q2XaCMBSF4Q0JBasoQ5DJqbXjfv8HbCK2BZNwo/8FXHx7rcMC7lQu0iX8qU/qtvAWCpoqH8dYzS0SwaV5eK/UAf8X9pd2CWKzuF5Jrftp1owXwnIGLUaL3PYndOHf4kNNXWrXK/m7CHunk7K8LE6YtBpcknwG9GKxnroY+ylBXcx4xKyx/u/EuXi509cP9V7OO1oyHnzrdFTcqLG/4ibBA5pIMr/4xvKzuQDkVy9wW8SgBFD6HDvuzMvrZcC9QlkfMzI7w64m+b4PqBMNHB05lH21PVxJo2/fBXxV4hB38PcD+5AkI4FuETsAAAAASUVORK5CYII=';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.previousLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAPFBMVEUAAAD////////////////////////////////////////////////////////////////////////////YSWgTAAAAE3RSTlMA7fci493c0MW8uJ6CZks4MxQHEZL6ewAAAFZJREFUOMvdkskRgDAMA4lDwg2B7b9XOlge/KKvdsa25KFb5XlRvxXC/DNBEv8IFNjBgGdDgXtFgTyhwDXiQAUHCvwa4Uv6mR6UR+1led2mVonvl+tML45qCQNQLIx7AAAAAElFTkSuQmCC';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.nextLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAPFBMVEUAAAD////////////////////////////////////////////////////////////////////////////YSWgTAAAAE3RSTlMA7fci493c0MW8uJ6CZks4MxQHEZL6ewAAAFRJREFUOMvd0skRgCAQBVEFwQ0V7fxzNQP6wI05v6pZ/kyj1b7FNgik2gQzzLcAwiUAigHOTwDHK4A1CmB5BJANJG1hQ9qafYcqFlZP3IFc9eVGrR+iIgkDQRUXIAAAAABJRU5ErkJggg==';

/**
 * Specifies the image to be used for the refresh button.
 */
Editor.refreshLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAolBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8ELnaCAAAANXRSTlMABfyE2QKU+dfNyyDyoVYKwnTv7N+6rntsYlFNQjEqEw316uSzf2c1JB3GvqebiVw6GAjQB4DQr10AAAE7SURBVDjLvZLXcoMwEABPIgRCx3TT3A3udqL//7UgAdGRcR4yk8k+idsdmgS/QyWEqD/axS2JDV33zlnzLHIzQ2MDq9OeJ3m8l76KKENYlxrmM/b65Ys1+8YxnTEZFIEY0vVhszFWfUGZDJpQTDznTgAe5k4XhQxILB7ruzBQn+kkyDXuHfRtjoYDEvH7J9Lz98dBZXXL94X0Ofco2PFlChKbjVzEdakoSlKjoNoqPYkJ/wUZAYwc+PpLj1Ei7+jdoBWlwQZoJv2H1w3CWgRvo7dd9DP5btgwCWz0M02+oVoxCcIWeY9PNmR6B++m9prMxYEISpCBYBlfy9bc745is7UUULAem1Ww7FfalsiA2uaJsgmWP3pQI9q9/yMLkaaHAp2fxhHff/cNq7dBdHXhGW7l+Mo2zU0Cf8knJ2xA0oJ8enwAAAAASUVORK5CYII='; 

/**
 * Specifies the image to be used for the back button.
 */
Editor.backLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAclBMVEUAAAD////////////////+/v7////////////////////////////////////////////+/v7///////////////////////////////////////////////////////////////////////////////8vKLfTAAAAJXRSTlMACh7h9gby3NLIwzwZ55uVJgH57b+8tbCljYV1RRMQ46FrTzQw+vtxOQAAAJ5JREFUOMuF00cWgzAQA1DRDQFCbwFSdf8rZpdVrNH2z3tuMv7mldZQ2WN2yi8x+TT8JvyTkqvwpiKvwsOIrA1fWr+XGTklfj8dOQR+D3KyUF6QufBkJN0hfCazEv6sZBRCJDUcPasGKpu1RLtYE8lkHAPBQLoTsK/SfAyRw5FjAuhCzC2MSj0gJ+66lHatgXdKboD9tfREB5m9/+3iC9jHDYvsGNcUAAAAAElFTkSuQmCC';

/**
 * Specifies the image to be used for the back button.
 */
Editor.fullscreenLargeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAllBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AJcWoAAAAMXRSTlMA+wIFxPWPCIb446tnUxmsoIykgxTe29jQnpKBe2MNsZhVTR/KyLuWbFhEPjUq7L9z+bQj+gAAAWxJREFUOMttk4l2gkAMRTODCO4FtQgIbnWpS9v8/881iZFh8R51NO8GJ+gAjMN8zuTRFSw04cIOHQcqFHH6oaQFGxf0jeBjEgB8Y52TpW9Ag4zB5QICWOtHrgwGuFZBcw+gPP0MFS7+iiD5inOmDIQS9sZgTwUzwEzyxhxHVEEU7NdDUXsqUPtqjIgR2IZSCT4upzSeIeOdcMHnfDsx3giPoezfU6MrQGB5//SckLEG2xYscK4GfnUFqaix39zrwooaOD/cXoYuvHKQIc7pzd3HVPusp6t2FAW/RmjMonbl8vwHDeZo/GkleJC7e+p5XA/rAq1X/V10wKag04rBpa2/d0LL4OYYceOEtsG5jyMntI1wS+N1BGcQBl/CoLoPOl9ABrW/BP53e1bwSJHHlkIVchJwmHwyyfJ4kIvEnKtwkxNSEct83KSChT7WiWgDZ3ccZ0BM4tloJow2YUAtifNT3njnyD+y/pMsnP4DN3Y4yl1Gyk0AAAAASUVORK5CYII=';

/**
 * All fill styles supported by rough.js.
 */
Editor.roughFillStyles = [{val: 'auto', dispName: 'Auto'}, {val: 'hachure', dispName: 'Hachure'}, {val: 'solid', dispName: 'Solid'},
	{val: 'zigzag', dispName: 'ZigZag'}, {val: 'cross-hatch', dispName: 'Cross Hatch'}, {val: 'dots', dispName: 'Dots'},
	{val: 'dashed', dispName: 'Dashed'}, {val: 'zigzag-line', dispName: 'ZigZag Line'}];

/**
 * Graph themes for the format panel.
 */
Editor.themes = null;

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.ctrlKey = (Client.IS_MAC) ? 'Cmd' : 'Ctrl';

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.hintOffset = 20;

/**
 * Specifies if the diagram should be saved automatically if possible. Default
 * is true.
 */
Editor.popupsAllowed = true;

/**
 * Editor inherits from mxEventSource
 */
extend(Editor, EventSource);

/**
 * Stores initial state of Client.NO_FO.
 */
Editor.prototype.originalNoForeignObject = Client.NO_FO;

/**
 * Specifies the image URL to be used for the transparent background.
 */
Editor.prototype.transparentImage = (Client.IS_SVG) ? 'data:image/gif;base64,R0lGODlhMAAwAIAAAP///wAAACH5BAEAAAAALAAAAAAwADAAAAIxhI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6zvf+DwwKh8Si8egpAAA7' :
	IMAGE_PATH + '/transparent.gif';

/**
 * Specifies if the canvas should be extended in all directions. Default is true.
 */
Editor.prototype.extendCanvas = true;

/**
 * Specifies if the app should run in chromeless mode. Default is false.
 * This default is only used if the contructor argument is null.
 */
Editor.prototype.chromeless = false;

/**
 * Specifies the order of OK/Cancel buttons in dialogs. Default is true.
 * Cancel first is used on Macs, Windows/Confluence uses cancel last.
 */
Editor.prototype.cancelFirst = true;

/**
 * Specifies if the editor is enabled. Default is true.
 */
Editor.prototype.enabled = true;

/**
 * Contains the name which was used for the last save. Default value is null.
 */
Editor.prototype.filename = null;

/**
 * Contains the current modified state of the diagram. This is false for
 * new diagrams and after the diagram was saved.
 */
Editor.prototype.modified = false;

/**
 * Specifies if the diagram should be saved automatically if possible. Default
 * is true.
 */
Editor.prototype.autosave = true;

/**
 * Specifies the top spacing for the initial page view. Default is 0.
 */
Editor.prototype.initialTopSpacing = 0;

/**
 * Specifies the app name. Default is document.title.
 */
Editor.prototype.appName = document.title;

/**
 * 
 */
Editor.prototype.editBlankUrl = window.location.protocol + '//' + window.location.host + '/';

/**
 * Default value for the graph container overflow style.
 */
Editor.prototype.defaultGraphOverflow = 'hidden';

/**
 * Initializes the environment.
 */
Editor.prototype.init = function() { };

/**
 * Sets the XML node for the current diagram.
 */
Editor.prototype.isChromelessView = function()
{
	return this.chromeless;
};

/**
 * Sets the XML node for the current diagram.
 */
Editor.prototype.setAutosave = function(value)
{
	this.autosave = value;
	this.fireEvent(new EventObject('autosaveChanged'));
};

/**
 * 
 */
Editor.prototype.getEditBlankUrl = function(params)
{
	return this.editBlankUrl + params;
}

/**
 * 
 */
Editor.prototype.editAsNew = function(xml, title)
{
	let p = (title != null) ? '?title=' + encodeURIComponent(title) : '';
	
	if (urlParams['ui'] != null)
	{
		p += ((p.length > 0) ? '&' : '?') + 'ui=' + urlParams['ui'];
	}
	
	if (typeof window.postMessage !== 'undefined' )
	{
		let wnd = null;
		
		let l = ((evt) =>
		{
			if (evt.data == 'ready' && evt.source == wnd)
			{
				mxEvent.removeListener(window, 'message', l);
				wnd.postMessage(xml, '*');
			}
		});
			
		mxEvent.addListener(window, 'message', l);
		wnd = this.graph.openLink(this.getEditBlankUrl(
			p + ((p.length > 0) ? '&' : '?') +
			'client=1'), null, true);
	}
};

/**
 * Sets the XML node for the current diagram.
 */
Editor.prototype.createGraph = function(themes, model)
{
	let graph = new Graph(null, model, null, null, themes);
	graph.transparentBackground = false;
	
	// Opens all links in a new window while editing
	if (!this.chromeless)
	{
		graph.isBlankLink = function(href)
		{
			return !this.isExternalProtocol(href);
		};
	}
	
	return graph;
};

/**
 * Sets the XML node for the current diagram.
 */
Editor.prototype.resetGraph = function()
{
	this.graph.gridEnabled = !this.isChromelessView() || urlParams['grid'] == '1';
	this.graph.graphHandler.guidesEnabled = true;
	this.graph.setTooltips(true);
	this.graph.setConnectable(true);
	this.graph.foldingEnabled = true;
	this.graph.scrollbars = this.graph.defaultScrollbars;
	this.graph.pageVisible = this.graph.defaultPageVisible;
	this.graph.pageBreaksVisible = this.graph.pageVisible; 
	this.graph.preferPageSize = this.graph.pageBreaksVisible;
	this.graph.background = null;
	this.graph.pageScale = graph.prototype.pageScale;
	this.graph.pageFormat = graph.prototype.pageFormat;
	this.graph.currentScale = 1;
	this.graph.currentTranslate.x = 0;
	this.graph.currentTranslate.y = 0;
	this.updateGraphComponents();
	this.graph.view.setScale(1);
};

/**
 * Sets the XML node for the current diagram.
 */
Editor.prototype.readGraphState = function(node)
{
	this.graph.gridEnabled = node.getAttribute('grid') != '0' && (!this.isChromelessView() || urlParams['grid'] == '1');
	this.graph.gridSize = parseFloat(node.getAttribute('gridSize')) || graph.prototype.gridSize;
	this.graph.graphHandler.guidesEnabled = node.getAttribute('guides') != '0';
	this.graph.setTooltips(node.getAttribute('tooltips') != '0');
	this.graph.setConnectable(node.getAttribute('connect') != '0');
	this.graph.connectionArrowsEnabled = node.getAttribute('arrows') != '0';
	this.graph.foldingEnabled = node.getAttribute('fold') != '0';

	if (this.isChromelessView() && this.graph.foldingEnabled)
	{
		this.graph.foldingEnabled = urlParams['nav'] == '1';
		this.graph.cellRenderer.forceControlClickHandler = this.graph.foldingEnabled;
	}
	
	let ps = parseFloat(node.getAttribute('pageScale'));
	
	if (!isNaN(ps) && ps > 0)
	{
		this.graph.pageScale = ps;
	}
	else
	{
		this.graph.pageScale = graph.prototype.pageScale;
	}

	if (!this.graph.isLightboxView() && !this.graph.isViewer())
	{
		let pv = node.getAttribute('page');
	
		if (pv != null)
		{
			this.graph.pageVisible = (pv != '0');
		}
		else
		{
			this.graph.pageVisible = this.graph.defaultPageVisible;
		}
	}
	else
	{
		this.graph.pageVisible = false;
	}
	
	this.graph.pageBreaksVisible = this.graph.pageVisible; 
	this.graph.preferPageSize = this.graph.pageBreaksVisible;
	
	let pw = parseFloat(node.getAttribute('pageWidth'));
	let ph = parseFloat(node.getAttribute('pageHeight'));
	
	if (!isNaN(pw) && !isNaN(ph))
	{
		this.graph.pageFormat = new Rectangle(0, 0, pw, ph);
	}

	// Loads the persistent state settings
	let bg = node.getAttribute('background');
	
	if (bg != null && bg.length > 0)
	{
		this.graph.background = bg;
	}
	else
	{
		this.graph.background = null;
	}
};

/**
 * Sets the XML node for the current diagram.
 */
Editor.prototype.setGraphXml = function(node)
{
	if (node != null)
	{
		let dec = new Codec(node.ownerDocument);
	
		if (node.nodeName == 'mxGraphModel')
		{
			this.graph.model.beginUpdate();
			
			try
			{
				this.graph.model.clear();
				this.graph.view.scale = 1;
				this.readGraphState(node);
				this.updateGraphComponents();
				dec.decode(node, this.graph.getModel());
			}
			finally
			{
				this.graph.model.endUpdate();
			}
	
			this.fireEvent(new EventObject('resetGraphView'));
		}
		else if (node.nodeName == 'root')
		{
			this.resetGraph();
			
			// Workaround for invalid XML output in Firefox 20 due to bug in mxUtils.getXml
			let wrapper = dec.document.createElement('mxGraphModel');
			wrapper.appendChild(node);
			
			dec.decode(wrapper, this.graph.getModel());
			this.updateGraphComponents();
			this.fireEvent(new EventObject('resetGraphView'));
		}
		else
		{
			throw { 
			    message: Resources.get('cannotOpenFile'),
			    node: node,
			    toString: function() { return this.message; }
			};
		}
	}
	else
	{
		this.resetGraph();
		this.graph.model.clear();
		this.fireEvent(new EventObject('resetGraphView'));
	}
};

/**
 * Returns the XML node that represents the current diagram.
 */
Editor.prototype.getGraphXml = function(ignoreSelection)
{
	ignoreSelection = (ignoreSelection != null) ? ignoreSelection : true;
	let node = null;
	
	if (ignoreSelection)
	{
		let enc = new Codec(createXmlDocument());
		node = enc.encode(this.graph.getModel());
	}
	else
	{
		node = this.graph.encodeCells(sortCells(this.graph.model.getTopmostCells(
			this.graph.getSelectionCells())));
	}

	if (this.graph.view.translate.x != 0 || this.graph.view.translate.y != 0)
	{
		node.setAttribute('dx', Math.round(this.graph.view.translate.x * 100) / 100);
		node.setAttribute('dy', Math.round(this.graph.view.translate.y * 100) / 100);
	}
	
	node.setAttribute('grid', (this.graph.isGridEnabled()) ? '1' : '0');
	node.setAttribute('gridSize', this.graph.gridSize);
	node.setAttribute('guides', (this.graph.graphHandler.guidesEnabled) ? '1' : '0');
	node.setAttribute('tooltips', (this.graph.tooltipHandler.isEnabled()) ? '1' : '0');
	node.setAttribute('connect', (this.graph.connectionHandler.isEnabled()) ? '1' : '0');
	node.setAttribute('arrows', (this.graph.connectionArrowsEnabled) ? '1' : '0');
	node.setAttribute('fold', (this.graph.foldingEnabled) ? '1' : '0');
	node.setAttribute('page', (this.graph.pageVisible) ? '1' : '0');
	node.setAttribute('pageScale', this.graph.pageScale);
	node.setAttribute('pageWidth', this.graph.pageFormat.width);
	node.setAttribute('pageHeight', this.graph.pageFormat.height);

	if (this.graph.background != null)
	{
		node.setAttribute('background', this.graph.background);
	}
	
	return node;
};

/**
 * Keeps the graph container in sync with the persistent graph state
 */
Editor.prototype.updateGraphComponents = function()
{
	let graph = this.graph;
	
	if (graph.container != null)
	{
		graph.view.validateBackground();
		graph.container.style.overflow = (graph.scrollbars) ? 'auto' : this.defaultGraphOverflow;
		
		this.fireEvent(new EventObject('updateGraphComponents'));
	}
};

/**
 * Sets the modified flag.
 */
Editor.prototype.setModified = function(value)
{
	this.modified = value;
};

/**
 * Sets the filename.
 */
Editor.prototype.setFilename = function(value)
{
	this.filename = value;
};

/**
 * Creates and returns a new undo manager.
 */
Editor.prototype.createUndoManager = function()
{
	let graph = this.graph;
	let undoMgr = new UndoManager();

	this.undoListener = function(sender, evt)
	{
		undoMgr.undoableEditHappened(evt.getProperty('edit'));
	};
	
    // Installs the command history
	let listener = ((sender, evt) =>
	{
		this.undoListener.apply(this, arguments);
	});
	
	graph.getModel().addListener(mxEvent.UNDO, listener);
	graph.getView().addListener(mxEvent.UNDO, listener);

	// Keeps the selection in sync with the history
	let undoHandler = function(sender, evt)
	{
		let cand = graph.getSelectionCellsForChanges(evt.getProperty('edit').changes, function(change)
		{
			// Only selects changes to the cell hierarchy
			return !(change instanceof ChildChange);
		});
		
		if (cand.length > 0)
		{
			let model = graph.getModel();
			let cells = [];
			
			for (let i = 0; i < cand.length; i++)
			{
				if (graph.view.getState(cand[i]) != null)
				{
					cells.push(cand[i]);
				}
			}
			
			graph.setSelectionCells(cells);
		}
	};
	
	undoMgr.addListener(mxEvent.UNDO, undoHandler);
	undoMgr.addListener(mxEvent.REDO, undoHandler);

	return undoMgr;
};

/**
 * Adds basic stencil set (no namespace).
 */
Editor.prototype.initStencilRegistry = function() { };

/**
 * Creates and returns a new undo manager.
 */
Editor.prototype.destroy = function()
{
	if (this.graph != null)
	{
		this.graph.destroy();
		this.graph = null;
	}
};

/**
 * Class for asynchronously opening a new window and loading a file at the same
 * time. This acts as a bridge between the open dialog and the new editor.
 */
OpenFile = function(done)
{
	this.producer = null;
	this.consumer = null;
	this.done = done;
	this.args = null;
};

/**
 * Registers the editor from the new window.
 */
OpenFile.prototype.setConsumer = function(value)
{
	this.consumer = value;
	this.execute();
};

/**
 * Sets the data from the loaded file.
 */
OpenFile.prototype.setData = function()
{
	this.args = arguments;
	this.execute();
};

/**
 * Displays an error message.
 */
OpenFile.prototype.error = function(msg)
{
	this.cancel(true);
	alert(msg);
};

/**
 * Consumes the data.
 */
OpenFile.prototype.execute = function()
{
	if (this.consumer != null && this.args != null)
	{
		this.cancel(false);
		this.consumer.apply(this, this.args);
	}
};

/**
 * Cancels the operation.
 */
OpenFile.prototype.cancel = function(cancel)
{
	if (this.done != null)
	{
		this.done((cancel != null) ? cancel : true);
	}
};

/**
 * Basic dialogs that are available in the viewer (print dialog).
 */
function Dialog(editorUi, elt, w, h, modal, closable, onClose, noScroll, transparent, onResize, ignoreBgClick)
{
	let dx = 0;
	
	w += dx;
	h += dx;
	
	var w0 = w;
	var h0 = h;
	
	let ds = getDocumentSize();
	
	// Workaround for print dialog offset in viewer lightbox
	if (window.innerHeight != null)
	{
		ds.height = window.innerHeight;
	}
	
	let dh = ds.height;
	let left = Math.max(1, Math.round((ds.width - w - 64) / 2));
	let top = Math.max(1, Math.round((dh - h - editorUi.footerHeight) / 3));
	elt.style.maxHeight = '100%';

	w = (document.body != null) ? Math.min(w, document.body.scrollWidth - 64) : w;
	h = Math.min(h, dh - 64);
	
	// Increments zIndex to put subdialogs and background over existing dialogs and background
	if (editorUi.dialogs.length > 0)
	{
		this.zIndex += editorUi.dialogs.length * 2;
	}

	if (this.bg == null)
	{
		this.bg = editorUi.createDiv('background');
		this.bg.style.position = 'absolute';
		this.bg.style.background = Dialog.backdropColor;
		this.bg.style.height = dh + 'px';
		this.bg.style.right = '0px';
		this.bg.style.zIndex = this.zIndex - 2;
		
		setOpacity(this.bg, this.bgOpacity);
	}
	
	let origin = getDocumentScrollOrigin(document);
	this.bg.style.left = origin.x + 'px';
	this.bg.style.top = origin.y + 'px';
	left += origin.x;
	top += origin.y;

	if (modal)
	{
		document.body.appendChild(this.bg);
	}
	
	let div = editorUi.createDiv(transparent? 'geTransDialog' : 'geDialog');
	let pos = this.getPosition(left, top, w, h);
	left = pos.x;
	top = pos.y;
	
	div.style.width = w + 'px';
	div.style.height = h + 'px';
	div.style.left = left + 'px';
	div.style.top = top + 'px';
	div.style.zIndex = this.zIndex;
	
	div.appendChild(elt);
	document.body.appendChild(div);
	
	// Adds vertical scrollbars if needed
	if (!noScroll && elt.clientHeight > div.clientHeight - 64)
	{
		elt.style.overflowY = 'auto';
	}
	
	if (closable)
	{
		let img = document.createElement('img');

		img.setAttribute('src', Dialog.prototype.closeImage);
		img.setAttribute('title', Resources.get('close'));
		img.className = 'geDialogClose';
		img.style.top = (top + 14) + 'px';
		img.style.left = (left + w + 38 - dx) + 'px';
		img.style.zIndex = this.zIndex;
		
		mxEvent.addListener(img, 'click', (() =>
		{
			editorUi.hideDialog(true);
		}));
		
		document.body.appendChild(img);
		this.dialogImg = img;
		
		if (!ignoreBgClick)
		{
			let mouseDownSeen = false;
			
			mxEvent.addGestureListeners(this.bg, ((evt) =>
			{
				mouseDownSeen = true;
			}), null, ((evt) =>
			{
				if (mouseDownSeen)
				{
					editorUi.hideDialog(true);
					mouseDownSeen = false;
				}
			}));
		}
	}
	
	this.resizeListener = (() =>
	{
		if (onResize != null)
		{
			let newWH = onResize();
			
			if (newWH != null)
			{
				w0 = w = newWH.w;
				h0 = h = newWH.h;
			}
		}
		
		let ds = getDocumentSize();
		dh = ds.height;
		this.bg.style.height = dh + 'px';
		
		left = Math.max(1, Math.round((ds.width - w - 64) / 2));
		top = Math.max(1, Math.round((dh - h - editorUi.footerHeight) / 3));
		w = (document.body != null) ? Math.min(w0, document.body.scrollWidth - 64) : w0;
		h = Math.min(h0, dh - 64);
		
		let pos = this.getPosition(left, top, w, h);
		left = pos.x;
		top = pos.y;
		
		div.style.left = left + 'px';
		div.style.top = top + 'px';
		div.style.width = w + 'px';
		div.style.height = h + 'px';
		
		// Adds vertical scrollbars if needed
		if (!noScroll && elt.clientHeight > div.clientHeight - 64)
		{
			elt.style.overflowY = 'auto';
		}
		
		if (this.dialogImg != null)
		{
			this.dialogImg.style.top = (top + 14) + 'px';
			this.dialogImg.style.left = (left + w + 38 - dx) + 'px';
		}
	});
	
	mxEvent.addListener(window, 'resize', this.resizeListener);

	this.onDialogClose = onClose;
	this.container = div;
	
	editorUi.editor.fireEvent(new EventObject('showDialog'));
};

/**
 * 
 */
Dialog.backdropColor = 'white';

/**
 * 
 */
Dialog.prototype.zIndex = mxPopupMenu.prototype.zIndex - 1;

/**
 * 
 */
Dialog.prototype.noColorImage = (!Client.IS_SVG) ? IMAGE_PATH + '/nocolor.png' : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkEzRDlBMUUwODYxMTExRTFCMzA4RDdDMjJBMEMxRDM3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkEzRDlBMUUxODYxMTExRTFCMzA4RDdDMjJBMEMxRDM3Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QTNEOUExREU4NjExMTFFMUIzMDhEN0MyMkEwQzFEMzciIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QTNEOUExREY4NjExMTFFMUIzMDhEN0MyMkEwQzFEMzciLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5xh3fmAAAABlBMVEX////MzMw46qqDAAAAGElEQVR42mJggAJGKGAYIIGBth8KAAIMAEUQAIElnLuQAAAAAElFTkSuQmCC';

/**
 * 
 */
Dialog.prototype.closeImage = (!Client.IS_SVG) ? IMAGE_PATH + '/close.png' : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJAQMAAADaX5RTAAAABlBMVEV7mr3///+wksspAAAAAnRSTlP/AOW3MEoAAAAdSURBVAgdY9jXwCDDwNDRwHCwgeExmASygSL7GgB12QiqNHZZIwAAAABJRU5ErkJggg==';

/**
 * 
 */
Dialog.prototype.clearImage = (!Client.IS_SVG) ? IMAGE_PATH + '/clear.gif' : 'data:image/gif;base64,R0lGODlhDQAKAIABAMDAwP///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OUIzOEM1NzI4NjEyMTFFMUEzMkNDMUE3NjZERDE2QjIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OUIzOEM1NzM4NjEyMTFFMUEzMkNDMUE3NjZERDE2QjIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5QjM4QzU3MDg2MTIxMUUxQTMyQ0MxQTc2NkREMTZCMiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo5QjM4QzU3MTg2MTIxMUUxQTMyQ0MxQTc2NkREMTZCMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEAACH5BAEAAAEALAAAAAANAAoAAAIXTGCJebD9jEOTqRlttXdrB32PJ2ncyRQAOw==';

/**
 * 
 */
Dialog.prototype.lockedImage = (!Client.IS_SVG) ? IMAGE_PATH + '/locked.png' : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzdDMDZCODExNzIxMTFFNUI0RTk5NTg4OTcyMUUyODEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzdDMDZCODIxNzIxMTFFNUI0RTk5NTg4OTcyMUUyODEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozN0MwNkI3RjE3MjExMUU1QjRFOTk1ODg5NzIxRTI4MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozN0MwNkI4MDE3MjExMUU1QjRFOTk1ODg5NzIxRTI4MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PvqMCFYAAAAVUExURZmZmb+/v7KysqysrMzMzLGxsf///4g8N1cAAAAHdFJOU////////wAaSwNGAAAAPElEQVR42lTMQQ4AIQgEwUa0//9kTQirOweYOgDqAMbZUr10AGlAwx4/BJ2QJ4U0L5brYjovvpv32xZgAHZaATFtMbu4AAAAAElFTkSuQmCC';

/**
 * 
 */
Dialog.prototype.unlockedImage = (!Client.IS_SVG) ? IMAGE_PATH + '/unlocked.png' : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzdDMDZCN0QxNzIxMTFFNUI0RTk5NTg4OTcyMUUyODEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzdDMDZCN0UxNzIxMTFFNUI0RTk5NTg4OTcyMUUyODEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozN0MwNkI3QjE3MjExMUU1QjRFOTk1ODg5NzIxRTI4MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozN0MwNkI3QzE3MjExMUU1QjRFOTk1ODg5NzIxRTI4MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkKMpVwAAAAYUExURZmZmbKysr+/v6ysrOXl5czMzLGxsf///zHN5lwAAAAIdFJOU/////////8A3oO9WQAAADxJREFUeNpUzFESACAEBNBVsfe/cZJU+8Mzs8CIABCidtfGOndnYsT40HDSiCcbPdoJo10o9aI677cpwACRoAF3dFNlswAAAABJRU5ErkJggg==';

/**
 * Removes the dialog from the DOM.
 */
Dialog.prototype.bgOpacity = 80;

/**
 * Removes the dialog from the DOM.
 */
Dialog.prototype.getPosition = function(left, top)
{
	return new Point(left, top);
};

/**
 * Removes the dialog from the DOM.
 */
Dialog.prototype.close = function(cancel, isEsc)
{
	if (this.onDialogClose != null)
	{
		if (this.onDialogClose(cancel, isEsc) == false)
		{
			return false;
		}
		
		this.onDialogClose = null;
	}
	
	if (this.dialogImg != null)
	{
		this.dialogImg.parentNode.removeChild(this.dialogImg);
		this.dialogImg = null;
	}
	
	if (this.bg != null && this.bg.parentNode != null)
	{
		this.bg.parentNode.removeChild(this.bg);
	}
	
	mxEvent.removeListener(window, 'resize', this.resizeListener);
	this.container.parentNode.removeChild(this.container);
};

/**
 * 
 */
let ErrorDialog = function(editorUi, title, message, buttonText, fn, retry, buttonText2, fn2, hide, buttonText3, fn3)
{
	hide = (hide != null) ? hide : true;
	
	let div = document.createElement('div');
	div.style.textAlign = 'center';

	if (title != null)
	{
		let hd = document.createElement('div');
		hd.style.padding = '0px';
		hd.style.margin = '0px';
		hd.style.fontSize = '18px';
		hd.style.paddingBottom = '16px';
		hd.style.marginBottom = '10px';
		hd.style.borderBottom = '1px solid #c0c0c0';
		hd.style.color = 'gray';
		hd.style.whiteSpace = 'nowrap';
		hd.style.textOverflow = 'ellipsis';
		hd.style.overflow = 'hidden';
		write(hd, title);
		hd.setAttribute('title', title);
		div.appendChild(hd);
	}

	var p2 = document.createElement('div');
	p2.style.lineHeight = '1.2em';
	p2.style.padding = '6px';
	p2.innerHTML = message;
	div.appendChild(p2);
	
	let btns = document.createElement('div');
	btns.style.marginTop = '12px';
	btns.style.textAlign = 'center';
	
	if (retry != null)
	{
		let retryBtn = button(Resources.get('tryAgain'), function()
		{
			editorUi.hideDialog();
			retry();
		});
		retryBtn.className = 'geBtn';
		btns.appendChild(retryBtn);
		
		btns.style.textAlign = 'center';
	}
	
	if (buttonText3 != null)
	{
		var btn3 = button(buttonText3, function()
		{
			if (fn3 != null)
			{
				fn3();
			}
		});
		
		btn3.className = 'geBtn';
		btns.appendChild(btn3);
	}
	
	let btn = button(buttonText, function()
	{
		if (hide)
		{
			editorUi.hideDialog();
		}
		
		if (fn != null)
		{
			fn();
		}
	});
	
	btn.className = 'geBtn';
	btns.appendChild(btn);

	if (buttonText2 != null)
	{
		let mainBtn = button(buttonText2, function()
		{
			if (hide)
			{
				editorUi.hideDialog();
			}
			
			if (fn2 != null)
			{
				fn2();
			}
		});
		
		mainBtn.className = 'geBtn gePrimaryBtn';
		btns.appendChild(mainBtn);
	}

	this.init = function()
	{
		btn.focus();
	};
	
	div.appendChild(btns);

	this.container = div;
};

/**
 * Constructs a new print dialog.
 */
let PrintDialog = function(editorUi, title)
{
	this.create(editorUi, title);
};

/**
 * Constructs a new print dialog.
 */
PrintDialog.prototype.create = function(editorUi)
{
	let graph = editorUi.editor.graph;
	var row, td;
	
	let table = document.createElement('table');
	table.style.width = '100%';
	table.style.height = '100%';
	let tbody = document.createElement('tbody');
	
	row = document.createElement('tr');
	
	let onePageCheckBox = document.createElement('input');
	onePageCheckBox.setAttribute('type', 'checkbox');
	td = document.createElement('td');
	td.setAttribute('colspan', '2');
	td.style.fontSize = '10pt';
	td.appendChild(onePageCheckBox);
	
	let span = document.createElement('span');
	write(span, ' ' + Resources.get('fitPage'));
	td.appendChild(span);
	
	mxEvent.addListener(span, 'click', function(evt)
	{
		onePageCheckBox.checked = !onePageCheckBox.checked;
		pageCountCheckBox.checked = !onePageCheckBox.checked;
		mxEvent.consume(evt);
	});
	
	mxEvent.addListener(onePageCheckBox, 'change', function()
	{
		pageCountCheckBox.checked = !onePageCheckBox.checked;
	});
	
	row.appendChild(td);
	tbody.appendChild(row);

	row = row.cloneNode(false);
	
	let pageCountCheckBox = document.createElement('input');
	pageCountCheckBox.setAttribute('type', 'checkbox');
	td = document.createElement('td');
	td.style.fontSize = '10pt';
	td.appendChild(pageCountCheckBox);
	
	let span = document.createElement('span');
	write(span, ' ' + Resources.get('posterPrint') + ':');
	td.appendChild(span);
	
	mxEvent.addListener(span, 'click', function(evt)
	{
		pageCountCheckBox.checked = !pageCountCheckBox.checked;
		onePageCheckBox.checked = !pageCountCheckBox.checked;
		mxEvent.consume(evt);
	});
	
	row.appendChild(td);
	
	let pageCountInput = document.createElement('input');
	pageCountInput.setAttribute('value', '1');
	pageCountInput.setAttribute('type', 'number');
	pageCountInput.setAttribute('min', '1');
	pageCountInput.setAttribute('size', '4');
	pageCountInput.setAttribute('disabled', 'disabled');
	pageCountInput.style.width = '50px';

	td = document.createElement('td');
	td.style.fontSize = '10pt';
	td.appendChild(pageCountInput);
	write(td, ' ' + Resources.get('pages') + ' (max)');
	row.appendChild(td);
	tbody.appendChild(row);

	mxEvent.addListener(pageCountCheckBox, 'change', function()
	{
		if (pageCountCheckBox.checked)
		{
			pageCountInput.removeAttribute('disabled');
		}
		else
		{
			pageCountInput.setAttribute('disabled', 'disabled');
		}

		onePageCheckBox.checked = !pageCountCheckBox.checked;
	});

	row = row.cloneNode(false);
	
	td = document.createElement('td');
	write(td, Resources.get('pageScale') + ':');
	row.appendChild(td);
	
	td = document.createElement('td');
	let pageScaleInput = document.createElement('input');
	pageScaleInput.setAttribute('value', '100 %');
	pageScaleInput.setAttribute('size', '5');
	pageScaleInput.style.width = '50px';
	
	td.appendChild(pageScaleInput);
	row.appendChild(td);
	tbody.appendChild(row);
	
	row = document.createElement('tr');
	td = document.createElement('td');
	td.colSpan = 2;
	td.style.paddingTop = '20px';
	td.setAttribute('align', 'right');
	
	// Overall scale for print-out to account for print borders in dialogs etc
	function preview(print)
	{
		let autoOrigin = onePageCheckBox.checked || pageCountCheckBox.checked;
		let printScale = parseInt(pageScaleInput.value) / 100;
		
		if (isNaN(printScale))
		{
			printScale = 1;
			pageScaleInput.value = '100%';
		}
		
		// Workaround to match available paper size in actual print output
		printScale *= 0.75;

		let pf = graph.pageFormat || mxConstants.PAGE_FORMAT_A4_PORTRAIT;
		let scale = 1 / graph.pageScale;
		
		if (autoOrigin)
		{
    		let pageCount = (onePageCheckBox.checked) ? 1 : parseInt(pageCountInput.value);
			
			if (!isNaN(pageCount))
			{
				scale = getScaleForPageCount(pageCount, graph, pf);
			}
		}

		// Negative coordinates are cropped or shifted if page visible
		let gb = graph.getGraphBounds();
		let border = 0;
		var x0 = 0;
		var y0 = 0;

		// Applies print scale
		pf = Rectangle.fromRectangle(pf);
		pf.width = Math.ceil(pf.width * printScale);
		pf.height = Math.ceil(pf.height * printScale);
		scale *= printScale;
		
		// Starts at first visible page
		if (!autoOrigin && graph.pageVisible)
		{
			let layout = graph.getPageLayout();
			x0 -= layout.x * pf.width;
			y0 -= layout.y * pf.height;
		}
		else
		{
			autoOrigin = true;
		}
		
		let preview = PrintDialog.createPrintPreview(graph, scale, pf, border, x0, y0, autoOrigin);
		preview.open();
	
		if (print)
		{
			PrintDialog.printPreview(preview);
		}
	};
	
	let cancelBtn = button(Resources.get('cancel'), function()
	{
		editorUi.hideDialog();
	});
	cancelBtn.className = 'geBtn';
	
	if (editorUi.editor.cancelFirst)
	{
		td.appendChild(cancelBtn);
	}

	if (PrintDialog.previewEnabled)
	{
		let previewBtn = button(Resources.get('preview'), function()
		{
			editorUi.hideDialog();
			preview(false);
		});
		previewBtn.className = 'geBtn';
		td.appendChild(previewBtn);
	}
	
	let printBtn = button(Resources.get((!PrintDialog.previewEnabled) ? 'ok' : 'print'), function()
	{
		editorUi.hideDialog();
		preview(true);
	});
	printBtn.className = 'geBtn gePrimaryBtn';
	td.appendChild(printBtn);
	
	if (!editorUi.editor.cancelFirst)
	{
		td.appendChild(cancelBtn);
	}

	row.appendChild(td);
	tbody.appendChild(row);
	
	table.appendChild(tbody);
	this.container = table;
};

/**
 * Constructs a new print dialog.
 */
PrintDialog.printPreview = function(preview)
{
	try
	{
		if (preview.wnd != null)
		{
			let printFn = function()
			{
				preview.wnd.focus();
				preview.wnd.print();
				preview.wnd.close();
			};
			
			// Workaround for Google Chrome which needs a bit of a
			// delay in order to render the SVG contents
			// Needs testing in production
			if (Client.IS_GC)
			{
				window.setTimeout(printFn, 500);
			}
			else
			{
				printFn();
			}
		}
	}
	catch (e)
	{
		// ignores possible Access Denied
	}
};

/**
 * Constructs a new print dialog.
 */
PrintDialog.createPrintPreview = function(graph, scale, pf, border, x0, y0, autoOrigin)
{
	let preview = new PrintPreview(graph, scale, pf, border, x0, y0);
	preview.title = Resources.get('preview');
	preview.printBackgroundImage = true;
	preview.autoOrigin = autoOrigin;
	let bg = graph.background;
	
	if (bg == null || bg == '' || bg == mxConstants.NONE)
	{
		bg = '#ffffff';
	}
	
	preview.backgroundColor = bg;
	
	let writeHead = preview.writeHead;
	
	// Adds a border in the preview
	preview.writeHead = function(doc)
	{
		writeHead.apply(this, arguments);
		
		doc.writeln('<style type="text/css">');
		doc.writeln('@media screen {');
		doc.writeln('  body > div { padding:30px;box-sizing:content-box; }');
		doc.writeln('}');
		doc.writeln('</style>');
	};
	
	return preview;
};

/**
 * Specifies if the preview button should be enabled. Default is true.
 */
PrintDialog.previewEnabled = true;

/**
 * Constructs a new page setup dialog.
 */
let PageSetupDialog = function(editorUi)
{
	let graph = editorUi.editor.graph;
	var row, td;

	let table = document.createElement('table');
	table.style.width = '100%';
	table.style.height = '100%';
	let tbody = document.createElement('tbody');
	
	row = document.createElement('tr');
	
	td = document.createElement('td');
	td.style.verticalAlign = 'top';
	td.style.fontSize = '10pt';
	write(td, Resources.get('paperSize') + ':');
	
	row.appendChild(td);
	
	td = document.createElement('td');
	td.style.verticalAlign = 'top';
	td.style.fontSize = '10pt';
	
	let accessor = PageSetupDialog.addPageFormatPanel(td, 'pagesetupdialog', graph.pageFormat);

	row.appendChild(td);
	tbody.appendChild(row);
	
	row = document.createElement('tr');
	
	td = document.createElement('td');
	write(td, Resources.get('background') + ':');
	
	row.appendChild(td);
	
	td = document.createElement('td');
	td.style.whiteSpace = 'nowrap';
	
	let backgroundInput = document.createElement('input');
	backgroundInput.setAttribute('type', 'text');
	let backgroundButton = document.createElement('button');
	
	backgroundButton.style.width = '18px';
	backgroundButton.style.height = '18px';
	backgroundButton.style.marginRight = '20px';
	backgroundButton.style.backgroundPosition = 'center center';
	backgroundButton.style.backgroundRepeat = 'no-repeat';
	
	let newBackgroundColor = graph.background;
	
	function updateBackgroundColor()
	{
		if (newBackgroundColor == null || newBackgroundColor == mxConstants.NONE)
		{
			backgroundButton.style.backgroundColor = '';
			backgroundButton.style.backgroundImage = 'url(\'' + Dialog.prototype.noColorImage + '\')';
		}
		else
		{
			backgroundButton.style.backgroundColor = newBackgroundColor;
			backgroundButton.style.backgroundImage = '';
		}
	};
	
	updateBackgroundColor();

	mxEvent.addListener(backgroundButton, 'click', function(evt)
	{
		editorUi.pickColor(newBackgroundColor || 'none', function(color)
		{
			newBackgroundColor = color;
			updateBackgroundColor();
		});
		mxEvent.consume(evt);
	});
	
	td.appendChild(backgroundButton);
	
	write(td, Resources.get('gridSize') + ':');
	
	let gridSizeInput = document.createElement('input');
	gridSizeInput.setAttribute('type', 'number');
	gridSizeInput.setAttribute('min', '0');
	gridSizeInput.style.width = '40px';
	gridSizeInput.style.marginLeft = '6px';
	
	gridSizeInput.value = graph.getGridSize();
	td.appendChild(gridSizeInput);
	
	mxEvent.addListener(gridSizeInput, 'change', function()
	{
		let value = parseInt(gridSizeInput.value);
		gridSizeInput.value = Math.max(1, (isNaN(value)) ? graph.getGridSize() : value);
	});
	
	row.appendChild(td);
	tbody.appendChild(row);
	
	row = document.createElement('tr');
	td = document.createElement('td');
	
	write(td, Resources.get('image') + ':');
	
	row.appendChild(td);
	td = document.createElement('td');
	
	let changeImageLink = document.createElement('a');
	changeImageLink.style.textDecoration = 'underline';
	changeImageLink.style.cursor = 'pointer';
	changeImageLink.style.color = '#a0a0a0';
	
	let newBackgroundImage = graph.backgroundImage;
	
	function updateBackgroundImage()
	{
		if (newBackgroundImage == null)
		{
			changeImageLink.removeAttribute('title');
			changeImageLink.style.fontSize = '';
			changeImageLink.innerHTML = htmlEntities(Resources.get('change')) + '...';
		}
		else
		{
			changeImageLink.setAttribute('title', newBackgroundImage.src);
			changeImageLink.style.fontSize = '11px';
			changeImageLink.innerHTML = htmlEntities(newBackgroundImage.src.substring(0, 42)) + '...';
		}
	};
	
	mxEvent.addListener(changeImageLink, 'click', function(evt)
	{
		editorUi.showBackgroundImageDialog(function(image, failed)
		{
			if (!failed)
			{
				newBackgroundImage = image;
				updateBackgroundImage();
			}
		}, newBackgroundImage);
		
		mxEvent.consume(evt);
	});
	
	updateBackgroundImage();

	td.appendChild(changeImageLink);
	
	row.appendChild(td);
	tbody.appendChild(row);
	
	row = document.createElement('tr');
	td = document.createElement('td');
	td.colSpan = 2;
	td.style.paddingTop = '16px';
	td.setAttribute('align', 'right');

	let cancelBtn = button(Resources.get('cancel'), function()
	{
		editorUi.hideDialog();
	});
	cancelBtn.className = 'geBtn';
	
	if (editorUi.editor.cancelFirst)
	{
		td.appendChild(cancelBtn);
	}
	
	let applyBtn = button(Resources.get('apply'), function()
	{
		editorUi.hideDialog();
		let gridSize = parseInt(gridSizeInput.value);
		
		if (!isNaN(gridSize) && graph.gridSize !== gridSize)
		{
			graph.setGridSize(gridSize);
		}

		let change = new ChangePageSetup(editorUi, newBackgroundColor,
			newBackgroundImage, accessor.get());
		change.ignoreColor = graph.background == newBackgroundColor;
		
		let oldSrc = (graph.backgroundImage != null) ? graph.backgroundImage.src : null;
		let newSrc = (newBackgroundImage != null) ? newBackgroundImage.src : null;
		
		change.ignoreImage = oldSrc === newSrc;

		if (graph.pageFormat.width != change.previousFormat.width ||
			graph.pageFormat.height != change.previousFormat.height ||
			!change.ignoreColor || !change.ignoreImage)
		{
			graph.model.execute(change);
		}
	});
	applyBtn.className = 'geBtn gePrimaryBtn';
	td.appendChild(applyBtn);

	if (!editorUi.editor.cancelFirst)
	{
		td.appendChild(cancelBtn);
	}
	
	row.appendChild(td);
	tbody.appendChild(row);
	
	table.appendChild(tbody);
	this.container = table;
};

/**
 * 
 */
PageSetupDialog.addPageFormatPanel = function(div, namePostfix, pageFormat, pageFormatListener)
{
	let formatName = 'format-' + namePostfix;
	
	let portraitCheckBox = document.createElement('input');
	portraitCheckBox.setAttribute('name', formatName);
	portraitCheckBox.setAttribute('type', 'radio');
	portraitCheckBox.setAttribute('value', 'portrait');
	
	let landscapeCheckBox = document.createElement('input');
	landscapeCheckBox.setAttribute('name', formatName);
	landscapeCheckBox.setAttribute('type', 'radio');
	landscapeCheckBox.setAttribute('value', 'landscape');
	
	let paperSizeSelect = document.createElement('select');
	paperSizeSelect.style.marginBottom = '8px';
	paperSizeSelect.style.width = '202px';

	let formatDiv = document.createElement('div');
	formatDiv.style.marginLeft = '4px';
	formatDiv.style.width = '210px';
	formatDiv.style.height = '24px';

	portraitCheckBox.style.marginRight = '6px';
	formatDiv.appendChild(portraitCheckBox);
	
	let portraitSpan = document.createElement('span');
	portraitSpan.style.maxWidth = '100px';
	write(portraitSpan, Resources.get('portrait'));
	formatDiv.appendChild(portraitSpan);

	landscapeCheckBox.style.marginLeft = '10px';
	landscapeCheckBox.style.marginRight = '6px';
	formatDiv.appendChild(landscapeCheckBox);
	
	let landscapeSpan = document.createElement('span');
	landscapeSpan.style.width = '100px';
	write(landscapeSpan, Resources.get('landscape'));
	formatDiv.appendChild(landscapeSpan)

	let customDiv = document.createElement('div');
	customDiv.style.marginLeft = '4px';
	customDiv.style.width = '210px';
	customDiv.style.height = '24px';
	
	let widthInput = document.createElement('input');
	widthInput.setAttribute('size', '7');
	widthInput.style.textAlign = 'right';
	customDiv.appendChild(widthInput);
	write(customDiv, ' in x ');
	
	let heightInput = document.createElement('input');
	heightInput.setAttribute('size', '7');
	heightInput.style.textAlign = 'right';
	customDiv.appendChild(heightInput);
	write(customDiv, ' in');

	formatDiv.style.display = 'none';
	customDiv.style.display = 'none';
	
	let pf = {};
	let formats = PageSetupDialog.getFormats();
	
	for (let i = 0; i < formats.length; i++)
	{
		let f = formats[i];
		pf[f.key] = f;

		let paperSizeOption = document.createElement('option');
		paperSizeOption.setAttribute('value', f.key);
		write(paperSizeOption, f.title);
		paperSizeSelect.appendChild(paperSizeOption);
	}
	
	let customSize = false;
	
	function listener(sender, evt, force)
	{
		if (force || (widthInput != document.activeElement && heightInput != document.activeElement))
		{
			let detected = false;
			
			for (let i = 0; i < formats.length; i++)
			{
				let f = formats[i];
	
				// Special case where custom was chosen
				if (customSize)
				{
					if (f.key == 'custom')
					{
						paperSizeSelect.value = f.key;
						customSize = false;
					}
				}
				else if (f.format != null)
				{
					// Fixes wrong values for previous A4 and A5 page sizes
					if (f.key == 'a4')
					{
						if (pageFormat.width == 826)
						{
							pageFormat = Rectangle.fromRectangle(pageFormat);
							pageFormat.width = 827;
						}
						else if (pageFormat.height == 826)
						{
							pageFormat = Rectangle.fromRectangle(pageFormat);
							pageFormat.height = 827;
						}
					}
					else if (f.key == 'a5')
					{
						if (pageFormat.width == 584)
						{
							pageFormat = Rectangle.fromRectangle(pageFormat);
							pageFormat.width = 583;
						}
						else if (pageFormat.height == 584)
						{
							pageFormat = Rectangle.fromRectangle(pageFormat);
							pageFormat.height = 583;
						}
					}
					
					if (pageFormat.width == f.format.width && pageFormat.height == f.format.height)
					{
						paperSizeSelect.value = f.key;
						portraitCheckBox.setAttribute('checked', 'checked');
						portraitCheckBox.defaultChecked = true;
						portraitCheckBox.checked = true;
						landscapeCheckBox.removeAttribute('checked');
						landscapeCheckBox.defaultChecked = false;
						landscapeCheckBox.checked = false;
						detected = true;
					}
					else if (pageFormat.width == f.format.height && pageFormat.height == f.format.width)
					{
						paperSizeSelect.value = f.key;
						portraitCheckBox.removeAttribute('checked');
						portraitCheckBox.defaultChecked = false;
						portraitCheckBox.checked = false;
						landscapeCheckBox.setAttribute('checked', 'checked');
						landscapeCheckBox.defaultChecked = true;
						landscapeCheckBox.checked = true;
						detected = true;
					}
				}
			}
			
			// Selects custom format which is last in list
			if (!detected)
			{
				widthInput.value = pageFormat.width / 100;
				heightInput.value = pageFormat.height / 100;
				portraitCheckBox.setAttribute('checked', 'checked');
				paperSizeSelect.value = 'custom';
				formatDiv.style.display = 'none';
				customDiv.style.display = '';
			}
			else
			{
				formatDiv.style.display = '';
				customDiv.style.display = 'none';
			}
		}
	};
	
	listener();

	div.appendChild(paperSizeSelect);
	br(div);

	div.appendChild(formatDiv);
	div.appendChild(customDiv);
	
	let currentPageFormat = pageFormat;
	
	let update = function(evt, selectChanged)
	{
		let f = pf[paperSizeSelect.value];
		
		if (f.format != null)
		{
			widthInput.value = f.format.width / 100;
			heightInput.value = f.format.height / 100;
			customDiv.style.display = 'none';
			formatDiv.style.display = '';
		}
		else
		{
			formatDiv.style.display = 'none';
			customDiv.style.display = '';
		}
		
		let wi = parseFloat(widthInput.value);
		
		if (isNaN(wi) || wi <= 0)
		{
			widthInput.value = pageFormat.width / 100;
		}
		
		let hi = parseFloat(heightInput.value);
		
		if (isNaN(hi) || hi <= 0)
		{
			heightInput.value = pageFormat.height / 100;
		}
		
		let newPageFormat = new Rectangle(0, 0,
			Math.floor(parseFloat(widthInput.value) * 100),
			Math.floor(parseFloat(heightInput.value) * 100));
		
		if (paperSizeSelect.value != 'custom' && landscapeCheckBox.checked)
		{
			newPageFormat = new Rectangle(0, 0, newPageFormat.height, newPageFormat.width);
		}
		
		// Initial select of custom should not update page format to avoid update of combo
		if ((!selectChanged || !customSize) && (newPageFormat.width != currentPageFormat.width ||
			newPageFormat.height != currentPageFormat.height))
		{
			currentPageFormat = newPageFormat;
			
			// Updates page format and reloads format panel
			if (pageFormatListener != null)
			{
				pageFormatListener(currentPageFormat);
			}
		}
	};

	mxEvent.addListener(portraitSpan, 'click', function(evt)
	{
		portraitCheckBox.checked = true;
		update(evt);
		mxEvent.consume(evt);
	});
	
	mxEvent.addListener(landscapeSpan, 'click', function(evt)
	{
		landscapeCheckBox.checked = true;
		update(evt);
		mxEvent.consume(evt);
	});
	
	mxEvent.addListener(widthInput, 'blur', update);
	mxEvent.addListener(widthInput, 'click', update);
	mxEvent.addListener(heightInput, 'blur', update);
	mxEvent.addListener(heightInput, 'click', update);
	mxEvent.addListener(landscapeCheckBox, 'change', update);
	mxEvent.addListener(portraitCheckBox, 'change', update);
	mxEvent.addListener(paperSizeSelect, 'change', function(evt)
	{
		// Handles special case where custom was chosen
		customSize = paperSizeSelect.value == 'custom';
		update(evt, true);
	});
	
	update();
	
	return {set: function(value)
	{
		pageFormat = value;
		listener(null, null, true);
	},get: function()
	{
		return currentPageFormat;
	}, widthInput: widthInput,
	heightInput: heightInput};
};

/**
 * 
 */
PageSetupDialog.getFormats = function()
{
	return [{key: 'letter', title: 'US-Letter (8,5" x 11")', format: mxConstants.PAGE_FORMAT_LETTER_PORTRAIT},
	        {key: 'legal', title: 'US-Legal (8,5" x 14")', format: new Rectangle(0, 0, 850, 1400)},
	        {key: 'tabloid', title: 'US-Tabloid (11" x 17")', format: new Rectangle(0, 0, 1100, 1700)},
	        {key: 'executive', title: 'US-Executive (7" x 10")', format: new Rectangle(0, 0, 700, 1000)},
	        {key: 'a0', title: 'A0 (841 mm x 1189 mm)', format: new Rectangle(0, 0, 3300, 4681)},
	        {key: 'a1', title: 'A1 (594 mm x 841 mm)', format: new Rectangle(0, 0, 2339, 3300)},
	        {key: 'a2', title: 'A2 (420 mm x 594 mm)', format: new Rectangle(0, 0, 1654, 2336)},
	        {key: 'a3', title: 'A3 (297 mm x 420 mm)', format: new Rectangle(0, 0, 1169, 1654)},
	        {key: 'a4', title: 'A4 (210 mm x 297 mm)', format: mxConstants.PAGE_FORMAT_A4_PORTRAIT},
	        {key: 'a5', title: 'A5 (148 mm x 210 mm)', format: new Rectangle(0, 0, 583, 827)},
	        {key: 'a6', title: 'A6 (105 mm x 148 mm)', format: new Rectangle(0, 0, 413, 583)},
	        {key: 'a7', title: 'A7 (74 mm x 105 mm)', format: new Rectangle(0, 0, 291, 413)},
	        {key: 'b4', title: 'B4 (250 mm x 353 mm)', format: new Rectangle(0, 0, 980, 1390)},
	        {key: 'b5', title: 'B5 (176 mm x 250 mm)', format: new Rectangle(0, 0, 690, 980)},
	        {key: '16-9', title: '16:9 (1600 x 900)', format: new Rectangle(0, 0, 900, 1600)},
	        {key: '16-10', title: '16:10 (1920 x 1200)', format: new Rectangle(0, 0, 1200, 1920)},
	        {key: '4-3', title: '4:3 (1600 x 1200)', format: new Rectangle(0, 0, 1200, 1600)},
	        {key: 'custom', title: Resources.get('custom'), format: null}];
};

/**
 * Constructs a new filename dialog.
 */
let FilenameDialog = function(editorUi, filename, buttonText, fn, label, validateFn, content, helpLink, closeOnBtn, cancelFn, hints, w)
{
	closeOnBtn = (closeOnBtn != null) ? closeOnBtn : true;
	var row, td;
	
	let table = document.createElement('table');
	let tbody = document.createElement('tbody');
	table.style.marginTop = '8px';
	
	row = document.createElement('tr');
	
	td = document.createElement('td');
	td.style.whiteSpace = 'nowrap';
	td.style.fontSize = '10pt';
	td.style.width = (hints) ? '80px' : '120px';
	write(td, (label || Resources.get('filename')) + ':');
	
	row.appendChild(td);
	
	let nameInput = document.createElement('input');
	nameInput.setAttribute('value', filename || '');
	nameInput.style.marginLeft = '4px';
	nameInput.style.width = (w != null) ? w + 'px' : '180px';
	
	let genericBtn = button(buttonText, function()
	{
		if (validateFn == null || validateFn(nameInput.value))
		{
			if (closeOnBtn)
			{
				editorUi.hideDialog();
			}
			
			fn(nameInput.value);
		}
	});
	genericBtn.className = 'geBtn gePrimaryBtn';
	
	this.init = function()
	{
		if (label == null && content != null)
		{
			return;
		}
		
		nameInput.focus();
		
		if (Client.IS_GC || Client.IS_FF)
		{
			nameInput.select();
		}
		else
		{
			document.execCommand('selectAll', false, null);
		}
		
		// Installs drag and drop handler for links
		if (Graph.fileSupport)
		{
			// Setup the dnd listeners
			let dlg = table.parentNode;
			
			if (dlg != null)
			{
				let graph = editorUi.editor.graph;
				let dropElt = null;
					
				mxEvent.addListener(dlg, 'dragleave', function(evt)
				{
					if (dropElt != null)
				    {
						dropElt.style.backgroundColor = '';
				    	dropElt = null;
				    }
				    
					evt.stopPropagation();
					evt.preventDefault();
				});
				
				mxEvent.addListener(dlg, 'dragover', ((evt) =>
				{
					if (dropElt == null)
					{
						dropElt = nameInput;
						dropElt.style.backgroundColor = '#ebf2f9';
					}
					
					evt.stopPropagation();
					evt.preventDefault();
				}));
						
				mxEvent.addListener(dlg, 'drop', ((evt) =>
				{
				    if (dropElt != null)
				    {
						dropElt.style.backgroundColor = '';
				    	dropElt = null;
				    }
	
				    if (indexOf(evt.dataTransfer.types, 'text/uri-list') >= 0)
				    {
				    	nameInput.value = decodeURIComponent(evt.dataTransfer.getData('text/uri-list'));
				    	genericBtn.click();
				    }
	
				    evt.stopPropagation();
				    evt.preventDefault();
				}));
			}
		}
	};

	td = document.createElement('td');
	td.style.whiteSpace = 'nowrap';
	td.appendChild(nameInput);
	row.appendChild(td);
	
	if (label != null || content == null)
	{
		tbody.appendChild(row);
		
		if (hints != null)
		{
			if (editorUi.editor.diagramFileTypes != null)
			{
				let typeSelect = FilenameDialog.createFileTypes(editorUi, nameInput, editorUi.editor.diagramFileTypes);
				typeSelect.style.marginLeft = '6px';
				typeSelect.style.width = '74px';
				
				td.appendChild(typeSelect);
				nameInput.style.width = (w != null) ? (w - 40) + 'px' : '140px';
			}

			td.appendChild(FilenameDialog.createTypeHint(editorUi, nameInput, hints));
		}
	}
	
	if (content != null)
	{
		row = document.createElement('tr');
		td = document.createElement('td');
		td.colSpan = 2;
		td.appendChild(content);
		row.appendChild(td);
		tbody.appendChild(row);
	}
	
	row = document.createElement('tr');
	td = document.createElement('td');
	td.colSpan = 2;
	td.style.paddingTop = '20px';
	td.style.whiteSpace = 'nowrap';
	td.setAttribute('align', 'right');
	
	let cancelBtn = button(Resources.get('cancel'), function()
	{
		editorUi.hideDialog();
		
		if (cancelFn != null)
		{
			cancelFn();
		}
	});
	cancelBtn.className = 'geBtn';
	
	if (editorUi.editor.cancelFirst)
	{
		td.appendChild(cancelBtn);
	}
	
	if (helpLink != null)
	{
		let helpBtn = button(Resources.get('help'), function()
		{
			editorUi.editor.graph.openLink(helpLink);
		});
		
		helpBtn.className = 'geBtn';	
		td.appendChild(helpBtn);
	}

	mxEvent.addListener(nameInput, 'keypress', function(e)
	{
		if (e.keyCode == 13)
		{
			genericBtn.click();
		}
	});
	
	td.appendChild(genericBtn);
	
	if (!editorUi.editor.cancelFirst)
	{
		td.appendChild(cancelBtn);
	}

	row.appendChild(td);
	tbody.appendChild(row);
	table.appendChild(tbody);
	
	this.container = table;
};

/**
 * 
 */
FilenameDialog.filenameHelpLink = null;

/**
 * 
 */
FilenameDialog.createTypeHint = function(ui, nameInput, hints)
{
	let hint = document.createElement('img');
	hint.style.cssText = 'vertical-align:top;height:16px;width:16px;margin-left:4px;background-repeat:no-repeat;background-position:center bottom;cursor:pointer;';
	setOpacity(hint, 70);
	
	let nameChanged = function()
	{
		hint.setAttribute('src', Editor.helpImage);
		hint.setAttribute('title', Resources.get('help'));
		
		for (let i = 0; i < hints.length; i++)
		{
			if (hints[i].ext.length > 0 && nameInput.value.toLowerCase().substring(
				nameInput.value.length - hints[i].ext.length - 1) == '.' + hints[i].ext)
			{
				hint.setAttribute('src',  Client.imageBasePath + '/warning.png');
				hint.setAttribute('title', Resources.get(hints[i].title));
				break;
			}
		}
	};
	
	mxEvent.addListener(nameInput, 'keyup', nameChanged);
	mxEvent.addListener(nameInput, 'change', nameChanged);
	mxEvent.addListener(hint, 'click', function(evt)
	{
		let title = hint.getAttribute('title');
		
		if (hint.getAttribute('src') == Editor.helpImage)
		{
			ui.editor.graph.openLink(FilenameDialog.filenameHelpLink);
		}
		else if (title != '')
		{
			ui.showError(null, title, Resources.get('help'), function()
			{
				ui.editor.graph.openLink(FilenameDialog.filenameHelpLink);
			}, null, Resources.get('ok'), null, null, null, 340, 90);
		}
		
		mxEvent.consume(evt);
	});
	
	nameChanged();
	
	return hint;
};

/**
 * 
 */
FilenameDialog.createFileTypes = function(editorUi, nameInput, types)
{
	let typeSelect = document.createElement('select');
	
	for (let i = 0; i < types.length; i++)
	{
		let typeOption = document.createElement('option');
		typeOption.setAttribute('value', i);
		write(typeOption, Resources.get(types[i].description) +
			' (.' + types[i].extension + ')');
		typeSelect.appendChild(typeOption);
	}
			
	mxEvent.addListener(typeSelect, 'change', function(evt)
	{
		let ext = types[typeSelect.value].extension;
		let idx = nameInput.value.lastIndexOf('.');
		
		if (idx > 0)
		{
			let ext = types[typeSelect.value].extension;
			nameInput.value = nameInput.value.substring(0, idx + 1) + ext;
		}
		else
		{
			nameInput.value = nameInput.value + '.' + ext;
		}
		
		if ('createEvent' in document)
		{
		    let changeEvent = document.createEvent('HTMLEvents');
		    changeEvent.initEvent('change', false, true);
		    nameInput.dispatchEvent(changeEvent);
		}
		else
		{
		    nameInput.fireEvent('onchange');
		}
	});
	
	let nameInputChanged = function(evt)
	{
		let idx = nameInput.value.lastIndexOf('.');
		let active = 0;
		
		// Finds current extension
		if (idx > 0)
		{
			let ext = nameInput.value.toLowerCase().substring(idx + 1);
			
			for (let i = 0; i < types.length; i++)
			{
				if (ext == types[i].extension)
				{
					active = i;
					break;
				}
			}
		}
		
		typeSelect.value = active;
	};
	
	mxEvent.addListener(nameInput, 'change', nameInputChanged);
	mxEvent.addListener(nameInput, 'keyup', nameInputChanged);
	nameInputChanged();
	
	return typeSelect;
};

/**
 * Static overrides
 */
(function()
{
	// Uses HTML for background pages (to support grid background image)
	mxGraphView.prototype.validateBackgroundPage = function()
	{
		let graph = this.graph;
		
		if (graph.container != null && !graph.transparentBackground)
		{
			if (graph.pageVisible)
			{
				let bounds = this.getBackgroundPageBounds();
				
				if (this.backgroundPageShape == null)
				{
					// Finds first element in graph container
					let firstChild = graph.container.firstChild;
					
					while (firstChild != null && firstChild.nodeType != mxConstants.NODETYPE_ELEMENT)
					{
						firstChild = firstChild.nextSibling;
					}
					
					if (firstChild != null)
					{
						this.backgroundPageShape = this.createBackgroundPageShape(bounds);
						this.backgroundPageShape.scale = 1;
						
						// Shadow filter causes problems in outline window in quirks mode. IE8 standards
						// also has known rendering issues inside MaxWindow but not using shadow is worse.
						this.backgroundPageShape.isShadow = true;
						this.backgroundPageShape.dialect = mxConstants.DIALECT_STRICTHTML;
						this.backgroundPageShape.init(graph.container);
	
						// Required for the browser to render the background page in correct order
						firstChild.style.position = 'absolute';
						graph.container.insertBefore(this.backgroundPageShape.node, firstChild);
						this.backgroundPageShape.redraw();
						
						this.backgroundPageShape.node.className = 'geBackgroundPage';
						
						// Adds listener for double click handling on background
						mxEvent.addListener(this.backgroundPageShape.node, 'dblclick',
							((evt) =>
							{
								graph.dblClick(evt);
							})
						);
						
						// Adds basic listeners for graph event dispatching outside of the
						// container and finishing the handling of a single gesture
						mxEvent.addGestureListeners(this.backgroundPageShape.node,
							((evt) =>
							{
								graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new InternalMouseEvent(evt));
							}),
							((evt) =>
							{
								// Hides the tooltip if mouse is outside container
								if (graph.tooltipHandler != null && graph.tooltipHandler.isHideOnHover())
								{
									graph.tooltipHandler.hide();
								}
								
								if (graph.isMouseDown && !mxEvent.isConsumed(evt))
								{
									graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new InternalMouseEvent(evt));
								}
							}),
							((evt) =>
							{
								graph.fireMouseEvent(mxEvent.MOUSE_UP, new InternalMouseEvent(evt));
							})
						);
					}
				}
				else
				{
					this.backgroundPageShape.scale = 1;
					this.backgroundPageShape.bounds = bounds;
					this.backgroundPageShape.redraw();
				}
			}
			else if (this.backgroundPageShape != null)
			{
				this.backgroundPageShape.destroy();
				this.backgroundPageShape = null;
			}
			
			this.validateBackgroundStyles();
		}
	};

	// Updates the CSS of the background to draw the grid
	mxGraphView.prototype.validateBackgroundStyles = function()
	{
		let graph = this.graph;
		let color = (graph.background == null || graph.background == mxConstants.NONE) ? graph.defaultPageBackgroundColor : graph.background;
		let gridColor = (color != null && this.gridColor != color.toLowerCase()) ? this.gridColor : '#ffffff';
		let image = 'none';
		let position = '';
		
		if (graph.isGridEnabled())
		{
			let phase = 10;
			
			if (Client.IS_SVG)
			{
				// Generates the SVG required for drawing the dynamic grid
				image = unescape(encodeURIComponent(this.createSvgGrid(gridColor)));
				image = (window.btoa) ? btoa(image) : Base64.encode(image, true);
				image = 'url(' + 'data:image/svg+xml;base64,' + image + ')'
				phase = graph.gridSize * this.scale * this.gridSteps;
			}
			else
			{
				// Fallback to grid wallpaper with fixed size
				image = 'url(' + this.gridImage + ')';
			}
			
			var x0 = 0;
			var y0 = 0;
			
			if (graph.view.backgroundPageShape != null)
			{
				let bds = this.getBackgroundPageBounds();
				
				x0 = 1 + bds.x;
				y0 = 1 + bds.y;
			}
			
			// Computes the offset to maintain origin for grid
			position = -Math.round(phase - mod(this.translate.x * this.scale - x0, phase)) + 'px ' +
				-Math.round(phase - mod(this.translate.y * this.scale - y0, phase)) + 'px';
		}
		
		let canvas = graph.view.canvas;
		
		if (canvas.ownerSVGElement != null)
		{
			canvas = canvas.ownerSVGElement;
		}
		
		if (graph.view.backgroundPageShape != null)
		{
			graph.view.backgroundPageShape.node.style.backgroundPosition = position;
			graph.view.backgroundPageShape.node.style.backgroundImage = image;
			graph.view.backgroundPageShape.node.style.backgroundColor = color;
			graph.container.className = 'geDiagramContainer geDiagramBackdrop';
			canvas.style.backgroundImage = 'none';
			canvas.style.backgroundColor = '';
		}
		else
		{
			graph.container.className = 'geDiagramContainer';
			canvas.style.backgroundPosition = position;
			canvas.style.backgroundColor = color;
			canvas.style.backgroundImage = image;
		}
	};
	
	// Returns the SVG required for painting the background grid.
	mxGraphView.prototype.createSvgGrid = function(color)
	{
		let tmp = this.graph.gridSize * this.scale;
		
		while (tmp < this.minGridSize)
		{
			tmp *= 2;
		}
		
		var tmp2 = this.gridSteps * tmp;
		
		// Small grid lines
		let d = [];
		
		for (let i = 1; i < this.gridSteps; i++)
		{
			var tmp3 = i * tmp;
			d.push('M 0 ' + tmp3 + ' L ' + tmp2 + ' ' + tmp3 + ' M ' + tmp3 + ' 0 L ' + tmp3 + ' ' + tmp2);
		}
		
		// KNOWN: Rounding errors for certain scales (eg. 144%, 121% in Chrome, FF and Safari). Workaround
		// in Chrome is to use 100% for the svg size, but this results in blurred grid for large diagrams.
		let size = tmp2;
		let svg =  '<svg width="' + size + '" height="' + size + '" xmlns="' + mxConstants.NS_SVG + '">' +
		    '<defs><pattern id="grid" width="' + tmp2 + '" height="' + tmp2 + '" patternUnits="userSpaceOnUse">' +
		    '<path d="' + d.join(' ') + '" fill="none" stroke="' + color + '" opacity="0.2" stroke-width="1"/>' +
		    '<path d="M ' + tmp2 + ' 0 L 0 0 0 ' + tmp2 + '" fill="none" stroke="' + color + '" stroke-width="1"/>' +
		    '</pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/></svg>';

		return svg;
	};

	// Adds panning for the grid with no page view and disabled scrollbars
	let mxGraphPanGraph = graph.prototype.panGraph;
	graph.prototype.panGraph = function(dx, dy)
	{
		mxGraphPanGraph.apply(this, arguments);
		
		if (this.shiftPreview1 != null)
		{
			let canvas = this.view.canvas;
			
			if (canvas.ownerSVGElement != null)
			{
				canvas = canvas.ownerSVGElement;
			}
			
			let phase = this.gridSize * this.view.scale * this.view.gridSteps;
			let position = -Math.round(phase - mod(this.view.translate.x * this.view.scale + dx, phase)) + 'px ' +
				-Math.round(phase - mod(this.view.translate.y * this.view.scale + dy, phase)) + 'px';
			canvas.style.backgroundPosition = position;
		}
	};
	
	// Draws page breaks only within the page
	graph.prototype.updatePageBreaks = function(visible, width, height)
	{
		let scale = this.view.scale;
		let tr = this.view.translate;
		let fmt = this.pageFormat;
		let ps = scale * this.pageScale;

		var bounds2 = this.view.getBackgroundPageBounds();

		width = bounds2.width;
		height = bounds2.height;
		let bounds = new Rectangle(scale * tr.x, scale * tr.y, fmt.width * ps, fmt.height * ps);

		// Does not show page breaks if the scale is too small
		visible = visible && Math.min(bounds.width, bounds.height) > this.minPageBreakDist;

		let horizontalCount = (visible) ? Math.ceil(height / bounds.height) - 1 : 0;
		let verticalCount = (visible) ? Math.ceil(width / bounds.width) - 1 : 0;
		let right = bounds2.x + width;
		let bottom = bounds2.y + height;

		if (this.horizontalPageBreaks == null && horizontalCount > 0)
		{
			this.horizontalPageBreaks = [];
		}
		
		if (this.verticalPageBreaks == null && verticalCount > 0)
		{
			this.verticalPageBreaks = [];
		}
			
		let drawPageBreaks = ((breaks) =>
		{
			if (breaks != null)
			{
				let count = (breaks == this.horizontalPageBreaks) ? horizontalCount : verticalCount;
				
				for (let i = 0; i <= count; i++)
				{
					let pts = (breaks == this.horizontalPageBreaks) ?
						[new Point(Math.round(bounds2.x), Math.round(bounds2.y + (i + 1) * bounds.height)),
						 new Point(Math.round(right), Math.round(bounds2.y + (i + 1) * bounds.height))] :
						[new Point(Math.round(bounds2.x + (i + 1) * bounds.width), Math.round(bounds2.y)),
						 new Point(Math.round(bounds2.x + (i + 1) * bounds.width), Math.round(bottom))];
					
					if (breaks[i] != null)
					{
						breaks[i].points = pts;
						breaks[i].redraw();
					}
					else
					{
						let pageBreak = new Polyline(pts, this.pageBreakColor);
						pageBreak.dialect = this.dialect;
						pageBreak.isDashed = this.pageBreakDashed;
						pageBreak.pointerEvents = false;
						pageBreak.init(this.view.backgroundPane);
						pageBreak.redraw();
						
						breaks[i] = pageBreak;
					}
				}
				
				for (let i = count; i < breaks.length; i++)
				{
					breaks[i].destroy();
				}
				
				breaks.splice(count, breaks.length - count);
			}
		});
			
		drawPageBreaks(this.horizontalPageBreaks);
		drawPageBreaks(this.verticalPageBreaks);
	};
	
	// Disables removing relative children and table rows and cells from parents
	let mxGraphHandlerShouldRemoveCellsFromParent = mxGraphHandler.prototype.shouldRemoveCellsFromParent;
	mxGraphHandler.prototype.shouldRemoveCellsFromParent = function(parent, cells, evt)
	{
		for (let i = 0; i < cells.length; i++)
		{
			if (this.graph.isTableCell(cells[i]) || this.graph.isTableRow(cells[i]))
			{
				return false;
			}
			else if (cells[i].isVertex())
			{
				let geo = cells[i].getGeometry();
				
				if (geo != null && geo.relative)
				{
					return false;
				}
			}
		}
		
		return mxGraphHandlerShouldRemoveCellsFromParent.apply(this, arguments);
	};

	// Overrides to ignore hotspot only for target terminal
	let mxConnectionHandlerCreateMarker = ConnectionHandler.prototype.createMarker;
	ConnectionHandler.prototype.createMarker = function()
	{
		let marker = mxConnectionHandlerCreateMarker.apply(this, arguments);
		
		marker.intersects = ((state, evt) =>
		{
			if (this.isConnecting())
			{
				return true;
			}
			
			return CellMarker.prototype.intersects.apply(marker, arguments);
		});
		
		return marker;
	};

	// Creates background page shape
	mxGraphView.prototype.createBackgroundPageShape = function(bounds)
	{
		return new RectangleShape(bounds, '#ffffff', this.graph.defaultPageBorderColor);
	};

	// Fits the number of background pages to the graph
	mxGraphView.prototype.getBackgroundPageBounds = function()
	{
		let gb = this.getGraphBounds();
		
		// Computes unscaled, untranslated graph bounds
		let x = (gb.width > 0) ? gb.x / this.scale - this.translate.x : 0;
		let y = (gb.height > 0) ? gb.y / this.scale - this.translate.y : 0;
		let w = gb.width / this.scale;
		let h = gb.height / this.scale;
		
		let fmt = this.graph.pageFormat;
		let ps = this.graph.pageScale;

		let pw = fmt.width * ps;
		let ph = fmt.height * ps;

		var x0 = Math.floor(Math.min(0, x) / pw);
		var y0 = Math.floor(Math.min(0, y) / ph);
		let xe = Math.ceil(Math.max(1, x + w) / pw);
		let ye = Math.ceil(Math.max(1, y + h) / ph);
		
		let rows = xe - x0;
		let cols = ye - y0;

		let bounds = new Rectangle(this.scale * (this.translate.x + x0 * pw), this.scale *
				(this.translate.y + y0 * ph), this.scale * rows * pw, this.scale * cols * ph);
		
		return bounds;
	};
	
	// Add panning for background page in VML
	let graphPanGraph = graph.prototype.panGraph;
	graph.prototype.panGraph = function(dx, dy)
	{
		graphPanGraph.apply(this, arguments);
		
		if ((this.dialect != mxConstants.DIALECT_SVG && this.view.backgroundPageShape != null) &&
			(!this.useScrollbarsForPanning || !hasScrollbars(this.container)))
		{
			this.view.backgroundPageShape.node.style.marginLeft = dx + 'px';
			this.view.backgroundPageShape.node.style.marginTop = dy + 'px';
		}
	};

	/**
	 * Consumes click events for disabled menu items.
	 */
	let mxPopupMenuAddItem = mxPopupMenu.prototype.addItem;
	mxPopupMenu.prototype.addItem = function(title, image, funct, parent, iconCls, enabled)
	{
		let result = mxPopupMenuAddItem.apply(this, arguments);
		
		if (enabled != null && !enabled)
		{
			mxEvent.addListener(result, 'mousedown', function(evt)
			{
				mxEvent.consume(evt);
			});
		}
		
		return result;
	};
	
	/**
	 * Selects tables before cells and rows.
	 */
	let mxGraphHandlerIsPropagateSelectionCell = GraphHandler.prototype.isPropagateSelectionCell;
	mxGraphHandler.prototype.isPropagateSelectionCell = function(cell, immediate, me)
	{
		let result = false;
		let parent = cell.getParent()
		
		if (immediate)
		{
			let geo = (cell.isEdge()) ? null :
				cell.getGeometry();
			
			result = !parent.isEdge() &&
				!this.graph.isSiblingSelected(cell) &&
				((geo != null && geo.relative) ||
				!this.graph.isContainer(parent) ||
				this.graph.isPart(cell));
		}
		else
		{
			result = mxGraphHandlerIsPropagateSelectionCell.apply(this, arguments);
			
			if (this.graph.isTableCell(cell) || this.graph.isTableRow(cell))
			{
				let table = parent;
				
				if (!this.graph.isTable(table))
				{
					table = table.getParent();
				}
				
				result = !this.graph.selectionCellsHandler.isHandled(table) ||
					(this.graph.isCellSelected(table) && this.graph.isToggleEvent(me.getEvent())) ||
					(this.graph.isCellSelected(cell) && !this.graph.isToggleEvent(me.getEvent())) ||
					(this.graph.isTableCell(cell) && this.graph.isCellSelected(parent));
			}
		}
		
		return result;
	};

	/**
	 * Returns last selected ancestor
	 */
	PopupMenuHandler.prototype.getCellForPopupEvent = function(me)
	{
		let cell = me.getCell();
		let model = this.graph.getModel();
		let parent = cell.getParent();
		let state = this.graph.view.getState(parent);
		let selected = this.graph.isCellSelected(cell);
		
		while (state != null && (parent.isVertex() || parent.isEdge()))
		{
			let temp = this.graph.isCellSelected(parent);
			selected = selected || temp;
			
			if (temp || (!selected && (this.graph.isTableCell(cell) ||
				this.graph.isTableRow(cell))))
			{
				cell = parent;
			}
			
			parent = parent.getParent();
		}
		
		return cell;
	};

})();
