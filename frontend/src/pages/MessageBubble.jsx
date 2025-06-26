import React from 'react';
import { User, Bot, MessageSquare, Trash2, Loader2, Send, FileText, Plus, Bot as BotIcon } from 'lucide-react';
import { motion } from 'framer-motion';

// User avatar component
const UserAvatar = () => (
  <div className="flex-shrink-0 bg-blue-600 p-2 rounded-full text-white">
    <User size={16} />
  </div>
);

// Bot avatar component
const BotAvatar = () => (
  <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full text-blue-600">
    <BotIcon size={16} />
  </div>
);

const formatText = (text) => {
  if (!text) return [];
  
  // Split text into paragraphs and process each one
  return text.split('\n\n').map((paragraph, i) => {
    // Skip empty paragraphs
    if (!paragraph.trim()) return null;
    
    // Check if this is a list item
    if (/^\s*[-*+]\s+/.test(paragraph) || /^\s*\d+\.\s+/.test(paragraph)) {
      // Process list items
      const items = paragraph.split('\n').map((item, idx) => {
        const content = item.replace(/^\s*[-*+]\s+|^\s*\d+\.\s+/, '');
        return <li key={idx} className="mb-1">{content}</li>;
      });
      
      const isOrdered = /^\s*\d+\.\s+/.test(paragraph);
      return isOrdered 
        ? <ol key={i} className="list-decimal pl-5 space-y-1 mb-3">{items}</ol>
        : <ul key={i} className="list-disc pl-5 space-y-1 mb-3">{items}</ul>;
    }
    
    // Process headers (lines that start with # followed by text)
    if (/^#+\s+.+/.test(paragraph)) {
      const headerText = paragraph.replace(/^#+\s+/, '');
      return <p key={i} className="font-semibold mb-3 text-base">{headerText}</p>;
    }
    
    // Process bold text (wrapped in ** **)
    const parts = [];
    let lastIndex = 0;
    let match;
    
    const boldRegex = /\*\*(.*?)\*\*/g;
    
    while ((match = boldRegex.exec(paragraph)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(paragraph.substring(lastIndex, match.index));
      }
      // Add the bold text
      parts.push(<strong key={`${i}-${match.index}`} className="font-semibold">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < paragraph.length) {
      parts.push(paragraph.substring(lastIndex));
    }
    
    return <p key={i} className="mb-3 last:mb-0">{parts.length ? parts : paragraph}</p>;
  });
};

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-4`}
    >
      {!isUser ? (
        <div className="flex-shrink-0 mr-3">
          <BotAvatar />
        </div>
      ) : null}
      
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
          <div className="flex items-end gap-2">
            {isUser ? (
              <div className="flex items-end gap-2.5">
                <div className="relative group">
                  {/* Message bubble */}
                  <div className="relative bg-white/10 backdrop-blur-md text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-xl text-sm leading-relaxed 
                    border border-white/20 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl -z-10" />
                    {/* Message content */}
                    <div className="relative z-10">
                      {formatText(message.text)}
                    </div>
                    {/* Timestamp */}
                    <div className="absolute -bottom-5 right-0 text-[10px] text-white/60 font-medium">
                      {timestamp}
                    </div>
                  </div>
                </div>
                {/* User avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center 
                  shadow-lg border-2 border-white/80 backdrop-blur-sm transition-transform duration-200 hover:scale-110">
                  <User size={16} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm text-sm leading-relaxed">
                {formatText(message.text)}
              </div>
            )}
          </div>
          <div 
            className={`text-xs mt-1 ${isUser ? 'text-gray-500 pr-2' : 'text-gray-400 pl-2'}`}
          >
            {timestamp}
          </div>
        </div>
      </div>
      
      {!isUser && <div className="w-10"></div>}
    </motion.div>
  );
};

export default MessageBubble;
