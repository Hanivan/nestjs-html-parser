import { ExtractionSchema, HtmlFetchResponse, HtmlParserOptions, ProxyConfig } from './types';
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
export declare class HtmlParserService {
    private readonly logger;
    private readonly loggerLevel;
    /**
     * Default configuration options for HTML parsing operations
     */
    private defaultOptions;
    /**
     * Initialize the HTML Parser Service
     */
    constructor(loggerLevel?: string);
    /**
     * Suppress console output when verbose is false
     */
    private suppressConsole;
    /**
     * Restore console output
     */
    private restoreConsole;
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
    fetchHtml(url: string, options?: HtmlParserOptions): Promise<HtmlFetchResponse>;
    /**
     * Create a proxy agent based on proxy configuration
     */
    private createProxyAgent;
    /**
     * Detect proxy type from URL
     */
    private detectProxyType;
    /**
     * Delay function for retries
     */
    private delay;
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
    getRandomUserAgent(): Promise<string>;
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
    testProxy(proxy: ProxyConfig, testUrl?: string): Promise<boolean>;
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
    extractSingle<T = string>(html: string, selector: string, type?: 'xpath' | 'css', attribute?: string, options?: {
        verbose?: boolean;
        transform?: (value: string) => T;
    }): T | null;
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
    extractMultiple<T = string>(html: string, selector: string, type?: 'xpath' | 'css', attribute?: string, options?: {
        verbose?: boolean;
        transform?: (value: string) => T;
    }): T[];
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
    extractText<T = string>(html: string, selector: string, type?: 'xpath' | 'css', options?: {
        verbose?: boolean;
        transform?: (value: string) => T;
    }): T | null;
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
    extractAttributes<T = string>(html: string, selector: string, attribute: string, type?: 'xpath' | 'css', options?: {
        verbose?: boolean;
        transform?: (value: string) => T;
    }): T[];
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
    exists(html: string, selector: string, type?: 'xpath' | 'css', options?: {
        verbose?: boolean;
    }): boolean;
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
    count(html: string, selector: string, type?: 'xpath' | 'css', options?: {
        verbose?: boolean;
    }): number;
    /**
     * Extract structured data from HTML using a schema definition
     *
     * Applies a schema object to extract multiple related fields from HTML content.
     * Each field in the schema defines its own selector, type, optional attribute,
     * and transformation function. Useful for extracting complex data structures
     * like product information, article metadata, or user profiles.
     *
     * @param html - HTML content to parse
     * @param schema - Schema object defining fields to extract
     * @param options - Parsing options
     * @param options.verbose - Enable verbose logging for debugging
     *
     * @returns Object with extracted data matching the schema structure
     *
     * @example
     * ```typescript
     * const html = `
     *   <article>
     *     <h1>Product Name</h1>
     *     <span class="price">$29.99</span>
     *     <img src="/image.jpg" alt="Product">
     *     <div class="rating" data-stars="4">★★★★☆</div>
     *   </article>
     * `;
     *
     * // Define typed interface
     * interface Product {
     *   title: string;
     *   price: number;
     *   image: string;
     *   rating: number;
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
     *   }
     * };
     *
     * const product = parser.extractStructured<Product>(html, productSchema);
     * // Result: Product type with full type safety
     * // {
     * //   title: "Product Name",
     * //   price: 29.99,
     * //   image: "/image.jpg",
     * //   rating: 4
     * // }
     * ```
     */
    extractStructured<T = Record<string, any>>(html: string, schema: ExtractionSchema<T>, options?: {
        verbose?: boolean;
    }): T;
    /**
     * Extract array of structured data from repeating HTML elements
     *
     * Finds multiple container elements and applies a schema to each one,
     * returning an array of extracted objects. Perfect for processing
     * lists of items like articles, products, comments, or search results.
     * Each container is processed independently with the same schema.
     *
     * @param html - HTML content to parse
     * @param containerSelector - XPath or CSS selector to find container elements
     * @param schema - Schema object defining fields to extract from each container
     * @param containerType - Type of container selector: 'xpath' (default) or 'css'
     * @param options - Parsing options
     * @param options.verbose - Enable verbose logging for debugging
     *
     * @returns Array of objects with extracted data matching the schema structure
     *
     * @example
     * ```typescript
     * const html = `
     *   <div class="products">
     *     <div class="product">
     *       <h3>Product A</h3>
     *       <span class="price">$19.99</span>
     *       <img src="/a.jpg" alt="Product A">
     *     </div>
     *     <div class="product">
     *       <h3>Product B</h3>
     *       <span class="price">$29.99</span>
     *       <img src="/b.jpg" alt="Product B">
     *     </div>
     *   </div>
     * `;
     *
     * // Define typed interface
     * interface Product {
     *   name: string;
     *   price: number;
     *   image: string;
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
     *     transform: (price) => parseFloat(price.replace('$', ''))
     *   },
     *   image: {
     *     selector: './/img',
     *     type: 'xpath',
     *     attribute: 'src'
     *   }
     * };
     *
     * const products = parser.extractStructuredList<Product>(
     *   html,
     *   '//div[@class="product"]',
     *   productSchema
     * );
     *
     * // Result: Product[] with full type safety
     * // [
     * //   { name: "Product A", price: 19.99, image: "/a.jpg" },
     * //   { name: "Product B", price: 29.99, image: "/b.jpg" }
     * // ]
     *
     * // Using CSS selector for containers
     * const productsCSS = parser.extractStructuredList<Product>(
     *   html,
     *   '.product',
     *   productSchema,
     *   'css'
     * );
     * ```
     */
    extractStructuredList<T = Record<string, any>>(html: string, containerSelector: string, schema: ExtractionSchema<T>, containerType?: 'xpath' | 'css', options?: {
        verbose?: boolean;
    }): T[];
    /**
     * Evaluate XPath expression and return matching nodes
     */
    private evaluateXPath;
    private getElementHTML;
    private extractSingleXPath;
    private extractMultipleXPath;
    private extractSingleCSS;
    private extractMultipleCSS;
    private normalizeHeaders;
    /**
     * Categorize error types for better handling and retry logic
     *
     * @param error - The error to categorize
     * @returns Object with error type and description
     */
    private categorizeError;
    /**
     * Determine if an error should trigger a retry based on configuration
     *
     * @param errorInfo - Categorized error information
     * @param config - Parser configuration options
     * @returns Whether to retry the request
     */
    private shouldRetryOnError;
}
