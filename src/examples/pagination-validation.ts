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
    <div class="pageNav pageNav--skipStart pageNav--skipEnd">
  <a
    href="/forums/forums/introduction-greetings.24/page-4"
    class="pageNav-jump pageNav-jump--prev"
    >Prev</a
  >

  <ul class="pageNav-main">
    <li class="pageNav-page">
      <a href="/forums/forums/introduction-greetings.24/">1</a>
    </li>

    <li class="pageNav-page pageNav-page--earlier">
      <a href="/forums/forums/introduction-greetings.24/page-2">2</a>
    </li>

    <li class="pageNav-page pageNav-page--earlier">
      <a href="/forums/forums/introduction-greetings.24/page-3">3</a>
    </li>

    <li class="pageNav-page pageNav-page--earlier">
      <a href="/forums/forums/introduction-greetings.24/page-4">4</a>
    </li>

    <li class="pageNav-page pageNav-page--current">
      <a href="/forums/forums/introduction-greetings.24/page-5">5</a>
    </li>

    <li class="pageNav-page pageNav-page--later">
      <a href="/forums/forums/introduction-greetings.24/page-6">6</a>
    </li>

    <li class="pageNav-page pageNav-page--later">
      <a href="/forums/forums/introduction-greetings.24/page-7">7</a>
    </li>

    <li class="pageNav-page pageNav-page--skip pageNav-page--skipEnd">
      <a
        data-xf-init="tooltip"
        data-xf-click="menu"
        role="button"
        tabindex="0"
        aria-expanded="false"
        aria-haspopup="true"
        data-original-title="Go to page"
        aria-label="Go to page"
        id="js-XFUniqueId2"
        >…</a
      >

      <div class="menu menu--pageJump" data-menu="menu" aria-hidden="true">
        <div class="menu-content">
          <h4 class="menu-header">Go to page</h4>
          <div
            class="menu-row"
            data-xf-init="page-jump"
            data-page-url="/forums/forums/introduction-greetings.24/page-%page%"
          >
            <div class="inputGroup inputGroup--numbers">
              <div
                class="inputGroup inputGroup--numbers inputNumber inputGroup--joined"
                data-xf-init="number-box"
              >
                <input
                  type="number"
                  pattern="\d*"
                  class="input input--number js-numberBoxTextInput input input--numberNarrow js-pageJumpPage"
                  value="8"
                  min="1"
                  max="344"
                  step="1"
                  required="required"
                  data-menu-autofocus="true"
                /><button
                  type="button"
                  tabindex="-1"
                  class="inputGroup-text inputNumber-button inputNumber-button--up js-up"
                  data-dir="up"
                  title="Increase"
                  aria-label="Increase"
                ></button
                ><button
                  type="button"
                  tabindex="-1"
                  class="inputGroup-text inputNumber-button inputNumber-button--down js-down"
                  data-dir="down"
                  title="Decrease"
                  aria-label="Decrease"
                ></button>
              </div>
              <span class="inputGroup-text"
                ><button type="button" class="js-pageJumpGo button">
                  <span class="button-text">Go</span>
                </button></span
              >
            </div>
          </div>
        </div>
      </div>
    </li>

    <li class="pageNav-page">
      <a href="/forums/forums/introduction-greetings.24/page-344">344</a>
    </li>
  </ul>

  <a
    href="/forums/forums/introduction-greetings.24/page-6"
    class="pageNav-jump pageNav-jump--next"
    >Next</a
  >
