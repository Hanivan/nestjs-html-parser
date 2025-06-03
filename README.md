# @hanivanrizky/nestjs-html-parser

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A powerful NestJS package for parsing HTML content using XPath (primary) and CSS selectors (secondary) with comprehensive extraction capabilities.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@hanivanrizky/nestjs-html-parser" target="_blank"><img src="https://img.shields.io/npm/v/@hanivanrizky/nestjs-html-parser.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@hanivanrizky/nestjs-html-parser" target="_blank"><img src="https://img.shields.io/npm/l/@hanivanrizky/nestjs-html-parser.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@hanivanrizky/nestjs-html-parser" target="_blank"><img src="https://img.shields.io/npm/dm/@hanivanrizky/nestjs-html-parser.svg" alt="NPM Downloads" /></a>
</p>

## Features

- **🎯 XPath Support (Primary)**: Full XPath 1.0 support for precise element selection
- **🎨 CSS Selectors (Secondary)**: jQuery-style CSS selectors for familiar syntax
- **📋 Multiple Extraction Methods**: Single values, multiple values, attributes, and structured data
- **🔍 Element Analysis**: Check existence and count elements
- **📊 Structured Extraction**: Extract data using schema objects for complex data structures
- **📚 List Extraction**: Extract arrays of structured data
- **🌐 HTTP Fetching**: Built-in HTML fetching with customizable options
- **🛡️ Error Handling**: Graceful error handling and fallbacks
- **🔄 Random User Agents**: Built-in random user agent generation for stealth scraping
- **🔗 Proxy Support**: HTTP, HTTPS, and SOCKS proxy support with authentication
- **🔁 Retry Logic**: Configurable retry mechanism with exponential backoff
- **🔇 Verbose Control**: Optional verbose mode for debugging (CSS errors suppressed by default)
- **🔒 SSL Error Handling**: Comprehensive SSL certificate error handling and bypass options
- **💀 Dead Domain Support**: Advanced error categorization for dead/unreachable domains
- **🔄 Smart Retry Logic**: Error-type-specific retry strategies for different network issues
- **🎯 TypeScript Generics**: Full generic type support for compile-time type safety
- **🧪 Fully Tested**: Comprehensive test suite with real-world examples

## SSL and Error Handling

The library provides robust handling for common web scraping challenges:

### SSL Certificate Issues

Handle websites with SSL problems (expired, self-signed, or invalid certificates):

```typescript
// Handle self-signed certificates
const response = await htmlParser.fetchHtml('https://self-signed-site.com', {
  rejectUnauthorized: false,
  retryOnErrors: { ssl: true }
});

// Completely ignore SSL errors (use with caution)
const response = await htmlParser.fetchHtml('https://expired-cert-site.com', {
  ignoreSSLErrors: true
});

// Robust configuration for problematic sites
const response = await htmlParser.fetchHtml('https://unreliable-site.com', {
  rejectUnauthorized: false,
  timeout: 15000,
  retries: 5,
  retryDelay: 2000,
  retryOnErrors: {
    ssl: true,
    timeout: true,
    dns: true,
    connectionRefused: true
  }
});
```

### Dead Domain Handling

Automatically detect and handle various types of network failures:

```typescript
// Configure retry behavior for different error types
const response = await htmlParser.fetchHtml('https://might-be-dead.com', {
  timeout: 10000,
  retries: 3,
  retryDelay: 2000,
  retryOnErrors: {
    dns: true,           // Retry DNS resolution failures
    timeout: true,       // Retry connection timeouts  
    connectionRefused: true, // Retry connection refused errors
    ssl: false           // Don't retry SSL errors (handle differently)
  },
  verbose: true  // See detailed error categorization
});
```

### Error Categories

The library automatically categorizes errors for better handling:

- **SSL Errors**: Certificate issues, self-signed certificates, expired certificates
- **DNS Errors**: Domain not found, DNS resolution failures
- **Timeout Errors**: Connection timeouts, request timeouts
- **Connection Errors**: Connection refused, network unreachable, connection reset
- **HTTP Errors**: 404, 500, 503, and other HTTP status errors
- **Rate Limiting**: 429 errors and rate limit responses

### Advanced Error Handling Example

```typescript
import { testUrlWithRobustConfig } from '@hanivanrizky/nestjs-html-parser/ssl-and-dead-domains';

// Test a potentially problematic URL with robust configuration
const result = await testUrlWithRobustConfig('https://problematic-site.com', true);

if (result.success) {
  console.log(`Successfully scraped: ${result.title}`);
} else {
  console.log(`Failed with ${result.errorType}: ${result.error}`);
  
  // Handle specific error types
  switch (result.errorType) {
    case 'ssl':
      console.log('Try with ignoreSSLErrors: true');
      break;
    case 'dns':
      console.log('Domain appears to be dead');
      break;
    case 'timeout':
      console.log('Site is very slow, try increasing timeout');
      break;
  }
}
```

