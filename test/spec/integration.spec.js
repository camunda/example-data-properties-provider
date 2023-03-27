import TestContainer from 'mocha-test-container-support';
import { act } from '@testing-library/preact';

import {
  query as domQuery
} from 'min-dom';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule,
  CloudElementTemplatesPropertiesProviderModule
} from 'bpmn-js-properties-panel';

import ElementTemplateChooserModule from '@bpmn-io/element-template-chooser';
import ZeebeBehaviorsModule from 'camunda-bpmn-js-behaviors/lib/camunda-cloud';
import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe';

import { ZeebeVariableResolverModule } from '@bpmn-io/variable-resolver';
import VariableProviderModule from 'lib/';

import Modeler from 'bpmn-js/lib/Modeler';

import simpleXML from '../fixtures/simple.bpmn';
import elementTemplatesXML from '../fixtures/elementTemplates.bpmn';
import elementTemplates from '../fixtures/templates.json';

import {
  bootstrapPropertiesPanel,
  clearBpmnJS,
  enableLogging,
  insertCoreStyles,
  inject,
  setBpmnJS
} from '../TestHelper';

const singleStart = window.__env__ && window.__env__.SINGLE_START;

describe('Integration', function() {

  let container;

  const defaultModules = [
    ZeebeBehaviorsModule,
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    ZeebePropertiesProviderModule,
    ZeebeVariableResolverModule,
    VariableProviderModule
  ];

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  let modelerContainer, propertiesContainer;

  beforeEach(function() {
    insertCoreStyles();
    modelerContainer = document.createElement('div');
    modelerContainer.classList.add('modeler-container');

    propertiesContainer = document.createElement('div');
    propertiesContainer.classList.add('properties-container');

    container = TestContainer.get(this);

    container.appendChild(modelerContainer);
    container.appendChild(propertiesContainer);
  });

  async function createModeler(xml, options = {}, BpmnJS = Modeler) {
    const {
      shouldImport = true,
      additionalModules = [
        ...defaultModules
      ],
      moddleExtensions = {
        zeebe: ZeebeModdle
      },
      description = {},
      layout = {}
    } = options;

    clearBpmnJS();

    const modeler = new BpmnJS({
      container: modelerContainer,
      keyboard: {
        bindTo: document
      },
      additionalModules,
      moddleExtensions,
      propertiesPanel: {
        parent: propertiesContainer,
        feelTooltipContainer: container,
        description,
        layout
      },
      ...options
    });

    setBpmnJS(modeler);
    enableLogging(modeler, true);

    if (!shouldImport) {
      return { modeler };
    }

    try {
      const result = await modeler.importXML(xml);

      return { error: null, warnings: result.warnings, modeler: modeler };
    } catch (err) {
      return { error: err, warnings: err.warnings, modeler: modeler };
    }
  }

  (singleStart ? it.only : it)('should start', async function() {
    const result = await createModeler(simpleXML,
      {
        additionalModules: [
          ...defaultModules,
          CloudElementTemplatesPropertiesProviderModule,
          ElementTemplateChooserModule
        ],
        elementTemplates
      });

    expect(result.error).to.not.exist;
  });


  describe('variable provider', function() {

    beforeEach(() => createModeler(simpleXML));

    it('should supply variables to variableResolver', inject(async function(elementRegistry, variableResolver) {

      // given
      const task = elementRegistry.get('ServiceTask_1');

      // when
      const variables = await variableResolver.getVariablesForElement(task);

      // then
      expect(variables).to.variableEqual([
        { name: 'output', type: 'Number' },
        { name: 'startData', type: 'String' }
      ]);
    }));

  });


  describe('properties panel', function() {

    beforeEach(bootstrapPropertiesPanel(elementTemplatesXML, {
      additionalModules: [
        ...defaultModules,
        CloudElementTemplatesPropertiesProviderModule
      ],
      elementTemplates
    }));


    it('should display Group', inject(async function(elementRegistry, selection) {

      // given
      const task = elementRegistry.get('noTemplate');

      // when
      await act(() => {
        selection.select(task);
      });

      // then
      const group = domQuery('[data-group-id="group-additionalDataGroup"]', container);
      expect(group).to.exist;

      // should be last
      expect(group.nextElementSibling).not.to.exist;
    }));


    it('should display group on applied template', inject(async function(elementRegistry, selection) {

      // given
      const task = elementRegistry.get('emptyTemplate');

      // when
      await act(() => {
        selection.select(task);
      });

      // then
      const group = domQuery('[data-group-id="group-additionalDataGroup"]', container);
      expect(group).to.exist;

      // should be last
      expect(group.nextElementSibling).not.to.exist;
    }));


    it('should NOT display group when template has binding (hidden)', inject(async function(elementRegistry, selection) {

      // given
      const task = elementRegistry.get('hiddenTemplate');

      // when
      await act(() => {
        selection.select(task);
      });

      // then
      const group = domQuery('[data-group-id="group-additionalDataGroup"]', container);
      expect(group).not.to.exist;
    }));


    it('should NOT display group when template has binding (visible)', inject(async function(elementRegistry, selection) {

      // given
      const task = elementRegistry.get('visibleTemplate');

      // when
      await act(() => {
        selection.select(task);
      });

      // then
      const group = domQuery('[data-group-id="group-additionalDataGroup"]', container);
      expect(group).not.to.exist;
    }));

  });

});
