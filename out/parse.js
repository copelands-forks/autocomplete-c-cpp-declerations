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
class header {
    constructor() {
        this.includes = new Array();
        this.methods = new Array();
    }
}
exports.header = header;
class Namespace {
}
;
/**
 * parses the C/C++ header file
 * @param fileContent string that contains the file content divided by \n
 * @returns return a header instance that contanis the file parsed file
 */
function parse(fileContent) {
    let h = new header();
    let commentBlock = false;
    let bracketsCount = 0; //cout the number of { } to dertermine if a class ends
    let arrayFileContent = fileContent.split('\n');
    let temp;
    // copleands -- implementation to avoid reading inside of functions
    let result;
    let i;
    let namespace = new Namespace;
    let optimal_lineReads = (arrayFile) => {
        result = arrayFile[i].trimLeft();
        if (lineIsNamespace(result)) {
            namespace.name = result.split(' ')[1] + '::';
            namespace.inside = 1;
        }
        // check if we are a inside function
        if (result.match(/\)\{\s*$/)) {
            let outside_function = 0;
            while (i < arrayFile.length && !outside_function) { // i kinda forgot how to use javascript lol a while loop will do
                i++;
                let leavefunction = arrayFile[i].trimLeft();
                if (leavefunction.includes('){') || leavefunction.includes(')') && arrayFile[2 + i + leavefunction.length] == '{') {
                    //  inside conditions and lambda ignore them 
                    outside_function = -1;
                }
                else if (outside_function == -1) {
                    // conditions and lambda  exits
                    outside_function = (leavefunction.includes('}')) ? 0 : -1;
                }
                else {
                    if (!leavefunction.includes('};') && leavefunction.includes("}")) {
                        result = arrayFile[i].trimLeft();
                        outside_function = 1;
                    }
                }
            }
        }
        else if (namespace.inside == 1) { // disable namespace as an addition to function snippets
            if (result.includes('}')) {
                namespace.inside = 0;
            }
            // ... 
        }
        return result;
    };
    for (i = 0; i < arrayFileContent.length; i++) {
        temp = optimal_lineReads(arrayFileContent);
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
    if (namespace.inside) {
        let format = line.split(' ');
        result += format[0], result += ` ${namespace.name}`;
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
    if (res)
        console.log(res);
    return res;
}
function lineHasOpenBracket(line) {
    return line.includes('{');
}
function lineHasCloseBracket(line) {
    return line.includes('}');
}
//# sourceMappingURL=parse.js.map