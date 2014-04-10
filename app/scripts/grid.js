(function(){

var defaultRowTemplate = '<td'
+ ' ng-if="grid.options.showSelectionCheckbox"'
+ ' ng-style="{ width: grid.getCheckboxColumnWidth() }"'
+ ' class="column">'
+ '<input'
+ ' name="{{ grid.options.selectionCheckboxInputName }}"'
+ ' value="{{ row[grid.options.selectionCheckboxInputValue] }}"'
+ ' ng-checked="grid.isItemSelected(row.item)"'
+ ' type="checkbox" />'
+ '</td>'
+ '<td'
+ ' ng-repeat="column in grid.enabledColumns"'
+ ' ng-style="grid.getColumnStyle(column)"'
+ ' ng-bind="grid.getColumnValue(row.item, column, $parent)"'
+ ' class="column"></td>';

angular.module('mf-grid')

.directive('mfGrid', ['$parse', '$http', '$templateCache', '$compile', function($parse, $http, $templateCache, $compile) {

	function linker(scope, $el, attrs, grid) {
		var $viewPort = $el.find('.grid-viewport'),
			$header = $el.find('.grid-header'),
			$body = $el.find('.grid-body'),
			viewPortElement = $el.find('.grid-viewport').get(0);

		grid.options.rowHeight = parseInt(grid.options.rowHeight, 10) || 50;

		if (!grid.options.rowTemplateUrl && !grid.options.rowTemplate) {
			grid.options.rowTemplate = defaultRowTemplate;
		}

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

		scope.$watch('grid.options.height', function(height){
			if (!grid.options.height) {
				grid.options.height = height = 300;
			}
			$el.height(height);
			$viewPort.css({
				top: grid.options.headerRowHeight,
				height: height - grid.options.headerRowHeight
			});
			grid.setHeight($viewPort.height());
		});

		scope.$watch('grid.options.headerRowHeight', function(height){
			if (grid.options.headerRowHeight) {
				$header.find('.row').height(height);
			}
			grid.setHeaderRowHeight($header.find('.row').height());
		});

		scope.columnClick = function(column, index) {
			if (grid.options.columnClick) {
				grid.options.columnClick(typeof column.value === 'string' ? column.value : column, index);
			} else {
				grid.sortByColumn(column);
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

		$body.on('click', '.row', function() {
			if (grid.options.rowClick) {
				var scope = angular.element(this).scope();
				grid.options.rowClick(scope.row, scope.$index);
				scope.$apply();
			}
		});

		function getItem($checkbox) {
			return $checkbox.closest('.row').scope().row.item;
		}

		$body.on('click', '.column', function(e) {
			if ($(e.target).is(':not(.column)')) {
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
	};

	return {
		restrict: 'A',
		scope: true,
		replace: true,
		controller: 'MfGridCtrl',
		controllerAs: 'grid',
		templateUrl: 'views/grid.html',
		link: function(scope, $el, attrs, grid) {
			var optionsName = attrs.mfGrid || attrs.mfGridTable,
				optsGetter = $parse(optionsName);

			grid.options = optsGetter(scope) || {};
			linker(scope, $el, attrs, grid);

//			var templateUrl = grid.options.templateUrl || 'views/grid-table.html';
//			$http
//				.get(templateUrl, { cache: $templateCache })
//				.success(function(html) {
//					var $newEl = $compile(html)(scope);
//					$el.replaceWith($newEl);
//					linker(scope, $newEl, attrs, grid);
//				});
		}
	};
}]);

})();