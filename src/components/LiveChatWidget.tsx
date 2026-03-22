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

  // 1. Presence: Tell POS you are online
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUser.id } }
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: currentUser.id,
          email: currentUser.email || 'Customer',
          online_at: new Date().toISOString(),
        });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  // 2. Real-time Message Sync
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel('chat-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' as any }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === currentUser.id || msg.receiver_id === currentUser.id) {
          setMessages(prev => [...prev, msg]);
          if (!isOpen && msg.sender_id !== currentUser.id) setUnreadCount(prev => prev + 1);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, isOpen]);

  // 3. FORCE SEND FUNCTION
  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !currentUser?.id) return;

    console.log("Sending to Supabase...");
    const { error } = await (supabase as any).from('messages').insert([{
      sender_id: currentUser.id,
      content: text,
      receiver_id: null // Store/POS receiver
    }]);

    if (error) {
      console.error("FAILED TO SEND:", error.message);
    } else {
      console.log("SENT!");
      setNewMessage(""); // This clears the box so you know it worked
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  if (!session) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {isOpen && (
        <div className="w-80 h-[400px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col mb-4 overflow-hidden">
          <div className="bg-orange-600 p-3 flex justify-between items-center text-white">
            <span className="font-bold">Saucer Support</span>
            <X className="cursor-pointer" onClick={() => setIsOpen(false)} />
          </div>
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 bg-gray-950" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`p-2 rounded-lg text-sm max-w-[80%] ${m.sender_id === currentUser.id ? 'bg-orange-600 self-end text-white' : 'bg-gray-800 self-start text-gray-200'}`}>
                {m.content}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800 flex gap-2">
            <input 
              className="flex-1 bg-gray-800 text-white p-2 rounded text-sm outline-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Message..."
            />
            <button onClick={handleSendMessage} className="bg-orange-600 p-2 rounded text-white"><Send size={16} /></button>
          </div>
        </div>
      )}
      <button onClick={() => {setIsOpen(!isOpen); setUnreadCount(0)}} className="bg-orange-600 p-4 rounded-full text-white shadow-lg relative">
        {isOpen ? <X /> : <MessageCircle />}
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full text-[10px] flex items-center justify-center">{unreadCount}</span>}
      </button>
    </div>
  );
};

export default LiveChatWidget;