import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  canChat: boolean;
  contextMessage?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ canChat, contextMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting when chat becomes available
  useEffect(() => {
    if (canChat && messages.length === 0) {
      setMessages([{ role: 'model', text: "I'm here to help! Ask me anything about this question or the training content." }]);
    }
  }, [canChat, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || !canChat || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepend context if it's the first real query about a specific slide context (optional, mostly handled by system prompt, 
    // but we can augment the prompt if needed. Here we rely on the service maintaining session or stateless simple calls).
    // Note: The service uses a chat session, so history is preserved.
    
    const responseText = await sendMessageToGemini(input);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700 overflow-hidden transition-opacity duration-500 ${canChat ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
      <div className="bg-slate-900/50 p-3 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">AI Tutor Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 rounded-lg p-3 rounded-bl-none flex space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-slate-900/50 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={canChat ? "Ask a question..." : "Finish the question to chat"}
            disabled={!canChat || isLoading}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!canChat || isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
