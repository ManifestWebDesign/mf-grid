(function(){

var gridTemplate = '<div class="grid-container" ng-show="grid._data && grid._data.length">'
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
+ ' ng-style="{ width: column.width }"'
+ ' ng-class="{ \'grid-column-sortable\': grid.enableSorting }"'
+ ' ng-click="headerColumnClick(column, $index)"'
+ ' class="grid-column {{ column.headerClass }}">{{ column.displayName }}'
+ '<div'
+ ' ng-show="grid.enableSorting && grid.sortColumn && grid.sortColumn.field === column.field"'
+ ' class="grid-sort-icon glyphicon glyphicon-chevron-{{ grid.sortAsc ? \'up\' : \'down\' }} icon-chevron-{{ grid.sortAsc ? \'up\' : \'down\' }}"></div>'
+ '</div>'
+ '</div>';

var defaultRowTemplate = '<div'
+ ' mf-grid-row'
+ ' ng-repeat="item in grid.visibleItems track by $index"'
+ ' ng-class="rowClass"'
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

var gridId = 1;

var MfGridCtrl = function MfGridCtrl($parse) {
	this.id = gridId;
	gridId++;
	this.$parse = $parse;
	this._data = [];
	this.enabledColumns = [];
	this.selectedItems = [];
	this.visibleItems = [];
	this.columnDefs = [];
};

/**
 * Controller
 */
MfGridCtrl.prototype = {
	_data: null,
	afterSelectionChange: null,
	columnDefs: null,
	showSelectionCheckbox: false,
	showHeaderRow: true,
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
			height = this.viewportHeight,
			totalItems = this._data.length,
			maxVisibleItems = Math.ceil(height / rowHeight);

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
		this.visibleItems = this._data && typeof this._data.slice == 'function' ? this._data.slice(this.itemsBefore, end) : [];
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
			return $filteredValueGetter(item, grid.$scope);
		};

		column.getLongestValue = function() {
			if (!grid._data || !grid._data.length) {
				return null;
			}
			var longestVal = this.displayName;
			for (var x = 0, l = Math.min(grid._data.length, 50); x < l; ++x) {
				var item = grid._data[x];
				var value = this.getFilteredValue(item);
				if (value === null || typeof value === 'undefined' || typeof value.toString === 'undefined') {
					continue;
				}
				var stringVal = value.toString();
				if (stringVal.length > longestVal.length) {
					longestVal = stringVal;
				}
			}
			return longestVal;
		};

		if (typeof column.width === 'number') {
			column.width += 'px';
		} else if (typeof column.width === 'undefined' || column.width === 'auto') {
			var longestVal = column.getLongestValue();
			if (this._data && this._data.length > 0 && typeof longestVal != 'undefined' && longestVal.length > 0) {
				var font = $('.grid-body-content').css('font');
				column.width = getStringWidth(longestVal, font) + 28 + 'px';
			}
		}

		return column;
	},
	setColumns: function(columns) {
		this.enabledColumns = [];
		if (columns && columns.length) {
			for (var i = 0, l = columns.length; i < l; ++i) {
				var column = this.buildColumn(columns[i]);
				if (column.visible) {
					this.enabledColumns.push(column);
				}
			}
		} else if (this._data.length > 0) {
			for (var col in this._data[0]) {
				this.enabledColumns.push(this.buildColumn(col));
			}
		}
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

		var $headerViewport = $el.find('.grid-header'),
			$headerContent = $headerViewport.find('.grid-header-content'),
			$bodyViewport = $el.find('.grid-body'),
			bodyViewportElement = $bodyViewport[0],
			$bodyViewportContent = $el.find('.grid-body-viewport-content'),
			$bodyContent = $el.find('.grid-body-content'),
			$dataGetter = $parse(grid.data),
			scrollContainer = window;

		if (!bodyViewportElement) {
			throw new Error('.grid-body not found.');
		}

		function renderTo($element, template) {
			$element.prepend(template);
			$compile($element.contents())(scope);
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
			return $dataGetter(scope.$parent);
		}, function(r) {
			grid.setData(r);
			$timeout(function(){
				updateHeight();
			});
		});

		scope.$watchCollection('grid.columnDefs', function(newColumns, oldColumns) {
			grid.setColumns(newColumns);
		});

		scope.$watchCollection('grid.selectedItems', function(){
			grid.updateCheckAll();

			if (grid.afterSelectionChange) {
				grid.afterSelectionChange(grid.selectedItems);
			}
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

		function updateHeight() {
			var headerRowHeight = parseInt(grid.headerRowHeight, 10) || 0,
				$headerRow = $headerViewport.find('.grid-row');

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
			}

			if (!grid.showHeaderRow) {
				headerRowHeight = 0;
			}

			// header row height
			if ($headerRow.length !== 0) {
				$headerRow[0].style.height = headerRowHeight + 'px';
				bodyViewportElement.style.marginTop = $headerViewport[0].offsetHeight || headerRowHeight + 'px';
			} else {
				bodyViewportElement.style.marginTop = headerRowHeight + 'px';
			}

			// detect scrollbar width
			if (bodyViewportElement.scrollHeight > bodyViewportElement.offsetHeight) {
				scope.scrollbarWidth = getScrollBarWidth();
			} else {
				scope.scrollbarWidth = 0;
			}

			// detect visible height of grid
			var viewportHeight;
			if (isWindow) {
				viewportHeight = $(window).height();
				var top = $el.offset().top - window.scrollY;
				if (top > 0) {
					viewportHeight -= top;
				}
			} else {
				viewportHeight = bodyViewportElement.offsetHeight;
			}
			grid.setViewportHeight(viewportHeight);
		}

		scope.$watch(function(){
			return $el.height();
		}, updateHeight);

		var $win = angular.element($window);
		function windowResize(){
			updateHeight();
			scope.$digest();
		}
		$win.on('resize', windowResize);

		function windowScroll() {
			if (!isWindow) {
				return;
			}
			onScroll();
		}
		$win.on('scroll', windowScroll);

		scope.$on('$destroy', function() {
			var id = grid.id;

			// window event
			try {
				$win.off('resize', windowResize);
				$win.off('scroll', windowScroll);
			} catch (e) {}

			// scope methods
			scope.headerColumnClick = null;

			// grid properties
			grid._data = null;
			grid.selectedItems = null;
			grid.visibleItems = null;
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

		scope.$watch('grid.height', function(height){
			if (typeof height !== 'undefined' && height !== '' && height !== null) {
				$el.css('height', height);
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
			$timeout(function(){
				updateHeight();
			});
		});

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
			$bodyContent[0].style.marginTop = grid.pixelsBefore + 'px';
		}

		scope.$watch('grid.pixelsBefore', updateOffsetTop);

		function onScroll() {
			$headerViewport[0].scrollLeft = bodyViewportElement.scrollLeft;

			var oldPixelsBefore = grid.pixelsBefore,
				oldVisibleItems = grid.visibleItems.length,
				scrollTop;
			if (isWindow) {
				scrollTop = Math.max(0, window.scrollY - $el.offset().top);
			} else {
				scrollTop = bodyViewportElement.scrollTop;
			}

			grid.setScrollTop(scrollTop);
			updateOffsetTop();

			if (grid.pixelsBefore === oldPixelsBefore && grid.visibleItems.length === oldVisibleItems) {
				return;
			}

			scope.$digest();
		}
		bodyViewportElement.addEventListener('scroll', onScroll);
		bodyViewportElement.addEventListener('touchmove', onScroll);

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
		link: function(scope, $el, attrs) {
			var grid = scope.grid;
			$el[0].style.height = grid.rowHeight + 'px';

			scope.$watch(function(){
				return grid.itemsBefore;
			}, function(){
				var itemIndex = grid.itemsBefore + scope.$index;
				scope.itemIndex = itemIndex;
			});

			scope.rowClass = {};
			if (scope.$index % 2 === 0) {
				$el.addClass('grid-row-odd');
			} else {
				$el.addClass('grid-row-even');
			}

			scope.$watch(function(){
				return grid.isItemSelected(scope.item);
			}, function(isSelected){
				scope.isSelected = isSelected;
				scope.rowClass['grid-row-selected'] = isSelected;
			});
		}
	};
}])

.directive('mfGridColumn', [function() {
	return {
		restrict: 'A',
		link: function(scope, $el, attrs) {
			$el[0].style.width = scope.column.width;
			if (scope.column.cellClass) {
				$el[0].className += ' ' + scope.column.cellClass;
			}

			if (scope.grid.rowClick === null) {
				$el.addClass('grid-column-no-hover');
			}

			scope.$watch(function(){
				return scope.column.getFilteredValue(scope.item, scope.$parent);
			}, function(value){
				if (typeof value === 'undefined') {
					value = '';
				}
				$el[0].innerHTML = value;
			});
		}
	};
}]);

})();