## Verbose Mode & Error Handling

By default, the library suppresses CSS parsing errors and other non-critical JSDOM warnings to provide clean output. You can enable verbose mode for debugging:

```typescript
// Suppress CSS errors and warnings (default)
const title = htmlParser.extractSingle(html, '//title/text()');

// Enable verbose mode for debugging
const title = htmlParser.extractSingle(html, '//title/text()', 'xpath', undefined, { verbose: true });

// Verbose mode in fetchHtml
const response = await htmlParser.fetchHtml('https://example.com', {
  verbose: true,  // Shows detailed errors and warnings
  useRandomUserAgent: true
});

// Verbose mode in structured extraction
const data = htmlParser.extractStructured(html, schema, { verbose: true });
const list = htmlParser.extractStructuredList(html, '//div', schema, 'xpath', { verbose: true });
```

### Error Suppression Benefits

- **Clean Output**: No noisy CSS parsing errors from websites with malformed CSS
- **Better UX**: Focus on actual parsing errors, not browser rendering issues  
- **Debugging Control**: Enable verbose mode only when needed
- **Production Ready**: Silent operation by default for production use

## Proxy & User Agent Features

### Random User Agents

The package includes built-in support for random user agent generation using `@ahmedrangel/rand-user-agent`:

```typescript
// Generate a random user agent
const randomUA = await htmlParser.getRandomUserAgent();
console.log(randomUA);
// Output: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...

// Fetch with random user agent
const html = await htmlParser.fetchHtml('https://example.com', {
  useRandomUserAgent: true
});
```

### Proxy Support

Full proxy support with multiple protocols and authentication:

```typescript
import { ProxyConfig } from '@hanivanrizky/nestjs-html-parser';

// HTTP Proxy with separate credentials
const httpProxy: ProxyConfig = {
  url: 'http://proxy.example.com:8080',
  type: 'http',
  username: 'your-username', // optional
  password: 'your-password'  // optional
};

// HTTP Proxy with credentials in URL
const httpProxyWithUrlCreds: ProxyConfig = {
  url: 'http://username:password@proxy.example.com:8080',
  type: 'http'
};

// SOCKS5 Proxy with URL credentials
const socksProxy: ProxyConfig = {
  url: 'socks5://username:password@proxy.example.com:1080',
  type: 'socks5'
};

// Mixed credentials (separate fields take precedence)
const mixedProxy: ProxyConfig = {
  url: 'http://olduser:oldpass@proxy.example.com:8080',
  username: 'newuser',    // This will be used
  password: 'newpass',    // This will be used
  type: 'http'
};

// Use proxy with random user agent
const html = await htmlParser.fetchHtml('https://example.com', {
  proxy: httpProxy,
  useRandomUserAgent: true,
  retries: 3,
  retryDelay: 2000
});

// Test proxy connection
const isWorking = await htmlParser.testProxy(httpProxy);
console.log(`Proxy status: ${isWorking ? 'Working' : 'Failed'}`);
```

#### Supported Proxy Formats

```typescript
// 1. Separate credentials (classic method)
{
  url: 'http://proxy.example.com:8080',
  username: 'user',
  password: 'pass'
}

// 2. Credentials in URL (new method)
{
  url: 'http://user:pass@proxy.example.com:8080'
}

// 3. SOCKS with URL credentials
{
  url: 'socks5://user:pass@proxy.example.com:1080'
}

// 4. Mixed (separate credentials override URL credentials)
{
  url: 'http://ignored:ignored@proxy.example.com:8080',
  username: 'actual-user',    // Takes precedence
  password: 'actual-pass'     // Takes precedence
}
```

### Advanced Fetching Options

```typescript
const html = await htmlParser.fetchHtml('https://example.com', {
  // User Agent options
  useRandomUserAgent: true,        // Use random user agent
  userAgent: 'Custom-Bot/1.0',     // Or specify custom user agent
  
  // Proxy configuration
  proxy: {
    url: 'socks5://proxy.example.com:1080',
    type: 'socks5',
    username: 'user',
    password: 'pass'
  },
  
  // SSL handling
  rejectUnauthorized: false,       // Accept self-signed certificates
  ignoreSSLErrors: false,          // Don't completely ignore SSL
  
  // Retry configuration
  retries: 3,                      // Number of retry attempts
  retryDelay: 1000,               // Delay between retries (ms)
  maxRedirects: 5,                // Maximum redirects to follow
  retryOnErrors: {                // Retry on specific error types
    ssl: true,
    timeout: true,
    dns: true,
    connectionRefused: true
  },
  
  // Standard options
  timeout: 15000,                 // Request timeout
  headers: {                      // Custom headers
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9'
  },
  
  verbose: true                   // Enable detailed logging
});
```

