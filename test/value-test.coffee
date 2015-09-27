extend          = require 'util-ex/lib/extend'
chai            = require 'chai'
sinon           = require 'sinon'
sinonChai       = require 'sinon-chai'
should          = chai.should()
expect          = chai.expect
assert          = chai.assert
chai.use(sinonChai)

Type            = require '../src'
Value           = require '../src/value'
NumberType      = require './number-type'
setImmediate    = setImmediate || process.nextTick
register        = Type.register

describe 'Value', ->
  number = null
  before ->
    result = register NumberType
    result.should.be.true
    number = Type('Number')
  after ->
    Type.unregister 'Number'

  it 'should have Number type', ->
    should.exist number
    number.should.be.an.instanceOf Type['Number']
    number.pathArray().should.be.deep.equal ['type','Number']

  describe '#toObject()', ->
    it 'should get value info to obj', ->
      result = number.createType
        'max':34
        'min':5
      result = result.createValue 12
      result = result.toObject()
      result.should.be.equal 12
