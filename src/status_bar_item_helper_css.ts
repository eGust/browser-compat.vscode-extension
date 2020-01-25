import {
  window, commands, env,
  TextEditor,
	StatusBarAlignment,
	ExtensionContext,
  Uri,
} from 'vscode';

import { search, getCompatStatement } from './bcd/css';

export const COMMAND = 'extension.browserCompatible';

const RE_WORD = /\b@?[\w:-]+\b/;

export const setup = ({ subscriptions }: ExtensionContext): void => {
  let activeEditor: TextEditor | null = null;
  let currentText = '';

	const command = commands.registerCommand(COMMAND, async () => {
    try {
      const lang = activeEditor?.document.languageId ?? '';
      const result = search(currentText);
      console.log('command.search', lang, result);
      if (result.length === 1) {
        const [text] = result;
        const { mdn_url: url, support, status } = getCompatStatement(text)!;

        const supportMessages = Object.entries(support)
          .map(([browser, v = []]) => {
            const versions = (Array.isArray(v) ? v : [v]).map(({ version_added: ver }) => ver);
            const ver = versions[versions.length - 1];
            return `${browser}: ${ver ?? '?'}`;
          });
        const statusMessage = status ? Object.entries(status).filter(([_k, v]) => v).map(([k]) => k).join(', ') : '';
        const message = [text, ''].concat([...supportMessages, statusMessage].filter((x) => x)).join('\t');

        const clicked = await window.showInformationMessage(
          message,
          { title: 'Open' },
          { title: 'Close', isCloseAffordance: true },
        );

        if (clicked?.title === 'Open') {
          env.openExternal(Uri.parse(url!));
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  const item = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  item.command = COMMAND;

  const onUpdateStatusBarItem = (): void => {
    const { activeTextEditor: editor } = window;
    if (!editor) {
      activeEditor = null;
      item.text = '[BC] Ready!';
      return;
    }

    const { document, selection } = editor;
    const range = selection.isEmpty
      ? document.getWordRangeAtPosition(selection.start, RE_WORD)
      : selection;

    const text = range && document.getText(range);
    currentText = text?.match(RE_WORD)?.[0] ?? '';

    activeEditor = editor;
    item.text = currentText ? `[BC] ${currentText}` : '[BC] (blank)';
  };

  subscriptions.push(command);
  subscriptions.push(item);
  subscriptions.push(window.onDidChangeActiveTextEditor(onUpdateStatusBarItem));
  subscriptions.push(window.onDidChangeTextEditorSelection(onUpdateStatusBarItem));

  item.show();
};
