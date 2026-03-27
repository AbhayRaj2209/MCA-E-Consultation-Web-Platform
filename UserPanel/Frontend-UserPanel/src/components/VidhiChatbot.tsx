import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';

/**
 * VIDHI Floating Chatbot Widget
 * A floating chat interface for Indian bills and legislative assistance
 * 
 * Usage:
 * <VidhiChatbot />
 */
export const VidhiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string; timestamp: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      showGreeting();
    }
  };

  const showGreeting = () => {
    const timestamp = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setMessages([
      {
        role: 'bot',
        text: 'Namaste! 🇮🇳 I am Vidhi, your guide to Indian parliamentary bills and legislation. Ask me about any bill, law, policy, or regulatory changes. How can I assist you today?',
        timestamp,
      },
    ]);
  };

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return 'Hello! I am Vidhi, your AI assistant for Indian bills and legislation. Ask me about specific bills, laws, or policy topics!';
    }

    if (q.includes('about') || q.includes('help')) {
      return 'I can help you understand Indian parliamentary bills, acts, and policies. Try asking:\n• "What is the Lokpal Bill?"\n• "Recent consumer protection laws"\n• "Bills about environmental protection"\n• "How does a bill become law?"';
    }

    if (q.includes('bill') || q.includes('law') || q.includes('act')) {
      return 'I can search through thousands of Indian bills and acts. Please specify:\n• A bill name (e.g., "Criminal Law Amendment 2013")\n• A topic (e.g., "land acquisition", "labor rights")\n• A ministry or department\n• A year or time period';
    }

    if (q.includes('citizen') || q.includes('right') || q.includes('impact') || q.includes('affect')) {
      return '⚖️ Great question about citizen rights and impact. To give you practical advice, please tell me:\n• Which bill or law interests you?\n• Are you affected as an individual, business, or in another capacity?\n\nI can then explain implications and your legal protections.';
    }

    return 'I can help you understand Indian bills, laws, and policies. Ask me about:\n📋 Specific bills or acts\n🔍 Bills by topic, ministry, or year\n⚖️ Citizen rights and legal implications\n💼 Business or regulatory impacts\n\nWhat would you like to know?';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    const timestamp = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setMessages((prev) => [...prev, { role: 'user', text: userMessage, timestamp }]);
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const response = generateResponse(userMessage);
      const botTimestamp = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setMessages((prev) => [...prev, { role: 'bot', text: response, timestamp: botTimestamp }]);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-red-700 hover:bg-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 z-50 flex items-center justify-center text-xl font-bold"
        title="Chat with Vidhi"
      >
        {isOpen ? '↓' : '💬'}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chatbot Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-md h-96 md:h-[500px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b-4 border-red-700">
            <div>
              <h3 className="font-bold text-lg">VIDHI</h3>
              <span className="text-xs text-gray-400">Bills Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xl hover:opacity-70 transition"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col gap-1 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-xs text-gray-500 px-2">
                  {msg.role === 'user' ? 'You' : 'Vidhi'} · {msg.timestamp}
                </span>
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white rounded-br-none italic'
                      : 'bg-gray-200 text-gray-900 border-l-4 border-red-700 rounded-bl-none'
                  }`}
                >
                  {msg.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500">Vidhi is typing</p>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-red-700 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-red-700 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 bg-red-700 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about bills, laws..."
                className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-700 focus:bg-white"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-8 h-8 bg-red-700 hover:bg-red-800 text-white rounded-lg flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VidhiChatbot;
