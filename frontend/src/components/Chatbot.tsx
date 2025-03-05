import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { motion } from "framer-motion";
import { MessageCircle, X, Send, Trash2 } from "lucide-react";

// Define types for chat messages
interface ChatMessage {
    id: string;
    sender: "bot" | "user" | "owner";
    message: string;
    status?: "sent" | "delivered" | "read";
    customerId?: string;
    timestamp?: Date;
    isTemplate?: boolean;
    template?: string;
    parameters?: string[];
    direction?: "incoming" | "outgoing";
}

const B_url: string = import.meta.env.VITE_URL || "http://localhost:5000";
const socket = io(B_url);

// Generate a unique ID for messages
const uuidv4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const TEMPLATES = {
    CUSTOMER_MESSAGE: 'customer_message_1',
    OWNER_RESPONSE: 'owner_response_1'
};

const Chatbot: React.FC = () => {
    const [sessionId, setSessionId] = useState<string>(localStorage.getItem("sessionId") || "");
    const [customerId, setCustomerId] = useState<string>(localStorage.getItem("customerId") || "");
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!sessionId) {
            axios.post<{ sessionId: string; customerId: string }>(`${B_url}/start-session`)
                .then((res) => {
                    const { sessionId: newSessionId, customerId: newCustomerId } = res.data;
                    setSessionId(newSessionId);
                    setCustomerId(newCustomerId);
                    localStorage.setItem("sessionId", newSessionId);
                    localStorage.setItem("customerId", newCustomerId);
                })
                .catch((err) => console.error("[FRONTEND] Error starting session:", err));
        } else {
            socket.emit("join", sessionId);

            const handleUpdate = (newMessages: ChatMessage[]) => {
                setChat(prev => [...prev, ...newMessages.filter(msg => !prev.some(m => m.id === msg.id))]);
            };

            socket.on(`update-${sessionId}`, handleUpdate);
            return () => {
                socket.off(`update-${sessionId}`, handleUpdate);
            };
        }
    }, [sessionId]);

    useEffect(() => {
        localStorage.setItem("chat", JSON.stringify(chat));
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    const getMessageClasses = (sender: "bot" | "user" | "owner"): string => {
        return sender === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-300 text-black self-start";
    };

    const handleSend = async (): Promise<void> => {
        const newMessage: ChatMessage = {
            id: uuidv4(),
            sender: "user",
            message,
            status: "sent",
            timestamp: new Date(),
        };

        setChat(prev => [...prev, newMessage]);
        setMessage("");
        await axios.post(`${B_url}/send-message`, {
            sessionId,
            message: newMessage.message,
            customerId,
        });
    };

    const clearSession = (): void => {
        localStorage.clear();
        setSessionId("");
        setCustomerId("");
        setChat([]);
    };

    return (
        <section id="chatbot">
            <div className="fixed bottom-4 right-4 sm:right-10 md:right-10 flex flex-col items-end z-50">
                {!isOpen && (
                    <motion.button
                        onClick={() => setIsOpen(true)}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-green-500 text-white rounded-full shadow-lg focus:outline-none hover:scale-105 transition-transform"
                    >
                        <MessageCircle size={24} />
                    </motion.button>
                )}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", type: "spring", stiffness: 120 }}
                        className="flex flex-col w-72 sm:w-80 max-w-full h-80 sm:h-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                    >
                        <div className="flex items-center justify-between bg-green-500 text-white px-3 sm:px-4 py-2">
                            <h2 className="font-bold text-sm sm:text-lg">Chat Support</h2>
                            <button onClick={() => setIsOpen(false)} className="text-white focus:outline-none hover:scale-110 transition-transform">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Messages area */}
                
<div className="flex-1 flex flex-col space-y-2 p-2 sm:p-3 overflow-y-auto">
    {chat.map((msg) => {
        // Display only relevant parameters
        let displayText = '';
        if (msg.template === TEMPLATES.CUSTOMER_MESSAGE) {
            // For customer messages, show only the actual message (second parameter)
            displayText = msg.parameters?.[1] || '';
        } else if (msg.template === TEMPLATES.OWNER_RESPONSE) {
            // For owner responses, show only the response text (first parameter)
            displayText = msg.parameters?.[0] || '';
        } else {
            // Fallback for non-template messages
            displayText = msg.message;
        }

        // Determine sender type
        const senderType = msg.direction === 'outgoing' ? 'user' : 
                         msg.direction === 'incoming' ? 'owner' : 
                         msg.sender || 'bot';

        return (
            <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: senderType === "user" ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`px-2 sm:px-3 py-1 sm:py-2 max-w-[85%] rounded-md text-xs sm:text-sm break-words ${getMessageClasses(senderType)}`}
            >
                {displayText}
                
                {senderType === "user" && (
                    <div className="text-xs text-gray-200 mt-1">
                        Status: {msg.status || "sent"}
                    </div>
                )}
            </motion.div>
        );
    })}
</div>
                        <div className="border-t border-gray-200 bg-white p-2 flex items-center space-x-1 sm:space-x-2">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                className="flex-1 px-2 py-1 text-xs sm:text-sm rounded bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button
                                onClick={handleSend}
                                className="bg-green-500 text-white p-1 sm:p-2 rounded focus:outline-none hover:scale-110 transition-transform"
                            >
                                <Send size={16} />
                            </button>
                            <button
                                onClick={clearSession}
                                className="text-red-500 hover:text-red-600 transition-colors focus:outline-none"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div ref={chatEndRef} />
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default Chatbot;
