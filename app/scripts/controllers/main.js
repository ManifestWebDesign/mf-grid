'use strict';

angular.module('app')

.controller('MainCtrl', function($scope) {

	$scope.gridOpts = {
		data: 'data',
		showSelectionCheckbox: true,
		rowHeight: 30,
		headerRowHeight: 50,
		columns: [
			{ name: 'Index', value: 'gridIndex' },
			'foo'
		]
	};

	$scope.data = [];

	for (var x = 0; x < 5000; ++x) {
		$scope.data.push({
			foo: 'bar' + x
		});
	}

});