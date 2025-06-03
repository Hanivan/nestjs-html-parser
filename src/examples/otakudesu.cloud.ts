import { HtmlParserService } from '../html-parser.service';
import { ExtractionSchema } from '../types';

/**
 * Otakudesu.cloud - Indonesian Anime Streaming Site Parser
 *
 * This example demonstrates parsing ongoing anime information from Otakudesu,
 * a popular Indonesian anime streaming website. We'll extract anime titles,
 * episode numbers, release dates, and other metadata from the ongoing anime section.
 *
 * Website: https://otakudesu.cloud/
 * Focus: On-going Anime section (div.venz > ul > li structure)
 */

interface OngoingAnime {
  title: string;
  cleanTitle: string;
  episode: number;
  releaseDay: string;
  releaseDate: string;
  link: string;
  imageUrl: string;
  hasSubIndo: boolean;
  status: 'ongoing';
}

interface OtakudesuStats {
  totalOngoingAnime: number;
  latestEpisodes: OngoingAnime[];
  releaseSchedule: {
    [day: string]: number;
  };
  popularTitles: string[];
  averageEpisode: number;
}

async function demonstrateOtakudesuParser(verbose = false): Promise<void> {
  const parser = new HtmlParserService();

  console.log('🎌 Otakudesu.cloud - Indonesian Anime Parser Demo');
  console.log('='.repeat(60));

  try {
    // Fetch the main page with random user agent for better success rate
    console.log('📡 Fetching Otakudesu homepage...');
    const response = await parser.fetchHtml('https://otakudesu.cloud/', {
      useRandomUserAgent: true,
      timeout: 15000,
      verbose,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    console.log(
      `✅ Successfully fetched page (${response.status} ${response.statusText})`,
    );
    console.log(`📊 Page size: ${response.data.length} characters`);
    console.log(`🌐 Content-Type: ${response.headers['content-type']}`);
    console.log();

    // Extract ongoing anime information using the exact structure from the website
    console.log('🔍 Extracting ongoing anime information...');

    // Schema for extracting individual anime entries from li elements
    const ongoingAnimeSchema: ExtractionSchema = {
      title: {
        selector: './/h2[@class="jdlflm"]/text()',
        type: 'xpath',
        transform: (title: string) => title.trim(),
      },
      link: {
        selector: './/a[@href]',
        type: 'xpath',
        attribute: 'href',
      },
      episode: {
        selector: './/div[@class="epz"]/text()',
        type: 'xpath',
        transform: (text: string) => {
          const match = text.match(/Episode\s+(\d+)/);
          return match ? parseInt(match[1]) : 0;
        },
      },
      releaseDay: {
        selector: './/div[@class="epztipe"]/text()',
        type: 'xpath',
        transform: (text: string) => text.trim(),
      },
      releaseDate: {
        selector: './/div[@class="newnime"]/text()',
        type: 'xpath',
        transform: (text: string) => text.trim(),
      },
      imageUrl: {
        selector: './/img',
        type: 'xpath',
        attribute: 'src',
      },
      imageAlt: {
        selector: './/img',
        type: 'xpath',
        attribute: 'alt',
      },
    };

    // Extract ongoing anime using the specific container structure
    const ongoingAnimeItems = parser.extractStructuredList(
      response.data,
      '//div[@class="venz"]//ul//li',
      ongoingAnimeSchema,
      'xpath',
      { verbose },
    );

    console.log(
      `🎯 Found ${ongoingAnimeItems.length} anime items in the ongoing section`,
    );

    // Process and clean the extracted data
    const processedAnime: OngoingAnime[] = ongoingAnimeItems
      .filter((item) => item.title && item.link && item.episode)
      .map((item) => {
        const cleanTitle = item.title.replace(/\s*Sub Indo\s*$/i, '').trim();
        const hasSubIndo =
          item.title.toLowerCase().includes('sub indo') ||
          (item.imageAlt && item.imageAlt.toLowerCase().includes('sub indo'));

        return {
          title: item.title,
          cleanTitle: cleanTitle,
          episode: item.episode || 0,
          releaseDay: item.releaseDay || 'Unknown',
          releaseDate: item.releaseDate || 'Unknown',
          link: item.link,
          imageUrl: item.imageUrl || '',
          hasSubIndo: hasSubIndo,
          status: 'ongoing' as const,
        };
      });

    // Display results
    console.log('📋 ONGOING ANIME EXTRACTION RESULTS');
    console.log('='.repeat(50));

    if (processedAnime.length > 0) {
      console.log(
        `✅ Successfully extracted ${processedAnime.length} ongoing anime`,
      );
      console.log();

      // Display first 10 anime with details
      console.log('🎯 Latest Ongoing Anime (Top 10):');
      console.log('-'.repeat(40));

      processedAnime.slice(0, 10).forEach((anime, index) => {
        console.log(`${index + 1}. ${anime.cleanTitle}`);
        console.log(`   📺 Episode: ${anime.episode}`);
        console.log(`   📅 Release: ${anime.releaseDay}, ${anime.releaseDate}`);
        console.log(`   🔗 Link: ${anime.link}`);
        console.log(`   🖼️  Image: ${anime.imageUrl}`);
        console.log(`   🌏 Sub Indonesia: ${anime.hasSubIndo ? '✅' : '❌'}`);
        console.log();
      });

      // Generate statistics
      const stats: OtakudesuStats = {
        totalOngoingAnime: processedAnime.length,
        latestEpisodes: processedAnime.slice(0, 5),
        releaseSchedule: {},
        popularTitles: processedAnime
          .filter((anime) => anime.episode > 5)
          .map((anime) => anime.cleanTitle)
          .slice(0, 5),
        averageEpisode: Math.round(
          processedAnime.reduce((sum, anime) => sum + anime.episode, 0) /
            processedAnime.length,
        ),
      };

      // Count release schedule by day
      processedAnime.forEach((anime) => {
        const day = anime.releaseDay;
        if (day && day !== 'Unknown') {
          stats.releaseSchedule[day] = (stats.releaseSchedule[day] || 0) + 1;
        }
      });

      console.log('📊 OTAKUDESU STATISTICS');
      console.log('='.repeat(40));
      console.log(`📈 Total Ongoing Anime: ${stats.totalOngoingAnime}`);
      console.log(`📊 Average Episode: ${stats.averageEpisode}`);
      console.log();

      console.log('📅 Release Schedule:');
      Object.entries(stats.releaseSchedule)
        .sort(([, a], [, b]) => b - a)
        .forEach(([day, count]) => {
          console.log(`   ${day}: ${count} anime`);
        });
      console.log();

      console.log('🔥 Popular Ongoing Titles (Episode > 5):');
      stats.popularTitles.forEach((title, index) => {
        console.log(`   ${index + 1}. ${title}`);
      });
      console.log();

      // Show anime by release day distribution
      console.log('📊 Anime Distribution by Release Day:');
      const dayOrder = [
        'Senin',
        'Selasa',
        'Rabu',
        'Kamis',
        'Jumat',
        'Sabtu',
        'Minggu',
      ];
      dayOrder.forEach((day) => {
        const count = stats.releaseSchedule[day] || 0;
        if (count > 0) {
          const animeList = processedAnime
            .filter((anime) => anime.releaseDay === day)
            .map((anime) => anime.cleanTitle)
            .slice(0, 3);
          console.log(
            `   ${day}: ${count} anime - ${animeList.join(', ')}${animeList.length < count ? '...' : ''}`,
          );
        }
      });

      // Show highest episode numbers
      console.log('\n🏆 Anime with Highest Episodes:');
      const sortedByEpisode = processedAnime
        .sort((a, b) => b.episode - a.episode)
        .slice(0, 5);

      sortedByEpisode.forEach((anime, index) => {
        console.log(
          `   ${index + 1}. ${anime.cleanTitle} - Episode ${anime.episode}`,
        );
      });
    } else {
      console.log('⚠️  No ongoing anime found. Possible reasons:');
      console.log('   - Website structure has changed');
      console.log('   - Content is loaded dynamically');
      console.log('   - Network or access issues');
      console.log();

      // Debug information - check for the container elements
      const venzContainer = parser.exists(
        response.data,
        '//div[@class="venz"]',
        'xpath',
        { verbose },
      );
      const ulElements = parser.count(
        response.data,
        '//div[@class="venz"]//ul',
        'xpath',
        { verbose },
      );
      const liElements = parser.count(
        response.data,
        '//div[@class="venz"]//ul//li',
        'xpath',
        { verbose },
      );
      const detpostElements = parser.count(
        response.data,
        '//div[@class="detpost"]',
        'xpath',
        { verbose },
      );

      console.log('🔧 DEBUG INFORMATION');
      console.log(`   Venz container found: ${venzContainer ? '✅' : '❌'}`);
      console.log(`   UL elements found: ${ulElements}`);
      console.log(`   LI elements found: ${liElements}`);
      console.log(`   Detpost elements found: ${detpostElements}`);

      // Try to find any anime-related content
      const anyAnimeLinks = parser.extractMultiple(
        response.data,
        '//a[contains(@href, "anime")]',
        'xpath',
        'href',
        { verbose },
      );

      const anyAnimeTitles = parser.extractMultiple(
        response.data,
        '//h2[@class="jdlflm"]/text()',
        'xpath',
        undefined,
        { verbose },
      );

      console.log(`   Any anime links found: ${anyAnimeLinks.length}`);
      console.log(`   Any anime titles found: ${anyAnimeTitles.length}`);

      if (anyAnimeTitles.length > 0) {
        console.log('\n   Sample titles found:');
        anyAnimeTitles.slice(0, 3).forEach((title, i) => {
          console.log(`   ${i + 1}. ${title}`);
        });
      }
    }

    // Demonstrate advanced parsing techniques
    console.log('\n🔬 ADVANCED PARSING TECHNIQUES');
    console.log('='.repeat(50));

    // Check for specific anime genres or types in titles
    const actionAnime = processedAnime.filter(
      (anime) =>
        anime.cleanTitle.toLowerCase().includes('action') ||
        anime.cleanTitle.toLowerCase().includes('battle') ||
        anime.cleanTitle.toLowerCase().includes('hero'),
    ).length;

    const schoolAnime = processedAnime.filter(
      (anime) =>
        anime.cleanTitle.toLowerCase().includes('school') ||
        anime.cleanTitle.toLowerCase().includes('academia'),
    ).length;

    const fantasyAnime = processedAnime.filter(
      (anime) =>
        anime.cleanTitle.toLowerCase().includes('magic') ||
        anime.cleanTitle.toLowerCase().includes('witch') ||
        anime.cleanTitle.toLowerCase().includes('fantasy'),
    ).length;

    console.log('🎭 Anime Categories Detection:');
    console.log(`   Action/Hero: ${actionAnime} anime`);
    console.log(`   School/Academia: ${schoolAnime} anime`);
    console.log(`   Magic/Fantasy: ${fantasyAnime} anime`);

    // Extract page metadata
    const pageTitle = parser.extractSingle(
      response.data,
      '//title/text()',
      'xpath',
      undefined,
      { verbose },
    );
    const metaDescription = parser.extractSingle(
      response.data,
      '//meta[@name="description"]',
      'xpath',
      'content',
      { verbose },
    );

    console.log('\n📄 Page Metadata:');
    console.log(`   Title: ${pageTitle || 'Not found'}`);
    console.log(`   Description: ${metaDescription || 'Not found'}`);

    // Check for responsive design elements
    const hasViewport = parser.exists(
      response.data,
      '//meta[@name="viewport"]',
      'xpath',
      { verbose },
    );

    const hasBootstrap = parser.exists(
      response.data,
      '//*[contains(@href, "bootstrap") or contains(@src, "bootstrap")]',
      'xpath',
      { verbose },
    );

    console.log('\n📱 Technical Features:');
    console.log(`   Responsive Design: ${hasViewport ? '✅' : '❌'}`);
    console.log(`   Bootstrap Framework: ${hasBootstrap ? '✅' : '❌'}`);

    // Additional technical analysis
    const hasJQuery = parser.exists(
      response.data,
      '//*[contains(@src, "jquery")]',
      'xpath',
      { verbose },
    );

    const totalImages = parser.count(response.data, '//img', 'xpath', {
      verbose,
    });
    const lazyLoadImages = parser.count(
      response.data,
      '//img[@loading="lazy"]',
      'xpath',
      { verbose },
    );

    console.log(`   jQuery: ${hasJQuery ? '✅' : '❌'}`);
    console.log(`   Total Images: ${totalImages}`);
    console.log(`   Lazy Loading Images: ${lazyLoadImages}`);
  } catch (error) {
    console.error('❌ Error parsing Otakudesu:');
    console.error(
      `   ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    console.log('\n💡 Troubleshooting tips:');
    console.log('   - Check if website is accessible');
    console.log('   - Try using different user agents');
    console.log('   - Website might have anti-scraping measures');
    console.log('   - Consider using proxy if blocked');
    console.log('   - Check if the HTML structure has changed');
    console.log(
      '   - Use verbose mode for detailed error output: demonstrateOtakudesuParser(true)',
    );
  }
}

// Export for use in other modules
export { demonstrateOtakudesuParser, OngoingAnime, OtakudesuStats };

// Run the demonstration if this file is executed directly
if (require.main === module) {
  // Check for verbose flag in command line arguments
  const verbose =
    process.argv.includes('--verbose') || process.argv.includes('-v');

  demonstrateOtakudesuParser(verbose)
    .then(() => console.log('\n🎌 Otakudesu parsing demo completed!'))
    .catch(console.error);
}
