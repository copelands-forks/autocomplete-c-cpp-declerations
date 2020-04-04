/**
 * defines a .c or .cpp header that defines
 * @field namespace is the namespace name
 * @field class is the name of the class
 * @field methods is the array that contanins the methods signatures
 */
export class header {
    namespace?: string;
    class?: string;
    includes: Array<string> = new Array<string>();
    methods: Array<string> = new Array<string>();
}

/**
 * parses the C++ header file
 * @param fileContent string that contains the file content divided by \n
 * @returns return a header instance that contanis the file parsed file
 */
export function parse(fileContent: string): header {
    let h: header = new header();
    let arrayFileContent = fileContent.split('\n');
    let temp: string;
    for(let i = 0; i < arrayFileContent.length; i++){
        temp = arrayFileContent[i].trimLeft();
        if(lineIsInclude(temp)){
            h.includes.push(temp);
        }
        if(lineIsMethodSignature(temp)){
            h.methods.push(temp.split(';')[0]);
        }
        if(lineIsClass(temp)){
            h.class = temp.split(' ')[1].trim();
        }
        if(lineIsNamespace(temp)){
            temp += temp.includes('{') ? '' : '{';
            h.namespace = temp;
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
export function formatMethodsignature(methodSignature: string, className?: string | undefined): string {
	let arrayMethodSignature: Array<string> = methodSignature.split('(');
	let arrayMethodSignature2: Array<string> = arrayMethodSignature[0].split(' ');
	let formattedMethodSignature: string = '';

	if(arrayMethodSignature2.length > 1){
		for(let i = 0; i <= arrayMethodSignature2.length - 2; i++){
			formattedMethodSignature += arrayMethodSignature2[i] + ' ';
		}
	}
	formattedMethodSignature += className ? `${className}::${arrayMethodSignature2[arrayMethodSignature2.length - 1] + '(' + arrayMethodSignature[arrayMethodSignature.length - 1]}` : `${methodSignature}`;

	return formattedMethodSignature;
}

//common to C and C++
function lineIsInclude(line: string): boolean {
    return line.startsWith('#include');
}

//common to C and C++
function lineIsMethodSignature(line: string): boolean {
    return line.includes(');');
}

//C++ only
function lineIsClass(line: string): boolean {
    return line.startsWith('class');
}

//C++ only
function lineIsNamespace(line: string): boolean {
    return line.startsWith('namespace');
}