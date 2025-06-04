import { DynamicModule, ModuleMetadata, Type } from '@nestjs/common';
import { HtmlParserConfig } from './html-parser.config';
/**
 * HTML Parser Module for NestJS
 *
 * A NestJS module that provides HTML parsing capabilities with XPath and CSS selector support.
 * This module exports the HtmlParserService which can be injected into other services or controllers.
 *
 * Features:
 * - XPath and CSS selector extraction
 * - Proxy support with authentication
 * - Random user agent rotation
 * - Rich response metadata
 * - Verbose logging for debugging
 * - Retry logic with configurable delays
 *
 * @example
 * ```typescript
 * // Import in your app module
 * import { Module } from '@nestjs/common';
 * import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';
 *
 * @Module({
 *   imports: [HtmlParserModule],
 *   // ... other module configuration
 * })
 * export class AppModule {}
 *
 * // Use in a service
 * import { Injectable } from '@nestjs/common';
 * import { HtmlParserService } from '@hanivanrizky/nestjs-html-parser';
 *
 * @Injectable()
 * export class ScrapingService {
 *   constructor(private readonly htmlParser: HtmlParserService) {}
 *
 *   async scrapeWebsite(url: string) {
 *     const response = await this.htmlParser.fetchHtml(url);
 *     const title = this.htmlParser.extractSingle(response.data, '//title/text()');
 *     return { title, status: response.status };
 *   }
 * }
 * ```
 */
export interface HtmlParserModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<HtmlParserConfigFactory>;
    useClass?: Type<HtmlParserConfigFactory>;
    useFactory?: (...args: any[]) => Promise<HtmlParserConfig> | HtmlParserConfig;
    inject?: any[];
}
export interface HtmlParserConfigFactory {
    createHtmlParserConfig(): Promise<HtmlParserConfig> | HtmlParserConfig;
}
export declare class HtmlParserModule {
    static forRoot(config?: HtmlParserConfig): DynamicModule;
    static forRootAsync(options: HtmlParserModuleAsyncOptions): DynamicModule;
    private static createAsyncProviders;
}
