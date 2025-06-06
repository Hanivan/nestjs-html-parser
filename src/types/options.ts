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
  /**
   * Reject unauthorized SSL certificates (default: true)
   * Set to false to accept self-signed or invalid SSL certificates
   */
  rejectUnauthorized?: boolean;
  /**
   * Skip SSL certificate verification entirely
   * Use with caution - only for testing or known safe domains
   */
  ignoreSSLErrors?: boolean;
  /**
   * Disable server name indication (SNI) validation for SSL connections
   * Useful for sites with hostname mismatches or problematic SSL configurations
   * When true, bypasses server identity checks independent of other SSL settings
   * @important MITM attacks can still be possible
   */
  disableServerIdentityCheck?: boolean;
  /**
   * Maximum number of redirects to follow (default: 5)
   */
  maxRedirects?: number;
  /**
   * Enable automatic retry on specific error types
   */
  retryOnErrors?: {
    /**
     * Retry on SSL/TLS errors
     */
    ssl?: boolean;
    /**
     * Retry on connection timeout
     */
    timeout?: boolean;
    /**
     * Retry on DNS resolution errors
     */
    dns?: boolean;
    /**
     * Retry on connection refused errors
     */
    connectionRefused?: boolean;
  };
}
