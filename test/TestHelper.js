import TestContainer from 'mocha-test-container-support';

import {
  bootstrapBpmnJS,
  inject,
  insertCSS
} from 'bpmn-js/test/helper';

import Modeler from 'bpmn-js/lib/Modeler';
import { act, fireEvent } from '@testing-library/preact';

let PROPERTIES_PANEL_CONTAINER;

global.chai.use(function(chai, utils) {

  utils.addMethod(chai.Assertion.prototype, 'variableEqual', function(comparison) {
    var variables = this._obj;
    var expectedVariables = comparison;

    expect(variables.length).to.eql(expectedVariables.length);

    expectedVariables.forEach((expectedVariable) => {
      const {
        name,
        type,
        detail,
        info,
        scope,
        isList,
        origin,
        entries
      } = expectedVariable;

      const actualVariable = variables.find(v => v.name === name);
      expect(actualVariable).to.exist;

      isDefined(type) && expect(actualVariable.type).to.eql(type);
      isDefined(info) && expect(actualVariable.info).to.eql(info);
      isDefined(detail) && expect(actualVariable.detail).to.eql(detail);
      isDefined(scope) && expect(actualVariable.scope.id).to.eql(scope);
      isDefined(isList) && expect(!!actualVariable.isList).to.eql(!!isList);
      isDefined(entries) && expect(actualVariable.entries).to.variableEqual(entries);

      isDefined(origin) && expect(actualVariable.origin.length).to.eql(origin.length);
      isDefined(origin) && origin.forEach((expectedOrigin) => {
        const foundOrigin = actualVariable.origin.find(o => o.id === expectedOrigin);
        expect(foundOrigin).to.exist;
      });
    });
  });
});

export * from 'bpmn-js/test/helper';

export {
  createCanvasEvent,
  createEvent
} from 'bpmn-js/test/util/MockEvents';

export function bootstrapPropertiesPanel(diagram, options, locals) {
  return async function() {
    const container = TestContainer.get(this);

    insertCoreStyles();

    // (1) create modeler + import diagram
    const createModeler = bootstrapModeler(diagram, options, locals);
    await act(async () => await createModeler.call(this));

    // (2) clean-up properties panel
    clearPropertiesPanelContainer();

    // (3) attach properties panel
    const attachPropertiesPanel = inject(function(propertiesPanel, eventBus) {
      const propertyPanelReady = new Promise((resolve) => {
        eventBus.on('propertiesPanel.layoutChanged', resolve);
      });

      PROPERTIES_PANEL_CONTAINER = document.createElement('div');
      PROPERTIES_PANEL_CONTAINER.classList.add('properties-container');

      container.appendChild(PROPERTIES_PANEL_CONTAINER);

      propertiesPanel.attachTo(PROPERTIES_PANEL_CONTAINER);
      return propertyPanelReady;
    });
    await attachPropertiesPanel();
  };
}

export function clearPropertiesPanelContainer() {
  if (PROPERTIES_PANEL_CONTAINER) {
    PROPERTIES_PANEL_CONTAINER.remove();
  }
}

export function insertCoreStyles() {
  insertCSS(
    'test.css',
    require('./test.css').default
  );

  insertCSS(
    'properties-panel.css',
    require('@bpmn-io/properties-panel/dist/assets/properties-panel.css').default
  );

  insertCSS(
    'element-templates.css',
    require('bpmn-js-element-templates/dist/assets/element-templates.css').default
  );

  insertCSS(
    'diagram.css',
    require('bpmn-js/dist/assets/diagram-js.css').default
  );

  insertCSS(
    'bpmn-js.css',
    require('bpmn-js/dist/assets/bpmn-js.css').default
  );

  insertCSS(
    'bpmn-font.css',
    require('bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css').default
  );

}

export function changeInput(input, value) {
  fireEvent.input(input, { target: { value } });
}


export function bootstrapModeler(diagram, options, locals) {
  return bootstrapBpmnJS(Modeler, diagram, options, locals);
}


function isDefined(value) {
  return typeof value !== 'undefined';
}