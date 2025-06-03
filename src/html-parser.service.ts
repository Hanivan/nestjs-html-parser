import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';

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
}

@Injectable()
export class HtmlParserService {
  private defaultOptions: HtmlParserOptions = {
    timeout: 10000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  constructor() {}

  /**
   * Fetch HTML content from a URL
   */
  async fetchHtml(url: string, options?: HtmlParserOptions): Promise<string> {
    const config = { ...this.defaultOptions, ...options };

    try {
      const response = await axios.get(url, {
        timeout: config.timeout,
        headers: {
          'User-Agent': config.userAgent,
          ...config.headers,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch HTML from ${url}: ${error.message}`);
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
}
