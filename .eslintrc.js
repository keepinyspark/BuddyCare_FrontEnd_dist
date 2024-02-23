module.exports = {
	root: true,
	env: {
		node: true,
	},
	plugins: ['@typescript-eslint', 'prettier'],
	extends: ['plugin:vue/vue3-essential', 'plugin:@typescript-eslint/recommended', 'prettier', 'plugin:storybook/recommended'],
	parser: 'vue-eslint-parser',
	parserOptions: {
		ecmaVersion: 2020,
		parser: '@typescript-eslint/parser',
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	rules: {
		'prettier/prettier': [
			'error',
			{
				singleQuote: true,
				semi: true,
				useTabs: true,
				tabWidth: 2,
				trailingComma: 'all',
				printWidth: 150,
				bracketSpacing: true,
				bracketSameLine: true,
				jsxBracketSameLine: true,
				arrowParens: 'avoid',
			},
		],
		'vue/multi-word-component-names': [
			'error',
			{
				ignores: ['Home', 'Login', 'Terms', 'Join'],
			},
		],
	},
	overrides: [
		{
			files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
			env: {
				jest: true,
			},
		},
	],
};
