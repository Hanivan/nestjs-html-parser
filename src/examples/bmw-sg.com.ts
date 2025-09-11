import { ExtractionSchema, HtmlParserService } from '../';

/**
 * BMW-SG Forum Scraper Demo
 *
 * This example demonstrates a full forum crawling process based on the real BMW-SG forum payload.
 * It loads HTML from https://www.bmw-sg.com/forums/forums/introduction-greetings.24/page-5
 * and applies extraction schemas matching the inspiration payload structure.
 */
const payload = {
  data: {
    endPoint:
      'https://www.bmw-sg.com/forums/forums/introduction-greetings.24/page-5',
    patternReply: [
      {
        key: 'container',
        pattern: "//article[contains(@class,'message--post')]",
        returnType: 'text',
        meta: { isContainer: 'true' },
      },
      { key: 'author', pattern: './@data-author', returnType: 'text' },
      {
        key: 'replyDate',
        pattern: './/time[@datetime]/@datetime',
        returnType: 'text',
        pipe: [
          {
            locale: 'en',
            type: 'date-format',
            format: 'YYYY-MM-DDTHH:mm:ssZZ',
            timezone: 'asia/singapore',
          },
        ],
      },
      {
        key: 'replyId',
        pattern: './@data-content',
        returnType: 'text',
        pipe: [
          {
            type: 'regex-replace',
            regex: '^post-',
            textReplacement: '',
            flag: 'g',
          },
        ],
      },
      {
        key: 'replyHtml',
        pattern: ".//article[contains(@class,'message-body')]",
        returnType: 'html',
      },
      {
        key: 'replyText',
        pattern:
          ".//article[contains(@class,'message-body')]/descendant-or-self::node()/text()[normalize-space()]",
        returnType: 'text',
        meta: { multiple: 'true' },
      },
      {
        key: 'nextPage',
        pattern:
          "//ul[contains(@class,'pageNav-main')]/li/a[@href and not(@href='#')]",
        returnType: 'text',
        meta: { isPage: 'true' },
      },
      {
        key: 'urlReply',
        pattern:
          ".//div[contains(@class,'message-attribution-opposite')]//a/@href",
        returnType: 'text',
        pipe: [{ type: 'parse-as-url' }],
      },
    ],
    interval: 45,
    priority: 'secondary',
    page: 5,
    patternPost: [
      {
        key: 'THREAD_ID_PATTERN',
        pattern: './@class',
        scope: 'thread',
        pipe: [{ type: 'regex-extraction', regex: '\\w*$', flag: 'g' }],
      },
      {
        key: 'THREAD_NODE_PATTERN',
        pattern: "//div[contains(@class, 'structItem--thread')]",
        scope: 'index-page',
        meta: { isThreadNode: 'true' },
      },
      {
        key: 'THREAD_TITLE_PATTERN',
        pattern:
          ".//div[@class='structItem-title']/a/text()[normalize-space()]",
        scope: 'thread',
      },
      {
        key: 'THREAD_LINK_PATTERN',
        pattern: ".//div[@class='structItem-title']/a/@href",
        scope: 'thread',
        pipe: [{ type: 'query-remover', removed: ['s'] }],
      },
      {
        key: 'THREAD_REPLIES_PATTERN',
        pattern: './div[3]/dl[1]/dd/text()',
        scope: 'thread',
        pipe: [{ type: 'num-normalize' }],
      },
      {
        key: 'THREAD_VIEWS_PATTERN',
        pattern: './div[3]/dl[2]/dd/text()',
        scope: 'thread',
        pipe: [{ type: 'num-normalize' }],
      },
      {
        key: 'THREAD_LAST_POST_PATTERN',
        pattern: './div[4]//time/@datetime',
        scope: 'thread',
        pipe: [
          {
            locale: 'en',
            type: 'date-format',
            format: 'YYYY-MM-DDTHH:mm:ssZZ',
            timezone: 'Asia/Singapore',
          },
        ],
      },
      {
        key: 'PAGINATION_NODE_PATTERN',
        pattern: "(//div[contains(@class, 'pageNav')])[1]/ul/li",
        scope: 'index-page',
        meta: {
          isPaginateNode: 'true',
          pagePatterns: { url: './a/@href', text: './a/text()' },
        },
      },
      {
        key: 'SECTION_TITLE',
        pattern: '//head/title/text()',
        scope: 'index-page',
      },
    ],
    maxItterateTRPage: 10,
    subForumId: 433,
    maxItteratePage: 10,
    langCode: 'en',
    countryCode: 'sg',
    numItterate: 4,
    numRetry: 0,
    origin: 'bmw-sg.com',
    mediaId: 902,
    timeout: 45,
    engine: 'html',
    timecheck: 1757488584,
  },
};

