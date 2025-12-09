import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import api from '../../services/api';
import type { ChatMessageResponse } from '../../types/api';

interface ChatProps {
  userId: string;
}

export function Chat({ userId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await api.getChatMessages();
        setMessages(data.messages);
      } catch (error) {
        console.error('Failed to load chat messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const message = await api.sendChatMessage(userId, { message: newMessage.trim() });
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-cocoa/30 backdrop-blur-md rounded-2xl border border-gold/20 p-6 sm:p-8 shadow-warm-lg">
      <h2 className="text-2xl font-display text-snow mb-6">Chat</h2>

      {/* Messages Container */}
      <div className="mb-4 h-[300px] overflow-y-auto pr-2 space-y-3 chat-scrollbar">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-snow/70 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-2 text-sm">Loading messages...</span>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-snow/50 text-center py-8 italic">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg) => {
          const isCurrentUser = msg.user_id === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-xl p-3 ${
                  isCurrentUser
                    ? 'bg-gradient-to-br from-cranberry to-holly text-snow'
                    : 'bg-snow/10 text-snow border border-snow/20'
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {isCurrentUser ? 'You' : `${msg.user_first_name} ${msg.user_last_name}`}
                  </span>
                  <span className="text-xs opacity-70">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 bg-snow/10 text-snow placeholder:text-snow/40 px-4 py-3 rounded-lg border border-snow/20 focus:border-gold/50 outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-4 py-3 bg-gradient-to-r from-cranberry to-holly text-snow rounded-lg hover:from-cranberry-dark hover:to-holly-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <Send size={18} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}

