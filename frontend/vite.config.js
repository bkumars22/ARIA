import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 3001,
      proxy: {
        '/api': {
          target: 'http://localhost:8089',
          changeOrigin: true,
          rewrite: p => p.replace(/^\/api/, '/aria/api')
        }
      }
    },
    define: {
      'process.env.REACT_APP_DEMO_MODE': JSON.stringify(env.REACT_APP_DEMO_MODE || 'false'),
      'process.env.REACT_APP_API_URL':   JSON.stringify(env.REACT_APP_API_URL   || 'http://localhost:8089/aria'),
    }
  };
});
