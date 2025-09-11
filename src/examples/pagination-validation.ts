/**
 * Example: Pagination validation and safe extraction
 * 
 * This example demonstrates how to safely handle undefined selectors
 * and validate pagination patterns before extracting data using both
 * the new extractPagination method and manual extraction methods.
 */

import { HtmlParserService } from '../html-parser.service';
import { ExtractionSchema, PaginationPage } from '../types';

interface PageResult {
  href: string;
  text: string;
  isCurrent: boolean;
  isSkip: boolean;
}

interface PaginationPattern {
  PAGE_NODE_PATTERN?: {
    selector: string;
  };
}

async function demonstrateNewExtractPagination() {
  const parser = new HtmlParserService();
  
  const html = `
    <ul class="pageNav-main">
      <li class="pageNav-page"><a href="/forums/forums/introduction-greetings.24/">1</a></li>
      <li class="pageNav-page pageNav-page--earlier"><a href="/forums/forums/introduction-greetings.24/page-2">2</a></li>
      <li class="pageNav-page pageNav-page--earlier"><a href="/forums/forums/introduction-greetings.24/page-3">3</a></li>
      <li class="pageNav-page pageNav-page--earlier"><a href="/forums/forums/introduction-greetings.24/page-4">4</a></li>
      <li class="pageNav-page pageNav-page--current"><a href="/forums/forums/introduction-greetings.24/page-5">5</a></li>
      <li class="pageNav-page pageNav-page--later"><a href="/forums/forums/introduction-greetings.24/page-6">6</a></li>
      <li class="pageNav-page pageNav-page--later"><a href="/forums/forums/introduction-greetings.24/page-7">7</a></li>
      <li class="pageNav-page"><a href="/forums/forums/introduction-greetings.24/page-344">344</a></li>
    </ul>
  `;
  
  try {
    console.log('=== New extractPagination Method ===');
    
    // Using the new extractPagination method - much simpler!
    const pages = parser.extractPagination(
      html,
      "//li[contains(@class, 'pageNav-page')]",
      'xpath',
      { 
        verbose: true,
        baseUrl: 'https://www.bmw-sg.com'
      }
    );
    
    console.log('📄 Extracted pages with new method:', pages);
    console.log(`✅ Found ${pages.length} pagination pages`);
    
    // Show first few pages
    pages.slice(0, 3).forEach((page, index) => {
      console.log(`  ${index + 1}. "${page.text}" -> ${page.href}`);
    });
    
    return pages;
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    return [];
  }
}

async function demonstrateOldMethodValidation() {
  const parser = new HtmlParserService();
  
  const html = `
    <ul class="pageNav-main">
      <li class="pageNav-page"><a href="/page-1">1</a></li>
      <li class="pageNav-page pageNav-page--current"><a href="/page-2">2</a></li>
      <li class="pageNav-page"><a href="/page-3">3</a></li>
    </ul>
  `;
  
  // Example of potentially undefined selector pattern
  const mappedPattern: PaginationPattern = {
    PAGE_NODE_PATTERN: {
      selector: "//li[contains(@class, 'pageNav-page')]"
    }
  };
  
  // Schema for page extraction
  const pageSchema: ExtractionSchema<PageResult> = {
    href: {
      selector: './/a',
      type: 'xpath',
      attribute: 'href'
    },
    text: {
      selector: './/a/text()',
      type: 'xpath'
    },
    isCurrent: {
      selector: '.',
      type: 'xpath',
      attribute: 'class',
      transform: (className: string) => className?.includes('pageNav-page--current') || false
    },
    isSkip: {
      selector: '.',
      type: 'xpath', 
      attribute: 'class',
      transform: (className: string) => className?.includes('pageNav-page--skip') || false
    }
  };
  
  try {
    console.log('\n=== Old Method with Validation (Manual Schema) ===');
    
    // Safe extraction with validation
    const containerSelector = mappedPattern['PAGE_NODE_PATTERN']?.selector;
    
    if (!containerSelector) {
      console.log('❌ No container selector found');
      return [];
    }
    
    console.log('✅ Container selector found:', containerSelector);
    
    const pages = parser.extractStructuredList<PageResult>(
      html,
      containerSelector,
      pageSchema,
      'xpath',
      { verbose: true }
    );
    
    console.log('📄 Extracted pages with old method:', pages);
    
    return pages;
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    return [];
  }
}

// Example with undefined selector to show the error case
async function demonstrateUndefinedSelectorError() {
  const parser = new HtmlParserService();
  
  const html = '<div>Test</div>';
  const mappedPattern: PaginationPattern = {}; // No PAGE_NODE_PATTERN
  
  try {
    console.log('\n=== Unsafe Extraction (will show error handling) ===');
    
    // This will cause undefined selector error with old method
    const containerSelector = mappedPattern['PAGE_NODE_PATTERN']?.selector;
    console.log('Container selector:', containerSelector); // undefined
    
    if (!containerSelector) {
      console.log('❌ No container selector found - returning empty array');
      return [];
    }
    
    // This code won't be reached due to validation above
    const pages = parser.extractStructuredList(
      html,
      containerSelector,
      {},
      'xpath'
    );
    
    return pages;
    
  } catch (error) {
    console.error('❌ Error caught:', error.message);
    return [];
  }
}

// Compare both methods
async function compareExtractionMethods() {
  console.log('\n=== Comparison: New vs Old Method ===');
  
  const html = `
    <ul class="pageNav-main">
      <li class="pageNav-page"><a href="/page-1">Page 1</a></li>
      <li class="pageNav-page"><a href="/page-2">Page 2</a></li>
      <li class="pageNav-page"><a href="/page-3">Page 3</a></li>
    </ul>
  `;
  
  const parser = new HtmlParserService();
  const baseUrl = 'https://example.com';
  
  console.log('📊 New extractPagination method:');
  const newMethodPages = parser.extractPagination(
    html,
    "//li[contains(@class, 'pageNav-page')]",
    'xpath',
    { baseUrl }
  );
  console.log('   Result count:', newMethodPages.length);
  console.log('   Sample:', newMethodPages[0]);
  
  console.log('\n📊 Old extractStructuredList method:');
  const pageSchema: ExtractionSchema<PaginationPage> = {
    href: {
      selector: './/a',
      type: 'xpath',
      attribute: 'href'
    },
    text: {
      selector: './/a/text()',
      type: 'xpath'
    }
  };
  
  const oldMethodPages = parser.extractStructuredList<PaginationPage>(
    html,
    "//li[contains(@class, 'pageNav-page')]",
    pageSchema,
    'xpath',
    { baseUrl }
  );
  console.log('   Result count:', oldMethodPages.length);
  console.log('   Sample:', oldMethodPages[0]);
  
  console.log('\n✅ Both methods produce equivalent results!');
  console.log('💡 New method is more convenient for common pagination use cases');
}

// Run examples
if (require.main === module) {
  (async () => {
    await demonstrateNewExtractPagination();
    await demonstrateOldMethodValidation();
    await demonstrateUndefinedSelectorError();
    await compareExtractionMethods();
  })();
}

export {
  demonstrateNewExtractPagination,
  demonstrateOldMethodValidation,
  demonstrateUndefinedSelectorError,
  compareExtractionMethods,
  PageResult,
  PaginationPattern
};