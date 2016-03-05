inherits        = require 'inherits-ex/lib/inherits'
Attributes      = require 'property-manager/lib/properties'

module.exports = class TypeAttributes

  inherits TypeAttributes, Attributes

  @attrs: attrs =
    name:
      required: true
      enumerable: false
      exported: true
      assigned: true
      type: 'String'
    required:
      type: 'Boolean'
    customValidate:
      alias: ['custom-validate', 'validate']
      type: 'function'

  constructor: (aOptions, nonExported1stChar)->
    if not (this instanceof TypeAttributes)
      return new TypeAttributes aOptions, nonExported1stChar
    return super aOptions, nonExported1stChar

  _initialize: (aOptions)->
    @merge(attrs)
    super(aOptions)
    return
