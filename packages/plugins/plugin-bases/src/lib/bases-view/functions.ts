import { normalizePath, TFile } from "@lapis-notes/api";
import { createFunction, Decimal, VARARG } from "peaql";
import { VaultFile } from "./db";
import { DateTime, Duration } from "luxon";
import {
  ceil,
  contains,
  containsAll,
  containsAllOf,
  containsAny,
  containsAnyOf,
  date,
  duration,
  endsWith,
  escapeHTML,
  file,
  filterItems,
  flat,
  floor,
  html,
  image,
  ifValue,
  isEmpty,
  isTruthy,
  isType,
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
  relative,
  random,
  repeat,
  replace,
  reduceItems,
  reverseList,
  reverseString,
  sliceList,
  sliceString,
  sortList,
  split,
  startsWith,
  time,
  title,
  trim,
  unique,
  values,
  valueToString,
  asFile,
  asLink,
  mapItems,
} from "./functions-core";

createFunction("isEmpty", [Object], Boolean, isEmpty, true);
createFunction("isTruthy", [Object], Boolean, isTruthy, true);
createFunction("toString", [Object], String, valueToString, true);

createFunction("startsWith", [String, String], Boolean, startsWith, true);

createFunction("endsWith", [String, String], Boolean, endsWith, true);

createFunction("contains", [String, String], Boolean, contains, true);

createFunction(
  "containsAnyOf",
  [String, VARARG, String],
  Boolean,
  containsAnyOf,
  true,
);
createFunction(
  "containsAny",
  [String, VARARG, String],
  Boolean,
  containsAny,
  true,
);

createFunction(
  "containsAllOf",
  [String, VARARG, String],
  Boolean,
  containsAllOf,
  true,
);
createFunction(
  "containsAll",
  [String, VARARG, String],
  Boolean,
  containsAll,
  true,
);

createFunction("inFolder", [TFile, String], Boolean, inFolder, true);
createFunction("inFolder", [VaultFile, String], Boolean, inFolder, true);
function inFolder(file: TFile, path: string) {
  path = normalizePath(path);
  return file.path.startsWith(`${path}/`) || path == "/" || path == "";
}

createFunction("hasLink", [TFile, String], Boolean, hasLink, true);
createFunction("hasLink", [VaultFile, String], Boolean, hasLink, true);
function hasLink(file: TFile, path: string) {
  const links = (file as TFile & { links?: string[] }).links ?? [];
  return links.includes(path);
}

createFunction("hasTag", [VaultFile, VARARG, String], Boolean, hasTag, true);
function hasTag(file: TFile, ...tags: Array<string>) {
  tags = tags.map((t) => (t.startsWith("#") ? t : `#${t}`));
  const fileTags = (file as TFile & { tags?: string[] }).tags ?? [];
  return fileTags.some((tag) =>
    tags.some((value) => value === tag || tag.startsWith(`${value}/`)),
  );
}

createFunction("hasProperty", [TFile, String], Boolean, hasProperty, true);
createFunction("hasProperty", [VaultFile, String], Boolean, hasProperty, true);
function hasProperty(file: TFile, path: string) {
  const properties =
    (file as TFile & { properties?: Record<string, unknown> }).properties ?? {};
  return path in properties;
}

createFunction("length", [Object], Number, length, true);

createFunction("map", [Object, Object], [Object], mapItems, true, {
  index: Number,
  value: Object,
});

export class Icon {
  constructor(readonly name: string) {}

  toString(): string {
    return this.name;
  }
}

createFunction("icon", [String], Icon, icon, true);
function icon(name: string) {
  return new Icon(name);
}

createFunction("title", [String], String, title, true);

createFunction("trim", [String], String, trim, true);
createFunction("split", [String, String], [String], split, true);
createFunction("replace", [String, String, String], String, replace, true);
createFunction("repeat", [String, Number], String, repeat, true);
createFunction("escapeHTML", [String], String, escapeHTML, true);
createFunction("date", [String], DateTime, date, true);
createFunction("date", [Number], DateTime, date, true);
createFunction("date", [Date], DateTime, date, true);
createFunction("date", [DateTime], DateTime, date, true);
createFunction("duration", [String], Duration, duration, true);
createFunction("duration", [Number], Duration, duration, true);
createFunction("duration", [Duration], Duration, duration, true);
createFunction("file", [String], String, file, true);
createFunction("html", [String], String, html, true);
createFunction("image", [String], String, image, true);
createFunction("link", [String], String, link, true);
createFunction("if", [Object, Object, Object], Object, ifValue, true);
createFunction("list", [VARARG, Object], [Object], list, true);
createFunction("number", [Object], Number, number, true);
createFunction("max", [VARARG, Number], Number, max, true);
createFunction("min", [VARARG, Number], Number, min, true);
createFunction("random", [], Number, random, true);
createFunction("flat", [Array], Array, flat, true);
createFunction("filter", [Object, Object], [Object], filterItems, true);
createFunction("join", [Array], String, join, true);
createFunction("join", [Array, String], String, join, true);
createFunction("reverse", [String], String, reverseString, true);
createFunction("reverse", [Array], Array, reverseList, true);
createFunction("reduce", [Object, Object, Object], Object, reduceItems, true);
createFunction("slice", [String, Number], String, sliceString, true);
createFunction("slice", [String, Number, Number], String, sliceString, true);
createFunction("slice", [Array, Number], Array, sliceList, true);
createFunction("slice", [Array, Number, Number], Array, sliceList, true);
createFunction("sort", [Array], Array, sortList, true);
createFunction("unique", [Array], Array, unique, true);
createFunction("ceil", [Number], Number, ceil, true);
createFunction("floor", [Number], Number, floor, true);
createFunction("isType", [Object, String], Boolean, isType, true);
createFunction("asFile", [String], String, asFile, true);
createFunction("asLink", [String], String, asLink, true);
createFunction("linksTo", [String, String], Boolean, linksTo, true);
createFunction("keys", [Object], [String], keys, true);
createFunction("values", [Object], [Object], values, true);
createFunction("matches", [String, String], Boolean, matches, true);
createFunction("matches", [String, RegExp], Boolean, matches, true);

createFunction("relative", [DateTime], String, relative, true);
createFunction("relative", [Date], String, relative, true);

createFunction("time", [DateTime], String, time, true);
createFunction("time", [Date], String, time, true);
