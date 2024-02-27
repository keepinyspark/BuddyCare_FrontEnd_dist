const path = require('path');
const rootPath = path.resolve(__dirname, '../src');

module.exports = {
	stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: ['@storybook/addon-links', '@storybook/addon-essentials', 'storybook-addon-designs', '@storybook/preset-scss'],
	webpackFinal: async (config, { configType }) => {
		config.module.rules.push({
			test: /\.scss$/,
			use: [
				'style-loader',
				'css-loader',
				{
					loader: 'sass-loader',
					options: {
						additionalData: `
                  @import "src/scss/variables.scss";
                  @import "src/scss/mixin.scss";
                  @import "src/scss/common.scss";
                `,
					},
				},
			],
			include: path.resolve(__dirname, '../'),
		});

		config.resolve.modules = [...(config.resolve.modules || []), path.resolve(__dirname, '../src')];

		config.resolve.alias['@'] = rootPath;
		config.resolve.alias['~'] = rootPath;

		return config;
	},
	framework: '@storybook/vue',
};
