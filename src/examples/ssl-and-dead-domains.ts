import { HtmlParserService } from '../html-parser.service';

/**
 * SSL and Dead Domain Handling Example
 *
 * This example demonstrates how to handle various network issues when scraping:
 * - SSL certificate errors (expired, self-signed, invalid)
 * - Dead domains (DNS resolution failures)
 * - Connection timeouts and refused connections
 * - Rate limiting and network issues
 *
 * These scenarios are common when scraping websites that may have
 * configuration issues or become temporarily/permanently unavailable.
 */

interface ScrapeResult {
  url: string;
  success: boolean;
  title?: string;
  error?: string;
  errorType?: string;
  retryCount?: number;
}

async function demonstrateSSLAndErrorHandling(verbose = false): Promise<void> {
  const parser = new HtmlParserService();

  console.log('🔧 SSL and Error Handling Demo');
  console.log('='.repeat(50));

  // Test URLs with different types of issues
  const testCases = [
    {
      name: 'Valid HTTPS Site',
      url: 'https://httpbin.org/html',
      config: { verbose },
    },
    {
      name: 'Self-Signed Certificate',
      url: 'https://self-signed.badssl.com/',
      config: {
        rejectUnauthorized: false,
        retryOnErrors: { ssl: true },
        verbose,
      },
    },
    {
      name: 'Expired Certificate',
      url: 'https://expired.badssl.com/',
      config: {
        ignoreSSLErrors: true,
        verbose,
      },
    },
    {
      name: 'Wrong Host Certificate',
      url: 'https://wrong.host.badssl.com/',
      config: {
        rejectUnauthorized: false,
        retryOnErrors: { ssl: true },
        retries: 2,
        verbose,
      },
    },
    {
      name: 'Dead Domain (DNS Failure)',
      url: 'https://this-domain-definitely-does-not-exist-12345.com',
      config: {
        retries: 2,
        retryDelay: 1000,
        retryOnErrors: { dns: true },
        timeout: 5000,
        verbose,
      },
    },
    {
      name: 'Connection Timeout',
      url: 'https://httpbin.org/delay/10',
      config: {
        timeout: 3000,
        retries: 2,
        retryOnErrors: { timeout: true },
        verbose,
      },
    },
    {
      name: 'Robust Configuration (Handle Most Errors)',
      url: 'https://httpbin.org/status/503', // Service unavailable
      config: {
        rejectUnauthorized: false,
        ignoreSSLErrors: false,
        timeout: 10000,
        retries: 3,
        retryDelay: 2000,
        retryOnErrors: {
          ssl: true,
          timeout: true,
          dns: true,
          connectionRefused: true,
        },
        verbose,
      },
    },
  ];

  const results: ScrapeResult[] = [];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📍 URL: ${testCase.url}`);

    if (verbose) {
      console.log(`🔧 Config:`, testCase.config);
    }

    try {
      const startTime = Date.now();
      const response = await parser.fetchHtml(testCase.url, testCase.config);
      const duration = Date.now() - startTime;

      // Try to extract title
      const title = parser.extractSingle(
        response.data,
        '//title/text()',
        'xpath',
        undefined,
        { verbose: false },
      );

      console.log(`✅ Success! (${duration}ms)`);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      console.log(`📄 Title: ${title || 'No title found'}`);
      console.log(`📏 Content length: ${response.data.length} characters`);

      results.push({
        url: testCase.url,
        success: true,
        title: title || undefined,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Extract error type from enhanced error message
      const errorTypeMatch = errorMessage.match(/Error type: (\w+)/);
      const errorType = errorTypeMatch ? errorTypeMatch[1] : 'unknown';

      console.log(`❌ Failed: ${errorType}`);
      console.log(`🔍 Error: ${errorMessage}`);

      results.push({
        url: testCase.url,
        success: false,
        error: errorMessage,
        errorType,
      });
    }
  }

  // Summary
  console.log('\n📊 SUMMARY RESULTS');
  console.log('='.repeat(40));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n🎯 Successful Requests:');
    successful.forEach((result, index) => {
      console.log(
        `   ${index + 1}. ${result.title || 'No title'} - ${result.url}`,
      );
    });
  }

  if (failed.length > 0) {
    console.log('\n💥 Failed Requests by Error Type:');
    const errorGroups = failed.reduce(
      (groups, result) => {
        const type = result.errorType || 'unknown';
        if (!groups[type]) groups[type] = [];
        groups[type].push(result);
        return groups;
      },
      {} as Record<string, ScrapeResult[]>,
    );

    Object.entries(errorGroups).forEach(([errorType, errors]) => {
      console.log(`\n   🔴 ${errorType.toUpperCase()} (${errors.length})`);
      errors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error.url}`);
      });
    });
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS FOR COMMON ISSUES');
  console.log('='.repeat(45));

  console.log('🔒 SSL Certificate Issues:');
  console.log(
    '   - Use rejectUnauthorized: false for self-signed certificates',
  );
  console.log(
    '   - Use ignoreSSLErrors: true for completely broken SSL (use with caution)',
  );
  console.log('   - Enable retryOnErrors.ssl: true for transient SSL issues');

  console.log('\n💀 Dead Domains:');
  console.log('   - Enable retryOnErrors.dns: true for temporary DNS issues');
  console.log('   - Reduce timeout for faster failure detection');
  console.log('   - Use domain health checking before scraping');

  console.log('\n⏱️ Timeout Issues:');
  console.log('   - Increase timeout value for slow sites');
  console.log('   - Enable retryOnErrors.timeout: true');
  console.log('   - Use proxy rotation for better performance');

  console.log('\n🛡️ Connection Issues:');
  console.log('   - Enable retryOnErrors.connectionRefused: true');
  console.log('   - Use different user agents to avoid blocking');
  console.log('   - Implement proxy rotation for resilience');
}

// Utility function to test a single URL with robust configuration
export async function testUrlWithRobustConfig(
  url: string,
  verbose = false,
): Promise<ScrapeResult> {
  const parser = new HtmlParserService();

  const robustConfig = {
    // SSL handling
    rejectUnauthorized: false,
    ignoreSSLErrors: false,

    // Timeouts and retries
    timeout: 15000,
    retries: 5,
    retryDelay: 2000,
    maxRedirects: 10,

    // Retry on all common error types
    retryOnErrors: {
      ssl: true,
      timeout: true,
      dns: true,
      connectionRefused: true,
    },

    // User agent rotation
    useRandomUserAgent: true,

    // Additional headers
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },

    verbose,
  };

  try {
    const response = await parser.fetchHtml(url, robustConfig);
    const title = parser.extractSingle(response.data, '//title/text()');

    return {
      url,
      success: true,
      title: title || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorTypeMatch = errorMessage.match(/Error type: (\w+)/);

    return {
      url,
      success: false,
      error: errorMessage,
      errorType: errorTypeMatch ? errorTypeMatch[1] : 'unknown',
    };
  }
}

// Export for use in other modules
export { demonstrateSSLAndErrorHandling, ScrapeResult };

// Run the demonstration if this file is executed directly
if (require.main === module) {
  // Check for verbose flag in command line arguments
  const verbose =
    process.argv.includes('--verbose') || process.argv.includes('-v');

  demonstrateSSLAndErrorHandling(verbose)
    .then(() => console.log('\n🔧 SSL and error handling demo completed!'))
    .catch(console.error);
}
