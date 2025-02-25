import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { MessageCircle, X, Send } from "lucide-react";
import notificationSound from "../assets/notification.mp3";

const B_url = import.meta.env.VITE_URL || "http://localhost:5000";
const socket = io(B_url);

// Three dots loading animation component
const ThreeDotsLoader = () => (
    <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
    </div>
);

const Chatbot = () => {
    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId") || "");
    const [chat, setChat] = useState(
        JSON.parse(localStorage.getItem("chat")) || [
            { sender: "bot", message: "Hi there! How can I assist you today?" }
        ]
    );
    const [message, setMessage] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [awaitingReply, setAwaitingReply] = useState(false);
    const chatEndRef = useRef(null);
    const audioRef = useRef(new Audio(notificationSound));
    const messageIds = useRef(new Set());

    useEffect(() => {
        if (!sessionId) {
            axios.post(`${B_url}/start-session`)
                .then(res => {
                    const newSessionId = res.data.sessionId;
                    setSessionId(newSessionId);
                    localStorage.setItem("sessionId", newSessionId);
                })
                .catch(err => console.error("Error starting session:", err));
        } else {
            const eventName = `reply-${sessionId}`;
            
            socket.emit("join", sessionId);
            socket.on(eventName, (data) => {
                if (!messageIds.current.has(data.messageId)) {
                    messageIds.current.add(data.messageId);
                    setChat(prev => [...prev, { 
                        sender: "owner", 
                        message: data.message,
                        id: data.messageId 
                    }]);
                    setAwaitingReply(false);
                    playSound();
                }
            });

            return () => {
                socket.off(eventName);
                messageIds.current.clear();
            };
        }
    }, [sessionId]);

    useEffect(() => {
        localStorage.setItem("chat", JSON.stringify(chat));
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    const playSound = () => {
        audioRef.current.play();
    };

    const handleSend = async () => {
        if (!message.trim() || isSending) return;

        setIsSending(true);
        try {
            const response = await axios.post(`${B_url}/send-message`, { sessionId, message });
            const messageId = response.data.messageId;
            
            setChat(prev => [...prev, { 
                sender: "user", 
                message,
                id: messageId
            }]);
            messageIds.current.add(messageId);
            setMessage("");
            setAwaitingReply(true);
            playSound();
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const clearSession = () => {
        localStorage.removeItem("sessionId");
        localStorage.removeItem("chat");
        setSessionId("");
        setChat([{ sender: "bot", message: "Hi there! How can I assist you today?" }]);
        setAwaitingReply(false);
        messageIds.current.clear();
    };

    return (
        <div>
            {/* Chatbot Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="fixed bottom-5 right-5 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {/* Chatbox UI */}
            {isOpen && (
                <div className="fixed bottom-5 right-5 w-80 sm:w-96 bg-white border border-gray-300 rounded-lg shadow-lg h-[500px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-blue-600 text-white p-3 rounded-t-lg">
                        <h2 className="text-lg font-semibold">Chat Support</h2>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
                            <X size={22} />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-3 overflow-y-auto">
                        {chat.map((msg) => (
                            <div key={msg.id} className={`p-2 my-1 max-w-[75%] ${msg.sender === "user" ? "bg-blue-500 text-white ml-auto rounded-br-lg rounded-tl-lg rounded-bl-lg" : "bg-gray-200 text-gray-700 mr-auto rounded-bl-lg rounded-tr-lg rounded-br-lg"}`}>
                                {msg.message}
                            </div>
                        ))}
                        {awaitingReply && (
                            <div className="p-2 my-1 max-w-[75%] bg-gray-200 text-gray-700 mr-auto rounded-bl-lg rounded-tr-lg rounded-br-lg">
                                <div className="flex items-center justify-between">
                                    <span>Waiting for response</span>
                                    <ThreeDotsLoader />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef}></div>
                    </div>

                    {/* Message Input */}
                    <div className="p-3 border-t border-gray-300 flex items-center">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            disabled={isSending}
                        />
                        <button 
                            onClick={handleSend} 
                            className="ml-2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition relative"
                            disabled={isSending}
                        >
                            {isSending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>

                    {/* Clear Chat Button */}
                    <div className="p-3">
                        <button 
                            onClick={clearSession} 
                            className="border border-red-500 text-red-500 px-3 py-1 text-sm rounded-md hover:bg-red-500 hover:text-white transition"
                        >
                            Clear Chat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;