## Installation

```bash
yarn add @hanivanrizky/nestjs-html-parser
# or
npm install @hanivanrizky/nestjs-html-parser
```

## Quick Start

### Import the Module

```typescript
import { Module } from '@nestjs/common';
import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';

@Module({
  imports: [HtmlParserModule],
})
export class AppModule {}
```

### Inject the Service

```typescript
import { Injectable } from '@nestjs/common';
import { HtmlParserService } from '@hanivanrizky/nestjs-html-parser';

@Injectable()
export class YourService {
  constructor(private readonly htmlParser: HtmlParserService) {}

  async parseHackerNews() {
    // Fetch HTML with response metadata
    const response = await this.htmlParser.fetchHtml('https://news.ycombinator.com/');
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    // Extract page title from the HTML data
    const title = this.htmlParser.extractSingle(response.data, '//title/text()');
    
    // Extract all story titles
    const storyTitles = this.htmlParser.extractMultiple(
      response.data, 
      '//span[@class="titleline"]/a/text()'
    );
    
    return { title, storyTitles, status: response.status };
  }
}
```

## fetchHtml Response Format

The `fetchHtml` method returns a `HtmlFetchResponse` object with complete HTTP response information:

```typescript
interface HtmlFetchResponse {
  data: string;           // HTML content
  headers: Record<string, string>; // Response headers
  status: number;         // HTTP status code (200, 404, etc.)
  statusText: string;     // HTTP status text ("OK", "Not Found", etc.)
}

// Example usage
const response = await htmlParser.fetchHtml('https://example.com');

console.log(`Content: ${response.data}`);
console.log(`Status: ${response.status} ${response.statusText}`);
console.log(`Content-Type: ${response.headers['content-type']}`);
console.log(`Server: ${response.headers.server}`);

// Use the HTML data for extraction
const title = htmlParser.extractSingle(response.data, '//title/text()');
```

### Practical Examples

```typescript
// Example 1: Status-based conditional processing
const response = await htmlParser.fetchHtml('https://example.com');

if (response.status === 200) {
  // Success - process content
  const title = htmlParser.extractSingle(response.data, '//title/text()');
  console.log(`Page title: ${title}`);
} else if (response.status === 404) {
  console.log('Page not found');
} else {
  console.log(`Error: ${response.status} ${response.statusText}`);
}

// Example 2: Content-type based processing
const contentType = response.headers['content-type'];
if (contentType?.includes('text/html')) {
  // Process HTML content
  const links = htmlParser.extractMultiple(response.data, 'a', 'css', 'href');
} else if (contentType?.includes('application/json')) {
  // Handle JSON response
  const jsonData = JSON.parse(response.data);
}

// Example 3: Server and performance analysis
console.log(`Server: ${response.headers.server}`);
console.log(`Content-Length: ${response.headers['content-length']}`);
console.log(`Cache-Control: ${response.headers['cache-control']}`);

// Example 4: Comprehensive response analysis
const analysisReport = {
  url: 'https://example.com',
  status: response.status,
  statusText: response.statusText,
  server: response.headers.server,
  contentType: response.headers['content-type'],
  contentLength: response.data.length,
  hasTitle: htmlParser.exists(response.data, '//title'),
  linkCount: htmlParser.count(response.data, 'a', 'css'),
  timestamp: new Date().toISOString()
};
```

## Demo Scripts

For convenience, we've included npm/yarn scripts to run the examples easily:

```bash
# Show available demos
yarn demo

# Run Hacker News parsing demo
yarn demo:hackernews

# Run Japanese learning website (Watanoc) parsing demo
yarn demo:watanoc

# Run Indonesian anime site (Otakudesu) parsing demo
yarn demo:otakudesu

# Run proxy and user agent demo
yarn demo:proxy

# Run HtmlFetchResponse features demo
yarn demo:response

# Run SSL and dead domain handling demo
yarn demo:ssl

# Run TypeScript generic types demo
yarn demo:typed

# Run all demos sequentially
yarn demo:all

# Verbose mode demos (show detailed errors and debugging info)
yarn demo:hackernews:verbose
yarn demo:watanoc:verbose
yarn demo:otakudesu:verbose
yarn demo:proxy:verbose
yarn demo:response:verbose
yarn demo:ssl:verbose
yarn demo:typed:verbose
```

