import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { Message } from '../types';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  timeOfDay: 'morning' | 'evening';
  isImmersive?: boolean;
  messagesRemaining?: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  placeholder = "Share what's on your mind...",
  disabled = false,
  timeOfDay,
  isImmersive = false,
  messagesRemaining
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    // Scroll the messages container directly (not scrollIntoView) so the
    // page itself never scrolls — only the message list moves.
    const el = messagesContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      // Slight delay to avoid conflict with animations
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isLoading]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      
      // Reset textarea height after the next render
      setTimeout(() => {
        if (inputRef.current) inputRef.current.style.height = 'auto';
      }, 0);
    }
  }, [inputValue, isLoading, disabled, onSendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px height
    textarea.style.height = `${newHeight}px`;
  };

  return (
    // Fill the flex column's remaining space exactly (no fixed vh calc):
    // the page root is 100dvh overflow-hidden, so flex-1 min-h-0 keeps the
    // composer on-screen on any viewport instead of overflowing below the fold.
    <div className={`flex flex-col w-full mx-auto flex-1 min-h-0 ${
      isImmersive 
        ? 'max-w-full' 
        : 'max-w-full sm:max-w-xl md:max-w-3xl'
    }`}>
      {/* Chat Messages */}
      <div ref={messagesContainerRef} className={`flex-1 min-h-0 overflow-y-auto space-y-3 md:space-y-4 backdrop-blur-md will-change-scroll bg-white/10 border border-white/20 ${
        isImmersive 
          ? 'p-4 md:p-6 rounded-3xl' 
          : 'p-4 md:p-6 rounded-t-3xl'
      }`}>
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ChatMessage message={message} timeOfDay={timeOfDay} />
          </div>
        ))}

        
        {isLoading && <TypingIndicator timeOfDay={timeOfDay} />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`flex-shrink-0 backdrop-blur-md bg-white/10 border border-white/20 p-3 md:p-4 ${
        isImmersive ? 'rounded-3xl mt-4' : 'rounded-b-3xl border-x border-b'
      }`}>
        {messagesRemaining !== undefined && messagesRemaining <= 2 && (
          <div className={`text-xs text-center mb-2 ${
            timeOfDay === 'morning' ? 'text-amber-700' : 'text-amber-300'
          }`}>
            {messagesRemaining} messages remaining in free session
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              rows={1}
              className={`w-full p-4 rounded-2xl border-0 transition-all duration-200 placeholder-opacity-70 resize-none ${
                timeOfDay === 'morning'
                  ? 'bg-white/20 text-gray-800 placeholder-gray-600 focus:bg-white/30'
                  : 'bg-black/20 text-white placeholder-gray-300 focus:bg-black/30'
              } backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ 
                minHeight: '48px',
                maxHeight: '96px',
                lineHeight: '1.5'
              }}
            />
            {/* Character count for longer messages */}
            {inputValue.length > 100 && (
              <div className={`absolute bottom-2 right-2 text-xs ${
                timeOfDay === 'morning' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {inputValue.length}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || disabled}
            className={`p-4 rounded-2xl font-medium transition-all duration-200 ${
              timeOfDay === 'morning'
                ? 'bg-white/20 hover:bg-white/30 text-gray-800'
                : 'bg-white/10 hover:bg-white/20 text-white'
            } backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[56px] min-h-[56px] focus:outline-none focus:ring-2 focus:ring-white/30`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        </form>
        
        {/* Helpful hints */}
        {!isImmersive && (
          <div className={`text-xs mt-1 text-center ${
            timeOfDay === 'morning' ? 'text-gray-600' : 'text-gray-400'
          } opacity-70`}>
            Press Enter to send
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;