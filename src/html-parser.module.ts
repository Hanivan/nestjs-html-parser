import { Module } from '@nestjs/common';
import { HtmlParserService } from './html-parser.service';

@Module({
  providers: [HtmlParserService],
  exports: [HtmlParserService],
})
export class HtmlParserModule {}
