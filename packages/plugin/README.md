# eslint-plugin-functional-core

TBC

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

| Name                           | Description | 💼  | ⚠️  |
| :----------------------------- | :---------- | :-- | :-- |
| [purity](docs/rules/purity.md) | TBC         | 🔒  | ✅  |

<!-- end auto-generated rules list -->
