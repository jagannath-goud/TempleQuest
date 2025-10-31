import { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Sparkles } from "lucide-react";

const MitraChat = ({ onClose }) => {
  const { token } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! I'm Mitra, your guide to India's sacred temples. Ask me anything about temple history, deities, festivals, or visiting guidelines."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat/mitra`,
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const assistantMessage = { role: "assistant", content: response.data.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error", error);
      toast.error("Failed to get response from Mitra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent data-testid="mitra-chat-modal" className="sm:max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold text-amber-900">
            <Sparkles className="w-6 h-6 mr-2 text-amber-600" />
            <span style={{ fontFamily: 'Spectral, serif' }}>Chat with Mitra</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 pr-4">
          <div data-testid="chat-messages" className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                data-testid={`chat-message-${idx}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                      : "bg-amber-50 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-amber-50 text-gray-800 rounded-lg p-4">
                  <p>Mitra is thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex space-x-2 pt-4 border-t">
          <Input
            data-testid="chat-input"
            type="text"
            placeholder="Ask about temples, deities, festivals..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !loading && sendMessage()}
            disabled={loading}
          />
          <Button
            data-testid="chat-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MitraChat;