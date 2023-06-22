import { applyDeepOverrides } from "../../src/utils.pure";

describe("utils.pure", () => {
  describe("#applyDeepOverrides", () => {
    it("can merge false into true", () => {
      expect(applyDeepOverrides(true, false)).toBe(false);
    });

    it("can merge true into false", () => {
      expect(applyDeepOverrides(false, true)).toBe(true);
    });

    it("can merge same boolean values", () => {
      expect(applyDeepOverrides(true, true)).toBe(true);
    });

    it("can merge false into object", () => {
      expect(applyDeepOverrides({ Foo: true }, false)).toBe(false);
    });

    it("can merge true into object", () => {
      expect(applyDeepOverrides({ Foo: false }, true)).toBe(true);
    });

    it("can merge same object values", () => {
      expect(applyDeepOverrides({ Foo: true }, { Foo: true })).toEqual({ Foo: true });
    });

    it("can merge different object values", () => {
      expect(applyDeepOverrides({ Foo: true }, { Foo: false })).toEqual({ Foo: false });
    });

    it("can merge different nested object values", () => {
      expect(applyDeepOverrides({ Foo: { Bar: true } }, { Foo: { Bar: false } })).toEqual({
        Foo: { Bar: false },
      });
    });

    it("can merge nested object into boolean", () => {
      expect(applyDeepOverrides(true, { Foo: { Bar: false } })).toEqual({ Foo: { Bar: false } });
    });

    it("can merge boolean into nested object", () => {
      expect(applyDeepOverrides({ Foo: { Bar: true } }, { Foo: false })).toEqual({ Foo: false });
    });

    it("can merge nested object into nested object without overlapping properties", () => {
      expect(applyDeepOverrides({ Foo: { Bar: true } }, { Foo: { Baz: false } })).toEqual({
        Foo: { Bar: true, Baz: false },
      });
    });
  });
});