### Verbose Mode Benefits
- **Clean Default Output**: No CSS parsing errors or JSDOM warnings
- **Debug When Needed**: Enable verbose mode to see detailed error information
- **Command Line Control**: Use `--verbose` or `-v` flags with ts-node directly
- **Production Ready**: Silent operation by default for clean logs

These scripts provide an easy way to see the HTML parser in action with real-world websites, demonstrating various parsing techniques, proxy usage, random user agent capabilities, and comprehensive error handling.

## API Reference

### Core Methods

#### `fetchHtml(url: string, options?: HtmlParserOptions): Promise<HtmlFetchResponse>`

Fetch HTML content from a URL with comprehensive error handling.

```typescript
const response = await htmlParser.fetchHtml('https://example.com', {
  timeout: 10000,
  headers: { 'User-Agent': 'Custom Agent' },
  retryOnErrors: {
    ssl: true,
    timeout: true,
    dns: true,
    connectionRefused: true
  }
});
```

#### `extractSingle<T = string>(html: string, selector: string, type?: 'xpath' | 'css', attribute?: string, options?: { verbose?: boolean; transform?: (value: string) => T }): T | null`

Extract a single value using XPath or CSS selector with type safety.

```typescript
// Using XPath (default)
const title = htmlParser.extractSingle<string>(html, '//title/text()');

// Using CSS selector
const title = htmlParser.extractSingle<string>(html, 'title', 'css');

// Extract attribute with transformation
const id = htmlParser.extractSingle<number>(html, '//div[@data-id]', 'xpath', 'data-id', {
  transform: (value: string) => parseInt(value)
});

// Extract with boolean transformation
const isActive = htmlParser.extractSingle<boolean>(html, '//div/@data-active', 'xpath', undefined, {
  transform: (value: string) => value === 'true'
});
```

#### `extractMultiple<T = string>(html: string, selector: string, type?: 'xpath' | 'css', attribute?: string, options?: { verbose?: boolean; transform?: (value: string) => T }): T[]`

Extract multiple matching values with type safety.

```typescript
// Extract all links
const links = htmlParser.extractMultiple<string>(html, '//a/text()');

// Extract all href attributes
const urls = htmlParser.extractMultiple<string>(html, '//a', 'xpath', 'href');

// Extract with transformation
const prices = htmlParser.extractMultiple<number>(html, '//span[@class="price"]/text()', 'xpath', undefined, {
  transform: (value: string) => parseFloat(value.replace('$', ''))
});
```

#### `extractText<T = string>(html: string, selector: string, type?: 'xpath' | 'css', options?: { verbose?: boolean; transform?: (value: string) => T }): T | null`

Extract text content specifically with type safety.

```typescript
const text = htmlParser.extractText<string>(html, '//p[@class="content"]');

// Extract with transformation
const wordCount = htmlParser.extractText<number>(html, '//p[@class="content"]', 'xpath', {
  transform: (text: string) => text.split(' ').length
});
```

#### `extractAttributes<T = string>(html: string, selector: string, attribute: string, type?: 'xpath' | 'css', options?: { verbose?: boolean; transform?: (value: string) => T }): T[]`

Extract attribute values from multiple elements with type safety.

```typescript
const imgSources = htmlParser.extractAttributes<string>(html, '//img', 'src');

// Extract with transformation
const ids = htmlParser.extractAttributes<number>(html, '//div', 'data-id', 'xpath', {
  transform: (value: string) => parseInt(value)
});
```

#### `exists(html: string, selector: string, type?: 'xpath' | 'css'): boolean`

Check if elements exist.

```typescript
const hasComments = htmlParser.exists(html, '//div[@class="comments"]');
```

#### `count(html: string, selector: string, type?: 'xpath' | 'css'): number`

Count matching elements.

```typescript
const commentCount = htmlParser.count(html, '//div[@class="comment"]');
```

#### `getRandomUserAgent(): Promise<string>`

Generate a random user agent string.

```typescript
const randomUA = await htmlParser.getRandomUserAgent();
console.log(randomUA);
// Output: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
```

#### `testProxy(proxy: ProxyConfig, testUrl?: string): Promise<boolean>`

Test if a proxy connection is working.

```typescript
const proxyConfig = {
  url: 'http://proxy.example.com:8080',
  type: 'http' as const,
  username: 'user',
  password: 'pass'
};

const isWorking = await htmlParser.testProxy(proxyConfig);
console.log(`Proxy is ${isWorking ? 'working' : 'not working'}`);
```

