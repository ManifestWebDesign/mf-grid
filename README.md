#MF Grid
A simple fixed-header grid for Angular JS. mf-grid was created as a lightweight alternative to [NG Grid](http://angular-ui.github.io/ng-grid/).


## Installation
```bower install angular-mf-grid```

or

```git clone git@github.com:ManifestWebDesign/mf-grid```

## Usage
```
<!-- mf-grid has two dependencies jQuery and AngularJS -->
<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular.min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

<!-- dist files -->
<link rel="stylesheet" href="dist/mf-grid.min.css" />
<script src="dist/mf-grid.js"></script>
```

## Example

#### Controller
 ```javascript
"use strict";
angular.module("app", ["mfGrid"]).controller("MainCtrl", ["$scope",
	function($scope) {
		$scope.gridOpts = {
			data: 'results',
			headerRowHeight: 32,
			columnDefs: [
				{field: 'name', width: 110,	displayName: 'Name'},
				{field: "instrument === null ? '-' : instrument", width: 110, displayName: 'Instrument'}
			]
		};

		$scope.results = [
			{name: 'John',		instrument: 'Guitar'},
			{name: 'Paul',		instrument: 'Bass and Guitar'},
			{name: 'George',	instrument: 'Guitar'},
			{name: 'Ringo',		instrument: null}
		];
	}]);
```

#### View
 ```html
<h2>Band Members</h2>
<div mf-grid="gridOpts"></div>
```

## Options


Option |  Default Value | Definition
------ | -------------- | ---------
afterSelectionChange | null | Callback for when you want to validate something after selection.
columnDefs | undefined | Definitions of columns as an array []. If not defined columns are auto-generated from data.
data | [] | Data being displayed in the grid. Each item in the array is mapped to a row being displayed.
enableSorting | true | Enables or disables sorting in grid.
headerColumnClick | null | Trigger this function when the header column is clicked. This overrides the default sorting functionality.
headerRowHeight | 0 | The height of the header row in pixels.
headerRowTemplate | See below | Define a header row template for further customization.
itemsBefore | 0 |
multiSelect | true | Set this to false if you only want one item selected at a time.
rowClick | null | Function to trigger when the row clicks. If null, there will be no hover style on the rows.
rowHeight | 30 | Row height of rows in grid.
rowTemplate | See below | Row template
selectAll | See below | Function that is appended to the specific grid options for users to programmatically set the selected value all of the rows to the state passed. | Yes=ngCell {{col.cellClass}}><div class=ngVerticalBar ng-style={height: rowHeight} ng-class={ ngVerticalBarVisible: !$last }>&nbsp;</div><div ng-cell></div></div> | Define a row Template to customize output.
selectedItems | [] | All of the items selected in the grid. In single select mode there will only be one item in the array.
selectItem | See below | Function that is appended to the specific grid options for users to programmatically select the row based on the index of the entity in the data array option.
selectRow | ```function (rowIndex, state) {}``` | Function that is appended to the specific grid options for users to programmatically select the row regardless of the related entity.
selectWithCheckboxOnly | false | Disable row selections by clicking on the row and only when the checkbox is clicked via rowClick
showHeaderRow | true | Control the visibility of the header row.
showSelectionCheckbox | false | Row selection check boxes appear as the first column.
sortInfo | ```{ fields: [], directions: [] }``` | Define a sortInfo object to specify a default sorting state. You can also observe this variable to utilize server-side sorting (see useExternalSorting). Syntax is sortInfo: { fields: ['fieldName1' , ' fieldName2'], directions: ['asc', 'desc']}. Directions are case-insensitive, via sortColumn and sortAsc
trackItemBy | null | Primary tracking column for row
virtualizationInterval | 2 | Number of rows.
virtualizationOverflow | 4 | Number of rows to virtualize outside of the viewport.
virtualizationThreshold | 50 | The threshold in rows at which to force row virtualization on.

<!--
itemsBefore
snapping
pixelsBefore
scrollTop
-->

## Template Options and functions

#### rowTemplate
```
<div mf-grid-row
	ng-repeat="item in grid.visibleItems track by $index"
	ng-class="rowClass"
	class="grid-row">
	<div ng-if="grid.showSelectionCheckbox"
		class="grid-column grid-checkbox-column">
		<input ng-checked="isSelected" type="checkbox" />
	</div>

	<div mf-grid-column
		ng-repeat="column in grid.enabledColumns"
		class="grid-column">
	</div>
</div>
```

#### headerRowTemplate
```
<div class="grid-row">'
	<div ng-if="grid.showSelectionCheckbox" class="grid-column grid-checkbox-column">
	<input ng-if="grid.multiSelect" ng-checked="grid.allItemsSelected" title="Select All" type="checkbox" class="check-all" />

	<div ng-repeat="column in grid.enabledColumns"
		ng-style="{ width: column.width }"
		ng-class="{ \'grid-column-sortable\': grid.enableSorting }"
		ng-click="headerColumnClick(column, $index)"
		class="grid-column {{ column.headerClass }}">
		{{ column.displayName }}

		<div ng-show="grid.enableSorting && grid.sortColumn && grid.sortColumn.field === column.field"
			class="grid-sort-icon glyphicon glyphicon-chevron-{{ grid.sortAsc ? \'up\' : \'down\' }} icon-chevron-{{ grid.sortAsc ? \'up\' : \'down\' }}">
		</div>
	</div>
</div>
```

#### selectAll
```
function(selected) {
	if (!selected) {
		this.allItemsSelected = false;
		this.selectedItems.length = 0;
		return;
	}
	for (var i = 0, l = this._data.length; i < l; ++i) {
		this.selectedItems.push(this._data[i]);
	}
	this.allItemsSelected = true;
}
```

#### selectItem
```
function(item, selected) {
	if (this.multiSelect === false) {
		this.selectedItems.length = 0;
		this.selectedItems.push(item);
		this.updateCheckAll();
		return;
	}

	var index = this.selectedItems.indexOf(item),
		isSelected = index !== -1;

	if ((selected && isSelected) || (!selected && !isSelected)) {
		return;
	}
	if (selected) {
		this.selectedItems.push(item);
	} else {
		this.selectedItems.remove(index);
	}
	this.updateCheckAll();
}
```