// @ts-nocheck
import { ExtensionContext, commands, window, workspace, Position, ViewColumn, languages, CompletionItem, SnippetString, Uri, TextEditor, Range, TextEdit, DocumentHighlight } from 'vscode'; //import vscode classes and workspace
import { header, parse, indent, fileIsMain } from './parse'; //import parse functions and class
import { CompletionItemProvider, TextDocument,   CancellationToken,   CompletionList } from 'vscode';
import * as fs from 'fs';
//settings
var indentStyle: string | undefined;
var columnNumber: ViewColumn | undefined;
var triggerChar: string | undefined;
var headersFolder: string | undefined;
var pathSeparationToken: string;

function readSettings(): void {
  indentStyle = workspace.getConfiguration('autocomplete-c-cpp-files').get('indentStyle');
	columnNumber = workspace.getConfiguration('autocomplete-c-cpp-files').get('columnNumber');
	triggerChar = workspace.getConfiguration('autocomplete-c-cpp-files').get('triggerChar');
	headersFolder = workspace.getConfiguration('autocomplete-c-cpp-files').get('headersFolder');
}

class triggerMethod {
  global?:boolean

  noAdding?:boolean

};
  var tm :triggerMethod = new triggerMethod(); 

function isTriggerCharValid(document: TextDocument, position: Position): boolean {
  let lineText = document.lineAt(position.line).text;
  const prefix = lineText.substring(0, position.character);
  let result = /(\.|\..)\s*/.test(lineText);
  tm.global = false;
  
  lineText = lineText.replace(/\s/g, "")
    // cant you just do {0} like in c this language is ridiculous
    if(lineText == '..') {
      tm.global = true;
    
    }
 
    
  
 
  return result; 
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed



export async function activate(context: ExtensionContext) {
	console.log('C/C++ autocomplete is running');
	readSettings();
	pathSeparationToken = process.platform == 'win32' ? '\\' : '/';
	triggerChar = triggerChar ? triggerChar : '.';
	const C_provider = languages.registerCompletionItemProvider('c', {
		async provideCompletionItems(document, position) {
		  if(isTriggerCharValid(document, position)){
        return await createCompletitions(window.activeTextEditor, new Range(position, position.translate(0, -1)));
		  }
      return []
      
		}
	}, triggerChar);
  
	const Cpp_provider = languages.registerCompletionItemProvider('cpp', {
    async provideCompletionItems(document, position) {
      if(isTriggerCharValid(document, position)){
        return await createCompletitions(window.activeTextEditor, new Range(position, position.translate(0, -1)));
      }
      return []
		}
    
	}, triggerChar);
	
   

	context.subscriptions.push(commands.registerCommand('extension.writeimplfile', writeimplfile));
	context.subscriptions.push(commands.registerCommand('extension.parsemainfile', parsemainfile));

	context.subscriptions.push(C_provider, Cpp_provider);
}

function writeimplfile(): void {
	let editor = window.activeTextEditor;
	if(editor){
		let document = editor.document;
		let fileName = document.fileName.split(pathSeparationToken)[document.fileName.split(process.platform === 'win32' ? '\\' : '/').length - 1];
		if(document.fileName.endsWith('.h') || document.fileName.endsWith('hpp')){
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
		if(document.fileName.endsWith('.c') || document.fileName.endsWith('cpp') || document.fileName.endsWith('cc')){
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

function parseAndCreateCompletitions(fileContent: string, deleteRange: Range, header_ref?:header): CompletionItem[] {
	let h = new	header();
	let completitions: CompletionItem[] = [];
	h = parse(fileContent);
	 

	
	
	h.methods.forEach(el => {
		let completition = new CompletionItem(el);
		completition.additionalTextEdits = [TextEdit.delete(deleteRange)];
		completitions.push(completition);
	});
	if(h.namespace){
		let namespaceCompletition = new CompletionItem(h.namespace.slice(0, h.namespace.length - 2));
		namespaceCompletition.additionalTextEdits = [TextEdit.delete(deleteRange)];
		completitions.push(namespaceCompletition);
	}
	
	if(header_ref) { 
	  // send back header so we deal with includes, they should also be completionated if thats a word
	  header_ref.methods = h.methods;
	  header_ref.includes = h.includes;

	}
  return completitions;
}

async function createCompletitions(editor: TextEditor | undefined, deleteRange: Range) : Promise<CompletionItem[]> {
	readSettings();
  let completitions: CompletionItem[] = [];
  if(!editor){
      return completitions;
  }
 
  let wsfile = workspace.workspaceFile
	const workSpace = {
    self: workspace,
    folder: workspace.workspaceFolders,
    file: workspace.workspaceFile
  };
	    
	let h:header = new header();    
  
		let doc = editor.document;
		let lines = editor.document.getText();
	
		if(doc.fileName.endsWith('.c') || doc.fileName.endsWith('.hpp') || doc.fileName.endsWith('.h') || doc.fileName.endsWith('.cpp') || doc.fileName.endsWith('cc')){
      
      // we prioritize the current file
      if(tm.global){
        deleteRange = new Range (
          new Position(editor.selection.active.line, editor.selection.active.character - 2),   
          editor.selection.active
        );
      }
      
      
      completitions = parseAndCreateCompletitions(lines, deleteRange, h);
      if(!tm.global ) return completitions;
      
      
      let array_wfiles = await getAllWorkspaceFiles();
      let wsfiles = array_wfiles;
      
      let hfiles = h.includes.toString().replace(/#\binclude\b\s*"/g,"");
      for(var Path of wsfiles){
        let path = Path.path.replace(/^(.*\/)([^/]+)$/, '$2');
        if(!hfiles.includes(path)){
          continue;
        }
        
        
        let fileContent = fs.readFileSync(Path.fsPath, 'utf8');
        
        completitions = completitions.concat(parseAndCreateCompletitions(fileContent, deleteRange, h));
      }
		}
    
	return completitions;
}

async function getAllWorkspaceFiles(): Promise<vscode.Uri[]> {
  let files = await workspace.findFiles('**/*');
  return files;
}

async function openImplementationFile(fileContent: string, fileLanguage: string): Promise<void> {
	let doc = await workspace.openTextDocument({ language: fileLanguage, content: fileContent });
	window.showTextDocument(doc, columnNumber);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('C/C++ autocomplete is not running anymore');
}