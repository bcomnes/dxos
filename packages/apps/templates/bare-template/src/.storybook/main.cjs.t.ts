import { text, defineTemplate } from '@dxos/plate';
import config from '../config.t';

export default defineTemplate(
  ({ input }) => {
    const { storybook } = input;
    return !storybook
      ? null
      : text`
      const { mergeConfig } = require('vite');
      const { resolve } = require('path');
      
      const { ConfigPlugin } = require('@dxos/config/vite-plugin');
      const { ThemePlugin } = require('@dxos/react-components/plugin');
      
      module.exports = {
        stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
        addons: [
          '@storybook/addon-links',
          '@storybook/addon-essentials',
          '@storybook/addon-interactions',
          'storybook-dark-mode'
        ],
        framework: '@storybook/react',
        core: {
          builder: '@storybook/builder-vite'
        },
        features: {
          storyStoreV7: true,
          previewMdx2: true
        },
        viteFinal: async (config) =>
          mergeConfig(config, {
            optimizeDeps: {
              force: true,
              include: [
                '@dxos/client',
                '@dxos/config',
                '@dxos/react-appkit',
                '@dxos/react-client',
                '@dxos/react-composer',
                '@dxos/react-components',
                '@dxos/text-model',
                '@dxos/util',
                'storybook-dark-mode'
              ]
            },
            build: {
              commonjsOptions: {
                include: [/packages/, /node_modules/]
              }
            },
            plugins: [
              ConfigPlugin(),
              ThemePlugin({
                content: [
                  resolve(__dirname, '../src/**/*.{js,ts,jsx,tsx}'),
                  resolve(__dirname, '../node_modules/@dxos/react-components/dist/**/*.js'),
                  resolve(__dirname, '../node_modules/@dxos/react-appkit/dist/**/*.js')
                ]
              })
            ]
          })
      };
  `;
  },
  { config }
);