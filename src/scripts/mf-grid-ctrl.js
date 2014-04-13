(function(){

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

MfGridCtrl.prototype = {
	_data: null,
	columnDefs: null,
	showSelectionCheckbox: true,
	enabledColumns: null,
	selectedItems: null,
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
		this.allItemsSelected = this._data.length === this.selectedItems.length;
	},
	selectItem: function(item, selected) {
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
}]);

})();