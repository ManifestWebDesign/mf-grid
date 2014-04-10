(function(){

angular.module('mf-grid')

.directive('mfGridRow', ['$compile', '$http', '$templateCache', function($compile, $http, $templateCache) {

	return {
		restrict: 'A',
		scope: true,
		replace: true,
		require: '^mfGrid',
		link: function compile(scope, $el, attrs, grid) {

			$http.get(grid.options.rowTemplateUrl, { cache: $templateCache }).success(function(html) {

				var $newEl = $compile(html)(scope);
				$el.replaceWith($newEl);
				$newEl.height(grid.options.rowHeight);

				scope.$watch('grid.rowsBefore', function(rowBefore){
					scope.gridIndex = rowBefore + scope.$index;
				});

			});
		}
	};
}]);

})();