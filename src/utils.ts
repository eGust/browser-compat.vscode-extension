import { TextDocument, Position } from "vscode";

const RE_WORD = /[@:]?[\w-]+\b/;

export const populateWordAtPosition = (document: TextDocument, position: Position): string | undefined => {
  const range = document.getWordRangeAtPosition(position, RE_WORD);
  const text = range && document.getText(range);
  return text?.match(RE_WORD)?.[0];
};
