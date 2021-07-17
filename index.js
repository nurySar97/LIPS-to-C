'use strict';
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

/**
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

// Tokenizer
function tokenizer(input) {
    let current = 0;
    let tokens = [];

    while (current < input.length) {
        let char = input[current];
        if (char === "(" || char === ")") {
            tokens.push({
                type: 'paren',
                value: char
            });
            ++current;
            continue
        }

        let WS = /\s/i;

        if (WS.test(char)) {
            ++current;
            continue;
        }

        let NUMBER = /[0-9]/i;
        if (NUMBER.test(char)) {
            tokens.push({
                type: 'number',
                value: char
            })
            ++current;
            continue
        }
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
    let AST = {
        type: 'Program',
        body: []
    }
    while (current < tokens.length) {
        AST.body.push(walk());
    }
    return AST;
}

console.log(parser(tokenizer('(add 2 (subtract 4 2))')));