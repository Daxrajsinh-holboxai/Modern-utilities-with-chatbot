import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { motion } from "framer-motion";
import { MessageCircle, X, Send, Trash2 } from "lucide-react";
// import notificationSound from "../assets/notification.mp3"; // Ensure this file exists

// Define types for chat messages
interface ChatMessage {
    id: string;
    sender: "bot" | "user" | "owner";
    message: string;
    status?: "sent" | "delivered" | "read";
    customerId?: string;
    timestamp?: Date;
}

const B_url: string = import.meta.env.VITE_URL || "http://localhost:5000";
const socket = io(B_url);

// Generate a unique ID for messages
    const uuidv4 = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

const Chatbot: React.FC = () => {
    const [sessionId, setSessionId] = useState<string>(localStorage.getItem("sessionId") || "");
    const [customerId, setCustomerId] = useState<string>(localStorage.getItem("customerId") || "");
    const [chat, setChat] = useState<ChatMessage[]>(
        JSON.parse(localStorage.getItem("chat") || "[]") || [
            { id: uuidv4(), sender: "bot", message: "Hello! This is Modern Utilities. Who do I have the pleasure of chatting with?" },
        ]
    );
    const [message, setMessage] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [awaitingReply, setAwaitingReply] = useState<boolean>(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    // const audioRef = useRef(new Audio(notificationSound));

    // Initialize session and socket connection
    useEffect(() => {
        if (!sessionId) {
            axios.post<{ sessionId: string; customerId: string }>(`${B_url}/start-session`)
                .then((res) => {
                    const { sessionId: newSessionId, customerId: newCustomerId } = res.data;
                    setSessionId(newSessionId);
                    setCustomerId(newCustomerId);
                    localStorage.setItem("sessionId", newSessionId);
                    localStorage.setItem("customerId", newCustomerId);
                    console.log(`[FRONTEND] Session started: ${newSessionId}, Customer ID: ${newCustomerId}`);
                })
                .catch((err) => console.error("[FRONTEND] Error starting session:", err));
        } else {
            socket.emit("join", sessionId);

            const handleReply = (data: ChatMessage) => {
                if (!chat.some((msg) => msg.id === data.id)) {
                    setChat((prev) => [...prev, { ...data, sender: "owner" }]);
                    setAwaitingReply(false);
                    // playSound();
                    console.log(`[FRONTEND] Received reply: ${data.message}`);
                }
            };

            socket.on(`reply-${sessionId}`, handleReply);

            return () => {
                socket.off(`reply-${sessionId}`, handleReply);
            };
        }
    }, [sessionId]);

    // Save chat to localStorage and scroll to bottom
    useEffect(() => {
        localStorage.setItem("chat", JSON.stringify(chat));
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    // Auto-open chat on page load with animation
    useEffect(() => {
        setTimeout(() => {
            setIsOpen(true);
        }, 1000); // 1-second delay before opening
    }, []);

    // Play notification sound
    // const playSound = () => {
    //     audioRef.current.play();
    // };

    // Send message to backend
    const handleSend = async (): Promise<void> => {
        if (!message.trim() || isSending) return;

        setIsSending(true);
        const messageId = uuidv4();

        try {
            const newMessage: ChatMessage = {
                id: messageId,
                sender: "user",
                message,
                status: "sent",
                customerId,
                timestamp: new Date(),
            };

            setChat((prev) => [...prev, newMessage]);
            setMessage("");
            setAwaitingReply(true);

            await axios.post(`${B_url}/send-message`, {
                sessionId,
                message,
                customerId,
            });

            console.log(`[FRONTEND] Message sent: ${message}`);
            // playSound();
        } catch (error) {
            console.error("[FRONTEND] Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    // Clear chat session
    const clearSession = (): void => {
        localStorage.removeItem("sessionId");
        localStorage.removeItem("customerId");
        localStorage.removeItem("chat");
        setSessionId("");
        setCustomerId("");
        setChat([{ id: uuidv4(), sender: "bot", message: "Hello! This is Modern Utilities. Who do I have the pleasure of chatting with?" }]);
        setAwaitingReply(false);
        console.log("[FRONTEND] Chat session cleared");
    };

    // Get CSS classes for messages based on sender
    const getMessageClasses = (sender: "bot" | "user" | "owner"): string => {
        switch (sender) {
            case "user":
                return "bg-gradient-to-r from-green-500 to-green-600 text-white self-end";
            case "owner":
                return "bg-gray-700 text-white self-start";
            default:
                return "bg-gray-700 text-white self-start";
        }
    };

    return (
        <section id="chatbot">
            <div className="fixed bottom-4 right-4 sm:right-10 md:right-10 flex flex-col items-end z-50">
                {/* Floating button to open chat */}
                {!isOpen && (
                    <motion.button
                        onClick={() => setIsOpen(true)}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full shadow-lg focus:outline-none hover:scale-105 transition-transform"
                    >
                        <MessageCircle size={24} />
                    </motion.button>
                )}

                {/* Chat window with bounce effect */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", type: "spring", stiffness: 120 }}
                        className="flex flex-col w-72 sm:w-80 max-w-full h-80 sm:h-96 bg-gray-900 dark:bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-4 py-2">
                            <h2 className="font-bold text-sm sm:text-lg">Chat Support</h2>
                            <button onClick={() => setIsOpen(false)} className="text-white focus:outline-none hover:scale-110 transition-transform">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 flex flex-col space-y-2 p-2 sm:p-3 overflow-y-auto">
                            {chat.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.sender === "user" ? 50 : -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className={`px-2 sm:px-3 py-1 sm:py-2 max-w-[85%] rounded-md text-xs sm:text-sm break-words ${getMessageClasses(msg.sender)}`}
                                >
                                    {msg.message}
                                    {/* {msg.sender === "user" && (
                                        <div className="text-xs text-gray-200 mt-1">
                                            Status: {msg.status || "sent"}
                                        </div>
                                    )} */}
                                </motion.div>
                            ))}
                            {awaitingReply && (
                                <div className="p-2 my-1 max-w-[75%] bg-gray-200 text-gray-700 mr-auto rounded-bl-lg rounded-tr-lg rounded-br-lg">
                                    <div className="flex items-center justify-between">
                                        <span>Waiting for response</span>
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input and Clear Chat Row */}
                        <div className="border-t border-gray-700 bg-gray-900 p-2 flex items-center space-x-1 sm:space-x-2">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                className="flex-1 px-2 py-1 text-xs sm:text-sm rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                disabled={isSending}
                            />

                            <button
                                onClick={handleSend}
                                className="bg-gradient-to-r from-green-400 to-green-600 text-white p-1 sm:p-2 rounded focus:outline-none hover:scale-110 transition-transform"
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>

                            <button
                                onClick={clearSession}
                                className="text-red-400 hover:text-red-600 transition-colors focus:outline-none"
                                title="Clear Chat"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default Chatbot;