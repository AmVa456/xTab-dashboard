import { useState, useRef, useEffect } from "react";
import { useAIChat, useAIStatus } from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: aiStatus } = useAIStatus();
  const chatMutation = useAIChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const result = await chatMutation.mutateAsync({
        message: userMessage.content,
        context: messages.length > 0 
          ? messages.slice(-3).map(m => `${m.role}: ${m.content}`).join("\n")
          : undefined,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        suggestions: result.suggestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!aiStatus?.enabled) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-xtab-pink" />
            <CardTitle>AI Assistant</CardTitle>
          </div>
          <CardDescription>Get help with content creation and ideas</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              AI features are currently disabled. Contact your administrator to enable them.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-xtab-pink" />
          <CardTitle>AI Assistant</CardTitle>
        </div>
        <CardDescription>
          Ask for content ideas, writing tips, or optimization suggestions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-xtab-pink/50" />
              <p className="text-sm">Start a conversation with the AI assistant</p>
              <p className="text-xs mt-2">Try: "Give me ideas for a LinkedIn post about AI"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-xtab-pink text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-semibold mb-2">Suggestions:</p>
                        <ul className="text-xs space-y-1">
                          {message.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-xtab-pink mt-0.5">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 flex-shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about content creation..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={chatMutation.isPending}
            aria-label="Chat message input"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="px-3"
            aria-label="Send message"
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
