import VariableResolverModule from './variableProvider';
import DataPropertiesProviderModule from './propertiesPanel';

export default {
  __depends__: [
    VariableResolverModule,
    DataPropertiesProviderModule
  ]
};
