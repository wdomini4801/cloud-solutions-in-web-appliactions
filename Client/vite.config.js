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
            changeOrigin: true,
            secure: false,
          },
          '/socket.io': {
            target: `https://${serverIp}:${port}`,
            ws: true,
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
  };
});
