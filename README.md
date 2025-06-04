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

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Import the Module](#import-the-module)
  - [Async Configuration](#async-configuration)
  - [Inject the Service](#inject-the-service)
- [Core Features](#core-features)
  - [HTML Fetching with Response Metadata](#html-fetching-with-response-metadata)
  - [Data Extraction Methods](#data-extraction-methods)
  - [Proxy Support](#proxy-support)
  - [Error Handling](#error-handling)
- [API Reference](#api-reference)
  - [Core Methods](#core-methods)
  - [Advanced Methods](#advanced-methods)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

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
- **🔇 Verbose & Logger Level Control**: Optional verbose mode for debugging and configurable logger level (debug, log, warn, error, verbose)
- **🔒 SSL Error Handling**: Comprehensive SSL certificate error handling and bypass options
- **💀 Dead Domain Support**: Advanced error categorization for dead/unreachable domains
- **🔄 Smart Retry Logic**: Error-type-specific retry strategies for different network issues
- **🎯 TypeScript Generics**: Full generic type support for compile-time type safety
- **🧪 Fully Tested**: Comprehensive test suite with real-world examples

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
  imports: [
    HtmlParserModule.forRoot({ loggerLevel: 'debug' }), // Set logger level: 'debug', 'log', 'warn', 'error', or 'verbose'
  ],
})
export class AppModule {}
```

#### Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HtmlParserModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        loggerLevel: configService.get<'debug'|'log'|'warn'|'error'|'verbose'>('HTML_PARSER_LOGGER_LEVEL', 'warn'),
      }),
      inject: [ConfigService],
    }),
  ],
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
    const response = await this.htmlParser.fetchHtml('https://news.ycombinator.com/');
    
    // Extract page title
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

## Core Features

### HTML Fetching with Response Metadata

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

// Response includes:
// - data: HTML content
// - headers: Response headers
// - status: HTTP status code
// - statusText: HTTP status text
```

### Data Extraction Methods

```typescript
// Single value extraction
const title = htmlParser.extractSingle(html, '//title/text()');

// Multiple values
const links = htmlParser.extractMultiple(html, '//a/text()');

// Attribute extraction
const urls = htmlParser.extractAttributes(html, '//a', 'href');

// Structured data extraction
const schema = {
  title: { selector: '//h1/text()', type: 'xpath' },
  author: { selector: '.author', type: 'css' },
  date: { 
    selector: 'time', 
    type: 'css', 
    attribute: 'datetime',
    transform: (value: string) => new Date(value)
  },
  links: { selector: '//a/@href', type: 'xpath', multiple: true }
};
const data = htmlParser.extractStructured(html, schema);
```

### Proxy Support

```typescript
const proxyConfig = {
  url: 'http://proxy.example.com:8080',
  type: 'http',
  username: 'user',
  password: 'pass'
};

const html = await htmlParser.fetchHtml('https://example.com', {
  proxy: proxyConfig,
  useRandomUserAgent: true
});
```

### Error Handling

```typescript
try {
  const response = await htmlParser.fetchHtml('https://example.com', {
    rejectUnauthorized: false,
    retryOnErrors: {
      ssl: true,
      timeout: true,
      dns: true
    }
  });
} catch (error) {
  // Error is categorized by type (ssl, dns, timeout, etc.)
  console.error(`Failed: ${error.message}`);
}
```

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

Extract data using a typed schema object. Supports `multiple: true` for array extraction in any field.

```typescript
import { ExtractionSchema } from '@hanivanrizky/nestjs-html-parser';

// Define typed interface
interface Article {
  title: string;
  author: string;
  links: string[];
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
  links: {
    selector: '//a/@href',
    type: 'xpath',
    multiple: true
  }
};

const result = htmlParser.extractStructured<Article>(html, schema);
// Result: { title: "Page Title", author: "John Doe", links: ["/home", "/about", ...] }
```

#### `extractStructuredList<T = Record<string, any>>(html: string, containerSelector: string, schema: ExtractionSchema<T>, containerType?: 'xpath' | 'css', options?: { verbose?: boolean }): T[]`

Extract arrays of typed structured data. Supports `multiple: true` for array extraction in any field.

```typescript
// Define typed interface
interface Product {
  name: string;
  price: number;
  tags: string[];
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
  tags: {
    selector: './/span[@class="tag"]/text()',
    type: 'xpath',
    multiple: true
  }
};

const products = htmlParser.extractStructuredList<Product>(
  html,
  '//div[@class="product"]',
  productSchema
);
// Result: Product[] with tags as array for each product
```

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Test
yarn test
yarn test:cov
yarn test:watch
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/yourusername/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/yourusername/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.