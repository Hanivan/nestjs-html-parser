import { ProxyConfig } from './proxy';

export interface HtmlParserOptions {
  timeout?: number;
  headers?: Record<string, string>;
  userAgent?: string;
  useRandomUserAgent?: boolean;
  proxy?: ProxyConfig;
  retries?: number;
  retryDelay?: number;
}
