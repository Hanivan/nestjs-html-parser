export * from './app.module';
export * from './examples';
export * from './html-parser.module';
export * from './html-parser.service';

// Explicit exports for better TypeScript support
export {
  ExtractionSchema,
  HtmlParserOptions,
  ProxyConfig,
} from './html-parser.service';
