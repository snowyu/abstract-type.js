isInt           = require 'util-ex/lib/is/string/int'
isFloat         = require 'util-ex/lib/is/string/float'
isNumber        = require 'util-ex/lib/is/type/number'
isString        = require 'util-ex/lib/is/type/string'
Attributes      = require '../src/attributes'

module.exports = class NumberType
  constructor: ->return super
  $attributes: Attributes
    min:
      type: 'Number'
    max:
      type: 'Number'
  valueToString: (aValue)-> aValue #do nothing, just for testing.
  stringToValue: (aString)->
    if isInt aString
      aString = parseInt(aString)
    else if isFloat aString
      aString = parseFloat(aString)
    else
      aString = undefined
    aString
  _validate: (aValue, aOptions)->
    aValue = @stringToValue(aValue) if isString aValue
    result = isNumber aValue
    if result
      if aOptions
        vMin = aOptions.min
        vMax = aOptions.max
        if vMin?
          result = aValue >= vMin
          if not result
            @error 'should be equal or greater than minimum value: ' + vMin
        if result and vMax?
          result = aValue <= vMax
          if not result
            @error 'should be equal or less than maximum value: ' + vMax
    result
