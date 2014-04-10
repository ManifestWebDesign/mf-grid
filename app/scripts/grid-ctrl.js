(function(){

Array.prototype.remove = Array.prototype.remove || function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

var MfGridCtrl = function MfGridCtrl($parse) {
	this.options = {};
	this.$parse = $parse;
	this.data = [];
	this.enabledColumns = [];
	this.selectedItems = [];
	this.visibleData = [];
};

MfGridCtrl.prototype = {
	options: null,
	data: null,
	enabledColumns: null,
	selectedItems: null,
	allItemsSelected: false,
	$parse: null,
	visibleData: null,
	rowsBefore: 0,
	pixelsBefore: 0,
	rowsAfter: 0,
	height: 0,
	headerRowHeight: 0,
	scrollTop: 0,
	getColumnValue: function (row, column, scope) {
		if (typeof column.value === 'string') {
			return row[column.value];
		}
		return column.value(scope || {}, row);
	},
	isItemSelected: function(item) {
		return this.selectedItems.indexOf(item) !== -1;
	},
	updateCheckAll: function(){
		this.allItemsSelected = this.data.length === this.selectedItems.length;
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
			totalRows = this.data.length,
			maxVisibleRows = Math.ceil(height / rowHeight);

		this.totalHeight = totalRows * rowHeight;

		if (totalRows <= maxVisibleRows) {
			this.pixelsAfter = this.rowsBefore = this.pixelsBefore = this.rowsAfter = 0;
			this.setVisibleItems(this.data);
			return;
		}

		var bleed = 5;

		var scrollTop = Math.max(this.scrollTop, 0),
			rowsBefore = Math.floor(scrollTop / rowHeight),
			adjustment = Math.min(bleed, rowsBefore);

		this.rowsBefore = rowsBefore - adjustment;
		this.pixelsBefore = this.rowsBefore * rowHeight;

		var end = Math.min(this.rowsBefore + maxVisibleRows + (bleed + adjustment), totalRows);

		this.rowsAfter = totalRows - end;
		this.pixelsAfter = this.rowsAfter * rowHeight;

		this.setVisibleItems(this.data.slice(this.rowsBefore, end));
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
	setData: function(data) {
		this.data = data || [];
		this.selectedItems = [];
		this.allItemsSelected = false;
		this.enabledColumns = [];

		var columns = this.options.columns || this.options.columnDefs;

		if (columns) {
			for (var i = 0, l = columns.length; i < l; ++i) {

				var colVal = columns[i];

				if (typeof colVal === 'string') {
					colVal = { name: colVal, value: colVal, orderBy: colVal };
				}

				if (
					this.options.ignoreColumns
					&& this.options.ignoreColumns.hasOwnProperty(colVal.value)
				) {
					continue;
				}

				if (typeof colVal.value === 'string') {
					colVal.value = this.$parse(colVal.value);
				}

				this.enabledColumns.push(colVal);
			}
		} else {
			if (data && data.length > 0) {
				for (var col in data[0]) {
					this.enabledColumns.push({ name: col, value: col, orderBy: col });
				}
			}
		}

		this.updateVisibleItems();
	}
};

angular.module('mf-grid', [])

.controller('MfGridCtrl', ['$parse', function($parse) {
	return new MfGridCtrl($parse);
}]);

})();