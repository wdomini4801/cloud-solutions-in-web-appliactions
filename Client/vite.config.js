import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  
  const serverIp = `${env.VITE_SERVER_IP}`;
  const port = `${env.VITE_SERVER_PORT}`;
  
  return {
      server: {
        proxy: {
          '/api': {
            target: `https://${serverIp}:${port}`,
            ws: true,
            changeOrigin: true,
            secure: false,
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.error('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.error('Sending Request to the Target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.error('Received Response from the Target:', proxyRes.statusCode, req.url);
              });
            },
          },
        },
      },
      plugins: [react()],
  };
});
