(function(){

var gridTemplate = '<div id="{{ grid.getCssPrefix() }}" class="grid-container" ng-show="grid._data && grid._data.length">'
+ '<div id="mf-grid-{{ grid._id }}-style"></div>'
+ '<div class="grid-header" ng-show="grid.showHeaderRow">'
+ '<div class="grid-header-content"></div>'
+ '</div>'
+ '<div class="grid-body overthrow">'
+ '<div class="grid-body-viewport-content">'
+ '<div class="grid-body-content"></div>'
+ '</div>'
+ '</div>'
+ '</div>';

var defaultHeaderRowTemplate = '<div class="grid-row">'
+ '<div ng-if="grid.showSelectionCheckbox" class="grid-column grid-checkbox-column">'
+ '<input ng-if="grid.multiSelect" ng-checked="grid.allItemsSelected" title="Select All" type="checkbox" class="check-all" />'
+ '</div>'
+ '<div'
+ ' ng-repeat="column in grid.enabledColumns"'
+ ' ng-class="{ \'grid-column-sortable\': grid.enableSorting }"'
+ ' ng-click="headerColumnClick(column, $index)"'
+ ' class="grid-column {{ column.getHeaderClassName() }}">{{ column.displayName }}'
+ '<div'
+ ' ng-show="grid.enableSorting && grid.sortColumn && grid.sortColumn.field === column.field"'
+ ' class="grid-sort-icon glyphicon glyphicon-chevron-{{ grid.sortAsc ? \'up\' : \'down\' }} icon-chevron-{{ grid.sortAsc ? \'up\' : \'down\' }}"></div>'
+ '</div>'
+ '</div>';

var defaultRowTemplate = '<div'
+ ' mf-grid-row'
+ ' ng-repeat="item in grid.visibleItems track by $index"'
+ ' class="grid-row">'
+ '<div ng-if="grid.showSelectionCheckbox" class="grid-column grid-checkbox-column">'
+ '<input ng-checked="isSelected" type="checkbox" />'
+ '</div>'
+ '<div mf-grid-column'
+ ' ng-repeat="column in grid.enabledColumns"'
+ ' class="grid-column"></div>'
+ '</div>';

jQuery.fn.isAutoHeight = function() {

	var heightStyle = this[0].style.height,
		maxHeightStyle = this[0].style.maxHeight;

	if ((heightStyle && heightStyle.indexOf('px') !== -1)
		|| (maxHeightStyle && maxHeightStyle.indexOf('px') !== -1)) {
		return false;
	}

    var originalHeight = this.height();
	var $testEl = $('<div></div>').css({
		clear: 'both',
		height: originalHeight + 10
	}).appendTo(this);

	var newHeight = this.height();
    $testEl.remove();
    return newHeight > originalHeight;
};

function getStringWidth(string, font) {
	var f = font || '12px arial',
		o = $('<div>' + string + '</div>').css({
			'position': 'absolute',
			'float': 'left',
			'white-space': 'nowrap',
			'visibility': 'hidden',
			'font': f
		}).appendTo($('body')),
		w = o.width();

	o.remove();

	return w;
}

Array.prototype.remove = Array.prototype.remove || function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

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

var gridId = 1;

var MfGridCtrl = function MfGridCtrl($parse) {
	this._id = gridId;
	++gridId;
	this.$parse = $parse;
	this._data = [];
	this.enabledColumns = [];
	this.columns = [];
	this.selectedItems = [];
	this.visibleItems = [];
	this.columnDefs = [];
};

/**
 * Controller
 */
MfGridCtrl.prototype = {
	_id: null,
	_data: null,
	afterSelectionChange: null,
	columnDefs: null,
	showSelectionCheckbox: false,
	showHeaderRow: true,
	pinHeaderRow: false,
	columns: null,
	enabledColumns: null,
	selectedItems: null,
	multiSelect: true,
	allItemsSelected: false,
	trackItemBy: null,
	$parse: null,
	visibleItems: null,
	virtualizationThreshold: 50,
	virtualizationOverflow: 4,
	virtualizationInterval: 2,
	snapping: false,
	itemsBefore: 0,
	pixelsBefore: 0,
	height: null,
	viewportHeight: 0,
	headerRowHeight: 'auto',
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
	sortByColumn: function(column, asc) {
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
			a = column.getRawValue(a);
			b = column.getRawValue(b);

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
		this.scrollTop = scrollTop || 0;
		this.updateVisibleItems();
	},
	updateVisibleItems: function() {
		var rowHeight = this.rowHeight,
			totalItems = this._data.length,
			maxVisibleItems = Math.ceil(this.viewportHeight / rowHeight);

		this.totalHeight = totalItems * rowHeight;
		this.pixelsBefore = 0;

		var itemsBeforeNoOverflow = this.itemsBefore = ~~(this.scrollTop / rowHeight);

		if (totalItems <= maxVisibleItems || totalItems <= this.virtualizationThreshold) {
			this.visibleItems = this._data;
			this.itemsBefore = 0;
			this.renderedItemsBefore = itemsBeforeNoOverflow;
			return;
		}

		var bleed = this.virtualizationOverflow;
		this.itemsBefore -= this.itemsBefore % this.virtualizationInterval;

		var adjustment = Math.min(bleed, this.itemsBefore);
		this.itemsBefore = this.itemsBefore - adjustment;
		this.renderedItemsBefore = itemsBeforeNoOverflow - this.itemsBefore;
		this.pixelsBefore = this.itemsBefore * rowHeight;

		var end = Math.min(this.itemsBefore + maxVisibleItems + (bleed + adjustment), totalItems);
		this.visibleItems = this._data && typeof this._data.slice === 'function' ? this._data.slice(this.itemsBefore, end) : [];
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
	buildColumn: function(column) {
		var grid = this;

		if (typeof column === 'string') {
			column = {
				field: column
			};
		}

		if (typeof column.displayName === 'undefined') {
			column.displayName = column.field;
		}

		if (typeof column.visible === 'undefined') {
			column.visible = true;
		}

		if (typeof column.sortable === 'undefined') {
			column.sortable = true;
		}

		function isScopeKey(scope) {
			if (column.isScopeKey === true) {
				return true;
			}
			if (typeof scope === 'undefined') {
				return false;
			}
			if (
				typeof scope[column.field] !== 'undefined'
				|| scope.hasOwnProperty(column.field)
			) {
				column.isScopeKey = true;
			}
			return column.isScopeKey || false;
		}

		function isParentScopeKey(scope) {
			if (column.isParentScopeKey === true) {
				return true;
			}
			if (typeof scope === 'undefined') {
				return false;
			}
			if (
				typeof scope[column.field] !== 'undefined'
				|| scope.hasOwnProperty(column.field)
			) {
				column.isParentScopeKey = true;
			}
			return column.isParentScopeKey || false;
		}

		function isItemKey(item) {
			if (column.isItemKey === true) {
				return true;
			}
			if (typeof item === 'undefined') {
				return false;
			}
			if (
				typeof item[column.field] !== 'undefined'
				|| item.hasOwnProperty(column.field)
			) {
				column.isItemKey = true;
			}
			return column.isItemKey || false;
		};

		function hasFilter() {
			return (typeof column.cellFilter === 'string' && column.cellFilter.length > 0);
		};

		var $rawValueGetter;
		column.getRawValue = function(item, scope) {
			if (isItemKey(item)) {
				return item[this.field];
			}
			if (isScopeKey(scope)) {
				return scope[this.field];
			}
			if (isParentScopeKey(grid.$scope)) {
				return grid.$scope[this.field];
			}

			if (typeof $rawValueGetter !== 'function') {
				$rawValueGetter = grid.$parse(this.field);
			}
			return $rawValueGetter(item, grid.$scope);
		};

		var $filteredValueGetter;
		column.getFilteredValue = function(item, scope) {
			if (!hasFilter()) {
				return this.getRawValue(item, scope);
			}
			if (typeof $filteredValueGetter !== 'function') {
				$filteredValueGetter = grid.$parse(this.field + ' | ' + this.cellFilter);
			}
			return $filteredValueGetter(item, scope);
		};

		column.getLongestValue = function() {
			var longestVal = this.displayName;

			if (!grid._data || !grid._data.length) {
				return longestVal;
			}

			var length = grid._data.length;
			var rowsToCheck = 20;
			var halfOfRows = rowsToCheck / 2;

			var checkValue = function(item) {
				var value = column.getFilteredValue(item);
				if (value === null || typeof value === 'undefined' || typeof value.toString === 'undefined') {
					return;
				}
				var stringVal = value.toString();
				if (stringVal.length > longestVal.length) {
					longestVal = stringVal;
				}
			};

			for (var x = 0, l = Math.min(length, halfOfRows); x < l; ++x) {
				checkValue(grid._data[x]);
			}

			if (length > halfOfRows) {
				for (var x = length - 1; x > length - halfOfRows - 1; --x) {
					checkValue(grid._data[x]);
				}
			}
			return longestVal;
		};

		column.getClassName = function() {
			return 'mf-grid-column-' + this.index;
		};

		column.getHeaderClassName = function() {
			var className = this.getClassName();
			if (this.headerClass) {
				className += ' ' + this.headerClass;
			}
			return className;
		};

		column.getCellClassName = function() {
			var className = this.getClassName();
			if (this.cellClass) {
				className += ' ' + this.cellClass;
			}
			if (grid.rowClick === null) {
				className += ' grid-column-no-hover';
			}
			return className;
		};

		column.getWidth = function() {
			if (typeof this.width === 'number') {
				this.width += 'px';
			} else if (typeof this.width === 'undefined' || this.width === 'auto') {
				var longestVal = this.getLongestValue();
				if (null !== longestVal && typeof longestVal !== 'undefined' && longestVal.length > 0) {
					var font = $('#' + grid.getCssPrefix() + ' .grid-body-content').css('font');
					this.width = getStringWidth(longestVal, font) + 28 + 'px';
				}
			}

			return this.width;
		};

		return column;
	},
	setColumns: function(columnDefs) {
		this.enabledColumns = [];
		this.columns = [];
		if (columnDefs && columnDefs.length) {
			for (var i = 0, l = columnDefs.length; i < l; ++i) {
				var column = this.buildColumn(columnDefs[i]);
				column.index = i;
				this.columns.push(column);
				if (column.visible) {
					this.enabledColumns.push(column);
				}
			}
		} else if (this._data.length > 0) {
			var x = 0;
			for (var col in this._data[0]) {
				var column = this.buildColumn(col);
				column.index = x;
				this.columns.push(column);
				this.enabledColumns.push(column);
				++x;
			}
		}
	},
	getCssPrefix: function() {
		return 'mf-grid-' + this._id;
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
				continue;
			}
			if (
				this.trackItemBy !== null
				&& typeof this.trackItemBy === 'string'
				&& typeof item[this.trackItemBy] !== 'undefined'
			) {
				for (var i = 0, len = data.length; i < len; ++i) {
					var newItem = data[i];
					if (newItem === null || typeof newItem === 'undefined') {
						continue;
					}
					if (item[this.trackItemBy] === newItem[this.trackItemBy]) {
						newSelectedItems.push(newItem);
						break;
					}
				}
			}
		}
		this.selectedItems = newSelectedItems;
		this.updateCheckAll();

		this.setColumns(this.columnDefs);

		if (resort && typeof this.headerColumnClick !== 'function' && this.sortColumn) {
			this.sortByColumn(this.sortColumn, this.sortAsc);
		}

		this.updateVisibleItems();
	}
};

angular.module('mfGrid', [])

.controller('MfGridCtrl', ['$parse', function($parse) {
	return new MfGridCtrl($parse);
}])

/**
 * Directives
 */
.directive('mfGrid', ['$http', '$templateCache', '$compile', '$parse', '$timeout', '$window', function($http, $templateCache, $compile, $parse, $timeout, $window) {

	function linker(scope, $el, attrs, grid) {

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

		function debounce(func, wait, immediate) {
			var timeout;
			return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		}

		function renderTo($element, template) {
			$element.prepend(template);
			$compile($element.contents())(scope);
		}

		var $ = angular.element,
			$headerViewport = $el.find('.grid-header'),
			$headerContent = $headerViewport.find('.grid-header-content'),
			$bodyViewport = $el.find('.grid-body'),
			bodyViewportElement = $bodyViewport[0],
			$bodyViewportContent = $el.find('.grid-body-viewport-content'),
			$bodyContent = $el.find('.grid-body-content'),
			$dataGetter = $parse(typeof grid.data === 'string' ? grid.data : 'grid.data'),
			$dataScope = typeof grid.data === 'string' ? scope.$parent : scope,
			scrollBarWidth = getScrollBarWidth(),
			scrollContainer = window,
			$win = $($window);

		if (!bodyViewportElement) {
			throw new Error('.grid-body not found.');
		}

		if (!grid.rowTemplateUrl && !grid.rowTemplate) {
			grid.rowTemplate = defaultRowTemplate;
		}
		if (grid.rowTemplate) {
			renderTo($bodyContent, grid.rowTemplate);
		} else {
			$http.get(grid.rowTemplateUrl, { cache: $templateCache }).success(function(html) {
				renderTo($bodyContent, html);
			});
		}

		if (!grid.headerRowTemplateUrl && !grid.headerRowTemplate) {
			grid.headerRowTemplate = defaultHeaderRowTemplate;
		}
		if (grid.headerRowTemplate) {
			renderTo($headerContent, grid.headerRowTemplate);
		} else {
			$http.get(grid.headerRowTemplateUrl, { cache: $templateCache }).success(function(html) {
				renderTo($headerContent, html);
			});
		}

		grid.rowHeight = parseInt(grid.rowHeight, 10) || 50;

		scope.$watchCollection(function(){
			return $dataGetter($dataScope);
		}, function(rows) {
			grid.setData(rows);
			updateLayout();
			scope.$broadcast('mf-grid-data-change', rows);
		});

		scope.$watchCollection('grid.columnDefs', function(newColumns, oldColumns) {
			grid.setColumns(newColumns);
			updateCss();
		});

		scope.$watchCollection('grid.selectedItems', function(){
			grid.updateCheckAll();

			if (grid.afterSelectionChange) {
				grid.afterSelectionChange(grid.selectedItems);
			}

			scope.$broadcast('mf-grid-selection-change', grid.selectedItems);
		});

		scope.$watch('grid.multiSelect', function(){
			grid.updateCheckAll();
		});

		grid.scrollToItem = function(item, duration) {
			duration = duration || 0;
			$timeout(function(){
				var index = grid._data.indexOf(item);
				if (index === -1) {
					return;
				}

				$(scrollContainer).animate({
					scrollTop: index * grid.rowHeight
				}, duration);
			});
		};

		var isWindow = false;

		var updateHeaderHeight = function() {
			// get the grid option explicitly setting the header height
			if (grid.headerRowHeight === 0 || grid.headerRowHeight === '0px' || grid.showHeaderRow === false) {
				grid.showHeaderRow = false;
				bodyViewportElement.style.marginTop = '0px';
				return;
			}

			// auto calculate
			if (typeof grid.headerRowHeight === 'undefined' || grid.headerRowHeight === 'auto' || grid.headerRowHeight === null) {
				grid.headerRowHeight = 'auto';
				$headerViewport.removeClass('ng-hide').show();
				var offset = $headerViewport[0].offsetHeight;
				bodyViewportElement.style.marginTop = offset + 'px';
				return;
			}

			// explicit integer value
			var headerRowHeight = parseInt(grid.headerRowHeight, 10);
			if (isNaN(headerRowHeight)) {
				grid.showHeaderRow = false;
				bodyViewportElement.style.marginTop = '0px';
				return;
			}
			// get the "row" of "columns" inside the main header element
			var $headerRow = $headerViewport.find('.grid-row');
			if ($headerRow.length !== 0) {
				$headerRow[0].style.height = headerRowHeight + 'px';
				bodyViewportElement.style.marginTop = headerRowHeight + 'px';
			}
		};

		var updateHeight = function() {
			if (typeof grid.height !== 'undefined' && grid.height !== '' && grid.height !== null) {
				$el.css('height', grid.height);
			}

			// make content match grid height
			if ($el.isAutoHeight()) {
				scrollContainer = window;
				isWindow = true;
				$bodyViewport.css('position', 'static');
			} else {
				scrollContainer = bodyViewportElement;
				isWindow = false;
				$bodyViewport.css({
					position: 'absolute',
					top: 0,
					bottom: 0,
					left: 0,
					right: 0
				});
				$headerViewport.css({
					position: '',
					top: '',
					left: '',
					width: ''
				});
			}
		};

		var checkScrollbar = function() {
			// detect scrollbar
			if (bodyViewportElement.scrollHeight > bodyViewportElement.offsetHeight) {
				scope.scrollbarWidth = scrollBarWidth;
			} else {
				scope.scrollbarWidth = 0;
			}
			$headerViewport.css('margin-right', scope.scrollbarWidth + 'px');
		};

		scope.css = '';
		var updateCss = function() {
			var prefix = '#' + grid.getCssPrefix();
			var entries = [];
			var columns = grid.columns;
			var elementWidth = $el[0].offsetWidth;

			if (columns && columns.length) {
				for (var i = 0, l = columns.length; i < l; ++i) {
					var column = columns[i];
					var width = column.getWidth();
					if (width.indexOf('%') !== -1) {
						var percent = width.trim().replace('%', '') / 100;
						width = Math.floor(percent * elementWidth) + 'px';
					}

					entries.push(prefix + ' .' + column.getClassName() + ' {\n\
	width: ' + width + ';\n\
	}');
				}
			}

			var styleContainer = $('#mf-grid-' + grid._id + '-style')[0];
			styleContainer.innerHTML = '<style>' + entries.join('\n') + '</style>';
		};

		var updateLayout = debounce(function() {
			updateHeaderHeight();
			updateHeight();
			checkScrollbar();

			// detect visible height of grid
			var viewportHeight;
			if (isWindow) {
				viewportHeight = $win.height();
				var top = $el.offset().top - window.scrollY;
				if (top > 0) {
					viewportHeight -= top;
				}
			} else {
				viewportHeight = bodyViewportElement.offsetHeight;
			}
			grid.setViewportHeight(viewportHeight);

			updateCss();

			scope.$digest();
		}, 20);

		scope.$watch(function() {
			return [
				grid.height,
				grid.showHeaderRow,
				grid.headerRowHeight,
				$headerViewport[0].offsetHeight,
				$el[0].offsetHeight,
				$el.isAutoHeight()
			].join('|');
		}, updateLayout);

		$win.on('resize', updateLayout);

		scope.$watch('grid.totalHeight', debounce(function(height){
			if (typeof height === 'undefined' || height === null) {
				return;
			}
			$bodyViewportContent.css('height', height + 'px');
		}, 50));

		scope.headerColumnClick = function(column, index) {
			if (!grid.enableSorting) {
				return;
			}

			if (grid.sortColumn && column && grid.sortColumn.field === column.field) {
				grid.sortAsc = !grid.sortAsc;
			} else {
				grid.sortAsc = true;
			}
			grid.sortColumn = column;

			if (typeof grid.headerColumnClick === 'function') {
				grid.headerColumnClick(typeof column.value === 'string' ? column.value : column, index, grid.sortAsc);
			} else {
				grid.sortByColumn(column, grid.sortAsc);
			}
		};

		function updateOffsetTop() {
//			$bodyContent[0].style.marginTop = grid.pixelsBefore + 'px';

			// translate3d seems to render better for Safari
			$bodyContent[0].style.transform = 'translate3d(0px,' + grid.pixelsBefore + 'px, 0px)';
			$bodyContent[0].style['-webkit-transform'] = 'translate3d(0px,' + grid.pixelsBefore + 'px, 0px)';
			$bodyContent[0].style['-moz-transform'] = 'translate3d(0px,' + grid.pixelsBefore + 'px, 0px)';
			$bodyContent[0].style['-ms-transform'] = 'translate3d(0px,' + grid.pixelsBefore + 'px, 0px)';
		}

		scope.$watch('grid.pixelsBefore', updateOffsetTop);
		scope.$watch('grid.itemsBefore', function(itemsBefore) {
			scope.$broadcast('mf-grid-items-before-change', itemsBefore);
		});

		var onScroll = function() {
			$headerViewport[0].scrollLeft = bodyViewportElement.scrollLeft;

			var oldPixelsBefore = grid.pixelsBefore,
				oldVisibleItems = grid.visibleItems.length,
				scrollTop;

			if (isWindow) {
				scrollTop = Math.max(0, window.scrollY - $el.offset().top);

				if (scrollTop > 0 && grid.pinHeaderRow) {
					$headerViewport.css({
						position: 'fixed',
						top: 0,
						left: $bodyViewport.offset().left,
						width: $bodyViewport.width()
					});
				} else {
					$headerViewport.css({
						position: '',
						top: '',
						left: '',
						width: ''
					});
				}
			} else {
				scrollTop = bodyViewportElement.scrollTop;
			}

			grid.setScrollTop(scrollTop);

			if (grid.pixelsBefore === oldPixelsBefore && grid.visibleItems.length === oldVisibleItems) {
				return;
			}

			updateOffsetTop();
			scope.$digest();
		};

		bodyViewportElement.addEventListener('scroll', onScroll);
		bodyViewportElement.addEventListener('touchmove', onScroll);
		bodyViewportElement.addEventListener('gesturechange', onScroll);

		var windowScroll = debounce(function() {
			if (!isWindow) {
				return;
			}
			onScroll();
		}, 10);
		$win.on('scroll', windowScroll);

		function getItem($checkbox) {
			var scope = $checkbox.closest('.grid-row').scope();
			if (!scope) {
				return;
			}
			return scope.item;
		}

		$headerViewport.on('click', 'input.check-all', function() {
			grid.selectAll(this.checked);
			scope.$apply();
		});

		$bodyContent.on('click', '.grid-column', function(e) {
			if ($(e.target).is('input:checkbox')) {
				return;
			}

			var $this = $(this),
				item = getItem($this);

			if (!item) {
				return;
			}
			if ($this.is('.grid-checkbox-column')) {
				e.stopImmediatePropagation();
				grid.selectItem(item, !grid.isItemSelected(item), e);
			} else {
				if (grid.rowClick) {
					grid.rowClick(item, grid._data.indexOf(item), e);
				}
			}

			scope.$apply();
		});

		$bodyContent.on('click', 'input:checkbox', function(e) {
			e.stopImmediatePropagation();

			grid.selectItem(getItem(angular.element(this)), this.checked, e);
			scope.$apply();
		});

		scope.$on('$destroy', function() {
			// window event
			try {
				$win.off('resize', updateLayout);
				$win.off('scroll', windowScroll);
			} catch (e) {}

			// scope methods
			scope.headerColumnClick = null;

			// grid properties
			grid._data = null;
			grid.selectedItems = null;
			grid.visibleItems = null;
			grid.columns = null;
			grid.columnDefs = null;
			grid.enabledColumns = null;
			grid.$parse = null;
			grid.$scope = null;

			// references to grid
			grid = null;
			scope.grid = null;

			// dom elements
			$el = null;
			$headerViewport = null;
			$headerContent = null;
			$bodyViewport = null;
			bodyViewportElement = null;
			$bodyViewportContent = null;
			$bodyContent = null;
			scope = null;
        });
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
			grid.$scope = scope.$parent;

			linker(scope, $el, attrs, grid);
		}
	};
}])

