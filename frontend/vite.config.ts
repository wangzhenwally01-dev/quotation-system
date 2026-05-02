import { defineConfig, Plugin } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

// Plugin to rewrite /h5/quotation to /pages/h5/quotation
function h5QuotationRewrite(): Plugin {
  return {
    name: 'h5-quotation-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/h5/quotation')) {
          req.url = req.url.replace('/h5/quotation', '/pages/h5/quotation');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [uni(), h5QuotationRewrite()],
  base: process.env.NODE_ENV === 'production' ? '/quotation-system/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
