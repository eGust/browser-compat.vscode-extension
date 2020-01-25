import { get } from 'https';
import { join } from 'path';
import { writeFile, readFile, existsSync } from 'fs';
import { promisify } from 'util';

const URL = 'https://www.caniuse.com/data.json';

const FILE_PATH = join(__dirname, '../data/caniuse.json');

const readFileAsync = promisify(readFile);

export const fetchCaniuseData = (): Promise<void> => new Promise((resolve, reject) => {
  // console.debug('START');
  get(URL, (res) => {
    const { statusCode } = res;
    // console.debug('RESPONSE', { code: statusCode, message: res.statusMessage });

    if (statusCode !== 200) {
      reject(new Error(`Request Failed: code = ${statusCode} (${res.statusMessage})`));
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let json = '';
    res.on('data', (chunk) => {
      json += chunk;
    });
    res.on('end', () => {
      // console.debug('END');
      writeFile(FILE_PATH, json, (err) => {
        if (err) { reject(err); }
        else { resolve(); }
      });
    });
  }).on('error', (err) => {
    // console.debug('ERROR');
    console.error(err);
    reject(err);
  });
});

interface CaniuseAgent {
  browser: string;
  abbr: string;
  prefix: string;
  type: 'desktop' | 'mobile';
  usage_global: { [version: string]: number };
  versions: (null | string)[];
  prefix_exceptions?: { [version: string]: string };
}

interface CaniuseDataRecord {
  title: string;
  description: string;
  status: string;
  links: { url: string; title: string }[];
  categories: string[];
  stats: { [browser: string]: { [version: string]: string; }; };
  notes: string;
  notes_by_num: { [num: number]: string; };
  usage_perc_y: number;
  usage_perc_a: number;
  ucprefix: boolean;
  parent: string;
  keywords: string;
  ie_id: string;
  chrome_id: string;
  firefox_id: string;
  webkit_id: string;
}

interface CaniuseData {
  eras: Record<string, string>;
  agents: { [browser: string]: CaniuseAgent };
  statuses: { [abbr: string]: string };
  cats: { [major: string]: string[] };
  data: { [name: string]: CaniuseDataRecord };
  updated: number;
}

export const loadCaniuseData = async (): Promise<CaniuseData | null> => {
  if (!existsSync(FILE_PATH)) { return null; }

  const json = await readFileAsync(FILE_PATH, { encoding: 'utf8' });
  return JSON.parse(json) as CaniuseData;
};

export type Searcher = (query: string, options?: { lang: string }) => { [name: string]: CaniuseDataRecord };

export interface CaniuseHelpers {
  readonly search: Searcher;
  readonly updatedAt: Date;
  readonly data: CaniuseData;
}

type CaniuseDataRecordEntries = [string, CaniuseDataRecord][];

function filterCategory(this: CaniuseDataRecordEntries, categories?: string[]): CaniuseDataRecordEntries {
  if (!categories) { return this; }

  const catSet = new Set(categories);
  return this.filter(([, { categories: cats }]) => {
    return cats.find((cat) => catSet.has(cat));
  });
}

interface SearchOption {
  queryText: string[];
  categories: string[];
}

const normalizeSearchOptions = (query: string, cats: Record<string, string[]>, lang?: string): SearchOption => {
  const q = query.toLowerCase();
  switch (lang) {
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
    case 'stylus': {
      return {
        queryText: [q],
        categories: cats.CSS,
      };
    }
    default: {
      return {
        queryText: [q],
        categories: [
          ...cats.CSS,
          ...cats.HTML5,
          ...cats.JS,
          ...cats.Others,
          ...cats.SVG,
        ],
      };
    }
  }
};

export const useCaniuse = async (): Promise<CaniuseHelpers | null> => {
  try {
    const data = await loadCaniuseData();
    if (!data) { return null; }

    const { data: mainData, cats, ...others } = data;
    const dataRecords = Object.entries(mainData);
    const helpers: CaniuseHelpers = {
      search: (query, options) => {
        const { queryText, categories } = normalizeSearchOptions(query, cats, options?.lang);
        const entries = filterCategory.call(dataRecords, categories);
        const q = queryText[0];
        const records = entries.filter(([name, { keywords, title, description }]) =>
          keywords.includes(q)
          || name.includes(q)
          || title.toLowerCase().includes(q)
        );
        return Object.fromEntries(records);
      },
      data: { ...others, cats, data: {} },
      updatedAt: new Date(data.updated * 1000),
    };
    return helpers;
  } catch (e) {
    console.error(e);
    return null;
  }
};
