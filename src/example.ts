import { ExtractionSchema, HtmlParserService } from './html-parser.service';

async function demonstrateHtmlParser() {
  const parser = new HtmlParserService();

  try {
    // Fetch HTML from Hacker News
    console.log('Fetching HTML from Hacker News...');
    const html = await parser.fetchHtml('https://news.ycombinator.com/');

    console.log('\n=== Basic Extraction Examples ===');

    // Extract single value
    const title = parser.extractSingle(html, '//title/text()');
    console.log('Site title:', title);

    // Extract multiple values
    const storyTitles = parser.extractMultiple(
      html,
      '//span[contains(@class, "titleline")]/a/text()',
    );
    console.log('First 3 story titles:', storyTitles.slice(0, 3));

    // Check if elements exist
    const hasStories = parser.exists(html, '//tr[contains(@class, "athing")]');
    console.log('Has stories:', hasStories);

    // Count elements
    const storyCount = parser.count(html, '//tr[contains(@class, "athing")]');
    console.log('Number of stories:', storyCount);

    console.log('\n=== CSS Selector Examples ===');

    // Using CSS selectors instead of XPath
    const titleCSS = parser.extractSingle(html, 'title', 'css');
    console.log('Site title (CSS):', titleCSS);

    const storyTitlesCSS = parser.extractMultiple(html, '.titleline a', 'css');
    console.log('First 3 story titles (CSS):', storyTitlesCSS.slice(0, 3));

    console.log('\n=== Attribute Extraction ===');

    // Extract attributes
    const storyUrls = parser.extractAttributes(
      html,
      '//span[contains(@class, "titleline")]/a',
      'href',
    );
    console.log('First 3 story URLs:', storyUrls.slice(0, 3));

    console.log('\n=== Structured Data Extraction ===');

    // Define a schema for extracting structured data
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
      commentsCount: {
        selector: './/a[contains(text(), "comments")]/text()',
        type: 'xpath',
        transform: (value: string) => {
          if (!value) return 0;
          const match = value.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        },
      },
    };

    // Extract structured list of stories
    const stories = parser.extractStructuredList(
      html,
      '//tr[contains(@class, "athing")]',
      storySchema,
    );

    console.log('Extracted stories (first 3):');
    stories.slice(0, 3).forEach((story, index) => {
      console.log(`\nStory ${index + 1}:`);
      console.log(`  Rank: ${story.rank}`);
      console.log(`  Title: ${story.title}`);
      console.log(`  URL: ${story.url}`);
      console.log(`  Domain: ${story.domain || 'N/A'}`);
      console.log(`  Author: ${story.author || 'N/A'}`);
      console.log(`  Score: ${story.score || 'N/A'}`);
      console.log(`  Comments: ${story.commentsCount || 'N/A'}`);
    });

    console.log('\n=== Advanced Examples ===');

    // Extract user links for checking user profiles
    const userLinks = parser.extractAttributes(
      html,
      '//a[contains(@class, "hnuser")]',
      'href',
    );
    console.log('User profile links (first 3):', userLinks.slice(0, 3));

    // Extract comment counts
    const commentCounts = parser.extractMultiple(
      html,
      '//a[contains(@href, "item?id=") and contains(text(), "comments")]/text()',
    );
    console.log('Comment counts (first 3):', commentCounts.slice(0, 3));

    // Extract story IDs from URLs
    const storyIds = parser
      .extractAttributes(html, '//a[contains(@href, "item?id=")]', 'href')
      .map((href) => href.split('=')[1]);
    console.log('Story IDs (first 3):', storyIds.slice(0, 3));

    console.log('\n=== Mixed Selector Types Example ===');

    // Use both XPath and CSS in same schema
    const mixedSchema: ExtractionSchema = {
      titleXPath: {
        selector: './/span[contains(@class, "titleline")]/a/text()',
        type: 'xpath',
      },
      titleCSS: {
        selector: '.titleline a',
        type: 'css',
      },
      rankXPath: {
        selector: './/span[contains(@class, "rank")]',
        type: 'xpath',
      },
      rankCSS: {
        selector: '.rank',
        type: 'css',
      },
    };

    const mixedResult = parser.extractStructured(html, mixedSchema);
    console.log('Mixed selectors result:', mixedResult);
  } catch (error) {
    console.error('Error demonstrating HTML parser:', error.message);
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateHtmlParser()
    .then(() => console.log('\nDemo completed!'))
    .catch(console.error);
}

export { demonstrateHtmlParser };
