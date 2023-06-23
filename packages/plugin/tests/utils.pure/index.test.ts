import { applyDeepOverrides } from "../../src/utils.pure/config";

describe("utils.pure", () => {
  describe("#applyDeepOverrides", () => {
    it("can merge false into true", () => {
      const actual = applyDeepOverrides(true, false);
      const expected = false;
      expect(actual).toBe(expected);
    });

    it("can merge true into false", () => {
      const actual = applyDeepOverrides(false, true);
      const expected = true;
      expect(actual).toBe(expected);
    });

    it("can merge same boolean values", () => {
      const actual = applyDeepOverrides(true, true);
      const expected = true;
      expect(actual).toBe(expected);
    });

    it("can merge false into object", () => {
      const actual = applyDeepOverrides({ Foo: true }, false);
      const expected = false;
      expect(actual).toBe(expected);
    });

    it("can merge true into object", () => {
      const actual = applyDeepOverrides({ Foo: false }, true);
      const expected = true;
      expect(actual).toBe(expected);
    });

    it("can merge same object values", () => {
      const actual = applyDeepOverrides({ Foo: true }, { Foo: true });
      const expected = { Foo: true };
      expect(actual).toEqual(expected);
    });

    it("can merge different object values", () => {
      const actual = applyDeepOverrides({ Foo: true }, { Foo: false });
      const expected = { Foo: false };
      expect(actual).toEqual(expected);
    });

    it("can merge different nested object values", () => {
      const actual = applyDeepOverrides({ Foo: { Bar: true } }, { Foo: { Bar: false } });
      const expected = { Foo: { Bar: false } };
      expect(actual).toEqual(expected);
    });

    it("can merge nested object into boolean", () => {
      const actual = applyDeepOverrides(true, { Foo: { Bar: false } });
      const expected = { Foo: { Bar: false } };
      expect(actual).toEqual(expected);
    });

    it("can merge boolean into nested object", () => {
      const actual = applyDeepOverrides({ Foo: { Bar: true } }, { Foo: false });
      const expected = { Foo: false };
      expect(actual).toEqual(expected);
    });

    it("can merge nested object into nested object without overlapping properties", () => {
      const actual = applyDeepOverrides({ Foo: { Bar: true } }, { Foo: { Baz: false } });
      const expected = { Foo: { Bar: true, Baz: false } };
      expect(actual).toEqual(expected);
    });

    it("does not override if override is undefined", () => {
      const actual = applyDeepOverrides({ Foo: { Bar: true } }, { Foo: undefined as any });
      const expected = { Foo: { Bar: true } };
      expect(actual).toEqual(expected);
    });
  });
});
