/**
 * @fileoverview Type Definitions for NestJS HTML Parser
 *
 * This module exports all TypeScript interfaces and types used by the HTML parser package.
 * These types provide full type safety and IntelliSense support for all package features.
 *
 * ## Available Types
 * - **ProxyConfig**: Configuration for HTTP/HTTPS/SOCKS proxy servers
 * - **HtmlFetchResponse**: Response object containing HTML content and metadata
 * - **ExtractionSchema**: Schema definition for structured data extraction
 * - **HtmlParserOptions**: Configuration options for HTML parsing operations
 *
 * @example
 * ```typescript
 * import {
 *   HtmlParserOptions,
 *   ProxyConfig,
 *   ExtractionSchema
 * } from '@hanivanrizky/nestjs-html-parser';
 *
 * const options: HtmlParserOptions = {
 *   timeout: 10000,
 *   useRandomUserAgent: true,
 *   verbose: true
 * };
 *
 * const proxy: ProxyConfig = {
 *   url: 'http://proxy.example.com:8080',
 *   username: 'user',
 *   password: 'pass'
 * };
 * ```
 */

// Proxy types
export * from './proxy';

// Response types
export * from './response';

// Extraction types
export * from './extraction';

// Options types
export * from './options';
