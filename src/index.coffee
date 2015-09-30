properties      = require 'property-manager/ability'
factory         = require 'custom-factory'
createObject    = require 'inherits-ex/lib/createObject'
isInheritedFrom = require 'inherits-ex/lib/isInheritedFrom'
isObject        = require 'util-ex/lib/is/type/object'
isFunction      = require 'util-ex/lib/is/type/function'
isString        = require 'util-ex/lib/is/type/string'
isArray         = require 'util-ex/lib/is/type/array'
isUndefined     = require 'util-ex/lib/is/type/undefined'
defineProperty  = require 'util-ex/lib/defineProperty'
Attributes      = require './attributes/'

attributes      = new Attributes()
objectToString  = Object::toString
getObjectKeys   = Object.keys

class Value
  @tryGetTypeName: (aValue)->
    if aValue instanceof Object
      result = objectToString.call aValue
      i = result.lastIndexOf ' '
      result = result.substring(i+1, result.length-1) if i >= 0
    else
      result = typeof aValue
      result =result.charAt(0).toUpperCase() + result.substring(1)
    result
  constructor: (aValue, aType, aOptions)->
    if not (aType instanceof Type)
      aOptions = aType
      vTypeName = Value.tryGetTypeName(aValue)
      if aOptions
        # TODO: whether cache this type?
        aType = Type.create vTypeName, aOptions
      else
        aType = Type vTypeName
      throw new TypeError 'can not determine the value type.' unless aType
    if not (this instanceof Value)
      return createObject aType.ValueType, aValue, aType, aOptions
    defineProperty @, '$type', aType
    @_initialize(aValue, aType, aOptions)
    @assign(aValue, aOptions)
  isValid: ()->@$type.isValid(@valueOf())
  _initialize: (aValue, aType, aOptions)->
    defineProperty @, 'value', null
  _assign:(aValue)->
    @value = aValue
    return
  assign: (aValue, aOptions)->
    checkValidity = aOptions.checkValidity if aOptions
    vType  = @$type
    if aValue instanceof Value
      aValue = aValue.valueOf()
    else if vType.stringToValue and isString(aValue)
      aValue = vType.stringToValue aValue
    @$type.validate(aValue, checkValidity) if checkValidity isnt false
    @_assign aValue
    @
  create: (aValue, aOptions)->
    @$type.createValue aValue, aOptions
  clone: (aOptions) ->
    @create @valueOf(), aOptions
  toString: -> String(@valueOf())
  valueOf: ->@value
  _toObject: (aOptions)->@valueOf()
  toObject: (aOptions)->
    if aOptions and aOptions.withType
      delete aOptions.withType
      result = @toObjectWithType(aOptions)
    else
      result = @_toObject(aOptions)
    result
  toObjectWithType: (aOptions)->
    result = @_toObject(aOptions)
    aOptions = {} unless aOptions
    aOptions.value = result
    @$type.toObject(aOptions)
  # assign value from JSON string.
  fromJson: (aString)->
    aString = JSON.parse aString
    @assign aString
  # create a new value object from JSON string.
  createFromJson: (aString)->
    aString = JSON.parse aString
    vType  = @$type
    aString = vType.stringToValue aString if vType.stringToValue
    createObject @$type.ValueType, aString, vType
  toJSON: (aOptions)->
    result = @toObject(aOptions)
    vType  = @$type
    if vType.valueToString
      if result.hasOwnProperty 'value'
        result.value = vType.valueToString result.value
      else
        result = vType.valueToString result
    result
  toJson: (aOptions)->
    result = @toJSON(aOptions)
    JSON.stringify result
  _inspect: (aOptions)->
    result = '"' + @toString() + '":' + @$type._inspect(aOptions)
  inspect: ->
    '<value ' + @_inspect() + '>'
#End Value class

