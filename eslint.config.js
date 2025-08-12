import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueEslintParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				defineProps: 'readonly',
				defineEmits: 'readonly',
				defineExpose: 'readonly',
				defineSlots: 'readonly',
				defineModel: 'readonly',
				defineOptions: 'readonly',
				withDefaults: 'readonly'
			}
		}
	},
	{
		files: ['**/*.{ts,tsx,vue}'],
		ignores: [
			'**/dist/**',
			'**/node_modules/**',
			'**/coverage/**',
			'*.min.js',
			'**/public/**',
			'**/.nuxt/**',
			'**/.output/**'
		],
		rules: {
			...js.configs.recommended.rules,
			...pluginVue.configs['vue3-recommended'].rules,
			...tsPlugin.configs.recommended.rules,
			...prettier.rules,

			// TypeScript 严格规则
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					'argsIgnorePattern': '^_',
					'varsIgnorePattern': '^_'
				}
			],
			'@typescript-eslint/explicit-function-return-type': 'warn',
			// ...tsPlugin.configs.recommended.rules 会导入禁止any,先关闭禁止any
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
			'@typescript-eslint/no-inferrable-types': 'error',
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',
			'@typescript-eslint/prefer-as-const': 'error',

			// Vue 3 最佳实践
			'vue/component-name-in-template-casing': ['error', 'PascalCase'],
			'vue/prop-name-casing': ['error', 'camelCase'],
			'vue/no-unused-vars': 'error',
			'vue/require-default-prop': 'warn',
			'vue/multi-word-component-names': 'error',
			'vue/no-v-html': 'warn',
			'vue/attributes-order': 'warn',
			'vue/order-in-components': 'warn',
			'vue/component-definition-name-casing': ['error', 'PascalCase'],
			'vue/custom-event-name-casing': ['error', 'camelCase'],
			'vue/define-macros-order': [
				'error',
				{
					'order': ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']
				}
			],
			'vue/no-dupe-keys': 'error',
			'vue/no-duplicate-attributes': 'error',
			'vue/no-mutating-props': 'error',
			'vue/no-unused-components': 'warn',
			'vue/require-v-for-key': 'error',
			'vue/return-in-computed-property': 'error',
			'vue/no-side-effects-in-computed-properties': 'error',
			'vue/no-template-key': 'error',
			'vue/no-textarea-mustache': 'error',
			'vue/valid-template-root': 'error',
			'vue/html-self-closing': [
				'error',
				{
					'html': {
						'void': 'always',
						'normal': 'always',
						'component': 'always'
					},
					'svg': 'always',
					'math': 'always'
				}
			],

			// 代码质量规则
			// 'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
			'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
			'eqeqeq': ['error', 'always'],
			'curly': ['error', 'all'],
			'no-var': 'error',
			'prefer-const': 'error',
			'no-unused-expressions': 'error',
			'no-duplicate-imports': 'error',
			'no-return-assign': 'error',
			'no-sequences': 'error',
			'no-throw-literal': 'error',
			'no-unmodified-loop-condition': 'error',
			'no-useless-call': 'error',
			'no-useless-concat': 'error',
			'prefer-template': 'error',
			'prefer-spread': 'error',
			'prefer-rest-params': 'error',
			'object-shorthand': 'error',
			'arrow-body-style': ['error', 'as-needed'],
			'prefer-arrow-callback': 'error',

			// 安全规则
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-script-url': 'error',
			'no-new-func': 'error',
			'no-caller': 'error',
			'no-extend-native': 'error',
			'no-global-assign': 'error',
			'no-proto': 'error',

			// 导入排序
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error'
		},
		languageOptions: {
			parser: vueEslintParser,
			parserOptions: {
				extraFileExtensions: ['.vue'],
				parser: tsParser,
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: [
					'./packages/*/tsconfig.json',
					'./packages/*/tsconfig.node.json',
					'./packages/*/tsconfig.lib.json'
				]
			}
		},
		plugins: {
			vue: pluginVue,
			'@typescript-eslint': tsPlugin,
			'simple-import-sort': simpleImportSort
		}
	},
	// 测试文件特定规则
	{
		files: ['**/*.test.{ts,tsx,vue}', '**/*.spec.{ts,tsx,vue}', '**/tests/**/*.{ts,tsx,vue}'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'vue/require-default-prop': 'off',
			'no-console': 'off'
		}
	},
	// 配置文件特定规则
	{
		files: ['**/*.config.{ts,js}', '**/vite.config.{ts,js}', '**/nuxt.config.{ts,js}'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'off',
			'no-console': 'off'
		}
	},
	// Node.js 文件特定规则
	{
		files: ['**/server/**/*.{ts,js}', '**/scripts/**/*.{ts,js}'],
		languageOptions: {
			globals: {
				...globals.node
			}
		},
		rules: {
			'no-console': 'warn',
			'@typescript-eslint/no-var-requires': 'off'
		}
	}
]