// Pipe classes following inspiration structure
class ParseAsUrlPipe {
  type = 'parse-as-url';
  baseUrl?: string;

  transform(url: string): string {
    if (!this.baseUrl) {
      throw new Error('BaseURL is required for ParseAsUrlPipe');
    }
    try {
      return new URL(url, this.baseUrl).toString();
    } catch (error) {
      throw new Error(`Invalid URL: ${url} with baseUrl: ${this.baseUrl}`);
    }
  }
}

class RegexReplacePipe {
  type = 'regex-replace';
  baseUrl?: string;
  regex: string = '';
  textReplacement: string = '';
  flag: string = 'g';

  transform(val: string): string {
    if (typeof val === 'string') {
      const flag = Array.isArray(this.flag) ? this.flag.join(',') : this.flag;
      const result = val.replace(
        new RegExp(this.regex, flag),
        this.textReplacement,
      ) as string;
      return result;
    } else {
      return val;
    }
  }
}

class RegexExtractionPipe {
  type = 'regex-extraction';
  baseUrl?: string;
  regex: string = '';
  flag: string = 'g';

  transform(val: string): string {
    if (typeof val === 'string') {
      const flag = Array.isArray(this.flag) ? this.flag.join(',') : this.flag;
      const match = val.match(new RegExp(this.regex, flag));
      return match ? match[0] : '';
    } else {
      return val;
    }
  }
}

class QueryRemoverPipe {
  type = 'query-remover';
  baseUrl?: string;
  removed: string[] = [];

  transform(url: string): string {
    try {
      const urlObj = new URL(url);
      this.removed.forEach((param) => {
        urlObj.searchParams.delete(param);
      });
      return urlObj.toString();
    } catch (error) {
      return url; // Return original if not a valid URL
    }
  }
}

class NumNormalizePipe {
  type = 'num-normalize';
  baseUrl?: string;

  transform(numString: string): number {
    if (typeof numString !== 'string') {
      return numString;
    }
    const val = numString?.toLowerCase().replace(new RegExp(',', 'g'), '.');
    let resVal = parseFloat(val as string);
    if (val.endsWith('k') || val.endsWith('rb')) {
      resVal *= 1000;
    } else if (val.endsWith('m')) {
      resVal *= 1000000;
    }
    if (isNaN(resVal)) {
      return 0;
    }
    return Math.round(resVal);
  }
}

class DateFormatPipe {
  type = 'date-format';
  baseUrl?: string;
  locale: string = 'en';
  format: string = 'YYYY-MM-DDTHH:mm:ssZZ';
  timezone: string = 'Asia/Singapore';

  transform(dateString: string): number {
    // Simple date parser that converts to Unix timestamp
    if (typeof dateString !== 'string' || !dateString.trim()) {
      return Date.now() / 1000;
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? Date.now() / 1000 : date.getTime() / 1000;
  }
}

class ThreadIdExtractorPipe {
  type = 'thread-id-extractor';
  baseUrl?: string;

