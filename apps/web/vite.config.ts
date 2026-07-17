import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Catalog SVGs must stay as individual on-demand assets — never inlined
    // as data URIs in the bundle.
    assetsInlineLimit: 0,
  },
});