### Advanced Methods

#### `extractStructured<T = Record<string, any>>(html: string, schema: ExtractionSchema<T>, options?: { verbose?: boolean }): T`

Extract data using a typed schema object.

```typescript
import { ExtractionSchema } from '@hanivanrizky/nestjs-html-parser';

// Define typed interface
interface Article {
  title: string;
  author: string;
  wordCount: number;
  publishDate: Date;
}

// Create typed schema
const schema: ExtractionSchema<Article> = {
  title: {
    selector: '//title/text()',
    type: 'xpath'
  },
  author: {
    selector: '//meta[@name="author"]',
    type: 'xpath',
    attribute: 'content'
  },
  wordCount: {
    selector: '//article',
    type: 'css',
    transform: (text: string) => text.split(' ').length
  },
  publishDate: {
    selector: '//time',
    type: 'xpath',
    attribute: 'datetime',
    transform: (value: string) => new Date(value)
  }
};

const result = htmlParser.extractStructured<Article>(html, schema);
// Result: Article type with full type safety
// { title: "Page Title", author: "John Doe", wordCount: 150, publishDate: Date }
```

#### `extractStructuredList<T = Record<string, any>>(html: string, containerSelector: string, schema: ExtractionSchema<T>, containerType?: 'xpath' | 'css', options?: { verbose?: boolean }): T[]`

Extract arrays of typed structured data.

```typescript
// Define typed interface
interface Product {
  name: string;
  price: number;
  rating: number;
  inStock: boolean;
}

// Create typed schema
const productSchema: ExtractionSchema<Product> = {
  name: {
    selector: './/h2/text()',
    type: 'xpath'
  },
  price: {
    selector: './/span[@class="price"]/text()',
    type: 'xpath',
    transform: (value: string) => parseFloat(value.replace('$', ''))
  },
  rating: {
    selector: './/div[@data-rating]',
    type: 'xpath',
    attribute: 'data-rating',
    transform: (value: string) => parseFloat(value)
  },
  inStock: {
    selector: './/span[@class="stock"]',
    type: 'xpath',
    transform: (value: string) => value.toLowerCase() === 'in stock'
  }
};

const products = htmlParser.extractStructuredList<Product>(
  html,
  '//div[@class="product"]',
  productSchema
);
// Result: Product[] with full type safety
```

## Real-World Examples

### SSL and Dead Domain Handling

```typescript
import { Injectable } from '@nestjs/common';
import { HtmlParserService } from '@hanivanrizky/nestjs-html-parser';

@Injectable()
export class RobustScrapingService {
  constructor(private readonly htmlParser: HtmlParserService) {}

  async scrapeWithErrorHandling(url: string) {
    try {
      // Robust configuration for problematic sites
      const response = await this.htmlParser.fetchHtml(url, {
        // SSL handling
        rejectUnauthorized: false,
        ignoreSSLErrors: false,
        
        // Timeouts and retries
        timeout: 15000,
        retries: 5,
        retryDelay: 2000,
        maxRedirects: 10,
        
        // Error-specific retry logic
        retryOnErrors: {
          ssl: true,              // Retry SSL errors
          timeout: true,          // Retry timeouts
          dns: true,              // Retry DNS failures
          connectionRefused: true // Retry connection refused
        },
        
        // Stealth options
        useRandomUserAgent: true,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache'
        },
        
        verbose: true  // See detailed error categorization
      });

      const title = this.htmlParser.extractSingle(response.data, '//title/text()');
      
      return {
        success: true,
        title,
        status: response.status,
        contentLength: response.data.length
      };

    } catch (error) {
      // Enhanced error handling with categorization
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Extract error type from enhanced error message
      const errorTypeMatch = errorMessage.match(/Error type: (\w+)/);
      const errorType = errorTypeMatch ? errorTypeMatch[1] : 'unknown';

      console.log(`❌ Failed to scrape ${url}: ${errorType}`);
      
      // Handle specific error types
      switch (errorType) {
        case 'ssl':
          console.log('💡 Try with ignoreSSLErrors: true for SSL issues');
          break;
        case 'dns':
          console.log('💀 Domain appears to be dead or unreachable');
          break;
        case 'timeout':
          console.log('⏰ Site is slow, consider increasing timeout');
          break;
        case 'connectionRefused':
          console.log('🚫 Server is refusing connections');
          break;
        case 'http':
          console.log('🌐 HTTP error - check if URL is correct');
          break;
      }

      return {
        success: false,
        error: errorMessage,
        errorType,
        url
      };
    }
  }
}
```

### Hacker News Scraper

