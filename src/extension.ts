import { ExtensionContext, commands, window, workspace } from 'vscode'; //import vscode classes and workspace
import { header, parse, formatMethodsignature } from './parse'; //import parse functions and class

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	console.log('C/C++ autocomplete is running');

	let disposable = commands.registerCommand('extension.writeimplfile', () => {
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
				
				for(let i = 0; i < h.methods.length; i++){
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
				deactivate();
			}else{
				window.showWarningMessage('file type not supported');
				deactivate();
			}
		}else{
			window.showWarningMessage('no open document, please open one and run the command again');
		}
	});

	context.subscriptions.push(disposable);
}

async function openImplementationFile(fileContent: string, fileLanguage: string): Promise<void> {
	let doc = await workspace.openTextDocument({ language: fileLanguage, content: fileContent });
	window.showTextDocument(doc, 2);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('C/C++ autocomplete is not running anymore');
}