.directive('mfGridRow', [function() {
	return {
		restrict: 'A',
		link: function(scope, $el) {
			var grid = scope.grid;
			$el[0].style.height = grid.rowHeight + 'px';

			// odd or even row coloring class
			scope.rowClass = {};
			if (scope.$index % 2 === 0) {
				$el.addClass('grid-row-odd');
			} else {
				$el.addClass('grid-row-even');
			}

			// row select state
			var checkSelection = function() {
				var oldValue = scope.isSelected;
				var isSelected = scope.isSelected = grid.isItemSelected(scope.item);

				if (oldValue !== isSelected) {
					$el[isSelected ? 'addClass' : 'removeClass']('grid-row-selected');
				}
			};
			checkSelection();
			scope.$on('mf-grid-selection-change', checkSelection);

			// row index out of all rows
			var updateIndex = function() {
				scope.itemIndex = (grid.itemsBefore || 0) + scope.$index;
			};
			scope.$on('mf-grid-items-before-change', updateIndex);
			scope.$on('mf-grid-items-before-change', checkSelection);
			updateIndex();
		}
	};
}])

.directive('mfGridColumn', [function() {
	return {
		restrict: 'A',
		link: function(scope, $el) {
			var el = $el[0];
			el.className += ' ' + scope.column.getCellClassName();

			var oldValue = '';
			var updateValue = function() {
				var value = scope.column.getFilteredValue(scope.item, scope.$parent);
				if (value === null || typeof value === 'undefined') {
					value = '';
				}
				if (value !== oldValue) {
					el.textContent = oldValue = value;
				}
			};

			scope.$watch(updateValue, function() {
				// noop
			});
		}
	};
}]);

})();
