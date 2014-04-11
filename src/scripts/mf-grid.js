(function(){

var defaultHeaderRowTemplate = '<tr class="grid-row">'
+ '<th'
+ ' ng-if="grid.showSelectionCheckbox"'
+ ' ng-style="{ width: grid.getCheckboxColumnWidth() }" resizable="false"'
+ ' class="grid-column">'
+ '<input'
+ ' ng-checked="grid.allItemsSelected"'
+ ' title="Select All"'
+ ' type="checkbox"'
+ ' class="check-all" />'
+ '</th>'
+ '<th'
+ ' ng-repeat="column in grid.enabledColumns"'
+ ' ng-style="grid.getColumnStyle(column)"'
+ ' ng-bind="column.displayName"'
+ ' ng-click="columnClick(column, $index)"'
+ ' class="grid-column">'
+ '<span'
+ ' ng-show="grid.sortColumn"'
+ ' class="grid-sort-icon icon-chevron-{{ search.dir ? \'down\' : \'up\' }}"></span>'
+ '</th>'
+ '</tr>';

var defaultRowTemplate = '<tr mf-grid-row'
+ ' ng-repeat="row in grid.visibleData"'
+ ' ng-click="rowClick(row.item, itemIndex)"'
+ ' class="grid-row">'
+ '<td'
+ ' ng-if="grid.showSelectionCheckbox"'
+ ' ng-style="{ width: grid.getCheckboxColumnWidth() }"'
+ ' class="grid-column">'
+ '<input'
+ ' name="{{ grid.selectionCheckboxInputName }}"'
+ ' value="{{ row.item[grid.selectionCheckboxInputValue] }}"'
+ ' ng-checked="grid.isItemSelected(row.item)"'
+ ' type="checkbox" />'
+ '</td>'
+ '<td'
+ ' ng-repeat="column in grid.enabledColumns"'
+ ' ng-style="grid.getColumnStyle(column)"'
+ ' ng-bind="grid.getColumnValue(row.item, column, $parent)"'
+ ' class="grid-column"></td></tr>';

angular.module('mf-grid')

.directive('mfGrid', ['$parse', '$http', '$templateCache', '$compile', '$timeout', '$window', function($parse, $http, $templateCache, $compile, $timeout, $window) {

	function linker(scope, $el, attrs, grid) {
		var $viewPort = $el.find('.grid-viewport'),
			$header = $el.find('.grid-header'),
			$body = $el.find('.grid-body'),
			viewPortElement = $el.find('.grid-viewport').get(0);

		grid.rowHeight = parseInt(grid.rowHeight, 10) || 50;

		scope.$watchCollection('$parent.' + grid.data, function(r) {
			grid.setData(r);
		});

		scope.$watchCollection('grid.columnDefs', function(oldColumns, newColumns) {
			if (oldColumns === newColumns) {
				return;
			}
			grid.setData(grid._data);
		});

		scope.$watchCollection('grid.selectedItems', function(){
			grid.updateCheckAll();

			if (grid.selectionChanged) {
				grid.selectionChanged(grid.selectedItems);
			}
		});

		function updateHeight() {
			grid.setViewportHeight($viewPort.height());
		}

		var $win = angular.element($window);
		function windowResize(){
			updateHeight();
			scope.$apply();
		}

		$win.on('resize', windowResize);
		scope.$on('$destroy', function() {
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

		scope.$watch('grid.headerRowHeight', function(height){
			if (grid.headerRowHeight) {
				$header.find('.grid-row').height(height);
			}
			grid.setHeaderRowHeight($header.find('.grid-row').height());
			$viewPort.css({
				top: grid.headerRowHeight
			});
		});

		scope.headerColumnClick = function(column, index) {
			if (grid.headerColumnClick) {
				grid.headerColumnClick(typeof column.value === 'string' ? column.value : column, index);
			} else {
				grid.sortByColumn(column);
			}
		};

		scope.rowClick = function(item, itemIndex) {
			if (grid.rowClick) {
				grid.rowClick(item, itemIndex);
			}
		};

		function updateScroll() {
			grid.setScrollTop(viewPortElement.scrollTop);
			scope.$apply();
		}

		$el.find('.grid-viewport').on('scroll', updateScroll);

		$header.on('click', 'input.check-all', function() {
			grid.selectAll(this.checked);
			scope.$apply();
		});

		function getItem($checkbox) {
			return $checkbox.closest('.grid-row').scope().row.item;
		}

		$body.on('click', '.grid-column', function(e) {
			if ($(e.target).is(':not(.grid-column)')) {
				return;
			}

			var $this = $(this),
				$checkboxes = $this.find('input:checkbox');

			if ($checkboxes.length > 0) {
				e.stopImmediatePropagation();
				grid.selectItem(getItem($checkboxes), !$checkboxes[0].checked);
			}
			scope.$apply();
		});

		$body.on('click', 'input:checkbox', function(e) {
			e.stopImmediatePropagation();

			grid.selectItem(getItem(angular.element(this)), this.checked);
			scope.$apply();
		});

		if (!grid.rowTemplateUrl && !grid.rowTemplate) {
			grid.rowTemplate = defaultRowTemplate;
		}
		if (grid.rowTemplate) {
			$body.append($compile(grid.rowTemplate)(scope));
		} else {
			$http.get(grid.rowTemplateUrl, { cache: $templateCache }).success(function(html) {
				$body.append($compile(html)(scope));
			});
		}

		if (!grid.headerRowTemplateUrl && !grid.headerRowTemplate) {
			grid.headerRowTemplate = defaultHeaderRowTemplate;
		}
		if (grid.headerRowTemplate) {
			$header.find('thead').append($compile(grid.headerRowTemplate)(scope));
		} else {
			$http.get(grid.headerRowTemplateUrl, { cache: $templateCache }).success(function(html) {
				$header.find('thead').append($compile(html)(scope));
			});
		}
	};

	return {
		restrict: 'A',
		scope: { grid: '=mfGrid' },
		replace: true,
		controller: 'MfGridCtrl',
		templateUrl: 'views/mf-grid.html',
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

.directive('mfGridRow', ['$compile', '$http', '$templateCache', function($compile, $http, $templateCache) {

	return {
		restrict: 'A',
		require: '^mfGrid',
		compile: function compile(tElement, tAttrs, transclude) {
			return {
				post: function(scope, $el, attrs, grid) {
					$el.find('.grid-column').height(grid.rowHeight);

					scope.$watch('grid.itemsBefore', function(itemsBefore){
						scope.itemIndex = itemsBefore + scope.$index;
					});
				}
			};
		}
	};
}]);

})();