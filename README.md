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


## Concepts

* Primitive Types
  * All registered types are primitive types.
  * It's the singleton type object on the global type factory.
* Virtual Types
  * It's an object of a primitive type.
  * It can not be registered to the global type factory.
  * It could be unlimited number of virtual types.
    * It could use the LRU-cache factory to cache these virtual types(see usage).
* Type Attributes: the attributes of the type. It's used to constrain the Type.
  All types have the `name` and `required` attributes.
  * `name` *(string)*: the type name.
    * required   = true:  the type name must be required.
    * enumerable = false: the type name can not be enumerable.
  * `required` *(boolean)*: the attribute whether is required(must be exists, not optional).
    default to false.
* Value: the value with corresponding to the type information.

## Usage


### Create the number type

The type has a name and can verify whether a value belongs to that type.
We can draw the two concepts related to the type, from here:

* Attributes: the attributes(meta data) of this type.
* Value: the value of this type.

* The Type Class
  * Properties:
    * $attributes *(object)*: the attributes of this type.
  * Methods(should be overridden):
    * `_initialize(aOptions)`: initialize the type object.
    * `_assign(options)`: assign an options of type to itself.
    * `_validate(aValue, aOptions)`: validate a value whether is valid.
    * `valueToString(aValue)`: (optional) convert the value to string, it's used to convert to json.
    * `toValue(aString)`: (optional) convert the string to the value, it's used to convert from json and assign from value.
    * `ValueType` property: (optional) defaults to `Value` Class. unless implement your own Value class.
* The Value Class
  * Properties:
    * `value`: store the value here.
    * `$type` *(Type)*: point to the type of this value.
  * Static/Class Methods:
    * `tryGetTypeName(Value)`: try to guess the type name of the value.
    * `constructor(value[, type[, options]])`: create a value instance.
      * `value`: the assigned value. it will guess the type of the value if no type provided.
      * `type` *(Type)*: the type of the value
      * `options` *(object)*: the optional type of value options. it will create a new type if exists.
  * Methods:
    * `clone()`: clone this value object.
    * `assign(value, options)`: assign the value.
      * `aOptions` *(object)*:
        * `checkValidity` *(boolean)*: defaults to true.
    * `fromJson(json)`: assign a value from json string.
    * `createFromJson(json)`: create a new value object from json string.
    * `isValid()`: whether the value is valid.
    * `toObject(aOptions)`: return a parametric object of the value. it wont include type info.
      unless set the `withType` is true.
      * aOptions *(object)*:
        * `withType` *(boolean)*: whether includes the type info. default to false
  * These methods could be overridden:
    * `_toObject(aOptions)`: return the parametric object of this value.
    * `valueOf()`: return the value.
    * `_assign(value)`: assign the value to itself.
