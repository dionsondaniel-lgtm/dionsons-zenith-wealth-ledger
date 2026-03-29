import React, { useRef, useState } from 'react';
import { useStore, ThemeMode, ThemeColor } from '../store/StoreContext';
import { Moon, Sun, Palette, Download, Upload, CheckCircle2, AlertCircle, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
  const { settings, updateSettings, exportData, importData, resetData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [bgInput, setBgInput] = useState(settings.backgroundImage || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenith_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        importData(content);
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
      } catch (error) {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBgInput(dataUrl);
      updateSettings({ backgroundImage: dataUrl });
    };
    reader.readAsDataURL(file);
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  const handleSaveBackground = () => {
    updateSettings({ backgroundImage: bgInput.trim() || null });
  };

  const themes: { id: ThemeColor, name: string, colorClass: string }[] = [
    { id: 'indigo', name: 'Midnight Indigo', colorClass: 'bg-indigo-500' },
    { id: 'emerald', name: 'Emerald Forest', colorClass: 'bg-emerald-500' },
    { id: 'rose', name: 'Rose Quartz', colorClass: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0 max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Preferences</h2>
        <p className="text-muted-foreground">Customize your Zenith Wealth experience.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <div className="glass p-6 rounded-2xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-border pb-4">
            <Palette className="text-primary" />
            <h3 className="text-xl font-semibold">Appearance</h3>
          </div>

          {/* Mode Toggle */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Display Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSettings({ mode: 'light' })}
                className={cn(
                  "flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border transition-all duration-200",
                  settings.mode === 'light' 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-border bg-background hover:bg-muted text-muted-foreground"
                )}
              >
                <Sun size={18} />
                <span className="font-medium">Light</span>
              </button>
              <button
                onClick={() => updateSettings({ mode: 'dark' })}
                className={cn(
                  "flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border transition-all duration-200",
                  settings.mode === 'dark' 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-border bg-background hover:bg-muted text-muted-foreground"
                )}
              >
                <Moon size={18} />
                <span className="font-medium">Dark</span>
              </button>
            </div>
          </div>

          {/* Color Blend */}
          <div className="space-y-3 pt-4">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Color Blend</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateSettings({ color: theme.id })}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200",
                    settings.color === theme.id 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-full mb-2 shadow-sm", theme.colorClass)} />
                  <span className={cn("text-xs font-medium text-center", settings.color === theme.id ? "text-primary" : "text-muted-foreground")}>
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-3 pt-4">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center space-x-2">
              <ImageIcon size={16} />
              <span>Custom Background</span>
            </label>
            <div className="flex flex-col space-y-3">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    value={bgInput.startsWith('data:image') ? 'Local Image Uploaded' : bgInput}
                    onChange={e => setBgInput(e.target.value)}
                    disabled={bgInput.startsWith('data:image')}
                  />
                  {bgInput && (
                    <button 
                      onClick={() => { setBgInput(''); updateSettings({ backgroundImage: null }); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {!bgInput.startsWith('data:image') && (
                  <button 
                    onClick={handleSaveBackground}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  ref={bgFileInputRef}
                  onChange={handleBgUpload}
                  className="hidden"
                />
                <button 
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 bg-background border border-border text-foreground py-2 px-4 rounded-xl hover:bg-muted transition-colors text-sm font-medium"
                >
                  <Upload size={16} />
                  <span>Browse Picture</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Paste an image URL or upload a picture from your device to set a custom background.</p>
          </div>

          {/* Currency */}
          <div className="space-y-3 pt-4">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Currency</label>
            <select 
              className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              value={settings.currency}
              onChange={e => updateSettings({ currency: e.target.value as any })}
            >
              <option value="PHP">Philippine Peso (₱)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
              <option value="JPY">Japanese Yen (¥)</option>
              <option value="AUD">Australian Dollar (A$)</option>
              <option value="CAD">Canadian Dollar (C$)</option>
              <option value="SGD">Singapore Dollar (S$)</option>
            </select>
            <p className="text-xs text-muted-foreground">Select your preferred currency for all financial data.</p>
          </div>
        </div>

        {/* Data Portability */}
        <div className="glass p-6 rounded-2xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-border pb-4">
            <Download className="text-primary" />
            <h3 className="text-xl font-semibold">Data Portability</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Your data is stored locally on this device. Export a backup to sync manually across devices or keep it safe.
          </p>

          <div className="space-y-4 pt-2">
            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-3 px-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 font-medium"
            >
              <Download size={18} />
              <span>Export zenith_data.json</span>
            </button>

            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 bg-background border border-border text-foreground py-3 px-4 rounded-xl hover:bg-muted transition-colors font-medium"
              >
                <Upload size={18} />
                <span>Import Backup</span>
              </button>
            </div>

            {importStatus === 'success' && (
              <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-500/10 p-3 rounded-lg text-sm">
                <CheckCircle2 size={16} />
                <span>Data imported successfully!</span>
              </div>
            )}
            
            {importStatus === 'error' && (
              <div className="flex items-center space-x-2 text-rose-500 bg-rose-500/10 p-3 rounded-lg text-sm">
                <AlertCircle size={16} />
                <span>Failed to import data. Invalid format.</span>
              </div>
            )}

            <div className="pt-6 border-t border-border mt-6">
              <h4 className="text-sm font-medium text-rose-500 mb-2">Danger Zone</h4>
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center space-x-2 bg-rose-500/10 text-rose-500 py-3 px-4 rounded-xl hover:bg-rose-500 hover:text-white transition-colors font-medium"
              >
                <Trash2 size={18} />
                <span>Reset All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-rose-500/20 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-xl font-bold">Reset All Data?</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              This will permanently delete all your income records, loans, and custom settings. This action cannot be undone. Are you absolutely sure?
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  resetData();
                  setShowResetConfirm(false);
                }}
                className="flex-1 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors font-medium"
              >
                Yes, Reset Everything
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
