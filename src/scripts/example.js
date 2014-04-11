'use strict';

angular.module('app', [
	'mf-grid'
])

.controller('MainCtrl', function($scope) {

	$scope.data = [];

	$scope.data.push({});
	var now = new Date().getTime();

	for (var x = 0; x < 10000; ++x) {
		$scope.data.push({
			foo: 'bar' + x,
			bar: x,
			time: new Date(now + x)
		});
	}

	$scope.gridOpts = {
		data: 'data',
		selectedItems: [
			$scope.data[0],
			$scope.data[1]
		],
		showSelectionCheckbox: true,
		rowHeight: 35,
		enableSorting: true,
		headerRowHeight: 50,
		selectionChanged: function(selectedItems) {
			console.log('selectionChanged(selectedItems)', selectedItems);
		},
		headerColumnClick: function(column, index, asc) {
			console.log('headerColumnClick(column, index, asc)', column, index, asc);
			this.sortByColumn(column, asc);
		},
		rowClick: function(item, itemIndex) {
			console.log('rowClick(item, itemIndex)', item, itemIndex);
		},
		columnDefs: [
			{ displayName: 'Index', field: 'itemIndex', width: '50px' },
			{ displayName: 'Foo', field: 'foo', width: '50px' },
			{ displayName: 'Bar', field: 'bar', width: '50px' },
			{ displayName: 'Time', field: 'time', width: '200px', cellFilter: "date : 'd/M H:m:s.sss'" }
		]
	};

});

;