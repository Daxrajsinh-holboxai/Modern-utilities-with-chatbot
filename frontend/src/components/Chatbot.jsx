// Chatbot.jsx (updated)
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { MessageCircle, X, Send } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const B_url = import.meta.env.VITE_URL || "http://localhost:5000";
const socket = io(B_url);

const Chatbot = () => {
    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId") || "");
    const [chat, setChat] = useState(JSON.parse(localStorage.getItem("chat")) || [
        { sender: "bot", message: "Hi there! How can I assist you today?" }
    ]);
    const [message, setMessage] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!sessionId) {
            axios.post(`${B_url}/start-session`)
                .then(res => {
                    const newSessionId = res.data.sessionId;
                    setSessionId(newSessionId);
                    localStorage.setItem("sessionId", newSessionId);
                });
        } else {
            socket.emit("join", sessionId);
            socket.on(`reply-${sessionId}`, (data) => {
                setChat(prev => [...prev, { sender: "owner", message: data.message }]);
            });
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
            setChat(prev => [...prev, { sender: "user", message }]);
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
    };

    return (
        <div>
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="chat-button">
                    <MessageCircle size={28} />
                </button>
            )}

            {isOpen && (
                <div className="chat-container">
                    <div className="chat-header">
                        <h2>Chat Support</h2>
                        <button onClick={() => setIsOpen(false)}>
                            <X size={22} />
                        </button>
                    </div>
                    
                    <div className="chat-messages">
                        {chat.map((msg, i) => (
                            <div key={i} className={`message ${msg.sender}`}>
                                {msg.message}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="chat-input">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        />
                        <button onClick={handleSend}>
                            <Send size={18} />
                        </button>
                    </div>

                    <button onClick={clearSession} className="clear-button">
                        Clear Chat History
                    </button>
                </div>
            )}
        </div>
    );
};

export default Chatbot;