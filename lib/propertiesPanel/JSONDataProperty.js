import { TextAreaEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import {
  getExampleJson,
  EXAMPLE_JSON_PROPERTY_NAME,
  getZeebeProperty
} from '../util/jsonDataUtil';

/**
 * Allows to edit the example JSON data of a task in a TextArea. Stores the data
 * in a zeebe:Property with the name specified in `exampleDataUtil`.
 */
const JSONDataProperty = (props) => {
  const {
    element
  } = props;

  const debounce = useService('debounceInput');
  const translate = useService('translate');
  const commandStack = useService('commandStack');
  const moddle = useService('moddle');
  const injector = useService('injector');

  const getValue = () => {
    return getExampleJson(element);
  };

  const setValue = (value) => {
    const commands = [];

    const {
      commands: createZeebePropertiesCmds,
      zeebeProperties
    } = ensureZeebeProperties(element, injector);
    commands.push(...createZeebePropertiesCmds);

    // Update existing data
    const existingData = getZeebeProperty(element, EXAMPLE_JSON_PROPERTY_NAME);

    if (existingData) {
      if (value) {

        // Update value
        commands.push({
          cmd: 'element.updateModdleProperties',
          context: {
            element,
            moddleElement: existingData,
            properties: {
              value
            }
          }
        });
      }
      else {

        // Remove empty zeebe property
        commands.push({
          cmd: 'element.updateModdleProperties',
          context: {
            element,
            moddleElement: zeebeProperties,
            properties: {
              properties: withoutOutData(zeebeProperties.get('properties'))
            }
          }
        });
      }
    }
    else {

      // Create new output data
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: zeebeProperties,
          properties: {
            properties: [
              ...zeebeProperties.get('properties'),
              createOutData(value, moddle)
            ]
          }
        }
      });
    }

    commandStack.execute('properties-panel.multi-command-executor', commands);
  };

  // todo(@marstamm): Add validation. Dependent on https://github.com/bpmn-io/properties-panel/issues/233
  return TextAreaEntry({
    element,
    label: translate('Example Output Data'),
    description: translate('Add a JSON return value here to get suggestions in the Output mappings.'),
    id: 'exampleJson',
    getValue,
    setValue,
    debounce,
    monospace: true
  });
};

export default JSONDataProperty;


/**
 * Ensures that Extension elements and the zeebe:Properties extension element exists.
 * Returns the zeebe:Properties element and a list of commands to create them if they don't exist.
 */
const ensureZeebeProperties = (element, injector) => {
  const commands = [];

  const bo = getBusinessObject(element);

  const bpmnFactory = injector.get('bpmnFactory');

  let extensionElements = bo.get('extensionElements');
  if (!extensionElements) {
    extensionElements = bpmnFactory.create(
      'bpmn:ExtensionElements',
      { values: [] }
    );

    extensionElements.$parent = bo;
    commands.push(
      {
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: bo,
          properties: {
            extensionElements
          }
        }
      }
    );
  }

  let zeebeProperties = extensionElements.get('values').find(v => v.$type === 'zeebe:Properties');

  if (!zeebeProperties) {
    zeebeProperties = bpmnFactory.create('zeebe:Properties', {
      properties: []
    });

    zeebeProperties.$parent = extensionElements;

    commands.push(
      {
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [
              ...extensionElements.get('values'),
              zeebeProperties
            ]
          }
        }
      }
    );
  }

  return {
    zeebeProperties,
    commands
  };
};

function createOutData(data, moddle) {
  return moddle.create('zeebe:Property', {
    name: EXAMPLE_JSON_PROPERTY_NAME,
    value: data
  });
}

function withoutOutData(zeebeProperties) {
  return zeebeProperties.filter(p => p.get('name') !== EXAMPLE_JSON_PROPERTY_NAME);
}