/**
 * defines a .c or .cpp header that defines
 * @field namespace is the namespace name
 * @field class is the name of the class
 * @field includes is the array that contains the headers included
 * @field methods is the array that contains the methods signatures
*/

// @ts-nocheck
/**
  
  * @field copelands -- fork implementations, aside from minor impls and changes i introduced the CoreParser 
    * I have never worked with anyone ever when coding so i might not know how to comment shit please be kind.
    * I dont like javascript and this is my first time ever working with typescript and it makes me rage.
            
*/


export class header {
    namespace?: string;
    class?: string;
    includes: Array<string> = new Array<string>();
    methods: Array<string> = new Array<string>();
}

class OSDN {
  Names:string[]=[];

  encapsulated:number=0;
  is_Nested?:boolean;
  
};
class objFunction {
  Name?:string;
  ignore_implements:string=""
  encapsulated:number=0;
  inside_code?:boolean;
};
class objFileTracker {
  
  index:number =0;
  array:string[]=[];
  traverse(value : number): void {
        this.index += value;          
  }
  reached_limit () : boolean {
      if(this.index + 1 >= this.array.length){ 
          return true;
      }
      else return false;
  }
  next_line() : string {
      if(!this.reached_limit()) {
            this.traverse(1);
            return this.array[this.index];
      }
      else { return this.array[this.index]; }
  }
  relative_line(value : number){
     if( value ){
        let rel =  value + this.index;
        return  ( rel < this.array.length ) ? this.array[rel]:this.current_line();
     }    
     return this.array[value];
  }    
  previous_line() : string {
      
    this.traverse(-1);
    return this.array[this.index];
  }
  current_line() : string {
    return this.array[this.index];
  }
}
class ObjCoreParser {
    namespace:OSDN = new OSDN;
    function:objFunction = new objFunction;
    file:objFileTracker = new objFileTracker;
}
    
var coreParser: ObjCoreParser = new ObjCoreParser();

const debug_log = false; // enable debug logs

const log = (Message : string)=>{
  if ( debug_log )
  console.log(Message); 
}  


const Codepat = {
  enter_conditions_KnR: /\)\s*{/,
  enter_conditions_Allman: /\s*{/,
  enter_lambdaFunction_Allman: /\s*{/,
  enter_lambdaFunction_KnR: /\)\s*{/,
  
  exit_condition_lambda: /(\s}\s)|(\s};)/,
};
const patterns = {
  enter_Function_KnR : /\)\s*{/,
  enter_Function_Allman: /^\s*{/,
  exit_function: /\s*}\s*/,
  code : Codepat,
  defined_function: /\w+|\W+\s+\w+|\W+([^)]*\)(?!;))/
};

