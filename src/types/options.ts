import { ProxyConfig } from './proxy';

export interface HtmlParserOptions {
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
  /**
   * Headers to send with the request
   */
  headers?: Record<string, string>;
  /**
   * User agent string to use for the request
   */
  userAgent?: string;
  /**
   * Whether to use a random user agent instead of the specified one
   */
  useRandomUserAgent?: boolean;
  /**
   * Proxy configuration for the request
   */
  proxy?: ProxyConfig;
  /**
   * Number of retry attempts on failure
   */
  retries?: number;
  /**
   * Delay in milliseconds between retry attempts
   */
  retryDelay?: number;
  /**
   * Enable verbose logging for debugging
   */
  verbose?: boolean;
}
