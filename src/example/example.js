'use strict';

angular.module('app', [
	'mfGrid'
])

.controller('MainCtrl', ['$scope', function($scope) {

	$scope.data = [];

	$scope.data.push({});
	var now = new Date().getTime();

	var names = [
		'Dan',
		'David',
		'Corie',
		'Cole',
		'Nathan',
		'Brandon',
		'Jaime'
	];
	for (var x = 0; x < 10000; ++x) {
		$scope.data.push({
			foo: 'bar' + x,
			bar: x,
			name: names[x % names.length],
			time: new Date(now + x)
		});
	}

	$scope.gridOpts = {
		data: 'data | filter:filterText',
		selectedItems: [
			$scope.data[2],
			$scope.data[5]
		],
		showSelectionCheckbox: true,
		rowHeight: 35,
		multiSelect: true,
		enableSorting: true,
		headerRowHeight: 35,
		virtualizationThreshold: 50,
		virtualizationOverflow: 2,
		afterSelectionChange: function(selectedItems) {
			console.log('afterSelectionChange(selectedItems)', selectedItems);
		},
		headerColumnClick: function(column, index, asc) {
			console.log('headerColumnClick(column, index, asc)', column, index, asc);
			this.sortByColumn(column, asc);
		},
		rowClick: function(item, itemIndex) {
			console.log('rowClick(item, itemIndex)', item, itemIndex);
		},
		columnDefs: [
			{ displayName: 'Index', field: 'itemIndex', width: '75px', cellClass: 'custom-cell-class' },
			{ displayName: 'Foo', field: 'foo', width: '75px' },
			{ displayName: 'Bar', field: 'bar', width: '75px' },
			{ displayName: 'Name', field: 'name', width: '100px' },
			{ displayName: 'Foo', field: 'foo', width: '75px' },
			{ displayName: 'Bar', field: 'bar', width: '75px' },
			{ displayName: 'Name', field: 'name', width: '100px' },
			{ displayName: 'Foo', field: 'foo', width: '75px' },
			{ displayName: 'Bar', field: 'bar', width: '75px' },
			{ displayName: 'Name', field: 'name', width: '100px' },
			{ displayName: 'Date Formatted', field: 'time', width: '200px', cellFilter: "date : 'd/M H:m:s.sss'" }
		]
	};

}]);

;