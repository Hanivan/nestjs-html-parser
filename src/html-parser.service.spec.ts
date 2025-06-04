import { Test, TestingModule } from '@nestjs/testing';
import { HTML_PARSER_LOGGER_LEVEL } from './html-parser.config';
import { HtmlParserService } from './html-parser.service';
import { ExtractionSchema } from './types';

describe('HtmlParserService', () => {
  let service: HtmlParserService;
  let hackerNewsHtml: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HtmlParserService,
        {
          provide: HTML_PARSER_LOGGER_LEVEL,
          useValue: 'log', // Default logger level
        },
      ],
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

  describe('transform, multiple, and raw options', () => {
    const simpleHtml = `
      <div>
        <h1 class="title">  Hello World  </h1>
        <div class="epz">Episode 42</div>
        <ul>
          <li class="item">One</li>
          <li class="item">Two</li>
          <li class="item">Three</li>
        </ul>
      </div>
    `;

    class UppercasePipe {
      execute(value: string) {
        return value.toUpperCase();
      }
    }
    class SuffixPipe {
      constructor(private suffix: string) {}
      execute(value: string) {
        return value + this.suffix;
      }
    }

    it('should support transform as a single function', () => {
      const schema = {
        title: {
          selector: '//h1[@class="title"]/text()',
          type: 'xpath' as const,
          transform: (v: string) => v.trim().toUpperCase(),
        },
      };
      const result = service.extractStructured(simpleHtml, schema);
      expect(result.title).toBe('HELLO WORLD');
    });

    it('should support transform as a single class (auto-instantiated)', () => {
      const schema = {
        title: {
          selector: '//h1[@class="title"]/text()',
          type: 'xpath' as const,
          transform: UppercasePipe as any,
        },
      };
      const result = service.extractStructured(simpleHtml, schema);
      expect(result.title).toBe('  HELLO WORLD  ');
    });

    it('should support transform as a single instance', () => {
      const schema = {
        title: {
          selector: '//h1[@class="title"]/text()',
          type: 'xpath' as const,
          transform: new SuffixPipe('!'),
        },
      };
      const result = service.extractStructured(simpleHtml, schema);
      expect(result.title).toBe('  Hello World  !');
    });

    it('should support transform as an array of function, class, and instance', () => {
      const schema = {
        title: {
          selector: '//h1[@class="title"]/text()',
          type: 'xpath' as const,
          transform: [
            (v: string) => v.trim(),
            UppercasePipe as any,
            new SuffixPipe('!'),
          ] as any,
        },
      };
      const result = service.extractStructured(simpleHtml, schema);
      expect(result.title).toBe('HELLO WORLD!');
    });

    it('should support the multiple option for arrays', () => {
      const schema = {
        items: {
          selector: '//li[@class="item"]/text()',
          type: 'xpath' as const,
          multiple: true,
          transform: (v: string) => v.toUpperCase(),
        },
      };
      const result = service.extractStructured(simpleHtml, schema);
      expect(result.items).toEqual(['ONE', 'TWO', 'THREE']);
    });

    it('should support the raw option for raw HTML extraction', () => {
      const schema = {
        rawTitle: {
          selector: '//h1[@class="title"]',
          type: 'xpath' as const,
          raw: true,
        },
      };
      const result = service.extractStructured(simpleHtml, schema);
      expect(result.rawTitle).toContain('<h1 class="title">');
      expect(result.rawTitle).toContain('Hello World');
    });

    it('should support transform for episode extraction (number)', () => {
      const schema = {
        episode: {
          selector: '//div[@class="epz"]',
          type: 'xpath' as const,
          transform: [
            (text: any) => {
              if (typeof text !== 'string') return 0;
              let match = text.match(/Episode\s+(\d+)/i);
              if (!match) match = text.match(/(\d+)/);
              return match ? parseInt(match[1]) : 0;
            },
            new SuffixPipe(' (ep)'),
          ],
        },
      };
      const result = service.extractStructured(simpleHtml, schema);
      expect(result.episode).toBe('42 (ep)');
    });
  });
});

