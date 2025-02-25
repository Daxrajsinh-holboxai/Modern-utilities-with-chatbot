import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { MessageCircle, X, Send } from "lucide-react";

const B_url = import.meta.env.VITE_URL || "http://localhost:5000";
const socket = io(B_url);

const Chatbot = () => {
  const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId") || "");
  const [chat, setChat] = useState(
    JSON.parse(localStorage.getItem("chat")) || [
      { sender: "bot", message: "Hi there! How can I assist you today?" },
    ]
  );
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const chatEndRef = useRef(null);
  const [receivedMessages, setReceivedMessages] = useState(new Set());

  useEffect(() => {
    if (!sessionId) {
      axios.post(`${B_url}/start-session`).then((res) => {
        const newSessionId = res.data.sessionId;
        setSessionId(newSessionId);
        localStorage.setItem("sessionId", newSessionId);
      });
    } else {
      socket.emit("join", sessionId);

      // Listen for messages from the server
      const handleReply = (data) => {
        if (!receivedMessages.has(data.message)) {
          setChat((prev) => [...prev, { sender: "owner", message: data.message }]);
          setReceivedMessages((prev) => new Set(prev.add(data.message)));
        }
      };

      socket.on(`reply-${sessionId}`, handleReply);

      // Cleanup function to remove the event listener
      return () => {
        socket.off(`reply-${sessionId}`, handleReply);
      };
    }
  }, [sessionId]);
  useEffect(() => {
    localStorage.setItem("chat", JSON.stringify(chat));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await axios.post(`${B_url}/send-message`, { sessionId, message });
      setChat((prev) => [...prev, { sender: "user", message }]);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const clearSession = () => {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("chat");
    setSessionId("");
    setChat([{ sender: "bot", message: "Hi there! How can I assist you today?" }]);
    setReceivedMessages(new Set()); // Reset the receivedMessages set when clearing the session
  };

  // Utility function to style messages differently based on sender
  const getMessageClasses = (sender) => {
    if (sender === "user") {
      return "bg-blue-100 self-end text-blue-900";
    } else if (sender === "owner") {
      return "bg-green-100 self-start text-green-900";
    }
    // default (bot)
    return "bg-gray-100 self-start text-gray-900";
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end">
      {/* Floating button to open chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg focus:outline-none"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="flex flex-col w-80 max-w-full h-96 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2">
            <h2 className="font-bold text-lg">Chat Support</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white focus:outline-none"
            >
              <X size={22} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 flex flex-col space-y-2 p-3 overflow-y-auto">
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`px-3 py-2 max-w-xs rounded-md text-sm break-words ${getMessageClasses(
                  msg.sender
                )}`}
              >
                {msg.message}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-2 flex items-center space-x-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white p-2 rounded focus:outline-none"
            >
              <Send size={18} />
            </button>
          </div>

          {/* Clear chat button on the left */}
          <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-start">
            <button
              onClick={clearSession}
              className="bg-transparent text-red-500 border border-red-500 
                         px-3 py-1 text-sm rounded-md w-32"
            >
              Clear Chat History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
