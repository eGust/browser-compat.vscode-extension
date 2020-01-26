import { browsers } from 'mdn-browser-compat-data';

export enum BrowserPlatform {
  Desktop = 'desktop',
  Mobile = 'mobile',
}

interface BrowserInfo {
  key: string;
  name: string;
  platform: BrowserPlatform;
}

let browserDict: Record<string, BrowserInfo>;

const ensureDict = () => {
  if (!browserDict) {
    browserDict = Object.fromEntries(
      Object.entries(browsers)
      .map(([key, { name }]) => [key, {
        key,
        name,
        platform: key.endsWith('_android') || key.endsWith('_ios')
          ? BrowserPlatform.Mobile
          : BrowserPlatform.Desktop,
      }])
    );

    if (browserDict.ie) {
      browserDict.ie.name = 'IE';
    }
  }
  return browserDict;
};

interface GroupedBrowserInfo<T> {
  info: BrowserInfo;
  data: T;
}

export type GroupedResult<T> = Record<BrowserPlatform, GroupedBrowserInfo<T>[]>;

export const groupBrowsersByPlatform = <T>(records: [string, T][]): GroupedResult<T> => {
  const result: GroupedResult<T> = {
    [BrowserPlatform.Desktop]: [],
    [BrowserPlatform.Mobile]: [],
  };

  const dict = ensureDict();
  records.forEach(([key, data]) => {
    const info = dict[key]!;
    result[info.platform].push({ info, data });
  });
  return result;
};

export const groupBrowserDictByPlatform = <T>(dict: Record<string, T>): GroupedResult<T> =>
  groupBrowsersByPlatform(Object.entries(dict));