</div>
  `;

  try {
    console.log('=== New extractPagination Method ===');

    // Using the new extractPagination method - much simpler!
    // Use the entire pageNav container to extract ALL links (including Prev/Next)
    const pages = parser.extractPagination(
      html,
      '//div[contains(@class, "pageNav")]',
      'xpath',
      {
        verbose: true,
        baseUrl: 'https://www.bmw-sg.com',
      },
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
      selector: "//li[contains(@class, 'pageNav-page')]",
    },
  };

  // Schema for page extraction
  const pageSchema: ExtractionSchema<PageResult> = {
    href: {
      selector: './/a',
      type: 'xpath',
      attribute: 'href',
    },
    text: {
      selector: './/a/text()',
      type: 'xpath',
    },
    isCurrent: {
      selector: '.',
      type: 'xpath',
      attribute: 'class',
      transform: (className: string) =>
        className?.includes('pageNav-page--current') || false,
    },
    isSkip: {
      selector: '.',
      type: 'xpath',
      attribute: 'class',
      transform: (className: string) =>
        className?.includes('pageNav-page--skip') || false,
    },
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
      { verbose: true },
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
      'xpath',
    );

    return pages;
  } catch (error) {
    console.error('❌ Error caught:', error.message);
    return [];
  }
}

// Demonstrate enhanced extractPagination with all links extraction
async function demonstrateEnhancedExtractPagination() {
  const parser = new HtmlParserService();

  const html = `
    <div class="pageNav pageNav--skipStart pageNav--skipEnd">
        <a href="/forums/forums/introduction-greetings.24/page-4" class="pageNav-jump pageNav-jump--prev">Prev</a>
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
        <a href="/forums/forums/introduction-greetings.24/page-6" class="pageNav-jump pageNav-jump--next">Next</a>
    </div>
  `;

  try {
    console.log('\n=== Enhanced extractPagination Method - All Links ===');

    // Extract ALL links from the entire pagination container
    const allPages = parser.extractPagination(
      html,
      '//div[contains(@class, "pageNav")]',
      'xpath',
      {
        verbose: true,
        baseUrl: 'https://www.bmw-sg.com',
      },
    );

    console.log('📄 All pagination links extracted:', allPages);
    console.log(`✅ Found ${allPages.length} total pagination links`);

    // Show all links
    allPages.forEach((page, index) => {
      console.log(`  ${index + 1}. "${page.text}" -> ${page.href}`);
    });

    console.log('\n=== Enhanced extractPagination Method - Custom Schema ===');

    // Using custom schema to extract more detailed information
    interface DetailedPage {
      href: string;
      text: string;
      isActive: boolean;
      isPrevNext: boolean;
      className: string;
    }

    const detailedPages = parser.extractPagination<DetailedPage>(
      html,
      '//li[@class[contains(., "pageNav-page")]] | //a[@class[contains(., "pageNav-jump")]]',
      'xpath',
      {
        verbose: true,
        baseUrl: 'https://www.bmw-sg.com',
        schema: {
          href: {
            selector: './/a | .',
            type: 'xpath',
            attribute: 'href',
          },
          text: {
            selector: './/a/text() | ./text()',
            type: 'xpath',
          },
          isActive: {
            selector: '.',
            type: 'xpath',
            attribute: 'class',
            transform: (className: string) =>
              className?.includes('pageNav-page--current') || false,
          },
          isPrevNext: {
            selector: '.',
            type: 'xpath',
            attribute: 'class',
            transform: (className: string) =>
              className?.includes('pageNav-jump') || false,
          },
          className: {
            selector: '.',
            type: 'xpath',
            attribute: 'class',
          },
        },
      },
    );

    console.log('📄 Detailed pagination info:', detailedPages);
    console.log(
      `✅ Found ${detailedPages.length} detailed pagination elements`,
    );

    return allPages;
  } catch (error) {
    console.error('❌ Enhanced extraction failed:', error);
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
    { baseUrl },
  );
  console.log('   Result count:', newMethodPages.length);
  console.log('   Sample:', newMethodPages[0]);

  console.log('\n📊 Old extractStructuredList method:');
  const pageSchema: ExtractionSchema<PaginationPage> = {
    href: {
      selector: './/a',
      type: 'xpath',
      attribute: 'href',
    },
    text: {
      selector: './/a/text()',
      type: 'xpath',
    },
  };

  const oldMethodPages = parser.extractStructuredList<PaginationPage>(
    html,
    "//li[contains(@class, 'pageNav-page')]",
    pageSchema,
    'xpath',
    { baseUrl },
  );
  console.log('   Result count:', oldMethodPages.length);
  console.log('   Sample:', oldMethodPages[0]);

  console.log('\n✅ Both methods produce equivalent results!');
  console.log(
    '💡 New method is more convenient for common pagination use cases',
  );
}

// Run examples
if (require.main === module) {
  (async () => {
    await demonstrateNewExtractPagination();
    await demonstrateEnhancedExtractPagination();
    await demonstrateOldMethodValidation();
    await demonstrateUndefinedSelectorError();
    await compareExtractionMethods();
  })();
}

export {
  compareExtractionMethods,
  demonstrateEnhancedExtractPagination,
  demonstrateNewExtractPagination,
  demonstrateOldMethodValidation,
  demonstrateUndefinedSelectorError,
  PageResult,
  PaginationPattern,
};
