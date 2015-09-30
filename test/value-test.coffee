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

  it 'should try to get Number type', ->
    result = Value(12)
    expect(result).to.be.instanceOf Value

  it 'should raise error to try to get unknown type', ->
    expect(Value.bind(null, [])).to.be.throw 'can not determine the value type'

  describe '#toObject()', ->
    it 'should get value info to obj', ->
      result = number.createType
        'max':34
        'min':5
      result = result.createValue 12
      result = result.toObject()
      result.should.be.equal 12

    it 'should get value info to obj with type', ->
      result = number.create(13)
      result = result.toObject(withType:true)
      result.should.be.deep.equal
        "name":"Number"
        value: 13

  describe '.assign()', ->
    it 'should assign a value', ->
      n = number.create(12)
      assert.equal Number(n.assign(13)), 13
    it 'should assign a value object', ->
      n = number.create(12)
      n2 = number.create(112)
      assert.equal Number(n.assign(n2)), 112

  describe '.validate()', ->
    t = null
    before ->
      t = number.cloneType min: 1, max: 10

    it 'should validate a value and do not raise error', ->
      t.validate(2).should.be.equal true
      t.validate(0, false).should.be.equal false
      t.validate(11, false).should.be.equal false
    it 'should validate a value and raise error', ->
      should.throw t.validate.bind(t, 0), 'is an invalid'
      should.throw t.validate.bind(t, 11), 'is an invalid'
    it 'should validate an encoded value', ->
      t.validate('5').should.be.equal true

  describe '.toJson()', ->
    it 'should convert a value to json', ->
      n = number.create(12)
      result = n.toJson()
      assert.equal result, '12'
    it 'should convert a value to json with type', ->
      n = number.create(12)
      result = n.toJson(withType: true)
      assert.deepEqual JSON.parse(result), name:'Number', value: 12

  describe '.createFromJson()', ->
    it 'should create value from a json string', ->
      n = number.create 12
      result = n.createFromJson 123
      expect(result).to.be.instanceOf Value
      expect(result.$type).to.be.equal number
      expect(result.valueOf()).to.be.equal 123

  describe '.fromJson()', ->
    it 'should assign value from a json string', ->
      n = number.create 12
      n.fromJson '"123"'
      expect(n.valueOf()).to.be.equal 123

  describe '.toString()', ->
    it 'should convert value to string', ->
      n = number.create 12
      expect(String(n)).to.be.equal '12'

  describe '.create()', ->
    it 'should create a new value object', ->
      n = number.create 12
      result = n.create 123
      expect(result).to.be.instanceOf Value
      expect(result.$type).to.be.equal number
      expect(result.valueOf()).to.be.equal 123
  describe '.clone()', ->
    it 'should clone a new value object', ->
      n = number.create 12
      result = n.clone()
      expect(result).to.be.instanceOf Value
      expect(result.$type).to.be.equal number
      expect(result.valueOf()).to.be.equal 12
      expect(result).to.be.not.equal n
  describe '.isValid()', ->
    it 'should be valid the value object', ->
      n = number.create 12
      expect(n.isValid()).to.be.true
  describe '.inspect()', ->
    it 'should inspect the value object', ->
      n = number.createType
        'max':34
        'min':5
      n = n.create 12
      expect(n.inspect()).to.be.equal '<type "Number": "value":12,"min":5,"max":34>'
