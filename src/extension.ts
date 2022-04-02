import { ExtensionContext, commands, window, workspace, Position, ViewColumn, CompletionList, languages, TextDocument, CancellationToken, CompletionContext, CompletionItem, SnippetString, MarkdownString, CompletionItemKind, Uri } from 'vscode'; //import vscode classes and workspace
import { header, parse, indent } from './parse'; //import parse functions and class

//settings
var indentStyle: string | undefined;
var columnNumber: ViewColumn | undefined;
var triggerChar: string | undefined;

function readSettings(): void {
	indentStyle = workspace.getConfiguration('autocomplete-c-cpp-files').get('indentStyle');
	columnNumber = workspace.getConfiguration('autocomplete-c-cpp-files').get('columnNumber');
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	console.log('C/C++ autocomplete is running');
	triggerChar = workspace.getConfiguration('autocomplete-c-cpp-files').get('triggerChar');

	const provider1 = languages.registerCompletionItemProvider('c', {
		provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
			// a simple completion item which inserts `Hello World!`
			/*const simpleCompletion = new CompletionItem('Hello World!');

			// a completion item that inserts its text as snippet,
			// the `insertText`-property is a `SnippetString` which will be
			// honored by the editor.
			const snippetCompletion = new CompletionItem('Good part of the day');
			snippetCompletion.insertText = new SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?');
			const docs : any = new MarkdownString("Inserts a snippet that lets you select [link](x.ts).");

			// a completion item that can be accepted by a commit character,
			// the `commitCharacters`-property is set which means that the completion will
			// be inserted and then the character will be typed.
			const commitCharacterCompletion = new CompletionItem('console');
			commitCharacterCompletion.commitCharacters = ['.'];
			commitCharacterCompletion.documentation = new MarkdownString('Press `.` to get `console.`');

			// a completion item that retriggers IntelliSense when being accepted,
			// the `command`-property is set which the editor will execute after 
			// completion has been inserted. Also, the `insertText` is set so that 
			// a space is inserted after `new`
			const commandCompletion = new CompletionItem('new');
			commandCompletion.kind = CompletionItemKind.Keyword;
			commandCompletion.insertText = 'new ';
			commandCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };

			// return all completion items as array
			return [
				simpleCompletion,
				snippetCompletion,
				commitCharacterCompletion,
				commandCompletion
			];*/

			//block NOT to delete
			let snippetsCompletition: CompletionItem[] = [];
			let editor = window.activeTextEditor;
			if(editor){
				let text = editor.document.getText();
				let h = new header();
				h = parse(text);
				for(let i = 0; i < h.methods.length; i++){
					snippetsCompletition.push(new CompletionItem(h.methods[i]));
				}
			}
			return snippetsCompletition;
		}
	});

	context.subscriptions.push(commands.registerCommand('extension.writeimplfile', writeimplfile));
	context.subscriptions.push(commands.registerCommand('extension.parsemainfile', parsemainfile));

	context.subscriptions.push(provider1);
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
					parsedFileContent += indent(h.methods[i], indentStyle, true);
				}else{
					parsedFileContent += indent(h.methods[i], indentStyle, false);
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

			h = parse(text);

			let parsedFileContent: string = '';
			
			parsedFileContent += h.namespace ? `\n${h.namespace}` : '';
			for(let i = 0; i < h.methods.length; i++){
				if(h.namespace){
					parsedFileContent += indent(h.methods[i], indentStyle, true);
				}else{
					parsedFileContent += indent(h.methods[i], indentStyle, false);
				}
			}
			parsedFileContent += h.namespace ? '}' : '';
			editor.edit(editBuilder => editBuilder.insert(new Position(document.lineCount + 2, 0), '\n' + parsedFileContent));
			deactivate();
		}else{
			window.showWarningMessage('file type not supported');
		}
	}else{
		window.showWarningMessage('no open document, please open one and run the command again');
	}
}

function provideCompletitions() {
	
}

async function openImplementationFile(fileContent: string, fileLanguage: string): Promise<void> {
	let doc = await workspace.openTextDocument({ language: fileLanguage, content: fileContent });
	window.showTextDocument(doc, columnNumber);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('C/C++ autocomplete is not running anymore');
}