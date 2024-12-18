import { defineConfig } from 'vite';
import { resolve } from 'path'

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: './main.js',
      name: 'GalaxyJS',
      // the proper extensions will be added
      fileName: 'galaxy',
    },
    rollupOptions: {
      // input: {
      //   main: resolve(__dirname, 'index.html'),
      // },
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        '/site'
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
  },
});
