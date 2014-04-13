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

angular.module('mf-grid')

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