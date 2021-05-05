const rules = {
  'no-unused-vars': 'warn',
  'no-explicit-any': 'off',
  'no-empty-function': 'off',
  'prefer-rest-params': 'off',
  'arrow-body-style': 'off',
  'prefer-arrow-callback': 'off',
  'prettier/prettier': 'warn',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/ban-types': 'off',
  '@typescript-eslint/no-empty-function': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
}
module.exports = {
  parser: '@babel/eslint-parser',
  plugins: ['prettier'],
  extends: ['plugin:prettier/recommended'],
  rules,
  settings: {},
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'prettier'],
      extends: [
        'plugin:prettier/recommended',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules,
    },
  ],
}
