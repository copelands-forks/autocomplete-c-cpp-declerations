"use strict";
/**
 * defines a .c or .cpp header that defines
 * @field namespace is the namespace name
 * @field class is the name of the class
 * @field includes is the array that contains the headers included
 * @field methods is the array that contains the methods signatures
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileIsMain = exports.indent = exports.parse = exports.header = void 0;
// @ts-nocheck
/**
  
  * @field copeland/s -- fork implementations, aside from minor impls and changes i introduced the CoreParser
    * I have never worked with anyone ever when coding so i might not know how to comment shit please be kind.
    * I dont like javascript and this is my first time ever working with typescript and it makes me rage.
            
*/
class header {
    constructor() {
        this.includes = new Array();
        this.methods = new Array();
    }
}
exports.header = header;
class OSDN {
    constructor() {
        this.Names = [];
        this.encapsulated = 0;
    }
}
;
class objFunction {
    constructor() {
        this.ignore_implements = "";
        this.encapsulated = 0;
    }
}
;
class objFileTracker {
    constructor() {
        this.index = 0;
        this.array = [];
    }
    traverse(value) {
        this.index += value;
    }
    reached_limit() {
        if (this.index + 1 >= this.array.length) {
            return true;
        }
        else
            return false;
    }
    next_line() {
        if (!this.reached_limit()) {
            this.traverse(1);
            return this.array[this.index];
        }
        else {
            return this.array[this.index];
        }
    }
    relative_line(value) {
        if (value) {
            let rel = value + this.index;
            return (rel < this.array.length) ? this.array[rel] : this.current_line();
        }
        return this.array[value];
    }
    previous_line() {
        this.traverse(-1);
        return this.array[this.index];
    }
    current_line() {
        return this.array[this.index];
    }
}
class ObjCoreParser {
    constructor() {
        this.namespace = new OSDN;
        this.function = new objFunction;
        this.file = new objFileTracker;
    }
}
var coreParser = new ObjCoreParser();
const debug_log = false; // enable debug logs
const log = (Message) => {
    if (debug_log)
        console.log(Message);
};
const Codepat = {
    enter_conditions_KnR: /\)\s*{/,
    enter_conditions_Allman: /\s*{/,
    enter_lambdaFunction_Allman: /\s*{/,
    enter_lambdaFunction_KnR: /\)\s*{/,
    exit_condition_lambda: /(\s}\s)|(\s};)/,
};
const patterns = {
    enter_Function_KnR: /\)\s*{/,
    enter_Function_Allman: /^\s*{/,
    exit_function: /\s*}\s*/,
    code: Codepat,
    defined_function: /\w+|\W+\s+\w+|\W+([^)]*\)(?!;))/
};
const isDefinedFunction = (current_line) => {
    if (!current_line.match(patterns.defined_function))
        return false;
    let result = coreParser.file.relative_line(1).match(patterns.enter_Function_Allman);
    if (current_line.match(patterns.enter_Function_KnR) || result) {
        log(`Caught defined Function = ${current_line}`);
        coreParser.function.ignore_implements += current_line.replace(/{/, " ").replace(/\s^/, "");
        coreParser.function.encapsulated = -1;
        coreParser.function.inside_code = true;
        if (result)
            coreParser.file.traverse(1);
        else
            coreParser.file.traverse(0);
        return true;
    }
    else
        return false;
};
const Skip_Function_Code = () => {
    let func = coreParser.function;
    var file = coreParser.file;
    if (!(file === null || file === void 0 ? void 0 : file.reached_limit()) && func.encapsulated < 0) {
        let line_next = file === null || file === void 0 ? void 0 : file.next_line();
        let line_current = line_next;
        //  inside conditions and lambda ignore them 
        if (line_current.match(patterns.code.enter_conditions_KnR) || line_next.match(patterns.code.enter_conditions_Allman)) {
            //log("entered lambda/condition")
            if (!line_current.match(/=\s*{[^}]*/) && !line_current.match(/{([^}]*)}(?!;)/)) {
                func.encapsulated--;
                func.inside_code = true;
            }
            // if its deangled
            if (line_current.match(/(}\s*else)(\s\w+)([^\)])*\)\s+{/)) {
                func.encapsulated++;
            }
        }
        // exiting conditions|lambda|functions
        else if (func.inside_code && line_current.match(patterns.code.exit_condition_lambda) ||
            line_current.match(patterns.exit_function)) {
            func.encapsulated++;
            //log("left lambda/condition")
        }
        if (func.encapsulated == 0) {
            func.inside_code = false;
            // log("left function")
        }
        else if (func.inside_code == true) {
            Skip_Function_Code();
        }
    }
};
const skip_refs = (line) => {
    if (line.match(/using|typedef|#define/)) {
        coreParser.file.traverse(1);
        skip_refs(coreParser.file.relative_line(1));
        return false;
    }
    else if (coreParser.file.relative_line(1).match(/using|typedef|#define/)) {
        skip_refs(coreParser.file.relative_line(1));
    }
    return true;
};
const handle_OSDN = (current_line, osdn) => {
    let file = coreParser.file;
    // keep forgetting its a fucking array of lines, oh steve be more inclusive to autists working on your projects
    //let pattern = // /namespace {|namespace\s*{/ garbage...
    let pattern = /namespace|\bclass\b|\bstruct\b|\benum class\b|enum/; //  btw im so acoustic i learned regex in a day
    let name = "";
    skip_refs(current_line);
    if (current_line.match(/(\bnamespace\b\s*\w+|W+\s)*=/))
        return false;
    if (current_line.match(pattern)) {
        name = current_line;
        let underline = file.relative_line(1);
        if (!current_line.match(/{/) && underline.match(/^\s*{/))
            coreParser.file.traverse(1);
    }
    else
        return;
    let combine = new RegExp(`/\s*\b${pattern}\b/`); // getting quite good yea
    name = name.replace(pattern, "");
    name = name.replace(/:[^{]*/, "");
    name = name.replace(/{/, '');
    // let keyname  = name.split(' ')[1] + '::'; // really good baby
    let keyname = name.replace(/\s*|\s*$/g, "") + '::';
    osdn.Names.push(keyname);
    osdn.encapsulated++;
    osdn.is_Nested = true;
    return true;
};
// @ts-ignore
const optimalRead = () => {
    var _a, _b;
    let current_line = (_a = coreParser.file) === null || _a === void 0 ? void 0 : _a.next_line();
    let namespace = coreParser.namespace;
    if (handle_OSDN(current_line, namespace)) {
        return current_line;
    }
    else if (isDefinedFunction(current_line)) {
        Skip_Function_Code();
        current_line = (_b = coreParser.file) === null || _b === void 0 ? void 0 : _b.current_line();
    }
    else if (namespace.encapsulated > 0 && current_line.match(/}/)) {
        // disable namespace as an addition to function snippets
        namespace.Names.pop();
        namespace.encapsulated--;
        if (namespace.encapsulated == 0)
            namespace.is_Nested = false;
        // ... 
    }
    else {
    }
    if (current_line.match(/#\binclude\b/))
        current_line = current_line..replace(/^\s*/, "");
    return current_line;
};
/**
 * parses the C/C++ header file
 * @param fileContent string that contains the file content divided by \n
 *
*/
function parse(fileContent) {
    let h = new header();
    let commentBlock = false;
    let bracketsCount = 0; // cout the number of { } to dertermine if a class ends
    let arrayFileContent = fileContent.split('\n');
    let temp;
    let result;
    let index;
    coreParser.namespace = new OSDN;
    coreParser.function = new objFunction;
    coreParser.file = new objFileTracker;
    coreParser.file.array = arrayFileContent;
    let namespace = coreParser.namespace;
    namespace.is_Nested = false;
    while (!coreParser.file.reached_limit()) {
        temp = optimalRead(); // Serve Steve's magic tomato soup algorithm with my own algo built ontop of it.
        bracketsCount = coreParser.namespace.encapsulated; // magic soup please do your shit
        if (temp.match(/^\s*\/\//)) {
            continue;
        }
        else if (lineIsComment(temp)) { // does this even work?
            commentBlock = temp.startsWith('/*') ? true : commentBlock;
        }
        if (commentBlock || lineIsComment(temp)) {
            commentBlock = temp.includes('*/') ? false : commentBlock;
        }
        else {
            // how do you tame this thing // if(bracketsCount < 1 || (bracketsCount < 2 && h.namespace)){ 
            if (lineHasOpenBracket(temp)) {
                bracketsCount++;
            }
            if (lineHasCloseBracket(temp)) {
                bracketsCount--;
            }
            if (lineIsInclude(temp)) {
                h.includes.push(temp);
            }
            if (lineIsMethodSignature(temp, bracketsCount)) {
                temp = addNamespace(temp, namespace);
                h.methods.push(formatMethodsignature(temp.split(';')[0]));
            }
            if (lineIsClass(temp)) {
                h.class = temp.split(' ')[1].trim();
            }
            if (lineIsNamespace(temp)) {
                temp += temp.includes('{') ? '' : '{';
                h.namespace = temp;
            }
            else {
                if (lineHasOpenBracket(temp)) {
                    bracketsCount++;
                }
                if (lineHasCloseBracket(temp)) {
                    bracketsCount--;
                }
            }
        }
    }
    let ignore = coreParser.function.ignore_implements.replace(/\s*([a-z]*::)*/g, "");
    for (let i = 0; i < h.methods.length; i++) {
        let method_string = h.methods[i];
        method_string = method_string.replace(/\s*([a-z]*::)*/g, "");
        let result = ignore.includes(method_string);
        if (result) {
            // @ts-ignore
            h.methods.splice(i, 1);
            i--;
        }
    }
    return h;
}
exports.parse = parse;
/**
 *
 * @param methodSignature the string contains the method signature to be parsed
 * @param className optional parameter that contains the class name to be added before the function name
 *
 * @returns return a string that contains the formatted method signature
*/
function formatMethodsignature(methodSignature, className) {
    let arrayMethodSignature = methodSignature.split('(');
    let arrayMethodSignature2 = arrayMethodSignature[0].split(' ');
    let formattedMethodSignature = '';
    if (className) {
        if (arrayMethodSignature2.length > 1) {
            for (let i = 0; i <= arrayMethodSignature2.length - 2; i++) {
                formattedMethodSignature += arrayMethodSignature2[i] + ' ';
            }
        }
        formattedMethodSignature += `${className}::${arrayMethodSignature2[arrayMethodSignature2.length - 1]}`;
        for (let i = 1; i < arrayMethodSignature.length; i++) {
            formattedMethodSignature += '(' + `${arrayMethodSignature[i]}`;
        }
    }
    else {
        formattedMethodSignature = methodSignature;
    }
    return formattedMethodSignature;
}
function indent(methodSignature, indentationStyle, tab) {
    let separator = ' ';
    if (indentationStyle == "K&R")
        separator = ' ';
    if (indentationStyle == "Allman")
        separator = '\n';
    if (!indentationStyle)
        separator = ' ';
    return tab ? `\n\t${methodSignature}${separator}\t{\n\t\t\n\t}\n` : `\n${methodSignature}${separator}{\n\t\n}\n`;
}
exports.indent = indent;
function fileIsMain(lines) {
    let response = false;
    for (let i = 0; i < lines.length; i++) {
        if (lineIsMain(lines[i])) {
            response = true;
            i = lines.length;
        }
    }
    return response;
}
exports.fileIsMain = fileIsMain;
function lineIsInclude(line) {
    return line.startsWith('#include');
}
function lineIsMethodSignature(line, insideBracket) {
    let result = line.includes(');') && !(line.startsWith('typedef'));
    let shit = line.split(' ');
    if (shit.length == 1) {
        result = false;
    }
    else if (line[shit[0].length] != ' ') {
        result = false;
    }
    return result;
}
function addNamespace(line, namespace) {
    let result = '';
    if (coreParser.namespace.is_Nested) {
        line = line.replace(/^\s*/, "");
        let format = line.split(' ');
        let name = coreParser.namespace.Names.toString().replace(/,/g, "");
        result += format[0], result += ` ${name}`;
        let seperate = format.slice(1).join(' ');
        result += seperate;
    }
    else {
        result = line;
    }
    return result;
}
function lineIsNamespace(line) {
    return line.startsWith('namespace');
}
function lineIsClass(line) {
    return line.startsWith('class');
}
function lineIsComment(line) {
    return line.startsWith('/*') || line.startsWith('//') || line.startsWith('*');
}
function lineIsMain(line) {
    var res = line.includes('main');
    return res;
}
function lineHasOpenBracket(line) {
    return line.includes('{');
}
function lineHasCloseBracket(line) {
    return line.includes('}');
}
//# sourceMappingURL=parse.js.map