# eslint-plugin-functional-core

A plugin to help enforce functional principles and increase the "functional core" of your code base.

## Motivation

The driving motivation behind this ESLint plugin is the concept of "Functional Core, Imperative Shell" where:

- **Functional Core** is the central part of your application where core logic resides. It should be as functionally pure as possible and its dependencies should also be functionally pure.
- **Imperative Shell** is the outer layer containing impure code, interacting with the outer world e.g. external systems, user inputs, libraries.

By embracing functional principles in your Functional Core, you'll achieve:

1. **Easier-to-reason-about code**: Deterministic and side effect-free logic.
2. **Improved testability**: Simplified unit tests due to functional purity.
3. **Increased reliability**: Greater predictability in code execution and bugs are easier to reproduce for a known input.

The Imperative Shell on the other hand is where you'll find the "messy" code, where you'll have to deal with side effects, impure functions, and interfacing with other "imperative" code. This will be the likely source of bugs and is harder to test and maintain.

Although the Imperative Shell may introduce challenges, it plays a crucial role in actually delivering value to the external world, where the Functional Core does not affect anything by design.

The goal is to minimize the Imperative Shell while maximizing the Functional Core for an optimal balance between reliability, maintainability, and practical application and this plugin aims to help you achieve that.

Read more about this idea here:

- https://github.com/kbilsted/Functional-core-imperative-shell/blob/master/README.md
- https://medium.com/@magnusjt/functional-core-imperative-shell-in-javascript-29bef2353ac2

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-functional-core`:

```sh
npm install eslint-plugin-functional-core --save-dev
```

## Usage

Add `functional-core` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["functional-core"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "functional-core/purity": "error"
  }
}
```

## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
⚠️ Configurations set to warn in.\
✅ Set in the `recommended` configuration.\
🔒 Set in the `strict` configuration.

| Name                           | Description                                                                                               | 💼 | ⚠️ |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------- | :- | :- |
| [purity](docs/rules/purity.md) | This rule warns about aspects of code that may be impure, and offers options to adjust how strict this is | 🔒 | ✅  |

<!-- end auto-generated rules list -->

## Contributing

Contributions are welcome!

This plugin is still in development so any cases of impure code not yet covered by this plugin are welcome to accommodate different styles.