```typescript
import { Injectable } from '@nestjs/common';
import { HtmlParserService, ExtractionSchema } from '@hanivanrizky/nestjs-html-parser';

@Injectable()
export class HackerNewsService {
  constructor(private readonly htmlParser: HtmlParserService) {}

  async getTopStories() {
    const html = await this.htmlParser.fetchHtml('https://news.ycombinator.com/');

    const storySchema: ExtractionSchema = {
      rank: {
        selector: './/span[@class="rank"]/text()',
        type: 'xpath',
        transform: (value: string) => parseInt(value.replace('.', ''))
      },
      title: {
        selector: './/span[@class="titleline"]/a/text()',
        type: 'xpath'
      },
      url: {
        selector: './/span[@class="titleline"]/a',
        type: 'xpath',
        attribute: 'href'
      },
      domain: {
        selector: './/span[@class="sitestr"]/text()',
        type: 'xpath'
      },
      score: {
        selector: './/span[@class="score"]/text()',
        type: 'xpath',
        transform: (value: string) => value ? parseInt(value.split(' ')[0]) : 0
      },
      author: {
        selector: './/a[@class="hnuser"]/text()',
        type: 'xpath'
      },
      commentsCount: {
        selector: './/a[contains(text(), "comments")]/text()',
        type: 'xpath',
        transform: (value: string) => {
          if (!value) return 0;
          const match = value.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }
      }
    };

    return this.htmlParser.extractStructuredList(
      html,
      '//tr[@class="athing"]',
      storySchema
    );
  }
}
```

### Japanese Learning Website (Watanoc.com)

This example demonstrates parsing a Japanese learning website with multi-language content, categories, and educational metadata.

```typescript
import { Injectable } from '@nestjs/common';
import { HtmlParserService, ExtractionSchema } from '@hanivanrizky/nestjs-html-parser';

@Injectable()
export class JapaneseLearningService {
  constructor(private readonly htmlParser: HtmlParserService) {}

  async getJapaneseLearningArticles() {
    const html = await this.htmlParser.fetchHtml('https://watanoc.com/');

    // Extract articles with difficulty levels and categories
    const articleSchema: ExtractionSchema = {
      title: {
        selector: './/h1/text() | .//h2/text() | .//h3/text()',
        type: 'xpath'
      },
      englishTitle: {
        selector: './/text()[contains(., "Shaved ice") or contains(., "Oiled Ramen") or contains(., "Vietnamese sandwich")]',
        type: 'xpath'
      },
      difficulty: {
        selector: './/text()[contains(., "n3") or contains(., "n4") or contains(., "n5")]',
        type: 'xpath',
        transform: (value: string) => {
          const match = value.match(/(n[3-5])/);
          return match ? match[1] : null;
        }
      },
      author: {
        selector: './/text()[contains(., "avatar")]',
        type: 'xpath',
        transform: (value: string) => value.replace('avatar', '').trim()
      },
      date: {
        selector: './/text()[contains(., "年") and contains(., "月") and contains(., "日")]',
        type: 'xpath'
      },
      category: {
        selector: './/text()[contains(., "食事") or contains(., "観光") or contains(., "イベント") or contains(., "文化")]',
        type: 'xpath'
      }
    };

    const articles = this.htmlParser.extractStructuredList(
      html,
      '//div[contains(text(), "肉玉そば") or contains(text(), "油そば") or contains(text(), "牛丼")]/..',
      articleSchema
    );

    return articles;
  }

  async analyzeEducationalContent() {
    const html = await this.htmlParser.fetchHtml('https://watanoc.com/');

    // Analyze different types of educational content
    const hasListening = this.htmlParser.exists(
      html, 
      '//text()[contains(., "リスニング") or contains(., "Listening")]'
    );
    
    const hasQuiz = this.htmlParser.exists(
      html, 
      '//text()[contains(., "クイズ") or contains(., "Quiz")]'
    );

    // Count articles by difficulty level
    const n3Count = this.htmlParser.count(html, '//text()[contains(., "n3")]');
    const n4Count = this.htmlParser.count(html, '//text()[contains(., "n4")]');
    const n5Count = this.htmlParser.count(html, '//text()[contains(., "n5")]');

    // Extract categories
    const categories = this.htmlParser.extractMultiple(
      html,
      '//text()[contains(., "しょくじ") or contains(., "かんこう") or contains(., "イベント")]'
    );

    return {
      features: {
        hasListening,
        hasQuiz
      },
      distribution: {
        n3: n3Count,
        n4: n4Count,
        n5: n5Count
      },
      categories: [...new Set(categories)]
    };
  }
}
```

