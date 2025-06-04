export const HTML_PARSER_LOGGER_LEVEL = 'HTML_PARSER_LOGGER_LEVEL';

export interface HtmlParserConfig {
  loggerLevel?:
    | 'log'
    | 'error'
    | 'warn'
    | 'debug'
    | 'verbose'
    | Array<'log' | 'error' | 'warn' | 'debug' | 'verbose'>;
}
