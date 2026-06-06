export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['dist/**/*', 'coverage/**/*', 'private/**/*'],
  rules: {
    'import-notation': null,
    'value-keyword-case': [
      'lower',
      {
        ignoreKeywords: ['optimizeLegibility'],
      },
    ],
  },
};
