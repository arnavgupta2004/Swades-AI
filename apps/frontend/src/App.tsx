import { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ConversationList from './components/ConversationList';
import './App.css';

// For demo: Use email to identify user (in production, use authenticated user ID)
// The seed data creates users with emails: john.doe@example.com and jane.smith@example.com
const DEFAULT_USER_EMAIL = 'john.doe@example.com';

function App() {
  const [userId, setUserId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    setConversationId(selectedConversationId);
  }, [selectedConversationId]);

  // Fetch user ID by email on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch(`/api/users/by-email?email=${DEFAULT_USER_EMAIL}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUserId(data.data.id);
      } catch (error) {
        console.error('Error fetching user:', error);
        // Fallback: use email as userId (backend will handle it)
        setUserId(DEFAULT_USER_EMAIL);
      }
    };
    fetchUserId();
  }, []);

  if (!userId) {
    return (
      <div className="app">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-container">
        <ConversationList
          userId={userId}
          selectedConversationId={conversationId}
          onSelectConversation={(id) => setSelectedConversationId(id)}
          onNewConversation={() => setSelectedConversationId(null)}
        />
        <ChatInterface
          userId={userId}
          conversationId={conversationId}
          onNewMessage={() => {
            // Refresh conversation list
          }}
        />
      </div>
    </div>
  );
}

export default App;