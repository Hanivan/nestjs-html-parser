import { Inject, Injectable, Logger, LogLevel } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { JSDOM } from 'jsdom';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HTML_PARSER_LOGGER_LEVEL } from './html-parser.config';
import {
  ExtractionOptions,
  ExtractionSchema,
  HtmlFetchResponse,
  HtmlParserOptions,
  PaginationPage,
  ProxyConfig,
} from './types';

/**
 * HTML Parser Service for NestJS
 *
 * A powerful service for parsing HTML content with support for:
 * - XPath and CSS selector extraction
 * - Proxy configuration with authentication
 * - Random user agent rotation
 * - Retry logic with configurable delays
 * - Verbose logging for debugging
 * - Rich response metadata including headers and status codes
 *
 * @example
 * ```typescript
 * const parser = new HtmlParserService();
 *
 * // Fetch HTML with options
 * const response = await parser.fetchHtml('https://example.com', {
 *   timeout: 10000,
 *   useRandomUserAgent: true,
 *   verbose: true
 * });
 *
 * // Extract data using XPath
 * const title = parser.extractSingle(response.data, '//title/text()');
 *
 * // Extract structured data
 * const articles = parser.extractStructuredList(response.data, '//article', {
 *   title: { selector: './/h2/text()', type: 'xpath' },
 *   link: { selector: './/a', type: 'xpath', attribute: 'href' }
 * });
 * ```
 */
@Injectable()
export class HtmlParserService {
  private readonly logger: Logger;
  private readonly loggerLevel: LogLevel | Array<LogLevel>;

  /**
   * Default configuration options for HTML parsing operations
   */
  private defaultOptions: HtmlParserOptions = {
    timeout: 10000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    useRandomUserAgent: false,
    retries: 3,
    retryDelay: 1000,
    verbose: false,
    rejectUnauthorized: true,
    ignoreSSLErrors: false,
    disableServerIdentityCheck: false,
    maxRedirects: 5,
    retryOnErrors: {
      ssl: false,
      timeout: true,
      dns: true,
      connectionRefused: true,
    },
  };

  /**
   * Initialize the HTML Parser Service
   */
  constructor(
    @Inject(HTML_PARSER_LOGGER_LEVEL)
    loggerLevel?: LogLevel | Array<LogLevel>,
  ) {
    this.logger = new Logger(HtmlParserService.name, { timestamp: true });
    this.loggerLevel = loggerLevel || ['log', 'error', 'debug'];
  }

  /**
   * Helper to check if a log level should be logged
   * Fixed to properly handle both single and array logger configurations
   */
  private shouldLog(level: string): boolean {
    // Define the logging level hierarchy
    const levelHierarchy: LogLevel[] = [
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    ];

    // Normalize the input level to LogLevel type
    const targetLevel = level as LogLevel;

    if (Array.isArray(this.loggerLevel)) {
      // If loggerLevel is an array, check if the target level is included
      return this.loggerLevel.includes(targetLevel);
    } else {
      // If loggerLevel is a single level, use hierarchy
      const currentIndex = levelHierarchy.indexOf(this.loggerLevel);
      const targetIndex = levelHierarchy.indexOf(targetLevel);

      // Return true if target level has higher or equal priority
      return (
        currentIndex !== -1 && targetIndex !== -1 && targetIndex <= currentIndex
      );
    }
  }

  /**
   * Helper method to log with proper level checking
   */
  private logWithLevel(
    level: LogLevel,
    message: string,
    ...optionalParams: any[]
  ): void {
    if (this.shouldLog(level)) {
      switch (level) {
        case 'error':
          this.logger.error(message, ...optionalParams);
          break;
        case 'warn':
          this.logger.warn(message, ...optionalParams);
          break;
        case 'log':
          this.logger.log(message, ...optionalParams);
          break;
        case 'debug':
          this.logger.debug(message, ...optionalParams);
          break;
        case 'verbose':
          this.logger.verbose(message, ...optionalParams);
          break;
        default:
          this.logger.log(message, ...optionalParams);
      }
    }
  }

  /**
   * Suppress console output when verbose is false
   */
  private suppressConsole(): void {
    // No longer needed as we're using NestJS Logger
  }

  /**
   * Restore console output
   */
  private restoreConsole(): void {
    // No longer needed as we're using NestJS Logger
  }

  /**
   * Fetch HTML content from a URL with comprehensive configuration options
   *
   * Supports proxy configuration, custom headers, user agent rotation,
   * retry logic, SSL error handling, and rich response metadata. Automatically handles
   * different proxy types (HTTP, HTTPS, SOCKS4, SOCKS5) and provides
   * detailed error information on failures.
   *
   * @param url - The URL to fetch HTML content from
   * @param options - Configuration options for the request
   * @param options.timeout - Request timeout in milliseconds (default: 10000)
   * @param options.headers - Custom headers to send with the request
   * @param options.userAgent - Custom user agent string
   * @param options.useRandomUserAgent - Use a random user agent instead of specified one
   * @param options.proxy - Proxy configuration for the request
   * @param options.retries - Number of retry attempts on failure (default: 3)
   * @param options.retryDelay - Delay between retries in milliseconds (default: 1000)
   * @param options.verbose - Enable verbose logging for debugging
   * @param options.rejectUnauthorized - Reject unauthorized SSL certificates (default: true)
   * @param options.ignoreSSLErrors - Skip SSL certificate verification entirely
   * @param options.disableServerIdentityCheck - Disable server name indication (SNI) validation
   * @param options.maxRedirects - Maximum number of redirects to follow (default: 5)
   * @param options.retryOnErrors - Configure retry behavior for specific error types
   *
   * @returns Promise resolving to HtmlFetchResponse with HTML content, headers, and status
   *
   * @throws Error when all retry attempts fail
   *
   * @example
   * ```typescript
   * // Basic usage
   * const response = await parser.fetchHtml('https://example.com');
   *
   * // Handle SSL errors for sites with invalid certificates
   * const response = await parser.fetchHtml('https://self-signed-site.com', {
   *   rejectUnauthorized: false,
   *   retryOnErrors: { ssl: true }
   * });
   *
   * // Ignore SSL completely (use with caution)
   * const response = await parser.fetchHtml('https://expired-cert-site.com', {
   *   ignoreSSLErrors: true
   * });
   *
   * // Disable only server identity validation (for hostname mismatches)
   * const response = await parser.fetchHtml('https://hostname-mismatch-site.com', {
   *   disableServerIdentityCheck: true
   * });
   *
   * // Robust configuration for unreliable sites
   * const response = await parser.fetchHtml('https://unreliable-site.com', {
   *   retries: 5,
   *   retryDelay: 2000,
   *   timeout: 15000,
   *   retryOnErrors: {
   *     ssl: true,
   *     timeout: true,
   *     dns: true,
   *     connectionRefused: true
   *   }
   * });
   * ```
   */
  async fetchHtml(
    url: string,
    options?: HtmlParserOptions,
  ): Promise<HtmlFetchResponse> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: Error | undefined;
    const maxRetries = config.retries ?? this.defaultOptions.retries ?? 3;
    const retryDelay =
      config.retryDelay ?? this.defaultOptions.retryDelay ?? 1000;

