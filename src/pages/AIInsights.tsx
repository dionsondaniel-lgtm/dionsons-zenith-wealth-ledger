import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, AlertTriangle, Sparkles, Loader2, Trash2 } from 'lucide-react';

export function AIInsights() {
  const { income, loans } = useStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.GEMINI_API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const generateFinancialSummary = () => {
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalDebt = loans.reduce((sum, loan) => {
      return sum + loan.schedule.reduce((schSum, sch) => {
        return schSum + (sch.isPaid ? 0 : sch.principal + sch.interest);
      }, 0);
    }, 0);
    
    const upcomingPayments = loans.flatMap(l => l.schedule.map(s => ({ ...s, lenderName: l.lenderName })))
      .filter(s => !s.isPaid)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map(p => `${p.lenderName}: ${p.amountDue} due on ${p.dueDate}`);

    return JSON.stringify({
      totalMonthlyIncome: totalIncome,
      totalOutstandingDebt: totalDebt,
      debtToIncomeRatio: totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0,
      upcomingPayments,
      numberOfLoans: loans.length
    });
  };

  const handleConsultAI = async () => {
    if (!apiKey) {
      setError("GEMINI_API_KEY is missing. Please configure it in your environment or settings.");
      return;
    }

    const summary = generateFinancialSummary();
    const prompt = `You are an expert Financial Advisor. Here is a summary of my current financial state in JSON format: ${summary}. 
    Please provide:
    1. A "Financial Health Grade" (A to F) with a brief explanation.
    2. "Debt Snowball" advice based on my loans.
    3. Actionable savings tips.
    Keep the response professional, encouraging, and formatted with clear headings.`;

    const newMessage = { role: 'user' as const, content: "Consult AI with my current financial data." };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'ai', content: response.text }]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while communicating with the AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const summary = generateFinancialSummary();
      const systemContext = `You are a financial advisor. The user's current financial state is: ${summary}.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${systemContext}\n\nUser: ${userMessage}`,
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'ai', content: response.text }]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while communicating with the AI.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <header className="mb-6 flex-shrink-0 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <Sparkles className="text-primary" />
            <span>AI Financial Advisor</span>
          </h2>
          <p className="text-muted-foreground mt-1">Get personalized insights powered by Gemini.</p>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={handleClearChat}
            className="flex items-center space-x-2 bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 px-3 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </header>

      {!apiKey && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl flex items-start space-x-3 mb-6 flex-shrink-0">
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold">API Key Missing</h4>
            <p className="text-sm mt-1">Please configure your GEMINI_API_KEY in the environment variables to use the AI Advisor.</p>
          </div>
        </div>
      )}

      <div className="flex-1 glass rounded-2xl border border-border flex flex-col overflow-hidden relative">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Bot size={40} className="text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Ready to analyze your finances</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              I can analyze your income, debts, and payment schedules to provide a comprehensive financial health grade and actionable advice.
            </p>
            <button 
              onClick={handleConsultAI}
              disabled={!apiKey || isLoading}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Sparkles size={20} />
              <span>Consult AI Now</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-3' : 'bg-muted text-foreground mr-3'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-muted/50 border border-border rounded-tl-sm text-foreground'
                  }`}>
                    {msg.role === 'ai' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] flex-row">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-foreground mr-3">
                    <Bot size={16} />
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border rounded-tl-sm flex items-center space-x-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-sm border border-rose-500/20">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-background/50 border-t border-border backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={!apiKey || isLoading || messages.length === 0}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!input.trim() || !apiKey || isLoading || messages.length === 0}
              className="bg-primary text-primary-foreground p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
