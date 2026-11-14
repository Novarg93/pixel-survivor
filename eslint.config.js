import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
export default ts.config({ ignores: ['apps/web/**', '.tmp/**', 'node_modules/**', 'dist/**', '.npm-cache/**', '.browsers/**', 'test-results/**', 'playwright-report/**'] }, js.configs.recommended, ...ts.configs.recommended, ...vue.configs['flat/essential'], { files: ['**/*.vue'], extends: [...ts.configs.recommended], languageOptions: { parser: vueParser, parserOptions: { parser: ts.parser } } }, { files: ['**/*.ts'], rules: { '@typescript-eslint/no-explicit-any': 'error' } }, {
  // Standalone art viewers and Node/Playwright export scripts use both environments.
  files:['art/generated/mage-phantom-cast-*/**/*.{js,mjs}'],
  languageOptions:{globals:Object.fromEntries(['URL','process','Buffer','console','fetch','FormData','Blob','window','document','HTMLImageElement','performance','requestAnimationFrame','cancelAnimationFrame','innerWidth','innerHeight','ImageDecoder','Image','AbortController','setTimeout','clearTimeout','addEventListener','structuredClone'].map(name=>[name,'readonly']))}
});
