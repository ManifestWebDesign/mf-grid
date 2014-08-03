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
afterSelectionChange | function (rowItem, event) {} | Callback for when you want to validate something after selection.	| yes, but different
afterSelectionChange | function (rowItem |  event) {} | Callback for when you want to validate something after selection. | yes, but different
aggregateTemplate | <div ng-click=row.toggleExpand() ng-style={'left': row.offsetleft} class=ngAggregate><span class=ngAggregateText>{{row.label CUSTOM_FILTERS}} ({{row.totalChildren()}} {{AggItemsLabel}})</span><div class={{row.aggClass()}}></div></div> | Define an aggregate template to customize the rows when grouped. See github wiki for more details. | no
beforeSelectionChange | function (rowItem |  event) { return true; } | Callback if you want to inspect something before selection |  return false if you want to cancel the selection. return true otherwise. If you need to wait for an async call to proceed with selection you can use rowItem.continueSelection(event) method after returning false initially. Note: when shift+ Selecting multiple items in the grid this will only get called once and the rowItem will be an array of items that are queued to be selected. | no
checkboxCellTemplate | <div class=ngSelectionCell><input tabindex=-1 class=ngSelectionCheckbox type=checkbox ng-checked=row.selected /></div> | Checkbox cell template. see wiki for template details | through row template
checkboxHeaderTemplate | <input class=ngSelectionHeader type=checkbox ng-show=multiSelect ng-model=allSelected ng-change=toggleSelectAll(allSelected)/> | Checkbox header template. see wiki for template details | through row template
columnDefs | undefined | definitions of columns as an array [] |  if not defines columns are auto-generated. See github wiki for more details. | yes
data | [] | Data being displayed in the grid. Each item in the array is mapped to a row being displayed. | yes
enableCellEdit | FALSE | Globally allows all cells to be editable. use the editableCellTemplate option to override the default text input | no
enableCellSelection | FALSE | Enable or disable cell navigation and selection | no
enableColumnReordering | FALSE | Enable or disable reordering of columns | no
enableColumnResize | FALSE | Enable or disable resizing of columns | no
enableHighlighting | FALSE | Enable or disable cell content selection | no
enablePaging | FALSE | Enables the server-side paging feature | no
enableRowReordering | FALSE | Enable drag and drop row reordering. Only works in HTML5 compliant browsers. | no
enableSorting | TRUE | Enables or disables sorting in grid. | yes
enableRowSelection | TRUE | To be able to have selectable rows in grid. (was canSelectRows prior to 2.0) |
filterOptions | { filterText: '' |  useExternalFilter: false } | filterText: The text bound to the built-in search box. useExternalFilter: Bypass internal filtering if you want to roll your own filtering mechanism but want to use builtin search box. | no
footerRowHeight | 55 | Defining the height of the footer in pixels. | no
groups | [] | Initial fields to group data by. Array of field names |  not displayName. | no
groupsCollapsedByDefault | TRUE | Collapse entries when grouping is enabled | no
headerRowHeight | 32 | The height of the header row in pixels. | yes
headerRowTemplate | undefined | Define a header row template for further customization. See github wiki for more details. | yes
jqueryUIDraggable | FALSE | Enables the use of jquery UI reaggable/droppable plugin. requires jqueryUI to work if enabled. Useful if you want drag + drop but your users insist on crappy browsers. | no
jqueryUITheme | FALSE | Enable the use jqueryUIThemes | no
keepLastSelected | TRUE | prevent unselections when ini single selection mode. | no
maintainColumnRatios | undefined | Maintains the column widths while resizing. Defaults to true when using *'s or undefined widths. Can be ovverriden by setting to false. | no
multiSelect | TRUE | Set this to false if you only want one item selected at a time | yes
pagingOptions | { pageSizes: [250 |  500 |  1000] |  pageSize: 250 |  totalServerItems: 0 |  currentPage: 1 } |  pageSizes: list of available page sizes. pageSize: currently selected page size. totalServerItems: Total items are on the server. currentPage: the uhm... current page. | no
plugins | [] | Array of plugin functions to register in ng-grid | no
rowHeight | 30 | Row height of rows in grid. | yes
rowTemplate | <div ng-style={ 'cursor': row.cursor } ng-repeat=col in renderedColumns ng-class=col.colIndex() class
selectAll | function (state) | Function that is appended to the specifiec grid options for users to programatically set the selected value all of the rows to the state passed. | yes=ngCell {{col.cellClass}}><div class=ngVerticalBar ng-style={height: rowHeight} ng-class={ ngVerticalBarVisible: !$last }>&nbsp;</div><div ng-cell></div></div> | Define a row Template to customize output. See github wiki for more details. | yes
selectedItems | [] | all of the items selected in the grid. In single select mode there will only be one item in the array. | yes
selectItem | function (itemIndex |  state) | Function that is appended to the specifiec grid options for users to programatically select the row based on the index of the enitity in the data array option. | yes
selectRow | function (rowIndex |  state) | Function that is appended to the specifiec grid options for users to programatically select the row regardless of the related entity. |
selectWithCheckboxOnly | FALSE | Disable row selections by clicking on the row and only when the checkbox is clicked. | via rowClick
showColumnMenu | FALSE | Enables menu to choose which columns to display and group by. If both showColumnMenu and showFilter are false the menu button will not display. | no
showFilter | FALSE | Enables display of the filterbox in the column menu. If both showColumnMenu and showFilter are false the menu button will not display. | no
showFooter | FALSE | Show or hide the footer the footer is disabled by default | no
showGroupPanel | FALSE | Show the dropzone for drag and drop grouping | no
showSelectionCheckbox | FALSE | Row selection check boxes appear as the first column. (was displaySelectionCheckbox prior to 2.0) | yes
sortInfo | { fields: [] |  directions: [] } | Define a sortInfo object to specify a default sorting state. You can also observe this variable to utilize server-side sorting (see useExternalSorting). Syntax is sortInfo: { fields: ['fieldName1' | ' fieldName2'] |  directions: ['asc' |  'desc']}. Directions are case-insensitive | via sortColumn and sortAsc
tabIndex | 0 | Set the tab index of the Vieport. | no
useExternalSorting | FALSE | Prevents the internal sorting from executing. The sortInfo object will be updated with the sorting information so you can handle sorting (see sortInfo) | via headerColumnClick and column.sortFn
virtualizationThreshold | 50 | The threshold in rows at which to force row virtualization on. | yes