import type { Database } from '@locker/database';
import { dispatchSearch } from './runtime';
// Ensure built-in handlers are registered
import './handlers';

/**
 * Re-rank search results using active search-capable plugins.
 *
 * This is the public API consumed by the files router. It delegates
 * to the plugin runtime which resolves handlers and dispatches to them.
 */
export async function enhanceSearchResultsWithPlugins<
  T extends { id: string; name: string; updatedAt: Date },
>(params: {
  db: Database;
  workspaceId: string;
  query: string;
  results: T[];
}): Promise<T[]> {
  return dispatchSearch(params);
}
