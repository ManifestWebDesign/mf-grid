(function(){

Array.prototype.remove = Array.prototype.remove || function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

var MfGridCtrl = function MfGridCtrl($parse, $interpolate) {
	this.options = {};
	this.$parse = $parse;
	this.$interpolate = $interpolate;
	this.data = [];
	this.enabledColumns = [];
	this.selectedItems = [];
	this.visibleData = [];
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

MfGridCtrl.prototype = {
	options: null,
	data: null,
	enabledColumns: null,
	selectedItems: null,
	allItemsSelected: false,
	$parse: null,
	visibleData: null,
	itemsBefore: 0,
	itemsAfter: 0,
	pixelsBefore: 0,
	height: 0,
	headerRowHeight: 0,
	scrollTop: 0,
	sortColumn: null,
	oldLength: 0,
	getColumnValueRaw: function (item, column, scope) {
		if (typeof column.valueRaw === 'string') {
			return item[column.valueRaw];
		}
		return column.valueRaw(scope || {}, item);
	},
	getColumnValue: function (item, column, scope) {
		if (typeof column.valueFiltered === 'undefined') {
			return this.getColumnValueRaw(item, column, scope);
		}
		if (typeof column.valueFiltered === 'string') {
			return item[column.valueFiltered];
		}
		return column.valueFiltered(item);
	},
	sortByColumn: function(column) {
		var grid = this;
		if (this.sortColumn === column) {
			this.data.reverse();
			return;
		}
		this.sortColumn = column;

		var sortFn = column.sortFn;

		this.data.sort(function(a, b) {
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
		return this.options.enableSorting && column.sortable;
	},
	getCheckboxColumnWidth: function() {
		return '30px';
	},
	getColumnStyle: function (column) {
		return { width: column.width };
	},
	setHeight: function(height) {
		this.height = height;
		this.updateVisibleItems();
	},
	setHeaderRowHeight: function(height) {
		this.headerRowHeight = height;
		this.updateVisibleItems();
	},
	setScrollTop: function(scrollTop) {
		this.scrollTop = scrollTop;
		this.updateVisibleItems();
	},
	setVisibleItems: function(visibleItems) {
		for (var x = 0, l = visibleItems.length; x < l; ++x) {
			if (typeof this.visibleData[x] === 'undefined') {
				this.visibleData[x] = {};
			}
			this.visibleData[x].item = visibleItems[x];
		}
		this.visibleData.length = visibleItems.length;
	},
	updateVisibleItems: function() {
		var rowHeight = this.options.rowHeight,
			height = this.height,
			totalItems = this.data.length,
			maxVisibleItems = Math.ceil(height / rowHeight);

		this.totalHeight = totalItems * rowHeight;

		if (totalItems <= maxVisibleItems) {
			this.pixelsAfter = this.itemsBefore = this.pixelsBefore = this.itemsAfter = 0;
			this.setVisibleItems(this.data);
			return;
		}

		var bleed = 5;

		var scrollTop = Math.max(this.scrollTop, 0),
			itemsBefore = Math.floor(scrollTop / rowHeight),
			adjustment = Math.min(bleed, itemsBefore);

		this.itemsBefore = itemsBefore - adjustment;
		this.pixelsBefore = this.itemsBefore * rowHeight;

		var end = Math.min(this.itemsBefore + maxVisibleItems + (bleed + adjustment), totalItems);

		this.itemsAfter = totalItems - end;
		this.pixelsAfter = this.itemsAfter * rowHeight;

		this.setVisibleItems(this.data.slice(this.itemsBefore, end));
	},
	isItemSelected: function(item) {
		return this.selectedItems.indexOf(item) !== -1;
	},
	updateCheckAll: function(){
		this.allItemsSelected = this.data.length === this.selectedItems.length;
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
		for (var i = 0, l = this.data.length; i < l; ++i) {
			this.selectedItems.push(this.data[i]);
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
				valueRaw: columnDef
			};
		} else {
			if (
				typeof columnDef.cellFilter !== 'undefined'
				&& columnDef.cellFilter.length > 0
				&& typeof columnDef.valueFiltered === 'undefined'
			) {
				columnDef.valueFiltered = this.$interpolate('{{ ' + columnDef.field + ' | ' + columnDef.cellFilter + ' }}');
			}

			if (
				typeof columnDef.valueRaw === 'undefined'
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
		var resort = this.data !== data || this.oldLength !== data.length;

		this.data = data || [];
		this.oldLength = data.length;
		this.selectedItems = [];
		this.allItemsSelected = false;
		this.enabledColumns = [];

		var columns = this.options.columns || this.options.columnDefs;

		if (columns) {
			for (var i = 0, l = columns.length; i < l; ++i) {
				var column = this.buildColumn(columns[i]);

				if (
					this.options.ignoreColumns
					&& this.options.ignoreColumns.hasOwnProperty(column.field)
				) {
					continue;
				}

				this.enabledColumns.push(column);
			}
		} else {
			if (data && data.length > 0) {
				for (var col in data[0]) {
					this.enabledColumns.push(this.buildColumn(col));
				}
			}
		}

		if (resort && this.sortColumn) {
			this.sortByColumn(this.sortColumn);
		}

		this.updateVisibleItems();
	}
};

angular.module('mf-grid', [])

.controller('MfGridCtrl', ['$parse', '$interpolate', function($parse, $interpolate) {
	return new MfGridCtrl($parse, $interpolate);
}]);

})();