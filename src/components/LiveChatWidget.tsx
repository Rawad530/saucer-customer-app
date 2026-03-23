import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
// FIX 1: Point to the singleton client we just built
import { supabase } from "@/integrations/supabase/client"; 
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
  
  // FIX 2: Use a ref for isOpen so the websocket doesn't crash when you click the chat button
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const currentUser = session?.user;
  const currentUserId = currentUser?.id;
  const currentUserEmail = currentUser?.email;

  // 1. THE BEACON: Tells the POS exactly who is online
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel('saucer-presence-room', {
      config: { presence: { key: currentUserId } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Customer presence engine synced.');
      })
      .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: currentUserId,
          email: currentUserEmail || 'Customer',
          online_at: new Date().toISOString(),
        });
        console.log("🟢 Presence beacon active - POS can see you now.");
      }
    });

    // FIX 3: Restore the cleanup function since the singleton is fixed!
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, currentUserEmail]);

  // 2. LIVE MESSAGE LISTENER: Loads history and listens for manager replies
  useEffect(() => {
    if (!currentUserId) return; 

    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) {
        setMessages(data);
      } else {
        setTimeout(() => {
          setMessages(prev => {
            if (prev.length > 0) return prev; 
            
            // Safe check: Only pop the badge if the chat is currently closed
            if (!isOpenRef.current) {
              setUnreadCount(prevCount => prevCount + 1);
            }

            return [{
              id: 'system-greeting',
              sender_id: 'system', 
              content: "👋 Welcome to Saucer Burger and Wrap! Let us know if you need any help deciding or placing your order.",
              created_at: new Date().toISOString()
            }];
          });
        }, 4000); 
      }
    };

    fetchMessages();

    const messageChannel = supabase.channel(`chat-customer-${currentUserId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' as any 
      }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === currentUserId || msg.receiver_id === currentUserId) {
          setMessages(prev => {
            const filteredPrev = prev.filter(p => p.id !== 'system-greeting');
            return [...filteredPrev, msg];
          });
          
          if (!isOpenRef.current && msg.sender_id !== currentUserId) {
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(messageChannel); };
    // FIX 4: Removed isOpen and currentUser from dependency array to stop violent reconnects
  }, [currentUserId]);

  // 3. SEND FUNCTION: Pushes message to the database
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const payload = {
      sender_id: currentUserId,
      content: newMessage.trim(),
      receiver_id: null, 
    };

    const { error } = await (supabase as any).from('messages').insert([payload]);
    
    if (error) {
      console.error("SEND FAILED:", error.message);
      alert("Database error: " + error.message);
    } else {
      setNewMessage(""); 
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!session) return null; 

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="w-80 h-[450px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col mb-4 overflow-hidden">
          <div className="bg-orange-600 text-white p-4 flex justify-between items-center shrink-0">
            <span className="font-bold text-sm uppercase tracking-widest">Saucer Support</span>
            <button onClick={() => setIsOpen(false)} className="hover:bg-orange-700 p-1 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-gray-950 flex flex-col gap-3" ref={scrollRef}>
            {messages.length === 0 && (
              <p className="text-xs text-center text-gray-500 my-auto">How can we help you today?</p>
            )}
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                msg.sender_id === currentUserId 
                  ? 'bg-orange-600 text-white self-end rounded-br-sm' 
                  : 'bg-gray-800 text-gray-200 self-start rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2 shrink-0">
            <input 
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all"
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask us anything..."
            />
            <button onClick={handleSendMessage} className="bg-orange-600 p-2.5 rounded-xl text-white hover:bg-orange-700 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => { setIsOpen(!isOpen); setUnreadCount(0); }} 
        className="bg-orange-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform relative"
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 border-2 border-white text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default LiveChatWidget;