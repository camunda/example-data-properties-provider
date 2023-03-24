import {
  Group,
  isTextAreaEntryEdited
} from '@bpmn-io/properties-panel';

import JSONDataProperty from './JSONDataProperty';

const VERY_LOW_PRIORITY = 100;

export default class DataPropertiesProvider {
  constructor(propertiesPanel, injector) {
    this._injector = injector;
    propertiesPanel.registerProvider(VERY_LOW_PRIORITY, this);
  }

  getGroups() {
    const translate = this._injector.get('translate');

    // todo(@marstamm): React to applied element templates, hide when binding is
    // part of templated properties
    return (groups) => {
      const group = {
        id: 'additionalDataGroup',
        label: translate('Data'),
        entries: [
          {
            id: 'exampleJson',
            component: JSONDataProperty,
            isEdited: isTextAreaEntryEdited
          }
        ],
        component: Group
      };

      groups.push(group);
      return groups;
    };
  }
}

DataPropertiesProvider.$inject = [ 'propertiesPanel', 'injector' ];

