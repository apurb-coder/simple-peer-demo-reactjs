

---

# Vite Configuration for Simple-Peer with Node Polyfills

This guide explains how to set up the required modules and configuration for using Simple-Peer with Vite, including necessary polyfills for Node.js modules.

## Installation

First, install the required dependencies:

```bash
yarn add -D vite-compatible-readable-stream
yarn add -D events
yarn add -D process
yarn add -D global
yarn add rollup-plugin-polyfill-node
```

## Setup Polyfills

You need to ensure global objects like `process` are available in your environment. To do this, import the necessary modules at the start of the file where you use Simple-Peer.

### Import Polyfills Directly

At the top of your file (before importing `simple-peer`), add the following imports:

```js
import global from 'global';
import * as process from 'process';
global.process = process;
```

### Alternative: Use an External Fix File

Alternatively, you can create a `fix.js` file with the same content and import it where needed:

```js
// fix.js
import global from 'global';
import * as process from 'process';
global.process = process;
```

Then, in your main file:

```js
import './fix.js';
```

## Update `vite.config.js`

Update your Vite configuration to include the necessary polyfills for Node.js modules.

```js
// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'rollup-plugin-polyfill-node';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Automatically polyfill core Node.js modules like `process` and `Buffer`
    nodePolyfills(),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'readable-stream': 'vite-compatible-readable-stream',
    },
  },
});
```

This configuration solves the `stream is undefined` error by ensuring proper polyfills for Node.js core modules.

---

By following these steps, you'll ensure the necessary environment for using Simple-Peer with Vite, avoiding common errors such as `stream is undefined`.