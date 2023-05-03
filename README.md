# @camunda/example-data-properties-provider

A variable provider that extracts variables from a zeebe:Property element.
This Module includes a variable provider and a [properties panel](https://github.com/bpmn-io/bpmn-js-properties-panel) extension.

## Usage

Include it in your bpmn-js Project. Note that this module requires bpmn-js-properties-panel to be included as well.

```javascript
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';

import ExampleDataProvider from '@camunda/example-data-properties-provider';

const modeler = new BpmnModeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#properties'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    ExampleDataProvider 
  ]
});
```

## Development

Clone the Project, then run

```sh
npm install
npm start
```

## License
MIT
