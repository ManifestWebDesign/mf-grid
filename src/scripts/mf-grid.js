(function(){

var defaultHeaderRowTemplate = '<tr class="grid-row">'
+ '<th ng-if="grid.showSelectionCheckbox" class="grid-column grid-checkbox-column">'
+ '<input ng-checked="grid.allItemsSelected" title="Select All" type="checkbox" class="check-all" />'
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

var defaultRowTemplate = '<tr mf-grid-row ng-repeat="row in grid.visibleItems" class="grid-row">'
+ '<td ng-if="grid.showSelectionCheckbox" class="grid-column grid-checkbox-column">'
//+ '<span ng-show="grid.isItemSelected(row.item)" class="glyphicon glyphicon-ok-circle icon-ok-circle"></span>'
+ '<input ng-checked="grid.isItemSelected(row.item)" type="checkbox" />'
+ '</td>'
+ '<td'
+ ' ng-repeat="column in grid.enabledColumns"'
+ ' ng-style="{ width: column.width }"'
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
		var $header = $el.find('.grid-header'),
			$viewPort = $el.find('.grid-viewport'),
			viewPortElement = $viewPort.get(0),
			$body = $viewPort.find('.grid-body'),
			$table = $viewPort.find('table');

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

		function updateHeight() {
			grid.setViewportHeight($viewPort.height());

			if (viewPortElement.scrollHeight > viewPortElement.offsetHeight) {
				scope.scrollbarWidth = getScrollBarWidth();
			} else {
				scope.scrollbarWidth = 0;
			}
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

		scope.rowClick = function(item, itemIndex) {
			if (grid.rowClick) {
				grid.rowClick(item, itemIndex);
			}
		};

		var prevScrollTop = 0;
		function updateScroll() {
			$header[0].scrollLeft = viewPortElement.scrollLeft;

			var newScrollTop = viewPortElement.scrollTop,
				bleed = Math.max(1, ~~(grid.virtualizationBleed / 2)),
				min = prevScrollTop - grid.rowHeight * bleed,
				max = prevScrollTop + grid.rowHeight * bleed;

			if (newScrollTop >= min && newScrollTop <= max) {
				return;
			}
			prevScrollTop = newScrollTop;

			grid.setScrollTop(newScrollTop);
			$table[0].style.top = grid.pixelsBefore + 'px';

			scope.$digest();
		}

		$viewPort[0].addEventListener('scroll', updateScroll);

		$header.on('click', 'input.check-all', function() {
			grid.selectAll(this.checked);
			scope.$apply();
		});

		function getItem($checkbox) {
			var scope = $checkbox.closest('.grid-row').scope();
			if (!scope) {
				return;
			}
			return scope.row.item;
		}

		$body.on('click', '.grid-column', function(e) {
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
				grid.selectItem(item, !grid.isItemSelected(item));
			} else {
				scope.rowClick(item, grid._data.indexOf(item));
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