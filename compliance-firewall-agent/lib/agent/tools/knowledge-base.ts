// ============================================================================
// Knowledge Base Tool — Store, search, and retrieve documents
// In-memory + globalThis persistence (survives HMR, resets on server restart)
// ============================================================================

import { ToolHandler, KnowledgeDocument } from '../types';
import toolRegistry from './registry';

// Knowledge store singleton
interface KnowledgeStore {
  documents: Map<string, KnowledgeDocument>;
}

const globalStore = globalThis as unknown as { __kaelus_knowledge_store?: KnowledgeStore };
if (!globalStore.__kaelus_knowledge_store) {
  globalStore.__kaelus_knowledge_store = {
    documents: new Map(),
  };
}
const store = globalStore.__kaelus_knowledge_store;

// Simple text similarity search (TF-IDF-like)
function searchDocuments(query: string, docs: KnowledgeDocument[]): Array<{ doc: KnowledgeDocument; score: number }> {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  return docs.map(doc => {
    const content = (doc.title + ' ' + doc.content).toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Exact word match
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        score += matches.length * 2;
      }
      // Partial match
      if (content.includes(term)) {
        score += 1;
      }
    }

    // Boost for title matches
    const titleLower = doc.title.toLowerCase();
    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 5;
    }

    // Normalize by document length (prefer shorter, more relevant docs)
    score = score / Math.sqrt(doc.content.length / 1000);

    return { doc, score };
  })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function chunkText(text: string, chunkSize: number = 500): string[] {
  const sentences = text.split(/[.!?\n]+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? '. ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

const knowledgeBaseTool: ToolHandler = {
  name: 'knowledge_base',
  description: 'Store, search, and retrieve documents in the knowledge base. Use action "add" to store a new document, "search" to find relevant documents by query, "list" to see all stored documents, or "get" to retrieve a specific document by ID. The knowledge base persists during the session.',
  category: 'knowledge',
  icon: 'BookOpen',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform: "add", "search", "list", or "get"',
        enum: ['add', 'search', 'list', 'get'],
      },
      title: {
        type: 'string',
        description: 'Document title (required for "add" action)',
      },
      content: {
        type: 'string',
        description: 'Document content (required for "add" action)',
      },
      query: {
        type: 'string',
        description: 'Search query (required for "search" action)',
      },
      document_id: {
        type: 'string',
        description: 'Document ID (required for "get" action)',
      },
      type: {
        type: 'string',
        description: 'Document type for "add" action',
        default: 'text',
        enum: ['text', 'csv', 'json', 'markdown'],
      },
    },
    required: ['action'],
  },
  execute: async (args) => {
    const action = args.action as string;

    switch (action) {
      case 'add': {
        const title = args.title as string;
        const content = args.content as string;
        const type = (args.type as KnowledgeDocument['type']) || 'text';

        if (!title || !content) {
          return { success: false, result: 'Both "title" and "content" are required to add a document.' };
        }

        const id = `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const chunks = chunkText(content);

        const doc: KnowledgeDocument = {
          id,
          title,
          content,
          type,
          size: content.length,
          addedAt: Date.now(),
          chunks,
        };

        store.documents.set(id, doc);

        return {
          success: true,
          result: [
            ` **Document Added Successfully**`,
            `• ID: ${id}`,
            `• Title: ${title}`,
            `• Type: ${type}`,
            `• Size: ${content.length.toLocaleString()} characters`,
            `• Chunks: ${chunks.length} searchable segments`,
            '',
            `Total documents in knowledge base: ${store.documents.size}`,
          ].join('\n'),
          metadata: { documentId: id, chunks: chunks.length },
        };
      }

      case 'search': {
        const query = args.query as string;
        if (!query) {
          return { success: false, result: 'A "query" is required for search.' };
        }

        const docs = Array.from(store.documents.values());
        if (docs.length === 0) {
          return {
            success: true,
            result: ' Knowledge base is empty. Use action "add" to store documents first.',
          };
        }

        const results = searchDocuments(query, docs);

        if (results.length === 0) {
          return {
            success: true,
            result: ` No documents found matching "${query}". Try different keywords.\n\nAvailable documents:\n${docs.map(d => `• ${d.title} (${d.id})`).join('\n')}`,
          };
        }

        const output: string[] = [
          ` **Knowledge Base Search Results** for "${query}"`,
          `Found ${results.length} relevant document(s):`,
          '',
        ];

        for (const { doc, score } of results.slice(0, 5)) {
          // Find the most relevant chunk
          const chunks = doc.chunks || [doc.content];
          const queryTerms = query.toLowerCase().split(/\s+/);
          let bestChunk = chunks[0];
          let bestScore = 0;
          for (const chunk of chunks) {
            const chunkLower = chunk.toLowerCase();
            const chunkScore = queryTerms.reduce((s, t) => s + (chunkLower.includes(t) ? 1 : 0), 0);
            if (chunkScore > bestScore) {
              bestScore = chunkScore;
              bestChunk = chunk;
            }
          }

          output.push(`### ${doc.title}`);
          output.push(`ID: ${doc.id} | Relevance: ${score.toFixed(2)} | Type: ${doc.type}`);
          output.push(`> ${bestChunk.slice(0, 500)}${bestChunk.length > 500 ? '...' : ''}`);
          output.push('');
        }

        return {
          success: true,
          result: output.join('\n'),
          metadata: { resultsFound: results.length },
        };
      }

      case 'list': {
        const docs = Array.from(store.documents.values());

        if (docs.length === 0) {
          return {
            success: true,
            result: ' Knowledge base is empty. Use action "add" to store documents.',
          };
        }

        const output: string[] = [
          ` **Knowledge Base** (${docs.length} documents)`,
          '',
          '| ID | Title | Type | Size | Added |',
          '| --- | --- | --- | --- | --- |',
        ];

        for (const doc of docs) {
          output.push(
            `| ${doc.id} | ${doc.title} | ${doc.type} | ${(doc.size / 1024).toFixed(1)}KB | ${new Date(doc.addedAt).toLocaleDateString()} |`
          );
        }

        return {
          success: true,
          result: output.join('\n'),
          metadata: { documentCount: docs.length },
        };
      }

      case 'get': {
        const docId = args.document_id as string;
        if (!docId) {
          return { success: false, result: 'A "document_id" is required for get.' };
        }

        const doc = store.documents.get(docId);
        if (!doc) {
          return {
            success: false,
            result: `Document "${docId}" not found. Use action "list" to see available documents.`,
          };
        }

        return {
          success: true,
          result: [
            ` **${doc.title}**`,
            `ID: ${doc.id} | Type: ${doc.type} | Size: ${doc.size.toLocaleString()} chars`,
            '',
            '---',
            '',
            doc.content.slice(0, 10000),
            doc.content.length > 10000 ? `\n\n... [Truncated - ${doc.content.length.toLocaleString()} total characters]` : '',
          ].join('\n'),
          metadata: { documentId: doc.id },
        };
      }

      default:
        return {
          success: false,
          result: `Unknown action "${action}". Use "add", "search", "list", or "get".`,
        };
    }
  },
};

toolRegistry.register(knowledgeBaseTool);
export default knowledgeBaseTool;
