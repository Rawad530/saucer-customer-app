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
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUser = session?.user;

  // 1. Sync Messages
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

    const channel = supabase.channel('chat-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' as any 
      }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === currentUser.id || msg.receiver_id === currentUser.id) {
          setMessages(prev => [...prev, msg]);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  // 2. SEND MESSAGE - The part that counts
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!currentUser?.id) {
      alert("Error: No User ID found in session. Try logging out and back in.");
      return;
    }

    const payload = {
      sender_id: currentUser.id, // This is the real UUID from Supabase Auth
      content: newMessage.trim(),
      receiver_id: null,
    };

    console.log("Sending payload:", payload);

    const { error } = await (supabase as any)
      .from('messages')
      .insert([payload]);
    
    if (error) {
      // THIS WILL TELL US THE TRUTH
      alert("DATABASE REJECTED MESSAGE: " + error.message);
    } else {
      setNewMessage(""); // Clear the box on success
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  if (!session) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="w-80 h-[450px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col mb-4 overflow-hidden">
          <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
            <span className="font-bold text-sm uppercase">Saucer Support</span>
            <button onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-950 flex flex-col gap-3" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                msg.sender_id === currentUser.id ? 'bg-orange-600 text-white self-end' : 'bg-gray-800 text-gray-200 self-start'
              }`}>{msg.content}</div>
            ))}
          </div>
          <div className="p-4 bg-gray-900 border-t border-gray-800 flex gap-2">
            <input 
              className="flex-1 bg-gray-800 border-none rounded-xl px-4 py-2 text-white text-sm outline-none"
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Message..."
            />
            <button onClick={handleSendMessage} className="bg-orange-600 p-2 rounded-xl text-white"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="bg-orange-600 text-white p-4 rounded-full shadow-2xl">
        <MessageCircle className="w-7 h-7" />
      </button>
    </div>
  );
};

export default LiveChatWidget;