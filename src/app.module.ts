import { Module } from '@nestjs/common';
import { HtmlParserModule } from './html-parser.module';

@Module({
  imports: [HtmlParserModule],
})
export class AppModule {}
