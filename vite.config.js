import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: { dedupe: ['@huggingface/transformers'] },
  optimizeDeps: { include: ['@huggingface/transformers', 'kokoro-js'] },
  esbuild: { jsx: 'automatic' },
  server: { host: '0.0.0.0', port: 4173, strictPort: true, watch: { ignored: ['**/.cache/**', '**/node_modules/**'] } },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  build: { sourcemap: true },
});
