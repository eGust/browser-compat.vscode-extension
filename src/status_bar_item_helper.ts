import {
  window,
  TextEditor,
	StatusBarAlignment, StatusBarItem,
	ExtensionContext,
} from 'vscode';

import { useCaniuse, CaniuseHelpers, Searcher } from './caniuse_data';

export const COMMAND = 'extension.browserCompatible';

const RE_WORD = /\b@?[\w:-]+\b/;

export class ItemManager {
  private currentText: string = '';

  private activeEditor: TextEditor | null = null;

  public readonly item: StatusBarItem;

  private search: Searcher;

  constructor({ search, updatedAt }: CaniuseHelpers) {
    const item = window.createStatusBarItem(StatusBarAlignment.Right, 100);
    item.command = COMMAND;
    item.text = `[BC] Ready (${updatedAt.toISOString().slice(0, 10)})`;
    this.item = item;
    this.search = search;
  }

  public onCommand(): void {
    console.debug('command.search');
    const { search, currentText, activeEditor } = this;
    try {
      const lang = activeEditor?.document.languageId ?? '';
      const result = search(currentText);
      console.log('command.search', lang, result);
    } catch (e) {
      console.error(e);
    }
  }

  public onUpdate(): void {
    const { activeTextEditor: editor } = window;
    if (!editor) {
      this.activeEditor = null;
      this.item.text = '[BC] Ready!';
      return;
    }

    const { document, selection } = editor;
    const range = selection.isEmpty
      ? document.getWordRangeAtPosition(selection.start, RE_WORD)
      : selection;

    const text = range && document.getText(range);
    this.currentText = text?.match(RE_WORD)?.[0] ?? '';

    this.activeEditor = editor;
    this.item.text = this.currentText ? `[BC] ${this.currentText}` : '[BC] (blank)';
  }
}

export const setup = async ({ subscriptions }: ExtensionContext): Promise<ItemManager | null> => {
  const caniuse = await useCaniuse();
  if (!caniuse) {
    console.error('failed to load caniuse data');
    return null;
  }

  const manager = new ItemManager(caniuse);
  const onUpdateStatusBarItem = manager.onUpdate.bind(manager);

  subscriptions.push(manager.item);
  subscriptions.push(window.onDidChangeActiveTextEditor(onUpdateStatusBarItem));
  subscriptions.push(window.onDidChangeTextEditorSelection(onUpdateStatusBarItem));
  manager.item.show();

  return manager;
};
