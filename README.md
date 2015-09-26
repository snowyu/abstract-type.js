## abstract-type [![npm][npm-svg]][npm]

[![Build Status][travis-svg]][travis]
[![Code Climate][codeclimate-svg]][codeclimate]
[![Test Coverage][codeclimate-test-svg]][codeclimate-test]
[![downloads][npm-download-svg]][npm]
[![license][npm-license-svg]][npm]

[npm]: https://npmjs.org/package/abstract-type
[npm-svg]: https://img.shields.io/npm/v/abstract-type.svg
[npm-download-svg]: https://img.shields.io/npm/dm/abstract-type.svg
[npm-license-svg]: https://img.shields.io/npm/l/abstract-type.svg
[travis-svg]: https://img.shields.io/travis/snowyu/abstract-type.js/master.svg
[travis]: http://travis-ci.org/snowyu/abstract-type.js
[codeclimate-svg]: https://codeclimate.com/github/snowyu/abstract-type.js/badges/gpa.svg
[codeclimate]: https://codeclimate.com/github/snowyu/abstract-type.js
[codeclimate-test-svg]: https://codeclimate.com/github/snowyu/abstract-type.js/badges/coverage.svg
[codeclimate-test]: https://codeclimate.com/github/snowyu/abstract-type.js/coverage


The abstract-type library includes the abstract `Type` class and `Value` class for streamable type info and validating value.



## Usage

```coffee
TypeAttributes    = require 'abstract-type/lib/attributes'
Type              = require 'abstract-type'
register          = Type.register
aliases           = Type.aliases

class NumberType
  register NumberType
  aliases NumberType, 'number'

  $attributes: TypeAttributes
    min:
      name: 'min'
      type: 'Number'
    max:
      name: 'max'
      type: 'Number'

  _encodeValue: (aValue)->
    aValue = String(aValue)
  _decodeValue: (aString)->
    if isInt aString
      aString = parseInt(aString)
    else if isFloat aString
      aString = parseFloat(aString)
    else
      aString = undefined
    aString
  _validate: (aValue, aOptions)->
    aValue = @_decodeValue(aValue) if isString aValue
    result = isNumber aValue
    if result
      if aOptions
        vMin = aOptions.min
        vMax = aOptions.max
        if vMin?
          result = aValue >= vMin
          if not result
            @error "should be equal or greater than minimum value: " + vMin
        if result and vMax?
          result = aValue <= vMax
          if not result
            @error "should be equal or less than maximum value: " + vMax
    result
```

## API


## TODO


## License

MIT
