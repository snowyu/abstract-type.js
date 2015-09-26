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


### Create the number type

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

### Use the number type

```coffee
cacheable = require 'cache-factory'
Type      = cacheable require('abstract-type') # apply the cache-able ability to Type
require('number-type') #register the number type to Type.

number = Type('Number') # get the number type object.
assert.equal number, Type('Number')

num = Type 'Number', min:1, max:6 # create non-name a virutal type object.
assert.notEqual number, num

NumberType = Type.registeredClass 'Number' # get Number Type Class

TPositiveNumber = # create a virtual type object
  Type('Number', {min:0, cached: 'PositiveNumber'})


assert.notOk TPositiveNumber.isValid(-1)
assert.ok TPositiveNumber.isValid(1) # validate a value

n = TPositiveNumber.create(123) # create the value
n = TPositiveNumber.createValue(123)
assert.ok n.isValid()
assert.equal Number(n) + 3, 126
bool = Type('Boolean').create(true)
assert.equal Number(bool), 1

```

## API

### Type = require('abstract-type')

It's the abstract type info class and the type info manager.

#### constructor([typeName, ]options)

get a the default type info instance object from global cache or create a new virutal type object.

__arguments__

* `typeName` *(string)*: the type name.
* `options` *(object)*: optional type options to apply. different types have different options.
  * `name` *(string)*: the type name.
  * `...`: the type's specified options to create a new virtual type object.

__return__

* *(object)*: the type object instance.


eg,

```js
// get the default type object
var number = Type('number')
// other way to get the default type object
number = Type({name: 'number'})
// another way to get the default type object
number = NumberType()
// create a new virtual type object.
var TPositiveNumber = Type('number', {min:0})
assert.notEqual(TPositiveNumber, number)
```

#### Type.create(typeName, options)

This class method is used to create a new Type instance object.

__arguments__

* `typeName` *(string)*: the type name.
* `options` *(object)*: optional type options. different types have different options.

__return__

* *(object)*: the created type object instance.


#### Type.createFrom(aObject)

the class method to create a type object or value object from a parametric type object.

__arguments__

* `aObject` *(object)*: the encoding string should be decoded to an object.
  * `name` *(string)*: the type name required.
  * `value` : the optional value. return value object if exists.

__return__

* *(object)*:
  * the created type object instance with the type info if no value in it.
  * the created value object instance if value in it.

#### Type.createFromJson(json)

the class method to create a type object or value object from a json string.

__arguments__

* `json` *(string)*: the json string with type info.
  * `name` *(string)*: the type name required.
  * `value` : the optional value. return value object if exists.

__return__

* *(object)*:
  * the created type object instance with the type info if no value in it.
  * the created value object instance if value in it.

#### .cloneType()

the instance method to clone the type object itself.

* alias: clone

__return__

* *(object)*: the created type object instance with same type info.

eg,

```js
var num = Type('Number', min:1)
var num1 = num.cloneType()
assert.ok(num.isSame(num1))
```

#### createType(options)

create a new the type object of this type with the type options.

__arguments__

* `options` *(object)*: optional type options. different types have different options.
  * it is the same as `cloneType()` if no options

__return__

* *(object)*: the created type object instance with the type info options.

#### createValue(value, options)

* alias: create

create a value from the type.

__arguments__

* `value` *(Type)*: the value of this type to create
* `options` *(object)*: optional type options
  * the new virtual type of the value will be created if exists

__return__

* *(object)*: the created value object instance.

#### toObject(aObject, aNameRequired = true)

convert the type info into aObject(an parametric type object). It could be streamable your type.

__arguments__

* `options` *(object)*: optional options
  * `value` *(Type)*: optional value, when value exists, the following options used:
  * `typeOnly` *(boolean)*: just type info if true. defaults to false.
* `aNameRequired` *(boolean)*: write the name to aObject. defaults to true.

__return__

* *(object)*: the created object with type info.

#### toJson(options)

convert the type info to a json string. It could be streamable your type.
It is almost equivalent to JSON.stringify(theTypeObject).

__arguments__

* `options` *(object)*: optional options
  * `value` *(Type)*: optional value, when value exists, the following options used:
  * `typeOnly` *(boolean)*: just type info if true. defaults to false.

__return__

* *(string)*: the json string with type info.

#### validate(value, raiseError, options)

validate a specified value whether is valid.

__arguments__

* `value` *(Type)*: the value to validate
* `raiseError` *(boolean)*:  whether throw error if validate failed. defaults to true.
* `options` *(object)*: optional type options to override. defaults to this type options.

__return__

* *(boolean)*: whether is valid if no raise error.

### Value = require('abstract-type').Value

the value class.

#### constructor(value[[, type], options])

__arguments__

* `value` *(Type)*: the value to be created.
  * it will guess the type if no type object.
* `type` *(Object)*: the optional type object.
* `options` *(object)*: optional type options.
  * checkValidity *(boolean)*: whether check the value is valid. defaults to true.

__return__

* *(object)*: the created value object instance.

#### property $type

point to a type object. It can not be enumerable.

#### clone()

clone the value object.

__return__

* *(object)*: the created new value object instance with same as original info.

#### create(value, options)

create a new the value object.

__arguments__

* `value` *(Type)*: the value to be created. MUST BE the same type.
* `options` *(object)*: optional type options.
  * checkValidity *(boolean)*: whether check the value is valid. defaults to true.

__return__

* *(object)*: the created value object instance.

#### assign(value, options)

assign a value to itself.

__arguments__

* `value` *(Type)*: the value to be assigned. MUST BE the same type.
* `options` *(object)*: optional type options.
  * checkValidity *(boolean)*: whether check the value is valid. defaults to true.

__return__

* *(object)*: `this` object.

#### isValid()

validate the value whether is valid.

__return__

* *(boolean)*: whether the value is valid.

#### toObject(options)

convert the value to an object. It wont include type info. It could be streamable your value.

__arguments__

* `options` *(object)*: optional options

__return__

* *(object)*: the created object with value and type info.

```js
var Type  = require('abstract-type')
var Value = Type.Value

var val = Value(1, Type 'Number')

assert.equal val.toObject(), 1

```

## TODO


## License

MIT
