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
- **🧪 Fully Tested**: Comprehensive test suite with real-world examples

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
  
  // Retry configuration
  retries: 3,                      // Number of retry attempts
  retryDelay: 1000,               // Delay between retries (ms)
  
  // Standard options
  timeout: 15000,                 // Request timeout
  headers: {                      // Custom headers
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9'
  }
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

# Run proxy and user agent demo
yarn demo:proxy

# Run HtmlFetchResponse features demo
yarn demo:response

# Run all demos sequentially
yarn demo:all
```

These scripts provide an easy way to see the HTML parser in action with real-world websites, demonstrating various parsing techniques, proxy usage, and random user agent capabilities.

## API Reference

### Core Methods

#### `fetchHtml(url: string, options?: HtmlParserOptions): Promise<string>`

Fetch HTML content from a URL.

```typescript
const html = await htmlParser.fetchHtml('https://example.com', {
  timeout: 10000,
  headers: { 'User-Agent': 'Custom Agent' }
});
```

#### `extractSingle(html: string, selector: string, type?: 'xpath' | 'css', attribute?: string): string | null`

Extract a single value using XPath or CSS selector.

```typescript
// Using XPath (default)
const title = htmlParser.extractSingle(html, '//title/text()');

// Using CSS selector
const title = htmlParser.extractSingle(html, 'title', 'css');

// Extract attribute
const href = htmlParser.extractSingle(html, '//a[@class="link"]', 'xpath', 'href');
```

#### `extractMultiple(html: string, selector: string, type?: 'xpath' | 'css', attribute?: string): string[]`

Extract multiple matching values.

```typescript
// Extract all links
const links = htmlParser.extractMultiple(html, '//a/text()');

// Extract all href attributes
const urls = htmlParser.extractMultiple(html, '//a', 'xpath', 'href');
```

#### `extractText(html: string, selector: string, type?: 'xpath' | 'css'): string | null`

Extract text content specifically.

```typescript
const text = htmlParser.extractText(html, '//p[@class="content"]');
```

#### `extractAttributes(html: string, selector: string, attribute: string, type?: 'xpath' | 'css'): string[]`

Extract attribute values from multiple elements.

```typescript
const imgSources = htmlParser.extractAttributes(html, '//img', 'src');
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

#### `extractStructured(html: string, schema: ExtractionSchema): Record<string, any>`

Extract data using a schema object.

```typescript
import { ExtractionSchema } from '@hanivanrizky/nestjs-html-parser';

const schema: ExtractionSchema = {
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
  }
};

const result = htmlParser.extractStructured(html, schema);
// { title: "Page Title", author: "John Doe", wordCount: 150 }
```

#### `extractStructuredList(html: string, containerSelector: string, schema: ExtractionSchema, containerType?: 'xpath' | 'css'): Record<string, any>[]`

Extract arrays of structured data.

```typescript
const articleSchema: ExtractionSchema = {
  title: {
    selector: './/h2/text()',
    type: 'xpath'
  },
  url: {
    selector: './/a',
    type: 'xpath',
    attribute: 'href'
  },
  date: {
    selector: '.date',
    type: 'css'
  }
};

const articles = htmlParser.extractStructuredList(
  html,
  '//article[@class="post"]',
  articleSchema
);
```

## Real-World Examples

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
- `src/examples/news.ycombinator.com.ts` - Comprehensive Hacker News parsing
- `src/examples/watanoc.com.ts` - Japanese learning website parsing
- `src/examples/proxy-and-useragent.ts` - Proxy and random user agent usage

Run examples:
```bash
# Run Hacker News example
yarn ts-node src/examples/news.ycombinator.com.ts

# Run Watanoc example  
yarn ts-node src/examples/watanoc.com.ts

# Run Proxy & User Agent example
yarn ts-node src/examples/proxy-and-useragent.ts
```

## Schema Configuration

The `ExtractionSchema` interface allows you to define complex extraction rules:

```typescript
interface ExtractionSchema {
  [key: string]: {
    selector: string;           // XPath or CSS selector
    type: 'xpath' | 'css';     // Selector type
    attribute?: string;         // Optional attribute to extract
    transform?: (value: string) => any; // Optional transformation function
  };
}
```

### Transform Functions

Transform functions allow you to process extracted values:

```typescript
const schema: ExtractionSchema = {
  price: {
    selector: '//span[@class="price"]/text()',
    type: 'xpath',
    transform: (value: string) => parseFloat(value.replace('$', ''))
  },
  tags: {
    selector: '//div[@class="tags"]/text()',
    type: 'xpath',
    transform: (value: string) => value.split(',').map(tag => tag.trim())
  },
  publishDate: {
    selector: '//time',
    type: 'css',
    attribute: 'datetime',
    transform: (value: string) => new Date(value)
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

Configuration options for HTML fetching:

```typescript
interface HtmlParserOptions {
  timeout?: number;                // Request timeout in milliseconds
  headers?: Record<string, string>; // Custom HTTP headers
  userAgent?: string;              // Custom user agent string
  useRandomUserAgent?: boolean;    // Use random user agent
  proxy?: ProxyConfig;             // Proxy configuration
  retries?: number;                // Number of retry attempts
  retryDelay?: number;             // Delay between retries in milliseconds
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
interface ExtractionSchema {
  [key: string]: {
    selector: string;                    // XPath or CSS selector
    type: 'xpath' | 'css';              // Selector type
    attribute?: string;                  // Attribute to extract
    transform?: (value: string) => any;  // Transform function
  };
}

// Example:
const articleSchema: ExtractionSchema = {
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
  }
};
```