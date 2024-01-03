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
  name?:string;
  inside?:number;
};
/**
 * parses the C/C++ header file
 * @param fileContent string that contains the file content divided by \n
 * @returns return a header instance that contanis the file parsed file
 */
 
 
export function parse(fileContent: string): header {
    let h: header = new header();
    let commentBlock: boolean = false;
    let bracketsCount: number = 0; //cout the number of { } to dertermine if a class ends
    let arrayFileContent = fileContent.split('\n');
    let temp: string;
    // copleands -- implementation to avoid reading inside of functions
    let result : string;
    let i: number;
    let namespace  = new Namespace;
    
    let optimal_lineReads   = (arrayFile:string[]): string =>  {
      result  = arrayFile[i].trimLeft();
       if(lineIsNamespace(result)){
         namespace.name = result.split(' ')[1] + '::';
         namespace.inside = 1;
          
       } 
          // check if we are a inside function
          if(result.match(/\)\{\s*$/) ){
            let outside_function : number = 0;
            while(i < arrayFile.length && !outside_function ){ // i kinda forgot how to use javascript lol a while loop will do
              i++;
              let leavefunction : string = arrayFile[i].trimLeft();
              
              if(leavefunction.includes('){') || leavefunction.includes(')') && arrayFile[  2 + i + leavefunction.length  ] == '{') {
                //  inside conditions and lambda ignore them 
                outside_function = -1; 
              }
              else if(outside_function == -1 ){ 
                // conditions and lambda  exits
                  outside_function = ( leavefunction.includes('}') ) ? 0:-1 ;
              }
              else {
                      if(!leavefunction.includes('};')&& leavefunction.includes("}")){
                        result = arrayFile[i].trimLeft();
                        outside_function = 1;
                          
                      }
              }
              
            }
              
          } else if(namespace.inside == 1 ){ // disable namespace as an addition to function snippets
              if(result.includes('}')){
                  namespace.inside = 0;
              }
              // ... 
            }
            
        return result;
    }   
    for(i = 0; i < arrayFileContent.length; i++){
         
        temp = optimal_lineReads(arrayFileContent);
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
    
    if(namespace.inside){
      let format = line.split(' '); 
      result += format[0], result +=  ` ${namespace.name}`;
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
    if(res)
      console.log(res);
    
    return res;
}
function lineHasOpenBracket(line: string){
    return line.includes('{');
}

function lineHasCloseBracket(line: string){
    return line.includes('}');
}