"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileIsMain = exports.indent = exports.parse = exports.header = void 0;
/**
 * defines a .c or .cpp header that defines
 * @field namespace is the namespace name
 * @field class is the name of the class
 * @field includes is the array that contains the headers included
 * @field methods is the array that contains the methods signatures
 */
// @ts-nocheck
class header {
    constructor() {
        this.includes = new Array();
        this.methods = new Array();
    }
}
exports.header = header;
class Namespace {
    constructor() {
        this.Names = [];
        this.encapsulated = 0;
    }
}
;
class objFunction {
    constructor() {
        this.ignore_implements = "$";
        this.encapsulated = 0;
    }
}
;
class objFileTracker {
    constructor() {
        this.index = 0;
        this.array = [];
    }
    reached_limit() {
        if (this.index + 1 >= this.array.length) {
            return true;
        }
        else
            return false;
    }
    next_word() {
        if (!this.reached_limit()) {
            this.index++;
            return this.array[this.index];
        }
        else {
            return this.array[this.index];
        }
    }
    previous_word() {
        this.index--;
        return this.array[this.index];
    }
    current_word() {
        return this.array[this.index];
    }
}
class ObjCoreParser {
    constructor() {
        this.namespace = new Namespace;
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
    enter_Function_KnR: /\){\s*/,
    enter_Function_Allman: /\s*{/,
    exit_function: /\s*}\s*/,
    code: Codepat
};
const Skip_Function_Code = () => {
    let func = coreParser.function;
    var file = coreParser.file;
    if (!(file === null || file === void 0 ? void 0 : file.reached_limit()) && func.encapsulated < 0) { // skip function code 
        let line_next = file === null || file === void 0 ? void 0 : file.next_word();
        let line_current = line_next;
        //  inside conditions and lambda ignore them 
        if (line_current.match(patterns.code.enter_conditions_KnR) || line_next.match(patterns.code.enter_conditions_Allman)) {
            log("entered lambda/condition");
            func.encapsulated--;
            func.inside_code = true;
        }
        // exiting conditions|lambda|functions
        else if (func.inside_code && line_current.match(patterns.code.exit_condition_lambda) ||
            line_current.match(patterns.exit_function)) {
            func.encapsulated++;
            log("left lambda/condition");
        }
        if (func.encapsulated == 0) {
            func.inside_code = false;
            file.next_word();
            log("left function");
        }
        else if (func.inside_code == true) {
            Skip_Function_Code();
        }
    }
};
const optimalRead = () => {
    var _a, _b, _c;
    let result = (_a = coreParser.file) === null || _a === void 0 ? void 0 : _a.next_word();
    let namespace = coreParser.namespace;
    if (result.match(/namespace/)) {
        result = result.replace(/^\s*namespace/, 'namespace');
        let keyname = "";
        keyname += result.split(' ')[1] + '::';
        namespace.Names.push(keyname);
        namespace.encapsulated++;
        namespace.is_Nested = true;
    }
    else if (result.match(patterns.enter_Function_Allman) || (result === null || result === void 0 ? void 0 : result.match(patterns.enter_Function_KnR))) {
        coreParser.function.ignore_implements += result.replace(/{/, " ").replace(/\s^/, "");
        (_b = coreParser.function) === null || _b === void 0 ? void 0 : _b.encapsulated = -1;
        coreParser.function.inside_code = true;
        Skip_Function_Code();
        result = (_c = coreParser.file) === null || _c === void 0 ? void 0 : _c.current_word();
    }
    else if (namespace.encapsulated > 0 && result.includes('}')) { // disable namespace as an addition to function snippets
        namespace.encapsulated--;
        if (namespace.encapsulated != 1)
            namespace.Names.pop();
        // ... 
    }
    else {
    }
    return result;
};
/**
 * parses the C/C++ header file
 * @param fileContent string that contains the file content divided by \n
 *
*/
function parse(fileContent) {
    let h = new header();
    let commentBlock = false;
    let bracketsCount = 0; //cout the number of { } to dertermine if a class ends
    let arrayFileContent = fileContent.split('\n');
    let temp;
    // copleands -- implementation to avoid reading inside of functions
    let result;
    let index;
    coreParser.namespace = new Namespace;
    coreParser.function = new objFunction;
    coreParser.file = new objFileTracker;
    coreParser.file.array = arrayFileContent;
    let namespace = coreParser.namespace;
    namespace.is_Nested = false;
    while (!coreParser.file.reached_limit()) {
        temp = optimalRead();
        if (lineIsComment(temp)) {
            commentBlock = temp.startsWith('/*') ? true : commentBlock;
        }
        if (commentBlock || lineIsComment(temp)) {
            commentBlock = temp.includes('*/') ? false : commentBlock;
        }
        else {
            if (bracketsCount < 1 || (bracketsCount < 2 && h.namespace)) {
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
                    if (bracketsCount == 0 || (bracketsCount == 1 && h.namespace)) {
                        temp = addNamespace(temp, namespace);
                        h.methods.push(formatMethodsignature(temp.split(';')[0], undefined));
                    }
                    else {
                        temp = addNamespace(temp, namespace);
                        h.methods.push(formatMethodsignature(temp.split(';')[0], h.class));
                    }
                }
                if (lineIsClass(temp)) {
                    h.class = temp.split(' ')[1].trim();
                }
                if (lineIsNamespace(temp)) {
                    temp += temp.includes('{') ? '' : '{';
                    h.namespace = temp;
                }
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
    for (let methods in h.methods) {
        if (coreParser.function.ignore_implements.includes(h.methods[methods])) {
            let num = +methods;
            h.methods.splice(num, 1);
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
        let name = coreParser.namespace.Names.toString().replace(/,/, "");
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