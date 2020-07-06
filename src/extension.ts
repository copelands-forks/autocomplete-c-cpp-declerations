import { ExtensionContext, commands, window, workspace, Position, ViewColumn } from 'vscode'; //import vscode classes and workspace
import { header, parse, parseMain, formatMethodsignature } from './parse'; //import parse functions and class

//settings
var indentStyle: string | undefined;
var columnNumber: ViewColumn | undefined;

function readSettings(): void {
	indentStyle = workspace.getConfiguration('autocomplete-c-cpp-files').get('indentStyle');
	columnNumber = workspace.getConfiguration('autocomplete-c-cpp-files').get('columnNumber');
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	console.log('C/C++ autocomplete is running');

	context.subscriptions.push(commands.registerCommand('extension.writeimplfile', writeimplfile));
	context.subscriptions.push(commands.registerCommand('extension.parsemainfile', parsemainfile));
}

function writeimplfile(): void {
	readSettings();
	let editor = window.activeTextEditor;
	if(editor){
		let document = editor.document;
		let fileName = document.fileName.split(process.platform === 'win32' ? '\\' : '/')[document.fileName.split(process.platform === 'win32' ? '\\' : '/').length - 1];
		if(document.fileName.endsWith('.h')){
			let text = document.getText();
			let h: header = new header();
			let language: string = document.languageId;

			h = parse(text);

			let parsedFileContent: string = '';
			
			for(let i = 0; i < h.includes.length; i++){
				parsedFileContent += h.includes[i] ? `${h.includes[i]}\n` : '';
			}
			parsedFileContent += `\n#include "${fileName}"\n`;
			parsedFileContent += h.namespace ? `\n${h.namespace}` : '';
			for(let i = 0; i < h.methods.length; i++){
				if(h.namespace){
					parsedFileContent += h.class ? `\n\t${formatMethodsignature(h.methods[i], h.class)}\n\t{\n\t\t\n\t}\n` : `\n\t${formatMethodsignature(h.methods[i])}\n\t{\n\t\t\n\t}\n`;
				}else{
					parsedFileContent += h.class ? `\n${formatMethodsignature(h.methods[i], h.class)}\n{\n\t\n}\n` : `\n${formatMethodsignature(h.methods[i])}\n{\n\t\n}\n`;
				}
			}
			parsedFileContent += h.namespace ? '}' : '';

			openImplementationFile(parsedFileContent, language);
		}else{
			window.showWarningMessage('file type not supported');
		}
	}else{
		window.showWarningMessage('no open document, please open one and run the command again');
	}
}

function parsemainfile(): void {
	readSettings();
	let editor = window.activeTextEditor;
	if(editor){
		let document = editor.document;
		if(document.fileName.endsWith('.c') || document.fileName.endsWith('cpp')){
			let text = document.getText();
			let h: header = new header();

			h = parseMain(text);

			let parsedFileContent: string = '';
			
			parsedFileContent += h.namespace ? `\n${h.namespace}` : '';
			for(let i = 0; i < h.methods.length; i++){
				if(h.namespace){
					parsedFileContent += h.class ? `\n\t${formatMethodsignature(h.methods[i], h.class)}\n\t{\n\t\t\n\t}\n` : `\n\t${formatMethodsignature(h.methods[i])}\n\t{\n\t\t\n\t}\n`;
				}else{
					parsedFileContent += h.class ? `\n${formatMethodsignature(h.methods[i], h.class)}\n{\n\t\n}\n` : `\n${formatMethodsignature(h.methods[i])}\n{\n\t\n}\n`;
				}
			}
			parsedFileContent += h.namespace ? '}' : '';

			editor.edit(editBuilder => editBuilder.insert(new Position(document.lineCount + 3, 0), parsedFileContent));
			deactivate();
		}else{
			window.showWarningMessage('file type not supported');
		}
	}else{
		window.showWarningMessage('no open document, please open one and run the command again');
	}
}

async function openImplementationFile(fileContent: string, fileLanguage: string): Promise<void> {
	let doc = await workspace.openTextDocument({ language: fileLanguage, content: fileContent });
	window.showTextDocument(doc, columnNumber);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('C/C++ autocomplete is not running anymore');
}
