# Angularjs ui-components

Jquery is needed in order to scroll the container if we use our keyboard to move over.

Both components are expecting the following parameters:

promise: A promise to fetch the data to show in de component.

selected: A variable where to save the current selected item.

load-on-init: (true) means start fetching as soon as is loaded or (false) to wait until we use the component for the first time.

cache: (true) means to save the data fetched or (false) to keep fetching data every time we use the component.

field-id, field-name, and field-description are used to map the structure used in the component and the one we are fetching from the API.
