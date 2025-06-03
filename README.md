<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# NestJS HTML Parser

A powerful NestJS package for parsing HTML content using XPath (primary) and CSS selectors (secondary) with comprehensive extraction capabilities.

## Features

- **🎯 XPath Support (Primary)**: Full XPath 1.0 support for precise element selection
- **🎨 CSS Selectors (Secondary)**: jQuery-style CSS selectors for familiar syntax
- **📋 Multiple Extraction Methods**: Single values, multiple values, attributes, and structured data
- **🔍 Element Analysis**: Check existence and count elements
- **📊 Structured Extraction**: Extract data using schema objects for complex data structures
- **📚 List Extraction**: Extract arrays of structured data
- **🌐 HTTP Fetching**: Built-in HTML fetching with customizable options
- **🛡️ Error Handling**: Graceful error handling and fallbacks
- **🧪 Fully Tested**: Comprehensive test suite with real-world examples

## Installation

```bash
yarn add nestjs-html-parser
```

## Quick Start

### Import the Module

```typescript
import { Module } from '@nestjs/common';
import { HtmlParserModule } from 'nestjs-html-parser';

@Module({
  imports: [HtmlParserModule],
})
export class AppModule {}
```

### Inject the Service

```typescript
import { Injectable } from '@nestjs/common';
import { HtmlParserService } from 'nestjs-html-parser';

@Injectable()
export class YourService {
  constructor(private readonly htmlParser: HtmlParserService) {}

  async parseHackerNews() {
    const html = await this.htmlParser.fetchHtml('https://news.ycombinator.com/');
    
    // Extract page title
    const title = this.htmlParser.extractSingle(html, '//title/text()');
    
    // Extract all story titles
    const storyTitles = this.htmlParser.extractMultiple(
      html, 
      '//span[@class="titleline"]/a/text()'
    );
    
    return { title, storyTitles };
  }
}
```

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

### Advanced Methods

#### `extractStructured(html: string, schema: ExtractionSchema): Record<string, any>`

Extract data using a schema object.

```typescript
import { ExtractionSchema } from 'nestjs-html-parser';

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

## Real-World Example: Hacker News Scraper

```typescript
import { Injectable } from '@nestjs/common';
import { HtmlParserService, ExtractionSchema } from 'nestjs-html-parser';

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

## Testing

Run the test suite:

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
