import { HtmlParserService } from '../html-parser.service';
import { ExtractionSchema } from '../types';

async function demonstrateWatanocParser() {
  const parser = new HtmlParserService();

  try {
    // Fetch HTML from watanoc.com - Japanese learning website
    console.log('Fetching HTML from watanoc.com...');
    const response = await parser.fetchHtml('https://watanoc.com/');
    const html = response.data;

    console.log('\n=== Watanoc.com - Japanese Learning Website Examples ===');

    // Extract site information
    const siteTitle = parser.extractSingle(html, '//title/text()');
    console.log('Site title:', siteTitle);

    const siteDescription = parser.extractSingle(
      html,
      '//meta[@name="description"]/@content',
    );
    console.log('Site description:', siteDescription);

    console.log('\n=== Article Extraction Examples ===');

    // Extract article titles with difficulty levels
    const articleTitles = parser.extractMultiple(
      html,
      '//h1[contains(@class, "entry-title") or contains(@id, "article")]//text() | //h2[contains(text(), "n4") or contains(text(), "n5") or contains(text(), "n3")]//text()',
    );
    console.log('Article titles (first 5):', articleTitles.slice(0, 5));

    // Extract difficulty levels using CSS selectors
    const difficultyLevels = parser
      .extractMultiple(html, 'h1, h2, h3', 'css')
      .filter(
        (title) =>
          title.includes('n4') || title.includes('n5') || title.includes('n3'),
      );
    console.log(
      'Articles with difficulty levels:',
      difficultyLevels.slice(0, 5),
    );

    console.log('\n=== Navigation and Category Examples ===');

    // Extract navigation categories
    const categories = parser.extractMultiple(
      html,
      '//nav//a/text() | //ul//li//a[contains(@href, "category") or contains(text(), "しょくじ") or contains(text(), "かんこう") or contains(text(), "イベント")]/text()',
    );
    console.log('Website categories:', categories.slice(0, 10));

    // Extract category links
    const categoryLinks = parser.extractAttributes(
      html,
      '//a[contains(@href, "category") or contains(text(), "しょくじ") or contains(text(), "かんこう")]',
      'href',
    );
    console.log('Category links:', categoryLinks.slice(0, 5));

    // === Raw HTML Extraction Example ===
    console.log('\n=== Raw HTML Extraction Example ===');
    const rawSchema: ExtractionSchema = {
      navHtml: {
        selector: '//nav',
        type: 'xpath',
        raw: true,
      },
      firstArticleTitleHtml: {
        selector:
          '(//h1[contains(@class, "entry-title") or contains(@id, "article")])[1]',
        type: 'xpath',
        raw: true,
      },
    };
    const rawResult = parser.extractStructured(html, rawSchema);
    console.log('Raw nav HTML:', rawResult.navHtml?.slice(0, 200) + '...');
    console.log(
      'Raw first article title HTML:',
      rawResult.firstArticleTitleHtml,
    );

    console.log('\n=== Article Metadata Extraction ===');

    // Define schema for article extraction
    const articleSchema: ExtractionSchema = {
      title: {
        selector: './/h1/text() | .//h2/text() | .//h3/text()',
        type: 'xpath',
      },
      englishTitle: {
        selector:
          './/br/following-sibling::text()[1] | .//text()[contains(., "Shaved ice") or contains(., "Oiled Ramen") or contains(., "Vietnamese sandwich")]',
        type: 'xpath',
      },
      difficulty: {
        selector:
          './/text()[contains(., "n3") or contains(., "n4") or contains(., "n5")]',
        type: 'xpath',
        transform: (value: string) => {
          const match = value.match(/(n[3-5])/);
          return match ? match[1] : null;
        },
      },
      author: {
        selector: './/text()[contains(., "avatar")]',
        type: 'xpath',
        transform: (value: string) => value.replace('avatar', '').trim(),
      },
      date: {
        selector:
          './/text()[contains(., "年") and contains(., "月") and contains(., "日")]',
        type: 'xpath',
      },
      category: {
        selector:
          './/text()[contains(., "食事") or contains(., "観光") or contains(., "イベント") or contains(., "文化")]',
        type: 'xpath',
      },
    };

    console.log('\n=== Food Articles (しょくじ) ===');

    // Extract food-related articles
    const foodArticles = parser.extractStructuredList(
      html,
      '//div[contains(text(), "肉玉そば") or contains(text(), "油そば") or contains(text(), "牛丼") or contains(text(), "ぎょうざ") or contains(text(), "ラーメン")]/..',
      {
        title: {
          selector:
            './/text()[contains(., "そば") or contains(., "丼") or contains(., "ラーメン")]',
          type: 'xpath',
        },
        difficulty: {
          selector: './/text()[contains(., "n4") or contains(., "n5")]',
          type: 'xpath',
          transform: (value: string) => {
            const match = value.match(/(n[4-5])/);
            return match ? match[1] : null;
          },
        },
        author: {
          selector:
            './/text()[contains(., "yusuke") or contains(., "さくら") or contains(., "すずき")]',
          type: 'xpath',
        },
      },
    );

    console.log('Food articles found:', foodArticles.length);
    foodArticles.slice(0, 3).forEach((article, index) => {
      console.log(`\nFood Article ${index + 1}:`);
      console.log(`  Title: ${article.title || 'N/A'}`);
      console.log(`  Difficulty: ${article.difficulty || 'N/A'}`);
      console.log(`  Author: ${article.author || 'N/A'}`);
    });

    console.log('\n=== Popular Articles Extraction ===');

    // Extract popular articles using CSS selectors
    const popularArticlesTitles = parser.extractMultiple(
      html,
      'h4, .popular-article-title, [class*="popular"] h3, [class*="popular"] h4',
      'css',
    );
    console.log('Popular article titles:', popularArticlesTitles.slice(0, 5));

    console.log('\n=== Language Detection and Content ===');

    // Extract Japanese learning content
    const japaneseContent = parser.extractMultiple(
      html,
      '//text()[contains(., "ひらがな") or contains(., "カタカナ") or contains(., "漢字") or contains(., "です") or contains(., "ます")]',
    );
    console.log(
      'Japanese learning content samples:',
      japaneseContent.slice(0, 5),
    );

    // Extract English translations
    const englishTranslations = parser.extractMultiple(
      html,
      '//text()[contains(., "sandwich") or contains(., "Festival") or contains(., "Noodles") or contains(., "ice")]',
    );
    console.log('English translations found:', englishTranslations.slice(0, 5));

    console.log('\n=== Author and Date Information ===');

    // Extract author information
    const authors = parser.extractMultiple(
      html,
      '//text()[contains(., "yusuke") or contains(., "さくら") or contains(., "すずき") or contains(., "和タのＣ")]',
    );
    console.log('Authors found:', [...new Set(authors)]);

    // Extract Japanese dates
    const japaneseDates = parser.extractMultiple(
      html,
      '//text()[contains(., "2016年") and contains(., "月") and contains(., "日")]',
    );
    console.log('Article dates (first 5):', japaneseDates.slice(0, 5));

    console.log('\n=== Tag and Category Analysis ===');

    // Extract tags
    const tags = parser.extractMultiple(
      html,
      '//text()[contains(., "N4-Pre-intermediate") or contains(., "N5-Beginner") or contains(., "N3-Intermediate") or contains(., "Listening")]',
    );
    console.log('Learning tags:', tags);

    // Extract country tags
    const countryTags = parser.extractMultiple(
      html,
      '//text()[contains(., "ベトナム") or contains(., "インドネシア") or contains(., "タイ") or contains(., "カナダ") or contains(., "アメリカ")]',
    );
    console.log('Country tags:', countryTags);

    console.log('\n=== Comment and Interaction Data ===');

    // Extract comment information
    const comments = parser.extractMultiple(
      html,
      '//text()[contains(., "に ") and contains(., "より")]',
    );
    console.log('Comment indicators (first 5):', comments.slice(0, 5));

    console.log('\n=== Advanced: Calendar and Popular Content ===');

    // Extract calendar information
    const calendarData = parser.extractMultiple(
      html,
      '//table//td/text() | //text()[contains(., "2025年")]',
    );
    console.log(
      'Calendar data found:',
      calendarData.filter((item) => item.trim()).slice(0, 10),
    );

    // Extract ranking numbers
    const rankings = parser.extractMultiple(
      html,
      '//text()[matches(., "^[1-7]$")]',
    );
    console.log('Article rankings:', rankings);

    console.log('\n=== Complete Article Structure Example ===');

    // Comprehensive article extraction with mixed selectors
    const comprehensiveSchema: ExtractionSchema = {
      japaneseTitle: {
        selector:
          '//text()[contains(., "そば") or contains(., "アイス") or contains(., "フェス")]',
        type: 'xpath',
      },
      englishTitle: {
        selector: 'text',
        type: 'css',
        transform: (value: string) => {
          const englishMatch = value.match(
            /([A-Za-z\s]+(?:sandwich|Festival|Noodles|ice|foods))/i,
          );
          return englishMatch ? englishMatch[1] : null;
        },
      },
      difficulty: {
        selector:
          '//text()[contains(., "n3") or contains(., "n4") or contains(., "n5")]',
        type: 'xpath',
        transform: (value: string) => {
          const match = value.match(/(n[3-5])/);
          return match ? match[1] : null;
        },
      },
      isPopular: {
        selector:
          '//text()[contains(., "1") or contains(., "2") or contains(., "3")]',
        type: 'xpath',
        transform: (value: string) => parseInt(value) <= 7,
      },
      hasEnglishTranslation: {
        selector: '//text()[contains(., "br") or contains(., "<br>")]',
        type: 'xpath',
        transform: (value: string) => value.includes('br'),
      },
    };

    const siteOverview = parser.extractStructured(html, comprehensiveSchema);
    console.log('Site overview analysis:', siteOverview);

    console.log('\n=== Educational Content Analysis ===');

    // Check for different learning elements
    const hasListening = parser.exists(
      html,
      '//text()[contains(., "リスニング") or contains(., "Listening")]',
    );
    const hasQuiz = parser.exists(
      html,
      '//text()[contains(., "クイズ") or contains(., "Quiz")]',
    );
    const hasAudio = parser.exists(
      html,
      '//text()[contains(., "audio") or contains(., "オーディオ")]',
    );

    console.log('Educational features:');
    console.log(`  Has listening exercises: ${hasListening}`);
    console.log(`  Has quizzes: ${hasQuiz}`);
    console.log(`  Has audio content: ${hasAudio}`);

    // Count different difficulty levels
    const n3Count = parser.count(html, '//text()[contains(., "n3")]');
    const n4Count = parser.count(html, '//text()[contains(., "n4")]');
    const n5Count = parser.count(html, '//text()[contains(., "n5")]');

    console.log('Content distribution by difficulty:');
    console.log(`  N3 (Intermediate): ${n3Count} items`);
    console.log(`  N4 (Pre-intermediate): ${n4Count} items`);
    console.log(`  N5 (Beginner): ${n5Count} items`);
  } catch (error) {
    console.error('Error demonstrating Watanoc parser:', error.message);
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateWatanocParser()
    .then(() => console.log('\nWatanoc.com parsing demo completed!'))
    .catch(console.error);
}

export { demonstrateWatanocParser };
