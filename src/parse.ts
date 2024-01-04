/**
 * defines a .c or .cpp header that defines
 * @field namespace is the namespace name
 * @field class is the name of the class
 * @field includes is the array that contains the headers included
 * @field methods is the array that contains the methods signatures
 */
export class header {
    namespace?: string;
    class?: string;
    includes: Array<string> = new Array<string>();
    methods: Array<string> = new Array<string>();
}

class Namespace {
  Names:string=''
  encapsulated:number=0;
  is_Nested:boolean=false;
  
};
class objFunction {
  Name:string='';
  encapsulated:number=0;
  inside_code:boolean=false;
};
class objFileTracker {
  
  index:number =0;
  array:string[]=[];
  
  reached_limit () : boolean {
      if(this.index > this.array.length) return false;
      return true;
  }
  next_word() : string {
    this.index++; return this.array[this.index];
  }
  previous_word() : string {
    this.index--; return this.array[this.index];
  }
  current_word() : string {
     return this.array[this.index];
  }
}
class ObjCoreParser {
    namespace?:Namespace;
    function?:objFunction;
    file?:objFileTracker;
}
    
var coreParser : ObjCoreParser;     

const debug_log = true;

const log = (Message : string)=>{
    if ( debug_log )  console.log(Message);
}  
  
  
const Codepat = {
  enter_conditions_KnR: /)\s*{/,
  enter_conditions_Allman: /\s*{/,
  enter_lambdaFunction_Allman: /\s*{/,
  enter_lambdaFunction_KnR: /)\s*{/,
  
  exit_condition_lambda: /(\s}\s)|(\s};)/,
};
const patterns = {
  enter_Function_KnR : /)\s*/,
  enter_Function_Allman: /\s*{/,
  exit_function: /\s*}\s*/,
  
  code : Codepat
};
  
  
    
  
  
  

const Skip_Function_Code=():void =>  {
  let func = coreParser.function!;
  var file = coreParser.file!;
  
    if(file?.reached_limit() && func.encapsulated < 0 ){ // i kinda forgot how to use javascript lol a while loop will do
      let line_current = file?.current_word();
      let line_next = file?.next_word();
    
      //  inside conditions and lambda ignore them 
      if(line_current.match(patterns.code.enter_conditions_KnR)   || line_current.match(patterns.code.enter_conditions_Allman)){        
        log("entered lambda/condition")
        func.encapsulated--; 
        func.inside_code=true;
      }
      // exiting conditions and lambda functions
      else if(func.inside_code  && line_current.match(patterns.code.exit_condition_lambda )){ 
        func.encapsulated++;
        if(func.encapsulated == 0 ){
          func.inside_code = false;
          log("left function")
        } else {
          log("left lambda/condition")
          
        }
      }
      
      if(func.inside_code == false){
        Skip_Function_Code();
      }
        
    }
      
}

const optimalRead =  (): string => {
  let  result =  coreParser.file?.current_word()!;
  let namespace  = coreParser.namespace!;
  
  if(lineIsNamespace(result)){
    namespace.Names = result.split(' ')[1] + '::';
    namespace.encapsulated++;
  
  } 
  else if(result.match(patterns.enter_Function_Allman) || result?.match(patterns.enter_Function_KnR)){
    Skip_Function_Code();
      
  } 
  else if( namespace.encapsulated > 0 && result.includes('}')){// disable namespace as an addition to function snippets
    namespace.encapsulated++;
    // ... 
  }
    
    
  
  return result;
}   

/**
 * parses the C/C++ header file
 * @param fileContent string that contains the file content divided by \n
 *  
*/

