import chalk from 'chalk';
const { blue, red, green, cyan, yellow } = chalk;
const log = (color, data) => console.log(color(JSON.stringify(data, null, 2)));
/* 
 * If we had two functions `add` and `subtract` they would be written like this:
 *                  LISP                      C
 *
 *   2 + 2          (add 2 2)                 add(2, 2)
 *   4 - 2          (subtract 4 2)            subtract(4, 2)
 *   2 + (4 - 2)    (add 2 (subtract 4 2))    add(2, subtract(4, 2))
 *
 * Easy peezy right?
 *
 * Well good, because this is exactly what we are going to compile. While this
 * is neither a complete LISP or C syntax, it will be enough of the syntax to
 * demonstrate many of the major pieces of a modern compiler.
*/

/*
 *
 * Most compilers break down into three primary stages: Parsing, Transformation,
 * and Code Generation
 *
 * 1. *Parsing* is taking raw code and turning it into a more abstract
 *    representation of the code.
 *
 * 2. *Transformation* takes this abstract representation and manipulates to do
 *    whatever the compiler wants it to.
 *
 * 3. *Code Generation* takes the transformed representation of the code and
 *    turns it into new code.
*/

// TOKENIZER
function tokenizer(input) {
    let current = 0;
    let tokens = [];

    while (current < input.length) {
        let char = input[current];
        // parentheses
        if (char === "(" || char === ")") {
            tokens.push({
                type: 'paren',
                value: char
            });
            ++current;
            continue
        }
        // white space
        let WS = /\s/i;

        if (WS.test(char)) {
            ++current;
            continue;
        }
        // number
        let NUMBER = /[0-9]/i;

        if (NUMBER.test(char)) {
            tokens.push({
                type: 'number',
                value: char
            })
            ++current;
            continue
        }
        // opening quote
        if (char === '"') {
            let value = '';
            char = input[++current];

            while (char !== '"') {
                value += char;
                char = input[++current];
            }
            char = input[++current];
            tokens.push({
                type: 'string',
                value
            })
            continue
        }
        // letter
        let LETTER = /[a-z]/i;

        if (LETTER.test(char)) {
            let value = '';

            while (LETTER.test(char)) {
                value += char;
                char = input[++current];
            }

            tokens.push({
                type: 'name',
                value
            });

            continue;
        }

        throw new SyntaxError('I dont know what this character is: ' + char)
    }
    return tokens
}

// PARSER
function parser(tokens) {
    let current = 0;

    function walk() {
        let token = tokens[current];

        if (token.type === 'number') {
            ++current;
            return {
                type: 'NumberLiteral',
                value: token.value
            }
        }

        if (token.type === 'string') {
            ++current;
            return {
                type: 'StringLiteral',
                value: token.value
            }
        }

        if (token.type === 'paren' && token.value === '(') {
            token = tokens[++current];

            let node = {
                type: 'CallExpression',
                name: token.value,
                params: []
            }

            token = tokens[++current];

            while (token.type !== 'paren' || (token.type === 'paren' && token.value !== ')')) {
                node.params.push(walk());
                token = tokens[current]
            }

            ++current;

            return node;
        }
    }

    // An Abstract Syntax Tree
    let ast = {
        type: 'Program',
        body: []
    }

    while (current < tokens.length) {

        ast.body.push(walk());
    }

    return ast;
}

// TRAVERSER
function traverser(ast, visitor) {

    function traverseArray(array, parent) {
        array.forEach(child => {
            traverseNode(child, parent);
        });
    }

    function traverseNode(node, parent) {
        let methods = visitor[node.type];

        if (methods && methods.enter) {
            methods.enter(node, parent);
        }

        switch (node.type) {
            case 'Program':
                traverseArray(node.body, node);
                break;
            case 'CallExpression':
                traverseArray(node.params, node);
                break;
            case 'NumberLiteral':
            case 'StringLiteral':
                break;
            default:
                throw new TypeError(node.type);
        }

        if (methods && methods.exit) {
            methods.exit(node, parent);
        }
    }

    traverseNode(ast, null);
}

// TRANSFORMER
function transformer(ast) {

    let newAst = {
        type: 'Program',
        body: [],
    };

    ast._context = newAst.body;

    traverser(ast, {

        NumberLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'NumberLiteral',
                    value: node.value,
                });
            },
        },

        StringLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'StringLiteral',
                    value: node.value,
                });
            },
        },

        CallExpression: {
            enter(node, parent) {
                let expression = {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: node.name,
                    },
                    arguments: [],
                };

                node._context = expression.arguments;

                if (parent.type !== 'CallExpression') {
                    expression = {
                        type: 'ExpressionStatement',
                        expression: expression,
                    };
                }

                parent._context.push(expression);
            }
        }
    });

    return newAst;
}

// CODE GENERATOR
function codeGenerator(node) {
    switch (node.type) {
        case 'Program':
            return node.body.map(codeGenerator)
                .join('\n');
        case 'ExpressionStatement':
            return codeGenerator(node.expression) + ';';
        case 'CallExpression':
            return (
                codeGenerator(node.callee) + '(' + node.arguments.map(codeGenerator).join(', ') + ')'
            );
        case 'Identifier':
            return node.name;
        case 'NumberLiteral':
            return node.value;
        case 'StringLiteral':
            return '"' + node.value + '"';
        default:
            throw new TypeError(node.type);
    }
}

let tokens = tokenizer('(add 2 (subtract 4 2))');
let ast = parser(tokens);
let newAST = transformer(ast);
let output = codeGenerator(newAST);

log(red, '(add 2 (subtract 4 2))');

log(blue, tokens);

log(green, ast);

log(cyan, newAST);

log(yellow, output)