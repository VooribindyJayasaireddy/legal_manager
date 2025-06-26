import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, FileText, Bot as BotIcon, Plus, MessageSquare, Trash2, Edit3 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import FileAttachment from './FileAttachment';
import api from '../utils/api';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { aiService } from '../services/aiService';

// Helper function to load messages from localStorage
const loadMessages = () => {
  const savedMessages = localStorage.getItem('chatMessages');
  if (savedMessages) {
    try {
      const parsedMessages = JSON.parse(savedMessages);
      // Convert string timestamps back to Date objects
      return parsedMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Error parsing saved messages:', error);
      return [];
    }
  }
  // Default welcome message if no saved messages
  return [{ 
    id: 1, 
    text: "Hello! I'm your legal assistant. How can I help?", 
    sender: 'bot', 
    timestamp: new Date() 
  }];
};

// Helper function to generate a unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const AIChat = () => {
  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem('chatSessions');
    if (savedChats) {
      try {
        return JSON.parse(savedChats);
      } catch (error) {
        console.error('Error parsing saved chats:', error);
      }
    }
    // Create initial chat if none exists
    const initialChat = {
      id: generateId(),
      title: 'New Chat',
      messages: [
        { 
          id: 1, 
          text: "Hello! I'm your legal assistant. How can I help?", 
          sender: 'bot', 
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return [initialChat];
  });
  
  const [activeChatId, setActiveChatId] = useState(() => {
    const lastActive = localStorage.getItem('activeChatId');
    return lastActive || (chats[0]?.id || null);
  });
  
  // Get active chat messages using useMemo to prevent unnecessary recalculations
  const messages = useMemo(() => 
    chats.find(chat => chat.id === activeChatId)?.messages || [], 
    [chats, activeChatId]
  );
  
  // Update active chat when chats change
  useEffect(() => {
    if (chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId, setActiveChatId]);
  
  // Save chats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatSessions', JSON.stringify(chats));
      if (activeChatId) {
        localStorage.setItem('activeChatId', activeChatId);
      }
    } catch (error) {
      console.error('Error saving chats to localStorage:', error);
    }
  }, [chats, activeChatId]);
  
  // Create a new chat
  const createNewChat = () => {
    const newChat = {
      id: generateId(),
      title: 'New Chat',
      messages: [
        { 
          id: 1, 
          text: "Hello! I'm your legal assistant. How can I help?", 
          sender: 'bot', 
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setChats(prevChats => [newChat, ...prevChats]);
    setActiveChatId(newChat.id);
  };
  
  // Switch to a different chat
  const switchChat = (chatId) => {
    setActiveChatId(chatId);
  };
  
  // Delete a chat
  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    if (chats.length <= 1) {
      toast.error('You must have at least one chat');
      return;
    }
    
    const confirmation = window.confirm('Are you sure you want to delete this chat?');
    if (confirmation) {
      setChats(prevChats => {
        const newChats = prevChats.filter(chat => chat.id !== chatId);
        // If we deleted the active chat, switch to the first available chat
        if (chatId === activeChatId && newChats.length > 0) {
          setActiveChatId(newChats[0].id);
        }
        return newChats;
      });
    }
  };
  
  // Update chat title
  const updateChatTitle = (chatId, newTitle) => {
    if (!newTitle.trim()) return; // Don't allow empty titles
    
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: newTitle, updatedAt: new Date().toISOString() }
          : chat
      )
    );
    setEditingChatId(null);
    setChatTitleInput('');
  };

  // Start editing chat title
  const startEditingTitle = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setChatTitleInput(currentTitle);
    // Focus the input field after it's rendered
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 0);
  };

  // Handle title input key down
  const handleTitleKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      updateChatTitle(chatId, chatTitleInput);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
      setChatTitleInput('');
    }
  };
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [chatTitleInput, setChatTitleInput] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);

  // Update chat title based on first user message
  useEffect(() => {
    if (messages.length === 2 && messages[1].sender === 'user') {
      const activeChat = chats.find(chat => chat.id === activeChatId);
      // Only auto-update title if it's still the default 'New Chat'
      if (activeChat && activeChat.title === 'New Chat') {
        const firstUserMessage = messages[1].text.substring(0, 30);
        updateChatTitle(activeChatId, firstUserMessage + (messages[1].text.length > 30 ? '...' : ''));
      }
    }
  }, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateMessages = (newMessages) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === activeChatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, ...newMessages],
              updatedAt: new Date().toISOString() 
            }
          : chat
      )
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    // Create user message with file info if present
    const messageText = input || `File: ${selectedFile.name}`;
    const userMessage = { 
      id: Date.now(), 
      text: messageText,
      sender: 'user', 
      timestamp: new Date().toISOString(),
      ...(selectedFile && { file: selectedFile.name })
    };
    
    // First, update the UI with the user's message immediately
    updateMessages([userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let fileContent = '';
      
      // Read file content if present
      if (selectedFile) {
        try {
          // Read file as text
          fileContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(selectedFile);
          });
        } catch (error) {
          console.error('Error reading file:', error);
          toast.error('Failed to read the uploaded file');
          setIsLoading(false);
          setSelectedFile(null);
          return;
        }
      }

      // Prepare context with file content if available
      const contextData = {};
      if (fileContent) {
        contextData.fileContent = fileContent;
        contextData.fileName = selectedFile.name;
      }

      // Prepare the message to send to AI
      const messageToSend = input || `Please analyze the attached file: ${selectedFile.name}`;

      // Send message to AI service
      const response = await aiService.sendChatMessage({
        message: messageToSend,
        chatHistory: messages,
        contextData
      });

      // Add AI response to messages
      const botReply = {
        id: Date.now() + 1,
        text: response?.response || 'I have processed your request. How can I assist you further?',
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      // Update with bot's response
      updateMessages([botReply]);
      setSelectedFile(null); // Clear selected file after successful processing

    } catch (error) {
      console.error('Error processing message:', error);
      toast.error(error.response?.data?.message || 'Error processing your request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <div className="h-full flex flex-col bg-gray-900">
        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Dark Gray Theme */}
          <div className="w-72 bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col border-r border-gray-700 overflow-hidden">

            
            <div className="p-4 border-b border-gray-700 bg-gray-900">
              <button
                onClick={createNewChat}
                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium shadow-lg hover:shadow-gray-500/20 transition-all duration-200 border border-gray-600"
              >
                <Plus size={18} className="text-white" />
                <span>New Consultation</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-2">
              <div className="py-1 px-1">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => switchChat(chat.id)}
                    className={`group relative flex items-center justify-between p-3 rounded-lg mx-2 transition-all duration-200 ${
                      activeChatId === chat.id
                        ? 'bg-gray-700/80 backdrop-blur-sm shadow-lg shadow-gray-500/10 border border-gray-600'
                        : 'hover:bg-gray-700/50 border border-transparent hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full min-w-0">
                      <div className={`p-1.5 rounded-lg ${
                        activeChatId === chat.id 
                          ? 'bg-gray-600 text-white' 
                          : 'bg-gray-700/50 text-gray-300'
                      }`}>
                        <MessageSquare size={16} className="shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingChatId === chat.id ? (
                          <input
                            type="text"
                            value={chatTitleInput}
                            onChange={(e) => setChatTitleInput(e.target.value)}
                            onKeyDown={(e) => handleTitleKeyDown(e, chat.id)}
                            onBlur={() => updateChatTitle(chat.id, chatTitleInput)}
                            className="w-full bg-transparent border-b border-gray-500/30 focus:border-gray-400 focus:outline-none text-sm text-white placeholder-gray-400"
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Chat title"
                          />
                        ) : (
                          <div 
                            className="text-sm font-medium text-white truncate"
                            onDoubleClick={() => startEditingTitle(chat.id, chat.title)}
                          >
                            {chat.title}
                          </div>
                        )}
                        <div className="text-xs text-gray-400/80 mt-0.5">
                          {new Date(chat.updatedAt || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className={`p-1 rounded-full transition-colors ${
                        activeChatId === chat.id 
                          ? 'text-white/70 hover:text-white' 
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title="Delete chat"
                    >
                      <Trash2 size={16} className="shrink-0" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-700 mt-auto">
              <div className="text-xs text-center text-gray-400">
                Powered by Legal AI Assistant
              </div>
            </div>
          </div>

          {/* Chat Area - Dark Gray Theme */}
          <div className="flex-1 flex flex-col bg-gray-900 min-h-0">
            {/* Header */}
            <header className="bg-gray-800 shadow-sm px-6 py-3 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg border border-blue-500 shadow-md">
                    <BotIcon size={20} className="text-white" />
                  </div>
                  <h1 className="text-lg font-semibold tracking-tight text-gray-100">Legal AI Assistant</h1>
                </div>
                <div className="flex items-center gap-2">
                </div>
              </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-700">
                      <Loader2 className="animate-spin text-gray-300" size={24} />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Chat Input */}
            <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 shadow-sm flex-shrink-0">
              {selectedFile && <FileAttachment file={selectedFile} onRemove={removeFile} />}
              
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Type your legal question or upload a document..."
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <div className="relative">
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        disabled={isLoading}
                      />
                      <FileText
                        className={`transition-colors ${
                          isLoading ? 'text-gray-500' : 'text-gray-400 hover:text-blue-400'
                        } cursor-pointer`}
                        size={16}
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !selectedFile)}
                  className={`p-2 rounded-lg transition ${
                    isLoading || (!input.trim() && !selectedFile)
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIChat;
