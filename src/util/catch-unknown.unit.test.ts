import { describe, expect, it } from 'vitest';

import { asError, isError } from './catch-unknown';

class MyClass {
  toString() {
    return 'hello';
  }
}

const symbol = Symbol('world');

describe('catch-unknown', () => {
  it('isError(new Error())', () => {
    expect(isError(new Error())).toBe(true);
  });

  it('isError({ name: "foo", message: "bar" })', () => {
    expect(isError({ name: 'foo', message: 'bar' })).toBe(true);
  });

  it('isError({ name: "foo", message: "bar", stack: "" })', () => {
    expect(isError({ name: 'foo', message: 'bar', stack: '' })).toBe(true);
  });

  it('isError({ name: "foo" })', () => {
    // no message
    expect(isError({ name: 'foo' })).toBe(false);
  });

  it('isError({ message: "bar" })', () => {
    // no name
    expect(isError({ message: 'bar' })).toBe(false);
  });

  it('isError({ name: "foo", message: "bar", stack: true })', () => {
    // wrong type for stack
    expect(isError({ name: 'foo', message: 'bar', stack: true })).toBe(false);
  });

  it('isError({})', () => {
    expect(isError({})).toBe(false);
  });

  it('isError(new MyClass())', () => {
    expect(isError(new MyClass())).toBe(false);
  });

  it('isError("some string")', () => {
    expect(isError('some string')).toBe(false);
  });

  it('isError(function f() {})', () => {
    expect(isError(function f() {})).toBe(false);
  });

  it('isError(symbol)', () => {
    expect(isError(symbol)).toBe(false);
  });

  it('isError(null)', () => {
    expect(isError(null)).toBe(false);
  });

  it('isError(undefined)', () => {
    expect(isError(undefined)).toBe(false);
  });

  it('asError(new Error())', () => {
    const err = new Error();
    expect(asError(err)).toBe(err);
    expect(err instanceof Error).toBe(true);
  });

  it('asError({ name: "foo", message: "bar" })', () => {
    const err = { name: 'foo', message: 'bar' };
    expect(asError(err)).toBe(err);
    expect(err instanceof Error).toBe(false);
  });

  it('asError({ name: "foo", message: "bar", stack: "" })', () => {
    const err = { name: 'foo', message: 'bar', stack: '' };
    expect(asError(err)).toBe(err);
    expect(err instanceof Error).toBe(false);
  });

  it('asError({ name: "foo" })', () => {
    const err = asError({ name: 'foo' });
    expect(err.name).toEqual('Object');
    expect(err.message).toEqual('{"name":"foo"}');
    expect(err.toString()).toEqual('Object: {"name":"foo"}');
    expect(err instanceof Error).toBe(true);
  });

  it('asError({ message: "bar" })', () => {
    const err = asError({ message: 'bar' });
    expect(err.name).toEqual('Object');
    expect(err.message).toEqual('bar');
    expect(err.toString()).toEqual('Object: bar');
    expect(err instanceof Error).toBe(true);
  });

  it('asError({ name: "foo", message: "bar", stack: true })', () => {
    const err = asError({ name: 'foo', message: 'bar', stack: true });
    expect(err.name).toEqual('Object');
    expect(err.message).toEqual('bar');
    expect(err.toString()).toEqual('Object: bar');
    expect(err instanceof Error).toBe(true);
  });

  it('asError({})', () => {
    const err = asError({});
    expect(err.name).toEqual('Object');
    expect(err.message).toEqual('{}');
    expect(err.toString()).toEqual('Object: {}');
    expect(err instanceof Error).toBe(true);
  });

  it('asError({ value: 42 })', () => {
    const err = asError({ value: 42 });
    expect(err.name).toEqual('Object');
    expect(err.message).toEqual('{"value":42}');
    expect(err.toString()).toEqual('Object: {"value":42}');
    expect(err instanceof Error).toBe(true);
  });

  it('asError(circular)', () => {
    const circular: Record<string, object | null> = { self: null };
    // causes JSON.stringify() to throw, falling back to String()
    circular.self = circular;
    const err = asError(circular);
    expect(err.name).toEqual('Object');
    expect(err.message).toEqual('[object Object]');
    expect(err.toString()).toEqual('Object: [object Object]');
    expect(err instanceof Error).toBe(true);
  });

  it('asError(new MyClass())', () => {
    const err = asError(new MyClass());
    expect(err.name).toEqual('MyClass');
    expect(err.message).toEqual('hello');
    expect(err.toString()).toEqual('MyClass: hello');
    expect(err instanceof Error).toBe(true);
  });

  it('asError("some string")', () => {
    const err = asError('some string');
    expect(err.name).toEqual('string');
    expect(err.message).toEqual('some string');
    expect(err.toString()).toEqual('string: some string');
    expect(err instanceof Error).toBe(true);
  });

  it('asError(function f() {})', () => {
    const err = asError(function f() {});
    expect(err.name).toBe('function');
    // exact representation is implementation-defined:
    // https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-function.prototype.tostring
    expect(err.message).toMatch(/^function/);
    expect(err.toString()).toMatch(/^function: function/);
    expect(err instanceof Error).toBe(true);
  });

  it('asError(symbol)', () => {
    const err = asError(symbol);
    expect(err.name).toEqual('symbol');
    expect(err.message).toEqual('Symbol(world)');
    expect(err.toString()).toEqual('symbol: Symbol(world)');
    expect(err instanceof Error).toBe(true);
  });

  it('asError(42)', () => {
    const err = asError(42);
    expect(err.name).toEqual('number');
    expect(err.message).toEqual('42');
    expect(err.toString()).toEqual('number: 42');
    expect(err instanceof Error).toBe(true);
  });

  it('asError(false)', () => {
    const err = asError(false);
    expect(err.name).toEqual('boolean');
    expect(err.message).toEqual('false');
    expect(err.toString()).toEqual('boolean: false');
    expect(err instanceof Error).toBe(true);
  });

  it('asError(null)', () => {
    const err = asError(null);
    expect(err.name).toEqual('object');
    expect(err.message).toEqual('null');
    expect(err.toString()).toEqual('object: null');
    expect(err instanceof Error).toBe(true);
  });

  it('asError(undefined)', () => {
    const err = asError(undefined);
    expect(err.name).toEqual('undefined');
    expect(err.message).toEqual('undefined');
    expect(err.toString()).toEqual('undefined: undefined');
    expect(err instanceof Error).toBe(true);
  });
});
