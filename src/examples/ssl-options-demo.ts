import { HtmlParserService } from '../html-parser.service';

/**
 * SSL Options Demonstration
 *
 * This example demonstrates the independent SSL/TLS configuration options
 * available in the HTML Parser Service for handling various SSL scenarios.
 *
 * Key Point: disableServerIdentityCheck is INDEPENDENT of ignoreSSLErrors
 * and only controls hostname validation.
 */

async function demonstrateSSLOptions(verbose: boolean): Promise<void> {
  const parser = new HtmlParserService();

  console.log('🔒 SSL Options Demonstration - Independent Controls');
  console.log('='.repeat(60));

  // Test 1: Default SSL (strict validation)
  console.log('\n1. Default SSL Configuration (Strict)');
  console.log('   - Validates certificates and server identity');
  console.log('   - Use for trusted, properly configured sites');
  try {
    const response = await parser.fetchHtml('https://httpbin.org/get', {
      timeout: 5000,
      verbose,
    });
    console.log(`   ✅ Success: ${response.status}`);
  } catch (error) {
    console.log(
      `   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Test 2: Disable only certificate validation
  console.log('\n2. Reject Unauthorized = false');
  console.log('   - Accepts self-signed or invalid certificates');
  console.log('   - Still validates server identity/hostname');
  try {
    const response = await parser.fetchHtml('https://self-signed.badssl.com/', {
      rejectUnauthorized: false,
      timeout: 5000,
      verbose,
    });
    console.log(`   ✅ Success: ${response.status}`);
  } catch (error) {
    console.log(
      `   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Test 3: Disable only server identity check (independent option)
  console.log('\n3. Disable Server Identity Check (Independent)');
  console.log('   - Validates certificates but ignores hostname mismatches');
  console.log('   - INDEPENDENT of ignoreSSLErrors - works on its own');
  console.log('   - Useful for sites with certificate/hostname issues');
  try {
    const response = await parser.fetchHtml('https://httpbin.org/get', {
      disableServerIdentityCheck: true, // Independent option
      timeout: 5000,
      verbose,
    });
    console.log(
      `   ✅ Success: ${response.status} (hostname validation bypassed independently)`,
    );
  } catch (error) {
    console.log(
      `   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Test 4: Ignore all SSL errors (most permissive)
  console.log('\n4. Ignore All SSL Errors');
  console.log('   - Disables all SSL/TLS validation');
  console.log(
    '   - Use with extreme caution, only for testing or known safe sites',
  );
  try {
    const response = await parser.fetchHtml('https://httpbin.org/get', {
      ignoreSSLErrors: true,
      timeout: 5000,
      verbose,
    });
    console.log(`   ✅ Success: ${response.status}`);
  } catch (error) {
    console.log(
      `   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Test 5: Independence demonstration - ignoreSSLErrors with disableServerIdentityCheck: false
  console.log(
    '\n5. Independence Test: ignoreSSLErrors + disableServerIdentityCheck: false',
  );
  console.log('   - Shows that disableServerIdentityCheck works INDEPENDENTLY');
  console.log(
    '   - ignoreSSLErrors: true, but hostname validation still enforced',
  );
  console.log('   - Proves the two options are completely separate');
  try {
    const response = await parser.fetchHtml('https://httpbin.org/get', {
      ignoreSSLErrors: true,
      disableServerIdentityCheck: false, // Independent control - hostname validation still works
      timeout: 5000,
      verbose,
    });
    console.log(
      `   ✅ Success: ${response.status} (SSL ignored but hostname check still enforced)`,
    );
  } catch (error) {
    console.log(
      `   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  // Test 6: Combined options for maximum compatibility
  console.log('\n6. Maximum Compatibility Configuration');
  console.log(
    '   - Combines multiple independent options for problematic sites',
  );
  console.log('   - Example: https://otakudesu.cloud/');
  try {
    const response = await parser.fetchHtml('https://otakudesu.cloud/', {
      rejectUnauthorized: false, // Accept invalid certificates
      disableServerIdentityCheck: true, // Skip hostname validation (independent)
      ignoreSSLErrors: true, // Disable all SSL validation
      timeout: 10000,
      retries: 2,
      retryOnErrors: {
        ssl: true,
        timeout: true,
        dns: true,
      },
      verbose, // Keep verbose false for this test to avoid too much output
    });
    console.log(
      `   ✅ Success: ${response.status} - Page size: ${response.data.length} characters`,
    );
  } catch (error) {
    console.log(
      `   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  console.log('\n🔒 SSL Options Summary (Independent Controls):');
  console.log('   • Default: Full SSL validation (most secure)');
  console.log('   • rejectUnauthorized: false - Accept invalid certificates');
  console.log(
    '   • disableServerIdentityCheck: true - Skip hostname validation (INDEPENDENT)',
  );
  console.log(
    '   • ignoreSSLErrors: true - Disable all SSL validation (least secure)',
  );
  console.log('\n🔑 Key Independence Points:');
  console.log(
    '   • disableServerIdentityCheck works independently of ignoreSSLErrors',
  );
  console.log(
    '   • You can use ignoreSSLErrors: true + disableServerIdentityCheck: false',
  );
  console.log('   • Each option controls a specific aspect of SSL validation');
  console.log(
    '   • Mix and match as needed for your specific SSL requirements',
  );
  console.log('\n💡 Use the minimal SSL relaxation needed for your use case!');
}

// Export for use in other modules
export { demonstrateSSLOptions };

// Run the demonstration if this file is executed directly
if (require.main === module) {
  // Check for verbose flag in command line arguments
  const verbose =
    process.argv.includes('--verbose') || process.argv.includes('-v');

  demonstrateSSLOptions(verbose)
    .then(() =>
      console.log('\n🔒 SSL options independence demonstration completed!'),
    )
    .catch(console.error);
}