    if (config.verbose) {
      this.logWithLevel('debug', `🌐 Fetching URL: ${url}`);
      this.logWithLevel('debug', `🔧 Configuration:`, {
        timeout: config.timeout,
        retries: maxRetries,
        rejectUnauthorized: config.rejectUnauthorized,
        ignoreSSLErrors: config.ignoreSSLErrors,
        disableServerIdentityCheck: config.disableServerIdentityCheck,
        maxRedirects: config.maxRedirects,
      });
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (config.verbose && attempt > 0) {
          this.logWithLevel(
            'debug',
            `🔄 Retry attempt ${attempt}/${maxRetries}`,
          );
        }

        // Get user agent - either random or specified
        const userAgent = config.useRandomUserAgent
          ? await this.getRandomUserAgent()
          : config.userAgent;

        // Create axios config with SSL handling
        const axiosConfig: any = {
          timeout: config.timeout,
          maxRedirects: config.maxRedirects ?? 5,
          headers: {
            'User-Agent': userAgent,
            ...config.headers,
          },
          // SSL configuration - enhanced to handle modern SSL/TLS issues
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: config.ignoreSSLErrors
              ? false
              : (config.rejectUnauthorized ?? true),
            // Use more modern and compatible TLS settings when ignoring SSL errors
            secureProtocol: config.ignoreSSLErrors ? undefined : undefined,
            minVersion: config.ignoreSSLErrors ? 'TLSv1' : undefined,
            maxVersion: config.ignoreSSLErrors ? 'TLSv1.3' : undefined,
            // Add cipher support for legacy servers
            ciphers: config.ignoreSSLErrors
              ? 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA'
              : undefined,
            // Configure server name indication validation for problematic sites
            ...(config.disableServerIdentityCheck
              ? { checkServerIdentity: () => undefined }
              : {}), // When false or undefined, Node.js uses default tls.checkServerIdentity
          }),
        };

        // Add proxy configuration if provided
        if (config.proxy) {
          axiosConfig.httpAgent = this.createProxyAgent(config.proxy, false);
          axiosConfig.httpsAgent = this.createProxyAgent(config.proxy, true);
        }

        const response = await axios.get(url, axiosConfig);

        if (config.verbose) {
          this.logWithLevel(
            'debug',
            `✅ Successfully fetched ${url} (${response.status} ${response.statusText})`,
          );
        }

        return {
          data: response.data,
          headers: this.normalizeHeaders(response.headers),
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorInfo = this.categorizeError(lastError);

        if (this.shouldLog('error')) {
          this.logWithLevel(
            'error',
            `❌ Attempt ${attempt + 1} failed: ${errorInfo.type} - ${lastError.message}`,
          );
        }

        // Check if we should retry based on error type
        const shouldRetry = this.shouldRetryOnError(errorInfo, config);

        if (config.verbose) {
          this.logWithLevel(
            'debug',
            `🤔 Should retry: ${shouldRetry}, Attempts left: ${maxRetries - attempt}`,
          );
        }

        // If this is not the last attempt and we should retry this error type
        if (attempt < maxRetries && shouldRetry) {
          if (config.verbose) {
            this.logWithLevel(
              'debug',
              `⏳ Waiting ${retryDelay}ms before retry...`,
            );
          }
          await this.delay(retryDelay);
          continue;
        }

        // If we shouldn't retry this error type, break early
        if (!shouldRetry) {
          if (config.verbose) {
            this.logWithLevel(
              'debug',
              `🚫 Not retrying ${errorInfo.type} error`,
            );
          }
          break;
        }
      }
    }

    // Enhanced error message with categorized error info
    const errorInfo = lastError
      ? this.categorizeError(lastError)
      : { type: 'unknown', description: 'Unknown error' };
    throw new Error(
      `Failed to fetch HTML from ${url} after ${maxRetries + 1} attempts. ` +
        `Error type: ${errorInfo.type}. ${errorInfo.description}. ` +
        `Last error: ${lastError?.message || 'Unknown error'}`,
    );
  }

  /**
   * Create a proxy agent based on proxy configuration
   */
  private createProxyAgent(proxy: ProxyConfig, isHttps: boolean): any {
    if (!proxy.url || proxy.url.trim() === '') {
      throw new Error('Proxy URL cannot be empty');
    }

    let proxyUrl = proxy.url;

    try {
      const url = new URL(proxy.url);

      // If separate username/password are provided, they take precedence
      if (proxy.username && proxy.password) {
        url.username = proxy.username;
        url.password = proxy.password;
      }
      // If URL already contains credentials and no separate creds provided, keep them
      // (URL constructor automatically parses user:pass@host format)

      proxyUrl = url.toString();
    } catch (error) {
      // If URL parsing fails, try to construct a basic URL
      // This handles cases where the URL might be in a non-standard format
      if (proxy.username && proxy.password) {
        // Try to add credentials to potentially malformed URL
        const hasProtocol = proxy.url.includes('://');
        if (hasProtocol) {
          const [protocol, rest] = proxy.url.split('://');
          proxyUrl = `${protocol}://${proxy.username}:${proxy.password}@${rest}`;
        } else {
          // Assume http if no protocol specified
          proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.url}`;
        }
      }
    }

    // Determine proxy type from URL if not specified
    const proxyType = proxy.type || this.detectProxyType(proxy.url);

    switch (proxyType) {
      case 'socks4':
      case 'socks5':
        return new SocksProxyAgent(proxyUrl);
      case 'http':
      case 'https':
      default:
        return new HttpsProxyAgent(proxyUrl);
    }
  }

  /**
   * Detect proxy type from URL
   */
  private detectProxyType(url: string): string {
    const protocol = url.split('://')[0].toLowerCase();
    switch (protocol) {
      case 'socks4':
      case 'socks5':
        return protocol;
      case 'http':
      case 'https':
        return protocol;
      default:
        return 'http';
    }
  }

  /**
   * Delay function for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate a random user agent string
   *
   * Returns a realistic user agent string selected randomly from a pool
   * of current browser user agents. Useful for avoiding detection when
   * scraping websites that block requests with default user agents.
   * Falls back to a default user agent if the random generation fails.
   *
   * @returns Promise resolving to a random user agent string
   *
   * @example
   * ```typescript
   * // Get a random user agent
   * const userAgent = await parser.getRandomUserAgent();
   * console.log(userAgent);
   * // Result: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
   *
   * // Use with fetchHtml for better stealth
   * const response = await parser.fetchHtml('https://example.com', {
   *   useRandomUserAgent: true  // This uses getRandomUserAgent() internally
   * });
   *
   * // Or manually
   * const customUserAgent = await parser.getRandomUserAgent();
   * const response = await parser.fetchHtml('https://example.com', {
   *   userAgent: customUserAgent
   * });
   * ```
   */
  async getRandomUserAgent(): Promise<string> {
    try {
      const { randUA } = await import('@ahmedrangel/rand-user-agent');
      return randUA();
    } catch (error) {
      // Fallback to default user agent if dynamic import fails
      return (
        this.defaultOptions.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );
    }
  }

  /**
   * Test proxy connection and authentication
   *
   * Validates that a proxy configuration is working by attempting
   * to fetch a test URL through the proxy. Useful for verifying
   * proxy credentials and connectivity before using it for actual
   * HTML parsing operations.
   *
   * @param proxy - Proxy configuration to test
   * @param testUrl - URL to use for testing proxy connection (default: 'https://httpbin.org/ip')
   *
   * @returns Promise resolving to true if proxy works, false otherwise
   *
   * @example
   * ```typescript
   * const proxyConfig = {
   *   url: 'http://proxy.example.com:8080',
   *   username: 'user',
   *   password: 'pass'
   * };
   *
   * const isWorking = await parser.testProxy(proxyConfig);
   * if (isWorking) {
   *   console.log('Proxy is working!');
   * } else {
   *   console.log('Proxy failed or authentication invalid');
   * }
   *
   * // Test with custom URL
   * const isWorking = await parser.testProxy(proxyConfig, 'https://example.com');
   * ```
   */
  async testProxy(
    proxy: ProxyConfig,
    testUrl: string = 'https://httpbin.org/ip',
  ): Promise<boolean> {
    try {
      await this.fetchHtml(testUrl, {
        proxy,
        timeout: 5000,
        retries: 0,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract a single value from HTML using XPath or CSS selectors
   *
   * Extracts the first matching element's text content or attribute value.
   * Supports both XPath expressions (recommended) and CSS selectors.
   * Can extract specific attributes from elements or their text content.
   *
   * @param html - HTML content to parse
   * @param selector - XPath expression or CSS selector to locate the element
   * @param type - Type of selector: 'xpath' (default) or 'css'
   * @param attribute - HTML attribute to extract (optional, extracts text content if not specified)
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   *
   * @returns The extracted text/attribute value, or null if no match found
   *
   * @example
   * ```typescript
   * const html = '<div><h1 id="title">Welcome</h1><a href="/home">Home</a></div>';
   *
   * // Extract text content using XPath
   * const title = parser.extractSingle(html, '//h1[@id="title"]/text()');
   * // Result: "Welcome"
   *
   * // Extract attribute using XPath
   * const link = parser.extractSingle(html, '//a', 'xpath', 'href');
   * // Result: "/home"
   *
   * // Extract using CSS selector
   * const titleCSS = parser.extractSingle(html, 'h1#title', 'css');
   * // Result: "Welcome"
   *
   * // With type safety and transformation
   * const id = parser.extractSingle<number>(html, '//div/@data-id', 'xpath', undefined, {
   *   transform: (value: string) => parseInt(value)
   * });
   * // Result: number | null
   *
   * // With verbose logging
   * const result = parser.extractSingle(html, '//h1/text()', 'xpath', undefined, { verbose: true });
   * ```
   */
  extractSingle<T = string>(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    attribute?: string,
    options?: ExtractionOptions,
  ): T | null {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    if (verbose) {
      this.logWithLevel(
        'debug',
        `🔍 extractSingle - Selector: "${selector}", Type: ${type}, Attribute: ${attribute || 'none'}`,
      );
    }

    try {
      let result: string | null;

      if (type === 'xpath') {
        result = this.extractSingleXPath(html, selector, attribute, verbose);
      } else {
        result = this.extractSingleCSS(html, selector, attribute);
      }

      if (verbose) {
        this.logWithLevel(
          'debug',
          `✅ extractSingle result: ${result ? `"${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"` : 'null'}`,
        );
      }

      // Apply transformation if provided and result exists
      if (result !== null && options?.transform) {
        return this.applyTransform(result, options.transform, options.baseUrl);
      }

      // Return as T if no transform (assumes T extends string when no transform)
      return result as T | null;
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', '❌ Error in extractSingle:', error);
      }
      return null;
    }
  }

  /**
   * Extract multiple values from HTML using XPath or CSS selectors
   *
   * Extracts text content or attribute values from all matching elements.
   * Returns an array of strings containing all found values. Supports
   * both XPath expressions and CSS selectors with attribute extraction.
   *
   * @param html - HTML content to parse
   * @param selector - XPath expression or CSS selector to locate elements
   * @param type - Type of selector: 'xpath' (default) or 'css'
   * @param attribute - HTML attribute to extract (optional, extracts text content if not specified)
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   *
   * @returns Array of extracted text/attribute values (empty array if no matches)
   *
   * @example
   * ```typescript
   * const html = `
   *   <ul>
   *     <li><a href="/page1">Page 1</a></li>
   *     <li><a href="/page2">Page 2</a></li>
   *     <li><a href="/page3">Page 3</a></li>
   *   </ul>
   * `;
   *
   * // Extract all link texts using XPath
   * const linkTexts = parser.extractMultiple(html, '//a/text()');
   * // Result: ["Page 1", "Page 2", "Page 3"]
   *
   * // Extract all href attributes using XPath
   * const hrefs = parser.extractMultiple(html, '//a', 'xpath', 'href');
   * // Result: ["/page1", "/page2", "/page3"]
   *
   * // Extract using CSS selector
   * const linksCSS = parser.extractMultiple(html, 'li a', 'css');
   * // Result: ["Page 1", "Page 2", "Page 3"]
   *
   * // With type safety and transformation
   * const ids = parser.extractMultiple<number>(html, '//li/@data-id', 'xpath', undefined, {
   *   transform: (value: string) => parseInt(value)
   * });
   * // Result: number[]
   *
   * // With verbose logging
   * const results = parser.extractMultiple(html, '//li', 'xpath', undefined, { verbose: true });
   * ```
   */
  extractMultiple<T = string>(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    attribute?: string,
    options?: ExtractionOptions,
  ): T[] {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    if (verbose) {
      this.logWithLevel(
        'debug',
        `🔍 extractMultiple - Selector: "${selector}", Type: ${type}, Attribute: ${attribute || 'none'}`,
      );
    }

    try {
      let results: string[];

      if (type === 'xpath') {
        results = this.extractMultipleXPath(html, selector, attribute, verbose);
      } else {
        results = this.extractMultipleCSS(html, selector, attribute);
      }

      if (verbose) {
        this.logWithLevel(
          'debug',
          `✅ extractMultiple found ${results.length} results`,
        );
        if (results.length > 0 && results.length <= 5) {
          results.forEach((result, index) => {
            this.logWithLevel(
              'debug',
              `   ${index + 1}: "${result.substring(0, 80)}${result.length > 80 ? '...' : ''}"`,
            );
          });
        } else if (results.length > 5) {
          this.logWithLevel('debug', `   First 3 results:`);
          results.slice(0, 3).forEach((result, index) => {
            this.logWithLevel(
              'debug',
              `   ${index + 1}: "${result.substring(0, 80)}${result.length > 80 ? '...' : ''}"`,
            );
          });
          this.logWithLevel('debug', `   ... and ${results.length - 3} more`);
        }
      }

      // Apply transformation if provided
      if (options?.transform) {
        return this.applyTransform(results, options.transform, options.baseUrl);
      }

      // Return as T[] if no transform (assumes T extends string when no transform)
      return results as T[];
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', '❌ Error in extractMultiple:', error);
      }
      return [];
    }
  }

  /**
   * Extract text content from HTML elements
   *
   * Convenience method specifically for extracting text content from elements.
   * This is equivalent to calling extractSingle without an attribute parameter.
   * Useful when you only need the text content and want clearer intent.
   *
   * @param html - HTML content to parse
   * @param selector - XPath expression or CSS selector to locate the element
   * @param type - Type of selector: 'xpath' (default) or 'css'
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   *
   * @returns The extracted text content, or null if no match found
   *
   * @example
   * ```typescript
   * const html = '<div><h1>Main Title</h1><p>Description text</p></div>';
   *
   * // Extract heading text
   * const title = parser.extractText(html, '//h1');
   * // Result: "Main Title"
   *
   * // Extract paragraph text using CSS
   * const description = parser.extractText(html, 'p', 'css');
   * // Result: "Description text"
   *
   * // With type safety and transformation
   * const wordCount = parser.extractText<number>(html, '//p', 'xpath', {
   *   transform: (text: string) => text.split(' ').length
   * });
   * // Result: number | null
   *
   * // With verbose logging
   * const text = parser.extractText(html, '//p/text()', 'xpath', { verbose: true });
   * ```
   */
  extractText<T = string>(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    options?: ExtractionOptions,
  ): T | null {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    try {
      let result: string | null;

      if (type === 'xpath') {
        result = this.extractSingleXPath(html, selector, undefined, verbose);
      } else {
        result = this.extractSingleCSS(html, selector);
      }

      // Apply transformation if provided and result exists
      if (result !== null && options?.transform) {
        return this.applyTransform(result, options.transform, options.baseUrl);
      }

      // Return as T if no transform (assumes T extends string when no transform)
      return result as T | null;
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', 'Error in extractText:', error);
      }
      return null;
    }
  }

  /**
   * Extract attribute values from multiple HTML elements
   *
   * Convenience method for extracting a specific attribute from all matching elements.
   * This is equivalent to calling extractMultiple with an attribute parameter.
   * Returns all attribute values from elements that match the selector.
   *
   * @param html - HTML content to parse
   * @param selector - XPath expression or CSS selector to locate elements
   * @param attribute - HTML attribute name to extract
   * @param type - Type of selector: 'xpath' (default) or 'css'
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   *
   * @returns Array of attribute values (empty array if no matches or no attribute)
   *
   * @example
   * ```typescript
   * const html = `
   *   <nav>
   *     <a href="/home" title="Home Page">Home</a>
   *     <a href="/about" title="About Us">About</a>
   *     <a href="/contact" title="Contact Form">Contact</a>
   *   </nav>
   * `;
   *
   * // Extract all href attributes
   * const links = parser.extractAttributes(html, '//a', 'href');
   * // Result: ["/home", "/about", "/contact"]
   *
   * // Extract all title attributes
   * const titles = parser.extractAttributes(html, '//a', 'title', 'xpath');
   * // Result: ["Home Page", "About Us", "Contact Form"]
   *
   * // Using CSS selector
   * const hrefs = parser.extractAttributes(html, 'nav a', 'href', 'css');
   * // Result: ["/home", "/about", "/contact"]
   *
   * // With type safety and transformation
   * const ids = parser.extractAttributes<number>(html, '//img', 'data-id', 'xpath', {
   *   transform: (value: string) => parseInt(value)
   * });
   * // Result: number[]
   * ```
   */
  extractAttributes<T = string>(
    html: string,
    selector: string,
    attribute: string,
    type: 'xpath' | 'css' = 'xpath',
    options?: ExtractionOptions,
  ): T[] {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    try {
      let results: string[];

      if (type === 'xpath') {
        results = this.extractMultipleXPath(html, selector, attribute, verbose);
      } else {
        results = this.extractMultipleCSS(html, selector, attribute);
      }

      // Apply transformation if provided
      if (options?.transform) {
        return this.applyTransform(results, options.transform, options.baseUrl);
      }

      // Return as T[] if no transform (assumes T extends string when no transform)
      return results as T[];
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', 'Error in extractAttributes:', error);
      }
      return [];
    }
  }

  /**
   * Check if elements exist in HTML content
   *
   * Tests whether the specified selector matches any elements in the HTML.
   * Useful for conditional logic based on element presence or for validating
   * HTML structure before attempting extractions.
   *
   * @param html - HTML content to search
   * @param selector - XPath expression or CSS selector to test
   * @param type - Type of selector: 'xpath' (default) or 'css'
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   *
   * @returns true if at least one element matches, false otherwise
   *
   * @example
   * ```typescript
   * const html = '<div><h1>Title</h1><p class="content">Text</p></div>';
   *
   * // Check if title exists
   * const hasTitle = parser.exists(html, '//h1');
   * // Result: true
   *
   * // Check if specific class exists
   * const hasContent = parser.exists(html, '//p[@class="content"]');
   * // Result: true
   *
   * // Check for non-existent element
   * const hasFooter = parser.exists(html, '//footer');
   * // Result: false
   *
   * // Using CSS selector
   * const hasContentCSS = parser.exists(html, 'p.content', 'css');
   * // Result: true
   *
   * // Conditional extraction based on existence
   * if (parser.exists(html, '//nav')) {
   *   const navigation = parser.extractStructured(html, navSchema);
   * }
   * ```
   */
  exists(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean },
  ): boolean {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    if (verbose && this.shouldLog('debug')) {
      this.logWithLevel(
        'debug',
        `🔍 exists - Checking selector: "${selector}", Type: ${type}`,
      );
    }

    try {
      let result: boolean;

      if (type === 'xpath') {
        const results = this.evaluateXPath(html, selector, verbose);
        result = results.length > 0;
      } else {
        const $ = cheerio.load(html);
        result = $(selector).length > 0;
      }

      if (verbose && this.shouldLog('debug')) {
        this.logWithLevel(
          'debug',
          `✅ exists result: ${result ? 'Found' : 'Not found'}`,
        );
      }

      return result;
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', '❌ Error in exists:', error);
      }
      return false;
    }
  }

  /**
   * Count the number of matching elements in HTML content
   *
   * Returns the total number of elements that match the specified selector.
   * Useful for pagination, validation, or determining the size of data sets
   * before processing them.
   *
   * @param html - HTML content to search
   * @param selector - XPath expression or CSS selector to count
   * @param type - Type of selector: 'xpath' (default) or 'css'
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   *
   * @returns Number of matching elements (0 if no matches)
   *
   * @example
   * ```typescript
   * const html = `
   *   <ul>
   *     <li>Item 1</li>
   *     <li>Item 2</li>
   *     <li>Item 3</li>
   *   </ul>
   *   <div class="highlight">Special</div>
   * `;
   *
   * // Count list items
   * const itemCount = parser.count(html, '//li');
   * // Result: 3
   *
   * // Count elements with specific class
   * const highlightCount = parser.count(html, '//div[@class="highlight"]');
   * // Result: 1
   *
   * // Count using CSS selector
   * const listItemsCSS = parser.count(html, 'ul li', 'css');
   * // Result: 3
   *
   * // Use count for conditional processing
   * const articleCount = parser.count(html, '//article');
   * if (articleCount > 10) {
   *   console.log('Large dataset detected, processing in batches');
   * }
   * ```
   */
  count(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean },
  ): number {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    if (verbose && this.shouldLog('debug')) {
      this.logWithLevel(
        'debug',
        `🔍 count - Counting selector: "${selector}", Type: ${type}`,
      );
    }

    try {
      let result: number;

      if (type === 'xpath') {
        const results = this.evaluateXPath(html, selector, verbose);
        result = results.length;
      } else {
        const $ = cheerio.load(html);
        result = $(selector).length;
      }

      if (verbose && this.shouldLog('debug')) {
        this.logWithLevel('debug', `✅ count result: ${result} elements found`);
      }

      return result;
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', '❌ Error in count:', error);
      }
      return 0;
    }
  }

  /**
   * Extract structured data from HTML using a schema definition
   *
   * Applies a schema object to extract multiple related fields from HTML content.
   * Each field in the schema defines its own selector, type, optional attribute,
   * transformation function, and now supports 'multiple' and 'raw' flags for array and raw HTML extraction.
   *
   * If a schema field includes `multiple: true`, the extracted value for that field
   * will be an array of results (with transform applied to each item if provided).
   * If a schema field includes `raw: true`, the extracted value will be the raw HTML of the matched element(s).
   * Otherwise, a single value is returned as before.
   *
   * @param html - HTML content to parse
   * @param schema - Schema object defining fields to extract (see ExtractionSchema)
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   *
   * @returns Object with extracted data matching the schema structure. Fields with
   *          `multiple: true` will be arrays, `raw: true` will be raw HTML, others will be single values.
   *
   * @example
   * ```typescript
   * const html = `
   *   <article>
   *     <h1>Product Name</h1>
   *     <span class="price">$29.99</span>
   *     <img src="/image.jpg" alt="Product">
   *     <div class="rating" data-stars="4">★★★★☆</div>
   *     <div class="tags">
   *       <span class="tag">electronics</span>
   *       <span class="tag">gadget</span>
   *     </div>
   *   </article>
   * `;
   *
   * // Define typed interface
   * interface Product {
   *   title: string;
   *   price: number;
   *   image: string;
   *   rating: number;
   *   tags: string[]; // <-- array field
   *   titleHtml: string; // <-- raw HTML field
   * }
   *
   * const productSchema: ExtractionSchema<Product> = {
   *   title: {
   *     selector: '//h1/text()',
   *     type: 'xpath'
   *   },
   *   price: {
   *     selector: '//span[@class="price"]/text()',
   *     type: 'xpath',
   *     transform: (price) => parseFloat(price.replace('$', ''))
   *   },
   *   image: {
   *     selector: '//img',
   *     type: 'xpath',
   *     attribute: 'src'
   *   },
   *   rating: {
   *     selector: '//div[@class="rating"]',
   *     type: 'xpath',
   *     attribute: 'data-stars',
   *     transform: (stars) => parseInt(stars)
   *   },
   *   tags: {
   *     selector: '//span[@class="tag"]/text()',
   *     type: 'xpath',
   *     multiple: true // <-- NEW: array extraction
   *   },
   *   titleHtml: {
   *     selector: '//h1',
   *     type: 'xpath',
   *     raw: true // <-- NEW: raw HTML extraction
   *   }
   * };
   *
   * const product = parser.extractStructured<Product>(html, productSchema);
   * // Result: Product type with full type safety
   * // {
   * //   title: "Product Name",
   * //   price: 29.99,
   * //   image: "/image.jpg",
   * //   rating: 4,
   * //   tags: ["electronics", "gadget"], // <-- array result
   * //   titleHtml: "<h1>Product Name</h1>" // <-- raw HTML result
   * // }
   * ```
   */
  extractStructured<T = Record<string, any>>(
    html: string,
    schema: ExtractionSchema<T>,
    options?: { verbose?: boolean; baseUrl?: string },
  ): T {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;
    const baseUrl = options?.baseUrl;
    const result: Record<string, any> = {};

    if (verbose) {
      this.logWithLevel(
        'debug',
        `🔍 extractStructured - Processing ${Object.keys(schema).length} schema fields`,
      );
    }

    try {
      for (const [key, config] of Object.entries(schema)) {
        try {
          let value: any;
          const raw = config.raw === true;

          if (config.multiple) {
            // Use extractMultiple for array fields
            if (config.type === 'xpath') {
              value = this.extractMultipleXPath(
                html,
                config.selector,
                config.attribute,
                verbose,
                raw,
              );
            } else {
              if (raw) {
                value = this.extractMultipleCSS(
                  html,
                  config.selector,
                  undefined,
                  true,
                );
              } else {
                value = this.extractMultipleCSS(
                  html,
                  config.selector,
                  config.attribute,
                );
              }
            }
            // Apply transformation if provided
            const transform = config.transform;
            if (transform) {
              value = this.applyTransform(value, transform, baseUrl);
            }
          } else {
            // Use extractSingle for single value fields
            if (config.type === 'xpath') {
              value = this.extractSingleXPath(
                html,
                config.selector,
                config.attribute,
                verbose,
                raw,
              );
            } else {
              if (raw) {
                value = this.extractSingleCSS(
                  html,
                  config.selector,
                  undefined,
                  true,
                );
              } else {
                value = this.extractSingleCSS(
                  html,
                  config.selector,
                  config.attribute,
                );
              }
            }
            // Apply transformation if provided
            if (value && config.transform) {
              value = this.applyTransform(value, config.transform, baseUrl);
            }
          }

          result[key] = value;

          if (verbose) {
            this.logWithLevel(
              'debug',
              `✅ Extracted field '${key}': ${value ? 'success' : 'null/empty'}`,
            );
          }
        } catch (error) {
          if (this.shouldLog('error')) {
            this.logWithLevel(
              'error',
              `❌ Error extracting field '${key}':`,
              error,
            );
          }
          result[key] = config.multiple ? [] : null;
        }
      }
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', '❌ Error in extractStructured:', error);
      }
    }

    return result as T;
  }

  /**
   * Extract array of structured data from repeating HTML elements
   *
   * For each container, applies the schema as in extractStructured. If a schema field
   * includes `multiple: true`, the extracted value for that field will be an array of results.
   * If a schema field includes `raw: true`, the extracted value will be the raw HTML of the matched element(s).
   *
   * @param html - HTML content to parse
   * @param containerSelector - XPath or CSS selector to find container elements
   * @param schema - Schema object defining fields to extract from each container
   * @param containerType - Type of container selector: 'xpath' (default) or 'css'
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   *
   * @returns Array of objects with extracted data matching the schema structure. Fields with
   *          `multiple: true` will be arrays, `raw: true` will be raw HTML, others will be single values.
   *
   * @example
   * ```typescript
   * const html = `
   *   <div class="products">
   *     <div class="product">
   *       <h3>Product A</h3>
   *       <span class="price">$19.99</span>
   *       <span class="tag">electronics</span>
   *       <span class="tag">gadget</span>
   *     </div>
   *     <div class="product">
   *       <h3>Product B</h3>
   *       <span class="price">$29.99</span>
   *       <span class="tag">accessory</span>
   *     </div>
   *   </div>
   * `;
   *
   * // Define typed interface
   * interface Product {
   *   name: string;
   *   price: number;
   *   tags: string[]; // <-- array field
   *   nameHtml: string; // <-- raw HTML field
   * }
   *
   * const productSchema: ExtractionSchema<Product> = {
   *   name: {
   *     selector: './/h3/text()',
   *     type: 'xpath'
   *   },
   *   price: {
   *     selector: './/span[@class="price"]/text()',
   *     type: 'xpath',
   *     transform: (value) => parseFloat(value.replace('$', ''))
   *   },
   *   tags: {
   *     selector: './/span[@class="tag"]/text()',
   *     type: 'xpath',
   *     multiple: true // <-- NEW: array extraction
   *   },
   *   nameHtml: {
   *     selector: './/h3',
   *     type: 'xpath',
   *     raw: true // <-- NEW: raw HTML extraction
   *   }
   * };
   *
   * const products = parser.extractStructuredList<Product>(
   *   html,
   *   '//div[@class="product"]',
   *   productSchema
   * );
   * // Result: Product[] with tags as array and nameHtml as raw HTML for each product
   * // [
   * //   { name: "Product A", price: 19.99, tags: ["electronics", "gadget"], nameHtml: "<h3>Product A</h3>" },
   * //   { name: "Product B", price: 29.99, tags: ["accessory"], nameHtml: "<h3>Product B</h3>" }
   * // ]
   * ```
   */
  extractStructuredList<T = Record<string, any>>(
    html: string,
    containerSelector: string,
    schema: ExtractionSchema<T>,
    containerType: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean; baseUrl?: string },
  ): T[] {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;
    const baseUrl = options?.baseUrl;
    const results: T[] = [];

    if (verbose) {
      this.logWithLevel(
        'debug',
        `🔍 extractStructuredList - Container: "${containerSelector}", Type: ${containerType}`,
      );
      this.logWithLevel(
        'debug',
        `📋 Schema fields: ${Object.keys(schema).join(', ')}`,
      );
    }

    try {
      let containers: any[];

      if (containerType === 'xpath') {
        containers = this.evaluateXPath(html, containerSelector, verbose);
      } else {
        const $ = cheerio.load(html);
        containers = $(containerSelector).toArray();
      }

      if (verbose) {
        this.logWithLevel(
          'debug',
          `📦 Found ${containers.length} containers to process`,
        );
      }

      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];

        if (verbose) {
          this.logWithLevel(
            'debug',
            `📦 Processing container ${i + 1}/${containers.length}`,
          );
        }

        const containerHTML = this.getElementHTML(container);
        const item = this.extractStructured<T>(containerHTML, schema, {
          verbose,
          baseUrl,
        });
        results.push(item);

        if (verbose) {
          const extractedFields = Object.entries(item as Record<string, any>)
            .filter(
              ([_, value]) =>
                value !== null && value !== undefined && value !== '',
            )
            .map(([key, _]) => key);
          this.logWithLevel(
            'debug',
            `✅ Container ${i + 1} extracted fields: ${extractedFields.join(', ')}`,
          );
        }
      }

      if (verbose) {
        this.logWithLevel(
          'debug',
          `🎯 extractStructuredList completed: ${results.length} items extracted`,
        );
      }
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', '❌ Error in extractStructuredList:', error);
      }
    }

    return results;
  }

  /**
   * Evaluate XPath expression and return matching nodes
   */
  private evaluateXPath(html: string, xpath: string, verbose = false): Node[] {
    try {
      // Configure JSDOM with CSS error suppression
      const virtualConsole = new (require('jsdom').VirtualConsole)();

      if (!verbose) {
        // Suppress all console output when not in verbose mode
        virtualConsole.on('error', () => {});
        virtualConsole.on('warn', () => {});
        virtualConsole.on('info', () => {});
        virtualConsole.on('log', () => {});
      } else {
        // In verbose mode, filter out CSS parsing errors but show other relevant errors
        virtualConsole.on('error', (error) => {
          const errorString = error?.toString() || '';
          const stackString = error?.stack || '';

          // Filter out CSS-related errors
          const isCSSError =
            errorString.includes('Could not parse CSS stylesheet') ||
            errorString.includes('CSS parsing') ||
            stackString.includes('stylesheets.js') ||
            stackString.includes('HTMLStyleElement-impl.js') ||
            stackString.includes('createStylesheet');

          // Only log non-CSS errors in verbose mode
          if (!isCSSError) {
            this.logWithLevel('error', 'XPath evaluation error:', error);
          }
        });

        // Allow warnings but filter out CSS-related ones
        virtualConsole.on('warn', (warning) => {
          const warningString = warning?.toString() || '';
          const isCSSWarning =
            warningString.includes('CSS') ||
            warningString.includes('stylesheet');

          if (!isCSSWarning) {
            this.logWithLevel('warn', 'XPath evaluation warning:', warning);
          }
        });

        // Allow info and log messages in verbose mode
        virtualConsole.on('info', (...args) => {
          if (verbose) this.logWithLevel('debug', 'XPath info:', ...args);
        });

        virtualConsole.on('log', (...args) => {
          if (verbose) this.logWithLevel('debug', 'XPath log:', ...args);
        });
      }

      const dom = new JSDOM(html, {
        virtualConsole,
        resources: 'usable',
        runScripts: 'outside-only',
        pretendToBeVisual: false,
      });

      const document = dom.window.document;
      const result = document.evaluate(
        xpath,
        document,
        null,
        dom.window.XPathResult.ANY_TYPE,
        null,
      );

      const nodes: Node[] = [];
      let node = result.iterateNext();
      while (node) {
        nodes.push(node);
        node = result.iterateNext();
      }

      if (verbose && nodes.length === 0) {
        this.logWithLevel(
          'debug',
          `XPath query "${xpath}" returned no results`,
        );
      } else if (verbose) {
        this.logWithLevel(
          'debug',
          `XPath query "${xpath}" returned ${nodes.length} results`,
        );
      }

      return nodes;
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', 'XPath evaluation error:', error);
      }
      return [];
    }
  }

  // Private helper methods

  private getElementHTML(element: any): string {
    if (!element) return '';

    if (element.outerHTML) {
      return element.outerHTML;
    }

    if (element.toString) {
      return element.toString();
    }

    return '';
  }

  private extractSingleXPath(
    html: string,
    selector: string,
    attribute?: string,
    verbose = false,
    raw = false,
  ): string | null {
    try {
      // Handle attribute selectors differently
      if (attribute && !selector.includes('/@')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        if (elements.length > 0) {
          const element = elements[0] as any;
          if (raw && element.outerHTML) return element.outerHTML;
          return element.getAttribute ? element.getAttribute(attribute) : null;
        }
        return null;
      }

      // Handle text() selectors
      if (selector.includes('/text()')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        if (elements.length > 0) {
          const textNode = elements[0] as any;
          if (raw && textNode.parentNode && textNode.parentNode.outerHTML)
            return textNode.parentNode.outerHTML;
          return (
            textNode.nodeValue ||
            textNode.textContent ||
            String(textNode).trim()
          );
        }
        return null;
      }

      // Handle attribute selectors with /@
      if (selector.includes('/@')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        if (elements.length > 0) {
          const attrNode = elements[0] as any;
          // No raw for attribute node
          return attrNode.value || attrNode.nodeValue || String(attrNode);
        }
        return null;
      }

      // Handle regular element selectors
      const elements = this.evaluateXPath(html, selector, verbose);
      if (elements.length > 0) {
        const element = elements[0] as any;
        if (raw && element.outerHTML) return element.outerHTML;
        if (attribute) {
          return element.getAttribute ? element.getAttribute(attribute) : null;
        }
        return element.textContent || element.innerText || '';
      }

      return null;
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', 'Error in extractSingleXPath:', error);
      }
      return null;
    }
  }

  private extractMultipleXPath(
    html: string,
    selector: string,
    attribute?: string,
    verbose = false,
    raw = false,
  ): string[] {
    try {
      const results: string[] = [];

      // Handle attribute selectors differently
      if (attribute && !selector.includes('/@')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        for (const element of elements) {
          if (raw && (element as any).outerHTML) {
            results.push((element as any).outerHTML);
            continue;
          }
          const value = (element as any).getAttribute
            ? (element as any).getAttribute(attribute)
            : null;
          if (value) results.push(value);
        }
        return results;
      }

      // Handle text() selectors
      if (selector.includes('/text()')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        for (const element of elements) {
          if (
            raw &&
            (element as any).parentNode &&
            (element as any).parentNode.outerHTML
          ) {
            results.push((element as any).parentNode.outerHTML);
            continue;
          }
          const text =
            (element as any).nodeValue ||
            (element as any).textContent ||
            String(element);
          if (text && text.trim()) results.push(text.trim());
        }
        return results;
      }

      // Handle attribute selectors with /@
      if (selector.includes('/@')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        for (const element of elements) {
          // No raw for attribute node
          const value =
            (element as any).value ||
            (element as any).nodeValue ||
            String(element);
          if (value) results.push(value);
        }
        return results;
      }

      // Handle regular element selectors
      const elements = this.evaluateXPath(html, selector, verbose);
      for (const element of elements) {
        if (raw && (element as any).outerHTML) {
          results.push((element as any).outerHTML);
          continue;
        }
        const value = attribute
          ? (element as any).getAttribute
            ? (element as any).getAttribute(attribute)
            : null
          : (element as any).textContent || (element as any).innerText || '';

        if (value) results.push(value);
      }

      return results;
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', 'Error in extractMultipleXPath:', error);
      }
      return [];
    }
  }

  private extractSingleCSS(
    html: string,
    selector: string,
    attribute?: string,
    raw = false,
  ): string | null {
    try {
      const $ = cheerio.load(html);
      const element = $(selector).first();

      if (element.length === 0) return null;

      if (raw) {
        return $.html(element);
      }

      if (attribute) {
        return element.attr(attribute) || null;
      }

      return element.text().trim() || null;
    } catch (error) {
      return null;
    }
  }

  private extractMultipleCSS(
    html: string,
    selector: string,
    attribute?: string,
    raw = false,
  ): string[] {
    try {
      const $ = cheerio.load(html);
      const elements = $(selector);
      const results: string[] = [];

      elements.each((_, element) => {
        const $element = $(element);
        if (raw) {
          results.push($.html($element));
          return;
        }
        if (attribute) {
          const value = $element.attr(attribute);
          if (value) results.push(value);
        } else {
          const text = $element.text().trim();
          if (text) results.push(text);
        }
      });

      return results;
    } catch (error) {
      return [];
    }
  }

  private normalizeHeaders(headers: any): Record<string, string> {
    const normalizedHeaders: Record<string, string> = {};
    for (const key in headers) {
      if (headers[key] !== undefined && headers[key] !== null) {
        normalizedHeaders[key] = String(headers[key]);
      }
    }
    return normalizedHeaders;
  }

  /**
   * Categorize error types for better handling and retry logic
   *
   * @param error - The error to categorize
   * @returns Object with error type and description
   */
  private categorizeError(error: Error): { type: string; description: string } {
    const message = error.message.toLowerCase();

    // SSL/TLS errors
    if (
      message.includes('self signed certificate') ||
      message.includes('unable to verify the first certificate') ||
      message.includes('certificate has expired') ||
      message.includes('cert authority invalid') ||
      message.includes('ssl')
    ) {
      return {
        type: 'ssl',
        description:
          'SSL certificate error - try setting rejectUnauthorized: false or ignoreSSLErrors: true',
      };
    }

    // Connection timeout errors
    if (message.includes('timeout') || message.includes('etimedout')) {
      return {
        type: 'timeout',
        description:
          'Connection timeout - try increasing timeout value or retry delay',
      };
    }

    // DNS resolution errors
    if (message.includes('enotfound') || message.includes('getaddrinfo')) {
      return {
        type: 'dns',
        description:
          'DNS resolution failed - domain might be dead or unreachable',
      };
    }

    // Connection refused errors
    if (
      message.includes('econnrefused') ||
      message.includes('connection refused')
    ) {
      return {
        type: 'connectionRefused',
        description:
          'Connection refused - server might be down or blocking requests',
      };
    }

    // Network unreachable
    if (
      message.includes('enetunreach') ||
      message.includes('network unreachable')
    ) {
      return {
        type: 'networkUnreachable',
        description:
          'Network unreachable - check internet connection or proxy settings',
      };
    }

    // Socket hang up
    if (message.includes('socket hang up') || message.includes('econnreset')) {
      return {
        type: 'connectionReset',
        description:
          'Connection reset by server - try with different user agent or proxy',
      };
    }

    // Rate limiting or blocked
    if (message.includes('429') || message.includes('rate limit')) {
      return {
        type: 'rateLimited',
        description:
          'Rate limited - increase retry delay or use proxy rotation',
      };
    }

    // HTTP errors
    if (message.includes('request failed with status code')) {
      const statusMatch = message.match(/status code (\d+)/);
      const status = statusMatch ? statusMatch[1] : 'unknown';
      return {
        type: 'http',
        description: `HTTP error ${status} - check if the URL is correct and accessible`,
      };
    }

    // Default unknown error
    return {
      type: 'unknown',
      description: 'Unknown error - check URL and network connectivity',
    };
  }

  /**
   * Determine if an error should trigger a retry based on configuration
   *
   * @param errorInfo - Categorized error information
   * @param config - Parser configuration options
   * @returns Whether to retry the request
   */
  private shouldRetryOnError(
    errorInfo: { type: string },
    config: HtmlParserOptions,
  ): boolean {
    const retryConfig =
      config.retryOnErrors || this.defaultOptions.retryOnErrors || {};

    switch (errorInfo.type) {
      case 'ssl':
        return retryConfig.ssl === true;

      case 'timeout':
        return retryConfig.timeout === true;

      case 'dns':
        return retryConfig.dns === true;

      case 'connectionRefused':
        return retryConfig.connectionRefused === true;

      case 'connectionReset':
      case 'networkUnreachable':
        // Always retry these as they might be temporary
        return true;

      case 'rateLimited':
        // Don't retry rate limiting immediately - user should handle this
        return false;

      case 'http':
        // Don't retry HTTP errors by default (404, 500, etc.)
        return false;

      default:
        // Retry unknown errors by default
        return true;
    }
  }

  /**
   * Extract pagination data from HTML using a predefined schema
   *
   * This method provides a convenient way to extract pagination information without
   * needing to define a custom schema. It automatically uses a standard pagination
   * schema that extracts href and text from pagination elements.
   *
   * @param html - HTML content to parse
   * @param containerSelector - XPath or CSS selector to find pagination container elements
   * @param containerType - Type of container selector: 'xpath' (default) or 'css'
   * @param options - Parsing options
   * @param options.verbose - Enable verbose logging for debugging
   * @param options.baseUrl - Base URL for relative link resolution
   *
   * @returns Array of pagination page objects with href and text properties
   *
   * @example
   * ```typescript
   * const html = `
   *   <ul class="pageNav-main">
   *     <li class="pageNav-page"><a href="/page-1">1</a></li>
   *     <li class="pageNav-page pageNav-page--current"><a href="/page-2">2</a></li>
   *     <li class="pageNav-page"><a href="/page-3">3</a></li>
   *   </ul>
   * `;
   *
   * // Extract pagination using XPath
   * const pages = parser.extractPagination(
   *   html,
   *   "//li[contains(@class, 'pageNav-page')]"
   * );
   * // Result: [
   * //   { href: "/page-1", text: "1" },
   * //   { href: "/page-2", text: "2" },
   * //   { href: "/page-3", text: "3" }
   * // ]
   *
   * // With baseUrl for absolute URLs
   * const pagesWithBase = parser.extractPagination(
   *   html,
   *   "//li[contains(@class, 'pageNav-page')]",
   *   'xpath',
   *   { baseUrl: 'https://example.com' }
   * );
   * // Result: [
   * //   { href: "https://example.com/page-1", text: "1" },
   * //   { href: "https://example.com/page-2", text: "2" },
   * //   { href: "https://example.com/page-3", text: "3" }
   * // ]
   *
   * // Using CSS selector
   * const pagesCSS = parser.extractPagination(
   *   html,
   *   'li.pageNav-page',
   *   'css'
   * );
   * ```
   */
  extractPagination(
    html: string,
    containerSelector: string,
    containerType: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean; baseUrl?: string },
  ): PaginationPage[] {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;
    const baseUrl = options?.baseUrl;

    // Validate containerSelector
    if (!containerSelector || typeof containerSelector !== 'string') {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', `Invalid containerSelector provided: ${containerSelector}`);
      }
      return [];
    }

    if (verbose) {
      this.logWithLevel(
        'debug',
        `🔍 extractPagination - Container: "${containerSelector}", Type: ${containerType}`,
      );
    }

    // Define the pagination schema
    const pageSchema: ExtractionSchema<PaginationPage> = {
      href: {
        selector: './/a',
        type: 'xpath',
        attribute: 'href',
        transform: baseUrl ? (href: string) => {
          if (!href) return href;
          try {
            // Handle relative URLs
            if (href.startsWith('/') || !href.includes('://')) {
              return new URL(href, baseUrl).toString();
            }
            return href;
          } catch {
            return href;
          }
        } : undefined,
      },
      text: {
        selector: './/a/text()',
        type: 'xpath'
      }
    };

    try {
      const results = this.extractStructuredList<PaginationPage>(
        html,
        containerSelector,
        pageSchema,
        containerType,
        { verbose, baseUrl }
      );

      // Filter out invalid results (pages without href or text)
      const validResults = results.filter(page => 
        page.href && page.href.trim() !== '' && 
        page.text && page.text.trim() !== ''
      );

      if (verbose) {
        this.logWithLevel(
          'debug',
          `🎯 extractPagination completed: ${validResults.length} valid pages extracted`
        );
      }

      return validResults;
    } catch (error) {
      if (this.shouldLog('error')) {
        this.logWithLevel('error', '❌ Error in extractPagination:', error);
      }
      return [];
    }
  }

  /**
   * Extract the origin (protocol + hostname + port) from a URL
   * 
   * @param url - Full URL string
   * @returns Origin string (e.g., "https://example.com")
   * 
   * @example
   * ```typescript
   * const origin = parser.getOrigin('https://www.bmw-sg.com/forums/forums/introduction-greetings.24/page-5');
   * // Result: "https://www.bmw-sg.com"
   * ```
   */
  getOrigin(url: string): string {
    try {
      return new URL(url).origin;
    } catch (error) {
      throw new Error(`Invalid URL provided to getOrigin: ${url}`);
    }
  }

  /**
   * Apply a transform (object with class and payload, or array of these) to a value or array of values.
   * Supports pipe classes with transform method that need baseUrl context and properly chains transform outputs as inputs to next transform.
   */
  private applyTransform(value: any, transform: any, baseUrl?: string): any {
    if (!transform) return value;

    // Helper to get text content from DOM element
    const toText = (val: any) => {
      if (
        typeof val !== 'string' &&
        val &&
        typeof val.textContent === 'string'
      ) {
        return val.textContent;
      }
      return val;
    };

    const isClass = (t: any) => {
      return (
        typeof t === 'function' &&
        t.prototype &&
        t.prototype.constructor === t
      );
    };

    const isPipeClass = (t: any) => {
      return (
        isClass(t) &&
        Object.getOwnPropertyNames(t.prototype).includes('transform')
      );
    };

    const executeTransform = (val: any, t: any, currentBaseUrl?: string): any => {
      val = toText(val); // Always convert to string if possible before transform
      
      // Handle function format: (value) => transformedValue
      if (typeof t === 'function') {
        return t(val);
      }
      
      // Handle object format: { class: SomeClass, payload?: {...} }
      if (t && typeof t === 'object' && t.class && isPipeClass(t.class)) {
        const instance = new t.class();
        
        // Apply payload configuration if provided
        if (t.payload && typeof t.payload === 'object') {
          Object.assign(instance, t.payload);
        }
        
        // Set baseUrl if the instance supports it and we have one
        if (currentBaseUrl && ('baseUrl' in instance || instance.hasOwnProperty('baseUrl'))) {
          instance.baseUrl = currentBaseUrl;
        }
        
        // Call transform method
        if (typeof instance.transform === 'function') {
          return instance.transform(val);
        }
        
        return val;
      }
      
      return val;
    };

    const applyToValue = (val: any, transforms: any, currentBaseUrl?: string): any => {
      if (Array.isArray(transforms)) {
        // Chain transforms: output of one becomes input of next, maintaining baseUrl context
        return transforms.reduce((acc, t) => {
          const result = executeTransform(acc, t, currentBaseUrl);
          return result;
        }, val);
      }
      return executeTransform(val, transforms, currentBaseUrl);
    };

    return Array.isArray(value)
      ? value.map((v) => applyToValue(v, transform, baseUrl))
      : applyToValue(value, transform, baseUrl);
  }
}
