# ⚠️ Package Deprecation Notice

**Date:** January 16, 2026
**Status:** ARCHIVED - NO LONGER MAINTAINED

## Summary

This package (`@hanivanrizky/nestjs-html-parser`) has been **archived** and is no longer maintained. All development has moved to the new package:

**📦 New Package:** [@hanivanrizky/nestjs-xpath-parser](https://github.com/Hanivan/nestjs-xpath-parser)

## Why the Change?

The old package name was confusing and didn't accurately reflect the package's primary purpose. The new name better describes the package's focus on **XPath-based HTML parsing**.

## Migration Guide

### Step 1: Uninstall Old Package

```bash
npm uninstall @hanivanrizky/nestjs-html-parser
```

### Step 2: Install New Package

```bash
npm install @hanivanrizky/nestjs-xpath-parser
```

### Step 3: Update Imports

**Old Import:**
```typescript
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-html-parser';
```

**New Import:**
```typescript
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';
```

### Step 4: Update Code (If Needed)

The API is largely the same, but here are some things to check:

1. **Module imports** - Update to new package name
2. **Configuration** - Most configuration options remain the same
3. **Patterns** - XPath patterns work identically

## What's New in the New Package?

The new package includes several improvements:

- ✅ **Better package naming** - More accurately describes the XPath focus
- ✅ **Enhanced documentation** - Comprehensive guides and examples
- ✅ **Improved type definitions** - Better TypeScript support
- ✅ **Custom pipes system** - Extensible data transformation
- ✅ **Active maintenance** - Regular updates and bug fixes
- ✅ **Better testing** - More comprehensive test coverage
- ✅ **Migration guides** - Clear documentation for upgrading

## Breaking Changes

There are **no breaking changes** in the API itself. You can safely switch to the new package by updating imports and configuration.

## Timeline

- **January 16, 2026** - Package archived
- **January 16, 2026** - New package released: `@hanivanrizky/nestjs-xpath-parser`
- **Effective immediately** - No further updates will be made to this package

## Questions?

If you have questions about migrating, please:

1. Check the [new package documentation](https://github.com/Hanivan/nestjs-xpath-parser)
2. Open an issue on the [new repository](https://github.com/Hanivan/nestjs-xpath-parser/issues)
3. Contact: [hanivan20@gmail.com](mailto:hanivan20@gmail.com)

## Archived Features

The following features are available in the new package:

- ✅ XPath-based HTML parsing
- ✅ CSS selector support (secondary)
- ✅ Proxy configuration
- ✅ Random user agent rotation
- ✅ Multiple extraction methods
- ✅ Error handling and retries
- ✅ Type-safe TypeScript definitions

All features from this package are available in the new package with improvements!

---

**Thank you for using this package!** We hope you'll enjoy the improved experience with the new package.

🚀 **Migrate today:** `npm install @hanivanrizky/nestjs-xpath-parser`
