import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // eslint-plugin-react-hooks 7 : `configs['recommended-latest']` est la
      // config eslintrc, que ESLint 10 refuse (« plugins » y est un tableau de
      // chaînes). La variante plate vit sous `configs.flat`.
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Diagnostic du React Compiler, que ce projet n'utilise pas : la règle
      // signale les endroits où le compilateur ne saurait pas reprendre une
      // mémoïsation écrite à la main. Sans compilateur dans la chaîne de build,
      // elle n'a rien à dire sur la correction du code. À réactiver le jour où
      // le compilateur sera adopté.
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
])
