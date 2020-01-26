import {
  window, commands, env,
  TextEditor,
	StatusBarAlignment,
	ExtensionContext,
  Uri,
} from 'vscode';

import { search, getCompatStatement } from './bcd/css';
import { populateWordAtPosition } from './utils';

export const COMMAND = 'extension.browserCompatible';

export const setup = ({ subscriptions }: ExtensionContext): void => {
  let activeEditor: TextEditor | null = null;
  let currentText = '';

	const command = commands.registerCommand(COMMAND, async () => {
    try {
      const lang = activeEditor?.document.languageId ?? '';
      const result = search(currentText);
      console.debug('command.search', currentText, JSON.stringify(result), lang);
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
    currentText = populateWordAtPosition(document, selection.start) ?? '';

    activeEditor = editor;
    item.text = currentText ? `[BC] ${currentText}` : '[BC] (blank)';
  };

  subscriptions.push(command);
  subscriptions.push(item);
  subscriptions.push(window.onDidChangeActiveTextEditor(onUpdateStatusBarItem));
  subscriptions.push(window.onDidChangeTextEditorSelection(onUpdateStatusBarItem));

  item.show();
};
