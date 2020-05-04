module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  extends: [
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from @typescript-eslint/eslint-plugin
    "../.eslintrc"
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true // Allows for the parsing of JSX
    }
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off", // Reduce the use of 'any'
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-var-requires": "off",
    "react/prop-types": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/member-delimiter-style": "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/explicit-member-accessibility": "off"
  },
  settings: {
    react: {
      version: "detect",
    }
  }
};
