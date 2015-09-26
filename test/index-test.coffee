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
  initialize: (aOptions)->
    super(aOptions)
    if aOptions
      extend @, aOptions, (k,v)->k in ['min', 'max']
    return


describe "TypeInfo", ->
  before ->
    result = register TestType
    result.should.be.true
  after ->
    TypeInfo.unregister 'Test'
  it "should get type info object directly", ->
    t = TestType(min: undefined)
    should.exist t
    t.should.be.equal TypeInfo('Test')
    t.should.have.property 'name', 'Test'
  it "should create type info object directly", ->
    t = TestType min:2
    should.exist t
    t.should.be.not.equal TypeInfo('Test')
    t.should.have.property 'min', 2
    t.should.have.property 'name', 'Test'
  describe ".pathArray()", ->
    it "should get default type path array", ->
      t = TypeInfo('Test')
      t.pathArray().should.be.deep.equal ['type','Test']
    it "should get cutomize root type path array", ->
      old = TypeInfo.ROOT_NAME
      TypeInfo.ROOT_NAME = 'atype'
      t = TypeInfo('Test')
      t.pathArray().should.be.deep.equal ['atype','Test']
      TypeInfo.ROOT_NAME = old

  describe ".fromJson()", ->
    it "should get type info object from json", ->
      t = TypeInfo.fromJson('{"name":"Test"}')
      should.exist t
      t.should.be.equal TypeInfo('Test')
      t.should.have.property 'name', 'Test'
    it "should create type info object from json", ->
      t = TypeInfo.fromJson('{"name":"Test","min":2, "max":3}')
      should.exist t
      t.should.be.not.equal TypeInfo('Test')
      t.should.have.property 'max', 3
      t.should.have.property 'min', 2
      t.should.have.property 'name', 'Test'
    it "should create Value object from json", ->
      t = TypeInfo.fromJson('{"name":"Test","min":2, "max":3, "value":3}')
      should.exist t
      t.should.be.instanceOf Value
      vType = t.$type
      vType.should.be.instanceOf TestType
      vType.should.be.not.equal TypeInfo('Test')
      vType.should.have.property 'max', 3
      vType.should.have.property 'min', 2
      (""+t).should.be.equal "3"
      (t + 3).should.be.equal 6
  describe ".createFromJson()", ->
    it "should create a new type info object from json", ->
      T = TypeInfo.registeredClass 'Test'
      should.exist T
      T.should.be.equal TestType
      t = TypeInfo.createFromJson('{"name":"Test","min":1, "max":10}')
      should.exist t
      t.should.be.instanceOf TestType
      t.should.not.be.equal TypeInfo('Test')
      t.should.have.property 'max', 10
      t.should.have.property 'min', 1
    it "should create a new value object from json", ->
      obj =
        name: "Test"
        min:2
        max:6
        value:5
      t = TypeInfo.createFromJson JSON.stringify obj
      should.exist t
      t.should.be.instanceOf Value
      vType = t.$type
      vType.should.be.instanceOf TestType
      vType.should.not.be.equal TypeInfo('Test')
      vType.should.have.property 'max', 6
      vType.should.have.property 'min', 2
      (""+t).should.be.equal "5"
      (t + 3).should.be.equal 8
  describe ".validate", ->
    it "should validate required value", ->
      validator = TypeInfo('Test').createType required: true
      result = validator.validate null, false
      result.should.be.equal false
      validator.errors.should.be.deep.equal [{"message": "is required","name": "[type Test]"}]
    it "should validate required value and throw error", ->
      validator = TypeInfo('Test').createType required: true
      should.throw validator.validate.bind(validator, null), 'is an invalid'
