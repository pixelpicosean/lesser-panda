module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "commonjs": true,
  },
  "parserOptions": {
    "sourceType": "module",
  },
  "globals": {
    "ga": true,
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent": [
      "error",
      2,
      {
        "MemberExpression": 1,
        "outerIIFEBody": 0,
        "SwitchCase": 1,
      },
    ],
    "linebreak-style": ["error", "unix"],

    "quotes": ["error", "single"],

    "semi": ["error", "always"],
    "semi-spacing": ["error"],
    "space-before-function-paren": ["error", "never"],
    "space-infix-ops": ["error", { "int32Hint": false }],
    "keyword-spacing": ["error", { "after": true }],
    "spaced-comment": ["error", "always"],
    "no-irregular-whitespace": ["error"],
    "no-multi-spaces": ["error", { exceptions: { "Property": false } }],
    "no-trailing-spaces": ["error"],
    "no-whitespace-before-property": ["error"],
    "space-before-blocks": ["error", "always"],
    "space-in-parens": ["error", "never"],

    "curly": ["error", "all"],
    "object-curly-spacing": ["error", "always"],
    "brace-style": ["error", "stroustrup", { "allowSingleLine": true }],

    "comma-dangle": ["error", "always-multiline"],
    "no-console": "off",
    "no-fallthrough": "off",
  },
};
