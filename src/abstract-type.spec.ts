import 'jest-extended'
import { register, unregister, Type } from './abstract-type'
import isInteger from 'util-ex/lib/is/type/integer'

describe('AbstractType', () => {
  class NumberType extends Type {}
  class BooleanType extends Type {}
  expect(register(NumberType, { aliases: ['number'] })).toBeTrue()
  expect(register(BooleanType, { aliases: ['boolean'] })).toBeTrue()

  describe('create object', () => {
    it('should create a no value type object', () => {
      const result = new NumberType()
      expect(result).toBeInstanceOf(NumberType)
      expect(result.valueOf()).toBeUndefined()
    })
    it('should create a type object', () => {
      expect(Type.get('number')).toStrictEqual(NumberType)
      expect(Type.get({ name: 'boolean' })).toStrictEqual(BooleanType)
      let result = new NumberType(13)
      expect(result.valueOf()).toEqual(13)
      expect(result + 0).toEqual(13)
      result = new Type(13)
      expect(result).toBeInstanceOf(NumberType)
      expect(result.valueOf()).toEqual(13)
      expect(result.toString()).toStrictEqual('13')
    })
    it('should create a type with value object', () => {
      const result = new NumberType(1)
      const vResult = new Type(result)
      expect(vResult).toBeInstanceOf(NumberType)
      expect(vResult.valueOf()).toEqual(1)
      expect(vResult !== result).toBeTrue()
      const b = new Type(new Boolean(true))
      expect(b).toBeInstanceOf(BooleanType)
      expect(b.valueOf()).toEqual(true)
    })
    it('should create a Type object via specified type name', () => {
      let result = new Type(0, 'number')
      expect(result).toBeInstanceOf(NumberType)
      expect(result.valueOf()).toStrictEqual(0)
      result = new Type(1, { name: 'number' })
      expect(result).toBeInstanceOf(NumberType)
      expect(result.valueOf()).toStrictEqual(1)
    })
    it('should create a Type object via specified options', () => {
      const result = new Type(0, { required: true })
      expect(result).toBeInstanceOf(NumberType)
      expect(result).toHaveProperty('required', true)
      expect(result.valueOf()).toStrictEqual(0)
    })
    it('should throw error if can not determine the value type', () => {
      expect(() => new Type(null)).toThrow('can not determine the value type')
      expect(() => new Type({})).toThrow('can not determine the value type')
    })
  })

  describe('static members', () => {
    describe('.register', () => {
      it('should register a Type with attribute', () => {
        const init = jest.fn()
        class AType extends Type {
          _initialize() {
            init.apply(this, arguments)
          }
        }
        expect(register(AType, { required: true })).toBeTrue()
        try {
          expect(Type.get('A')).toStrictEqual(AType)
          expect(AType).toHaveProperty('required', true)
          const result = new AType(12)
          expect(init.mock.calls.length).toBe(1)
          expect(init.mock.calls[0]).toEqual([12, undefined])
          expect(result).toBeInstanceOf(Type)
          expect(result).toHaveProperty('required', true)
        } finally {
          expect(unregister(AType)).toBeTruthy()
        }
      })
      it('should register with specified name', () => {
        class IntType extends NumberType {}
        expect(NumberType.register(IntType, 'integer')).toBeTrue()
        try {
          expect(IntType.prototype.name).toStrictEqual('integer')
        } finally {
          expect(unregister(IntType)).toBeTruthy()
        }
      })
      it('should register with specified parent', () => {
        class IntType extends NumberType {}
        expect(
          Type.register(IntType, { parent: NumberType, name: 'integer' })
        ).toBeTrue()
        try {
          expect(IntType.prototype.name).toStrictEqual('integer')
        } finally {
          expect(unregister(IntType)).toBeTruthy()
        }
      })
    })
    describe('.toString', () => {
      it('should return the registered type name', () => {
        expect(NumberType.toString()).toStrictEqual('Number')
        expect(BooleanType.toString()).toStrictEqual('Boolean')
      })
    })
    describe('.tryGetTypeName', () => {
      it('should try get type name from value pure object', () => {
        expect(Type.tryGetTypeName({ value: 123 })).toStrictEqual('Number')
        expect(Type.tryGetTypeName(new Date())).toStrictEqual('Date')
      })
      it('should not determine type from value pure object', () => {
        expect(Type.tryGetTypeName({})).toBeUndefined()
      })
    })
  })
  describe('instance members', () => {
    describe('assign', () => {
      it('should assign value', () => {
        const result = new Type(123)
        function validate() {
          return true
        }
        result.assign({ value: 45, required: true, validate })
        expect(result).toHaveProperty('required', true)
        expect(result).toHaveProperty('customValidate', validate)
        expect(result.valueOf()).toStrictEqual(45)
      })
      it('should assign value from first value argument', () => {
        const result = new Type(123)
        result.assign({ value: 6, required: true }, { value: 8 })
        expect(result.valueOf()).toStrictEqual(6)
        expect(result).toHaveProperty('required', true)
      })

      it('should assign value from second options argument if first argument no value ', () => {
        const result = new Type(123)
        result.assign({ required: true }, { value: 8 })
        expect(result.valueOf()).toStrictEqual(8)
        expect(result).toHaveProperty('required', true)
      })

      it('should assign with options exclude', () => {
        const result = new Type(123)
        result.assign(
          { value: 5, required: true, validate: () => true },
          {},
          'validate'
        )
        expect(result.valueOf()).toStrictEqual(5)
        expect(result).toHaveProperty('customValidate', undefined)
      })
    })

    describe('validate', () => {
      class IntType extends NumberType {
        _validate(value) {
          return isInteger(value)
        }
      }

      beforeAll(() => {
        expect(NumberType.register(IntType, 'integer')).toBeTrue()
      })

      afterAll(() => {
        expect(unregister(IntType)).toBeTruthy()
      })

      it('should validate a value', () => {
        expect(() => new IntType(32.3)).toThrow('is an invalid')
        const result = new IntType(32.3, { checkValidity: false })
        expect(result.isValid()).toBeFalse()
        expect(result.validate(null, { raiseError: false })).toBeFalse()
        result.assign(33)
        expect(result.isValid()).toBeTrue()
        expect(() => result.assign(3.33)).toThrow('is an invalid')
      })

      it('should validate a required value', () => {
        const result = new IntType(
          { value: 32.3, required: true },
          { checkValidity: false }
        )
        expect(result).toHaveProperty('required', true)
        result.assign(null, { checkValidity: false })
        expect(result.isValid()).toBeFalse()
        expect(result.errors).toHaveLength(1)
        result.errors = []
        expect(result.isRequired()).toBeFalse()
        expect(result.isRequired({})).toBeFalse()
        expect(result.isRequired({ value: 33 })).toBeTrue()
        expect(result.isRequired({ required: false })).toBeTrue()
        expect(result.validateRequired.bind(result)).toThrow()
        expect(result.validateRequired({ raiseError: false })).toBeFalse()
        expect(result.errors).toHaveLength(1)
        expect(result.validateRequired({ value: 12 })).toBeTrue()
      })
    })
  })
})
