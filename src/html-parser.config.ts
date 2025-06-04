import { LogLevel } from '@nestjs/common';

export const HTML_PARSER_LOGGER_LEVEL = 'HTML_PARSER_LOGGER_LEVEL';

export interface HtmlParserConfig {
  loggerLevel?: LogLevel | Array<LogLevel>;
}
