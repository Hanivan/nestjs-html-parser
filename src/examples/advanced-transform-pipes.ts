import { ExtractionSchema, HtmlParserService } from '../';

/**
 * Advanced Transform Pipes Example
 *
 * This example demonstrates the new advanced transform functionality that supports
 * pipe arrays with baseUrl context, similar to the forum-crawler system.
 * It shows how to chain multiple transform pipes where each pipe's output
 * becomes the input for the next pipe.
 */

// Mock pipe classes that mimic the forum-crawler pipe system
class ParseAsURLPipe {
  baseUrl?: string;

  transform(url: string): string {
    if (!this.baseUrl) {
      throw new Error('BaseURL is required for ParseAsURLPipe');
    }
    try {
      return new URL(url, this.baseUrl).toString();
    } catch (error) {
      throw new Error(`Invalid URL: ${url} with baseUrl: ${this.baseUrl}`);
    }
  }
}

class QueryAppendPipe {
  queryParams: Record<string, string> = {};

  transform(url: string): string {
    try {
      const urlObj = new URL(url);
      Object.entries(this.queryParams).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
      });
      return urlObj.toString();
    } catch (error) {
      throw new Error(`Failed to append query parameters to URL: ${url}`);
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

class NumberNormalizePipe {
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
  transform(dateString: string): number {
    // Simple date parser that converts to Unix timestamp
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? Date.now() / 1000 : date.getTime() / 1000;
  }
}

// Define typed interfaces
interface ForumPost {
  title: string;
  link: string;
  author: string;
  replies: number;
  views: number;
  lastPost: number; // Unix timestamp
}

interface ProductListing {
  name: string;
  url: string;
  price: number;
  rating: number;
}

async function demonstrateAdvancedTransformPipes(verbose = false): Promise<void> {
  const parser = new HtmlParserService();

  console.log('🔧 Advanced Transform Pipes Demo');
  console.log('='.repeat(50));

  // Sample HTML content for demonstration (mimicking a forum structure)
  const forumHtml = `
    <div class="forum-container">
      <div class="thread">
        <h3><a href="/forums/threads/newbie.92711/">Newbie Introduction</a></h3>
        <div class="author">By: john_doe</div>
        <div class="stats">Replies: 25 | Views: 1.2k</div>
        <div class="last-post">Last post: 2023-12-15T10:30:00Z</div>
      </div>
      <div class="thread">
        <h3><a href="/forums/threads/greetings-fro-newbie.92674/">Greetings from Newbie</a></h3>
        <div class="author">By: jane_smith</div>
        <div class="stats">Replies: 42 | Views: 3.5k</div>
        <div class="last-post">Last post: 2023-12-14T15:45:00Z</div>
      </div>
      <div class="thread">
        <h3><a href="/forums/threads/newbie-here-hello-all.92625/">Newbie here, hello all!</a></h3>
        <div class="author">By: mike_wilson</div>
        <div class="stats">Replies: 18 | Views: 890</div>
        <div class="last-post">Last post: 2023-12-13T09:15:00Z</div>
      </div>
    </div>
  `;

  // Define extraction schema with advanced transform pipes
  const forumSchema: ExtractionSchema<ForumPost> = {
    title: {
      selector: './/h3/a/text()',
      type: 'xpath'
    },
    link: {
      selector: './/h3/a',
      type: 'xpath',
      attribute: 'href',
      // This is the key improvement - pipe array with baseUrl context!
      transform: [
        { class: ParseAsURLPipe }, // Converts relative URL to absolute URL
        { class: QueryAppendPipe, payload: { queryParams: { utm_source: 'parser', ref: 'demo' } } } // Adds tracking parameters
      ]
    },
    author: {
      selector: './/div[@class="author"]/text()',
      type: 'xpath',
      transform: [
        { class: RegexReplacePipe, payload: { regex: '^By: ', textReplacement: '', flag: 'i' } }, // Remove "By: " prefix
        (author: string) => author.trim() // Additional cleanup
      ]
    },
    replies: {
      selector: './/div[@class="stats"]/text()',
      type: 'xpath',
      transform: [
        // Extract replies using regex and function
        (stats: string) => {
          const match = stats.match(/Replies:\s*(\d+)/);
          return match ? match[1] : '0';
        },
        { class: NumberNormalizePipe } // Convert to number (handles 1k, 1.2k, etc.)
      ]
    },
    views: {
      selector: './/div[@class="stats"]/text()',
      type: 'xpath',
      transform: [
        // Extract views using regex and function
        (stats: string) => {
          const match = stats.match(/Views:\s*([\d\.k]+)/);
          return match ? match[1] : '0';
        },
        { class: NumberNormalizePipe } // Convert to number (handles 1k, 1.2k, etc.)
      ]
    },
    lastPost: {
      selector: './/div[@class="last-post"]/text()',
      type: 'xpath',
      transform: [
        { class: RegexReplacePipe, payload: { regex: 'Last post: (.+)', textReplacement: '$1' } }, // Extract date string
        { class: DateFormatPipe } // Convert to Unix timestamp
      ]
    }
  };

  try {
    console.log('📋 Extracting forum posts with advanced transform pipes...');
    console.log();

    // Demonstrate getOrigin utility method
    const fullUrl = 'https://www.bmw-sg.com/forums/forums/introduction-greetings.24/page-5';
    const baseUrl = parser.getOrigin(fullUrl);
    
    console.log(`🔗 URL Origin Extraction:`);
    console.log(`   Full URL: ${fullUrl}`);
    console.log(`   Extracted Origin: ${baseUrl}`);
    console.log();

    // Debug: Test raw extraction without transforms
    console.log(`🔍 Debug: Raw stats extraction:`);
    const rawStats = parser.extractMultiple(forumHtml, '//div[@class="stats"]/text()', 'xpath');
    rawStats.forEach((stat, index) => {
      console.log(`   Thread ${index + 1}: "${stat}"`);
    });
    console.log();

    // The key is passing baseUrl in options so ParseAsURLPipe can work correctly
    const posts = parser.extractStructuredList<ForumPost>(
      forumHtml,
      '//div[@class="thread"]',
      forumSchema,
      'xpath',
      {
        verbose,
        baseUrl // Using extracted origin - This solves the ERR_INVALID_URL issue!
      }
    );

    console.log(`✅ Successfully extracted ${posts.length} forum posts`);
    console.log();

    posts.forEach((post, index) => {
      console.log(`📝 Post ${index + 1}:`);
      console.log(`   Title: ${post.title}`);
      console.log(`   Link: ${post.link}`); // Should be absolute URL with query params
      console.log(`   Author: ${post.author}`);
      console.log(`   Replies: ${post.replies}`);
      console.log(`   Views: ${post.views}`);
      console.log(`   Last Post: ${new Date(post.lastPost * 1000).toISOString()}`);
      console.log();
    });

    // Demonstrate single value extraction with pipe arrays
    console.log('🎯 Single value extraction with transform pipes:');
    
    const singleLink = parser.extractSingle<string>(
      '<a href="/test/path">Test Link</a>',
      '//a',
      'xpath',
      'href',
      {
        baseUrl: 'https://example.com',
        transform: [
          { class: ParseAsURLPipe },
          { class: QueryAppendPipe, payload: { queryParams: { source: 'test' } } }
        ]
      }
    );

    console.log(`   Original: "/test/path"`);
    console.log(`   Transformed: ${singleLink}`);
    console.log();

    // Demonstrate multiple value extraction with pipe arrays
    const multipleLinks = parser.extractMultiple<string>(
      `<div>
         <a href="/page1">Link 1</a>
         <a href="/page2">Link 2</a>
         <a href="/page3">Link 3</a>
       </div>`,
      '//a',
      'xpath',
      'href',
      {
        baseUrl: 'https://example.com',
        transform: [
          { class: ParseAsURLPipe },
          { class: QueryAppendPipe, payload: { queryParams: { batch: 'multi' } } }
        ]
      }
    );

    console.log('📦 Multiple links with transform pipes:');
    multipleLinks.forEach((link, index) => {
      console.log(`   ${index + 1}: ${link}`);
    });

    // Demonstrate different getOrigin use cases
    console.log();
    console.log('🌐 getOrigin() Method Examples:');
    
    const urlExamples = [
      'https://www.bmw-sg.com/forums/forums/introduction-greetings.24/page-5',
      'http://example.com:8080/path/to/page?param=value#section',
      'https://subdomain.domain.co.uk/very/long/path/here',
      'https://api.github.com/repos/owner/repo/issues/123'
    ];

    urlExamples.forEach((url, index) => {
      try {
        const origin = parser.getOrigin(url);
        console.log(`   ${index + 1}. ${url}`);
        console.log(`      Origin: ${origin}`);
      } catch (error) {
        console.log(`   ${index + 1}. ${url}`);
        console.log(`      Error: ${error.message}`);
      }
    });

  } catch (error) {
    console.error('❌ Error during extraction:', error);
    throw error;
  }
}

// Product example showing different pipe combinations
async function demonstrateProductTransformPipes(verbose = false): Promise<void> {
  console.log();
  console.log('🛍️ Product Transform Pipes Demo');
  console.log('='.repeat(50));

  const parser = new HtmlParserService();

  const productHtml = `
    <div class="product-grid">
      <div class="product">
        <h3><a href="/products/laptop-abc-123">Gaming Laptop ABC</a></h3>
        <span class="price">$1,299.99</span>
        <div class="rating">4.5 stars (127 reviews)</div>
      </div>
      <div class="product">
        <h3><a href="/products/monitor-xyz-456">4K Monitor XYZ</a></h3>
        <span class="price">$599.50</span>
        <div class="rating">4.8 stars (89 reviews)</div>
      </div>
    </div>
  `;

  const productSchema: ExtractionSchema<ProductListing> = {
    name: {
      selector: './/h3/a/text()',
      type: 'xpath',
      transform: (name: string) => name.trim()
    },
    url: {
      selector: './/h3/a',
      type: 'xpath',
      attribute: 'href',
      transform: [
        { class: ParseAsURLPipe },
        { class: QueryAppendPipe, payload: { queryParams: { category: 'electronics', source: 'listing' } } }
      ]
    },
    price: {
      selector: './/span[@class="price"]/text()',
      type: 'xpath',
      transform: [
        // Extract price and remove non-numeric characters
        (priceText: string) => {
          const cleanPrice = priceText.replace(/[^\d.]/g, '');
          return cleanPrice || '0';
        },
        (price: string) => parseFloat(price)
      ]
    },
    rating: {
      selector: './/div[@class="rating"]/text()',
      type: 'xpath',
      transform: [
        { class: RegexReplacePipe, payload: { regex: '([\\d\\.]+) stars.*', textReplacement: '$1' } },
        (rating: string) => parseFloat(rating)
      ]
    }
  };

  // Extract origin from a full URL for convenience
  const fullShopUrl = 'https://shop.example.com/category/electronics?sort=price';
  const shopBaseUrl = parser.getOrigin(fullShopUrl);

  const products = parser.extractStructuredList<ProductListing>(
    productHtml,
    '//div[@class="product"]',
    productSchema,
    'xpath',
    {
      verbose,
      baseUrl: shopBaseUrl // Using extracted origin
    }
  );

  // Debug: Test raw price extraction
  console.log(`🔍 Debug: Raw price extraction:`);
  const rawPrices = parser.extractMultiple(productHtml, '//span[@class="price"]/text()', 'xpath');
  rawPrices.forEach((price, index) => {
    console.log(`   Product ${index + 1}: "${price}"`);
  });
  console.log();

  console.log(`✅ Successfully extracted ${products.length} products`);
  console.log();

  products.forEach((product, index) => {
    console.log(`🛒 Product ${index + 1}:`);
    console.log(`   Name: ${product.name}`);
    console.log(`   URL: ${product.url}`);
    console.log(`   Price: $${product.price.toFixed(2)}`);
    console.log(`   Rating: ${product.rating}/5.0`);
    console.log();
  });
}

export {
  demonstrateAdvancedTransformPipes,
  demonstrateProductTransformPipes,
  ParseAsURLPipe,
  QueryAppendPipe,
  RegexReplacePipe,
  NumberNormalizePipe,
  DateFormatPipe
};

// Run the demonstration if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      await demonstrateAdvancedTransformPipes(true);
      await demonstrateProductTransformPipes(true);
      
      console.log('🎉 All advanced transform pipe demonstrations completed successfully!');
    } catch (error) {
      console.error('💥 Demo failed:', error);
      process.exit(1);
    }
  })();
}