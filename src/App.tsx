/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Plus, 
  ChevronLeft, 
  Menu, 
  X,
  LogOut,
  LogIn,
  Settings,
  Trash2,
  Search,
  Moon,
  Sun,
  Bold,
  Italic,
  Code,
  Quote,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getNodeStream, 
  createNode, 
  deleteNode, 
  LibraryNode 
} from './services/libraryService';
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [nodes, setNodes] = useState<LibraryNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    parent_id: 'root',
    level: 0,
    order_index: 0,
    slug: ''
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const unsubscribeNodes = getNodeStream(setNodes);
    return () => {
      unsubscribeAuth();
      unsubscribeNodes();
    };
  }, []);

  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId) || nodes[0]
  , [nodes, selectedNodeId]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.content.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

  const tree = useMemo(() => {
    const buildTree = (parentId: string): (LibraryNode & { children: any[] })[] => {
      return filteredNodes
        .filter(n => n.parent_id === parentId)
        .sort((a, b) => a.order_index - b.order_index)
        .map(n => ({
          ...n,
          children: buildTree(n.id)
        }));
    };
    return buildTree('root');
  }, [filteredNodes]);

  const sortedFlatNodes = useMemo(() => {
    const flat: LibraryNode[] = [];
    const flatten = (items: any[]) => {
      items.forEach(item => {
        flat.push(item);
        if (item.children) flatten(item.children);
      });
    };
    flatten(tree);
    return flat;
  }, [tree]);

  const currentIndex = sortedFlatNodes.findIndex(n => n.id === selectedNode?.id);
  const prevNode = currentIndex > 0 ? sortedFlatNodes[currentIndex - 1] : null;
  const nextNode = currentIndex < sortedFlatNodes.length - 1 ? sortedFlatNodes[currentIndex + 1] : null;

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createNode(form);
      setForm({ title: '', content: '', parent_id: 'root', level: 0, order_index: 0, slug: '' });
      setShowAdmin(false);
    } catch (err) {
      alert("Error creating node. Check console.");
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    if (!contentRef.current) return;
    const { selectionStart, selectionEnd, value } = contentRef.current;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);
    const newContent = `${before}${prefix}${selectedText}${suffix}${after}`;
    setForm(f => ({ ...f, content: newContent }));
    
    // Focus back after state update
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        contentRef.current.setSelectionRange(
          selectionStart + prefix.length,
          selectionEnd + prefix.length
        );
      }
    }, 0);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this node?')) {
      await deleteNode(id);
    }
  };

  const SidebarItem = ({ node, level = 0, index }: { node: any; level?: number; index?: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;

    return (
      <div className="flex flex-col">
        <div 
          className={`
            group flex items-center py-2 px-3 rounded-none cursor-pointer transition-colors
            ${isSelected ? 'text-[#1A1A1A] font-bold' : 'text-[#8E8E8B] hover:text-[#1A1A1A]'}
          `}
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={() => {
            setSelectedNodeId(node.id);
            if (hasChildren) toggleExpand(node.id);
          }}
        >
          {level === 0 ? (
            <div className="flex items-center text-xs font-bold uppercase tracking-tight">
              <span className="mr-3 opacity-30 tabular-nums">{index?.toString().padStart(2, '0')}</span>
              {node.title}
            </div>
          ) : (
            <div className={`flex items-center text-xs ${isSelected ? 'font-bold' : 'font-medium'} transition-all`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-2 transition-colors ${isSelected ? 'bg-[#1A1A1A]' : 'bg-transparent border border-[#E5E5E1]'}`}></span>
              <span className={level > 1 ? 'italic font-serif text-sm normal-case' : 'uppercase tracking-wide'}>
                {node.title}
              </span>
            </div>
          )}
          
          {user && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}
              className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden ml-4 border-l border-[#F0F0EE]"
            >
              {node.children.map((child: any, idx: number) => (
                <SidebarItem key={child.id} node={child} level={level + 1} index={idx + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-app-bg text-app-text-primary font-sans transition-colors duration-300">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-app-surface shadow-md rounded-full border border-app-border"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} className="text-app-text-primary" /> : <Menu size={20} className="text-app-text-primary" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-app-sidebar border-r border-app-border transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col
      `}>
        <div className="p-8 border-b border-app-border flex items-center justify-between bg-app-sidebar shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-app-text-primary flex items-center justify-center text-app-bg font-serif italic text-xl">N</div>
            <span className="font-serif text-xl tracking-tight uppercase font-bold">Nexus <span className="font-light text-app-text-secondary">Library</span></span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-1.5 rounded-none border border-app-border hover:bg-app-bg transition-colors text-app-text-secondary hover:text-app-text-primary"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>

        <div className="p-6 border-b border-app-border bg-app-bg/50">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-secondary group-focus-within:text-app-text-primary transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Filter nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-app-sidebar border border-app-border pl-9 pr-3 py-2 text-xs outline-none focus:border-app-text-primary transition-all font-serif"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-app-text-secondary mb-6 font-bold">
              {searchQuery ? `Search Results (${filteredNodes.length})` : 'Table of Contents'}
            </h3>
            <div className="space-y-1">
              {searchQuery ? (
                filteredNodes.map((node, idx) => (
                  <div 
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`
                      group flex flex-col py-3 px-3 border border-app-border mb-2 cursor-pointer transition-colors
                      ${selectedNode?.id === node.id ? 'bg-app-text-primary text-app-bg' : 'hover:bg-app-bg text-app-text-primary bg-app-surface'}
                    `}
                  >
                    <span className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Result {idx + 1}</span>
                    <span className="text-sm font-bold truncate">{node.title}</span>
                  </div>
                ))
              ) : (
                tree.map((node, idx) => (
                  <SidebarItem key={node.id} node={node} level={0} index={idx + 1} />
                ))
              )}
              {filteredNodes.length === 0 && (
                <p className="text-xs italic text-app-text-secondary p-4 font-serif text-center border border-dashed border-app-border">
                  {searchQuery ? 'No archives match your query.' : 'The archive is currently empty.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-app-bg border-t border-app-border space-y-4">
          {user ? (
            <>
              <button 
                onClick={() => setShowAdmin(!showAdmin)}
                className="w-full py-2 border border-app-text-primary text-[10px] uppercase tracking-widest font-bold hover:bg-app-text-primary hover:text-app-bg transition-colors bg-app-surface shadow-sm"
              >
                + Add New Node
              </button>
              <button 
                onClick={logout}
                className="w-full py-2 border border-transparent text-[10px] uppercase tracking-widest font-bold text-app-text-secondary hover:text-app-text-primary transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="w-full py-2 border border-app-text-primary text-[10px] uppercase tracking-widest font-bold hover:bg-app-text-primary hover:text-app-bg transition-colors bg-app-surface shadow-sm"
            >
              Admin Access
            </button>
          )}
          <div className="pt-2 border-t border-app-border/50">
            <div className="text-[9px] text-app-text-secondary uppercase tracking-[0.2em]">Firestore Backend</div>
            <div className="text-[9px] text-green-600 font-bold uppercase tracking-widest">Connection Active</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col bg-app-bg transition-colors duration-300">
        <div className="flex-1 max-w-3xl mx-auto w-full pt-16 px-12 pb-24">
          {selectedNode ? (
            <>
              <div className="mb-10">
                <div className="mb-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-app-text-secondary">
                    Nexus Library &rsaquo; Level {selectedNode.level}
                  </span>
                </div>
                <h2 className="text-6xl font-serif italic font-light tracking-tight text-app-text-primary mb-8 leading-tight">
                  {selectedNode.title}
                </h2>
              </div>

              <article className="prose-editorial">
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNode.content}</ReactMarkdown>
                </div>
              </article>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 border border-[#E5E5E1] font-serif italic text-3xl flex items-center justify-center text-[#1A1A1A] mb-6">
                N
              </div>
              <h2 className="text-3xl font-serif italic text-[#1A1A1A] mb-4">Welcome to the Nexus</h2>
              <p className="text-[#8E8E8B] font-serif text-lg leading-relaxed max-w-sm italic">
                A digital archive for organized knowledge. Explore the table of contents to begin your journey.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {selectedNode && (
          <footer className="mt-auto p-8 border-t border-app-border flex justify-between items-center bg-app-surface shrink-0 transition-colors duration-300">
            <div>
              {prevNode ? (
                <button 
                  onClick={() => setSelectedNodeId(prevNode.id)}
                  className="group flex items-center space-x-4 transition-all"
                >
                  <div className="w-10 h-10 border border-app-border flex items-center justify-center group-hover:border-app-text-primary transition-colors font-serif text-app-text-primary">
                    &larr;
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] uppercase tracking-widest text-app-text-secondary">Previous</div>
                    <div className="text-[11px] font-bold uppercase tracking-tight text-app-text-primary truncate max-w-[150px]">
                      {prevNode.title}
                    </div>
                  </div>
                </button>
              ) : <div className="w-10 h-10" />}
            </div>
            
            <div className="hidden sm:flex flex-col items-center justify-center">
              <div className="text-[9px] font-mono text-app-text-secondary">{selectedNode.id.slice(0, 12)}</div>
              <div className="w-20 h-0.5 bg-app-border mt-2">
                <div 
                  className="h-full bg-app-text-primary transition-all duration-300" 
                  style={{ width: `${((currentIndex + 1) / sortedFlatNodes.length) * 100}%` }}
                />
              </div>
            </div>

            <div>
              {nextNode ? (
                <button 
                  onClick={() => setSelectedNodeId(nextNode.id)}
                  className="group flex items-center space-x-4 transition-all"
                >
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest text-app-text-secondary">Next</div>
                    <div className="text-[11px] font-bold uppercase tracking-tight text-app-text-primary truncate max-w-[150px]">
                      {nextNode.title}
                    </div>
                  </div>
                  <div className="w-10 h-10 border border-app-border flex items-center justify-center group-hover:border-app-text-primary transition-colors font-serif text-app-text-primary">
                    &rarr;
                  </div>
                </button>
              ) : <div className="w-10 h-10" />}
            </div>
          </footer>
        )}
      </main>

      {/* Admin Panel Overlay */}
      <AnimatePresence>
        {showAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-bg/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-app-surface border border-app-border shadow-2xl w-full max-w-2xl overflow-hidden rounded-none"
            >
              <div className="px-8 py-6 border-b border-app-border flex items-center justify-between">
                <h3 className="font-serif italic text-2xl text-app-text-primary">
                  Archive Entry
                </h3>
                <button onClick={() => setShowAdmin(false)} className="hover:text-red-600 p-1 transition-colors text-app-text-primary">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateNode} className="p-8 grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-[0.2em] mb-2">Title</label>
                  <input 
                    required type="text" value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-none focus:border-app-text-primary outline-none font-serif text-lg text-app-text-primary transition-colors"
                    placeholder="Subject Title"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-[0.2em] mb-2">URL Slug</label>
                  <input 
                    required type="text" value={form.slug} 
                    onChange={e => setForm({...form, slug: e.target.value})}
                    className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-none focus:border-app-text-primary outline-none font-mono text-xs text-app-text-primary transition-colors"
                    placeholder="slug-path"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-[0.2em] mb-2">Parent Reference</label>
                  <select 
                    value={form.parent_id} 
                    onChange={e => setForm({...form, parent_id: e.target.value})}
                    className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-none focus:border-app-text-primary outline-none font-sans text-xs appearance-none text-app-text-primary transition-colors"
                  >
                    <option value="root">ROOT ARCHIVE</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-[0.2em] mb-2">Tier Level</label>
                  <input 
                    required type="number" value={form.level} 
                    onChange={e => setForm({...form, level: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-none focus:border-app-text-primary outline-none text-app-text-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-[0.2em] mb-2">Sorting Index</label>
                  <input 
                    required type="number" value={form.order_index} 
                    onChange={e => setForm({...form, order_index: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-none focus:border-app-text-primary outline-none text-app-text-primary transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-app-text-secondary uppercase tracking-[0.2em]">Markdown Content</label>
                    <div className="flex items-center space-x-1">
                      <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-1.5 border border-app-border hover:bg-app-bg text-app-text-secondary" title="Bold"><Bold size={12} /></button>
                      <button type="button" onClick={() => insertMarkdown('_', '_')} className="p-1.5 border border-app-border hover:bg-app-bg text-app-text-secondary" title="Italic"><Italic size={12} /></button>
                      <button type="button" onClick={() => insertMarkdown('`', '`')} className="p-1.5 border border-app-border hover:bg-app-bg text-app-text-secondary" title="Code"><Code size={12} /></button>
                      <button type="button" onClick={() => insertMarkdown('> ')} className="p-1.5 border border-app-border hover:bg-app-bg text-app-text-secondary" title="Quote"><Quote size={12} /></button>
                      <button type="button" onClick={() => insertMarkdown('---')} className="p-1.5 border border-app-border hover:bg-app-bg text-app-text-secondary" title="Divider"><Minus size={12} /></button>
                    </div>
                  </div>
                  <textarea 
                    ref={contentRef}
                    required rows={8} value={form.content} 
                    onChange={e => setForm({...form, content: e.target.value})}
                    className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-none focus:border-app-text-primary outline-none font-serif text-base resize-none text-app-text-primary transition-colors"
                    placeholder="Enter transcript..."
                  />
                </div>
                <div className="col-span-2 pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-app-text-primary text-app-bg text-[11px] uppercase tracking-[0.3em] font-bold hover:opacity-90 transition-all shadow-xl"
                  >
                    Commit to Archive
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
