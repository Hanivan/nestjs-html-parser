import { HtmlParserService } from '../html-parser.service';
import { ProxyConfig } from '../types';

/**
 * Example demonstrating proxy and random user agent usage
 */
async function demonstrateProxyAndUserAgent() {
  const parser = new HtmlParserService();

  console.log('🚀 NestJS HTML Parser - Proxy & User Agent Demo\n');

  // Example 1: Using random user agent
  console.log('1. Using Random User Agent');
  console.log('============================');

  try {
    // Fetch with random user agent
    const randomUserAgent = await parser.getRandomUserAgent();
    console.log(`🔄 Generated Random User Agent: ${randomUserAgent}`);

    const response = await parser.fetchHtml('https://httpbin.org/user-agent', {
      useRandomUserAgent: true,
      timeout: 10000,
    });

    // Extract the user agent that was sent
    const userAgentText = parser.extractText(
      response.data,
      '//text()[contains(., "user-agent")]',
      'xpath',
    );
    console.log(`✅ User Agent sent to server: ${userAgentText}\n`);
  } catch (error) {
    console.error(`❌ Error with random user agent: ${error.message}\n`);
  }

  // Example 2: Testing multiple random user agents
  console.log('2. Multiple Random User Agents');
  console.log('===============================');

  for (let i = 1; i <= 3; i++) {
    const userAgent = await parser.getRandomUserAgent();
    console.log(`🔄 Random UA ${i}: ${userAgent}`);
  }
  console.log();

  // Example 3: Using proxy (HTTP)
  console.log('3. Using HTTP Proxy');
  console.log('===================');

  // Example HTTP proxy configuration
  const httpProxy: ProxyConfig = {
    url: 'http://proxy.example.com:8080',
    type: 'http',
    // username: 'your-username',  // Uncomment if proxy requires auth
    // password: 'your-password',  // Uncomment if proxy requires auth
  };

  // Alternative: Proxy with credentials in URL format
  const httpProxyWithUrlCreds: ProxyConfig = {
    url: 'http://username:password@proxy.example.com:8080',
    type: 'http',
  };

  try {
    // Test proxy connection
    console.log('🔍 Testing proxy connection...');
    const isProxyWorking = await parser.testProxy(httpProxy);
    console.log(
      `📡 Proxy status: ${isProxyWorking ? '✅ Working' : '❌ Not working'}`,
    );

    if (isProxyWorking) {
      // Fetch with proxy
      const response = await parser.fetchHtml('https://httpbin.org/ip', {
        proxy: httpProxy,
        useRandomUserAgent: true,
        timeout: 15000,
      });

      const ipInfo = parser.extractText(
        response.data,
        '//text()[contains(., "origin")]',
        'xpath',
      );
      console.log(`🌐 IP from proxy: ${ipInfo}`);
    }
  } catch (error) {
    console.error(`❌ Proxy error: ${error.message}`);
  }
  console.log();

  // Example 4: Using SOCKS proxy
  console.log('4. Using SOCKS Proxy');
  console.log('====================');

  const socksProxy: ProxyConfig = {
    url: 'socks5://proxy.example.com:1080',
    type: 'socks5',
    // username: 'your-username',  // Uncomment if proxy requires auth
    // password: 'your-password',  // Uncomment if proxy requires auth
  };

  // Alternative: SOCKS proxy with credentials in URL
  const socksProxyWithUrlCreds: ProxyConfig = {
    url: 'socks5://username:password@proxy.example.com:1080',
    type: 'socks5',
  };

  try {
    console.log('🔍 Testing SOCKS proxy connection...');
    const isSocksWorking = await parser.testProxy(socksProxy);
    console.log(
      `📡 SOCKS Proxy status: ${isSocksWorking ? '✅ Working' : '❌ Not working'}`,
    );
  } catch (error) {
    console.error(`❌ SOCKS Proxy error: ${error.message}`);
  }
  console.log();

  // Example 5: Demonstrating different credential methods
  console.log('5. Different Proxy Credential Methods');
  console.log('=====================================');

  console.log('📋 Method 1: Separate username/password fields');
  const method1: ProxyConfig = {
    url: 'http://proxy.example.com:8080',
    username: 'myuser',
    password: 'mypass',
  };
  console.log(`   URL: ${method1.url}`);
  console.log(`   Username: ${method1.username}`);
  console.log(`   Password: ${method1.password}`);

  console.log('📋 Method 2: Credentials in URL');
  const method2: ProxyConfig = {
    url: 'http://myuser:mypass@proxy.example.com:8080',
  };
  console.log(`   URL: ${method2.url}`);

  console.log(
    '📋 Method 3: Mixed (separate credentials override URL credentials)',
  );
  const method3: ProxyConfig = {
    url: 'http://olduser:oldpass@proxy.example.com:8080',
    username: 'newuser',
    password: 'newpass',
  };
  console.log(`   URL: ${method3.url}`);
  console.log(`   Override Username: ${method3.username}`);
  console.log(`   Override Password: ${method3.password}`);
  console.log('   (newuser:newpass will be used, not olduser:oldpass)');
  console.log();

  // Example 6: Combining everything with retry logic
  console.log('6. Complete Example with Retries');
  console.log('=================================');

  try {
    const response = await parser.fetchHtml('https://httpbin.org/status/200', {
      useRandomUserAgent: true,
      retries: 3,
      retryDelay: 2000,
      timeout: 10000,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    console.log(
      `📄 Successfully fetched content (${response.data.length} characters)`,
    );
    console.log(
      '✅ Request completed with random user agent and retry logic\n',
    );
  } catch (error) {
    console.error(`❌ Complete example error: ${error.message}\n`);
  }

  // Example 7: Practical scraping with all features
  console.log('7. Practical Scraping Example');
  console.log('==============================');

  try {
    const response = await parser.fetchHtml('https://httpbin.org/html', {
      useRandomUserAgent: true,
      retries: 2,
      retryDelay: 1000,
      timeout: 10000,
    });

    // Extract title using XPath
    const title = parser.extractText(response.data, '//title/text()', 'xpath');
    console.log(`📋 Page Title: ${title}`);

    // Extract all links using CSS selector
    const links = parser.extractMultiple(response.data, 'a', 'css', 'href');
    console.log(`🔗 Found ${links.length} links: ${links.join(', ')}`);

    // Check if specific element exists
    const hasForm = parser.exists(response.data, '//form', 'xpath');
    console.log(`📝 Has form: ${hasForm ? 'Yes' : 'No'}`);

    console.log('✅ Practical scraping completed successfully');
  } catch (error) {
    console.error(`❌ Practical scraping error: ${error.message}`);
  }
}

// Export the demo function
export { demonstrateProxyAndUserAgent };

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateProxyAndUserAgent()
    .then(() => console.log('\n🎉 Demo completed!'))
    .catch((error) => console.error('\n💥 Demo failed:', error.message));
}
