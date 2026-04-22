import { expect } from 'chai';

import TestContainer from 'mocha-test-container-support';

import { bootstrapPropertiesPanel, inject } from '../TestHelper';

import { BpmnPropertiesPanelModule } from 'bpmn-js-properties-panel';

import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe';

import CoreModule from 'bpmn-js/lib/core';
import ModelingModule from 'bpmn-js/lib/features/modeling';
import SelectionModule from 'diagram-js/lib/features/selection';

import DataPropertiesProviderModule from 'lib/propertiesPanel';

import dataGroupXML from '../fixtures/dataGroup.bpmn';

import {
  act, waitFor
} from '@testing-library/preact';

import {
  query as domQuery,
  classes as domClasses
} from 'min-dom';

import { EditorView } from '@codemirror/view';

import { getExampleJson, getZeebeProperty, EXAMPLE_JSON_PROPERTY_NAME } from '../../lib/util/jsonDataUtil';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';


describe('Properties Panel - Data Group', function() {
  const testModules = [
    BpmnPropertiesPanelModule,
    CoreModule,
    ModelingModule,
    SelectionModule,
    DataPropertiesProviderModule
  ];

  let container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  beforeEach(bootstrapPropertiesPanel(dataGroupXML, {
    debounceInput: false,
    additionalModules: testModules,
    moddleExtensions: {
      zeebe: ZeebeModdle
    },
    propertiesPanel: {
      layout: {
        open: true
      }
    }
  }));


  it('should display', inject(async function(elementRegistry, selection) {

    // given
    const task = elementRegistry.get('filled');

    // assume
    const exampleJSON = getExampleJson(task);

    expect(exampleJSON).to.equal('{"foo": "bar"}');

    // when
    await act(() => {
      selection.select(task);
    });

    // then
    const cmEditor = await waitForEditor(container);
    expect(getEditorValue(cmEditor)).to.equal('{"foo": "bar"}');
  }));


  it('should apply', inject(async function(elementRegistry, selection) {

    // given
    const task = elementRegistry.get('empty');

    await act(() => {
      selection.select(task);
    });

    const cmEditor = await waitForEditor(container);

    // assume
    expect(getEditorValue(cmEditor)).to.equal('');

    // when
    await act(() => {
      setEditorValue(cmEditor, '{"foo": "bar"}');
    });

    // then
    expect(getExampleJson(task)).to.eql('{"foo": "bar"}');

  }));


  it('should update on external change', inject(async function(elementRegistry, selection, commandStack) {

    // given
    const task = elementRegistry.get('filled');
    const bo = getBusinessObject(task);

    await act(() => {
      selection.select(task);
    });

    const cmEditor = await waitForEditor(container);

    // assume
    expect(getEditorValue(cmEditor)).to.equal('{"foo": "bar"}');

    // when
    const newValue = '{"foo": "bar", "bar": "baz"}';
    const property = getZeebeProperty(bo, EXAMPLE_JSON_PROPERTY_NAME);
    await act(() => {

      commandStack.execute('element.updateModdleProperties', {
        element: task,
        moddleElement: property,
        properties: {
          value: newValue
        }
      });
    });

    // then
    expect(getExampleJson(task)).to.eql(newValue);

  }));


  describe('validation', function() {

    it('should accept empty entry', inject(async function(selection, elementRegistry) {

      // given
      const task = elementRegistry.get('invalid');

      await act(() => {
        selection.select(task);
      });

      const cmEditor = await waitForEditor(container);
      const entry = domQuery('.bio-properties-panel-entry', container);

      // assume
      await expectInvalid(entry);

      // when
      await act(() => {
        setEditorValue(cmEditor, '');
      });

      // then
      await expectValid(entry);
    }));


    it('should accept valid JSON', inject(async function(selection, elementRegistry) {

      // given
      const task = elementRegistry.get('invalid');

      await act(() => {
        selection.select(task);
      });

      const cmEditor = await waitForEditor(container);
      const entry = domQuery('.bio-properties-panel-entry', container);

      // assume
      await expectInvalid(entry);

      // when
      await act(() => {
        setEditorValue(cmEditor, '{"foo": "bar"}');
      });

      // then
      await expectValid(entry);
    }));


    it('should reject invalid JSON', inject(async function(selection, elementRegistry) {

      // given
      const task = elementRegistry.get('empty');

      await act(() => {
        selection.select(task);
      });

      const cmEditor = await waitForEditor(container);
      const entry = domQuery('.bio-properties-panel-entry', container);

      // assume
      await expectValid(entry);

      // when
      await act(() => {
        setEditorValue(cmEditor, '{"foo": ');
      });

      // then
      await expectInvalid(entry);

    }));

    [ 'null', 'true', 'false', '1234', '""' ].forEach(value => {

      it(`should reject "${value}"`, inject(async function(selection, elementRegistry) {

        // given
        const task = elementRegistry.get('empty');

        await act(() => {
          selection.select(task);
        });

        const cmEditor = await waitForEditor(container);
        const entry = domQuery('.bio-properties-panel-entry', container);

        // assume
        await expectValid(entry);

        // when
        await act(() => {
          setEditorValue(cmEditor, value);
        });

        // then
        await expectInvalid(entry);

      }));

    });


  });

});


// helpers //////////

async function waitForEditor(container) {
  let cmEditor;
  await waitFor(() => {
    cmEditor = domQuery('.cm-editor', container);
    expect(cmEditor).to.exist;
  });
  return cmEditor;
}

function getEditorView(cmEditorElement) {
  return EditorView.findFromDOM(cmEditorElement);
}

function getEditorValue(cmEditorElement) {
  const view = getEditorView(cmEditorElement);
  return view ? view.state.doc.toString() : '';
}

function setEditorValue(cmEditorElement, value) {
  const view = getEditorView(cmEditorElement);
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: value
    }
  });
}

async function expectValid(node) {
  await waitFor(() => {
    expect(isValid(node)).to.be.true;
  });
}

async function expectInvalid(node) {
  await waitFor(() => {
    expect(isValid(node)).to.be.false;
  });
}

function isValid(node) {
  return !domClasses(node).has('has-error');
}
