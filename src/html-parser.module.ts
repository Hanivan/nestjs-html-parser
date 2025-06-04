import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';
import {
  HTML_PARSER_LOGGER_LEVEL,
  HtmlParserConfig,
} from './html-parser.config';
import { HtmlParserService } from './html-parser.service';

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
 * // Basic usage with default configuration
 * import { Module } from '@nestjs/common';
 * import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';
 *
 * @Module({
 *   imports: [HtmlParserModule], // Uses default configuration (loggerLevel: 'log')
 *   // ... other module configuration
 * })
 * export class AppModule {}
 *
 * // Advanced usage with custom configuration
 * @Module({
 *   imports: [
 *     HtmlParserModule.forRoot({
 *       loggerLevel: 'debug'
 *     })
 *   ],
 * })
 * export class AppModule {}
 *
 * // Async configuration using ConfigService
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot(),
 *     HtmlParserModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (configService: ConfigService) => ({
 *         loggerLevel: configService.get('HTML_PARSER_LOGGER_LEVEL', 'warn')
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
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

export interface HtmlParserModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<HtmlParserConfigFactory>;
  useClass?: Type<HtmlParserConfigFactory>;
  useFactory?: (...args: any[]) => Promise<HtmlParserConfig> | HtmlParserConfig;
  inject?: any[];
}

export interface HtmlParserConfigFactory {
  createHtmlParserConfig(): Promise<HtmlParserConfig> | HtmlParserConfig;
}

/**
 * HTML Parser Module with default configuration
 *
 * When imported directly, provides HtmlParserService with default settings:
 * - loggerLevel: 'log'
 *
 * For custom configuration, use forRoot() or forRootAsync()
 */
@Module({
  providers: [
    HtmlParserService,
    {
      provide: HTML_PARSER_LOGGER_LEVEL,
      useValue: 'log', // Default logger level
    },
  ],
  exports: [HtmlParserService],
})
export class HtmlParserModule {
  /**
   * Configure the HTML Parser Module with custom options
   *
   * @param config - Configuration options for the HTML Parser
   * @returns DynamicModule with configured providers
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     HtmlParserModule.forRoot({
   *       loggerLevel: 'debug'
   *     })
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(config: HtmlParserConfig = {}): DynamicModule {
    const configProvider: Provider = {
      provide: HTML_PARSER_LOGGER_LEVEL,
      useValue: config.loggerLevel || 'log',
    };

    return {
      module: HtmlParserModule,
      providers: [HtmlParserService, configProvider],
      exports: [HtmlParserService],
    };
  }

  /**
   * Configure the HTML Parser Module asynchronously
   *
   * @param options - Async configuration options
   * @returns DynamicModule with async configured providers
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     ConfigModule.forRoot(),
   *     HtmlParserModule.forRootAsync({
   *       imports: [ConfigModule],
   *       useFactory: (configService: ConfigService) => ({
   *         loggerLevel: configService.get('HTML_PARSER_LOGGER_LEVEL', 'warn')
   *       }),
   *       inject: [ConfigService],
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRootAsync(options: HtmlParserModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: HtmlParserModule,
      imports: options.imports || [],
      providers: [HtmlParserService, ...asyncProviders],
      exports: [HtmlParserService],
    };
  }

  /**
   * Create async providers for the module configuration
   *
   * @param options - Async configuration options
   * @returns Array of providers for async configuration
   * @private
   */
  private static createAsyncProviders(
    options: HtmlParserModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: HTML_PARSER_LOGGER_LEVEL,
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory!(...args);
            return config.loggerLevel || 'log';
          },
          inject: options.inject || [],
        },
      ];
    }
    // useClass or useExisting
    const inject = [
      (options.useExisting ||
        options.useClass) as Type<HtmlParserConfigFactory>,
    ];
    return [
      {
        provide: HTML_PARSER_LOGGER_LEVEL,
        useFactory: async (factory: HtmlParserConfigFactory) => {
          const config = await factory.createHtmlParserConfig();
          return config.loggerLevel || 'log';
        },
        inject,
      },
      ...(options.useClass
        ? [{ provide: options.useClass, useClass: options.useClass }]
        : []),
    ];
  }
}
