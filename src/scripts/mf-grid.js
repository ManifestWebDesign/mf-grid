(function(){

var gridTemplate = '<div class="grid-container" ng-show="grid._data && grid._data.length">'
+ '<div class="grid-header">'
+ '<table class="grid-header-content-wrapper table">'
+ '<thead class="grid-header-content"></thead>'
+ '</table>'
+ '</div>'
+ '<div class="grid-body">'
+ '<div class="grid-body-viewport-content">'
+ '<table class="grid-body-content-wrapper table">'
+ '<tbody class="grid-body-content"></tbody>'
+ '</table>'
+ '</div>'
+ '</div>'
+ '</div>';

var defaultHeaderRowTemplate = '<tr class="grid-row">'
+ '<th ng-if="grid.showSelectionCheckbox" class="grid-column grid-checkbox-column">'
+ '<input ng-if="grid.multiSelect" ng-checked="grid.allItemsSelected" title="Select All" type="checkbox" class="check-all" />'
+ '</th>'
+ '<th'
+ ' ng-repeat="column in grid.enabledColumns"'
+ ' ng-style="{ width: column.width }"'
+ ' ng-class="{ \'grid-column-sortable\': grid.enableSorting }"'
+ ' ng-click="headerColumnClick(column, $index)"'
+ ' class="grid-column">{{ column.displayName }}'
+ '<div'
+ ' ng-show="grid.enableSorting && grid.sortColumn === column"'
+ ' class="grid-sort-icon glyphicon glyphicon-chevron-{{ grid.sortAsc ? \'down\' : \'up\' }} icon-chevron-{{ grid.sortAsc ? \'down\' : \'up\' }}"></div>'
+ '</th>'
+ '</tr>';

var defaultRowTemplate = '<tr'
+ ' mf-grid-row'
+ ' ng-repeat="row in grid.visibleItems"'
+ ' ng-class="{\'grid-row-selected\': grid.isItemSelected(row.item)}"'
+ ' class="grid-row">'
+ '<td ng-if="grid.showSelectionCheckbox" class="grid-column grid-checkbox-column">'
//+ '<span ng-show="grid.isItemSelected(row.item)" class="glyphicon glyphicon-ok-circle icon-ok-circle"></span>'
+ '<input ng-checked="grid.isItemSelected(row.item)" type="checkbox" />'
+ '</td>'
+ '<td mf-grid-column'
+ ' ng-repeat="column in grid.enabledColumns"'
+ ' class="grid-column">{{ grid.getColumnValue(row.item, column, $parent) }}</td>'
+ '</tr>';

function getScrollBarWidth() {
    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "200px";
    outer.style.height = "150px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);

    document.body.appendChild(outer);
    var w1 = inner.offsetWidth;
    outer.style.overflow = 'scroll';
    var w2 = inner.offsetWidth;
    if (w1 === w2) w2 = outer.clientWidth;

    document.body.removeChild(outer);

    return (w1 - w2);
}

Array.prototype.remove = Array.prototype.remove || function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

var MfGridCtrl = function MfGridCtrl($parse, $interpolate) {
	this.$parse = $parse;
	this.$interpolate = $interpolate;
	this._data = [];
	this.enabledColumns = [];
	this.selectedItems = [];
	this.visibleItems = [];
	this.columnDefs = [];
};

var variableRegEx = /^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[$A-Z\_a-z]*$/;

var sortService = {};
 // this takes an piece of data from the cell and tries to determine its type and what sorting
 // function to use for it
 // @value - the cell data
 sortService.guessSortFn = function(value) {
	 var itemType = typeof(value);

	 //check for numbers and booleans
	 switch (itemType) {
		 case 'number':
			 return sortService.sortNumber;
		 case 'boolean':
			 return sortService.sortBool;
		 case 'string':
			 // if number string return number string sort fn. else return the str
			 return value.match(/^[-+]?[£$¤]?[\d,.]+%?$/) ? sortService.sortNumberStr : sortService.sortAlpha;
		 default:
			 //check if the item is a valid Date
			 if (Object.prototype.toString.call(value) === '[object Date]') {
				 return sortService.sortDate;
			 } else {
				 // finally just sort the basic sort...
				 return sortService.basicSort;
			 }
	 }
 };
 //#region Sorting Functions
 sortService.basicSort = function(a, b) {
	 if (a === b) {
		 return 0;
	 }
	 if (a < b) {
		 return -1;
	 }
	 return 1;
 };
 sortService.sortNumber = function(a, b) {
	 return a - b;
 };
 sortService.sortNumberStr = function(a, b) {
	 var numA, numB, badA = false, badB = false;
	 numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
	 if (isNaN(numA)) {
		 badA = true;
	 }
	 numB = parseFloat(b.replace(/[^0-9.-]/g, ''));
	 if (isNaN(numB)) {
		 badB = true;
	 }
	 // we want bad ones to get pushed to the bottom... which effectively is "greater than"
	 if (badA && badB) {
		 return 0;
	 }
	 if (badA) {
		 return 1;
	 }
	 if (badB) {
		 return -1;
	 }
	 return numA - numB;
 };
 sortService.sortAlpha = function(a, b) {
	 var strA = a.toLowerCase(),
		 strB = b.toLowerCase();
	 return strA === strB ? 0 : (strA < strB ? -1 : 1);
 };
 sortService.sortDate = function(a, b) {
	 var timeA = a.getTime(),
		 timeB = b.getTime();
	 return timeA === timeB ? 0 : (timeA < timeB ? -1 : 1);
 };
 sortService.sortBool = function(a, b) {
	 if (a && b) {
		 return 0;
	 }
	 if (!a && !b) {
		 return 0;
	 } else {
		 return a ? 1 : -1;
	 }
 };
 //#endregion

/**
 * Controller
 */
MfGridCtrl.prototype = {
	_data: null,
	columnDefs: null,
	showSelectionCheckbox: true,
	enabledColumns: null,
	selectedItems: null,
	multiSelect: true,
	allItemsSelected: false,
	$parse: null,
	visibleItems: null,
	virtualizationThreshold: 50,
	virtualizationOverflow: 3,
	itemsBefore: 0,
	pixelsBefore: 0,
	height: 0,
	viewportHeight: 0,
	headerRowHeight: 0,
	enableSorting: true,
	rowHeight: 30,
	scrollTop: 0,
	sortColumn: null,
	_prevSortColumn: null,
	_prevSortAsc: false,
	sortAsc: true,
	_oldLength: 0,
	headerColumnClick: null,
	rowClick: null,
	getColumnValueRaw: function (item, column, scope) {
		if (column.isItemKey === true) {
			return item[column.field];
		}
		if (item.hasOwnProperty(column.field) || typeof item[column.field] !== 'undefined') {
			column.isItemKey = true;
			return item[column.field];
		}
		if (scope) {
			if (column.isScopeKey === true) {
				return scope[column.field];
			}
			if (scope.hasOwnProperty(column.field) || typeof scope[column.field] !== 'undefined') {
				column.isScopeKey = true;
				return scope[column.field];
			}
		} else {
			scope = {};
		}

		return column.valueRaw(scope, item);
	},
	getColumnValue: function (item, column, scope) {
		if (
			column.isItemKey === true
			|| column.isScopeKey === true
			|| typeof column.valueFiltered !== 'function'
		) {
			return this.getColumnValueRaw(item, column, scope);
		}
		return column.valueFiltered(item);
	},
	sortByColumn: function(column, asc) {
		var grid = this;
		if (this._prevSortColumn === column) {
			if (this._prevSortAsc === asc) {
				return;
			}
			this._prevSortAsc = asc;
			this._data.reverse();
			return;
		}
		this._prevSortAsc = asc;
		this._prevSortColumn = this.sortColumn = column;

		var sortFn = column.sortFn;

		this._data.sort(function(a, b) {
			a = grid.getColumnValueRaw(a, column);
			b = grid.getColumnValueRaw(b, column);

			var hasA = typeof a !== 'undefined' && a !== null,
				hasB = typeof b !== 'undefined' && b !== null;

			if (!hasA && !hasB) {
				return 0;
			}
			if (hasA && !hasB) {
				return -1;
			}
			if (!hasA && hasB) {
				return 1;
			}

			if (typeof sortFn === 'undefined') {
				sortFn = sortService.guessSortFn(a);
			}

			return sortFn(a, b);
		});
	},
	isColumnSortable: function(column) {
		return this.enableSorting && column.sortable;
	},
	setViewportHeight: function(height) {
		this.viewportHeight = height;
		this.updateVisibleItems();
	},
	setScrollTop: function(scrollTop) {
		this.scrollTop = scrollTop;
		this.updateVisibleItems();
	},
	setVisibleItems: function(newVisibleItems) {
		for (var x = 0, l = newVisibleItems.length; x < l; ++x) {
			if (typeof this.visibleItems[x] === 'undefined') {
				this.visibleItems[x] = {};
			}
//			else {
//				this.visibleItems[x].data.length = 0;
//			}
//			var data = this.visibleItems[x].data;
//			for (var c = 0, lc = this.enabledColumns.length; c < lc; ++c) {
//				var column = this.enabledColumns[c];
//				data.push(this.getColumnValue(newVisibleItems[x], column));
//			}
			this.visibleItems[x].item = newVisibleItems[x];
		}
		this.visibleItems.length = newVisibleItems.length;
	},
	updateVisibleItems: function() {
		var rowHeight = this.rowHeight + .5,
			height = this.viewportHeight,
			totalItems = this._data.length,
			maxVisibleItems = Math.ceil(height / rowHeight);

		this.totalHeight = totalItems * rowHeight;
		this.itemsBefore = this.pixelsBefore = 0;

		if (totalItems <= maxVisibleItems || totalItems <= this.virtualizationThreshold) {
			this.setVisibleItems(this._data);
			return;
		}

		var bleed = this.virtualizationOverflow;

		var scrollTop = Math.max(this.scrollTop, 0),
			itemsBefore = ~~(scrollTop / rowHeight),
			adjustment = Math.min(bleed, itemsBefore);

		this.itemsBefore = itemsBefore - adjustment;
		this.pixelsBefore = this.itemsBefore * rowHeight;

		var end = Math.min(this.itemsBefore + maxVisibleItems + (bleed + adjustment), totalItems);

		this.setVisibleItems(this._data.slice(this.itemsBefore, end));
	},
	isItemSelected: function(item) {
		return this.selectedItems.indexOf(item) !== -1;
	},
	updateCheckAll: function(){
		if (this.multiSelect === false && this.selectedItems.length > 1) {
			var last = this.selectedItems[this.selectedItems.length - 1];
			this.selectedItems.length = 1;
			this.selectedItems[0] = last;
		}
		this.allItemsSelected = this._data.length === this.selectedItems.length;
	},
	selectItem: function(item, selected) {
		if (this.multiSelect === false) {
			this.selectedItems.length = 0;
			this.selectedItems.push(item);
			this.updateCheckAll();
			return;
		}

		var index = this.selectedItems.indexOf(item),
			isSelected = index !== -1;

		if ((selected && isSelected) || (!selected && !isSelected)) {
			return;
		}
		if (selected) {
			this.selectedItems.push(item);
		} else {
			this.selectedItems.remove(index);
		}
		this.updateCheckAll();
	},
	selectAll: function(selected) {
		if (!selected) {
			this.allItemsSelected = false;
			this.selectedItems.length = 0;
			return;
		}
		for (var i = 0, l = this._data.length; i < l; ++i) {
			this.selectedItems.push(this._data[i]);
		}
		this.allItemsSelected = true;
	},
	buildColumn: function(columnDef) {
		if (typeof columnDef === 'string') {
			columnDef = {
				displayName: columnDef,
				field: columnDef,
				orderBy: columnDef,
				valueFiltered: columnDef,
				valueRaw: columnDef,
				isItemKey: true
			};
		}

		if (columnDef.isItemKey !== true) {
			columnDef.isItemKey = false;

			if (
				typeof columnDef.cellFilter !== 'undefined'
				&& columnDef.cellFilter.length > 0
			) {
				if (typeof columnDef.valueFiltered === 'undefined') {
					columnDef.valueFiltered = this.$interpolate('{{ ' + columnDef.field + ' | ' + columnDef.cellFilter + ' }}');
				}
			}

			if (
				!columnDef.isItemKey
				&& typeof columnDef.valueRaw === 'undefined'
			) {
				columnDef.valueRaw = this.$parse(columnDef.field);
			}
		}

		if (typeof columnDef.sortable === 'undefined') {
			columnDef.sortable = true;
		}

		return columnDef;
	},
	setData: function(data) {
		var resort = this._data !== data || this._oldLength !== data.length;

		if (data === null || typeof data === 'undefined') {
			data = [];
		}

		this._data = data;
		this._oldLength = data.length;

		var newSelectedItems = [];
		for (var x = 0, l = this.selectedItems.length; x < l; ++x) {
			var item = this.selectedItems[x];
			if (data.indexOf(item) !== -1) {
				newSelectedItems.push(item);
			}
		}
		this.selectedItems = newSelectedItems;
		this.updateCheckAll();

		this.enabledColumns = [];
		var columns = this.columnDefs;
		if (columns) {
			for (var i = 0, l = columns.length; i < l; ++i) {
				var column = this.buildColumn(columns[i]);

				if (
					this.ignoreColumns
					&& this.ignoreColumns.hasOwnProperty(column.field)
				) {
					continue;
				}

				this.enabledColumns.push(column);
			}
		} else {
			for (var col in data[0]) {
				this.enabledColumns.push(this.buildColumn(col));
			}
		}

		if (resort && this.sortColumn) {
			this.sortByColumn(this.sortColumn, this.sortAsc);
		}

		this.updateVisibleItems();
	}
};

angular.module('mf-grid', [])

.controller('MfGridCtrl', ['$parse', '$interpolate', function($parse, $interpolate) {
	return new MfGridCtrl($parse, $interpolate);
}])

/**
 * Directives
 */
.directive('mfGrid', ['$http', '$templateCache', '$compile', '$timeout', '$window', function($http, $templateCache, $compile, $timeout, $window) {

	function linker(scope, $el, attrs, grid) {

		var $headerViewport = $el.find('.grid-header'),
			$headerContent = $headerViewport.find('.grid-header-content'),
			$bodyViewport = $el.find('.grid-body'),
			bodyViewportElement = $bodyViewport[0],
			$bodyViewportContent = $el.find('.grid-body-viewport-content'),
			$bodyContentWrapper = $bodyViewport.find('.grid-body-content-wrapper'),
			$bodyContent = $bodyViewport.find('.grid-body-content');

		if (!bodyViewportElement) {
			throw new Error('.grid-body not found.');
		}

		grid.rowHeight = parseInt(grid.rowHeight, 10) || 50;

		scope.$watchCollection('$parent.' + grid.data, function(r) {
			grid.setData(r);
			updateHeight();
		});

		scope.$watchCollection('grid.columnDefs', function(oldColumns, newColumns) {
			grid.setData(grid._data);
		});

		scope.$watchCollection('grid.selectedItems', function(){
			grid.updateCheckAll();

			if (grid.selectionChanged) {
				grid.selectionChanged(grid.selectedItems);
			}
		});

		scope.$watch('grid.multiSelect', function(){
			grid.updateCheckAll();
		});

		function updateHeight() {
			if (bodyViewportElement.scrollHeight > bodyViewportElement.offsetHeight) {
				scope.scrollbarWidth = getScrollBarWidth();
			} else {
				scope.scrollbarWidth = 0;
			}
			grid.setViewportHeight(bodyViewportElement.offsetHeight);
		}

		var $win = angular.element($window);
		function windowResize(){
			updateHeight();
			scope.$digest();
		}

		$win.on('resize', windowResize);
		scope.$on('$destroy', function() {
			grid._data = null;
			grid.columnDefs = null;
			grid.selectedItems = null;
			grid.visibleItems = null;
            $win.off('resize', windowResize);
        });

		scope.$watch('grid.height', function(height){
			if (height) {
				$el.height(height);
			}

			$timeout(function(){
				updateHeight();
			});
		});

		scope.$watch('grid.scrollbarWidth', function(width){
			if (typeof width === 'undefined' || width === null) {
				return;
			}
			$headerViewport.css('margin-right', width + 'px');
		});

		scope.$watch('grid.totalHeight', function(height){
			if (typeof height === 'undefined' || height === null) {
				return;
			}
			$bodyViewportContent.css('height', height + 'px');
		});

		scope.$watch('grid.headerRowHeight', function(height){
			height = parseInt(height, 10) || 0;
			var $headerRow = $headerViewport.find('.grid-row');
			if ($headerRow.length !== 0) {
				$headerRow[0].style.height = height + 'px';
				bodyViewportElement.style.top = $headerRow.height() + 'px';
			}
			updateHeight();
		});

		scope.headerColumnClick = function(column, index) {
			if (!grid.enableSorting) {
				return;
			}

			grid.sortColumn = column;
			if (grid.sortColumn === column) {
				grid.sortAsc = !grid.sortAsc;
			} else {
				grid.sortAsc = true;
			}

			if (typeof grid.headerColumnClick === 'function') {
				grid.headerColumnClick(typeof column.value === 'string' ? column.value : column, index, grid.sortAsc);
			} else {
				grid.sortByColumn(column, grid.sortAsc);
			}
		};

		var prevScrollTop = 0;
		function onScroll() {
			$headerViewport[0].scrollLeft = bodyViewportElement.scrollLeft;

			var newScrollTop = bodyViewportElement.scrollTop,
				threshold = 1,
//				threshold = Math.max(1, Math.ceil(grid.virtualizationOverflow / 2)),
				min = prevScrollTop - grid.rowHeight * threshold,
				max = prevScrollTop + grid.rowHeight * threshold;

			if (newScrollTop >= min && newScrollTop <= max) {
				return;
			}
			prevScrollTop = newScrollTop;

			grid.setScrollTop(newScrollTop);
			$bodyContentWrapper[0].style.top = grid.pixelsBefore + 'px';

			scope.$digest();
		}

		bodyViewportElement.addEventListener('scroll', onScroll);

		function getItem($checkbox) {
			var scope = $checkbox.closest('.grid-row').scope();
			if (!scope) {
				return;
			}
			return scope.row.item;
		}

		$headerViewport.on('click', 'input.check-all', function() {
			grid.selectAll(this.checked);
			scope.$apply();
		});

		$bodyContent.on('click', '.grid-column', function(e) {
			if (angular.element(e.target).is('input:checkbox')) {
				return;
			}

			var $this = angular.element(this),
				item = getItem($this);

			if (!item) {
				return;
			}
			if ($this.is('.grid-checkbox-column')) {
				e.stopImmediatePropagation();
				grid.selectItem(item, !grid.isItemSelected(item));
			} else {
				if (grid.rowClick) {
					grid.rowClick(item, grid._data.indexOf(item));
				}
			}

			scope.$apply();
		});

		$bodyContent.on('click', 'input:checkbox', function(e) {
			e.stopImmediatePropagation();

			grid.selectItem(getItem(angular.element(this)), this.checked);
			scope.$apply();
		});

		if (!grid.rowTemplateUrl && !grid.rowTemplate) {
			grid.rowTemplate = defaultRowTemplate;
		}
		if (grid.rowTemplate) {
			$bodyContent.append($compile(grid.rowTemplate)(scope));
		} else {
			$http.get(grid.rowTemplateUrl, { cache: $templateCache }).success(function(html) {
				$bodyContent.append($compile(html)(scope));
			});
		}

		if (!grid.headerRowTemplateUrl && !grid.headerRowTemplate) {
			grid.headerRowTemplate = defaultHeaderRowTemplate;
		}
		if (grid.headerRowTemplate) {
			$headerContent.append($compile(grid.headerRowTemplate)(scope));
		} else {
			$http.get(grid.headerRowTemplateUrl, { cache: $templateCache }).success(function(html) {
				$headerContent.append($compile(html)(scope));
			});
		}
	};

	return {
		restrict: 'A',
		scope: { grid: '=mfGrid' },
		replace: true,
		controller: 'MfGridCtrl',
		template: gridTemplate,
		link: function(scope, $el, attrs, grid) {
			var options = scope.grid || {};

			for (var key in options) {
				if (options.hasOwnProperty(key)) {
					grid[key] = options[key];
				}
			}
			scope.grid = grid;

			linker(scope, $el, attrs, grid);
		}
	};
}])

.directive('mfGridRow', [function() {
	return {
		restrict: 'A',
		require: '^mfGrid',
		link: function(scope, $el, attrs, grid) {
			$el[0].style.height = grid.rowHeight + 'px';
			scope.$watch('grid.itemsBefore', function(){
				scope.itemIndex = grid.itemsBefore + scope.$index;
//				$el[0].style.top = top + 'px';
			});
		}
	};
}])

.directive('mfGridColumn', [function() {
	return {
		restrict: 'A',
		link: function(scope, $el, attrs) {
			$el[0].style.width = scope.column.width;
		}
	};
}]);

})();