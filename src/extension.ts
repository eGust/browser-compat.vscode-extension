// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext } from 'vscode';

import { COMMAND, setup } from './status_bar_item_helper';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	let onSearch = () => {
		console.debug('onSearch.empty');
	};
	const disposable = commands.registerCommand(COMMAND, () => onSearch());

	context.subscriptions.push(disposable);
	console.log('activate extension...');
	setup(context).then((manager) => {
		if (!manager) { return; }
		onSearch = manager.onCommand.bind(manager);
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
