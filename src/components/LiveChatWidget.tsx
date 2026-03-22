import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "../lib/supabaseClient"; 
import { Session } from '@supabase/supabase-js';

interface LiveChatWidgetProps {
  session: Session | null;
}

const LiveChatWidget = ({ session }: LiveChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUser = session?.user;

  // 1. Broadcast Presence (Tell POS the user is online)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // 2. Listen for Chat Messages
  useEffect(() => {
    if (!currentUser) return;

    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    const messageChannel = supabase.channel('website-chat')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' as any 
      }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === currentUser.id || msg.receiver_id === currentUser.id) {
          setMessages(prev => [...prev, msg]);
          if (!isOpen && msg.sender_id !== currentUser.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const msg = {
      sender_id: currentUser.id,
      content: newMessage.trim(),
    };

    const { error } = await (supabase as any).from('messages').insert([msg]);
    if (!error) setNewMessage("");
  };

  // Only show chat if logged in
  if (!session) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      {isOpen && (
        <div className="w-80 h-[450px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col mb-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Saucer Support</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-orange-700 p-1 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-900 flex flex-col gap-3" ref={scrollRef}>
            {messages.length === 0 && (
              <p className="text-xs text-gray-500 text-center my-auto italic">How can we help with your order today?</p>
            )}
            {messages.map((msg, idx) => (
              <div 
                key={msg.id || idx}
                className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                  msg.sender_id === currentUser.id 
                    ? 'bg-orange-600 text-white self-end rounded-br-none' 
                    : 'bg-gray-800 text-gray-200 self-start rounded-bl-none border border-gray-700'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask us anything..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
            />
            <button 
              onClick={handleSendMessage}
              className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-xl transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => { setIsOpen(!isOpen); setUnreadCount(0); }}
        className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-2xl transform transition-all hover:scale-110 active:scale-90 flex items-center justify-center relative border-2 border-orange-500/20"
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-gray-900 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default LiveChatWidget;