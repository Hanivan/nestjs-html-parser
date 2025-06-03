import { ExtractionSchema, HtmlParserService } from '../';

/**
 * TypeScript Generic Types Example
 *
 * This example demonstrates the new generic type support in the HTML parser,
 * providing complete type safety for all extraction operations.
 */

// Define typed interfaces for different content types
interface BlogPost {
  title: string;
  author: string;
  publishDate: Date;
  content: string;
  tags: string[];
  viewCount: number;
  isPublished: boolean;
}

interface Product {
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  images: string[];
  category: string;
}

interface UserProfile {
  username: string;
  email: string;
  joinDate: Date;
  postCount: number;
  reputation: number;
  badges: string[];
  isVerified: boolean;
}

async function demonstrateTypedExtraction(verbose = false): Promise<void> {
  const parser = new HtmlParserService();

  console.log('🎯 TypeScript Generic Types Demo');
  console.log('='.repeat(50));

  // Sample HTML content for demonstration
  const blogHtml = `
    <article class="blog-post">
      <h1>Advanced TypeScript Patterns</h1>
      <div class="meta">
        <span class="author">John Doe</span>
        <time datetime="2024-01-15T10:30:00Z">January 15, 2024</time>
        <span class="views" data-count="1250">1,250 views</span>
        <span class="status" data-published="true">Published</span>
      </div>
      <div class="content">
        <p>This article explores advanced TypeScript patterns for better type safety...</p>
      </div>
      <div class="tags">
        <span class="tag">typescript</span>
        <span class="tag">programming</span>
        <span class="tag">javascript</span>
      </div>
    </article>
  `;

  const productHtml = `
    <div class="product">
      <h2>Wireless Headphones</h2>
      <div class="price">$199.99</div>
      <div class="rating" data-score="4.5">★★★★☆</div>
      <div class="reviews" data-count="128">128 reviews</div>
      <div class="stock" data-available="true">In Stock</div>
      <div class="images">
        <img src="/img1.jpg" alt="Product 1">
        <img src="/img2.jpg" alt="Product 2">
        <img src="/img3.jpg" alt="Product 3">
      </div>
      <div class="category">Electronics</div>
    </div>
  `;

  console.log('\n🔍 SINGLE VALUE EXTRACTION WITH TYPE SAFETY');
  console.log('='.repeat(55));

  // Extract single values with type transformation
  const title = parser.extractSingle<string>(
    blogHtml,
    '//h1/text()',
    'xpath',
    undefined,
    { verbose },
  );

  const viewCount = parser.extractSingle<number>(
    blogHtml,
    '//span[@class="views"]',
    'xpath',
    'data-count',
    {
      transform: (value: string) => parseInt(value),
      verbose,
    },
  );

  const publishDate = parser.extractSingle<Date>(
    blogHtml,
    '//time',
    'xpath',
    'datetime',
    {
      transform: (value: string) => new Date(value),
      verbose,
    },
  );

  const isPublished = parser.extractSingle<boolean>(
    blogHtml,
    '//span[@class="status"]',
    'xpath',
    'data-published',
    {
      transform: (value: string) => value === 'true',
      verbose,
    },
  );

  console.log(`📄 Title: ${title} (type: ${typeof title})`);
  console.log(`👀 View Count: ${viewCount} (type: ${typeof viewCount})`);
  console.log(
    `📅 Publish Date: ${publishDate?.toISOString()} (type: ${typeof publishDate})`,
  );
  console.log(`✅ Is Published: ${isPublished} (type: ${typeof isPublished})`);

  console.log('\n📚 MULTIPLE VALUE EXTRACTION WITH TYPE SAFETY');
  console.log('='.repeat(55));

  // Extract multiple values with type transformation
  const tags = parser.extractMultiple<string>(
    blogHtml,
    '//span[@class="tag"]/text()',
    'xpath',
    undefined,
    { verbose },
  );

  const imageUrls = parser.extractMultiple<string>(
    productHtml,
    '//img',
    'xpath',
    'src',
    { verbose },
  );

  const productPrices = parser.extractMultiple<number>(
    productHtml,
    '//div[@class="price"]/text()',
    'xpath',
    undefined,
    {
      transform: (value: string) => parseFloat(value.replace('$', '')),
      verbose,
    },
  );

  console.log(`🏷️  Tags: ${JSON.stringify(tags)} (Array<${typeof tags[0]}>)`);
  console.log(
    `🖼️  Image URLs: ${JSON.stringify(imageUrls)} (Array<${typeof imageUrls[0]}>)`,
  );
  console.log(
    `💰 Prices: ${JSON.stringify(productPrices)} (Array<${typeof productPrices[0]}>)`,
  );

  console.log('\n📊 STRUCTURED EXTRACTION WITH FULL TYPE SAFETY');
  console.log('='.repeat(55));

  // Define typed schema for blog post
  const blogSchema: ExtractionSchema<BlogPost> = {
    title: {
      selector: '//h1/text()',
      type: 'xpath',
    },
    author: {
      selector: '//span[@class="author"]/text()',
      type: 'xpath',
    },
    publishDate: {
      selector: '//time',
      type: 'xpath',
      attribute: 'datetime',
      transform: (value: string) => new Date(value),
    },
    content: {
      selector: '//div[@class="content"]/p/text()',
      type: 'xpath',
    },
    tags: {
      selector: '//span[@class="tag"]/text()',
      type: 'xpath',
      transform: (value: string) => value.split(',').map((tag) => tag.trim()),
    },
    viewCount: {
      selector: '//span[@class="views"]',
      type: 'xpath',
      attribute: 'data-count',
      transform: (value: string) => parseInt(value),
    },
    isPublished: {
      selector: '//span[@class="status"]',
      type: 'xpath',
      attribute: 'data-published',
      transform: (value: string) => value === 'true',
    },
  };

  // Extract with full type safety
  const blogPost = parser.extractStructured<BlogPost>(blogHtml, blogSchema, {
    verbose,
  });

  console.log('📝 Blog Post (fully typed):');
  console.log(`   Title: ${blogPost.title}`);
  console.log(`   Author: ${blogPost.author}`);
  console.log(`   Published: ${blogPost.publishDate?.toDateString()}`);
  console.log(`   Content: ${blogPost.content?.substring(0, 50)}...`);
  console.log(`   View Count: ${blogPost.viewCount}`);
  console.log(`   Is Published: ${blogPost.isPublished}`);

  // Define typed schema for product
  const productSchema: ExtractionSchema<Product> = {
    name: {
      selector: '//h2/text()',
      type: 'xpath',
    },
    price: {
      selector: '//div[@class="price"]/text()',
      type: 'xpath',
      transform: (value: string) => parseFloat(value.replace('$', '')),
    },
    rating: {
      selector: '//div[@class="rating"]',
      type: 'xpath',
      attribute: 'data-score',
      transform: (value: string) => parseFloat(value),
    },
    reviewCount: {
      selector: '//div[@class="reviews"]',
      type: 'xpath',
      attribute: 'data-count',
      transform: (value: string) => parseInt(value),
    },
    inStock: {
      selector: '//div[@class="stock"]',
      type: 'xpath',
      attribute: 'data-available',
      transform: (value: string) => value === 'true',
    },
    images: {
      selector: '//div[@class="images"]//img',
      type: 'xpath',
      attribute: 'src',
      transform: (value: string) => value.split(',').map((url) => url.trim()),
    },
    category: {
      selector: '//div[@class="category"]/text()',
      type: 'xpath',
    },
  };

  const product = parser.extractStructured<Product>(
    productHtml,
    productSchema,
    { verbose },
  );

  console.log('\n🛍️  Product (fully typed):');
  console.log(`   Name: ${product.name}`);
  console.log(`   Price: $${product.price}`);
  console.log(`   Rating: ${product.rating}/5`);
  console.log(`   Reviews: ${product.reviewCount}`);
  console.log(`   In Stock: ${product.inStock}`);
  console.log(`   Category: ${product.category}`);
  console.log(`   Images: ${product.images?.length || 0} images`);

  console.log('\n📋 LIST EXTRACTION WITH FULL TYPE SAFETY');
  console.log('='.repeat(50));

  // Sample HTML for multiple products
  const catalogHtml = `
    <div class="catalog">
      <div class="product">
        <h2>Wireless Mouse</h2>
        <div class="price">$29.99</div>
        <div class="rating" data-score="4.2">★★★★☆</div>
        <div class="reviews" data-count="89">89 reviews</div>
        <div class="stock" data-available="true">In Stock</div>
        <div class="category">Electronics</div>
      </div>
      <div class="product">
        <h2>Mechanical Keyboard</h2>
        <div class="price">$129.99</div>
        <div class="rating" data-score="4.7">★★★★★</div>
        <div class="reviews" data-count="156">156 reviews</div>
        <div class="stock" data-available="false">Out of Stock</div>
        <div class="category">Electronics</div>
      </div>
      <div class="product">
        <h2>USB-C Hub</h2>
        <div class="price">$49.99</div>
        <div class="rating" data-score="4.0">★★★★☆</div>
        <div class="reviews" data-count="67">67 reviews</div>
        <div class="stock" data-available="true">In Stock</div>
        <div class="category">Accessories</div>
      </div>
    </div>
  `;

  // Extract list with full type safety
  const products = parser.extractStructuredList<Product>(
    catalogHtml,
    '//div[@class="product"]',
    productSchema,
    'xpath',
    { verbose },
  );

  console.log(`🛒 Product Catalog (${products.length} items):`);
  products.forEach((product, index) => {
    console.log(`\n   ${index + 1}. ${product.name}`);
    console.log(`      💰 Price: $${product.price}`);
    console.log(
      `      ⭐ Rating: ${product.rating}/5 (${product.reviewCount} reviews)`,
    );
    console.log(
      `      📦 Stock: ${product.inStock ? 'Available' : 'Out of Stock'}`,
    );
    console.log(`      🏷️  Category: ${product.category}`);
  });

  console.log('\n📈 TYPE-SAFE ANALYTICS');
  console.log('='.repeat(30));

  // Perform type-safe analytics
  const totalProducts = products.length;
  const averagePrice =
    products.reduce((sum, p) => sum + p.price, 0) / totalProducts;
  const averageRating =
    products.reduce((sum, p) => sum + p.rating, 0) / totalProducts;
  const inStockCount = products.filter((p) => p.inStock).length;
  const totalReviews = products.reduce((sum, p) => sum + p.reviewCount, 0);
  const categoryDistribution = products.reduce(
    (acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log(`📊 Total Products: ${totalProducts}`);
  console.log(`💰 Average Price: $${averagePrice.toFixed(2)}`);
  console.log(`⭐ Average Rating: ${averageRating.toFixed(1)}/5`);
  console.log(
    `📦 In Stock: ${inStockCount}/${totalProducts} (${Math.round((inStockCount / totalProducts) * 100)}%)`,
  );
  console.log(`💬 Total Reviews: ${totalReviews}`);
  console.log(
    `🏷️  Categories: ${Object.entries(categoryDistribution)
      .map(([cat, count]) => `${cat} (${count})`)
      .join(', ')}`,
  );

  console.log('\n✨ TYPE SAFETY BENEFITS');
  console.log('='.repeat(35));
  console.log('✅ Compile-time type checking');
  console.log('✅ IntelliSense autocompletion');
  console.log('✅ Transformation function type safety');
  console.log('✅ Schema validation at compile time');
  console.log('✅ Runtime type transformations');
  console.log('✅ Reduced runtime type errors');
}

// Export for use in other modules
export { BlogPost, demonstrateTypedExtraction, Product, UserProfile };

// Run the demonstration if this file is executed directly
if (require.main === module) {
  // Check for verbose flag in command line arguments
  const verbose =
    process.argv.includes('--verbose') || process.argv.includes('-v');

  demonstrateTypedExtraction(verbose)
    .then(() => console.log('\n🎯 TypeScript generic types demo completed!'))
    .catch(console.error);
}
