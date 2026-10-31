import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
export default ts.config({ ignores: ['node_modules/**', 'dist/**', '.npm-cache/**', '.browsers/**', 'test-results/**', 'playwright-report/**'] }, js.configs.recommended, ...ts.configs.recommended, ...vue.configs['flat/essential'], { files: ['**/*.vue'], extends: [...ts.configs.recommended], languageOptions: { parser: vueParser, parserOptions: { parser: ts.parser } } }, { files: ['**/*.ts'], rules: { '@typescript-eslint/no-explicit-any': 'error' } });
