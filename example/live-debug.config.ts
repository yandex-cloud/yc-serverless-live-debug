import { defineConfig } from '../src/local-client';
import { handler } from './src/handler';

export default defineConfig({
  watch: 'src',
  handler,
});
