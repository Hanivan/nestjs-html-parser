/**
 * @fileoverview NestJS HTML Parser Package
 *
 * A powerful NestJS package for parsing HTML content with comprehensive features:
 *
 * ## Features
 * - **XPath & CSS Selectors**: Extract data using XPath expressions or CSS selectors
 * - **Proxy Support**: Configure HTTP, HTTPS, SOCKS4, and SOCKS5 proxies with authentication
 * - **Random User Agents**: Rotate user agents to avoid detection
 * - **Rich Metadata**: Get response headers, status codes, and more
 * - **Retry Logic**: Configurable retry attempts with delays
 * - **Verbose Logging**: Detailed debugging information
 * - **Type Safety**: Full TypeScript support with comprehensive types
 *
 * ## Quick Start
 * ```typescript
 * import { HtmlParserModule, HtmlParserService } from '@hanivanrizky/nestjs-html-parser';
 *
 * // In your module
 * @Module({
 *   imports: [HtmlParserModule],
 * })
 * export class AppModule {}
 *
 * // In your service
 * @Injectable()
 * export class MyService {
 *   constructor(private htmlParser: HtmlParserService) {}
 *
 *   async getData() {
 *     const response = await this.htmlParser.fetchHtml('https://example.com');
 *     const title = this.htmlParser.extractSingle(response.data, '//title/text()');
 *     return title;
 *   }
 * }
 * ```
 *
 * @author Hanivan Rizky Sobari <hanivan20@gmail.com>
 * @license MIT
 */

export * from './app.module';
export * from './examples';
export * from './html-parser.module';
export * from './html-parser.service';
export * from './types';
