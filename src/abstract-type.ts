import {
  CustomFactory,
  IBaseFactoryOptions,
  isPureObject,
} from 'custom-factory'
import properties from 'property-manager/lib/ability'
import { IMergeOptions } from 'property-manager/lib/abstract'
import Properties from 'property-manager/lib/properties'
import isInheritedFrom from 'inherits-ex/lib/isInheritedFrom'
import isObject from 'util-ex/lib/is/type/object'
import isFunction from 'util-ex/lib/is/type/function'
import isString from 'util-ex/lib/is/type/string'
import isArray from 'util-ex/lib/is/type/array'
import isUndefined from 'util-ex/lib/is/type/undefined'
import defineProperty from 'util-ex/lib/defineProperty'
import getPrototypeOf from 'inherits-ex/lib/getPrototypeOf'

// const extend          = require('util-ex/lib/_extend')

const objectToString = Object.prototype.toString
// const getObjectKeys   = Object.keys

interface ITypeOptions extends IBaseFactoryOptions {
  [name: string]: any
}

/**
 * The Abstract Type information class
 *
 */
export class Type extends CustomFactory {
  /**
   * the root name
   */
  static ROOT_NAME = 'type'

  static register(aClass, aOptions?: string | ITypeOptions)
  static register(
    aClass,
    aParentClass?: typeof Type | string | ITypeOptions,
    aOptions?: string | ITypeOptions
  ) {
    /* istanbul ignore else */
    if (isString(aParentClass)) {
      aOptions = aParentClass
      aParentClass = undefined
    } else if (isPureObject(aParentClass)) {
      aOptions = aParentClass
      aParentClass = aOptions.parent
    }

    const result = super.register(aClass, aParentClass, aOptions)
    /* istanbul ignore else */
    if (result) {
      const vPrototype = this.prototype
      const $attributes = vPrototype.$attributes
      if (!aOptions || isString(aOptions)) aOptions = {}
      $attributes.initializeTo(aClass, aOptions, { skipUndefined: true })
    }
    return result
  }

  /**
   * try to get the type name from a value
   * @internal
   * @param {*} value the value
   * @returns {string|undefined}
   */
  static tryGetTypeName(value) {
    let result
    if (isPureObject(value)) value = value.value
    if (value instanceof Type) {
      result = getPrototypeOf(value).name
    } else if (value instanceof Object) {
      result = objectToString.call(value)
      const i = result.lastIndexOf(' ')
      /* istanbul ignore else */
      if (i >= 0) {
        result = result.substring(i + 1, result.length - 1)
      }
    } else if (value !== undefined) {
      result = typeof value
      result = result.charAt(0).toUpperCase() + result.substring(1)
    }
    return result
  }

  /**
   * get the Type info class from the type name
   * @param {string|Object} aTypeName the type name or value with type object
   * @param {Object=} aOptions
   * @returns {typeof Type|undefined}
   */
  static get(aTypeName, aOptions?) {
    /* istanbul ignore else */
    if (aTypeName) {
      if (isObject(aTypeName) || !isString(aTypeName)) {
        aOptions = aTypeName
        // get the type name for the value with type.
        aTypeName = this.prototype.$attributes.getValue(aOptions, 'name')
      }
    }
    /* istanbul ignore else */
    if (aTypeName) return super.get(aTypeName)
  }

  static toString() {
    return this.prototype.name
  }

  /**
   * Create a new value instance of the type
   * @param {*} aValue the value to clone
   * @param {string|Object} aType the type name or the type options object
   * @param {Object} aOptions the type options object
   * @returns {Type} the value of the type
   */
  constructor(aValue, aOptions?)
  constructor(aValue, aType?, aOptions?) {
    if (isPureObject(aType)) {
      aOptions = aType
      aType = aOptions.name
    }

    if (new.target === Type) {
      if (!aType) {
        aType = (aOptions && aOptions.name) || Type.tryGetTypeName(aValue)
      }

      if (isString(aType)) {
        aType = Type.get(aType)
      }

      if (!aType) throw new TypeError('can not determine the value type.')
      /* istanbul ignore else */
      if (aType !== Type) return new aType(aValue, aOptions)
    }
    super(aValue, aOptions)
  }

  /**
   * @internal
   */
  initialize(aValue, aOptions) {
    defineProperty(this, 'errors', null)
    const TheType = this.Class || this.constructor
    /* istanbul ignore else */
    if (this.$attributes) this.$attributes.initializeTo(this, TheType)
    if (this._initialize) this._initialize(aValue, aOptions)
    if (aValue !== undefined || aOptions != null) this.assign(aValue, aOptions)
    return 'ok'
  }

