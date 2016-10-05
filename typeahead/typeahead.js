angular.module('myApp').directive('typeahead', ['$timeout', typeahead]);

/*
The entities are like this:
{
	id: String,
	name: String,
	description: String
}
*/

function typeahead($timeout) {
	var directive = {
		restrict: 'E',
		link: link,
		scope: {
			promise: '=',
			selected: '=',
			loadOnInit: '=',
			cache: '=',
			fieldId: '@',
			fieldName: '@',
			fieldDescription: '@'
		},
		templateUrl: 'ui_components/typeahead/typeahead.html'
	}

	function link(scope, element) {
		scope.search = {
			value: '',
			previousValue: '',
			placeholder: '',
			filteredEntities: []
		};
		scope.index = {
			value: 0
		};
		var promise;
		var originalList = [];

		if(!scope.fieldId) {
			throw new Error('No id specified to convert the struct - typeahead');
		}

		var loadData = function() {
			scope.entities = [];
			scope.loadingData = true;
			promise = scope.promise().then(function(entities) {
				originalList = entities;
				entities.forEach(function(item) {
					var convertedItem = convertToTmpField(item);
					scope.entities.push(convertedItem);
				});
				scope.loadingData = false;
			});
			return promise;
		};

		if (scope.loadOnInit) {
			loadData();
		}

		var convertToTmpField = function(item) {
  			var tmp = {
  				id: item[scope.fieldId],
  				name: item[scope.fieldName],
  				description: item[scope.fieldDescription]
  			};

  			return tmp;
  		};

  		var getItemFromOriginalList = function(tmpItem) {
  			var originalItem = _.find(originalList, function(originalItem) {
  				return originalItem[scope.fieldId] === tmpItem.id;
  			});

  			return originalItem;
  		};

	  	var toggleExpand = function(value) {
			if(value === true) { //If I'm expanding I need to scroll into the selected item
				if((firstTime && !scope.loadOnInit) || !scope.cache) {
                    promise = loadData();
                    firstTime = false;
                }

				promise.then(function() {
	      			$timeout(function(){
		        		scope.index.value = getSelectedItemIndex();
		        		scrollSelectedItemIntoView();
	        		});
	        	});
			}

			if(value === undefined) {
				scope.cancelSearch();
			}

			scope.expanded = value;
	  	};

		scope.selectItem = function(item) {
			if (item && ((scope.tmpSelected && item.id !== scope.tmpSelected.id) || !scope.tmpSelected)) {
				scope.tmpSelected = item;
				scope.selected = getItemFromOriginalList(item);
				toggleExpand(false);
				removeInputFocus();
			}
		};

		var firstTime = true;
		scope.onFocus = function(event) {
			if(!scope.expanded) {
				scope.search.previousValue = scope.search.value;
				scope.search.value = '';
				toggleExpand(true);
			}
		};

		scope.removeSelected = function() {
            scope.tmpSelected = null;
            toggleExpand(true);
        };

		var getSelectedItemIndex = function() {
			if(scope.tmpSelected && scope.tmpSelected.id) {
				var listItems = element[0].querySelectorAll('.entity-selector-list-group-item');
		        var index = _.findIndex(listItems, function(item) {
		          return angular.element(item).scope().item.id === scope.tmpSelected.id;
		        });
		        return index;
			}

			return 0;
	    };

	    var getItemFromIndex = function(index) {
			var listItems = element[0].querySelectorAll('.entity-selector-list-group-item');
			if(listItems.length) {
				return listItems[index];
			}
	    };

		var getSelectedItem = function() {
			var listItems = element[0].querySelectorAll('.entity-selector-list-group-item');
	        var item = _.find(listItems, function(item) {
	          return angular.element(item).scope().item.id === scope.tmpSelected.id;
	        });
	        return item;
	    };

	    var scrollItemIntoView = function(item, order) {
	    	var selectorPopup = element[0].querySelector('#selectorPopup');
	        var listGroup = element[0].querySelector('.list-group');
	        var position = 0;

	        if(item && selectorPopup && listGroup) {
				if(order === 'first') {
					//First position
					position = $(item).offset().top - $(listGroup).offset().top;

				} else if(order === 'last') {
					//Last position
					position = $(item).offset().top - $(listGroup).offset().top - $(selectorPopup).height() + $(item).height()*2;
				}

	        	//unanimated scroll
	        	$(selectorPopup).scrollTop(position);
	        }
	    };

		var scrollSelectedItemIntoView = function() {
			var item;
			if(scope.tmpSelected && scope.tmpSelected.id) {
				item = getSelectedItem();
			} else {
				item = getItemFromIndex(0);
			}

			scrollItemIntoView(item, 'first');
        };

	    var isItemVisible = function(item) {
	    	var selectorPopup = element[0].querySelector('#selectorPopup');
	    	var top = $(selectorPopup).offset().top;
	    	var bottom = $(selectorPopup).offset().top + $(selectorPopup).height();
	    	var itemTop = $(item).offset().top;
	    	return (itemTop >= top && itemTop <= bottom);
	    };

		scope.onKeyDown = function(event) {
			switch(event.keyCode) {
				//Up
				case 38:
							if (scope.search.filteredEntities.length) {
								if(scope.index.value > 0 && scope.index.value < scope.search.filteredEntities.length) {
									scope.index.value = scope.index.value - 1;

									var item = getItemFromIndex(scope.index.value);
				          			if(!isItemVisible(item)) {
				          				scrollItemIntoView(item, 'first');
				          			}
			          			} else {
			          				scope.index.value = scope.search.filteredEntities.length-1;
			          			}
							}
							break;

				//Down
				case 40:
							if(!scope.expanded) {
								toggleExpand(true);
							}

							if(scope.search.filteredEntities.length) {
								if (scope.index.value < scope.search.filteredEntities.length-1) {
									scope.index.value = scope.index.value + 1;

									var item = getItemFromIndex(scope.index.value);
									if(!isItemVisible(item)) {
				          				scrollItemIntoView(item, 'last');
									}
								} else  {
									scope.index.value = 0;
								}
							}
							break;

				//Esc
				case 27:
							scope.cancelSearch();
							toggleExpand(false);
							break;

				//Enter
				case 13:
							if(scope.search.filteredEntities.length > 0) {
								scope.selectItem(scope.search.filteredEntities[scope.index.value]);
							}
							break;


				//Tab
				case 9:
							scope.cancelSearch();
							toggleExpand(false);
							break;

				default:


			}
		};

		scope.cancelSearch = function() {
			if (scope.search) {
				scope.search.value = scope.search.previousValue;
				scope.search.previousValue = '';
				removeInputFocus();
			}
		};

		var removeInputFocus = function() {
    		element[0].querySelector('#idSearchInput').blur();
    	};

		scope.$watch('tmpSelected', function (item) {
			if(item && (item.name || item.description)) {
				scope.search.placeholder = item.name + ' - ' + item.description;
				scope.search.value = '';
			} else if (!item) {
				scope.search.placeholder = '';
				scope.search.value = '';
			}
		});

		scope.$watch('selected', function(item) {
			if(item && !scope.tmpSelected) {
				scope.tmpSelected = convertToTmpField(item);
			}
		});

		angular.element(window).bind('click', function(event) {
			if(!element[0].contains(event.target)) {
				if(scope.expanded) {
					scope.$apply(function() {
						scope.cancelSearch();
						toggleExpand(false);
					});
				}
			}
    	});
	}

	return directive;
}
