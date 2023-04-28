// required modules
const readline = require("readline");
// 

const operatorlist = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '^': (a, b) => a ** b,
    '%': (a, b) => a % b,
}

const precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3,
    '%': 2,
    '(': 0,
    ')': 0,
}

const infixToPostfix = (infix) => {
    let postfix = []
    let stack = []
    infix.forEach((token) => {
        if (token in operatorlist) {
            while (stack.length && precedence[stack[stack.length - 1]] >= precedence[token]) {
                postfix.push(stack.pop())
            }
            stack.push(token)
        } else if (token === '(') {
            stack.push(token)
        } else if (token === ')') {
            while (stack.length && stack[stack.length - 1] !== '(') {
                postfix.push(stack.pop())
            }
            stack.pop()
        } else {
            postfix.push(token)
        }
    })
    while (stack.length) {
        postfix.push(stack.pop())
    }
    return postfix
}

const evaluatePostfix = (postfix) => {
    let stack = []
    postfix.forEach((token) => {
        if (token in operatorlist) {
            let b = stack.pop()
            let a = stack.pop()
            stack.push(operatorlist[token](a, b))
        } else {
            stack.push(token)
        }
    })
    return stack.pop()
}

const evaluateInfix = (infix) => {
    return evaluatePostfix(infixToPostfix(infix))
}

function Calculate(string) {
    let infix = string.split(/([+\-*/^%()])/).filter((token) => token.trim() !== '')
    infix.forEach((token, index) => {
        if (token.match(/^[0-9.]+$/)) {
            infix[index] = parseFloat(token)
        }
    })
    return evaluateInfix(infix)
}

export { Calculate };