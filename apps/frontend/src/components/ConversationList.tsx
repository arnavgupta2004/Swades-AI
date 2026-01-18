import { useState, useEffect } from 'react';
import './ConversationList.css';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  messages: Array<{ content: string }>;
  _count?: { messages: number };
}

interface ConversationListProps {
  userId: string;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

function ConversationList({
  userId,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    // Refresh every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/chat/conversations?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      setConversations(data.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await fetch(`/api/chat/conversations/${id}?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete conversation');
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      if (selectedConversationId === id) {
        onNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    }
  };

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Conversations</h2>
        <button onClick={onNewConversation} className="new-conversation-btn">
          + New
        </button>
      </div>
      <div className="conversations">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="empty">No conversations yet</div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${
                selectedConversationId === conversation.id ? 'selected' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="conversation-title">
                {conversation.title || 'Untitled Conversation'}
              </div>
              <div className="conversation-preview">
                {conversation.messages[0]?.content.substring(0, 50) || 'No messages'}...
              </div>
              <div className="conversation-actions">
                <button
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  className="delete-btn"
                  title="Delete conversation"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ConversationList;