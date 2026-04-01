// ============================================================================
// Web Search Tool — Search the internet for information
// Uses DuckDuckGo Instant Answer API (free, no API key needed)
// ============================================================================

import { ToolHandler } from '../types';
import toolRegistry from './registry';

const webSearchTool: ToolHandler = {
  name: 'web_search',
  description: 'Search the internet for current information, news, facts, research, documentation, or any topic. Returns relevant search results with titles, URLs, and snippets. Use this when you need up-to-date information or need to research a topic.',
  category: 'research',
  icon: 'Search',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to look up on the internet',
      },
      num_results: {
        type: 'string',
        description: 'Number of results to return (default: 5, max: 10)',
        default: '5',
      },
    },
    required: ['query'],
  },
  execute: async (args) => {
    const query = args.query as string;
    const numResults = Math.min(parseInt(args.num_results as string || '5'), 10);

    try {
      // Use DuckDuckGo HTML search (free, no API key)
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'Kaelus-Agent/1.0 (Enterprise AI Platform)',
          },
        }
      );

      if (!response.ok) {
        // Fallback: use DuckDuckGo Instant Answer API
        const apiResponse = await fetch(
          `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
        );
        const data = await apiResponse.json();

        const results: string[] = [];
        if (data.Abstract) {
          results.push(` ${data.AbstractSource}: ${data.Abstract}`);
          if (data.AbstractURL) results.push(`   URL: ${data.AbstractURL}`);
        }
        if (data.RelatedTopics) {
          for (const topic of data.RelatedTopics.slice(0, numResults)) {
            if (topic.Text) {
              results.push(`• ${topic.Text}`);
              if (topic.FirstURL) results.push(`  URL: ${topic.FirstURL}`);
            }
          }
        }

        if (results.length === 0) {
          results.push(`No instant results found for "${query}". Try rephrasing the query or using web_browse to visit a specific URL.`);
        }

        return {
          success: true,
          result: `Search results for "${query}":\n\n${results.join('\n')}`,
          metadata: { source: 'duckduckgo', resultCount: results.length },
        };
      }

      // Parse HTML results
      const html = await response.text();
      const results: string[] = [];
      const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

      let linkMatch;
      const links: Array<{ url: string; title: string }> = [];
      while ((linkMatch = linkRegex.exec(html)) !== null && links.length < numResults) {
        const url = linkMatch[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&')[0];
        const title = linkMatch[2].replace(/<[^>]*>/g, '').trim();
        links.push({ url: decodeURIComponent(url), title });
      }

      let snippetMatch;
      const snippets: string[] = [];
      while ((snippetMatch = snippetRegex.exec(html)) !== null) {
        snippets.push(snippetMatch[1].replace(/<[^>]*>/g, '').trim());
      }

      for (let i = 0; i < links.length; i++) {
        results.push(`${i + 1}. **${links[i].title}**`);
        if (snippets[i]) results.push(`   ${snippets[i]}`);
        results.push(`   URL: ${links[i].url}`);
        results.push('');
      }

      if (results.length === 0) {
        // Fallback to instant answer API
        const apiResponse = await fetch(
          `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
        );
        const data = await apiResponse.json();
        if (data.Abstract) {
          results.push(` ${data.Abstract}`);
          if (data.AbstractURL) results.push(`URL: ${data.AbstractURL}`);
        }
        if (data.RelatedTopics) {
          for (const topic of data.RelatedTopics.slice(0, numResults)) {
            if (topic.Text) results.push(`• ${topic.Text}`);
          }
        }
      }

      return {
        success: results.length > 0,
        result: results.length > 0
          ? `Search results for "${query}":\n\n${results.join('\n')}`
          : `No results found for "${query}". Try a different query or use web_browse to visit a specific URL directly.`,
        metadata: { source: 'duckduckgo', resultCount: links.length },
      };
    } catch (error) {
      return {
        success: false,
        result: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Try rephrasing your query.`,
        metadata: { source: 'duckduckgo' },
      };
    }
  },
};

toolRegistry.register(webSearchTool);
export default webSearchTool;
