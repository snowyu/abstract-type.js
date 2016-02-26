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

  it 'should register a validator via object', ->
    T = TypeInfo('Test')
    is1 =
      name: 'is1'
      validate: sinon.spy (aValue, aOptions)->
        T.should.be.equal @
        aValue is 1
    t = T.createValue 2
    result = TypeInfo.registerValidator is1
    expect(result, 'registerValidator').to.be.true
    expect(t.isValid(is1:true)).to.be.false
    expect(is1.validate).to.be.calledOnce
    TypeInfo.unregisterValidator 'is1'

  it 'should register a validator via arguments', ->
    T = TypeInfo('Test')
    is1 =
      name: 'is1'
      validate: sinon.spy (aValue, aOptions)->
        T.should.be.equal @
        aValue is 1
    t = T.createValue 2
    result = TypeInfo.registerValidator is1.name, is1.validate
    expect(result, 'registerValidator').to.be.true
    expect(t.isValid(is1:true)).to.be.false
    expect(is1.validate).to.be.calledOnce
    TypeInfo.unregisterValidator 'is1'
