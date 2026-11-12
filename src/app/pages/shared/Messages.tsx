// src/app/pages/shared/Messages.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Send, ArrowLeft } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

interface Message {
  from: string;
  text: string;
  time: Timestamp;
}

interface Conversation {
  id: string;
  participants?: string[];
  participantNames?: Record<string, string>;
  participantAvatars?: Record<string, string>;
  participantRoles?: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  unreadCount?: Record<string, number>;
  messages?: Message[];
}

const formatTime = (timestamp?: Timestamp) => {
  if (typeof timestamp?.toDate !== 'function') return '';
  return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const initial = (name: string) => (name.trim()[0] || '?').toUpperCase();

export default function Messages() {
  const { currentUser } = useApp();
  const [searchParams] = useSearchParams();
  const toId = searchParams.get('to');
  const toName = searchParams.get('name');
  const toRole = searchParams.get('role');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const creatingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Live inbox.
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const convs: Conversation[] = [];
        snapshot.forEach((d) => convs.push({ id: d.id, ...d.data() } as Conversation));
        convs.sort((a, b) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0));
        setConversations(convs);
        setLoading(false);
      },
      (e) => {
        console.error('Error loading conversations:', e);
        setError('Could not load your messages.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // "Message" buttons link here with ?to=...; open that chat, creating it once if needed.
  useEffect(() => {
    creatingRef.current = false;
  }, [toId]);

  useEffect(() => {
    if (!currentUser?.uid || !toId || toId === currentUser.uid || loading) return;
    const existing = conversations.find((c) => c.participants?.includes(toId));
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    if (creatingRef.current) return;
    creatingRef.current = true;
    const id = [currentUser.uid, toId].sort().join('_');
    const meName = currentUser.name || 'User';
    const otherName = toName || 'User';
    setDoc(
      doc(db, 'conversations', id),
      {
        participants: [currentUser.uid, toId].sort(),
        participantNames: { [currentUser.uid]: meName, [toId]: otherName },
        participantAvatars: { [currentUser.uid]: initial(meName), [toId]: initial(otherName) },
        participantRoles: { [currentUser.uid]: currentUser.role, [toId]: toRole || 'customer' },
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        unreadCount: { [currentUser.uid]: 0, [toId]: 0 },
        messages: [],
      },
      { merge: true }
    )
      .then(() => setSelectedId(id))
      .catch((e) => {
        console.error('Error starting conversation:', e);
        setError('Could not start the conversation. Please try again.');
        creatingRef.current = false;
      });
  }, [currentUser, toId, toName, toRole, conversations, loading]);

  const selected = conversations.find((c) => c.id === selectedId) || null;

  // Opening a chat clears its unread badge.
  const myUnread = Number(selected?.unreadCount?.[currentUser?.uid || '']) || 0;
  useEffect(() => {
    if (!selected || !currentUser?.uid || myUnread === 0) return;
    updateDoc(doc(db, 'conversations', selected.id), {
      [`unreadCount.${currentUser.uid}`]: 0,
    }).catch((e) => console.error('Error clearing unread:', e));
  }, [selected?.id, currentUser?.uid, myUnread]);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [selected?.messages?.length]);

  const sendMessage = async () => {
    if (!inputText.trim() || !selected || !currentUser?.uid) return;
    const text = inputText.trim();
    const otherId = selected.participants?.find((p) => p !== currentUser.uid);
    if (!otherId) return;
    try {
      await updateDoc(doc(db, 'conversations', selected.id), {
        messages: [
          ...(selected.messages || []),
          { from: currentUser.uid, text, time: Timestamp.now() },
        ],
        lastMessage: text,
        lastMessageTime: Timestamp.now(),
        unreadCount: { ...(selected.unreadCount || {}), [otherId]: (Number(selected.unreadCount?.[otherId]) || 0) + 1 },
      });
      setInputText('');
      setError('');
    } catch (e) {
      console.error('Error sending message:', e);
      setError('Message not sent. Please try again.');
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    const otherId = conv.participants?.find((p) => p !== currentUser?.uid);
    if (!otherId) return null;
    const name = conv.participantNames?.[otherId] || 'User';
    return {
      name,
      avatar: conv.participantAvatars?.[otherId] || initial(name),
      role: conv.participantRoles?.[otherId] || 'customer',
    };
  };

  const unreadTotal = conversations.reduce(
    (sum, c) => sum + (Number(c.unreadCount?.[currentUser?.uid || '']) || 0),
    0
  );

  if (loading) {
    return (
      <Layout title="Messages">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Messages">
      <div className="flex h-[calc(100vh-114px)] md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Inbox List */}
        <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 bg-white border-r border-gray-100`}>
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm" style={{ color: C.dark }}>Messages</h3>
            <p className="text-xs text-gray-400 mt-0.5">{unreadTotal} unread</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {error && <p className="px-4 py-2 text-xs text-red-500">{error}</p>}
            {conversations.map(conv => {
              const other = getOtherParticipant(conv);
              if (!other) return null;
              const unread = Number(conv.unreadCount?.[currentUser?.uid || '']) || 0;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left"
                  style={{ background: selected?.id === conv.id ? '#FDF5F2' : undefined }}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ background: other.role === 'tailor' ? C.primary : other.role === 'seller' ? C.teal : C.dark }}
                    >
                      {other.avatar}
                    </div>
                    {unread > 0 && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ background: C.primary }}
                      >
                        {unread}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm truncate" style={{ color: C.dark }}>{other.name}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessage || 'No messages yet'}</p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block"
                      style={{
                        background: other.role === 'tailor' ? '#FDF5F2' : '#E8F8F6',
                        color: other.role === 'tailor' ? C.primary : C.teal,
                      }}
                    >
                      {other.role === 'tailor' ? 'Tailor' : other.role === 'seller' ? 'Seller' : 'Customer'}
                    </span>
                  </div>
                </button>
              );
            })}
            {conversations.length === 0 && (
              <div className="text-center py-12 text-gray-400 px-6">
                <Send size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs mt-1">Open a shop or tailor profile and tap Message to start a chat.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat View */}
        {selected ? (
          <div className="flex-1 flex flex-col bg-white md:bg-gray-50">
            <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
              <button onClick={() => setSelectedId(null)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft size={18} style={{ color: C.dark }} />
              </button>
              {(() => {
                const other = getOtherParticipant(selected);
                if (!other) return null;
                return (
                  <>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ background: other.role === 'tailor' ? C.primary : other.role === 'seller' ? C.teal : C.dark }}
                    >
                      {other.avatar}
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: C.dark }}>{other.name}</p>
                      <p className="text-xs text-gray-400">
                        {other.role === 'tailor' ? 'Tailor' : other.role === 'seller' ? 'Seller' : 'Customer'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(selected.messages || []).length === 0 && (
                <p className="text-center text-xs text-gray-400 py-8">No messages yet. Say hello 👋</p>
              )}
              {(selected.messages || []).map((msg, idx) => {
                const isMe = msg.from === currentUser?.uid;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm"
                      style={{
                        background: isMe ? C.primary : 'white',
                        color: isMe ? 'white' : C.dark,
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      <p className="text-xs mt-1 opacity-60">{formatTime(msg.time)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {error && <p className="px-4 py-1 text-xs text-red-500 bg-white border-t border-gray-100">{error}</p>}

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKey}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none bg-gray-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ background: C.primary }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 text-gray-400 text-sm">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Send size={24} className="opacity-40" />
              </div>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
