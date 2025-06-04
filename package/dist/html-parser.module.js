"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HtmlParserModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlParserModule = void 0;
const common_1 = require("@nestjs/common");
const html_parser_config_1 = require("./html-parser.config");
const html_parser_service_1 = require("./html-parser.service");
let HtmlParserModule = HtmlParserModule_1 = class HtmlParserModule {
    static forRoot(config = {}) {
        const configProvider = {
            provide: html_parser_config_1.HTML_PARSER_LOGGER_LEVEL,
            useValue: config.loggerLevel || 'log',
        };
        return {
            module: HtmlParserModule_1,
            providers: [html_parser_service_1.HtmlParserService, configProvider],
            exports: [html_parser_service_1.HtmlParserService],
        };
    }
    static forRootAsync(options) {
        const asyncProviders = this.createAsyncProviders(options);
        return {
            module: HtmlParserModule_1,
            imports: options.imports || [],
            providers: [html_parser_service_1.HtmlParserService, ...asyncProviders],
            exports: [html_parser_service_1.HtmlParserService],
        };
    }
    static createAsyncProviders(options) {
        if (options.useFactory) {
            return [
                {
                    provide: html_parser_config_1.HTML_PARSER_LOGGER_LEVEL,
                    useFactory: async (...args) => {
                        const config = await options.useFactory(...args);
                        return config.loggerLevel || 'log';
                    },
                    inject: options.inject || [],
                },
            ];
        }
        // useClass or useExisting
        const inject = [
            (options.useExisting ||
                options.useClass),
        ];
        return [
            {
                provide: html_parser_config_1.HTML_PARSER_LOGGER_LEVEL,
                useFactory: async (factory) => {
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
};
exports.HtmlParserModule = HtmlParserModule;
exports.HtmlParserModule = HtmlParserModule = HtmlParserModule_1 = __decorate([
    (0, common_1.Module)({})
], HtmlParserModule);
//# sourceMappingURL=html-parser.module.js.map