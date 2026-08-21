import React from 'react';

/**
 * Enhanced React.lazy wrapper that automatically handles dynamic import failures
 * caused by new app deployments, cache invalidation, or network glitches.
 * 
 * When a chunk fails to fetch (e.g. 404 because hash changed after deployment),
 * it triggers a window reload to fetch the latest index.html and fresh bundles.
 */
export const lazyWithRetry = (componentImport) =>
  React.lazy(async () => {
    const pageHasBeenReloaded = sessionStorage.getItem('fixiva_chunk_reload_attempted');

    try {
      const component = await componentImport();
      // Reset reload flag on successful chunk load
      sessionStorage.removeItem('fixiva_chunk_reload_attempted');
      return component;
    } catch (error) {
      const errorMessage = error?.message || '';
      const isChunkError =
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Importing a module script failed') ||
        error?.name === 'TypeError';

      if (isChunkError && !pageHasBeenReloaded) {
        sessionStorage.setItem('fixiva_chunk_reload_attempted', 'true');
        window.location.reload();
        // Return a pending promise while the page reloads
        return new Promise(() => {});
      }

      // If already reloaded or non-chunk error, rethrow so ErrorBoundary handles it
      throw error;
    }
  });
