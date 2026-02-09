#!/usr/bin/env node

/**
 * Script to update deep link host in app.config.ts based on installationUrl from AsyncStorage
 * This script reads the installationUrl from AsyncStorage and updates the EXPO_PUBLIC_DEEP_LINK_HOST
 * environment variable, which is then used by app.config.ts
 *
 * Usage: node scripts/update-deep-link-host.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to AsyncStorage data (this is a simplified approach)
// In a real scenario, you'd need to read from the actual AsyncStorage location
const getInstallationUrlFromStorage = () => {
  try {
    // Try to read from a cached file if it exists
    const cacheFile = path.join(__dirname, '../.installation-url-cache');
    if (fs.existsSync(cacheFile)) {
      const cached = fs.readFileSync(cacheFile, 'utf8').trim();
      if (cached) {
        return cached;
      }
    }
  } catch (error) {
    console.warn('Could not read cached installation URL:', error.message);
  }
  return null;
};

const extractHostFromUrl = (url) => {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL parsing fails, try to extract host manually
    const cleaned = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return cleaned.split('/')[0] || null;
  }
};

const main = () => {
  const installationUrl = getInstallationUrlFromStorage();
  
  if (!installationUrl) {
    console.log('No installation URL found in cache. Using default or environment variable.');
    console.log('To set the deep link host, run:');
    console.log('  EXPO_PUBLIC_DEEP_LINK_HOST=your-host.com npx expo prebuild');
    return;
  }

  const host = extractHostFromUrl(installationUrl);
  
  if (!host) {
    console.error('Could not extract host from installation URL:', installationUrl);
    return;
  }

  console.log(`Found installation URL: ${installationUrl}`);
  console.log(`Extracted host: ${host}`);
  console.log(`Setting EXPO_PUBLIC_DEEP_LINK_HOST=${host}`);
  
  // Set environment variable for current process
  process.env.EXPO_PUBLIC_DEEP_LINK_HOST = host;
  
  console.log('\nTo use this host in your build, run:');
  console.log(`  EXPO_PUBLIC_DEEP_LINK_HOST=${host} npx expo prebuild`);
  console.log('Or add it to your .env file:');
  console.log(`  EXPO_PUBLIC_DEEP_LINK_HOST=${host}`);
};

main();
