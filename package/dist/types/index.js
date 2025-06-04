"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Proxy types
__exportStar(require("./proxy"), exports);
// Response types
__exportStar(require("./response"), exports);
// Extraction types
__exportStar(require("./extraction"), exports);
// Options types
__exportStar(require("./options"), exports);
//# sourceMappingURL=index.js.map