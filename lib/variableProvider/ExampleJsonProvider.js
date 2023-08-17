import VariableProvider from '@bpmn-io/variable-resolver/lib/VariableProvider';
import { getExampleJson } from '../util/jsonDataUtil';

/**
 * Variable Provider that parses example JSON from a specific Zeebe property
 */
export class ExampleJsonProvider extends VariableProvider {
  getVariables(element) {
    const data = getExampleJson(element);

    if (!data) {
      return;
    }

    const parsedData = getVariablesFromString(data);
    return parsedData;
  }
}

/**
 * Translates a JSON string into a list of variables. Returns an empty list if the
 * JSON string is not parseable.
 *
 * @param {String} data the JSON string to parse
 * @returns {Array} variables
 */
function getVariablesFromString(data) {
  try {
    const parsed = JSON.parse(data);
    const variables = toInternalFormat(parsed);

    return variables;
  } catch (e) {

    // Malformed JSON
    return [];
  }
}


/**
 * Transforms example data into the internal format, annotating with type and example
 * value.
 *
 * @param {Object} data
 */
function toInternalFormat(data = {}) {
  if (typeof data !== 'object' || data === null) {
    return;
  }

  return Object.keys(data).map(key => {
    let value = data[key];

    const newElement = {
      name: key,
      info: JSON.stringify(value, null, 2)
    };

    if (Array.isArray(value)) {
      newElement.isList = true;
      newElement.type = 'List';

      if (value.length > 0) {
        newElement.entries = toInternalFormat(value[0]);
      }
      return newElement;
    }

    newElement.type = getType(value);
    newElement.entries = toInternalFormat(value);

    return newElement;
  });
}

function getType(value) {

  if (value === null) {
    return '';
  }

  const type = typeof value;

  if (type === 'object') {
    return 'Context';
  }

  return capitalize(type);
}


function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}