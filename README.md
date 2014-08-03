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
			headerRowHeight: 35,

		};

		$scope.results = [
			{name: 'John', instrument: 'Guitar'},
			{name: 'Paul', instrument: 'Guitar'},
			{name: 'George', instrument: 'Lead Guitar'},
			{name: 'Ringo', instrument: 'Drums'}
		];
	}]);
```

#### View
 ```html
<h2>Band Members</h2>
<div mf-grid="gridOpts"></div>
```

## Options

Option |  Default Value | Definition| Supported
------ | -------------- | --------- | ---------
afterSelectionChange | function (rowItem, event) {} | Callback for when you want to validate something after selection.
checkboxCellTemplate | <div class=ngSelectionCell><input tabindex=-1 class=ngSelectionCheckbox type=checkbox ng-checked=row.selected /></div> | Checkbox cell template.
checkboxHeaderTemplate | <input class=ngSelectionHeader type=checkbox ng-show=multiSelect ng-model=allSelected ng-change=toggleSelectAll(allSelected)/> | Checkbox header template.
columnDefs | undefined | definitions of columns as an array [] |  if not defines columns are auto-generated.
data | [] | Data being displayed in the grid. Each item in the array is mapped to a row being displayed.
enableSorting | true | Enables or disables sorting in grid.
enableRowSelection | true | To be able to have selectable rows in grid.
headerRowHeight | 32 | The height of the header row in pixels.
headerRowTemplate | undefined | Define a header row template for further customization.
multiSelect | true | Set this to false if you only want one item selected at a time.
rowHeight | 30 | Row height of rows in grid.
rowTemplate | <div ng-style={ 'cursor': row.cursor } ng-repeat=col in renderedColumns ng-class=col.colIndex() class
selectAll | function (state) | Function that is appended to the specifiec grid options for users to programatically set the selected value all of the rows to the state passed. | Yes=ngCell {{col.cellClass}}><div class=ngVerticalBar ng-style={height: rowHeight} ng-class={ ngVerticalBarVisible: !$last }>&nbsp;</div><div ng-cell></div></div> | Define a row Template to customize output.
selectedItems | [] | all of the items selected in the grid. In single select mode there will only be one item in the array.
selectItem | function (itemIndex |  state) | Function that is appended to the specifiec grid options for users to programatically select the row based on the index of the enitity in the data array option.
selectRow | function (rowIndex |  state) | Function that is appended to the specifiec grid options for users to programatically select the row regardless of the related entity.
selectWithCheckboxOnly | false | Disable row selections by clicking on the row and only when the checkbox is clicked via rowClick
showSelectionCheckbox | false | Row selection check boxes appear as the first column. (was displaySelectionCheckbox prior to 2.0)
sortInfo | { fields: [] |  directions: [] } | Define a sortInfo object to specify a default sorting state. You can also observe this variable to utilize server-side sorting (see useExternalSorting). Syntax is sortInfo: { fields: ['fieldName1' , ' fieldName2'], directions: ['asc', 'desc']}. Directions are case-insensitive, via sortColumn and sortAsc
useExternalSorting | false | Prevents the internal sorting from executing. The sortInfo object will be updated with the sorting information so you can handle sorting (see sortInfo) | via headerColumnClick and column.sortFn
virtualizationThreshold | 50 | The threshold in rows at which to force row virtualization on.