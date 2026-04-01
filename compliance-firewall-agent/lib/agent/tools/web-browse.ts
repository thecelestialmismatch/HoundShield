// ============================================================================
// Web Browse Tool — Fetch and extract content from any URL
// ============================================================================

import { ToolHandler } from '../types';
import toolRegistry from './registry';

const webBrowseTool: ToolHandler = {
  name: 'web_browse',
  description: 'Fetch and read the content of any webpage URL. Extracts the main text content, removing HTML tags and scripts. Use this to read articles, documentation, blog posts, or any web page when you have a specific URL.',
  category: 'research',
  icon: 'Globe',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The full URL of the webpage to read (e.g., https://example.com/article)',
      },
      max_length: {
        type: 'string',
        description: 'Maximum characters to extract (default: 8000)',
        default: '8000',
      },
    },
    required: ['url'],
  },
  execute: async (args) => {
    let url = args.url as string;
    const maxLength = parseInt(args.max_length as string || '8000');

    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Kaelus-Agent/1.0 (Enterprise AI Platform)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          success: false,
          result: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}`,
          metadata: { url, statusCode: response.status },
        };
      }

      const contentType = response.headers.get('content-type') || '';

      // Handle JSON responses
      if (contentType.includes('application/json')) {
        const json = await response.json();
        const text = JSON.stringify(json, null, 2);
        return {
          success: true,
          result: `JSON content from ${url}:\n\n\`\`\`json\n${text.slice(0, maxLength)}\n\`\`\``,
          metadata: { url, contentType: 'json', length: text.length },
        };
      }

      // Handle plain text
      if (contentType.includes('text/plain')) {
        const text = await response.text();
        return {
          success: true,
          result: `Text content from ${url}:\n\n${text.slice(0, maxLength)}`,
          metadata: { url, contentType: 'text', length: text.length },
        };
      }

      // Handle HTML
      const html = await response.text();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

      // Remove scripts, styles, and other non-content elements
      let text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<svg[\s\S]*?<\/svg>/gi, '')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

      // Convert common HTML to readable text
      text = text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<h[1-6][^>]*>/gi, '\n## ')
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/  +/g, ' ')
        .trim();

      // Extract meta description
      const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
      const metaDescription = metaMatch ? metaMatch[1] : '';

      const result = [
        ` **${title}**`,
        ` ${url}`,
        metaDescription ? ` ${metaDescription}` : '',
        '',
        '---',
        '',
        text.slice(0, maxLength),
        text.length > maxLength ? `\n\n... [Truncated - showing ${maxLength} of ${text.length} characters]` : '',
      ].filter(Boolean).join('\n');

      return {
        success: true,
        result,
        metadata: { url, title, contentType: 'html', length: text.length },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('abort')) {
        return {
          success: false,
          result: `Request to ${url} timed out after 15 seconds. The page may be slow or unavailable.`,
          metadata: { url },
        };
      }
      return {
        success: false,
        result: `Failed to browse ${url}: ${message}`,
        metadata: { url },
      };
    }
  },
};

toolRegistry.register(webBrowseTool);
export default webBrowseTool;
