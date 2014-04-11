(function(){

var defaultHeaderRowTemplate = '<tr class="grid-row">'
+ '<th'
+ ' ng-if="grid.options.showSelectionCheckbox"'
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
+ ' ng-if="grid.options.showSelectionCheckbox"'
+ ' ng-style="{ width: grid.getCheckboxColumnWidth() }"'
+ ' class="grid-column">'
+ '<input'
+ ' name="{{ grid.options.selectionCheckboxInputName }}"'
+ ' value="{{ row.item[grid.options.selectionCheckboxInputValue] }}"'
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

		grid.options.rowHeight = parseInt(grid.options.rowHeight, 10) || 50;

		scope.$watchCollection(grid.options.data, function(r) {
			grid.setData(r);
		});

		scope.$watchCollection(function(){
			return grid.options.columns || grid.options.columnDefs;
		}, function(r) {
			grid.setData(grid.data);
		});

		scope.$watchCollection('grid.selectedItems', function(){
			grid.updateCheckAll();
			if (grid.options.selectionChanged) {
				grid.options.selectionChanged(grid.selectedItems);
			}
		});

		function updateHeight() {
			grid.setHeight($el.height());
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

		scope.$watch('grid.options.height', function(height){
			if (height) {
				$el.height(height);
			}

			$timeout(function(){
				updateHeight();
			});
		});

		scope.$watch('grid.options.headerRowHeight', function(height){
			if (grid.options.headerRowHeight) {
				$header.find('.grid-row').height(height);
			}
			grid.setHeaderRowHeight($header.find('.grid-row').height());
			$viewPort.css({
				top: grid.options.headerRowHeight
			});
		});

		scope.headerColumnClick = function(column, index) {
			if (grid.options.headerColumnClick) {
				grid.options.headerColumnClick(typeof column.value === 'string' ? column.value : column, index);
			} else {
				grid.sortByColumn(column);
			}
		};

		scope.rowClick = function(item, itemIndex) {
			if (grid.options.rowClick) {
				grid.options.rowClick(item, itemIndex);
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

		if (!grid.options.rowTemplateUrl && !grid.options.rowTemplate) {
			grid.options.rowTemplate = defaultRowTemplate;
		}
		if (grid.options.rowTemplate) {
			$body.append($compile(grid.options.rowTemplate)(scope));
		} else {
			$http.get(grid.options.rowTemplateUrl, { cache: $templateCache }).success(function(html) {
				$body.append($compile(html)(scope));
			});
		}

		if (!grid.options.headerRowTemplateUrl && !grid.options.headerRowTemplate) {
			grid.options.headerRowTemplate = defaultHeaderRowTemplate;
		}
		if (grid.options.headerRowTemplate) {
			$header.find('thead').append($compile(grid.options.headerRowTemplate)(scope));
		} else {
			$http.get(grid.options.headerRowTemplateUrl, { cache: $templateCache }).success(function(html) {
				$header.find('thead').append($compile(html)(scope));
			});
		}
	};

	return {
		restrict: 'A',
		scope: true,
		replace: true,
		controller: 'MfGridCtrl',
		controllerAs: 'grid',
		templateUrl: 'views/mf-grid.html',
		link: function(scope, $el, attrs, grid) {
			var optionsName = attrs.mfGrid || attrs.mfGridTable,
				optsGetter = $parse(optionsName);

			grid.options = optsGetter(scope) || {};

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
					$el.find('.grid-column').height(grid.options.rowHeight);

					scope.$watch('grid.itemsBefore', function(itemsBefore){
						scope.itemIndex = itemsBefore + scope.$index;
					});
				}
			};
		}
	};
}]);

})();