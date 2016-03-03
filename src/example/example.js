'use strict';

angular.module('app', [
	'mfGrid'
])

.controller('MainCtrl', ['$scope', function($scope) {

	$scope.data = [];

	$scope.layout =  {
		inline: false
	};

	$scope.data.push({});
	var now = new Date().getTime();

	var names = [
		'Dan',
		'David',
		'Corie',
		'Cole',
		'Nathan',
		'Brandon',
		'Jaime',
		'Frank',
		'Joe',
		'Billy'
	];
	for (var x = 0; x < 10000; ++x) {
		$scope.data.push({
			foo: 'bar' + x,
			bar: x,
			name: names[x % names.length],
			time: new Date(now + x)
		});
	}
	$scope.dateFormat = 'd/M H:m:s.sss';

	function reverse(s) {
		var o = '';
		for (var i = s.length - 1; i >= 0; i--)
			o += s[i];
		return o;
	}

	$scope.gridOpts = {
		data: 'data | filter : filterText',
		selectedItems: [
			$scope.data[2],
			$scope.data[5]
		],
		showSelectionCheckbox: true,
		rowHeight: 35,
		multiSelect: true,
		enableSorting: true,
//		showHeaderRow: true,
//		headerRowHeight: 35,
		virtualizationThreshold: 50,
		virtualizationOverflow: 4,
		virtualizationInterval: 2,
		afterSelectionChange: function(selectedItems) {
			console.log('afterSelectionChange(selectedItems)', selectedItems);
		},
		headerColumnClick: function(column, index, asc) {
			console.log('headerColumnClick(column, index, asc)', column, index, asc);
			this.sortByColumn(column, asc);
		},
		rowClick: function(item, itemIndex) {
			console.log('rowClick(item, itemIndex)', item, itemIndex);
			item.name = reverse(item.name);
		},
		columnDefs: [
			{ displayName: 'Index', field: 'itemIndex', cellFilter: 'number : 0', width: '75px', cellClass: 'custom-cell-class' },
			{ displayName: 'Foo', field: 'foo' },
			{ displayName: 'Bar', field: 'bar' },
			{ displayName: 'Name', field: 'name' },
			{ displayName: 'Foo', field: 'foo' },
			{ displayName: 'Bar', field: 'bar', width: '75px' },
			{ displayName: 'Name', field: 'name', width: '100px' },
			{ displayName: 'Foo', field: 'foo', width: '75px' },
			{ displayName: 'Bar', field: 'bar', width: '75px' },
			{ displayName: 'Name', field: 'name', width: '100px' },
			{ displayName: 'scope.dateFormat', field: 'dateFormat' },
			{ displayName: 'Date + dateFormat', field: 'time', width: '200px', cellFilter: "date : dateFormat" },
			{ displayName: 'Date + cellFilter Format', field: 'time', width: '200px', cellFilter: "date : 'd/M H:m:s.sss'" }
		]
	};

}]);

;