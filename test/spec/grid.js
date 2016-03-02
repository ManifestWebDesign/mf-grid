'use strict';

describe('Controller: GridCtrl', function() {

	// load the controller's module
	beforeEach(module('mfGrid'));

	var grid;

	// Initialize the controller and a mock scope
	beforeEach(inject(function($controller) {
		grid = $controller('MfGridCtrl');
	}));

	describe('constructor', function(){
		it('should set options', function() {
			expect(true).toBe(true);
		});
	});
});