  transform(url: string): string {
    if (typeof url !== 'string') return url;
    const match = url.match(/\.(\d+)\//);
    return match ? match[1] : url;
  }
}

// Define interfaces based on inspiration payload structure
interface ForumThread {
  threadId: string;
  threadTitle: string;
  threadLink: string;
  threadReplies: number;
  threadViews: number;
  threadLastPost: number;
}

interface ForumReply {
  author: string;
  replyDate: number;
  replyId: string;
  replyHtml: string;
  replyText: string[];
  urlReply: string;
}

// Mapping function to convert raw pipes to object-based transform format (DRY principle)
const mappingTransform = (rawPipes: any[], withItsPayload?: any): any[] => {
  if (!rawPipes || !Array.isArray(rawPipes)) return [];

  return rawPipes.map((pipe) => {
    // Handle different pipe types based on inspiration CleanerType enum
    switch (pipe.type) {
      case 'parse-as-url':
        return {
          class: ParseAsUrlPipe,
        };

      case 'query-remover':
        return {
          class: QueryRemoverPipe,
          payload: {
            removed: pipe.removed || withItsPayload?.removed || [],
          },
        };

      case 'num-normalize':
        return {
          class: NumNormalizePipe,
        };

      case 'date-format':
        return {
          class: DateFormatPipe,
          payload: {
            locale: pipe.locale || 'en',
            format: pipe.format || 'YYYY-MM-DDTHH:mm:ssZZ',
            timezone: pipe.timezone || 'Asia/Singapore',
          },
        };

      case 'regex-replace':
        return {
          class: RegexReplacePipe,
          payload: {
            regex: pipe.regex || '',
            textReplacement: pipe.textReplacement || '',
            flag: pipe.flag || 'g',
          },
        };

      case 'regex-extraction':
        return {
          class: RegexExtractionPipe,
          payload: {
            regex: pipe.regex || '',
            flag: pipe.flag || 'g',
          },
        };

      default:
        console.warn(`Unknown pipe type: ${pipe.type}`);
        // Return a no-op transform instead of null
        return {
          class: class NoOpPipe {
            transform(val: any) {
              return val;
            }
          },
        };
    }
  }); // Don't filter, always return valid transforms
};

async function scrapeBmwSgForum(verbose = false): Promise<void> {
  const parser = new HtmlParserService();

  console.log('🏎️ BMW-SG Forum Scraper Demo');
  console.log('='.repeat(50));

  // inspiration payload configuration
  const endPoint = payload.data.endPoint;
  const baseUrl = parser.getOrigin(endPoint);

  console.log(`🔗 Target URL: ${endPoint}`);
  console.log(`🏠 Base URL: ${baseUrl}`);
  console.log();

  try {
    console.log('📥 Fetching HTML from BMW-SG forum...');

    // Fetch the HTML content from the real BMW-SG forum
    const response = await parser.fetchHtml(endPoint, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    console.log(
      `✅ HTML fetched successfully (${response.data.length} characters)`,
    );
    console.log(`📊 Response status: ${response.status}`);
    console.log();

    // 1. Thread extraction based on inspiration patternPost
    console.log('📝 Thread Extraction (patternPost)');
    console.log('-'.repeat(40));

    // Build thread schema from payload patterns
    const getPatternByKey = (key: string) =>
      payload.data.patternPost.find((p) => p.key === key);

    const threadSchema: ExtractionSchema<ForumThread> = {
      // THREAD_ID_PATTERN - Extract numeric ID from URL
      threadId: {
        selector: './/div[@class="structItem-title"]/a/@href',
        type: 'xpath',
        transform: [{ class: ThreadIdExtractorPipe }],
      },
      // THREAD_TITLE_PATTERN
      threadTitle: {
        selector:
          getPatternByKey('THREAD_TITLE_PATTERN')?.pattern ||
          './/div[@class="structItem-title"]/a/text()[normalize-space()]',
        type: 'xpath',
      },
      // THREAD_LINK_PATTERN
      threadLink: {
        selector:
          getPatternByKey('THREAD_LINK_PATTERN')?.pattern ||
          './/div[@class="structItem-title"]/a/@href',
        type: 'xpath',
        transform: [
          { class: ParseAsUrlPipe }, // Convert to absolute URL
          ...mappingTransform(
            getPatternByKey('THREAD_LINK_PATTERN')?.pipe || [
              { type: 'query-remover', removed: ['s'] },
            ],
          ),
        ],
      },
      // THREAD_REPLIES_PATTERN - From structItem-cell--meta
      threadReplies: {
        selector:
          './/div[contains(@class,"structItem-cell--meta")]//dl[dt="Replies"]/dd/text()',
        type: 'xpath',
        transform: mappingTransform([{ type: 'num-normalize' }]),
      },
      // THREAD_VIEWS_PATTERN - From structItem-cell--meta
      threadViews: {
        selector:
          './/div[contains(@class,"structItem-cell--meta")]//dl[dt="Views"]/dd/text()',
        type: 'xpath',
        transform: mappingTransform([{ type: 'num-normalize' }]),
      },
      // THREAD_LAST_POST_PATTERN - From structItem-cell--latest (updated for real HTML structure)
      threadLastPost: {
        selector:
          './/div[contains(@class,"structItem-cell--latest")]//time/@datetime',
        type: 'xpath',
        transform: mappingTransform(
          getPatternByKey('THREAD_LAST_POST_PATTERN')?.pipe || [
            {
              type: 'date-format',
              locale: 'en',
              format: 'YYYY-MM-DDTHH:mm:ssZZ',
              timezone: 'Asia/Singapore',
            },
          ],
        ),
      },
    };

    // Extract threads using THREAD_NODE_PATTERN
    const threadNodePattern =
      payload.data.patternPost.find((p) => p.key === 'THREAD_NODE_PATTERN')
        ?.pattern || '//div[contains(@class, "structItem--thread")]';
    const threads = parser.extractStructuredList<ForumThread>(
      response.data,
      threadNodePattern, // THREAD_NODE_PATTERN
      threadSchema,
      'xpath',
      {
        verbose,
        baseUrl,
      },
    );

    console.log(`✅ Extracted ${threads.length} threads:`);
    console.log();

    threads.forEach((thread, index) => {
      console.log(`📄 Thread ${index + 1}:`);
      console.log(`   ID: ${thread.threadId}`);
      console.log(`   Title: ${thread.threadTitle}`);
      console.log(`   Link: ${thread.threadLink}`);
      console.log(`   Replies: ${thread.threadReplies}`);
      console.log(`   Views: ${thread.threadViews}`);
      const timestamp =
        thread.threadLastPost && !isNaN(thread.threadLastPost)
          ? thread.threadLastPost
          : Date.now() / 1000;
      const lastPostDate = new Date(timestamp * 1000);
      console.log(`   Last Post: ${lastPostDate.toISOString()}`);
      console.log();
    });

    // 2. Reply extraction based on inspiration patternReply
    console.log('💬 Reply Extraction (patternReply)');
    console.log('-'.repeat(40));

    // Build reply schema from payload patterns
    const getReplyPatternByKey = (key: string) =>
      payload.data.patternReply.find((p) => p.key === key);

    const replySchema: ExtractionSchema<ForumReply> = {
      // Author
      author: {
        selector: getReplyPatternByKey('author')?.pattern || './@data-author',
        type: 'xpath',
      },
      // Reply date
      replyDate: {
        selector:
          getReplyPatternByKey('replyDate')?.pattern ||
          './/time[@datetime]/@datetime',
        type: 'xpath',
        transform: mappingTransform(
          getReplyPatternByKey('replyDate')?.pipe || [
            {
              type: 'date-format',
              locale: 'en',
              format: 'YYYY-MM-DDTHH:mm:ssZZ',
              timezone: 'Asia/Singapore',
            },
          ],
        ),
      },
      // Reply ID
      replyId: {
        selector: getReplyPatternByKey('replyId')?.pattern || './@data-content',
        type: 'xpath',
        transform: mappingTransform(
          getReplyPatternByKey('replyId')?.pipe || [
            {
              type: 'regex-replace',
              regex: '^post-',
              textReplacement: '',
              flag: 'g',
            },
          ],
        ),
      },
      // Reply HTML
      replyHtml: {
        selector:
          getReplyPatternByKey('replyHtml')?.pattern ||
          './/article[contains(@class,"message-body")]',
        type: 'xpath',
        raw: true, // Return HTML instead of text
      },
      // Reply text (multiple text nodes)
      replyText: {
        selector:
          getReplyPatternByKey('replyText')?.pattern ||
          './/article[contains(@class,"message-body")]/descendant-or-self::node()/text()[normalize-space()]',
        type: 'xpath',
        multiple: true, // Extract multiple text nodes
      },
      // URL reply
      urlReply: {
        selector:
          getReplyPatternByKey('urlReply')?.pattern ||
          './/div[contains(@class,"message-attribution-opposite")]//a/@href',
        type: 'xpath',
        transform: mappingTransform(
          getReplyPatternByKey('urlReply')?.pipe || [{ type: 'parse-as-url' }],
        ),
      },
    };

    // Extract replies using container pattern from payload
    const replyContainerPattern =
      getReplyPatternByKey('container')?.pattern ||
      '//article[contains(@class,"message--post")]';
    const replies = parser.extractStructuredList<ForumReply>(
      response.data,
      replyContainerPattern, // container pattern
      replySchema,
      'xpath',
      {
        verbose,
        baseUrl,
      },
    );

    console.log(`✅ Extracted ${replies.length} replies:`);
    console.log();

    replies.slice(0, 3).forEach((reply, index) => {
      // Show first 3 replies
      console.log(`💭 Reply ${index + 1}:`);
      console.log(`   Author: ${reply.author}`);
      const replyTimestamp =
        reply.replyDate && !isNaN(reply.replyDate)
          ? reply.replyDate
          : Date.now() / 1000;
      const replyDate = new Date(replyTimestamp * 1000);
      console.log(`   Date: ${replyDate.toISOString()}`);
      console.log(`   ID: ${reply.replyId}`);
      console.log(
        `   Text (first 100 chars): ${reply.replyText ? reply.replyText.join(' ').substring(0, 100) : 'N/A'}...`,
      );
      console.log(`   URL: ${reply.urlReply}`);
      console.log();
    });

    // 3. Pagination and section info
    console.log('📄 Page Information');
    console.log('-'.repeat(40));

    // Extract section title using payload pattern
    const sectionTitlePattern =
      getPatternByKey('SECTION_TITLE')?.pattern || '//head/title/text()';
    const sectionTitle = parser.extractSingle<string>(
      response.data,
      sectionTitlePattern,
      'xpath',
    );

    console.log(`📋 Section Title: ${sectionTitle}`);

    // Extract pagination info using payload pattern
    const nextPagePattern =
      getReplyPatternByKey('nextPage')?.pattern ||
      '//ul[contains(@class,"pageNav-main")]/li/a[@href and not(@href="#")]/@href';
    const nextPageUrls = parser.extractMultiple<string>(
      response.data,
      nextPagePattern,
      'xpath',
      undefined,
      {
        baseUrl,
        transform: mappingTransform([{ type: 'parse-as-url' }]),
      },
    );

    console.log(`🔗 Available page URLs: ${nextPageUrls.length}`);
    nextPageUrls.slice(0, 5).forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });

    // 4. Summary statistics
    console.log();
    console.log('📊 Scraping Summary');
    console.log('-'.repeat(40));
    console.log(`🎯 Endpoint: ${endPoint}`);
    console.log(`📝 Threads extracted: ${threads.length}`);
    console.log(`💬 Replies extracted: ${replies.length}`);
    console.log(`📄 Pagination URLs: ${nextPageUrls.length}`);
    console.log(`📋 Section: ${sectionTitle}`);
    console.log(`🏷️ Media ID: ${payload.data.mediaId}`);
    console.log(`🌐 Origin: ${payload.data.origin}`);
    console.log(`⏱️ Interval: ${payload.data.interval}s`);
    console.log(`📄 Page: ${payload.data.page}`);
    console.log(`🔧 Engine: ${payload.data.engine}`);

    // Show some pipe transformation examples
    console.log();
    console.log('🔧 Live Pipe Transformations');
    console.log('-'.repeat(40));

    if (threads.length > 0) {
      const sampleThread = threads[0];
      console.log('📝 Thread ID extraction:');
      console.log(`   Raw class: "${sampleThread.threadId}"`);
      console.log(`   Regex pattern: "\\w*$" → Extract last word`);
      console.log();
    }

    if (replies.length > 0) {
      const sampleReply = replies[0];
      console.log('💭 Reply ID transformation:');
      console.log(`   Raw data-content: "post-${sampleReply.replyId}"`);
      console.log(`   Regex replace: "^post-" → "" (remove prefix)`);
      console.log(`   Result: "${sampleReply.replyId}"`);
      console.log();
    }
  } catch (error) {
    console.error('❌ Error during BMW-SG forum scraping:', error);
    throw error;
  }
}

// Export pipe classes, mapping function, and main function
export {
  DateFormatPipe,
  mappingTransform,
  NumNormalizePipe,
  ParseAsUrlPipe,
  QueryRemoverPipe,
  RegexExtractionPipe,
  RegexReplacePipe,
  scrapeBmwSgForum,
  ThreadIdExtractorPipe,
};

// Run the scraper if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      await scrapeBmwSgForum(false);

      console.log('🎉 BMW-SG forum scraping completed successfully!');
    } catch (error) {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    }
  })();
}
