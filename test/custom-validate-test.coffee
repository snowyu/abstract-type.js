extend          = require 'util-ex/lib/extend'
chai            = require 'chai'
sinon           = require 'sinon'
sinonChai       = require 'sinon-chai'
should          = chai.should()
expect          = chai.expect
assert          = chai.assert
chai.use(sinonChai)

TypeInfo        = require '../src'
Value           = require '../src/value'
Attributes      = require '../src/attributes'
setImmediate    = setImmediate || process.nextTick
register        = TypeInfo.register

class TestType
  constructor: ->return super
  $attributes: Attributes
    min:
      type: 'Number'
    max:
      type: 'Number'


describe 'Custom Validator', ->
  before ->
    result = register TestType
    result.should.be.true
  after ->
    TypeInfo.unregister 'Test'

  it 'should set a custom validate function to a type', ->
    T = TypeInfo 'Test', validate: (value)-> value is 1
    expect(T.createValue.bind(T, 2)).throw 'is an invalid Test'
    t = T.createValue 1
    expect(t.isValid()).to.be.true

  it 'should set a custom validate function to a value', ->
    customValidate = validate: (value)-> value is 1
    T = TypeInfo 'Test'
    t = T.createValue 2
    expect(t.isValid(customValidate)).to.be.false
    t = T.createValue 1
    expect(t.isValid(customValidate)).to.be.true
