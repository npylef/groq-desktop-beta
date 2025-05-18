import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const ChatContext = createContext();

// Create a provider component
export const ChatProvider = ({ children }) => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshList = async () => {
    const list = await window.electron.listConversations();
    setConversations(list);
  };

  const loadConversation = async (id) => {
    const { messages, title } = await window.electron.loadConversation(id);
    setConversationId(id);
    setMessages(messages);
    setTitle(title);
  };

  const createConversation = async () => {
    const id = await window.electron.createConversation();
    await refreshList();
    await loadConversation(id);
  };

  const importConversation = async () => {
    const id = await window.electron.importConversation();
    if (id) {
      await refreshList();
      await loadConversation(id);
    }
  };

  const branchConversation = async (index) => {
    const id = await window.electron.createConversation();
    const subset = messages.slice(0, index + 1);
    window.electron.saveConversation({ id, messages: subset, title });
    await refreshList();
    await loadConversation(id);
  };

  const editMessage = (index, newContent) => {
    setMessages(prev => {
      const arr = [...prev];
      if (arr[index]) arr[index].content = newContent;
      return arr;
    });
  };

  useEffect(() => {
    refreshList();
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      loadConversation(conversations[0].id);
    }
  }, [conversations]);

  useEffect(() => {
    if (messages.length > 0 && title === conversationId) {
      const first = messages.find(m => m.role === 'user');
      if (first) {
        let text = '';
        if (typeof first.content === 'string') {
          text = first.content;
        } else if (Array.isArray(first.content)) {
          text = first.content.filter(p => p.type === 'text').map(p => p.text).join(' ');
        }
        if (text) {
          setTitle(text.slice(0, 20));
        }
      }
    }
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      window.electron.saveConversation({ id: conversationId, messages, title });
    }
  }, [messages, title, conversationId]);

  const value = {
    conversationId,
    messages,
    setMessages,
    conversations,
    loadConversation,
    createConversation,
    importConversation,
    branchConversation,
    editMessage,
    title,
    setTitle,
    searchQuery,
    setSearchQuery,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Create a custom hook for easy context consumption
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 