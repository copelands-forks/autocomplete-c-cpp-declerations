import { ExtensionContext, commands, window, workspace, Position, ViewColumn, CompletionList, languages, TextDocument, CancellationToken, CompletionContext, CompletionItem, SnippetString, MarkdownString, CompletionItemKind, Uri, TextEditor } from 'vscode'; //import vscode classes and workspace
import { header, parse, indent } from './parse'; //import parse functions and class

//settings
var indentStyle: string | undefined;
var columnNumber: ViewColumn | undefined;
var triggerChar: string | undefined;
var completitionsAlreadyDone: CompletionItem[] = [];

function readSettings(): void {
	indentStyle = workspace.getConfiguration('autocomplete-c-cpp-files').get('indentStyle');
	columnNumber = workspace.getConfiguration('autocomplete-c-cpp-files').get('columnNumber');
	triggerChar = workspace.getConfiguration('autocomplete-c-cpp-files').get('triggerChar');
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	console.log('C/C++ autocomplete is running');
	readSettings();
	// if(window.activeTextEditor){
	// 	console.log(workspace.getWorkspaceFolder(window.activeTextEditor.document.uri));
	// }

	const C_provider = languages.registerCompletionItemProvider('c', {
		provideCompletionItems() {
			let completitions = createCompletitions(window.activeTextEditor);
			let newCompletitions: CompletionItem[] = [];
			for(let i = 0; i < completitions.length; i++) {
				if(!(arrayCompletitionIncludes(completitionsAlreadyDone, completitions[i]))){
					newCompletitions.push(completitions[i]);
				}
			}
			completitionsAlreadyDone = completitionsAlreadyDone.concat(newCompletitions);
			return completitionsAlreadyDone;
		}
	}, triggerChar ? triggerChar : '.');

	const Cpp_provider = languages.registerCompletionItemProvider('cpp', {
		provideCompletionItems() {
			let completitions = createCompletitions(window.activeTextEditor);
			let newCompletitions: CompletionItem[] = [];
			for(let i = 0; i < completitions.length; i++) {
				if(!(arrayCompletitionIncludes(completitionsAlreadyDone, completitions[i]))){
					newCompletitions.push(completitions[i]);
				}
			}
			completitionsAlreadyDone = completitionsAlreadyDone.concat(newCompletitions);
			return completitionsAlreadyDone;
		}
	}, triggerChar ? triggerChar : '.');

	context.subscriptions.push(commands.registerCommand('extension.writeimplfile', writeimplfile));
	context.subscriptions.push(commands.registerCommand('extension.parsemainfile', parsemainfile));

	context.subscriptions.push(C_provider, Cpp_provider);
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

function createCompletitions(editor: TextEditor | undefined) {
	let snippetsCompletition: CompletionItem[] = [];
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

function arrayCompletitionIncludes(array: CompletionItem[], el: CompletionItem): boolean {
	let response = false;
	if(array.length != 0){
		for(let i = 0; i < array.length; i++){
			if(array[i].label == el.label){
				response = true;
			}
		}
	}
	return response;
}

async function openImplementationFile(fileContent: string, fileLanguage: string): Promise<void> {
	let doc = await workspace.openTextDocument({ language: fileLanguage, content: fileContent });
	window.showTextDocument(doc, columnNumber);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('C/C++ autocomplete is not running anymore');
}