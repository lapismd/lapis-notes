import { describe, expect, test } from "vitest";
import {
  ceil,
  containsAll,
  containsAny,
  date,
  duration,
  escapeHTML,
  file,
  filterItems,
  flat,
  floor,
  html,
  image,
  ifValue,
  isType,
  isTruthy,
  join,
  keys,
  length,
  list,
  link,
  linksTo,
  max,
  matches,
  min,
  number,
  random,
  reduceItems,
  repeat,
  replace,
  reverseList,
  reverseString,
  sliceList,
  sliceString,
  sortList,
  split,
  trim,
  unique,
  valueToString,
  values,
  asFile,
  asLink,
  mapItems,
} from "./functions-core";

describe("Bases runtime functions", () => {
  test("registers upstream contains aliases with existing semantics", () => {
    expect(containsAny("Hello World", "world", "x")).toBe(true);
    expect(containsAll("Hello World", "hello", "world")).toBe(true);
    expect(containsAll("Hello World", "hello", "missing")).toBe(false);
  });

  test("supports documented string helpers", () => {
    expect(trim("  note  ")).toBe("note");
    expect(split("a,b,c", ",")).toEqual(["a", "b", "c"]);
    expect(replace("note.md", ".md", ".base")).toBe("note.base");
    expect(repeat("ha", 3)).toBe("hahaha");
    expect(reverseString("stressed")).toBe("desserts");
    expect(sliceString("abcdef", 1, 4)).toBe("bcd");
    expect(escapeHTML(`<a href="x">O'Hai</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;O&#39;Hai&lt;/a&gt;",
    );
    expect(file("[[Folder/Note]]")).toBe("Folder/Note");
    expect(html("<strong>note</strong>")).toBe("<strong>note</strong>");
    expect(image("cover.png")).toBe("cover.png");
    expect(link("[[Note]]")).toBe("[[Note]]");
    expect(asFile("[[Folder/Note]]")).toBe("Folder/Note");
    expect(asLink("Folder/Note")).toBe("[[Folder/Note]]");
    expect(linksTo("[[Folder/Note]]", "Folder/Note")).toBe(true);
  });

  test("supports documented number helpers", () => {
    expect(ceil(2.01)).toBe(3);
    expect(floor(2.99)).toBe(2);
    expect(number("42.5")).toBe(42.5);
    expect(max(1, 9, 4)).toBe(9);
    expect(min(1, 9, 4)).toBe(1);
    expect(random()).toBeGreaterThanOrEqual(0);
    expect(random()).toBeLessThan(1);
  });

  test("supports documented date and duration constructors", () => {
    expect(date("2024-01-02").isValid).toBe(true);
    expect(date(0).toISO()).toContain("1970-01-01");
    expect(duration("PT5M").toMillis()).toBe(300000);
    expect(duration(1500).toMillis()).toBe(1500);
    expect(ifValue(true, "yes", "no")).toBe("yes");
    expect(ifValue(false, "yes", "no")).toBe("no");
  });

  test("supports object and regexp helpers", () => {
    expect(keys({ a: 1, b: 2 })).toEqual(["a", "b"]);
    expect(values({ a: 1, b: 2 })).toEqual([1, 2]);
    expect(matches("note.md", String.raw`\.md$`)).toBe(true);
    expect(matches("note.md", /\.canvas$/)).toBe(false);
    expect(isTruthy("note")).toBe(true);
    expect(isTruthy(0)).toBe(false);
    expect(valueToString(42)).toBe("42");
    expect(valueToString(null)).toBe("");
    expect(isType([], "list")).toBe(true);
    expect(isType(/x/, "regexp")).toBe(true);
    expect(isType(3, "string")).toBe(false);
  });

  test("supports shared list-like helpers", () => {
    expect(list("a", "b", "c")).toEqual(["a", "b", "c"]);
    expect(length([1, 2, 3])).toBe(3);
    expect(flat([[1, 2], [3]])).toEqual([1, 2, 3]);
    expect(join(["a", "b", "c"], "-")).toBe("a-b-c");
    expect(reverseList([1, 2, 3])).toEqual([3, 2, 1]);
    expect(sliceList([1, 2, 3, 4], 1, 3)).toEqual([2, 3]);
    expect(sortList([3, 1, 2])).toEqual([1, 2, 3]);
    expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
  });

  test("supports collection expression helpers", () => {
    const items = { resolve: () => [1, 2, 3, 4] };
    expect(
      mapItems({}, items, {
        resolve: ({ value }: { value: number }) => value * 2,
      }),
    ).toEqual([2, 4, 6, 8]);
    expect(
      filterItems({}, items, {
        resolve: ({ value }: { value: number }) => value % 2 === 0,
      }),
    ).toEqual([2, 4]);
    expect(
      reduceItems(
        {},
        items,
        { resolve: () => 0 },
        {
          resolve: ({
            accumulator,
            value,
          }: {
            accumulator: number;
            value: number;
          }) => accumulator + value,
        },
      ),
    ).toBe(10);
  });
});
