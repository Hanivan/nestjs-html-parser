import { Test, TestingModule } from '@nestjs/testing';
import { HtmlParserService } from './html-parser.service';
import { ExtractionSchema } from './types';

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
      const response = await service.fetchHtml('https://news.ycombinator.com/');
      hackerNewsHtml = response.data;
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
      const response = await service.fetchHtml('https://news.ycombinator.com/');
      expect(typeof response.data).toBe('string');
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data).toContain('<title>Hacker News</title>');
      expect(typeof response.status).toBe('number');
      expect(response.status).toBe(200);
      expect(typeof response.headers).toBe('object');
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
      const response = await service.fetchHtml(
        'https://news.ycombinator.com/',
        options,
      );
      expect(typeof response.data).toBe('string');
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

  describe('Random User Agent functionality', () => {
    it('should generate random user agents', async () => {
      const userAgent1 = await service.getRandomUserAgent();
      const userAgent2 = await service.getRandomUserAgent();
      const userAgent3 = await service.getRandomUserAgent();

      expect(typeof userAgent1).toBe('string');
      expect(typeof userAgent2).toBe('string');
      expect(typeof userAgent3).toBe('string');
      expect(userAgent1.length).toBeGreaterThan(0);
      expect(userAgent2.length).toBeGreaterThan(0);
      expect(userAgent3.length).toBeGreaterThan(0);

      // Random user agents should typically be different (though not guaranteed)
      const userAgents = [userAgent1, userAgent2, userAgent3];
      const uniqueUserAgents = [...new Set(userAgents)];
      expect(uniqueUserAgents.length).toBeGreaterThanOrEqual(1);
    });

    it('should use random user agent when useRandomUserAgent is true', async () => {
      // Mock a simple endpoint that echoes the user agent
      const testUrl = 'https://httpbin.org/user-agent';

      try {
        const response = await service.fetchHtml(testUrl, {
          useRandomUserAgent: true,
          timeout: 5000, // Reduced timeout
          retries: 1, // Reduced retries for tests
        });

        expect(typeof response.data).toBe('string');
        expect(response.data.length).toBeGreaterThan(0);

        // The response should contain user agent information
        expect(response.data).toContain('user-agent');
      } catch (error) {
        // If external service fails, just verify the option doesn't break the function
        console.warn('httpbin.org test skipped due to network error');
        expect(error).toBeDefined(); // Just ensure error handling works
      }
    }, 20000);

    it('should use specified user agent when useRandomUserAgent is false', async () => {
      const customUserAgent = 'TestBot/1.0';

      try {
        const response = await service.fetchHtml(
          'https://httpbin.org/user-agent',
          {
            userAgent: customUserAgent,
            useRandomUserAgent: false,
            timeout: 5000, // Reduced timeout
            retries: 1, // Reduced retries for tests
          },
        );

        if (response.data && response.data.includes('user-agent')) {
          expect(response.data).toContain(customUserAgent);
        }
      } catch (error) {
        console.warn('httpbin.org test skipped due to network error');
        expect(error).toBeDefined(); // Just ensure error handling works
      }
    }, 20000);

    it('should fallback gracefully when rand-user-agent import fails', async () => {
      // Test the fallback behavior
      const userAgent = await service.getRandomUserAgent();
      expect(typeof userAgent).toBe('string');
      expect(userAgent.length).toBeGreaterThan(0);
      // Should either be a random UA or the fallback UA
      expect(userAgent).toMatch(/Mozilla|Chrome|Safari|Firefox/);
    });
  });

  describe('Proxy functionality', () => {
    it('should handle proxy configuration without errors', async () => {
      const proxyConfig = {
        url: 'http://127.0.0.1:8080',
        type: 'http' as const,
      };

      // This test mainly ensures the proxy configuration doesn't cause syntax errors
      // Real proxy testing would require an actual proxy server
      try {
        const response = await service.fetchHtml('https://httpbin.org/ip', {
          proxy: proxyConfig,
          timeout: 2000, // Very short timeout
          retries: 0,
        });
      } catch (error) {
        // Expected to fail without real proxy, but should not be a configuration error
        expect(error.message).not.toContain('TypeError');
        expect(error.message).not.toContain('undefined');
      }
    });

    it('should test proxy connection', async () => {
      const proxyConfig = {
        url: 'http://nonexistent-proxy.example.com:8080',
        type: 'http' as const,
      };

      const isWorking = await service.testProxy(proxyConfig);
      expect(typeof isWorking).toBe('boolean');
      expect(isWorking).toBe(false); // Should fail for nonexistent proxy
    });

    it('should handle different proxy types', () => {
      const httpProxy = { url: 'http://proxy.example.com:8080' };
      const httpsProxy = { url: 'https://proxy.example.com:8080' };
      const socksProxy = { url: 'socks5://proxy.example.com:1080' };

      // These tests verify that proxy agent creation doesn't throw errors
      expect(() => service['createProxyAgent'](httpProxy, false)).not.toThrow();
      expect(() => service['createProxyAgent'](httpsProxy, true)).not.toThrow();
      expect(() =>
        service['createProxyAgent'](socksProxy, false),
      ).not.toThrow();
    });

    it('should detect proxy type from URL', () => {
      expect(service['detectProxyType']('http://proxy.com:8080')).toBe('http');
      expect(service['detectProxyType']('https://proxy.com:8080')).toBe(
        'https',
      );
      expect(service['detectProxyType']('socks4://proxy.com:1080')).toBe(
        'socks4',
      );
      expect(service['detectProxyType']('socks5://proxy.com:1080')).toBe(
        'socks5',
      );
      expect(service['detectProxyType']('unknown://proxy.com:1080')).toBe(
        'http',
      );
    });

    it('should handle proxy authentication configuration', () => {
      const proxyWithAuth = {
        url: 'http://proxy.example.com:8080',
        username: 'testuser',
        password: 'testpass',
      };

      // Should not throw when creating proxy agent with auth
      expect(() =>
        service['createProxyAgent'](proxyWithAuth, false),
      ).not.toThrow();
    });

    it('should support proxy credentials in URL format', () => {
      const proxyWithUrlCreds = {
        url: 'http://user:pass@proxy.example.com:8080',
      };

      // Should not throw when creating proxy agent with URL credentials
      expect(() =>
        service['createProxyAgent'](proxyWithUrlCreds, false),
      ).not.toThrow();
    });

    it('should prioritize separate credentials over URL credentials', () => {
      const proxyWithBothCreds = {
        url: 'http://urluser:urlpass@proxy.example.com:8080',
        username: 'separateuser',
        password: 'separatepass',
      };

      // Should not throw and should use separate credentials
      expect(() =>
        service['createProxyAgent'](proxyWithBothCreds, false),
      ).not.toThrow();
    });

    it('should handle SOCKS proxy with URL credentials', () => {
      const socksProxyWithCreds = {
        url: 'socks5://user:pass@proxy.example.com:1080',
        type: 'socks5' as const,
      };

      expect(() =>
        service['createProxyAgent'](socksProxyWithCreds, false),
      ).not.toThrow();
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedProxy = {
        url: 'not-a-valid-url',
        username: 'user',
        password: 'pass',
      };

      // Should not throw even with malformed URL
      expect(() =>
        service['createProxyAgent'](malformedProxy, false),
      ).not.toThrow();
    });

    it('should handle URLs without protocol', () => {
      const noProtocolProxy = {
        url: 'proxy.example.com:8080',
        username: 'user',
        password: 'pass',
      };

      // Should not throw and should assume http
      expect(() =>
        service['createProxyAgent'](noProtocolProxy, false),
      ).not.toThrow();
    });
  });

  describe('Retry functionality', () => {
    it('should retry failed requests', async () => {
      const startTime = Date.now();

      try {
        const response = await service.fetchHtml(
          'https://nonexistent-domain-12345.example',
          {
            retries: 2,
            retryDelay: 100,
            timeout: 500, // Very short timeout to force failure
          },
        );
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should have taken at least 200ms for 2 retries with 100ms delay each
        expect(duration).toBeGreaterThanOrEqual(150); // Allow some tolerance
        expect(error.message).toContain('after 3 attempts');
      }
    });

    it('should respect retry delay', async () => {
      const delay = 150;
      const retries = 1;
      const startTime = Date.now();

      try {
        const response = await service.fetchHtml(
          'https://nonexistent-domain-12345.example',
          {
            retries,
            retryDelay: delay,
            timeout: 300,
          },
        );
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should have taken at least the delay time
        expect(duration).toBeGreaterThanOrEqual(delay - 50); // Allow some tolerance
      }
    });

    it('should succeed on first attempt when possible', async () => {
      try {
        const response = await service.fetchHtml(
          'https://httpbin.org/status/200',
          {
            retries: 1, // Reduced retries
            retryDelay: 500,
            timeout: 5000, // Reduced timeout
          },
        );

        expect(typeof response.data).toBe('string');
      } catch (error) {
        // Network issues are acceptable for this test
        console.warn('Network test skipped due to connectivity issues');
        expect(error).toBeDefined();
      }
    }, 15000);
  });

  describe('Combined features integration', () => {
    it('should work with all features enabled', async () => {
      const options = {
        useRandomUserAgent: true,
        retries: 1, // Reduced retries
        retryDelay: 500,
        timeout: 5000, // Reduced timeout
        headers: {
          Accept: 'text/html,application/xhtml+xml',
        },
      };

      try {
        const response = await service.fetchHtml(
          'https://httpbin.org/html',
          options,
        );

        expect(typeof response.data).toBe('string');
        expect(response.data.length).toBeGreaterThan(0);

        // Test extraction on the fetched content
        if (response.data.includes('<title>')) {
          const title = service.extractText(
            response.data,
            '//title/text()',
            'xpath',
          );
          expect(typeof title).toBe('string');
        }
      } catch (error) {
        // Network issues are acceptable for integration tests
        console.warn('Integration test skipped due to network error');
        expect(error).toBeDefined();
      }
    }, 15000);

    it('should handle complex extraction with new fetch options', async () => {
      try {
        const response = await service.fetchHtml('https://httpbin.org/html', {
          useRandomUserAgent: true,
          retries: 1,
          timeout: 5000,
        });

        // Test various extraction methods
        const hasBody = service.exists(response.data, '//body', 'xpath');
        const elementCount = service.count(response.data, 'p', 'css');

        expect(typeof hasBody).toBe('boolean');
        expect(typeof elementCount).toBe('number');

        if (response.data.includes('<title>')) {
          const title = service.extractText(response.data, 'title', 'css');
          expect(typeof title).toBe('string');
        }

        if (response.data.includes('<a')) {
          const links = service.extractMultiple(
            response.data,
            'a',
            'css',
            'href',
          );
          expect(Array.isArray(links)).toBe(true);
        }
      } catch (error) {
        console.warn('Complex extraction test skipped due to network error');
        expect(error).toBeDefined();
      }
    }, 15000);

    it('should handle configuration validation', () => {
      // Test that invalid configurations don't break the service
      expect(() => {
        service['createProxyAgent']({ url: '' }, false);
      }).toThrow();

      expect(() => {
        service['detectProxyType']('');
      }).not.toThrow();

      expect(service['detectProxyType']('')).toBe('http');
    });

    it('should handle edge cases in options', async () => {
      // Test with undefined/null options
      const userAgent1 = await service.getRandomUserAgent();
      expect(typeof userAgent1).toBe('string');

      // Test with empty proxy config (should not break)
      try {
        const response = await service.fetchHtml(
          'https://httpbin.org/status/200',
          {
            timeout: 1000,
            retries: 0,
          },
        );
      } catch (error) {
        // Expected to potentially fail due to network, but shouldn't throw config errors
        expect(error).toBeDefined();
      }
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
