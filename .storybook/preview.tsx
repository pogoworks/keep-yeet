import type { Preview } from '@storybook/react-vite'
import React from 'react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#141414' },
        { name: 'light', value: '#fbfbfb' },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      // Apply dark class based on background selection
      const isDark = context.globals.backgrounds?.value !== '#fbfbfb';
      return (
        <div className={`font-sans p-4 ${isDark ? 'dark' : ''}`}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;