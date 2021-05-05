/* eslint-disable no-unused-vars */
import {
  CustomFactory,
  IBaseFactoryOptions,
  isPureObject,
} from 'custom-factory'
import properties from 'property-manager/lib/ability'
import { IMergeOptions, PropDescriptors } from 'property-manager/lib/abstract'
import Properties from 'property-manager/lib/properties'
import isObject from 'util-ex/lib/is/type/object'
import isFunction from 'util-ex/lib/is/type/function'
import isString from 'util-ex/lib/is/type/string'
import defineProperty from 'util-ex/lib/defineProperty'
import getPrototypeOf from 'inherits-ex/lib/getPrototypeOf'
// import createCtor from 'inherits-ex/lib/createCtor'
// import inherits from 'inherits-ex/lib/inherits'

// const extend          = require('util-ex/lib/_extend')

const objectToString = Object.prototype.toString
// const getObjectKeys   = Object.keys

export interface ITypeOptions extends IBaseFactoryOptions {
  [name: string]: any
}

export interface ITypeObjectOptions extends IMergeOptions {
  typeOnly?: boolean
  [key: string]: any
}

export interface IErrorMessage {
  name: string
  message: string
  [ix: string]: any
}

export type ValidationFn = (this: Type, value: any, options?) => boolean
export type ToValueFn = (this: typeof Type, value: any, options?) => any
export type DefinePropertiesFn = (
  aTarget,
  aProperties: PropDescriptors,
  recreate?: boolean
) => Properties
export type CloneFn = (this: Type, options?: ITypeObjectOptions) => Type
export type ExportToFn = (this: Type, dest, options?: ITypeObjectOptions) => any
/**
 * The Abstract Type information class
 *
 */
export class Type extends CustomFactory {
  declare static defineProperties: DefinePropertiesFn
  declare static $attributes: Properties
  declare name: string
  declare value: any
  declare required: boolean
  declare customValidate: undefined | ValidationFn
  declare Class: typeof Type
  declare $attributes: Properties
  declare getProperties: () => Properties
  declare mergeTo: ExportToFn
  declare exportTo: ExportToFn
  declare cloneTo: ExportToFn
  declare assignTo: ExportToFn
  declare __assign: Function
  declare clone: CloneFn
  declare isSame: (src, options?: ITypeObjectOptions) => boolean
  declare toJSON: () => any

  declare static toValue: ToValueFn

  /**
   * the root name
   */
  static ROOT_NAME = 'type'
  errors: null | IErrorMessage[] = null