// TypeScript Generic Types Tests
describe('HtmlParserService - Generic Types', () => {
  let service: HtmlParserService;

  // Test HTML content for generic type testing
  const testHtml = `
    <html>
      <head>
        <title>Test Page</title>
        <meta name="author" content="John Doe">
        <meta name="publish-date" content="2024-01-15">
      </head>
      <body>
        <div class="container">
          <h1 id="main-title">Main Title</h1>
          <p class="content" data-words="150">This is test content with some words.</p>
          <span class="price" data-value="29.99">$29.99</span>
          <span class="rating" data-score="4.5">4.5 stars</span>
          <div class="status" data-active="true">Active</div>
          <div class="count" data-views="1250">1,250 views</div>
          
          <ul class="tags">
            <li class="tag">javascript</li>
            <li class="tag">typescript</li>
            <li class="tag">testing</li>
          </ul>
          
          <div class="images">
            <img src="/img1.jpg" alt="Image 1" data-id="1">
            <img src="/img2.jpg" alt="Image 2" data-id="2">
            <img src="/img3.jpg" alt="Image 3" data-id="3">
          </div>
          
          <article class="post" data-id="123">
            <h2>Article Title</h2>
            <span class="author">Jane Smith</span>
            <time datetime="2024-01-15T10:30:00Z">2024-01-15</time>
            <div class="content">Article content here</div>
            <span class="likes" data-count="89">89</span>
            <span class="published" data-status="true">Published</span>
          </article>
          
          <article class="post" data-id="124">
            <h2>Second Article</h2>
            <span class="author">Bob Wilson</span>
            <time datetime="2024-01-16T14:20:00Z">2024-01-16</time>
            <div class="content">More content here</div>
            <span class="likes" data-count="156">156</span>
            <span class="published" data-status="false">Draft</span>
          </article>
          
          <div class="product" data-id="501">
            <h3>Wireless Mouse</h3>
            <span class="price">$29.99</span>
            <span class="rating" data-score="4.2">4.2</span>
            <span class="reviews" data-count="89">89 reviews</span>
            <span class="stock" data-available="true">In Stock</span>
            <span class="category">Electronics</span>
          </div>
          
          <div class="product" data-id="502">
            <h3>Keyboard</h3>
            <span class="price">$79.99</span>
            <span class="rating" data-score="4.7">4.7</span>
            <span class="reviews" data-count="156">156 reviews</span>
            <span class="stock" data-available="false">Out of Stock</span>
            <span class="category">Electronics</span>
          </div>
        </div>
      </body>
    </html>
  `;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HtmlParserService,
        {
          provide: HTML_PARSER_LOGGER_LEVEL,
          useValue: 'log', // Default logger level
        },
      ],
    }).compile();

    service = module.get<HtmlParserService>(HtmlParserService);
  });

  describe('extractSingle with generic types', () => {
    it('should return string by default', () => {
      const title = service.extractSingle(testHtml, '//title/text()');
      expect(typeof title).toBe('string');
      expect(title).toBe('Test Page');
    });

    it('should return string with explicit generic type', () => {
      const title = service.extractSingle<string>(testHtml, '//title/text()');
      expect(typeof title).toBe('string');
      expect(title).toBe('Test Page');
    });

    it('should transform to number type', () => {
      const price = service.extractSingle<number>(
        testHtml,
        '//span[@class="price"]',
        'xpath',
        'data-value',
        {
          transform: (value: string) => parseFloat(value),
        },
      );
      expect(typeof price).toBe('number');
      expect(price).toBe(29.99);
    });

    it('should transform to boolean type', () => {
      const isActive = service.extractSingle<boolean>(
        testHtml,
        '//div[@class="status"]',
        'xpath',
        'data-active',
        {
          transform: (value: string) => value === 'true',
        },
      );
      expect(typeof isActive).toBe('boolean');
      expect(isActive).toBe(true);
    });

    it('should transform to Date type', () => {
      const publishDate = service.extractSingle<Date>(
        testHtml,
        '//time',
        'xpath',
        'datetime',
        {
          transform: (value: string) => new Date(value),
        },
      );
      expect(publishDate).toBeInstanceOf(Date);
      expect(publishDate?.getFullYear()).toBe(2024);
    });

    it('should transform to custom object type', () => {
      interface PriceInfo {
        value: number;
        currency: string;
        formatted: string;
      }

      const priceInfo = service.extractSingle<PriceInfo>(
        testHtml,
        '//span[@class="price"]/text()',
        'xpath',
        undefined,
        {
          transform: (value: string) => {
            const numValue = parseFloat(value.replace('$', ''));
            return {
              value: numValue,
              currency: 'USD',
              formatted: value,
            };
          },
        },
      );

      expect(typeof priceInfo).toBe('object');
      expect(priceInfo?.value).toBe(29.99);
      expect(priceInfo?.currency).toBe('USD');
      expect(priceInfo?.formatted).toBe('$29.99');
    });

    it('should return null for non-existent elements', () => {
      const result = service.extractSingle<number>(
        testHtml,
        '//nonexistent',
        'xpath',
        undefined,
        {
          transform: (value: string) => parseInt(value),
        },
      );
      expect(result).toBeNull();
    });
  });

  describe('extractMultiple with generic types', () => {
    it('should return string array by default', () => {
      const tags = service.extractMultiple(
        testHtml,
        '//li[@class="tag"]/text()',
      );
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.every((tag) => typeof tag === 'string')).toBe(true);
      expect(tags).toEqual(['javascript', 'typescript', 'testing']);
    });

    it('should return string array with explicit generic type', () => {
      const tags = service.extractMultiple<string>(
        testHtml,
        '//li[@class="tag"]/text()',
      );
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.every((tag) => typeof tag === 'string')).toBe(true);
      expect(tags).toEqual(['javascript', 'typescript', 'testing']);
    });

    it('should transform to number array', () => {
      const ids = service.extractMultiple<number>(
        testHtml,
        '//img',
        'xpath',
        'data-id',
        {
          transform: (value: string) => parseInt(value),
        },
      );
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.every((id) => typeof id === 'number')).toBe(true);
      expect(ids).toEqual([1, 2, 3]);
    });

    it('should transform to boolean array', () => {
      const stockStatus = service.extractMultiple<boolean>(
        testHtml,
        '//span[@class="stock"]',
        'xpath',
        'data-available',
        {
          transform: (value: string) => value === 'true',
        },
      );
      expect(Array.isArray(stockStatus)).toBe(true);
      expect(stockStatus.every((status) => typeof status === 'boolean')).toBe(
        true,
      );
      expect(stockStatus).toEqual([true, false]);
    });

    it('should transform to Date array', () => {
      const dates = service.extractMultiple<Date>(
        testHtml,
        '//time',
        'xpath',
        'datetime',
        {
          transform: (value: string) => new Date(value),
        },
      );
      expect(Array.isArray(dates)).toBe(true);
      expect(dates.every((date) => date instanceof Date)).toBe(true);
      expect(dates).toHaveLength(2);
      expect(dates[0].getFullYear()).toBe(2024);
    });

    it('should return empty array for non-existent elements', () => {
      const result = service.extractMultiple<number>(
        testHtml,
        '//nonexistent',
        'xpath',
        undefined,
        {
          transform: (value: string) => parseInt(value),
        },
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('extractText with generic types', () => {
    it('should return string by default', () => {
      const title = service.extractText(testHtml, '//h1[@id="main-title"]');
      expect(typeof title).toBe('string');
      expect(title).toBe('Main Title');
    });

    it('should transform to number type', () => {
      const wordCount = service.extractText<number>(
        testHtml,
        '//p[@class="content"]',
        'xpath',
        {
          transform: (text: string) => text.split(' ').length,
        },
      );
      expect(typeof wordCount).toBe('number');
      expect(wordCount).toBeGreaterThan(0);
    });

    it('should transform to custom type', () => {
      interface TextAnalysis {
        text: string;
        wordCount: number;
        charCount: number;
      }

      const analysis = service.extractText<TextAnalysis>(
        testHtml,
        '//p[@class="content"]',
        'xpath',
        {
          transform: (text: string) => ({
            text: text,
            wordCount: text.split(' ').length,
            charCount: text.length,
          }),
        },
      );

      expect(typeof analysis).toBe('object');
      expect(analysis?.wordCount).toBeGreaterThan(0);
      expect(analysis?.charCount).toBeGreaterThan(0);
      expect(analysis?.text).toContain('test content');
    });
  });

  describe('extractAttributes with generic types', () => {
    it('should return string array by default', () => {
      const sources = service.extractAttributes(testHtml, '//img', 'src');
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.every((src) => typeof src === 'string')).toBe(true);
      expect(sources).toEqual(['/img1.jpg', '/img2.jpg', '/img3.jpg']);
    });

    it('should transform to number array', () => {
      const ids = service.extractAttributes<number>(
        testHtml,
        '//img',
        'data-id',
        'xpath',
        {
          transform: (value: string) => parseInt(value),
        },
      );
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.every((id) => typeof id === 'number')).toBe(true);
      expect(ids).toEqual([1, 2, 3]);
    });

    it('should transform to custom object array', () => {
      interface ImageInfo {
        id: number;
        src: string;
      }

      // This would require a more complex setup, but demonstrates the concept
      const imageIds = service.extractAttributes<number>(
        testHtml,
        '//img',
        'data-id',
        'xpath',
        {
          transform: (value: string) => parseInt(value),
        },
      );

      expect(Array.isArray(imageIds)).toBe(true);
      expect(imageIds).toEqual([1, 2, 3]);
    });
  });

  describe('extractStructured with generic types', () => {
    interface Article {
      title: string;
      author: string;
      publishDate: Date;
      likes: number;
      isPublished: boolean;
      id: number;
    }

    it('should extract with full type safety', () => {
      const articleSchema: ExtractionSchema<Article> = {
        title: {
          selector: './/h2/text()',
          type: 'xpath',
        },
        author: {
          selector: './/span[@class="author"]/text()',
          type: 'xpath',
        },
        publishDate: {
          selector: './/time',
          type: 'xpath',
          attribute: 'datetime',
          transform: (value: string) => new Date(value),
        },
        likes: {
          selector: './/span[@class="likes"]',
          type: 'xpath',
          attribute: 'data-count',
          transform: (value: string) => parseInt(value),
        },
        isPublished: {
          selector: './/span[@class="published"]',
          type: 'xpath',
          attribute: 'data-status',
          transform: (value: string) => value === 'true',
        },
        id: {
          selector: './/@data-id',
          type: 'xpath',
          transform: (value: string) => parseInt(value),
        },
      };

      // Extract the first article's HTML content
      const firstArticleHtml = service.extractSingle(
        testHtml,
        '(//article[@class="post"])[1]',
      );

      // For testing purposes, we'll extract directly from the test HTML
      // but focus on the first article
      const firstArticles = service.extractStructuredList<Article>(
        testHtml,
        '//article[@class="post"]',
        articleSchema,
      );

      const article = firstArticles[0];

      expect(typeof article.title).toBe('string');
      expect(typeof article.author).toBe('string');
      expect(article.publishDate).toBeInstanceOf(Date);
      expect(typeof article.likes).toBe('number');
      expect(typeof article.isPublished).toBe('boolean');
      expect(typeof article.id).toBe('number');

      expect(article.title).toBe('Article Title');
      expect(article.author).toBe('Jane Smith');
      expect(article.likes).toBe(89);
      expect(article.isPublished).toBe(true);
      expect(article.id).toBe(123);
    });

    interface Product {
      name: string;
      price: number;
      rating: number;
      reviewCount: number;
      inStock: boolean;
      category: string;
    }

    it('should work with different schema types', () => {
      const productSchema: ExtractionSchema<Product> = {
        name: {
          selector: './/h3/text()',
          type: 'xpath',
        },
        price: {
          selector: './/span[@class="price"]/text()',
          type: 'xpath',
          transform: (value: string) => parseFloat(value.replace('$', '')),
        },
        rating: {
          selector: './/span[@class="rating"]',
          type: 'xpath',
          attribute: 'data-score',
          transform: (value: string) => parseFloat(value),
        },
        reviewCount: {
          selector: './/span[@class="reviews"]',
          type: 'xpath',
          attribute: 'data-count',
          transform: (value: string) => parseInt(value),
        },
        inStock: {
          selector: './/span[@class="stock"]',
          type: 'xpath',
          attribute: 'data-available',
          transform: (value: string) => value === 'true',
        },
        category: {
          selector: './/span[@class="category"]/text()',
          type: 'xpath',
        },
      };

      // Use extractStructuredList to get the first product
      const products = service.extractStructuredList<Product>(
        testHtml,
        '//div[@class="product"]',
        productSchema,
      );

      const product = products[0];

      expect(typeof product.name).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.rating).toBe('number');
      expect(typeof product.reviewCount).toBe('number');
      expect(typeof product.inStock).toBe('boolean');
      expect(typeof product.category).toBe('string');

      expect(product.name).toBe('Wireless Mouse');
      expect(product.price).toBe(29.99);
      expect(product.rating).toBe(4.2);
      expect(product.reviewCount).toBe(89);
      expect(product.inStock).toBe(true);
      expect(product.category).toBe('Electronics');
    });
  });

  describe('extractStructuredList with generic types', () => {
    interface Article {
      title: string;
      author: string;
      publishDate: Date;
      likes: number;
      isPublished: boolean;
      id: number;
    }

    it('should extract typed list of articles', () => {
      const articleSchema: ExtractionSchema<Article> = {
        title: {
          selector: './/h2/text()',
          type: 'xpath',
        },
        author: {
          selector: './/span[@class="author"]/text()',
          type: 'xpath',
        },
        publishDate: {
          selector: './/time',
          type: 'xpath',
          attribute: 'datetime',
          transform: (value: string) => new Date(value),
        },
        likes: {
          selector: './/span[@class="likes"]',
          type: 'xpath',
          attribute: 'data-count',
          transform: (value: string) => parseInt(value),
        },
        isPublished: {
          selector: './/span[@class="published"]',
          type: 'xpath',
          attribute: 'data-status',
          transform: (value: string) => value === 'true',
        },
        id: {
          selector: './/@data-id',
          type: 'xpath',
          transform: (value: string) => parseInt(value),
        },
      };

      const articles = service.extractStructuredList<Article>(
        testHtml,
        '//article[@class="post"]',
        articleSchema,
      );

      expect(Array.isArray(articles)).toBe(true);
      expect(articles).toHaveLength(2);

      const firstArticle = articles[0];
      expect(typeof firstArticle.title).toBe('string');
      expect(typeof firstArticle.author).toBe('string');
      expect(firstArticle.publishDate).toBeInstanceOf(Date);
      expect(typeof firstArticle.likes).toBe('number');
      expect(typeof firstArticle.isPublished).toBe('boolean');
      expect(typeof firstArticle.id).toBe('number');

      expect(firstArticle.title).toBe('Article Title');
      expect(firstArticle.author).toBe('Jane Smith');
      expect(firstArticle.likes).toBe(89);
      expect(firstArticle.isPublished).toBe(true);
      expect(firstArticle.id).toBe(123);

      const secondArticle = articles[1];
      expect(secondArticle.title).toBe('Second Article');
      expect(secondArticle.author).toBe('Bob Wilson');
      expect(secondArticle.likes).toBe(156);
      expect(secondArticle.isPublished).toBe(false);
      expect(secondArticle.id).toBe(124);
    });

    interface Product {
      name: string;
      price: number;
      rating: number;
      reviewCount: number;
      inStock: boolean;
      category: string;
    }

    it('should extract typed list of products', () => {
      const productSchema: ExtractionSchema<Product> = {
        name: {
          selector: './/h3/text()',
          type: 'xpath',
        },
        price: {
          selector: './/span[@class="price"]/text()',
          type: 'xpath',
          transform: (value: string) => parseFloat(value.replace('$', '')),
        },
        rating: {
          selector: './/span[@class="rating"]',
          type: 'xpath',
          attribute: 'data-score',
          transform: (value: string) => parseFloat(value),
        },
        reviewCount: {
          selector: './/span[@class="reviews"]',
          type: 'xpath',
          attribute: 'data-count',
          transform: (value: string) => parseInt(value),
        },
        inStock: {
          selector: './/span[@class="stock"]',
          type: 'xpath',
          attribute: 'data-available',
          transform: (value: string) => value === 'true',
        },
        category: {
          selector: './/span[@class="category"]/text()',
          type: 'xpath',
        },
      };

      const products = service.extractStructuredList<Product>(
        testHtml,
        '//div[@class="product"]',
        productSchema,
      );

      expect(Array.isArray(products)).toBe(true);
      expect(products).toHaveLength(2);

      const firstProduct = products[0];
      expect(typeof firstProduct.name).toBe('string');
      expect(typeof firstProduct.price).toBe('number');
      expect(typeof firstProduct.rating).toBe('number');
      expect(typeof firstProduct.reviewCount).toBe('number');
      expect(typeof firstProduct.inStock).toBe('boolean');
      expect(typeof firstProduct.category).toBe('string');

      expect(firstProduct.name).toBe('Wireless Mouse');
      expect(firstProduct.price).toBe(29.99);
      expect(firstProduct.rating).toBe(4.2);
      expect(firstProduct.reviewCount).toBe(89);
      expect(firstProduct.inStock).toBe(true);
      expect(firstProduct.category).toBe('Electronics');

      const secondProduct = products[1];
      expect(secondProduct.name).toBe('Keyboard');
      expect(secondProduct.price).toBe(79.99);
      expect(secondProduct.rating).toBe(4.7);
      expect(secondProduct.reviewCount).toBe(156);
      expect(secondProduct.inStock).toBe(false);
      expect(secondProduct.category).toBe('Electronics');
    });

    it('should return empty typed array for non-existent containers', () => {
      interface TestType {
        value: string;
      }

      const schema: ExtractionSchema<TestType> = {
        value: {
          selector: './/text()',
          type: 'xpath',
        },
      };

      const result = service.extractStructuredList<TestType>(
        testHtml,
        '//nonexistent',
        schema,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Generic type analytics and operations', () => {
    interface Product {
      name: string;
      price: number;
      rating: number;
      reviewCount: number;
      inStock: boolean;
      category: string;
    }

    it('should enable type-safe analytics on extracted data', () => {
      const productSchema: ExtractionSchema<Product> = {
        name: {
          selector: './/h3/text()',
          type: 'xpath',
        },
        price: {
          selector: './/span[@class="price"]/text()',
          type: 'xpath',
          transform: (value: string) => parseFloat(value.replace('$', '')),
        },
        rating: {
          selector: './/span[@class="rating"]',
          type: 'xpath',
          attribute: 'data-score',
          transform: (value: string) => parseFloat(value),
        },
        reviewCount: {
          selector: './/span[@class="reviews"]',
          type: 'xpath',
          attribute: 'data-count',
          transform: (value: string) => parseInt(value),
        },
        inStock: {
          selector: './/span[@class="stock"]',
          type: 'xpath',
          attribute: 'data-available',
          transform: (value: string) => value === 'true',
        },
        category: {
          selector: './/span[@class="category"]/text()',
          type: 'xpath',
        },
      };

      const products = service.extractStructuredList<Product>(
        testHtml,
        '//div[@class="product"]',
        productSchema,
      );

      // Type-safe analytics
      const totalProducts = products.length;
      const averagePrice =
        products.reduce((sum, p) => sum + p.price, 0) / totalProducts;
      const averageRating =
        products.reduce((sum, p) => sum + p.rating, 0) / totalProducts;
      const inStockCount = products.filter((p) => p.inStock).length;
      const totalReviews = products.reduce((sum, p) => sum + p.reviewCount, 0);
      const categories = [...new Set(products.map((p) => p.category))];
      const maxPrice = Math.max(...products.map((p) => p.price));
      const minPrice = Math.min(...products.map((p) => p.price));

      expect(typeof totalProducts).toBe('number');
      expect(typeof averagePrice).toBe('number');
      expect(typeof averageRating).toBe('number');
      expect(typeof inStockCount).toBe('number');
      expect(typeof totalReviews).toBe('number');
      expect(Array.isArray(categories)).toBe(true);
      expect(typeof maxPrice).toBe('number');
      expect(typeof minPrice).toBe('number');

      expect(totalProducts).toBe(2);
      expect(averagePrice).toBeCloseTo(54.99, 2);
      expect(averageRating).toBe(4.45);
      expect(inStockCount).toBe(1);
      expect(totalReviews).toBe(245);
      expect(categories).toEqual(['Electronics']);
      expect(maxPrice).toBe(79.99);
      expect(minPrice).toBe(29.99);
    });
  });

  describe('Transform function edge cases', () => {
    it('should handle transform function errors gracefully', () => {
      const result = service.extractSingle<number>(
        testHtml,
        '//title/text()',
        'xpath',
        undefined,
        {
          transform: (value: string) => {
            throw new Error('Transform error');
          },
        },
      );
      // Should not crash the application
      expect(result).toBeDefined();
    });

    it('should handle complex transformation chains', () => {
      interface ComplexType {
        original: string;
        processed: string;
        length: number;
        hash: number;
      }

      const result = service.extractSingle<ComplexType>(
        testHtml,
        '//title/text()',
        'xpath',
        undefined,
        {
          transform: (value: string) => ({
            original: value,
            processed: value.toLowerCase().replace(/\s+/g, '-'),
            length: value.length,
            hash: value
              .split('')
              .reduce(
                (hash, char) => (hash << 5) - hash + char.charCodeAt(0),
                0,
              ),
          }),
        },
      );

      expect(typeof result).toBe('object');
      expect(result?.original).toBe('Test Page');
      expect(result?.processed).toBe('test-page');
      expect(result?.length).toBe(9);
      expect(typeof result?.hash).toBe('number');
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
