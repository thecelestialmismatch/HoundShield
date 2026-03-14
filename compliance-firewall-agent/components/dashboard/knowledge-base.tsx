'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  FileText,
  Database,
  Code,
  FileSpreadsheet,
  X,
  Upload,
  Eye,
} from 'lucide-react';

interface KBDocument {
  id: string;
  title: string;
  type: 'text' | 'csv' | 'json' | 'markdown';
  size: number;
  addedAt: number;
  preview: string;
}

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewDoc, setViewDoc] = useState<{ title: string; content: string } | null>(null);
  const [newDoc, setNewDoc] = useState({ title: '', content: '', type: 'text' as KBDocument['type'] });
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'list documents' }],
          model: 'gemini-flash',
          tools: ['knowledge_base'],
          systemPrompt: 'List all documents in the knowledge base. Call the knowledge_base tool with action "list".',
          maxIterations: 1,
        }),
      });
      // We'll just re-render with local data for now
    } catch {
      // Ignore - we use local state tracking
    }
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kaelus_kb_docs');
      if (stored) setDocuments(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const saveDocuments = (docs: KBDocument[]) => {
    setDocuments(docs);
    try {
      localStorage.setItem('kaelus_kb_docs', JSON.stringify(docs));
    } catch { /* ignore */ }
  };

  const handleAddDocument = async () => {
    if (!newDoc.title.trim() || !newDoc.content.trim()) return;

    setIsLoading(true);

    const doc: KBDocument = {
      id: `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: newDoc.title,
      type: newDoc.type,
      size: newDoc.content.length,
      addedAt: Date.now(),
      preview: newDoc.content.slice(0, 200),
    };

    // Also add to server-side knowledge base via a lightweight call
    try {
      const apiKey = localStorage.getItem('kaelus_openrouter_key') || '';
      if (apiKey) {
        await fetch('/api/agent/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openrouter-key': apiKey,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: `Add document: ${newDoc.title}` }],
            model: 'gemini-flash',
            tools: ['knowledge_base'],
            systemPrompt: `You must call the knowledge_base tool with action "add", title "${newDoc.title}", content (the full text below), and type "${newDoc.type}". Content: ${newDoc.content.slice(0, 5000)}`,
            maxIterations: 2,
          }),
        });
      }
    } catch { /* server sync failed, local still works */ }

    const updated = [...documents, doc];
    saveDocuments(updated);
    setNewDoc({ title: '', content: '', type: 'text' });
    setShowAddModal(false);
    setIsLoading(false);
  };

  const handleDeleteDocument = (id: string) => {
    saveDocuments(documents.filter(d => d.id !== id));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);

    // Simple local search
    const terms = searchQuery.toLowerCase().split(' ');
    const results = documents.filter(doc =>
      terms.some(t =>
        doc.title.toLowerCase().includes(t) ||
        doc.preview.toLowerCase().includes(t)
      )
    );

    setSearchResults(
      results.length > 0
        ? `Found ${results.length} document(s) matching "${searchQuery}": ${results.map(d => d.title).join(', ')}`
        : `No documents found matching "${searchQuery}"`
    );

    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase();
      setNewDoc({
        title: file.name,
        content: content || '',
        type: ext === 'csv' ? 'csv' : ext === 'json' ? 'json' : ext === 'md' ? 'markdown' : 'text',
      });
    };
    reader.readAsText(file);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'csv': return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'json': return <Code className="w-4 h-4 text-amber-400" />;
      case 'markdown': return <FileText className="w-4 h-4 text-blue-400" />;
      default: return <FileText className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Knowledge Base
            <span className="text-[10px] text-zinc-500 ml-1">({documents.length} docs)</span>
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs hover:bg-indigo-500/30 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search knowledge base..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-900 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {searchResults && (
          <div className="mt-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
            {searchResults}
            <button onClick={() => setSearchResults(null)} className="ml-2 text-indigo-400 hover:text-indigo-300">
              <X className="w-3 h-3 inline" />
            </button>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm">
            <Database className="w-8 h-8 mb-2 opacity-30" />
            <p>No documents yet</p>
            <p className="text-xs mt-1">Add documents for your agents to reference</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs hover:bg-indigo-500/30 transition-colors"
            >
              <Plus className="w-3 h-3 inline mr-1" />
              Add First Document
            </button>
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {getTypeIcon(doc.type)}
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-slate-900 truncate">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 uppercase">{doc.type}</span>
                      <span className="text-[10px] text-zinc-600">•</span>
                      <span className="text-[10px] text-zinc-500">{(doc.size / 1024).toFixed(1)}KB</span>
                      <span className="text-[10px] text-zinc-600">•</span>
                      <span className="text-[10px] text-zinc-500">{new Date(doc.addedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setViewDoc({ title: doc.title, content: doc.preview })}
                    className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-slate-900"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 line-clamp-2">{doc.preview}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 rounded-xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-slate-900">Add Document</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Title</label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Document title..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-900 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <div className="flex gap-2">
                  {(['text', 'csv', 'json', 'markdown'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewDoc(prev => ({ ...prev, type }))}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        newDoc.type === type
                          ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                          : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-400">Content</label>
                  <label className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-indigo-400 hover:bg-indigo-500/10 cursor-pointer transition-colors">
                    <Upload className="w-3 h-3" />
                    Upload File
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.csv,.json,.md,.markdown" />
                  </label>
                </div>
                <textarea
                  value={newDoc.content}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Paste your document content here..."
                  rows={10}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-900 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                />
                <div className="text-[10px] text-zinc-500 mt-1">
                  {newDoc.content.length.toLocaleString()} characters
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-white/10">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={!newDoc.title.trim() || !newDoc.content.trim() || isLoading}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 text-slate-900 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Adding...' : 'Add Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewDoc && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 rounded-xl border border-white/10 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-slate-900">{viewDoc.title}</h3>
              <button onClick={() => setViewDoc(null)} className="text-zinc-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{viewDoc.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
