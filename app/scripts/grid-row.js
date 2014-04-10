(function(){

angular.module('mf-grid')

.directive('mfGridRow', ['$compile', '$http', '$templateCache', function($compile, $http, $templateCache) {

	return {
		restrict: 'A',
		scope: true,
		replace: true,
		require: '^mfGrid',
		compile: function compile(tElement, tAttrs, transclude) {
			return {
				post: function(scope, $el, attrs, grid) {
					$el.height(grid.options.rowHeight);

					scope.$watch('grid.rowsBefore', function(rowBefore){
						scope.gridIndex = rowBefore + scope.$index;
					});

					if (grid.options.rowTemplate) {
						$el.append($compile(grid.options.rowTemplate)(scope));
					} else {
						$http.get(grid.options.rowTemplateUrl, { cache: $templateCache }).success(function(html) {
							$el.append($compile(html)(scope));
						});
					}
				}
			};
		}
	};
}]);

})();