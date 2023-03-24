import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

export const EXAMPLE_JSON_PROPERTY_NAME = 'camundaModeler:exampleOutputJson';

/**
 * Returns the example JSON data from the zeebe:Properties extension element
 *
 * @param {Element} element
 * @returns {String|undefined} value
 */
export function getExampleJson(element) {
  const property = getZeebeProperty(element, EXAMPLE_JSON_PROPERTY_NAME);

  if (property) {
    return property.get('value');
  }
}

export function getZeebeProperty(element, name) {
  const allProperties = getExtensionElements(element, 'zeebe:Properties');

  if (allProperties.length === 0) {
    return;
  }

  const properties = allProperties[0].get('properties');

  return properties.find(p => p.get('name') === name);
}

function getExtensionElements(element, type) {
  const bo = getBusinessObject(element);

  let elements = [];
  const extensionElements = bo.get('extensionElements');

  if (typeof extensionElements !== 'undefined') {
    const extensionValues = extensionElements.get('values');

    if (typeof extensionValues !== 'undefined') {
      elements = extensionValues.filter(e => is(e, type));
    }
  }

  return elements;
}