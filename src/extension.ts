import { ExtensionContext, commands, window, workspace, Position, ViewColumn, CompletionList, languages, TextDocument, CancellationToken, CompletionContext, CompletionItem, SnippetString, MarkdownString, CompletionItemKind, Uri, TextEditor, WorkspaceFolder } from 'vscode'; //import vscode classes and workspace
import { header, parse, indent, fileIsMain } from './parse'; //import parse functions and class

//settings
var indentStyle: string | undefined;
var columnNumber: ViewColumn | undefined;
var triggerChar: string | undefined;

function readSettings(): void {
	indentStyle = workspace.getConfiguration('autocomplete-c-cpp-files').get('indentStyle');
	columnNumber = workspace.getConfiguration('autocomplete-c-cpp-files').get('columnNumber');
	triggerChar = workspace.getConfiguration('autocomplete-c-cpp-files').get('triggerChar');
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
	console.log('C/C++ autocomplete is running');
	readSettings();
	if(window.activeTextEditor){
		createCompletitions(window.activeTextEditor);
	}

	const C_provider = languages.registerCompletionItemProvider('c', {
		async provideCompletionItems() {
			return await createCompletitions(window.activeTextEditor);
		}
	}, triggerChar ? triggerChar : '.');

	const Cpp_provider = languages.registerCompletionItemProvider('cpp', {
		async provideCompletionItems() {
			return await createCompletitions(window.activeTextEditor);
		}
	}, triggerChar ? triggerChar : '.');

	context.subscriptions.push(commands.registerCommand('extension.writeimplfile', writeimplfile));
	context.subscriptions.push(commands.registerCommand('extension.parsemainfile', parsemainfile));

	context.subscriptions.push(C_provider, Cpp_provider);
}

function writeimplfile(): void {
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
				parsedFileContent += indent(h.methods[i], indentStyle, h.namespace ? true : false);
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

function parseAndCreateCompletitions(fileContent: string): CompletionItem[] {
	let h = new	header();
	let completitions: CompletionItem[] = [];
	h = parse(fileContent);
	h.methods.forEach(el => {
		let completition = new CompletionItem(el);
		completition.insertText = new SnippetString(indent(el, indentStyle, false)); 
		completitions.push(completition);
	});
	if(h.namespace){
		completitions.push(new CompletionItem(h.namespace + '\n}'));
	}
	return completitions;
}

async function createCompletitions(editor: TextEditor | undefined) : Promise<CompletionItem[]> {
	let completitions: CompletionItem[] = [];
	if(editor){
		let doc = editor.document;
		let lines = editor.document.getText();
		if(doc.fileName.endsWith('.c') || doc.fileName.endsWith('.cpp')){
			if(fileIsMain(lines.split('\n'))){
				//create completitions
				completitions = parseAndCreateCompletitions(lines);
			} else {
				//open the header file and create completitions
				let pathToHeader: string = '';
				if(window.activeTextEditor){
					console.log(window.activeTextEditor.document.uri);
				}
				pathToHeader = doc.fileName.replace(doc.fileName.endsWith('.c') ? '.c' : '.cpp', '.h');
				let headerUri = Uri.file(pathToHeader);
				let fileContent = await workspace.fs.readFile(headerUri);
				completitions = parseAndCreateCompletitions(fileContent.toString());
			}
		}
	}
	return completitions;
}

async function openImplementationFile(fileContent: string, fileLanguage: string): Promise<void> {
	let doc = await workspace.openTextDocument({ language: fileLanguage, content: fileContent });
	window.showTextDocument(doc, columnNumber);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('C/C++ autocomplete is not running anymore');
}