### Key Features Demonstrated:

1. **Multi-language Content**: Extracting both Japanese and English content
2. **Educational Metadata**: Difficulty levels (N3, N4, N5) and learning categories
3. **Date Parsing**: Japanese date format extraction
4. **Category Analysis**: Food (しょくじ), sightseeing (かんこう), events (イベント)
5. **Content Analytics**: Counting articles by difficulty and analyzing features
6. **Cultural Content**: Author names in different scripts and international tags

## Complete Examples

For complete working examples, see:
- `src/examples/news.ycombinator.com.ts` - Comprehensive Hacker News parsing with TypeScript generics
- `src/examples/watanoc.com.ts` - Japanese learning website parsing
- `src/examples/otakudesu.cloud.ts` - Indonesian anime site (Otakudesu) parsing
- `src/examples/proxy-and-useragent.ts` - Proxy and random user agent usage
- `src/examples/ssl-and-dead-domains.ts` - SSL error handling and dead domain management
- `src/examples/typed-extraction.ts` - TypeScript generic types demonstration

Run examples:
```bash
# Run Hacker News example (with TypeScript generics)
yarn ts-node src/examples/news.ycombinator.com.ts

# Run Watanoc example  
yarn ts-node src/examples/watanoc.com.ts

# Run Otakudesu example
yarn ts-node src/examples/otakudesu.cloud.ts

# Run Proxy & User Agent example
yarn ts-node src/examples/proxy-and-useragent.ts

# Run SSL & Dead Domain example
yarn ts-node src/examples/ssl-and-dead-domains.ts

# Run TypeScript Generic Types example
yarn ts-node src/examples/typed-extraction.ts
```

## Schema Configuration

The `ExtractionSchema` interface now supports generics for better type safety:

```typescript
interface ExtractionSchema<T = Record<string, any>> {
  [key: string]: {
    selector: string;                    // XPath or CSS selector
    type: 'xpath' | 'css';              // Selector type
    attribute?: string;                  // Attribute to extract
    transform?: (value: string) => any;  // Transform function
  };
}

// Example with typed interface
interface BlogPost {
  title: string;
  publishDate: Date;
  viewCount: number;
  isPublished: boolean;
}

const blogSchema: ExtractionSchema<BlogPost> = {
  title: {
    selector: '//h1/text()',
    type: 'xpath'
  },
  publishDate: {
    selector: '//time',
    type: 'xpath',
    attribute: 'datetime',
    transform: (value: string) => new Date(value)
  },
  viewCount: {
    selector: '//span[@data-views]',
    type: 'xpath',
    attribute: 'data-views',
    transform: (value: string) => parseInt(value)
  },
  isPublished: {
    selector: '//div[@data-status]',
    type: 'xpath',
    attribute: 'data-status',
    transform: (value: string) => value === 'published'
  }
};
```

### Transform Functions with Type Safety

Transform functions now support type-safe transformations:

```typescript
const schema: ExtractionSchema<BlogPost> = {
  price: {
    selector: '//span[@class="price"]/text()',
    type: 'xpath',
    transform: (value: string) => parseFloat(value.replace('$', '')) // Returns number
  },
  tags: {
    selector: '//div[@class="tags"]/text()',
    type: 'xpath',
    transform: (value: string) => value.split(',').map(tag => tag.trim()) // Returns string[]
  },
  publishDate: {
    selector: '//time',
    type: 'css',
    attribute: 'datetime',
    transform: (value: string) => new Date(value) // Returns Date
  },
  isActive: {
    selector: '//div/@data-active',
    type: 'xpath',
    transform: (value: string) => value === 'true' // Returns boolean
  }
};
```

## XPath vs CSS Selectors

### When to use XPath (Primary)
- Complex element relationships
- Text content matching
- Attribute-based selections
- Advanced filtering
- Precise element positioning

```typescript
// Complex XPath examples
htmlParser.extractSingle(html, '//div[contains(@class, "content") and @data-type="article"]//p[1]/text()');
htmlParser.extractSingle(html, '//a[contains(text(), "Next") and @href]/@href');
htmlParser.extractMultiple(html, '//tr[position() > 1]/td[2]/text()');
```

### When to use CSS Selectors (Secondary)
- Simple element selection
- Class and ID based selection
- Familiar jQuery-like syntax
- Quick prototyping

```typescript
// CSS selector examples
htmlParser.extractSingle(html, '.content p:first-child', 'css');
htmlParser.extractMultiple(html, 'a.external-link', 'css');
htmlParser.extractAttributes(html, 'img.thumbnail', 'src', 'css');
```

## Error Handling

The library provides graceful error handling:

