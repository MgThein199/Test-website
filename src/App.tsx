/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
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
  Trash2
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

  const tree = useMemo(() => {
    const buildTree = (parentId: string): (LibraryNode & { children: any[] })[] => {
      return nodes
        .filter(n => n.parent_id === parentId)
        .sort((a, b) => a.order_index - b.order_index)
        .map(n => ({
          ...n,
          children: buildTree(n.id)
        }));
    };
    return buildTree('root');
  }, [nodes]);

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
    <div className="flex h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white shadow-md rounded-full border border-[#E5E5E1]"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-[#E5E5E1] transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col
      `}>
        <div className="p-8 border-b border-[#E5E5E1] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#1A1A1A] flex items-center justify-center text-white font-serif italic text-xl">N</div>
            <span className="font-serif text-xl tracking-tight uppercase font-bold">Nexus <span className="font-light text-[#8E8E8B]">Library</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E8B] mb-6 font-bold">Table of Contents</h3>
            <div className="space-y-1">
              {tree.map((node, idx) => (
                <SidebarItem key={node.id} node={node} level={0} index={idx + 1} />
              ))}
              {tree.length === 0 && (
                <p className="text-xs italic text-[#8E8E8B] p-4 font-serif">No content available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#F9F8F6] border-t border-[#E5E5E1] space-y-4">
          {user ? (
            <>
              <button 
                onClick={() => setShowAdmin(!showAdmin)}
                className="w-full py-2 border border-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A] hover:text-white transition-colors bg-white shadow-sm"
              >
                + Add New Node
              </button>
              <button 
                onClick={logout}
                className="w-full py-2 border border-transparent text-[10px] uppercase tracking-widest font-bold text-[#8E8E8B] hover:text-[#1A1A1A] transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="w-full py-2 border border-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A] hover:text-white transition-colors bg-white shadow-sm"
            >
              Admin Access
            </button>
          )}
          <div className="pt-2 border-t border-[#E5E5E1]/50">
            <div className="text-[9px] text-[#8E8E8B] uppercase tracking-[0.2em]">Firestore Backend</div>
            <div className="text-[9px] text-green-600 font-bold uppercase tracking-widest">Connection Active</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col bg-[#FDFCFB]">
        <div className="flex-1 max-w-3xl mx-auto w-full pt-16 px-12 pb-24">
          {selectedNode ? (
            <>
              <div className="mb-10">
                <div className="mb-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8E8E8B]">
                    Nexus Library &rsaquo; Level {selectedNode.level}
                  </span>
                </div>
                <h2 className="text-6xl font-serif italic font-light tracking-tight text-[#1A1A1A] mb-8 leading-tight">
                  {selectedNode.title}
                </h2>
              </div>

              <article className="prose-editorial">
                <div className="markdown-body">
                  <ReactMarkdown>{selectedNode.content}</ReactMarkdown>
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
          <footer className="mt-auto p-8 border-t border-[#E5E5E1] flex justify-between items-center bg-white shrink-0">
            <div>
              {prevNode ? (
                <button 
                  onClick={() => setSelectedNodeId(prevNode.id)}
                  className="group flex items-center space-x-4 transition-all"
                >
                  <div className="w-10 h-10 border border-[#E5E5E1] flex items-center justify-center group-hover:border-[#1A1A1A] transition-colors font-serif">
                    &larr;
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] uppercase tracking-widest text-[#8E8E8B]">Previous</div>
                    <div className="text-[11px] font-bold uppercase tracking-tight text-[#1A1A1A] truncate max-w-[150px]">
                      {prevNode.title}
                    </div>
                  </div>
                </button>
              ) : <div className="w-10 h-10" />}
            </div>
            
            <div className="hidden sm:flex flex-col items-center justify-center">
              <div className="text-[9px] font-mono text-[#8E8E8B]">{selectedNode.id.slice(0, 12)}</div>
              <div className="w-20 h-0.5 bg-[#F0F0EE] mt-2">
                <div 
                  className="h-full bg-[#1A1A1A] transition-all duration-300" 
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
                    <div className="text-[9px] uppercase tracking-widest text-[#8E8E8B]">Next</div>
                    <div className="text-[11px] font-bold uppercase tracking-tight text-[#1A1A1A] truncate max-w-[150px]">
                      {nextNode.title}
                    </div>
                  </div>
                  <div className="w-10 h-10 border border-[#E5E5E1] flex items-center justify-center group-hover:border-[#1A1A1A] transition-colors font-serif">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCFB]/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white border border-[#E5E5E1] shadow-2xl w-full max-w-2xl overflow-hidden rounded-none"
            >
              <div className="px-8 py-6 border-b border-[#E5E5E1] flex items-center justify-between">
                <h3 className="font-serif italic text-2xl text-[#1A1A1A]">
                  Archive Entry
                </h3>
                <button onClick={() => setShowAdmin(false)} className="hover:text-red-600 p-1 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateNode} className="p-8 grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#8E8E8B] uppercase tracking-[0.2em] mb-2">Title</label>
                  <input 
                    required type="text" value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-[#E5E5E1] rounded-none focus:border-[#1A1A1A] outline-none font-serif text-lg"
                    placeholder="Subject Title"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8E8E8B] uppercase tracking-[0.2em] mb-2">URL Slug</label>
                  <input 
                    required type="text" value={form.slug} 
                    onChange={e => setForm({...form, slug: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-[#E5E5E1] rounded-none focus:border-[#1A1A1A] outline-none font-mono text-xs"
                    placeholder="slug-path"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8E8E8B] uppercase tracking-[0.2em] mb-2">Parent Reference</label>
                  <select 
                    value={form.parent_id} 
                    onChange={e => setForm({...form, parent_id: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-[#E5E5E1] rounded-none focus:border-[#1A1A1A] outline-none font-sans text-xs appearance-none"
                  >
                    <option value="root">ROOT ARCHIVE</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8E8E8B] uppercase tracking-[0.2em] mb-2">Tier Level</label>
                  <input 
                    required type="number" value={form.level} 
                    onChange={e => setForm({...form, level: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-white border border-[#E5E5E1] rounded-none focus:border-[#1A1A1A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8E8E8B] uppercase tracking-[0.2em] mb-2">Sorting Index</label>
                  <input 
                    required type="number" value={form.order_index} 
                    onChange={e => setForm({...form, order_index: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-white border border-[#E5E5E1] rounded-none focus:border-[#1A1A1A] outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#8E8E8B] uppercase tracking-[0.2em] mb-2">Markdown Content</label>
                  <textarea 
                    required rows={8} value={form.content} 
                    onChange={e => setForm({...form, content: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-[#E5E5E1] rounded-none focus:border-[#1A1A1A] outline-none font-serif text-base resize-none"
                    placeholder="Enter transcript..."
                  />
                </div>
                <div className="col-span-2 pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-black transition-all shadow-xl"
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
