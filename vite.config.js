import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { copyFileSync, cpSync, mkdirSync } from 'node:fs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const outputRoot = fileURLToPath(new URL('./dist/', import.meta.url));

function copyLegacyRuntime() {
  return {
    name: 'copy-legacy-runtime',
    closeBundle() {
      mkdirSync(outputRoot, { recursive: true });
      [
        'default-config.js',
        'theme-presets.js',
        'config-validator.js',
        'app.js',
        'settings.js',
      ].forEach((file) =>
        copyFileSync(`${projectRoot}${file}`, `${outputRoot}${file}`)
      );
      cpSync(`${projectRoot}assets`, `${outputRoot}assets`, {
        recursive: true,
      });
      cpSync(`${projectRoot}docs`, `${outputRoot}docs`, { recursive: true });
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/hbd-mymorning/' : '/',
  plugins: [copyLegacyRuntime()],
  build: {
    rollupOptions: {
      input: {
        experience: fileURLToPath(new URL('./index.html', import.meta.url)),
        settings: fileURLToPath(new URL('./settings.html', import.meta.url)),
        auth: fileURLToPath(new URL('./auth.html', import.meta.url)),
        dashboard: fileURLToPath(new URL('./dashboard.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
    },
  },
}));
