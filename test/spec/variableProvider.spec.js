import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe';


import { ExampleJsonProvider } from '../../lib/variableProvider/ExampleJsonProvider';
import { bootstrapModeler, inject } from '../TestHelper';

import { EXAMPLE_JSON_PROPERTY_NAME } from '../../lib/util/jsonDataUtil';


const noop = () => {};

const MockVariableResolver = {
  registerProvider: noop
};

describe('variable-provider', function() {

  beforeEach(bootstrapModeler('', {
    moddleExtensions: {
      zeebe: ZeebeModdle
    },
  }));


  const provider = new ExampleJsonProvider(MockVariableResolver);


  const createElementWithVariables = exampleJson => {
    const factory = inject(function(bpmnFactory) {
      return bpmnFactory.create('bpmn:Task', {
        extensionElements: bpmnFactory.create(
          'bpmn:ExtensionElements',
          { values: [
            bpmnFactory.create('zeebe:Properties', { properties: [
              bpmnFactory.create('zeebe:Property', {
                name: EXAMPLE_JSON_PROPERTY_NAME,
                value: exampleJson
              })
            ] })
          ] }
        )
      });
    });

    return factory();
  };


  it('should return schema', function() {

    // given
    const variables = JSON.stringify({
      string: 'string',
      number: 12,
      boolean: true,
      object: {
        nested: null
      },
      null: null,
      array: [
        {
          nested: null
        }
      ]
    });

    const element = createElementWithVariables(variables);

    // when
    const result = provider.getVariables(element);

    // then
    expect(result).to.variableEqual([
      {
        name: 'string',
        type: 'String',
        info: '"string"'
      },
      {
        name: 'number',
        type: 'Number',
        info: '12'
      },
      {
        name: 'boolean',
        type: 'Boolean',
        info: 'true'
      },
      {
        name: 'object',
        type: 'Context',
        info: '{\n  "nested": null\n}',
        entries: [
          {
            name: 'nested',
            type: '',
            info: 'null'
          }
        ]
      },
      {
        name: 'null',
        type: '',
        info: 'null'
      },
      {
        name: 'array',
        type: 'List',
        isList: true,
        info: '[\n  {\n    "nested": null\n  }\n]',
        entries: [
          {
            name: 'nested',
            type: '',
            info: 'null'
          }
        ]
      }
    ]);
  });


  it('should NOT break with malformed JSON', function() {

    // given
    const variables = '{foo:';
    const element = createElementWithVariables(variables);

    // when
    const result = provider.getVariables(element);

    // then
    expect(result).to.eql([]);
  });
});



