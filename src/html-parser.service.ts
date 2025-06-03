import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { JSDOM } from 'jsdom';
import { SocksProxyAgent } from 'socks-proxy-agent';

export interface ProxyConfig {
  url: string;
  type?: 'http' | 'https' | 'socks4' | 'socks5';
  username?: string;
  password?: string;
}

export interface HtmlFetchResponse {
  data: string;
  headers: Record<string, string>;
  status: number;
  statusText: string;
}

export interface ExtractionSchema {
  [key: string]: {
    selector: string;
    type: 'xpath' | 'css';
    attribute?: string;
    transform?: (value: string) => any;
  };
}

export interface HtmlParserOptions {
  timeout?: number;
  headers?: Record<string, string>;
  userAgent?: string;
  useRandomUserAgent?: boolean;
  proxy?: ProxyConfig;
  retries?: number;
  retryDelay?: number;
}

@Injectable()
export class HtmlParserService {
  private defaultOptions: HtmlParserOptions = {
    timeout: 10000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    useRandomUserAgent: false,
    retries: 3,
    retryDelay: 1000,
  };

  constructor() {}

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
  ): string | null {
    try {
      if (type === 'xpath') {
        return this.extractSingleXPath(html, selector, attribute);
      } else {
        return this.extractSingleCSS(html, selector, attribute);
      }
    } catch (error) {
      throw new Error(`Failed to extract single value: ${error.message}`);
    }
  }

  /**
   * Extract multiple matching values
   */
  extractMultiple(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
    attribute?: string,
  ): string[] {
    try {
      if (type === 'xpath') {
        return this.extractMultipleXPath(html, selector, attribute);
      } else {
        return this.extractMultipleCSS(html, selector, attribute);
      }
    } catch (error) {
      throw new Error(`Failed to extract multiple values: ${error.message}`);
    }
  }

  /**
   * Extract text content specifically
   */
  extractText(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
  ): string | null {
    try {
      if (type === 'xpath') {
        return this.extractSingleXPath(html, selector);
      } else {
        return this.extractSingleCSS(html, selector);
      }
    } catch (error) {
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract attribute values
   */
  extractAttributes(
    html: string,
    selector: string,
    attribute: string,
    type: 'xpath' | 'css' = 'xpath',
  ): string[] {
    try {
      return this.extractMultiple(html, selector, type, attribute);
    } catch (error) {
      throw new Error(`Failed to extract attributes: ${error.message}`);
    }
  }

  /**
   * Check if elements exist
   */
  exists(
    html: string,
    selector: string,
    type: 'xpath' | 'css' = 'xpath',
  ): boolean {
    try {
      if (type === 'xpath') {
        return this.evaluateXPath(html, selector).length > 0;
      } else {
        const $ = cheerio.load(html);
        return $(selector).length > 0;
      }
    } catch (error) {
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
  ): number {
    try {
      if (type === 'xpath') {
        return this.evaluateXPath(html, selector).length;
      } else {
        const $ = cheerio.load(html);
        return $(selector).length;
      }
    } catch (error) {
      return 0;
    }
  }

  /**
   * Extract data using a schema object
   */
  extractStructured(
    html: string,
    schema: ExtractionSchema,
  ): Record<string, any> {
    try {
      const result: Record<string, any> = {};

      for (const [key, config] of Object.entries(schema)) {
        const value = this.extractSingle(
          html,
          config.selector,
          config.type,
          config.attribute,
        );

        if (value !== null) {
          result[key] = config.transform ? config.transform(value) : value;
        } else {
          result[key] = null;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to extract structured data: ${error.message}`);
    }
  }

  /**
   * Extract arrays of structured data
   */
  extractStructuredList(
    html: string,
    containerSelector: string,
    schema: ExtractionSchema,
    containerType: 'xpath' | 'css' = 'xpath',
  ): Record<string, any>[] {
    try {
      const results: Record<string, any>[] = [];

      if (containerType === 'xpath') {
        const elements = this.evaluateXPath(html, containerSelector);
        for (const element of elements) {
          const containerHtml =
            (element as any).outerHTML || this.getElementHTML(element);
          const item = this.extractStructured(containerHtml, schema);
          results.push(item);
        }
      } else {
        const $ = cheerio.load(html);
        $(containerSelector).each((_, element) => {
          const containerHtml = $.html(element);
          const item = this.extractStructured(containerHtml, schema);
          results.push(item);
        });
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to extract structured list: ${error.message}`);
    }
  }

  // Private helper methods

  private evaluateXPath(html: string, xpath: string): Node[] {
    try {
      const dom = new JSDOM(html, { contentType: 'text/html' });
      const document = dom.window.document;

      // Create XPath evaluator
      const result = document.evaluate(
        xpath,
        document,
        null,
        dom.window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null,
      );

      const nodes: Node[] = [];
      for (let i = 0; i < result.snapshotLength; i++) {
        const node = result.snapshotItem(i);
        if (node) {
          nodes.push(node);
        }
      }

      return nodes;
    } catch (error) {
      return [];
    }
  }

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
  ): string | null {
    try {
      // Handle attribute selectors differently
      if (attribute && !selector.includes('/@')) {
        const elements = this.evaluateXPath(html, selector);
        if (elements.length > 0) {
          const element = elements[0] as any;
          return element.getAttribute ? element.getAttribute(attribute) : null;
        }
        return null;
      }

      // Handle text() selectors
      if (selector.includes('/text()')) {
        const elements = this.evaluateXPath(html, selector);
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
        const elements = this.evaluateXPath(html, selector);
        if (elements.length > 0) {
          const attrNode = elements[0] as any;
          return attrNode.value || attrNode.nodeValue || String(attrNode);
        }
        return null;
      }

      // Handle regular element selectors
      const elements = this.evaluateXPath(html, selector);
      if (elements.length > 0) {
        const element = elements[0] as any;
        if (attribute) {
          return element.getAttribute ? element.getAttribute(attribute) : null;
        }
        return element.textContent || element.innerText || '';
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private extractMultipleXPath(
    html: string,
    selector: string,
    attribute?: string,
  ): string[] {
    try {
      const results: string[] = [];

      // Handle attribute selectors differently
      if (attribute && !selector.includes('/@')) {
        const elements = this.evaluateXPath(html, selector);
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
        const elements = this.evaluateXPath(html, selector);
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
        const elements = this.evaluateXPath(html, selector);
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
      const elements = this.evaluateXPath(html, selector);
      for (const element of elements) {
        if (attribute) {
          const value = (element as any).getAttribute
            ? (element as any).getAttribute(attribute)
            : null;
          if (value) results.push(value);
        } else {
          const text =
            (element as any).textContent || (element as any).innerText || '';
          if (text.trim()) results.push(text.trim());
        }
      }

      return results;
    } catch (error) {
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
