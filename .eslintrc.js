module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "commonjs": true,
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
      },
    ],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "space-before-function-paren": ["error", "never"],
    "comma-dangle": ["error", "always-multiline"],
    "no-console": "off",
    "no-fallthrough": "off",
  },
};
