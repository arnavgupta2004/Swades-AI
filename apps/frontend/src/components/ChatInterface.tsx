import { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentType?: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  userId: string;
  conversationId: string | null;
  onNewMessage?: () => void;
}

const THINKING_WORDS = [
  'Analyzing',
  'Thinking',
  'Processing',
  'Understanding',
  'Researching',
  'Considering',
  'Evaluating',
];

function ChatInterface({ userId, conversationId, onNewMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingWord, setThinkingWord] = useState('Thinking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTyping) {
      interval = setInterval(() => {
        setThinkingWord(THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)]);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      const data = await response.json();
      setMessages(data.data.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async (stream: boolean = true) => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    // Add user message immediately
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          conversationId,
          message: userMessage,
          stream,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (stream && response.body) {
        setIsTyping(false);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';
        let messageId = (Date.now() + 1).toString();

        // Add empty assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantMessage += chunk;

          // Update the assistant message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, content: assistantMessage } : msg
            )
          );
          scrollToBottom();
        }

        // Conversation ID is updated on server side, trigger reload if needed
        if (onNewMessage) onNewMessage();
      } else {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.message,
          agentType: data.data.agentType,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);

        // Update conversation ID if new
        if (data.data.conversationId && !conversationId) {
          if (onNewMessage) onNewMessage();
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${error.message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(true);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h1>Swades AI Support</h1>
        {conversationId && (
          <button onClick={() => window.location.reload()} className="new-chat-btn">
            New Chat
          </button>
        )}
      </div>
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <h2>Welcome to Swades AI Customer Support</h2>
            <p>Ask me anything about orders, billing, or general support!</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              <div className="message-header">
                <strong>{message.role === 'user' ? 'You' : 'Assistant'}</strong>
                {message.agentType && (
                  <span className="agent-badge">{message.agentType.toLowerCase()}</span>
                )}
              </div>
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message assistant typing">
            <div className="message-content">
              <div className="message-header">
                <strong>Assistant</strong>
              </div>
              <div className="typing-indicator">{thinkingWord}...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="message-input"
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;