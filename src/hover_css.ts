import {
  languages,
  HoverProvider,
  Hover,
} from 'vscode';
import { SupportBlock, StatusBlock, VersionValue } from 'mdn-browser-compat-data/types';
import isString from 'lodash/isString';

import { search, getCompatStatement } from './bcd/css';
import { groupBrowsersByPlatform, GroupedResult, BrowserPlatform } from './bcd/browsers';
import { populateWordAtPosition } from './utils';

export const COMMAND = 'extension.browserCompatible';

enum StatusStandard {
  Unknown = 'unknown',
  Standard = 'standard',
  Deprecated = 'deprecated',
  Experimental = 'Experimental',
}

const getStatus = (status?: StatusBlock): StatusStandard => {
  if (status) {
    if (status.standard_track) { return StatusStandard.Standard; }
    if (status.deprecated) { return StatusStandard.Deprecated; }
    if (status.experimental) { return StatusStandard.Experimental; }
  }
  return StatusStandard.Unknown;
};

const STATUS_TEXT: Record<StatusStandard, string> = {
  [StatusStandard.Unknown]: '?',
  [StatusStandard.Standard]: 'Standard',
  [StatusStandard.Deprecated]: 'Deprecated',
  [StatusStandard.Experimental]: 'Experimental',
};

type ToMD = (name: string, url: string, support: SupportBlock, status?: StatusBlock) => string;

const generateTable = (grouped: GroupedResult<VersionValue>, platform: BrowserPlatform): string => {
  const rows: string[][] = [[], [], []];
  grouped[platform].forEach(({ info: { name }, data }) => {
    rows[0].push(name);
    rows[1].push((new Array(name.length + 1)).join('-'));
    rows[2].push(isString(data) ? data : (data ? 'Yes' : '?'));
  });

  return rows.map((cols) => cols.join(' | ')).join('\n');
};

const formatSupport = (support: SupportBlock): string => {
  const grouped = groupBrowsersByPlatform(
    Object.entries(support)
      .map(([key, ver = []]) => {
        const v = Array.isArray(ver) ? ver[0] : ver;
        return [key, v.version_added];
      })
  );

  return [
    generateTable(grouped, BrowserPlatform.Desktop),
    generateTable(grouped, BrowserPlatform.Mobile),
  ].join('\n\n');
};

const buildMarkdown: ToMD = (name, url, support, status) => `
\`${name}\` - _${STATUS_TEXT[getStatus(status)]}_

${formatSupport(support)}

> [MDN](${url}) | [CanIUse](https://www.caniuse.com/#search=${encodeURIComponent(name)}) | [DuckDuckGo](https://duckduckgo.com/?q=css+${encodeURIComponent(name)})
`.trim();

const provider: HoverProvider = {
  provideHover: (document, position, _token): Hover | null => {
    const text = populateWordAtPosition(document, position);
    if (!text) { return null; }

    const matches = search(text);
    if (!matches.length) { return null; }

    const result = matches.map((name) => {
      const { mdn_url: url, support, status } = getCompatStatement(name)!;
      return buildMarkdown(name, url!, support, status);
    });
    return new Hover(result);
  },
};

const SUPPORTED_LANGUAGES = `
  css
  sass
  scss
  less
  stylus
  html
  pug
  haml
  slim
  javascript
  javascriptreact
  typescript
  javascriptreact
`.trim().split('\n').map((s) => s.trim());

export const register = (): void => {
  languages.registerHoverProvider(SUPPORTED_LANGUAGES, provider);
};