  static register(aClass, aOptions?: string | ITypeOptions): boolean
  static register(
    aClass,
    aParentClass?: typeof Type | string | ITypeOptions,
    aOptions?: string | ITypeOptions
  ): boolean {
    /* istanbul ignore else */
    if (typeof aParentClass === 'string') {
      aOptions = aParentClass
      aParentClass = undefined
    } else if (isPureObject(aParentClass)) {
      aOptions = aParentClass
      aParentClass = aOptions!.parent
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
        const $attributes = this.prototype.$attributes
        // get the type name for the value with type.
        aTypeName = $attributes.getValue(aOptions, 'name')
      }
    }
    /* istanbul ignore else */
    if (aTypeName) return super.get(aTypeName)
  }

  static toString(): string {
    /* istanbul ignore next */
    return this.prototype.name || this.name
  }

  // static createType(aType?, aOptions?): typeof Type {
  //   if (isPureObject(aType)) {
  //     aOptions = aType
  //     aType = aOptions.name
  //   }
  //   if (typeof aType === 'string') {
  //     const result = createCtor(aType)
  //     if (this.register(result, aOptions)) {
  //       return result
  //     }
  //   }
  // }

  /**
   * Create a new value instance of the type
   * @param {*} aValue the value to clone
   * @param {string|Object} aType the type name or the type options object
   * @param {Object} aOptions the type options object
   * @returns {Type} the value of the type
   */
  constructor(aValue?, aOptions?)
  constructor(aValue?, aType?, aOptions?) {
    // super() // only for generate declaration file
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
  initialize(aValue?, aOptions?) {
    defineProperty(this, 'errors', null)
    const TheType = this.Class || this.constructor
    const $attributes = this.$attributes
    /* istanbul ignore else */
    if ($attributes) {
      $attributes.initializeTo(this, TheType)
    }
    this._initialize(aValue, aOptions)
    if (aValue !== undefined || aOptions != null) this.assign(aValue, aOptions)
    return 'ok'
  }

  /* istanbul ignore next */
  finalize(aOptions?) {
    if (this.errors) this.errors = null
    if (this.value) this.value = null
    this._finalize(aOptions)
  }

  _finalize(aOptions?) {}
  _initialize(aValue?, aOptions?) {}

  assign(aValue, aOptions?, aExclude?) {
    this.errors = []
    if (!aOptions) aOptions = {}
    const checkValidity = aOptions.checkValidity
    const TheType = this.Class || this.constructor

    if (aValue instanceof Type) {
      aValue = aValue.toObject({ withType: true })
    } else if (!isPureObject(aValue)) {
      aValue = { value: aValue }
    }

    const $attributes = this.$attributes
    $attributes.initializeTo(aValue, aOptions, {
      skipUndefined: true,
    })

    let value = aValue.value
    if (value != null) {
      if (isFunction(TheType.toValue)) {
        value = TheType.toValue(value, aOptions) ?? value
      } /* istanbul ignore else */ else if (isFunction(value.valueOf)) {
        value = value.valueOf()
      }
      aValue.value = value
    }

    if (checkValidity !== false) this.validate(aValue, checkValidity)
    if (aExclude) {
      aOptions.exclude = aExclude
    }
    return this.__assign(aValue, aOptions)
  }

  valueOf() {
    return this.value
  }

  toString(): string {
    return this.valueOf() + ''
  }

  _toObject(aOptions?) {
    return this.valueOf()
  }

  toTypeObject(this: any, aOptions?: ITypeObjectOptions, aNameRequired = true) {
    const exclude = aNameRequired ? ['value'] : ['name', 'value']
    /* istanbul ignore else */
    if (!aOptions) aOptions = {}
    aOptions.exclude = addItemToArray(exclude, aOptions.exclude)
    return this.exportTo({}, aOptions)
  }

  toObject(this: any, aOptions?, aNameRequired?: boolean) {
    const typeOnly = aOptions && aOptions.typeOnly
    const withType = typeOnly || (aOptions && aOptions.withType)

    let result
    if (typeOnly || withType) {
      result = this.toTypeObject(aOptions, aNameRequired)
      if (!typeOnly) {
        result.value = this._toObject(aOptions)
      }
    } else {
      result = this._toObject(aOptions)
    }

    return result
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
  _validate(aValue, aOptions) {
    return true
  }

  error(this: any, aMessage, aOptions?) {
    const name: string =
      (aOptions && this.$attributes.getValue(aOptions, 'name')) ||
      this.name
    this.errors?.push({ name, message: aMessage })
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

  // validate(aValue, aOptions|raiseError?)
  validate(this: any, aOptions?, raiseError?) {
    let customValidate!: Function
    this.errors = []
    if (aOptions != null) {
      if (!(aOptions instanceof Type) && !isPureObject(aOptions)) {
        aOptions = { value: aOptions }
      }
    } else {
      aOptions = {}
    }

    if (isObject(raiseError)) {
      Object.assign(aOptions, raiseError)
      raiseError = aOptions.raiseError
    }
    if (raiseError === undefined) raiseError = aOptions.raiseError

    const $attributes = this.$attributes
    // allow use the property alias of customValidate
    customValidate = $attributes.getValue(aOptions, 'customValidate')

    aOptions = this.mergeTo(aOptions, {
      skipNull: true,
      skipUndefined: true,
      exclude: 'name',
    })
    if (!customValidate) customValidate = aOptions.customValidate
    // if (raiseError !== false) aOptions.raiseError = true

    let result = this._validateRequired(aOptions.value, aOptions)
    if (result && isFunction(customValidate)) {
      result = customValidate.call(this, aOptions.value, aOptions)
    }
    if (result && aOptions.value != null) {
      result = this._validate(aOptions.value, aOptions)
    }
    if (raiseError !== false && !result) {
      throw new TypeError('"' + aOptions.value + '" is an invalid ' + this.name)
    }
    return result
  }

  isValid(aOptions?) {
    return this.validate(aOptions, false)
  }
}
properties(Type, { name: 'advance', exclude: 'toObject' })

export const register = Type.register.bind(Type)
export const unregister = Type.unregister.bind(Type)
export const alias = Type.setAliases.bind(Type)
export const defineProperties = Type.defineProperties

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

export function addItemToArray(
  value: string | string[],
  items: string | string[] | undefined
) {
  if (typeof items === 'string') {
    items = [items]
  }

  if (typeof value === 'string') {
    value = [value]
  }

  const result: string[] = items ?? value ?? []

  if (Array.isArray(items)) {
    if (value)
      value.forEach((item) => {
        if (result.indexOf(item) === -1) {
          result.push(item)
        }
      })
  }
  return result
}