  /* istanbul ignore next */
  finalize(aOptions) {
    if (this.errors) this.errors = null
    if (this.value) this.value = null
    if (this._finalize) this._finalize(aOptions)
  }

  assign(aValue, aOptions, aExclude) {
    this.errors = []
    if (!aOptions) aOptions = {}
    const checkValidity = aOptions.checkValidity
    const TheType = this.Class || this.constructor

    if (aValue instanceof Type) {
      aValue = aValue.toObject()
    } else if (!isPureObject(aValue)) {
      /* istanbul ignore if */
      if (isFunction(TheType.toValue)) {
        aValue = TheType.toValue(aValue, aOptions)
      } else if (aValue && isFunction(aValue.valueOf)) {
        aValue = aValue.valueOf()
      }
      aValue = { value: aValue }
    }

    this.$attributes.initializeTo(aValue, aOptions, { skipUndefined: true })

    if (checkValidity !== false) this.validate(aValue, checkValidity)
    if (aExclude) {
      aOptions.exclude = aExclude
    }
    return this.__assign(aValue, aOptions)
  }

  valueOf() {
    return this.value
  }

  toString() {
    return this.value + ''
  }

  /**
   * Whether the value can pass the `required` rule check
   * @param aOptions
   * @returns
   */
  isRequired(aOptions?) {
    if (!isObject(aOptions)) {
      aOptions = this
    } else {
      aOptions = this.mergeTo(aOptions, {
        skipNull: true,
        skipUndefined: true,
        exclude: 'name',
      })
    }
    return this._isRequired(aOptions.value, aOptions)
  }

  _isRequired(aValue, aOptions) {
    const vRequired = this.$attributes.getValue(aOptions, 'required')
    const result = !vRequired || (vRequired === true && aValue != null)
    return result
  }

  /* istanbul ignore next */
  _validate(aValue, aOptions?) {
    return true
  }

  error(aMessage, aOptions) {
    name =
      (aOptions && this.$attributes.getValue(aOptions, 'name')) || String(this)
    this.errors.push({ name, message: aMessage })
  }

  validateRequired(aOptions?) {
    const result = this.isRequired(aOptions)
    if (!result) {
      if (aOptions?.raiseError !== false) {
        throw new TypeError('"' + this.name + '" is required')
      } else {
        this.error('is required', aOptions)
      }
    }
    return result
  }

  _validateRequired(aValue, aOptions) {
    const result = this._isRequired(aValue, aOptions)
    if (!result) this.error('is required', aOptions)
    return result
  }

  validate(aOptions?, raiseError?) {
    let customValidate!: Function
    this.errors = []
    if (!aOptions && isObject(raiseError)) {
      aOptions = raiseError
      raiseError = aOptions.raiseError
    }
    if (aOptions) {
      // allow use the property alias of customValidate
      customValidate = this.$attributes.getValue(aOptions, 'customValidate')
      if (raiseError === undefined) raiseError = aOptions.raiseError
    }
    aOptions = this.mergeTo(aOptions, {
      skipNull: true,
      skipUndefined: true,
      exclude: 'name',
    })
    if (!customValidate) customValidate = aOptions.customValidate
    // if (raiseError !== false) aOptions.raiseError = true

    let result = this._validateRequired(aOptions.value, aOptions)
    if (result && isFunction(customValidate)) {
      result = customValidate.call(this, aOptions)
    }
    if (result) {
      result = this._validate(aOptions.value, aOptions)
    }
    if (raiseError !== false && !result)
      throw new TypeError('"' + aOptions.value + '" is an invalid ' + this.name)
    return result
  }

  isValid(aOptions) {
    return this.validate(aOptions, false)
  }
}
properties(Type, { name: 'advance' })

export const register = Type.register.bind(Type)
export const unregister = Type.unregister.bind(Type)
export const alias = Type.setAliases.bind(Type)

const defineProperties = Type.defineProperties
// console.log('TCL:: ~ file: abstract-type.ts ~ line 149 ~ defineProperties', defineProperties);

defineProperties(Type, {
  name: {
    required: true,
    enumerable: false,
    exported: true,
    assigned: true,
    type: 'String',
  },
  required: {
    type: 'Boolean',
  },
  customValidate: {
    alias: ['custom-validate', 'validate'],
    type: 'function',
  },
  value: {
    type: 'any',
  },
})
