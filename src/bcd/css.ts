import { css } from 'mdn-browser-compat-data';
import { Identifier, CompatStatement } from 'mdn-browser-compat-data/types';
import kebabCase from 'lodash/kebabCase';

// at-rules: @media, @page, @font-face, etc.
// https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule

// properties

// selectors: :first, :blank, etc.

// types

const URL_PREFIX = 'https://developer.mozilla.org/docs/Web/CSS/';

function populateSearch(this: Map<string, CompatStatement>, item: Identifier): void {
  const { __compat: compat, ...items } = item;
  const name = compat?.mdn_url?.startsWith(URL_PREFIX) && compat.mdn_url.slice(URL_PREFIX.length);
  if (name && !name.includes('/')) {
    this.set(name, compat!);
  }

  Object.values(items).forEach((identifier) => {
    populateSearch.call(this, identifier);
  });
}

export const buildSearchDict = () : Map<string, CompatStatement> => {
  const dict = new Map<string, CompatStatement>();
  Object.values(css).forEach((identifier) => populateSearch.call(dict, identifier));
  return dict;
};

let searchDict: Map<string, CompatStatement>;

const ensureSearchDict = (): Map<string, CompatStatement> => {
  if (!searchDict) {
    searchDict = buildSearchDict();
  }
  return searchDict;
};

export const getCompatStatement = (text: string): CompatStatement | null =>
  ensureSearchDict().get(text) || null;

export const search = (text: string): string[] => {
  const txt = kebabCase(text);
  if (!txt) { return []; }

  const exact = ensureSearchDict().has(txt);
  if (exact) { return [txt]; }

  if (text.startsWith('@')) {
    const key = `@${txt}`;
    if (searchDict.has(key)) { return [key]; }
  }

  if (text.startsWith(':')) {
    let key = `:${txt}`;
    if (searchDict.has(key)) { return [key]; }
    key = `::${txt}`;
    if (searchDict.has(key)) { return [key]; }
  }

  const keys: string[] = [];
  for (const key of searchDict.keys()) {
    if (key.includes(txt)) {
      keys.push(key);
    }
  }
  return keys;
};
