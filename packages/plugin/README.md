[![npm version](https://img.shields.io/npm/v/eslint-plugin-functional-core.svg)](https://www.npmjs.com/package/eslint-plugin-functional-core)

# eslint-plugin-functional-core

A plugin to help enforce functional principles and increase the "functional core" of your code base.

## Motivation

The driving motivation behind this ESLint plugin is the concept of "Functional Core, Imperative Shell" where:

- **Functional Core** is the central part of your application where core logic resides. It should be as functionally pure as possible and its dependencies should also be functionally pure.
- **Imperative Shell** is the outer layer containing impure code, interacting with the outer world e.g. external systems, user inputs, libraries.

By embracing functional principles in your Functional Core, you'll achieve:

1. **Easier-to-reason-about code**: Deterministic and side effect-free logic.
2. **Improved testability**: Simplified unit tests with minimal mocking due to functional purity.
3. **Increased reliability**: Greater predictability in code execution and bugs are easier to reproduce for a known input.

The Imperative Shell on the other hand is where you'll find the "messy" code, where you'll have to deal with side effects, impure functions, and interfacing with other "imperative" code. This will be the likely source of bugs as it is harder to test (usually requiring complicated integration tests) and maintain.

Although the Imperative Shell may introduce challenges, it plays a crucial role in actually delivering value to the external world, where the Functional Core does not affect anything by design.

The goal is to minimize the Imperative Shell while maximizing the Functional Core for an optimal balance between reliability, maintainability, and practical application and this plugin aims to help you achieve that.

Benefits of doing this well are:

- A smaller surface area to focus on when debugging complex mutation related bugs
- A smaller surface area to consider when making changes to exposed functionality
- Having many fast unit tests (for a large Functional Core) and few slow integration tests (for a small Imperative Shell)

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

Either add a config to the `extends` section of your `.eslintrc` configuration file, e.g. to add the recommended config do:

```json
{
  "extends": ["plugin:functional-core/recommended"]
}
```

Or you can manually configure the rules you want to use under the rules section. **NOTE** Rule options are loose/relaxed by default so you need to explicitly change them if you want to be more strict.
See [Rules](#rules) below for a list of available rules and options.

Example:

```json
{
  "rules": {
    "functional-core/purity": ["error", { "allowThrow": false }]
  }
}
```

## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
⚠️ Configurations set to warn in.\
✅ Set in the `recommended` configuration.\
🔒 Set in the `strict` configuration.

| Name                                                                                                                | Description                                                                                               | 💼  | ⚠️  |
| :------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------- | :-- | :-- |
| [purity](https://github.com/eliasm307/eslint-plugin-functional-core/blob/main/packages/plugin/docs/rules/purity.md) | This rule warns about aspects of code that may be impure, and offers options to adjust how strict this is | 🔒  | ✅  |

<!-- end auto-generated rules list -->

## Settings

Settings can be configured in your `.eslintrc` file under the `functional-core` key.

### purePaths

This setting allows you to specify an array of RegEx patterns to match file/module/dependency paths that are considered "pure" and will trigger rules to check for impure code. The same patterns are used to determine if imports in a pure file are also pure.

By default any file or folder with the ".pure" suffix is considered pure (e.g. `src/utils.pure/` or `src/utils/common.pure.ts`), regardless of the custom configuration, so you can use this to mark files as pure without having to configure anything.

**Default:** `["\\.pure\\b"]`

#### Example

```json
{
  "settings": {
    "functional-core": {
      "purePaths": [".*"] // All files and imports are considered pure
    }
  }
}
```

## Contributing

Contributions are welcome!

This plugin is still in development so any examples of cases not being handled properly are welcome to accommodate different styles.