export function parse(fileContent: string): header {
  let h: header = new header();
  let commentBlock: boolean = false;
  let bracketsCount: number = 0; //cout the number of { } to dertermine if a class ends
  let arrayFileContent = fileContent.split('\n');
  let temp: string;
  // copleands -- implementation to avoid reading inside of functions
  let result : string;
  let index: number;
  
  coreParser.namespace = new Namespace;
  coreParser.function = new objFunction;
  coreParser.file = new objFileTracker;
  
  let namespace  = coreParser.namespace;
  
  
  while(!coreParser.file.reached_limit()){
    
        temp = optimalRead();
        if(lineIsComment(temp)){
            commentBlock = temp.startsWith('/*') ? true : commentBlock;
        }
        if(commentBlock || lineIsComment(temp)){
            commentBlock = temp.includes('*/') ? false : commentBlock;
        }else{
            if(bracketsCount < 1 || (bracketsCount < 2 && h.namespace)){
                if(lineHasOpenBracket(temp)){
                    bracketsCount++;
                }
                if(lineHasCloseBracket(temp)){
                    bracketsCount--;
                }
             
                if(lineIsInclude(temp)){
                    h.includes.push(temp);
                }
                if(lineIsMethodSignature(temp, bracketsCount)){
                    if(bracketsCount == 0 || (bracketsCount == 1 && h.namespace)){
                        temp = addNamespace(temp, namespace);
                        h.methods.push(formatMethodsignature(temp.split(';')[0], undefined));
                      }else{
                        temp = addNamespace(temp, namespace);
                        h.methods.push(formatMethodsignature(temp.split(';')[0], h.class));
                    }
                }
                if(lineIsClass(temp)){
                    h.class = temp.split(' ')[1].trim();
                }
                if(lineIsNamespace(temp)){
                    temp += temp.includes('{') ? '' : '{';
                    h.namespace = temp;
                }
            } else {
                if(lineHasOpenBracket(temp)){
                    bracketsCount++;
                }
                if(lineHasCloseBracket(temp)){
                    bracketsCount--;
                }
            }
        }
    }

    return h;
}

/**
 * 
 * @param methodSignature the string contains the method signature to be parsed
 * @param className optional parameter that contains the class name to be added before the function name
 * 
 * @returns return a string that contains the formatted method signature
 */
function formatMethodsignature(methodSignature: string, className?: string | undefined): string {
	let arrayMethodSignature: Array<string> = methodSignature.split('(');
	let arrayMethodSignature2: Array<string> = arrayMethodSignature[0].split(' ');
	let formattedMethodSignature: string = '';

    if(className){
        if(arrayMethodSignature2.length > 1){
            for(let i = 0; i <= arrayMethodSignature2.length - 2; i++){
                formattedMethodSignature += arrayMethodSignature2[i] + ' ';
            }
        }
        formattedMethodSignature += `${className}::${arrayMethodSignature2[arrayMethodSignature2.length - 1]}`;
        for(let i = 1; i < arrayMethodSignature.length; i++){
            formattedMethodSignature += '(' + `${arrayMethodSignature[i]}`;
        }
    }else{
        formattedMethodSignature = methodSignature;
    }

	return formattedMethodSignature;
}

export function indent(methodSignature: string, indentationStyle: string | undefined, tab: boolean): string {
    let separator: string = ' ';
    if(indentationStyle == "K&R")
        separator = ' ';
    if(indentationStyle == "Allman")
        separator = '\n';
    if(!indentationStyle)
        separator = ' ';

    return tab ? `\n\t${methodSignature}${separator}\t{\n\t\t\n\t}\n` : `\n${methodSignature}${separator}{\n\t\n}\n`
}

export function fileIsMain(lines: string[]): boolean {
    let response: boolean = false;
    for(let i = 0; i < lines.length; i++){
        if(lineIsMain(lines[i])){
            response = true;
            i = lines.length;
        }
    }
    return response;
}

function lineIsInclude(line: string): boolean {
    return line.startsWith('#include');
}

function lineIsMethodSignature(line: string, insideBracket:number): boolean {
    let result = line.includes(');') && !(line.startsWith('typedef'));
    let shit = line.split(' ');
    if(shit.length == 1){
      result = false;
    }  else if(  line[shit[0].length] != ' '){
      result = false;
    }
    
    return result;
  }
  
  function addNamespace(line: string, namespace : Namespace): string {
    let result : string = '';
    
    if(namespace.is_Nested){
      let format = line.split(' '); 
      result += format[0], result +=  ` ${namespace.Names}`;
      let  seperate = format.slice(1).join(' ');
      result += seperate;
    } else {
      result = line;
    }
      
      return result;
  }

function lineIsNamespace(line: string): boolean {
  return line.startsWith('namespace');
}

function lineIsClass(line: string): boolean {
    return line.startsWith('class');
}
function lineIsComment(line: string): boolean {
    return line.startsWith('/*') || line.startsWith('//') || line.startsWith('*');
}

function lineIsMain(line: string): boolean {
    var res =  line.includes('main');
    
    
    return res;
}
function lineHasOpenBracket(line: string){
    return line.includes('{');
}

function lineHasCloseBracket(line: string){
    return line.includes('}');
}