```typescript
try {
  const result = htmlParser.extractSingle(html, 'invalid-selector');
} catch (error) {
  console.error('Extraction failed:', error.message);
}

// Methods return null/empty arrays for non-existent elements
const result = htmlParser.extractSingle(html, '//nonexistent'); // returns null
const results = htmlParser.extractMultiple(html, '//nonexistent'); // returns []
const exists = htmlParser.exists(html, '//nonexistent'); // returns false
const count = htmlParser.count(html, '//nonexistent'); // returns 0
```

## Development

### Project Setup

```bash
yarn install
```

### Build

```bash
yarn build
```

### Testing

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:cov

# Run tests in watch mode
yarn test:watch
```

The test suite includes comprehensive tests using real Hacker News data to ensure the parser works correctly with real-world HTML structures.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Keywords

- NestJS
- HTML Parser
- XPath
- CSS Selectors
- Web Scraping
- Data Extraction
- HTML Processing
- DOM Parsing
- Proxy
- User Agent
- Random User Agent
- Web Scraping
- SSL Error Handling
- Dead Domain Detection

## Types and Interfaces

The package exports comprehensive TypeScript interfaces for type safety and better development experience.

### Core Types

```typescript
import {
  HtmlParserService,
  HtmlFetchResponse,
  HtmlParserOptions,
  ProxyConfig,
  ExtractionSchema
} from '@hanivanrizky/nestjs-html-parser';
```

### HtmlFetchResponse

Complete HTTP response information returned by `fetchHtml`:

```typescript
interface HtmlFetchResponse {
  data: string;                    // HTML content
  headers: Record<string, string>; // Response headers
  status: number;                  // HTTP status code (200, 404, etc.)
  statusText: string;              // HTTP status text ("OK", "Not Found", etc.)
}
```

### HtmlParserOptions

Configuration options for HTML fetching with comprehensive error handling:

```typescript
interface HtmlParserOptions {
  timeout?: number;                // Request timeout in milliseconds
  headers?: Record<string, string>; // Custom HTTP headers
  userAgent?: string;              // Custom user agent string
  useRandomUserAgent?: boolean;    // Use random user agent
  proxy?: ProxyConfig;             // Proxy configuration
  retries?: number;                // Number of retry attempts
  retryDelay?: number;             // Delay between retries in milliseconds
  verbose?: boolean;               // Enable verbose logging
  rejectUnauthorized?: boolean;    // Reject unauthorized SSL certificates (default: true)
  ignoreSSLErrors?: boolean;       // Skip SSL certificate verification entirely
  maxRedirects?: number;           // Maximum number of redirects to follow (default: 5)
  retryOnErrors?: {                // Enable automatic retry on specific error types
    ssl?: boolean;                 // Retry on SSL/TLS errors
    timeout?: boolean;             // Retry on connection timeout
    dns?: boolean;                 // Retry on DNS resolution errors
    connectionRefused?: boolean;   // Retry on connection refused errors
  };
}
```

### ProxyConfig

Proxy server configuration:

```typescript
interface ProxyConfig {
  url: string;                                        // Proxy URL
  type?: 'http' | 'https' | 'socks4' | 'socks5';    // Proxy type
  username?: string;                                  // Proxy username
  password?: string;                                  // Proxy password
}

// Examples:
const httpProxy: ProxyConfig = {
  url: 'http://proxy.example.com:8080',
  type: 'http'
};

const socksWithCreds: ProxyConfig = {
  url: 'socks5://user:pass@proxy.example.com:1080',
  type: 'socks5'
};
```

### ExtractionSchema

Schema for structured data extraction:

```typescript
interface ExtractionSchema<T = Record<string, any>> {
  [key: string]: {
    selector: string;                    // XPath or CSS selector
    type: 'xpath' | 'css';              // Selector type
    attribute?: string;                  // Attribute to extract
    transform?: (value: string) => any;  // Transform function
  };
}

// Example:
const articleSchema: ExtractionSchema<BlogPost> = {
  title: {
    selector: '//h1/text()',
    type: 'xpath'
  },
  author: {
    selector: '.author',
    type: 'css'
  },
  publishDate: {
    selector: 'time',
    type: 'css',
    attribute: 'datetime',
    transform: (value: string) => new Date(value)
  },
  viewCount: {
    selector: '//span[@data-views]',
    type: 'xpath',
    attribute: 'data-views',
    transform: (value: string) => parseInt(value)
  },
  isPublished: {
    selector: '//div[@data-status]',
    type: 'xpath',
    attribute: 'data-status',
    transform: (value: string) => value === 'published'
  }
};
```