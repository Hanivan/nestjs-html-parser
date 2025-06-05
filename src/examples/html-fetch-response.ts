import { HtmlParserService } from '../html-parser.service';
import { HtmlFetchResponse } from '../types';

/**
 * Example demonstrating HtmlFetchResponse usage
 * Shows how to access and use response data, headers, status codes, and statusText
 */
async function demonstrateHtmlFetchResponse() {
  const parser = new HtmlParserService();

  console.log('🚀 HtmlFetchResponse - Complete Response Data Demo\n');

  // Example 1: Basic Response Analysis
  console.log('1. Basic Response Analysis');
  console.log('==========================');

  try {
    const response: HtmlFetchResponse = await parser.fetchHtml(
      'https://httpbin.org/html',
      {
        timeout: 10000,
        retries: 1,
      },
    );

    console.log('📊 Response Overview:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content Length: ${response.data.length} characters`);
    console.log(`   Headers Count: ${Object.keys(response.headers).length}`);
    console.log();

    console.log('📨 Response Headers:');
    Object.entries(response.headers).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log();

    console.log('📄 Content Sample:');
    console.log(`   ${response.data.substring(0, 100)}...`);
    console.log();
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // Example 2: Status Code Handling
  console.log('2. HTTP Status Code Handling');
  console.log('=============================');

  const testUrls = [
    'https://httpbin.org/status/200', // Success
    'https://httpbin.org/status/404', // Not Found
    'https://httpbin.org/status/500', // Server Error
    'https://httpbin.org/redirect/3', // Redirects
  ];

  for (const url of testUrls) {
    try {
      const response = await parser.fetchHtml(url, {
        timeout: 5000,
        retries: 0, // No retries for demo
      });

      console.log(`✅ ${url}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);

      // Handle different status codes
      if (response.status >= 200 && response.status < 300) {
        console.log(`   ✅ Success - Content length: ${response.data.length}`);
      } else if (response.status >= 300 && response.status < 400) {
        console.log(
          `   🔄 Redirect - Location: ${response.headers.location || 'N/A'}`,
        );
      } else if (response.status >= 400 && response.status < 500) {
        console.log(`   ⚠️ Client Error - ${response.statusText}`);
      } else if (response.status >= 500) {
        console.log(`   💥 Server Error - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${url}`);
      console.log(`   Error: ${error.message}`);
    }
    console.log();
  }

  // Example 3: Content-Type Based Processing
  console.log('3. Content-Type Based Processing');
  console.log('=================================');

  const contentTypeUrls = [
    'https://httpbin.org/html',
    'https://httpbin.org/json',
    'https://httpbin.org/xml',
  ];

  for (const url of contentTypeUrls) {
    try {
      const response = await parser.fetchHtml(url, { timeout: 5000 });
      const contentType = response.headers['content-type'] || 'unknown';

      console.log(`📄 ${url}`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Status: ${response.status}`);

      // Process based on content type
      if (contentType.includes('text/html')) {
        console.log(`   🌐 HTML Content - Extracting title...`);
        const title = parser.extractText(
          response.data,
          '//title/text()',
          'xpath',
        );
        console.log(`   Title: ${title || 'No title found'}`);

        const linkCount = parser.count(response.data, 'a', 'css');
        console.log(`   Links found: ${linkCount}`);
      } else if (contentType.includes('application/json')) {
        console.log(`   📊 JSON Content - Parsing...`);
        try {
          const jsonData = JSON.parse(response.data);
          console.log(`   JSON keys: ${Object.keys(jsonData).join(', ')}`);
        } catch (e) {
          console.log(`   ❌ Invalid JSON format`);
        }
      } else if (
        contentType.includes('application/xml') ||
        contentType.includes('text/xml')
      ) {
        console.log(`   📋 XML Content - Extracting root element...`);
        const rootElement = parser.extractSingle(
          response.data,
          '/*[1]',
          'xpath',
        );
        console.log(`   Root element: ${rootElement || 'Unable to parse XML'}`);
      }
    } catch (error) {
      console.log(`❌ Error processing ${url}: ${error.message}`);
    }
    console.log();
  }

  // Example 4: Server Information Analysis
  console.log('4. Server Information Analysis');
  console.log('==============================');

  try {
    const response = await parser.fetchHtml(
      'https://httpbin.org/response-headers?Server=CustomServer/1.0&X-Custom=MyValue',
      {
        timeout: 5000,
      },
    );

    console.log('🖥️ Server Analysis:');
    console.log(`   Server: ${response.headers.server || 'Unknown'}`);
    console.log(`   Date: ${response.headers.date || 'Unknown'}`);
    console.log(`   Connection: ${response.headers.connection || 'Unknown'}`);

    // Check for security headers
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy',
    ];

    console.log('\n🔒 Security Headers:');
    securityHeaders.forEach((header) => {
      const value = response.headers[header];
      console.log(`   ${header}: ${value || 'Not set'}`);
    });

    // Check for custom headers
    console.log('\n🎛️ Custom Headers:');
    Object.entries(response.headers)
      .filter(([key]) => key.startsWith('x-') && !securityHeaders.includes(key))
      .forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
  } catch (error) {
    console.error(`❌ Server analysis error: ${error.message}`);
  }
  console.log();

  // Example 5: Caching and Performance Analysis
  console.log('5. Caching and Performance Analysis');
  console.log('===================================');

  try {
    const response = await parser.fetchHtml('https://httpbin.org/cache/60', {
      timeout: 5000,
    });

    console.log('⚡ Performance Metrics:');
    console.log(
      `   Content-Length: ${response.headers['content-length'] || 'Unknown'}`,
    );
    console.log(
      `   Content-Encoding: ${response.headers['content-encoding'] || 'None'}`,
    );

    // Cache headers
    console.log('\n💾 Cache Information:');
    console.log(
      `   Cache-Control: ${response.headers['cache-control'] || 'Not set'}`,
    );
    console.log(`   ETag: ${response.headers.etag || 'Not set'}`);
    console.log(
      `   Last-Modified: ${response.headers['last-modified'] || 'Not set'}`,
    );
    console.log(`   Expires: ${response.headers.expires || 'Not set'}`);

    const contentLengthHeader = response.headers['content-length'];
    const contentLength = contentLengthHeader
      ? parseInt(contentLengthHeader, 10)
      : 0;
    const actualLength = response.data?.length || 0;

    if (contentLength > 0 && actualLength >= 0) {
      const compression =
        ((contentLength - actualLength) / contentLength) * 100;

      console.log(`\n📊 Compression Analysis:`);
      console.log(
        `   Declared Length: ${contentLength.toLocaleString()} bytes`,
      );
      console.log(`   Actual Length: ${actualLength.toLocaleString()} bytes`);

      if (Number.isFinite(compression)) {
        if (compression >= 0) {
          console.log(`   Compression: ${compression.toFixed(2)}%`);
        } else {
          console.log(
            `   Content Expansion: ${Math.abs(compression).toFixed(2)}% (larger than declared)`,
          );
        }
      } else {
        console.log(`   Compression: Unable to calculate (invalid data)`);
      }
    } else if (contentLength === 0 && actualLength > 0) {
      console.log(`\n📊 Compression Analysis:`);
      console.log(`   Declared Length: Not specified`);
      console.log(`   Actual Length: ${actualLength.toLocaleString()} bytes`);
      console.log(
        `   Compression: Cannot calculate (no Content-Length header)`,
      );
    } else {
      console.log(`\n📊 Compression Analysis: No content to analyze`);
    }
  } catch (error) {
    console.error(`❌ Performance analysis error: ${error.message}`);
  }
  console.log();

  // Example 6: Combined Response and Extraction
  console.log('6. Combined Response Analysis and Content Extraction');
  console.log('====================================================');

  try {
    const response = await parser.fetchHtml('https://httpbin.org/html', {
      useRandomUserAgent: true,
      timeout: 5000,
    });

    console.log('🔍 Response + Content Analysis:');
    console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Server: ${response.headers.server || 'Unknown'}`);
    console.log(
      `   Content-Type: ${response.headers['content-type'] || 'Unknown'}`,
    );

    // Only process if it's HTML and successful
    if (
      response.status === 200 &&
      response.headers['content-type']?.includes('html')
    ) {
      console.log('\n📖 Content Extraction:');

      // Extract basic information
      const title = parser.extractText(
        response.data,
        '//title/text()',
        'xpath',
      );
      const headings = parser.extractMultiple(
        response.data,
        'h1, h2, h3',
        'css',
      );
      const paragraphs = parser.count(response.data, 'p', 'css');
      const links = parser.extractAttributes(response.data, 'a', 'href', 'css');

      console.log(`   Title: ${title || 'No title'}`);
      console.log(`   Headings: ${headings.length} found`);
      if (headings.length > 0) {
        console.log(`   First heading: ${headings[0]}`);
      }
      console.log(`   Paragraphs: ${paragraphs}`);
      console.log(`   Links: ${links.length} found`);

      // Extract structured data
      const pageInfo = parser.extractStructured(response.data, {
        title: {
          selector: '//title/text()',
          type: 'xpath',
        },
        headingCount: {
          selector: 'h1, h2, h3, h4, h5, h6',
          type: 'css',
          transform: (value) =>
            parser.count(response.data, 'h1, h2, h3, h4, h5, h6', 'css'),
        },
        hasImages: {
          selector: 'img',
          type: 'css',
          transform: (value) => parser.exists(response.data, 'img', 'css'),
        },
      });

      console.log('\n📊 Structured Analysis:');
      console.log(`   ${JSON.stringify(pageInfo, null, 2)}`);

      // Create a comprehensive report
      const report = {
        response: {
          status: response.status,
          statusText: response.statusText,
          server: response.headers.server,
          contentType: response.headers['content-type'],
          contentLength: response.data.length,
        },
        content: pageInfo,
        links: links.slice(0, 3), // First 3 links
        timestamp: new Date().toISOString(),
      };

      console.log('\n📋 Complete Report:');
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        `   ⚠️ Cannot extract content - Status: ${response.status}, Content-Type: ${response.headers['content-type']}`,
      );
    }
  } catch (error) {
    console.error(`❌ Combined analysis error: ${error.message}`);
  }
  console.log();

  // Example 7: Error Response Handling
  console.log('7. Error Response Handling');
  console.log('==========================');

  try {
    // This will likely cause a timeout or DNS error
    const response = await parser.fetchHtml(
      'https://nonexistent-domain-12345.example',
      {
        timeout: 3000,
        retries: 1,
      },
    );

    // This won't execute due to error, but shows how you'd handle success
    console.log(`Unexpected success: ${response.status}`);
  } catch (error) {
    console.log('🚨 Handling Fetch Error:');
    console.log(`   Error Type: ${error.constructor.name}`);
    console.log(`   Error Message: ${error.message}`);

    // In real applications, you might want to:
    // 1. Log errors for monitoring
    // 2. Return default content
    // 3. Try alternative URLs
    // 4. Cache and return previous successful response

    console.log('   📝 Error Handling Strategies:');
    console.log('     • Log error for monitoring');
    console.log('     • Try alternative URLs');
    console.log('     • Return cached content');
    console.log('     • Use fallback data source');
  }

  console.log('\n🎉 HtmlFetchResponse demonstration completed!');
}

// Export the demo function
export { demonstrateHtmlFetchResponse };

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateHtmlFetchResponse()
    .then(() => console.log('\n✨ Demo completed successfully!'))
    .catch((error) => console.error('\n💥 Demo failed:', error.message));
}