const isDefinedFunction = (current_line:string) => {
  if(! current_line.match(patterns.defined_function)) 
      return false;
      
  let result = coreParser.file.relative_line(1).match(patterns.enter_Function_Allman);
  if( current_line.match(patterns.enter_Function_KnR) || result ){
      log(`Caught defined Function = ${current_line}`)
      coreParser.function.ignore_implements += current_line.replace(/{/, " ").replace(/\s^/, "");
      coreParser.function.encapsulated = -1;
      coreParser.function.inside_code=true;
      if(result) 
        coreParser.file.traverse(1);
      else 
        coreParser.file.traverse(0);
      
      return true;
      
  } else return false;
}

const Skip_Function_Code=():void =>  { // and it does exactly what it was made for baby  
  let func = coreParser.function!;
  var file = coreParser.file!;
  
  if(!file?.reached_limit() && func.encapsulated < 0 ){ 
    let line_next = file?.next_line(); 
    let line_current = line_next;
    
    //  inside conditions and lambda ignore them 
    if(line_current.match(patterns.code.enter_conditions_KnR)   || line_next.match(patterns.code.enter_conditions_Allman)){        
      //log("entered lambda/condition")
      if(!line_current.match(/=\s*{[^}]*/)){
        func.encapsulated--; 
        func.inside_code=true;
      }
    }
    // exiting conditions|lambda|functions
    else if(func.inside_code  && line_current.match(patterns.code.exit_condition_lambda ) ||
    line_current.match(patterns.exit_function )  ){ 
      func.encapsulated++;
      //log("left lambda/condition")
    }  
    
    if(func.encapsulated == 0 ){
      func.inside_code = false;
      
     // log("left function")
    } 
    else if(func.inside_code == true){
      Skip_Function_Code();
    }
    
  }
  
}

const handle_OSDN = (current_line : string, osdn : OSDN) => 
{
  let file = coreParser.file ;
  // keep forgetting its a fucking array of lines, oh steve be more inclusive to autists working on your projects
  //let pattern = // /namespace {|namespace\s*{/ garbage...
  let pattern = /namespace|\bclass\b|\bstruct\b|\benum class\b|enum/; //  btw im so acoustic i learned regex in a day
  let name=""  
  
    if(current_line.match(/using/)) return false;
    if(current_line.match(/\bnamespace\b\s*\w*\s*=/)) 
        return false;
    
    if(current_line.match(pattern) ){
      name = current_line; 
      let underline = file.relative_line(1)
      if( !current_line.match(/{/) &&  underline.match(/^\s*{/)) 
          coreParser.file.traverse(1);
      
    } else return;
    
    let combine = new RegExp(`/^\s*\b${pattern}\b/`) // getting quite good yea
    name = name.replace( pattern, "" ); 
    name = name.replace(/{/, ''); 
        
  
    // let keyname  = name.split(' ')[1] + '::'; // really good baby
       let keyname = name.replace(/^\s*|\s*$/g, "") +  '::';

      
      
      osdn.Names.push(keyname); 
      osdn.encapsulated++;
      osdn.is_Nested = true;
      return true;
};
 
  
// @ts-ignore
const optimalRead =  (): string => {
  
  let  current_line =  coreParser.file?.next_line()!;
  let namespace  = coreParser.namespace!;
  
 
  if(handle_OSDN(current_line, namespace)){
    return current_line;
  }
  else if(isDefinedFunction(current_line))
  {
   
    Skip_Function_Code();
    current_line = coreParser.file?.current_line()!;  
  } 
  else if( namespace.encapsulated > 0 && current_line.match(/}/)){
    // disable namespace as an addition to function snippets
    namespace.Names.pop();
    namespace.encapsulated--;
    // ... 
  } else {
    
    
  } 
  
  return current_line;
}   

/**
 * parses the C/C++ header file
 * @param fileContent string that contains the file content divided by \n
 *  
*/

export function parse(fileContent: string): header {
  let h: header = new header();
  let commentBlock: boolean = false;
  let bracketsCount: number = 0; // cout the number of { } to dertermine if a class ends
  let arrayFileContent = fileContent.split('\n');
  let temp: string;
  let result : string;
  let index: number;
  
  coreParser.namespace = new OSDN;
  coreParser.function = new objFunction;
  coreParser.file = new objFileTracker;
  coreParser.file.array = arrayFileContent;
  let namespace  = coreParser.namespace;
  namespace.is_Nested = false;
  
  while(!coreParser.file.reached_limit()) 
  {  
    temp = optimalRead(); // Serve Steve's magic tomato soup algorithm with my own algo built ontop of it.
      bracketsCount =  coreParser.namespace.encapsulated; // magic soup please do your shit

    if(temp.match(/^\s*\/\//)){
      continue;
    }
    else if(lineIsComment(temp)){ // does this even work?
            commentBlock = temp.startsWith('/*') ? true : commentBlock;
    }
          if(commentBlock || lineIsComment(temp)){
            commentBlock = temp.includes('*/') ? false : commentBlock;
          }else{ 
              // how do you tame this thing // if(bracketsCount < 1 || (bracketsCount < 2 && h.namespace)){ 
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
                  
                  temp = addNamespace(temp, namespace);
                  h.methods.push(formatMethodsignature(temp.split(';')[0], h.class));
              
              }
              if(lineIsClass(temp)){
                h.class = temp.split(' ')[1].trim();
              }
              if(lineIsNamespace(temp)){
                temp += temp.includes('{') ? '' : '{';
                    h.namespace = temp;
                
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
      
      let ignore = coreParser.function.ignore_implements.replace(/\s*([a-z]*::)*/g, "")
      for(let i = 0; i < h.methods.length; i++)
      {
              
  
        let method_string = h.methods[i];
        method_string = method_string.replace(/\s*([a-z]*::)*/g, "");
        let result = ignore.includes(method_string);
        if(result){
             // @ts-ignore
            h.methods.splice(i, 1);
            i--;    
            
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
  
  function addNamespace(line: string, namespace : OSDN): string {
    let result : string = '';
     
    if(coreParser.namespace.is_Nested){
      
      line = line.replace(/^\s*/,"")
      let format = line.split(' '); 
      let name = coreParser.namespace.Names.toString().replace(/,/g, "")
      result += format[0], result +=  ` ${name}`;
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