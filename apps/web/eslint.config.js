import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
export default ts.config(
    { ignores: ['resources/js/actions/**', 'resources/js/routes/**', 'resources/js/wayfinder/**', 'resources/js/components/ui/**'] },
    js.configs.recommended, ...ts.configs.recommended, ...vue.configs['flat/essential'],
    { files: ['**/*.vue'], extends: [...ts.configs.recommended], languageOptions: { parser: vueParser, parserOptions: { parser: ts.parser }, globals: { navigator: 'readonly', Event: 'readonly' } } },
);
