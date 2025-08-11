export default {
	extends: ['stylelint-config-standard'],
	customSyntax: 'postcss-html',
	rules: {
		'block-no-empty': null,
		'declaration-empty-line-before': null,
		'rule-empty-line-before': null,
		'color-function-notation': null,
		'alpha-value-notation': null,
		'value-keyword-case': null,
		'property-no-vendor-prefix': null,
		'color-hex-length': null
	},
	overrides: [
		{
			files: ['*.css'],
			customSyntax: null
		}
	]
}
