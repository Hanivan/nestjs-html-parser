import { Test, TestingModule } from '@nestjs/testing';
import { ExtractionSchema, HtmlParserService } from './html-parser.service';

describe('HtmlParserService', () => {
  let service: HtmlParserService;
  let hackerNewsHtml: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HtmlParserService],
    }).compile();

    service = module.get<HtmlParserService>(HtmlParserService);

    // Fetch Hacker News HTML for testing
    try {
      hackerNewsHtml = await service.fetchHtml('https://news.ycombinator.com/');
    } catch (error) {
      console.warn('Failed to fetch live Hacker News, using mock HTML');
      hackerNewsHtml = getMockHackerNewsHtml();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchHtml', () => {
    it('should fetch HTML content from a URL', async () => {
      const html = await service.fetchHtml('https://news.ycombinator.com/');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('<title>Hacker News</title>');
    });

    it('should handle fetch errors gracefully', async () => {
      await expect(
        service.fetchHtml('https://nonexistent-url-12345.com'),
      ).rejects.toThrow();
    });

    it('should respect custom options', async () => {
      const options = {
        timeout: 5000,
        headers: { 'Custom-Header': 'test' },
      };

      // This should not throw with valid options
      const html = await service.fetchHtml(
        'https://news.ycombinator.com/',
        options,
      );
      expect(typeof html).toBe('string');
    });
  });

  describe('extractSingle', () => {
    it('should extract single value using XPath', () => {
      // Extract the site title using XPath
      const title = service.extractSingle(hackerNewsHtml, '//title/text()');
      expect(title).toBe('Hacker News');
    });

    it('should extract single value using CSS selector', () => {
      // Extract the site title using CSS selector
      const title = service.extractSingle(hackerNewsHtml, 'title', 'css');
      expect(title).toBe('Hacker News');
    });

    it('should extract attribute values', () => {
      // Extract href attribute from first story link
      const href = service.extractSingle(
        hackerNewsHtml,
        '//a[contains(@class, "hnuser")]/@href',
        'xpath',
      );
      expect(href).toMatch(/^user\?id=/);
    });

    it('should return null for non-existent elements', () => {
      const result = service.extractSingle(
        hackerNewsHtml,
        '//nonexistent-element/text()',
      );
      expect(result).toBeNull();
    });
  });

  describe('extractMultiple', () => {
    it('should extract multiple values using XPath', () => {
      // Extract all story titles
      const titles = service.extractMultiple(
        hackerNewsHtml,
        '//span[contains(@class, "titleline")]/a/text()',
      );
      expect(Array.isArray(titles)).toBe(true);
      expect(titles.length).toBeGreaterThan(0);
      expect(titles.every((title) => typeof title === 'string')).toBe(true);
    });

    it('should extract multiple values using CSS selector', () => {
      // Extract all story titles using CSS
      const titles = service.extractMultiple(
        hackerNewsHtml,
        '.titleline a',
        'css',
      );
      expect(Array.isArray(titles)).toBe(true);
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should extract multiple attributes', () => {
      // Extract all story URLs
      const urls = service.extractMultiple(
        hackerNewsHtml,
        '//span[contains(@class, "titleline")]/a/@href',
      );
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBeGreaterThan(0);
      expect(urls.every((url) => typeof url === 'string')).toBe(true);
    });

    it('should return empty array for non-existent elements', () => {
      const result = service.extractMultiple(
        hackerNewsHtml,
        '//nonexistent-element',
      );
      expect(result).toEqual([]);
    });
  });

  describe('extractText', () => {
    it('should extract text content using XPath', () => {
      const text = service.extractText(hackerNewsHtml, '//title');
      expect(text).toBe('Hacker News');
    });

    it('should extract text content using CSS selector', () => {
      const text = service.extractText(hackerNewsHtml, 'title', 'css');
      expect(text).toBe('Hacker News');
    });
  });

  describe('extractAttributes', () => {
    it('should extract attribute values from multiple elements', () => {
      const hrefs = service.extractAttributes(
        hackerNewsHtml,
        '//span[contains(@class, "titleline")]/a',
        'href',
      );
      expect(Array.isArray(hrefs)).toBe(true);
      expect(hrefs.length).toBeGreaterThan(0);
      expect(hrefs.every((href) => typeof href === 'string')).toBe(true);
    });

    it('should work with CSS selectors', () => {
      const hrefs = service.extractAttributes(
        hackerNewsHtml,
        '.titleline a',
        'href',
        'css',
      );
      expect(Array.isArray(hrefs)).toBe(true);
      expect(hrefs.length).toBeGreaterThan(0);
    });
  });

  describe('exists', () => {
    it('should return true for existing elements (XPath)', () => {
      const exists = service.exists(hackerNewsHtml, '//title');
      expect(exists).toBe(true);
    });

    it('should return true for existing elements (CSS)', () => {
      const exists = service.exists(hackerNewsHtml, 'title', 'css');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent elements', () => {
      const exists = service.exists(hackerNewsHtml, '//nonexistent-element');
      expect(exists).toBe(false);
    });

    it('should handle malformed selectors gracefully', () => {
      const exists = service.exists(hackerNewsHtml, '//[[[invalid');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should count elements using XPath', () => {
      const count = service.count(
        hackerNewsHtml,
        '//tr[contains(@class, "athing")]',
      );
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should count elements using CSS selector', () => {
      const count = service.count(hackerNewsHtml, '.athing', 'css');
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent elements', () => {
      const count = service.count(hackerNewsHtml, '//nonexistent-element');
      expect(count).toBe(0);
    });

    it('should handle malformed selectors gracefully', () => {
      const count = service.count(hackerNewsHtml, '//[[[invalid');
      expect(count).toBe(0);
    });
  });

  describe('extractStructured', () => {
    it('should extract structured data using schema', () => {
      const schema: ExtractionSchema = {
        title: {
          selector: '//title/text()',
          type: 'xpath',
        },
        firstStoryTitle: {
          selector: '(//span[contains(@class, "titleline")]/a)[1]/text()',
          type: 'xpath',
        },
        firstStoryUrl: {
          selector: '(//span[contains(@class, "titleline")]/a)[1]',
          type: 'xpath',
          attribute: 'href',
        },
      };

      const result = service.extractStructured(hackerNewsHtml, schema);

      expect(result).toHaveProperty('title');
      expect(result.title).toBe('Hacker News');
      expect(result).toHaveProperty('firstStoryTitle');
      expect(typeof result.firstStoryTitle).toBe('string');
      expect(result).toHaveProperty('firstStoryUrl');
      expect(typeof result.firstStoryUrl).toBe('string');
    });

    it('should handle transform functions', () => {
      const schema: ExtractionSchema = {
        titleUppercase: {
          selector: '//title/text()',
          type: 'xpath',
          transform: (value: string) => value.toUpperCase(),
        },
      };

      const result = service.extractStructured(hackerNewsHtml, schema);
      expect(result.titleUppercase).toBe('HACKER NEWS');
    });

    it('should set null for non-existent elements', () => {
      const schema: ExtractionSchema = {
        nonExistent: {
          selector: '//nonexistent-element/text()',
          type: 'xpath',
        },
      };

      const result = service.extractStructured(hackerNewsHtml, schema);
      expect(result.nonExistent).toBeNull();
    });
  });

  describe('extractStructuredList', () => {
    it('should extract list of structured data using XPath container', () => {
      const schema: ExtractionSchema = {
        title: {
          selector: './/span[contains(@class, "titleline")]/a/text()',
          type: 'xpath',
        },
        url: {
          selector: './/span[contains(@class, "titleline")]/a',
          type: 'xpath',
          attribute: 'href',
        },
        rank: {
          selector: './/span[contains(@class, "rank")]/text()',
          type: 'xpath',
        },
      };

      const results = service.extractStructuredList(
        hackerNewsHtml,
        '//tr[contains(@class, "athing")]',
        schema,
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('url');
      expect(firstResult).toHaveProperty('rank');
      expect(typeof firstResult.title).toBe('string');
      expect(typeof firstResult.url).toBe('string');
      expect(firstResult.rank).toMatch(/^\d+\.$/);
    });

    it('should extract list of structured data using CSS container', () => {
      const schema: ExtractionSchema = {
        title: {
          selector: '.titleline a',
          type: 'css',
        },
        rank: {
          selector: '.rank',
          type: 'css',
        },
      };

      const results = service.extractStructuredList(
        hackerNewsHtml,
        '.athing',
        schema,
        'css',
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('rank');
    });

    it('should return empty array for non-existent containers', () => {
      const schema: ExtractionSchema = {
        test: {
          selector: './/text()',
          type: 'xpath',
        },
      };

      const results = service.extractStructuredList(
        hackerNewsHtml,
        '//nonexistent-container',
        schema,
      );

      expect(results).toEqual([]);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty HTML gracefully', () => {
      const emptyHtml = '';

      expect(service.extractSingle(emptyHtml, '//title')).toBeNull();
      expect(service.extractMultiple(emptyHtml, '//div')).toEqual([]);
      expect(service.exists(emptyHtml, '//div')).toBe(false);
      expect(service.count(emptyHtml, '//div')).toBe(0);
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<html><title>Test</title><div><p>Unclosed tags';

      const title = service.extractSingle(malformedHtml, '//title/text()');
      expect(title).toBe('Test');
    });

    it('should handle invalid XPath expressions', () => {
      // Invalid XPath should not throw but return null/empty
      const result = service.extractSingle(
        hackerNewsHtml,
        '//[[[invalid-xpath',
      );
      expect(result).toBeNull();
    });

    it('should handle invalid CSS selectors', () => {
      // CSS selector should be more forgiving
      const result = service.extractSingle(hackerNewsHtml, '>>>', 'css');
      expect(result).toBeNull();
    });
  });

  describe('Real-world HackerNews specific tests', () => {
    it('should extract story rankings correctly', () => {
      const rankings = service.extractMultiple(
        hackerNewsHtml,
        '//span[contains(@class, "rank")]/text()',
      );

      expect(rankings.length).toBeGreaterThan(0);
      expect(rankings[0]).toBe('1.');
      if (rankings.length > 1) {
        expect(rankings[1]).toBe('2.');
      }
    });

    it('should extract story scores', () => {
      const scores = service.extractMultiple(
        hackerNewsHtml,
        '//span[contains(@class, "score")]/text()',
      );

      expect(scores.length).toBeGreaterThan(0);
      expect(scores.every((score) => score.includes('points'))).toBe(true);
    });

    it('should extract usernames', () => {
      const usernames = service.extractMultiple(
        hackerNewsHtml,
        '//a[contains(@class, "hnuser")]/text()',
      );

      expect(usernames.length).toBeGreaterThan(0);
      expect(usernames.every((username) => typeof username === 'string')).toBe(
        true,
      );
    });

    it('should extract comment counts', () => {
      const commentLinks = service.extractMultiple(
        hackerNewsHtml,
        '//a[contains(text(), "comments")]/text()',
      );

      expect(commentLinks.length).toBeGreaterThan(0);
      expect(commentLinks.every((link) => link.includes('comments'))).toBe(
        true,
      );
    });

    it('should extract a complete story structure', () => {
      const storySchema: ExtractionSchema = {
        rank: {
          selector: './/span[contains(@class, "rank")]/text()',
          type: 'xpath',
          transform: (value: string) => parseInt(value.replace('.', '')),
        },
        title: {
          selector: './/span[contains(@class, "titleline")]/a/text()',
          type: 'xpath',
        },
        url: {
          selector: './/span[contains(@class, "titleline")]/a',
          type: 'xpath',
          attribute: 'href',
        },
        domain: {
          selector: './/span[contains(@class, "sitestr")]/text()',
          type: 'xpath',
        },
        author: {
          selector: './/a[contains(@class, "hnuser")]/text()',
          type: 'xpath',
        },
        score: {
          selector: './/span[contains(@class, "score")]/text()',
          type: 'xpath',
          transform: (value: string) =>
            value ? parseInt(value.split(' ')[0]) : 0,
        },
      };

      const stories = service.extractStructuredList(
        hackerNewsHtml,
        '//tr[contains(@class, "athing")]',
        storySchema,
      );

      expect(stories.length).toBeGreaterThan(0);

      const firstStory = stories[0];
      expect(firstStory.rank).toBe(1);
      expect(typeof firstStory.title).toBe('string');
      expect(firstStory.title.length).toBeGreaterThan(0);
      expect(typeof firstStory.url).toBe('string');
    });
  });
});

