"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * defines a .c or .cpp header that defines
 * @field namespace is the namespace name
 * @field class is the name of the class
 * @field methods is the array that contanins the methods signatures
 */
class header {
    constructor() {
        this.includes = new Array();
        this.methods = new Array();
    }
}
exports.header = header;
/**
 * parses the C++ header file
 * @param fileContent string that contains the file content divided by \n
 * @returns return a header instance that contanis the file parsed file
 */
function parse(fileContent) {
    let h = new header();
    let arrayFileContent = fileContent.split('\n');
    let temp;
    for (let i = 0; i < arrayFileContent.length; i++) {
        temp = arrayFileContent[i].trimLeft();
        if (!lineIsComment(temp)) {
            if (lineIsInclude(temp)) {
                h.includes.push(temp);
            }
            if (lineIsMethodSignature(temp)) {
                h.methods.push(temp.split(';')[0]);
            }
            if (lineIsClass(temp)) {
                h.class = temp.split(' ')[1].trim();
            }
            if (lineIsNamespace(temp)) {
                temp += temp.includes('{') ? '' : '{';
                h.namespace = temp;
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
    if (arrayMethodSignature2.length > 1) {
        for (let i = 0; i <= arrayMethodSignature2.length - 2; i++) {
            formattedMethodSignature += arrayMethodSignature2[i] + ' ';
        }
    }
    if (className) {
        formattedMethodSignature += `${className}::${arrayMethodSignature2[arrayMethodSignature2.length - 1] + '(' + arrayMethodSignature[arrayMethodSignature.length - 1]}`;
    }
    else {
        formattedMethodSignature = methodSignature;
    }
    return formattedMethodSignature;
}
exports.formatMethodsignature = formatMethodsignature;
//common to C and C++
function lineIsInclude(line) {
    return line.startsWith('#include');
}
//common to C and C++
function lineIsMethodSignature(line) {
    return line.includes(');');
}
//C++ only
function lineIsClass(line) {
    return line.startsWith('class');
}
//C++ only
function lineIsNamespace(line) {
    return line.startsWith('namespace');
}
function lineIsComment(line) {
    return line.startsWith('/*') || line.startsWith('//') || line.startsWith('*');
}
//# sourceMappingURL=parse.js.map