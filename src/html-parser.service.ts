import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { JSDOM } from 'jsdom';
import { SocksProxyAgent } from 'socks-proxy-agent';
import {
  ExtractionSchema,
  HtmlFetchResponse,
  HtmlParserOptions,
  ProxyConfig,
} from './types';

@Injectable()
export class HtmlParserService {
  private defaultOptions: HtmlParserOptions = {
    timeout: 10000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    useRandomUserAgent: false,
    retries: 3,
    retryDelay: 1000,
    verbose: false,
  };

  // Store original console methods for restoring
  private originalConsoleError: any;
  private originalConsoleWarn: any;

  constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
  }

  /**
   * Suppress console output when verbose is false
   */
  private suppressConsole(): void {
    console.error = () => {};
    console.warn = () => {};
  }

  /**
   * Restore console output
   */
  private restoreConsole(): void {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
  }

  /**
   * Fetch HTML content from a URL with support for random user agents and proxies
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

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Get user agent - either random or specified
        const userAgent = config.useRandomUserAgent
          ? await this.getRandomUserAgent()
          : config.userAgent;

        // Create axios config
        const axiosConfig: any = {
          timeout: config.timeout,
          headers: {
            'User-Agent': userAgent,
            ...config.headers,
          },
        };

        // Add proxy configuration if provided
        if (config.proxy) {
          axiosConfig.httpAgent = this.createProxyAgent(config.proxy, false);
          axiosConfig.httpsAgent = this.createProxyAgent(config.proxy, true);
        }

        const response = await axios.get(url, axiosConfig);
        return {
          data: response.data,
          headers: this.normalizeHeaders(response.headers),
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await this.delay(retryDelay);
          continue;
        }
      }
    }

    throw new Error(
      `Failed to fetch HTML from ${url} after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
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
   * Generate a random user agent
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
   * Test proxy connection
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
   * Extract single value using XPath (primary) or CSS selector (secondary)
   */
  extractSingle(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    attribute?: string,
    options?: { verbose?: boolean },
  ): string | null {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    if (verbose) {
      console.log(
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
        console.log(
          `✅ extractSingle result: ${result ? `"${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"` : 'null'}`,
        );
      }

      return result;
    } catch (error) {
      if (verbose) {
        console.error('❌ Error in extractSingle:', error);
      }
      return null;
    }
  }

  /**
   * Extract multiple values using XPath (primary) or CSS selector (secondary)
   */
  extractMultiple(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    attribute?: string,
    options?: { verbose?: boolean },
  ): string[] {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    if (verbose) {
      console.log(
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
        console.log(`✅ extractMultiple found ${results.length} results`);
        if (results.length > 0 && results.length <= 5) {
          results.forEach((result, index) => {
            console.log(
              `   ${index + 1}: "${result.substring(0, 80)}${result.length > 80 ? '...' : ''}"`,
            );
          });
        } else if (results.length > 5) {
          console.log(`   First 3 results:`);
          results.slice(0, 3).forEach((result, index) => {
            console.log(
              `   ${index + 1}: "${result.substring(0, 80)}${result.length > 80 ? '...' : ''}"`,
            );
          });
          console.log(`   ... and ${results.length - 3} more`);
        }
      }

      return results;
    } catch (error) {
      if (verbose) {
        console.error('❌ Error in extractMultiple:', error);
      }
      return [];
    }
  }

  /**
   * Extract text content specifically
   */
  extractText(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean },
  ): string | null {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    try {
      if (type === 'xpath') {
        return this.extractSingleXPath(html, selector, undefined, verbose);
      } else {
        return this.extractSingleCSS(html, selector);
      }
    } catch (error) {
      if (verbose) {
        console.error('Error in extractText:', error);
      }
      return null;
    }
  }

  /**
   * Extract attribute values from multiple elements
   */
  extractAttributes(
    html: string,
    selector: string,
    attribute: string,
    type: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean },
  ): string[] {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    try {
      if (type === 'xpath') {
        return this.extractMultipleXPath(html, selector, attribute, verbose);
      } else {
        return this.extractMultipleCSS(html, selector, attribute);
      }
    } catch (error) {
      if (verbose) {
        console.error('Error in extractAttributes:', error);
      }
      return [];
    }
  }

  /**
   * Check if elements exist
   */
  exists(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean },
  ): boolean {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    if (verbose) {
      console.log(
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

      if (verbose) {
        console.log(`✅ exists result: ${result ? 'Found' : 'Not found'}`);
      }

      return result;
    } catch (error) {
      if (verbose) {
        console.error('❌ Error in exists:', error);
      }
      return false;
    }
  }

  /**
   * Count matching elements
   */
  count(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean },
  ): number {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;

    if (verbose) {
      console.log(`🔍 count - Counting selector: "${selector}", Type: ${type}`);
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

      if (verbose) {
        console.log(`✅ count result: ${result} elements found`);
      }

      return result;
    } catch (error) {
      if (verbose) {
        console.error('❌ Error in count:', error);
      }
      return 0;
    }
  }

  /**
   * Extract structured data using a schema
   */
  extractStructured(
    html: string,
    schema: ExtractionSchema,
    options?: { verbose?: boolean },
  ): Record<string, any> {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;
    const result: Record<string, any> = {};

    try {
      for (const [key, config] of Object.entries(schema)) {
        try {
          let value: any;

          if (config.type === 'xpath') {
            value = this.extractSingleXPath(
              html,
              config.selector,
              config.attribute,
              verbose,
            );
          } else {
            value = this.extractSingleCSS(
              html,
              config.selector,
              config.attribute,
            );
          }

          // Apply transformation if provided
          if (value && config.transform) {
            value = config.transform(value);
          }

          result[key] = value;
        } catch (error) {
          if (verbose) {
            console.error(`Error extracting field '${key}':`, error);
          }
          result[key] = null;
        }
      }
    } catch (error) {
      if (verbose) {
        console.error('Error in extractStructured:', error);
      }
    }

    return result;
  }

  /**
   * Extract array of structured data
   */
  extractStructuredList(
    html: string,
    containerSelector: string,
    schema: ExtractionSchema,
    containerType: 'xpath' | 'css' = 'xpath',
    options?: { verbose?: boolean },
  ): Record<string, any>[] {
    const verbose = options?.verbose ?? this.defaultOptions.verbose ?? false;
    const results: Record<string, any>[] = [];

    if (verbose) {
      console.log(
        `🔍 extractStructuredList - Container: "${containerSelector}", Type: ${containerType}`,
      );
      console.log(`📋 Schema fields: ${Object.keys(schema).join(', ')}`);
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
        console.log(`📦 Found ${containers.length} containers to process`);
      }

      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];

        if (verbose) {
          console.log(
            `\n📦 Processing container ${i + 1}/${containers.length}`,
          );
        }

        const containerHTML = this.getElementHTML(container);
        const item = this.extractStructured(containerHTML, schema, { verbose });
        results.push(item);

        if (verbose) {
          const extractedFields = Object.entries(item)
            .filter(
              ([_, value]) =>
                value !== null && value !== undefined && value !== '',
            )
            .map(([key, _]) => key);
          console.log(
            `✅ Container ${i + 1} extracted fields: ${extractedFields.join(', ')}`,
          );
        }
      }

      if (verbose) {
        console.log(
          `\n🎯 extractStructuredList completed: ${results.length} items extracted`,
        );
      }
    } catch (error) {
      if (verbose) {
        console.error('❌ Error in extractStructuredList:', error);
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
            console.error('XPath evaluation error:', error);
          }
        });

        // Allow warnings but filter out CSS-related ones
        virtualConsole.on('warn', (warning) => {
          const warningString = warning?.toString() || '';
          const isCSSWarning =
            warningString.includes('CSS') ||
            warningString.includes('stylesheet');

          if (!isCSSWarning) {
            console.warn('XPath evaluation warning:', warning);
          }
        });

        // Allow info and log messages in verbose mode
        virtualConsole.on('info', (...args) => {
          if (verbose) console.info('XPath info:', ...args);
        });

        virtualConsole.on('log', (...args) => {
          if (verbose) console.log('XPath log:', ...args);
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
        console.log(`XPath query "${xpath}" returned no results`);
      } else if (verbose) {
        console.log(`XPath query "${xpath}" returned ${nodes.length} results`);
      }

      return nodes;
    } catch (error) {
      if (verbose) {
        console.error('XPath evaluation error:', error);
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
  ): string | null {
    try {
      // Handle attribute selectors differently
      if (attribute && !selector.includes('/@')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        if (elements.length > 0) {
          const element = elements[0] as any;
          return element.getAttribute ? element.getAttribute(attribute) : null;
        }
        return null;
      }

      // Handle text() selectors
      if (selector.includes('/text()')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        if (elements.length > 0) {
          const textNode = elements[0] as any;
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
          return attrNode.value || attrNode.nodeValue || String(attrNode);
        }
        return null;
      }

      // Handle regular element selectors
      const elements = this.evaluateXPath(html, selector, verbose);
      if (elements.length > 0) {
        const element = elements[0] as any;
        if (attribute) {
          return element.getAttribute ? element.getAttribute(attribute) : null;
        }
        return element.textContent || element.innerText || '';
      }

      return null;
    } catch (error) {
      if (verbose) {
        console.error('Error in extractSingleXPath:', error);
      }
      return null;
    }
  }

  private extractMultipleXPath(
    html: string,
    selector: string,
    attribute?: string,
    verbose = false,
  ): string[] {
    try {
      const results: string[] = [];

      // Handle attribute selectors differently
      if (attribute && !selector.includes('/@')) {
        const elements = this.evaluateXPath(html, selector, verbose);
        for (const element of elements) {
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
        const value = attribute
          ? (element as any).getAttribute
            ? (element as any).getAttribute(attribute)
            : null
          : (element as any).textContent || (element as any).innerText || '';

        if (value) results.push(value);
      }

      return results;
    } catch (error) {
      if (verbose) {
        console.error('Error in extractMultipleXPath:', error);
      }
      return [];
    }
  }

  private extractSingleCSS(
    html: string,
    selector: string,
    attribute?: string,
  ): string | null {
    try {
      const $ = cheerio.load(html);
      const element = $(selector).first();

      if (element.length === 0) return null;

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
  ): string[] {
    try {
      const $ = cheerio.load(html);
      const elements = $(selector);
      const results: string[] = [];

      elements.each((_, element) => {
        const $element = $(element);
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
}
