import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    ViteImageOptimizer({
      /* Default options for image optimization */
      jpg: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      png: {
        quality: 80,
      },
      webp: {
        lossless: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        booking: resolve(__dirname, 'booking.html'),
        techrider: resolve(__dirname, 'techrider.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('gsap')) {
              return 'vendor-gsap';
            }
            if (id.includes('three')) {
              return 'vendor-three';
            }
            if (id.includes('wavesurfer.js')) {
              return 'vendor-wavesurfer';
            }
            return 'vendor'; // all other dependencies
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Slightly increase limit to avoid noise while we split chunks
  },
});