* The Attributes class: describe the attributes of a type.
  an attribute could include these properties:
  * `name` *(string)*: the attribute name. you can specify a non-english name.
    * the english name(the attributes' key) is used in the internal of the type.
    * the `name` only used on export(`toObject`) or import(`assign`).
  * `type` *(string)*: the attribute type.
  * `enumerable` *(boolean)*: the attribute whether is a hidden attribute, defaults to true.
    * the hidden attribute can not export to the parametric object(serialized).
    * note: It's a hidden attribute too if attribute name begins with '$' char.
  * `required` *(boolean)*: the attribute whether it's required(MUST HAVE).
  * `value`: the default value of the attribute.
  * `assign(value, dest, src, key)` *(function)*: optional special function to assign the attribute's `value`
    from src[`key`] to dest[`key`].
    * src, dest: the type object or the parametric type object.

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

  #valueToString: (aValue)->
  #  aValue = String(aValue)
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
            @error "should be equal or greater than minimum value: " + vMin
        if result and vMax?
          result = aValue <= vMax
          if not result
            @error "should be equal or less than maximum value: " + vMax
    result
```

### Use the number type

* Type(aTypeName, aOptions)
  * get the type info object from glabal cache if aOptions is null
    or the same as the original/default attributes value.
  * else create a new virtual type info object.
* type.createType(aObject) (Type::createType)
  * create a new type info object instance always.
  * the aObject.name should be exists as the type name.

```js
var cacheable = require('cache-factory')
var Type      = cacheable(require('abstract-type')) // apply the cache-able ability to Type
require('number-type') //register the number type to Type.

var number = Type('Number') // get the number type object.
assert.equal(number, Type('Number'))

var num = Type('Number', {min:1, max:6}) // create non-name a virutal type object.
assert.notEqual(number, num)

var NumberType = Type.registeredClass('Number') // get Number Type Class

// create a virtual type object
var TPositiveNumber = Type('Number', {min:0, cached: 'PositiveNumber'})


assert.notOk(TPositiveNumber.isValid(-1))
assert.ok(TPositiveNumber.isValid(1)) // validate a value

var n = TPositiveNumber.create(123) // create the value
n = TPositiveNumber.createValue(123)
assert.ok(n.isValid())
assert.equal(Number(n) + 3, 126)
```

## API

### Type = require('abstract-type')

It's the abstract type info class and the type info manager.

* `constructor([typeName, ]options)`: get a the default type info instance object from global cache or create a new virutal type object.
  * __arguments__
    * `typeName` *(string)*: the type name.
    * `options` *(object)*: optional type options to apply. different types have different options.
      * `name` *(string)*: the type name.
      * `...`: the type's specified options to create a new virtual type object.
  * __return__
    * *(object)*: the type object instance.
  * eg:

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
* `Type.create(typeName, options)`:This class method is used to create a new Type instance object.
  * __arguments__
    * `typeName` *(string)*: the type name.
    * `options` *(object)*: optional type options. different types have different options.
  * __return__
    * *(object)*: the created type object instance.
* `Type.createFrom(aObject)`: the class method to create a type object or value object from a parametric type object.
  * __arguments__
    * `aObject` *(object)*: the encoding string should be decoded to an object.
      * `name` *(string)*: the type name required.
      * `value` : the optional value. return value object if exists.
  * __return__
    * *(object)*:
      * the created type object instance with the type info if no value in it.
      * the created value object instance if value in it.
* `Type.createFromJson(json)`:the class method to create a type object or value object from a json string.
  * __arguments__
    * `json` *(string)*: the json string with type info.
      * `name` *(string)*: the type name required.
      * `value` : the optional value. return value object if exists.
  * __return__
    * *(object)*:
      * the created type object instance with the type info if no value in it.
      * the created value object instance if value in it.
* `cloneType()`:the instance method to clone the type object itself.
  * alias: clone
  * __return__
    * *(object)*: the created type object instance with same type info.
  * eg:

    ```js
    var num = Type('Number', min:1)
    var num1 = num.cloneType()
    assert.ok(num.isSame(num1))
    ```
* `createType(options)`: create a new the type object of this type with the type options.
  * __arguments__
    * `options` *(object)*: optional type options. different types have different options.
      * it is the same as `cloneType()` if no options
  * __return__
    * *(object)*: the created type object instance with the type info options.
* `createValue(value, options)`:create a value from the type.
  * alias: create
  * __arguments__
    * `value` *(Type)*: the value of this type to create
    * `options` *(object)*: optional type options
      * the new virtual type of the value will be created if exists
  * __return__
    * *(object)*: the created value object instance.
* `toObject(aObject, aNameRequired = true)`:convert the type info into aObject(an parametric type object).
  It could be streamable your type.
  * __arguments__
    * `options` *(object)*: optional options
      * `value` *(Type)*: optional value, when value exists, the following options used:
      * `typeOnly` *(boolean)*: just type info if true. defaults to false.
    * `aNameRequired` *(boolean)*: write the name to aObject. defaults to true.
  * __return__
    * *(object)*: the created object with type info.
* `toJson(options)`:convert the type info to a json string. It could be streamable your type.
  It is almost equivalent to JSON.stringify(theTypeObject).
  * __arguments__
    * `options` *(object)*: optional options
      * `value` *(Type)*: optional value, when value exists, the following options used:
      * `typeOnly` *(boolean)*: just type info if true. defaults to false.
  * __return__
    * *(string)*: the json string with type info.
* `validate(value, raiseError, options)`:validate a specified value whether is valid.
  * __arguments__
    * `value` *(Type)*: the value to validate
    * `raiseError` *(boolean)*:  whether throw error if validate failed. defaults to true.
    * `options` *(object)*: optional type options to override. defaults to this type options.
  * __return__
    * *(boolean)*: whether is valid if no raise error.

### Value = require('abstract-type').Value

the value class.

You should implement the `valueToString(aValue)` and `stringToValue(aString)` method in your derived type class
to make the value streamable.


* `constructor(value[[, type], options])`: create a value object.
  * __arguments__
    * `value` *(Type)*: the value to be created.
      * it will guess the type if no type object.
    * `type` *(Object)*: the optional type object.
    * `options` *(object)*: optional type options.
      * checkValidity *(boolean)*: whether check the value is valid. defaults to true.
  * __return__
    * *(object)*: the created value object instance.
* property `$type`: point to a type object. It can not be enumerable.
* `clone()`: clone the value object.
  * __return__
    * *(object)*: the created new value object instance with same as original info.
* `create(value, options)`:create a new the value object.
  * __arguments__
    * `value` *(Type)*: the value to be created. MUST BE the same type.
    * `options` *(object)*: optional type options.
      * checkValidity *(boolean)*: whether check the value is valid. defaults to true.
  * __return__
    * *(object)*: the created value object instance.
* `assign(value, options)`:assign a value to itself.
  * __arguments__
    * `value` *(Type)*: the value to be assigned. MUST BE the same type.
    * `options` *(object)*: optional type options.
      * checkValidity *(boolean)*: whether check the value is valid. defaults to true.
  * __return__
    * *(object)*: `this` object.
* `isValid()`: validate the value whether is valid.
  * __return__
    * *(boolean)*: whether the value is valid.
* `toObject(options)`:convert the value to an object. It wont include type info via defaults.
  It could be streamable your value.
  * __arguments__
    * `options` *(object)*: optional options
      * `withType` *(Boolean)*: whether with type info, defaults to false.
  * __return__
    * *(object)*: the value and type info(if `withType`).
  * eg:

    ```js
    var Type  = require('abstract-type')
    var Value = Type.Value

    var val = Value(1, Type 'Number')

    assert.equal val.toObject(), 1

    ```

## TODO

+ make the validators plugin-able

  ```coffee
  NumberType.registerValidator
    name: 'required'
    validate: (aValue)->aValue?
  NumberType.registerValidator 'required', (aValue)->aValue?
  ```

## License

MIT
