import type { Preview } from '@storybook/react-vite'
import React from 'react'
import { mockIPC } from '@tauri-apps/api/mocks'
import '../src/index.css'

// Mock Tauri IPC for Storybook (runs in browser, not Tauri webview)
mockIPC((cmd, args) => {
  // Return mock data for each command
  switch (cmd) {
    case 'list_images':
      return [];
    case 'get_thumbnail':
      return 'https://picsum.photos/300/200';
    case 'get_image_data_url':
      return 'https://picsum.photos/1920/1080';
    case 'list_projects':
      return [];
    case 'get_app_data_dir':
      return '/mock/app/data';
    case 'create_project':
      return { id: 'mock-id', name: args?.name || 'Mock Project', created_at: new Date().toISOString(), folders: [] };
    case 'get_project':
      return { id: 'mock-id', name: 'Mock Project', created_at: new Date().toISOString(), folders: [] };
    case 'get_project_stats':
      return { total_keep: 0, total_maybe: 0, folder_stats: [] };
    case 'get_folder_stats':
      return { folder_id: 'mock', folder_name: 'Mock', source_count: 0, keep_count: 0, maybe_count: 0 };
    default:
      console.log(`[Storybook] Unhandled Tauri command: ${cmd}`, args);
      return null;
  }
});

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