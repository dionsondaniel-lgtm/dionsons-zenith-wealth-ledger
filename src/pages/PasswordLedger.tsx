import React, { useState } from 'react';
import { useStore, PasswordEntry } from '../store/StoreContext';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, AlertTriangle, Key, Copy, Check, Eye, EyeOff, Search, Lock } from 'lucide-react';

export function PasswordLedger() {
  const { passwords, addPassword, updatePassword, deletePassword } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editModal, setEditModal] = useState<PasswordEntry | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track which passwords are shown and which fields are copied
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const [newEntry, setNewEntry] = useState<Omit<PasswordEntry, 'id' | 'dateAdded' | 'dateModified'>>({
    name: '',
    username: '',
    password: '',
    notes: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEntry.name && newEntry.username && newEntry.password) {
      addPassword(newEntry);
      setIsAdding(false);
      setNewEntry({ name: '', username: '', password: '', notes: '' });
    }
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModal && editModal.name && editModal.username && editModal.password) {
      updatePassword(editModal.id, {
        name: editModal.name,
        username: editModal.username,
        password: editModal.password,
        notes: editModal.notes,
      });
      setEditModal(null);
    }
  };

  const confirmDelete = () => {
    if (deleteModal) {
      deletePassword(deleteModal);
      setDeleteModal(null);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async (text: string, id: string, field: 'user' | 'pass') => {
    try {
      await navigator.clipboard.writeText(text);
      const copyId = `${id}-${field}`;
      setCopied(copyId);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const filteredPasswords = passwords.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lock className="text-primary" />
            Password Ledger
          </h2>
          <p className="text-muted-foreground">Securely manage your accounts and credentials.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          <span>New Password</span>
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative max-w-md mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search accounts..."
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="glass p-6 rounded-2xl mb-8 border-primary/20 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4">Add New Account</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Account Name (e.g., SSS, Netflix)</label>
              <input 
                type="text" required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newEntry.name}
                onChange={e => setNewEntry({...newEntry, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username / Email</label>
              <input 
                type="text" required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newEntry.username}
                onChange={e => setNewEntry({...newEntry, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <input 
                type="text" required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newEntry.password}
                onChange={e => setNewEntry({...newEntry, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Notes (Optional)</label>
              <input 
                type="text"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newEntry.notes || ''}
                onChange={e => setNewEntry({...newEntry, notes: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex space-x-2 mt-2">
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Save Account
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-muted text-muted-foreground px-6 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Passwords Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPasswords.length === 0 ? (
          <div className="col-span-full glass p-12 rounded-2xl text-center text-muted-foreground flex flex-col items-center">
            <Key size={48} className="mb-4 opacity-20" />
            <p>No passwords found.</p>
            {searchQuery ? (
              <p className="text-sm mt-2">Try adjusting your search query.</p>
            ) : (
              <p className="text-sm mt-2">Click "New Password" to securely store your credentials.</p>
            )}
          </div>
        ) : (
          filteredPasswords.map(pwd => (
            <div key={pwd.id} className="glass rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md border border-border">
              {/* Card Header */}
              <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
                <h3 className="font-bold text-lg truncate pr-2">{pwd.name}</h3>
                <div className="flex space-x-1 flex-shrink-0">
                  <button 
                    onClick={() => setEditModal(pwd)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setDeleteModal(pwd.id)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4 flex-1">
                {/* Username Row */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Username / Email</label>
                  <div className="flex items-center justify-between bg-background border border-border rounded-lg p-2">
                    <span className="font-mono text-sm truncate mr-2">{pwd.username}</span>
                    <button 
                      onClick={() => handleCopy(pwd.username, pwd.id, 'user')}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors flex-shrink-0"
                      title="Copy Username"
                    >
                      {copied === `${pwd.id}-user` ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Row */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Password</label>
                  <div className="flex items-center justify-between bg-background border border-border rounded-lg p-2">
                    <span className="font-mono text-sm truncate mr-2">
                      {showPassword[pwd.id] ? pwd.password : '••••••••••••'}
                    </span>
                    <div className="flex space-x-1 flex-shrink-0">
                      <button 
                        onClick={() => togglePasswordVisibility(pwd.id)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title={showPassword[pwd.id] ? "Hide Password" : "Show Password"}
                      >
                        {showPassword[pwd.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button 
                        onClick={() => handleCopy(pwd.password, pwd.id, 'pass')}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="Copy Password"
                      >
                        {copied === `${pwd.id}-pass` ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {pwd.notes && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
                    <p className="text-sm text-foreground/80 bg-muted/30 p-2 rounded-lg border border-border/50 text-sm">
                      {pwd.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-muted/30 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                <span>Added: {format(new Date(pwd.dateAdded), 'MMM d, yyyy')}</span>
                <span>Modified: {format(new Date(pwd.dateModified), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">Edit Account</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                <input 
                  type="text" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.name}
                  onChange={e => setEditModal({...editModal, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Username / Email</label>
                <input 
                  type="text" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.username}
                  onChange={e => setEditModal({...editModal, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <input 
                  type="text" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.password}
                  onChange={e => setEditModal({...editModal, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Notes (Optional)</label>
                <input 
                  type="text"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.notes || ''}
                  onChange={e => setEditModal({...editModal, notes: e.target.value})}
                />
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-4 flex items-start space-x-2">
                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Are you sure you want to save these changes? The previous credentials will be overwritten.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditModal(null)} className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-rose-500/20 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Delete Account</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete these credentials? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button onClick={confirmDelete} className="flex-1 bg-rose-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium">
                Yes, Delete
              </button>
              <button onClick={() => setDeleteModal(null)} className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