module.exports  = class Type
  factory Type
  properties Type, name: 'advance'

  @ROOT_NAME: 'type'

  # export the Value Class from here
  @Value: Value
  # override for inherited type class:
  ValueType: Value
  $attributes: attributes

  constructor: (aTypeName, aOptions)->
    # create a new instance object if aOptions is not the original
    # options of the type.
    if not (this instanceof Type) and not (aTypeName instanceof Type)
      if aTypeName
        if isObject aTypeName
          aOptions = aTypeName
          aTypeName = attributes.getValue aOptions, 'name'
        else if not isString aTypeName
          aOptions = aTypeName
          aTypeName = undefined
      if not aTypeName
        # arguments.callee is forbidden if strict mode enabled.
        try vCaller = arguments.callee.caller
        if vCaller and isInheritedFrom vCaller, Type
          aTypeName = vCaller
          vCaller = vCaller.caller
          #get farest hierarchical registered class
          while isInheritedFrom vCaller, aTypeName
            aTypeName = vCaller
            vCaller = vCaller.caller
          aTypeName = Type.getNameFromClass(aTypeName) if aTypeName
        return unless aTypeName
      vTypeClass = Type.registeredClass aTypeName
      if vTypeClass and aOptions and
         not vTypeClass::$attributes.isDefaultObject(aOptions)
        return createObject vTypeClass, aOptions
    return super

  initialize: (aOptions)->
    defineProperty @, 'errors', null
    @$attributes.initializeTo @ if @$attributes
    @_initialize aOptions if @_initialize
    @assign(aOptions) if aOptions?

  finalize: (aOptions)->
    @errors = null if @errors
    @_finalize(aOptions) if @_finalize

  oldAssign = @::assign
  assign: (aOptions, aExclude)->
    @errors = []
    return oldAssign.call @, aOptions, aExclude

  _validate: (aValue, aOptions)->true
  error: (aMessage, aOptions)->
    name = (aOptions && @$attributes.getValue(aOptions, 'name')) || String(@)
    @errors.push name: name, message: aMessage
    return
  isRequired: (aValue, aOptions)->
    aOptions = @ unless isObject aOptions
    vRequired = @$attributes.getValue aOptions, 'required'
    result = not vRequired or (vRequired is true and aValue?)
  validateRequired: (aValue, aOptions)->
    result = @isRequired aValue, aOptions
    @error 'is required', aOptions unless result
    result
  validate: (aValue, raiseError, aOptions)->
    @errors = []
    if isObject raiseError
      aOptions    = raiseError
      raiseError  = aOptions.raiseError
    aOptions = @mergeTo(aOptions, 'name')
    aOptions.raiseError = true if raiseError
    result = @validateRequired aValue, aOptions
    result = @_validate(aValue, aOptions) if result and aValue?
    if raiseError isnt false and not result
      throw new TypeError('"'+aValue + '" is an invalid ' + @name)
    result
  isValid: (aValue) ->
    @validate(aValue, false)

  createValue: (aValue, aOptions)->
    if aOptions and not @isSame(aOptions)
      aOptions = @mergeTo(aOptions, 'name')
      # TODO: seperate the cache-able ability
      if isFunction Type.getCacheItem
        # this Type Factory is cache-able.
        aOptions.cached = true unless aOptions.cached?
        vType = Factory.getCacheItem @Class, aOptions
      else
        vType = @createType aOptions
    else
      vType = @
    createObject vType.ValueType, aValue, vType, aOptions
  create: @::createValue
  createType: (aOptions)->
    delete aOptions.value if aOptions
    result = createObject @Class, aOptions
    result
  cloneType: (aOptions)->
    aOptions = @exportTo(aOptions, 'name', true, true)
    aOptions.name = @name unless aOptions.name
    @createType aOptions
  clone: @::cloneType
  # Get(create) a global Type class or create new Value from the json string.
  # it will create a new type object if options is not the original type
  # options.
  @fromJson: (aString)->
    #aString = JSON.parse aString
    Type.from JSON.parse(aString)
  # create a new Type instance  or create new Value from json string.
  @createFromJson: (aString)->
    Type.createFrom JSON.parse aString

  # Get(create) a global Type class or create new Value from the parametric
  # type object.
  # it will create a new type object if options is not the original(default)
  # type options.
  @from: (aObject) ->
    result = Type aObject
    if aObject.value? and result
      result = result.createValue aObject.value
    result
  @createFrom: (aObject)->
    value   = aObject.value
    result  = Type.create aObject.name, aObject
    result  = result.createValue value if value? and result
    result

  toString: (aOptions)->
    '[type '+ @name+']'

  _inspect: (aOptions, aNameRequired = false)->
    result = '"' + @name + '"'
    vAttrs = @toJson(aOptions, aNameRequired).slice(1,-1)
    result += ': ' + vAttrs if vAttrs
    result
  inspect: ->
    '<type ' + @_inspect()+ '>'
  toJson: (aOptions, aNameRequired)->
    result = @toObject(aOptions, aNameRequired)
    result = JSON.stringify result
    result
  _toObject:(aOptions, aNameRequired = true)->
    vExclude = 'name' unless aNameRequired
    result = @exportTo aOptions, vExclude, true, true
    result
  toObject: (aOptions, aNameRequired)->
    if aOptions
      if not aOptions.typeOnly and not isUndefined aOptions.value
        value = aOptions.value
      delete aOptions.typeOnly
    result = @_toObject(aOptions, aNameRequired)
    result.value = value unless isUndefined value
    result