// Mock HTML for fallback when live site is unavailable
function getMockHackerNewsHtml(): string {
  return `
    <html lang="en" op="news">
      <head>
        <title>Hacker News</title>
      </head>
      <body>
        <center>
          <table id="hnmain" border="0" cellpadding="0" cellspacing="0" width="85%" bgcolor="#f6f6ef">
            <tr class='athing submission' id='44167592'>
              <td align="right" valign="top" class="title">
                <span class="rank">1.</span>
              </td>
              <td class="title">
                <span class="titleline">
                  <a href="https://github.com/example/project">Test Project</a>
                  <span class="sitebit comhead">
                    (<span class="sitestr">github.com</span>)
                  </span>
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2"></td>
              <td class="subtext">
                <span class="score">190 points</span> by 
                <a href="user?id=testuser" class="hnuser">testuser</a>
                <a href="item?id=44167592">81 comments</a>
              </td>
            </tr>
            <tr class='athing submission' id='44167593'>
              <td align="right" valign="top" class="title">
                <span class="rank">2.</span>
              </td>
              <td class="title">
                <span class="titleline">
                  <a href="https://example.com/article">Test Article</a>
                  <span class="sitebit comhead">
                    (<span class="sitestr">example.com</span>)
                  </span>
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2"></td>
              <td class="subtext">
                <span class="score">50 points</span> by 
                <a href="user?id=testuser2" class="hnuser">testuser2</a>
                <a href="item?id=44167593">25 comments</a>
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  `;
}
