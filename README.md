# ⚠️ **IMPORTANT: This package is archived and no longer maintained**

> **This package has been renamed and migrated.** Please use the new package instead:
> **[@hanivanrizky/nestjs-xpath-parser](https://github.com/Hanivan/nestjs-xpath-parser)**
>
> This repository is kept for historical reference only. No updates, bug fixes, or support will be provided.

## Migration Guide

### Old Package (Archived)
```bash
npm uninstall @hanivanrizky/nestjs-html-parser
```

### New Package (Active)
```bash
npm install @hanivanrizky/nestjs-xpath-parser
```

The new package has improved features, better documentation, and active maintenance.

---

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
- [TypeScript Definitions & Types](#typescript-definitions--types)
  - [Complete Interface Definitions](#complete-interface-definitions)
  - [Implementation Guide](#implementation-guide)
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
    HtmlParserModule.forRoot(), // Default: loggerLevel: ['log', 'error'] (production ready)
    // Or override for development:
    HtmlParserModule.forRoot({ loggerLevel: 'debug' }),
    // Or enable multiple levels:
    HtmlParserModule.forRoot({ loggerLevel: ['debug', 'warn'] }),
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
        loggerLevel: configService.get<'debug'|'log'|'warn'|'error'|'verbose'|('debug'|'log'|'warn'|'error'|'verbose')[]>('HTML_PARSER_LOGGER_LEVEL', 'warn'),
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

// Structured data extraction with advanced transform
class UppercasePipe {
  transform(value: string) {
    return value.toUpperCase();
  }
}
class SuffixPipe {
  constructor(private suffix: string) {}
  transform(value: string) {
    return value + this.suffix;
  }
}
const schema = {
  title: {
    selector: '//h1/text()',
    type: 'xpath',
    transform: [
      (title: string) => title.trim(),
      UppercasePipe,
      new SuffixPipe(' [ADVANCED]'),
    ],
  },
  episode: {
    selector: '//div[@class="epz"]',
    type: 'xpath',
    transform: [
      (text: any) => {
        if (typeof text !== 'string') return 0;
        let match = text.match(/Episode\s+(\d+)/i);
        if (!match) match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      },
      new SuffixPipe(' (ep)'),
    ],
  },
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

### SSL/TLS Configuration & Security

The HTML Parser Service provides three levels of SSL configuration for handling different certificate scenarios:

#### 🔒 SSL Configuration Options (Independent Controls)

The service provides **three independent SSL configuration options** that can be used alone or in combination:

1. **`rejectUnauthorized: false`** - Accept invalid/self-signed certificates
2. **`disableServerIdentityCheck: true`** - Skip hostname validation (independent option)
3. **`ignoreSSLErrors: true`** - Disable all SSL validation (⚠️ Use with extreme caution)

**🔑 Key Point:** `disableServerIdentityCheck` is **fully independent** of `ignoreSSLErrors` and only controls hostname validation.

```typescript
// Default: Full SSL validation (recommended for production)
const response = await htmlParser.fetchHtml('https://trusted-site.com');

// Accept self-signed certificates only
const response = await htmlParser.fetchHtml('https://self-signed-site.com', {
  rejectUnauthorized: false
});

// Skip only hostname validation (certificate still validated)
const response = await htmlParser.fetchHtml('https://hostname-mismatch-site.com', {
  disableServerIdentityCheck: true  // Works independently
});

// Combine: Accept invalid certs + skip hostname validation
const response = await htmlParser.fetchHtml('https://problematic-site.com', {
  rejectUnauthorized: false,
  disableServerIdentityCheck: true  // Both options work together
});

// Disable all SSL validation (⚠️ DANGEROUS - development only)
const response = await htmlParser.fetchHtml('https://any-ssl-issue-site.com', {
  ignoreSSLErrors: true  // Overrides all SSL checks
});

// Mixed configuration: Disable all SSL but explicitly control hostname check
const response = await htmlParser.fetchHtml('https://mixed-config-site.com', {
  ignoreSSLErrors: true,
  disableServerIdentityCheck: false  // Independent: hostname check still works
});
```

#### ⚠️ **CRITICAL SECURITY WARNING: `disableServerIdentityCheck`**

The `disableServerIdentityCheck` parameter bypasses server name indication (SNI) validation, which is a **critical security mechanism** that:

- **Prevents man-in-the-middle attacks** by ensuring you're connecting to the intended server
- **Validates hostname matches** between the certificate and the requested domain
- **Protects against certificate spoofing** and domain impersonation

**🚨 NEVER use `disableServerIdentityCheck: true` in production unless:**
- You fully understand the security implications
- You have other security measures in place (e.g., certificate pinning)
- You are connecting to a known, trusted internal service with hostname mismatches
- You are in a controlled testing environment

**✅ Safe Use Cases:**
- Development environments with self-hosted services
- Testing against staging servers with certificate issues
- Internal corporate networks with hostname mismatches
- Temporary workarounds during certificate renewal periods

**❌ NEVER Use In:**
- Production applications handling sensitive data
- Public-facing services
- Financial or healthcare applications
- Any scenario where security is paramount

```typescript
// ❌ DANGEROUS: Complete SSL bypass (never in production)
const response = await htmlParser.fetchHtml(url, {
  ignoreSSLErrors: true  // Disables ALL SSL validation including hostname check
});

// ⚠️ SELECTIVE: Independent hostname validation control
const response = await htmlParser.fetchHtml(url, {
  ignoreSSLErrors: true,
  disableServerIdentityCheck: false  // Still enforces hostname validation despite ignoreSSLErrors
});

// ✅ BETTER: Minimal SSL relaxation
const response = await htmlParser.fetchHtml(url, {
  rejectUnauthorized: false,  // Accept invalid certificates only
  disableServerIdentityCheck: false  // Keep hostname validation (default)
});

// ✅ TARGETED: Skip only hostname validation
const response = await htmlParser.fetchHtml(url, {
  disableServerIdentityCheck: true  // Only bypasses hostname check, certificate still validated
});

// ✅ PRODUCTION: Full SSL validation (default)
const response = await htmlParser.fetchHtml(url, {
  // All SSL validations enabled by default
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

## TypeScript Definitions & Types

### Complete Interface Definitions

```typescript
// ===== CORE SERVICE INTERFACE =====
interface HtmlParserService {
  // Main HTML fetching method
  fetchHtml(url: string, options?: HtmlParserOptions): Promise<HtmlFetchResponse>;
  
  // Single value extraction methods
  extractSingle<T = string>(
    html: string,
    selector: string,
    type?: 'xpath' | 'css',           // Default: 'xpath'
    attribute?: string,
    options?: ExtractionOptions<T>
  ): T | null;
  
  extractText<T = string>(
    html: string,
    selector: string,
    type?: 'xpath' | 'css',           // Default: 'xpath'
    options?: ExtractionOptions<T>
  ): T | null;
  
  // Multiple value extraction methods  
  extractMultiple<T = string>(
    html: string,
    selector: string,
    type?: 'xpath' | 'css',           // Default: 'xpath'
    attribute?: string,
    options?: ExtractionOptions<T>
  ): T[];
  
  extractAttributes<T = string>(
    html: string,
    selector: string,
    attribute: string,
    type?: 'xpath' | 'css',           // Default: 'xpath'
    options?: ExtractionOptions<T>
  ): T[];
  
  // Structured extraction methods
  extractStructured<T = Record<string, any>>(
    html: string,
    schema: ExtractionSchema<T>,
    options?: { verbose?: boolean }
  ): T;
  
  extractStructuredList<T = Record<string, any>>(
    html: string,
    containerSelector: string,
    schema: ExtractionSchema<T>,
    containerType?: 'xpath' | 'css',  // Default: 'xpath'
    options?: { verbose?: boolean }
  ): T[];
  
  // Utility methods
  exists(html: string, selector: string, type?: 'xpath' | 'css', options?: { verbose?: boolean }): boolean;
  count(html: string, selector: string, type?: 'xpath' | 'css', options?: { verbose?: boolean }): number;
  
  // Advanced utility methods
  getRandomUserAgent(): Promise<string>;
  testProxy(proxy: ProxyConfig, testUrl?: string): Promise<boolean>;
}

// ===== CONFIGURATION TYPES =====
interface HtmlParserOptions {
  timeout?: number;                    // Request timeout in milliseconds (default: 10000)
  headers?: Record<string, string>;    // Custom headers to send with request
  userAgent?: string;                  // Custom user agent string (default: Mozilla/5.0...)
  useRandomUserAgent?: boolean;        // Use random user agent (default: false)
  proxy?: ProxyConfig;                 // Proxy configuration
  retries?: number;                    // Number of retry attempts (default: 3)
  retryDelay?: number;                 // Delay between retries in ms (default: 1000)
  verbose?: boolean;                   // Enable verbose logging (default: false)
  rejectUnauthorized?: boolean;        // Reject unauthorized SSL certificates (default: true)
  ignoreSSLErrors?: boolean;           // Skip SSL certificate verification (default: false)
  disableServerIdentityCheck?: boolean; // ⚠️ SECURITY WARNING: Disable server name indication (SNI) validation (default: false)
  maxRedirects?: number;               // Maximum redirects to follow (default: 5)
  retryOnErrors?: {                    // Configure retry behavior for specific error types
    ssl?: boolean;                     // Retry on SSL/TLS errors (default: false)
    timeout?: boolean;                 // Retry on connection timeout (default: true)
    dns?: boolean;                     // Retry on DNS resolution errors (default: true)
    connectionRefused?: boolean;       // Retry on connection refused errors (default: true)
  };
}

interface HtmlFetchResponse {
  data: string;                        // HTML content of the fetched page
  headers: Record<string, string>;     // HTTP response headers as key-value pairs
  status: number;                      // HTTP status code (e.g., 200, 404, 500)
  statusText: string;                  // HTTP status text (e.g., 'OK', 'Not Found')
}

interface ProxyConfig {
  url: string;                         // Proxy server URL (e.g., 'http://proxy.example.com:8080')
  type?: 'http' | 'https' | 'socks4' | 'socks5';  // Type of proxy server (auto-detected from URL)
  username?: string;                   // Username for proxy authentication
  password?: string;                   // Password for proxy authentication
}

// ===== EXTRACTION TYPES =====
type TransformFunction = (value: any) => any;
type TransformObject = { transform: (value: any) => any };
type TransformClass = new (...args: any[]) => TransformObject;
type TransformType =
  | TransformFunction
  | TransformObject
  | TransformClass
  | Array<TransformFunction | TransformObject | TransformClass>;

interface ExtractionOptions<T = any> {
  verbose?: boolean;                   // Enable verbose logging for this extraction
  transform?: TransformType;           // Transform to apply to extracted value
}

interface ExtractionField<T = any> {
  selector: string;                    // CSS selector or XPath expression
  type: 'xpath' | 'css';              // Type of selector being used
  attribute?: string;                  // HTML attribute to extract from selected element
  transform?: TransformType;           // Transform to apply to extracted value
  multiple?: boolean;                  // If true, extract array of values instead of single value
  raw?: boolean;                       // If true, return raw HTML of matched element(s)
}

interface ExtractionSchema<T = Record<string, any>> {
  [K in keyof T]: ExtractionField<T[K]>;
}

// ===== MODULE CONFIGURATION TYPES =====
type LogLevel = 'debug' | 'log' | 'warn' | 'error' | 'verbose'; // same LogLevel type from @nestjs/common

interface HtmlParserConfig {
  loggerLevel?: LogLevel | Array<LogLevel>;  // Default: ['log', 'error']
}

interface HtmlParserModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<HtmlParserConfigFactory>;
  useClass?: Type<HtmlParserConfigFactory>;
  useFactory?: (...args: any[]) => Promise<HtmlParserConfig> | HtmlParserConfig;
  inject?: any[];
}

interface HtmlParserConfigFactory {
  createHtmlParserConfig(): Promise<HtmlParserConfig> | HtmlParserConfig;
}
```

### Implementation Guide

#### ✅ **Production-Ready Configuration Patterns**

**For Health Checks / Monitoring:**
```typescript
const healthCheckOptions: HtmlParserOptions = {
  timeout: 15000,                      // Shorter timeout for health checks
  useRandomUserAgent: true,            // Avoid being blocked
  retries: 1,                          // Fast fail for health checks
  retryDelay: 500,                     // Quick retry for transient issues
  verbose: false,                      // Keep logging minimal in production
  rejectUnauthorized: false,           // Accept self-signed certificates
  ignoreSSLErrors: true,               // ⚠️ Ignore SSL errors for monitoring (development only)
  disableServerIdentityCheck: false,   // ✅ Independent: Keep hostname validation even with ignoreSSLErrors
  maxRedirects: 2,                     // Limit redirects for performance
  retryOnErrors: {
    ssl: false,                        // Don't retry SSL errors
    timeout: false,                    // Don't retry timeouts in health checks
    dns: true,                         // Retry DNS errors only
    connectionRefused: false,          // Don't retry connection refused
  },
};

const response: HtmlFetchResponse = await htmlParser.fetchHtml(url, healthCheckOptions);
```

**For Web Scraping / Data Extraction:**
```typescript
const scrapingOptions: HtmlParserOptions = {
  timeout: 30000,                      // Longer timeout for content loading
  useRandomUserAgent: true,            // Rotate user agents to avoid blocking
  retries: 3,                          // More persistent for data extraction
  retryDelay: 2000,                    // Respect rate limits
  verbose: false,                      // Enable only for debugging
  rejectUnauthorized: false,           // Handle various SSL configurations
  disableServerIdentityCheck: true,    // ⚠️ Independent: Skip only hostname validation
  ignoreSSLErrors: false,              // Prefer minimal SSL relaxation (keeps certificate validation)
  maxRedirects: 5,                     // Follow redirects for content
  retryOnErrors: {
    ssl: false,                        // SSL errors usually permanent
    timeout: true,                     // Retry timeouts for slow sites
    dns: true,                         // Retry DNS resolution failures
    connectionRefused: false,          // Usually indicates server issues
  },
};

const response: HtmlFetchResponse = await htmlParser.fetchHtml(url, scrapingOptions);
```

**For Development / Testing:**
```typescript
const devOptions: HtmlParserOptions = {
  timeout: 10000,
  useRandomUserAgent: false,           // Consistent user agent for testing
  retries: 1,                          // Fail fast during development
  retryDelay: 1000,
  verbose: true,                       // Enable detailed logging
  rejectUnauthorized: false,           // Handle local/test SSL certificates
  disableServerIdentityCheck: true,    // ✅ Independent: OK for development/testing only
  ignoreSSLErrors: false,              // Prefer targeted SSL relaxation (keeps certificate validation)
  maxRedirects: 3,
  retryOnErrors: {
    ssl: false,
    timeout: false,                    // Don't retry to see issues quickly
    dns: true,
    connectionRefused: false,
  },
};
```

#### ✅ **Type-Safe Extraction Patterns**

**Single Value Extraction with Transformations:**
```typescript
// Extract and transform to number
const pageId = htmlParser.extractSingle<number>(
  html, 
  '//meta[@name="page-id"]', 
  'xpath', 
  'content',
  { transform: (value: string) => parseInt(value, 10) }
);

// Extract and validate boolean
const isPublished = htmlParser.extractSingle<boolean>(
  html,
  '//meta[@property="article:published"]',
  'xpath',
  'content',
  { transform: (value: string) => value.toLowerCase() === 'true' }
);

// Extract date with validation
const publishedDate = htmlParser.extractSingle<Date | null>(
  html,
  '//time[@datetime]',
  'xpath',
  'datetime',
  { 
    transform: (value: string) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
  }
);
```

**Multiple Value Extraction with Type Safety:**
```typescript
// Extract numeric arrays with validation
const prices = htmlParser.extractMultiple<number>(
  html,
  '//span[@class="price"]/text()',
  'xpath',
  undefined,
  { 
    transform: (value: string) => {
      const price = parseFloat(value.replace(/[$,]/g, ''));
      return isNaN(price) ? 0 : price;
    }
  }
);

// Extract URLs with validation
const imageUrls = htmlParser.extractAttributes<string>(
  html,
  '//img[@src]',
  'src',
  'xpath',
  {
    transform: (url: string) => {
      try {
        return new URL(url, 'https://example.com').href;
      } catch {
        return '';
      }
    }
  }
).filter(url => url !== '');
```

**Advanced Structured Extraction:**
```typescript
// Define comprehensive interfaces
interface Article {
  title: string;
  author: string;
  publishedDate: Date | null;
  tags: string[];
  excerpt: string;
  content: string;
  wordCount: number;
  socialShares: number;
  isSponsored: boolean;
  metadata: {
    description: string;
    keywords: string[];
  };
}

// Create production-ready schema
const articleSchema: ExtractionSchema<Article> = {
  title: {
    selector: '//h1[@class="article-title"]/text() | //title/text()',
    type: 'xpath',
    transform: (title: string) => title.trim().replace(/\s+/g, ' ')
  },
  author: {
    selector: '//meta[@name="author"]',
    type: 'xpath',
    attribute: 'content',
    transform: (author: string) => author || 'Unknown'
  },
  publishedDate: {
    selector: '//time[@datetime] | //meta[@property="article:published_time"]',
    type: 'xpath',
    attribute: 'datetime',
    transform: (dateStr: string) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
  },
  tags: {
    selector: '//meta[@name="keywords"]',
    type: 'xpath',
    attribute: 'content',
    transform: (keywords: string) => 
      keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : []
  },
  excerpt: {
    selector: '//meta[@name="description"]',
    type: 'xpath',
    attribute: 'content',
    transform: (desc: string) => desc || ''
  },
  content: {
    selector: '//article | //div[@class="content"]',
    type: 'xpath',
    raw: true
  },
  wordCount: {
    selector: '//article//text() | //div[@class="content"]//text()',
    type: 'xpath',
    multiple: true,
    transform: (texts: string[]) => 
      texts.join(' ').split(/\s+/).filter(word => word.length > 0).length
  },
  socialShares: {
    selector: '//span[@class="share-count"]/text()',
    type: 'xpath',
    transform: (shares: string) => parseInt(shares?.replace(/[^0-9]/g, '') || '0', 10)
  },
  isSponsored: {
    selector: '//div[contains(@class, "sponsored")] | //span[contains(text(), "Sponsored")]',
    type: 'xpath',
    transform: () => true
  },
  metadata: {
    selector: '//head',
    type: 'xpath',
    transform: (headElement: any) => {
      // Extract nested metadata
      const description = htmlParser.extractSingle(
        headElement,
        '//meta[@name="description"]',
        'xpath',
        'content'
      ) || '';
      
      const keywords = htmlParser.extractSingle(
        headElement,
        '//meta[@name="keywords"]',
        'xpath',
        'content'
      ) || '';
      
      return {
        description,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k)
      };
    }
  }
};

const article: Article = htmlParser.extractStructured<Article>(html, articleSchema);
```

**Advanced Transform Pipeline:**
```typescript
// Define reusable transform classes
class UppercasePipe {
  transform(value: string): string {
    return value.toUpperCase();
  }
}

class TrimPipe {
  transform(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }
}

class NumberPipe {
  constructor(private defaultValue: number = 0) {}
  
  transform(value: string): number {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? this.defaultValue : num;
  }
}

// Use in extraction schema
const productSchema: ExtractionSchema<any> = {
  name: {
    selector: '//h1/text()',
    type: 'xpath',
    transform: [
      TrimPipe,
      UppercasePipe,
      (name: string) => name.substring(0, 100) // Limit length
    ]
  },
  price: {
    selector: '//span[@class="price"]/text()',
    type: 'xpath',
    transform: new NumberPipe(0)
  }
};
```

#### ⚠️ **Common Implementation Mistakes to Avoid**

**Type and Method Signature Errors:**
```typescript
// ❌ WRONG: Missing type parameters and incorrect XPath
const result = htmlParser.extractSingle(html, '//wrongtag');

// ✅ CORRECT: Proper type and XPath for text content
const result: string | null = htmlParser.extractSingle<string>(html, '//title/text()');

// ❌ WRONG: Using wrong method for attribute extraction
const urls = htmlParser.extractSingle(html, '//a', 'xpath', 'href', { multiple: true });

// ✅ CORRECT: Use dedicated method for attributes
const urls: string[] = htmlParser.extractAttributes<string>(html, '//a', 'href');

// ❌ WRONG: Mixing CSS and XPath syntax
const links = htmlParser.extractMultiple(html, 'a//text()', 'css');

// ✅ CORRECT: Use appropriate selector type
const links = htmlParser.extractMultiple(html, '//a/text()', 'xpath');
// OR
const links = htmlParser.extractMultiple(html, 'a', 'css');
```

**Configuration and Error Handling Mistakes:**
```typescript
// ❌ WRONG: Missing proper response typing and error handling
const response = await htmlParser.fetchHtml(url);
const title = response.data.match(/<title>(.*?)<\/title>/)?.[1];

// ✅ CORRECT: Proper typing and extraction
const response: HtmlFetchResponse = await htmlParser.fetchHtml(url, options);
const title: string | null = htmlParser.extractSingle<string>(
  response.data, 
  '//title/text()'
);

// ❌ WRONG: Ignoring status codes and error types
try {
  const html = await htmlParser.fetchHtml(url);
} catch (error) {
  console.log('Failed to fetch');
}

// ✅ CORRECT: Comprehensive error handling
try {
  const response: HtmlFetchResponse = await htmlParser.fetchHtml(url, options);
  
  if (response.status >= 400) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  // Process response.data
} catch (error: any) {
  if (error.code === 'ETIMEDOUT') {
    // Handle timeout specifically
  } else if (error.code === 'ECONNREFUSED') {
    // Handle connection refused
  } else if (error.code?.includes('CERT_')) {
    // Handle SSL certificate errors
  } else if (error.code === 'ENOTFOUND') {
    // Handle DNS resolution errors
  } else {
    // Handle other errors
  }
}
```

#### 🔧 **Advanced Usage Patterns**

**Proxy Testing and Validation:**
```typescript
const proxyConfig: ProxyConfig = {
  url: 'http://proxy.example.com:8080',
  type: 'http',
  username: 'user',
  password: 'pass'
};

// Test proxy before use
const isProxyWorking = await htmlParser.testProxy(proxyConfig);
if (!isProxyWorking) {
  throw new Error('Proxy connection failed');
}

// Use proxy for requests
const response = await htmlParser.fetchHtml(url, { proxy: proxyConfig });
```

**User Agent Management:**
```typescript
// Get random user agent for stealth scraping
const randomUA = await htmlParser.getRandomUserAgent();
console.log('Using User Agent:', randomUA);

// Use in options
const options: HtmlParserOptions = {
  userAgent: randomUA,
  // OR use built-in random generation
  useRandomUserAgent: true
};
```

**Conditional Extraction and Fallbacks:**
```typescript
// Check existence before extraction
if (htmlParser.exists(html, '//div[@class="premium-content"]')) {
  const premiumContent = htmlParser.extractText(html, '//div[@class="premium-content"]');
} else {
  const freeContent = htmlParser.extractText(html, '//div[@class="free-content"]');
}

// Count elements for validation
const commentCount = htmlParser.count(html, '//div[@class="comment"]');
console.log(`Found ${commentCount} comments`);

// Multiple selector fallback pattern
const title = htmlParser.extractSingle(html, '//h1/text()') ||
              htmlParser.extractSingle(html, '//title/text()') ||
              htmlParser.extractSingle(html, '//meta[@property="og:title"]', 'xpath', 'content') ||
              'No title found';
```

## API Reference

### Core Methods

#### `fetchHtml(url: string, options?: HtmlParserOptions): Promise<HtmlFetchResponse>`

Fetch HTML content from a URL with comprehensive error handling and SSL configuration.

```typescript
const response = await htmlParser.fetchHtml('https://example.com', {
  timeout: 10000,
  headers: { 'User-Agent': 'Custom Agent' },
  rejectUnauthorized: false,           // Accept self-signed certificates
  disableServerIdentityCheck: true,    // ⚠️ Skip hostname validation (use with caution)
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

#### `transform` option in schema fields

The `transform` property in a schema field is highly flexible. You can use:
- A single function: `(value: string) => any`
- A single class (constructor with a `transform` method): `class MyPipe { transform(value) { ... } }` (the parser will instantiate it automatically)
- A single instance (object with a `transform` method): `new MyPipe()`
- A class constructor with a `transform` method (e.g., `MyPipe`)
- An array of any of the above (functions, classes, instances), which will be applied in order

**Note:** The parser will always convert DOM elements to their text content before applying the transform, so your transform functions can safely expect a string.

**Important:**
- If you use a class or object for `transform`, it **must** have a method named `transform(value)`. The parser will call this method with the extracted value.
- Custom class transforms must also have a constructor method (either a default constructor or one that accepts arguments if you instantiate it yourself). The parser will instantiate the class using its constructor if you pass the class itself (not an instance).

**Example of a valid custom class transform:**
```typescript
class MyCustomPipe {
  // Default constructor
  constructor() {}
  transform(value: string) {
    // your transformation logic
    return value + '!';
  }
}

class SuffixPipe {
  constructor(private suffix: string) {}
  transform(value: string) {
    return value + this.suffix;
  }
}

// Usage:
transform: MyCustomPipe
// or
transform: new MyCustomPipe()
```

**Examples:**
```typescript
// Single function
transform: (value: string) => value.toUpperCase()

// Single class
transform: UppercasePipe

// Single instance
transform: new SuffixPipe('!')

// Array of functions
transform: [
  (value: string) => value.trim(),
  (value: string) => value.toUpperCase(),
]

// Array of classes and/or instances and/or functions
transform: [
  (value: string) => value.trim(),
  UppercasePipe,
  new SuffixPipe(' [ADVANCED]'),
]
```

### Advanced Methods

#### `extractStructured<T = Record<string, any>>(html: string, schema: ExtractionSchema<T>, options?: { verbose?: boolean }): T`

Extract data using a typed schema object. Supports `multiple: true` for array extraction and `raw: true` for raw HTML extraction in any field.

```typescript
import { ExtractionSchema } from '@hanivanrizky/nestjs-html-parser';

// Define typed interface
interface Article {
  title: string;
  author: string;
  links: string[];
  titleHtml: string;
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
  },
  titleHtml: {
    selector: '//title',
    type: 'xpath',
    raw: true
  }
};

const result = htmlParser.extractStructured<Article>(html, schema);
// Result: { title: "Page Title", author: "John Doe", links: ["/home", "/about", ...], titleHtml: "<title>Page Title</title>" }
```

#### `extractStructuredList<T = Record<string, any>>(html: string, containerSelector: string, schema: ExtractionSchema<T>, containerType?: 'xpath' | 'css', options?: { verbose?: boolean }): T[]`

Extract arrays of typed structured data. Supports `multiple: true` for array extraction and `raw: true` for raw HTML extraction in any field.

```typescript
// Define typed interface
interface Product {
  name: string;
  price: number;
  tags: string[];
  nameHtml: string;
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
  },
  nameHtml: {
    selector: './/h2',
    type: 'xpath',
    raw: true
  }
};

const products = htmlParser.extractStructuredList<Product>(
  html,
  '//div[@class="product"]',
  productSchema
);
// Result: Product[] with tags as array and nameHtml as raw HTML for each product
// [
//   { name: "Product A", price: 19.99, tags: ["electronics", "gadget"], nameHtml: "<h2>Product A</h2>" },
//   { name: "Product B", price: 29.99, tags: ["accessory"], nameHtml: "<h2>Product B</h2>" }
// ]
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
