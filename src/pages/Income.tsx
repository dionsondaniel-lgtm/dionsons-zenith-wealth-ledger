import React, { useState } from 'react';
import { useStore, IncomeSource } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react';

export function Income() {
  const { income, addIncome, updateIncome, deleteIncome, settings } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<IncomeSource | null>(null);

  const [newIncome, setNewIncome] = useState<Omit<IncomeSource, 'id'>>({
    name: '',
    category: 'Salary',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncome.name && newIncome.amount > 0) {
      addIncome(newIncome);
      setIsAdding(false);
      setNewIncome({ name: '', category: 'Salary', amount: 0, date: new Date().toISOString().split('T')[0] });
    }
  };

  const confirmDelete = () => {
    if (deleteModal) {
      deleteIncome(deleteModal);
      setDeleteModal(null);
    }
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModal && editModal.name && editModal.amount > 0) {
      updateIncome(editModal.id, {
        name: editModal.name,
        category: editModal.category,
        amount: editModal.amount,
        date: editModal.date,
      });
      setEditModal(null);
    }
  };

  const chartData = income.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Income Streams</h2>
          <p className="text-muted-foreground">Manage your cash flow and earnings.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          <span>Add Income</span>
        </button>
      </header>

      {isAdding && (
        <div className="glass p-6 rounded-2xl mb-8 border-primary/20">
          <h3 className="text-lg font-semibold mb-4">New Income Source</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <input 
                type="date" 
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={newIncome.date}
                onChange={e => setNewIncome({...newIncome, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={newIncome.name}
                onChange={e => setNewIncome({...newIncome, name: e.target.value})}
                placeholder="e.g. Tech Corp Inc."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <select 
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={newIncome.category}
                onChange={e => setNewIncome({...newIncome, category: e.target.value as any})}
              >
                <option value="Salary">Salary</option>
                <option value="Allowance">Allowance</option>
                <option value="Side Hustle">Side Hustle</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Amount ({settings.currency})</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={newIncome.amount || ''}
                onChange={e => setNewIncome({...newIncome, amount: parseFloat(e.target.value)})}
                placeholder="0.00"
              />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Save
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Income List</h3>
          </div>
          <div className="divide-y divide-border">
            {income.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No income sources added yet.
              </div>
            ) : (
              income.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {item.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-lg">{formatCurrency(item.amount, settings.currency)}</span>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => setEditModal(item)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setDeleteModal(item.id)}
                        className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Distribution</h3>
          <div className="flex-1 min-h-[300px]">
            {income.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value, settings.currency)}
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Add data to see chart
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-rose-500/20 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Delete Income</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this income record? This action cannot be undone and will remove it from your financial history.
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

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">Edit Income</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <input 
                  type="date" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={editModal.date}
                  onChange={e => setEditModal({...editModal, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <input 
                  type="text" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={editModal.name}
                  onChange={e => setEditModal({...editModal, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <select 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={editModal.category}
                  onChange={e => setEditModal({...editModal, category: e.target.value as any})}
                >
                  <option value="Salary">Salary</option>
                  <option value="Allowance">Allowance</option>
                  <option value="Side Hustle">Side Hustle</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Amount ({settings.currency})</label>
                <input 
                  type="number" required min="0" step="0.01"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={editModal.amount || ''}
                  onChange={e => setEditModal({...editModal, amount: parseFloat(e.target.value)})}
                />
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
    </div>
  );
}
