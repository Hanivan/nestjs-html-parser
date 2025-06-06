import {
  DynamicModule,
  LogLevel,
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
 * Provides HTML parsing capabilities with XPath and CSS selector support for NestJS applications.
 *
 * **Features:**
 * - XPath and CSS selector extraction
 * - Proxy support with authentication
 * - Random user agent rotation
 * - Rich response metadata
 * - Verbose logging for debugging
 * - Retry logic with configurable delays
 *
 * @remarks
 * Always use `HtmlParserModule.forRoot()` or `HtmlParserModule.forRootAsync()` for proper configuration and future-proof usage.
 *
 * @example
 * Basic usage with custom configuration
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';
 *
 * @Module({
 *   imports: [
 *     HtmlParserModule.forRoot({
 *       loggerLevel: 'debug'
 *     })
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * Async configuration with environment variables
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { ConfigModule, ConfigService } from '@nestjs/config';
 * import { HtmlParserModule } from '@hanivanrizky/nestjs-html-parser';
 *
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
 *
 * @example
 * Using the service in your application
 * ```typescript
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
 *
 * @author Hanivan Rizky Sobari <hanivan20@gmail.com>
 * @license MIT
 */

/**
 * Options for configuring HtmlParserModule asynchronously
 */
export interface HtmlParserModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Use an existing provider that implements HtmlParserConfigFactory
   */
  useExisting?: Type<HtmlParserConfigFactory>;

  /**
   * Create a new instance of a class that implements HtmlParserConfigFactory
   */
  useClass?: Type<HtmlParserConfigFactory>;

  /**
   * Factory function that returns configuration
   */
  useFactory?: (...args: any[]) => Promise<HtmlParserConfig> | HtmlParserConfig;

  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];
}

/**
 * Factory interface for creating HtmlParserConfig
 */
export interface HtmlParserConfigFactory {
  /**
   * Create configuration for the HTML Parser module
   * @returns Configuration object or promise that resolves to configuration
   */
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
      useValue: ['log', 'error', 'debug'] as LogLevel[],
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
   * Basic configuration
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
   *
   * @example
   * Using different logger levels
   * ```typescript
   * // For production - minimal logging
   * HtmlParserModule.forRoot({ loggerLevel: 'error' })
   *
   * // For development - detailed logging
   * HtmlParserModule.forRoot({ loggerLevel: 'debug' })
   *
   * // For testing - verbose logging
   * HtmlParserModule.forRoot({ loggerLevel: 'verbose' })
   * ```
   */
  static forRoot(config: HtmlParserConfig = {}): DynamicModule {
    const configProvider: Provider = {
      provide: HTML_PARSER_LOGGER_LEVEL,
      useValue: config.loggerLevel || (['log', 'error', 'debug'] as LogLevel[]),
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
   * Useful when configuration depends on other modules or services that need to be initialized first.
   *
   * @param options - Async configuration options
   * @returns DynamicModule with async configured providers
   *
   * @example
   * Using with ConfigService
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
   *
   * @example
   * Using with custom configuration factory
   * ```typescript
   * @Injectable()
   * class HtmlParserConfigService implements HtmlParserConfigFactory {
   *   createHtmlParserConfig(): HtmlParserConfig {
   *     return {
   *       loggerLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
   *     };
   *   }
   * }
   *
   * @Module({
   *   imports: [
   *     HtmlParserModule.forRootAsync({
   *       useClass: HtmlParserConfigService,
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   *
   * @example
   * Using with existing provider
   * ```typescript
   * @Module({
   *   imports: [
   *     HtmlParserModule.forRootAsync({
   *       useExisting: MyExistingConfigService,
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
            return (
              config.loggerLevel || (['log', 'error', 'debug'] as LogLevel[])
            );
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
          return (
            config.loggerLevel || (['log', 'error', 'debug'] as LogLevel[])
          );
        },
        inject,
      },
      ...(options.useClass
        ? [{ provide: options.useClass, useClass: options.useClass }]
        : []),
    ];
  }
}
