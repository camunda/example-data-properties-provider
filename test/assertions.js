import { expect } from 'chai';


function isDefined(value) {
  return typeof value !== 'undefined';
}

function findVariable(variables, expectedVariable) {
  const {
    name,
    scope
  } = expectedVariable;

  const variable = variables.find(
    v => (!isDefined(name) || v.name === name) && (!isDefined(scope) || v.scope?.id === scope)
  );

  expect(variable, `variable[name=${name}, scope=${scope}]`).to.exist;

  return variable;
}

function assertVariableMatches(variable, expectedVariable) {
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

  isDefined(type) && expect(variable.type, `variable[name=${name}].type`).to.eql(type);
  isDefined(info) && expect(variable.info, `variable[name=${name}].info`).to.eql(info);
  isDefined(detail) && expect(variable.detail, `variable[name=${name}].detail`).to.eql(detail);
  isDefined(scope) && expect(variable.scope.id, `variable[name=${name}].scope.id`).to.eql(scope);
  isDefined(isList) && expect(!!variable.isList, `variable[name=${name}].isList`).to.eql(!!isList);
  isDefined(entries) && expect(variable.entries, `variable[name=${name}].entries`).to.variableEqual(entries);

  isDefined(origin) && origin.forEach((expectedOrigin) => {
    const foundOrigin = variable.origin.find(o => o.id === expectedOrigin);
    expect(foundOrigin, `origin[name=${expectedOrigin}]`).to.exist;
  });

  isDefined(origin) && expect(variable.origin.length, `variable[name=${name}].origin.length`).to.eql(origin.length);
}

/**
 * Match variables against expected patterns,
 * return variables that were not matched.
 */
function assertVariablesMatch(variables, expectedVariables) {

  let remainingVariables = variables.slice();

  for (const expectedVariable of expectedVariables) {
    const variable = findVariable(remainingVariables, expectedVariable);

    remainingVariables = remainingVariables.filter(v => v !== variable);

    assertVariableMatches(variable, expectedVariable);
  }

  return remainingVariables;
}

function variableAssertions(chai, utils) {

  // use to verify that a list of variables
  // is complete, i.e. includes exactly the variables matched
  utils.addMethod(chai.Assertion.prototype, 'variableEqual', function(expectedVariables) {
    const variables = this._obj;

    const remainingVariables = assertVariablesMatch(variables, expectedVariables);

    expect(remainingVariables.length, `no additional variables, found [${remainingVariables.map(r => r.name)}]`).to.eql(0);
  });

  // use to verify that a list of variables
  // includes a single or a list of variables (by pattern)
  utils.addMethod(chai.Assertion.prototype, 'variableInclude', function(expectedVariables) {
    const variables = this._obj;

    if (!Array.isArray(expectedVariables)) {
      expectedVariables = [ expectedVariables ];
    }

    assertVariablesMatch(variables, expectedVariables);
  });
}

export {
  variableAssertions
};