angular.module('myApp').directive('dropdown', ['$timeout', dropdown]);

/**
The entities are like this:
{
	id: String,
	name: String,
	description: String
}
*/

function dropdown($timeout) {
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
		templateUrl: 'ui_components/dropdown/dropdown.html'
	}

	function link(scope, element) {
        var promise;
        var originalList = [];

        if(!scope.fieldId) {
            throw new Error('No id specified to convert the struct - dropdown');
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

        var convertItemField = function(item) {
            var tmp = {
                id: item[scope.fieldId],
                name: item[scope.fieldName],
                description: item[scope.fieldDescription]
            };

            return tmp;
        };

		scope.selectItem = function(item) {
            scope.tmpSelected = null;
			scope.selected = getItemFromOriginalList(item);
			scope.expanded = false;
		};

        scope.$watch('selected', function(item) {
            if(item && !scope.tmpSelected) {
                scope.tmpSelected = convertToTmpField(item);
            }
        });

        var firstTime = true;
		scope.toggleExpand = function() {
			scope.expanded = !scope.expanded;
			if (scope.expanded) {
                if((firstTime && !scope.loadOnInit) || !scope.cache) {
                    promise = loadData();
                    firstTime = false;
                }

                promise.then(function() {
                    $timeout(function(){
                        scrollSelectedItemIntoView();
                    },0);
                });
			}
		};

        scope.removeSelected = function() {
            scope.tmpSelected = null;
            scope.toggleExpand();
        };

        var getSelectedItem = function() {
            var listItems = element[0].querySelectorAll('.entity-selector-list-group-item');
            var item = _.find(listItems, function(item) {
              return angular.element(item).scope().item.id === scope.tmpSelected.id;
            });
            return item;
        };

        var getItemFromIndex = function(index) {
            var listItems = element[0].querySelectorAll('.entity-selector-list-group-item');
            if(listItems.length) {
                return listItems[index];
            }
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

        angular.element(window).bind('click', function(event) {
            if(!element[0].contains(event.target)) {
                if(scope.expanded) {
                    scope.$apply(function() {
                        scope.toggleExpand();
                    });
                }
            }
        });
	}

	return directive;
}
