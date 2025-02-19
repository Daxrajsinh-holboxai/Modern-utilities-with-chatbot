import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import { MessageCircle, X } from "lucide-react"; 

const socket = io("http://localhost:5000");

const Chatbot = () => {
    const [user, setUser] = useState({ name: "", phone: "", email: "", message: "" });
    const [chat, setChat] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [isOpen, setIsOpen] = useState(false); 
    const [selectedMessage, setSelectedMessage] = useState(null); // Track selected message for reply
    const [replyMessage, setReplyMessage] = useState(""); // Reply message state

    useEffect(() => {
        if (user.phone) {
            socket.emit("join", user.phone);
            socket.on(`reply-${user.phone}`, (data) => {
                setChat(prevChat => [...prevChat, { sender: "owner", message: data.message }]);
            });

            return () => socket.off(`reply-${user.phone}`);
        }
    }, [user.phone]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await axios.post("http://localhost:5000/send-message", user);
        setChat([{ sender: "user", message: user.message }]);
        setSubmitted(true);
    };

    const handleReply = async (messageId) => {
        const replyData = {
            phone: user.phone,
            message: replyMessage,
            messageId,
        };
        await axios.post("http://localhost:5000/send-reply", replyData); // Handle reply in backend
        setReplyMessage(""); // Clear reply field
        setSelectedMessage(null); // Deselect message after replying
    };

    return (
        <div>
            {/* Floating Chat Icon */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="fixed bottom-5 right-5 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {/* Chatbot UI (Expands on Click) */}
            {isOpen && (
                <div className="fixed bottom-5 right-5 w-80 sm:w-96 bg-white border rounded-lg shadow-lg">
                    <div className="flex items-center justify-between bg-blue-600 text-white p-3 rounded-t-lg">
                        <h2 className="text-lg font-semibold">Chatbot</h2>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
                            <X size={22} />
                        </button>
                    </div>

                    <div className="p-4">
                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <input 
                                    type="text" placeholder="Name" required 
                                    className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                                />
                                <input 
                                    type="tel" placeholder="Phone" required 
                                    className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                />
                                <input 
                                    type="email" placeholder="Email" required 
                                    className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                />
                                <textarea 
                                    placeholder="Message" required 
                                    className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                                    onChange={(e) => setUser({ ...user, message: e.target.value })}
                                ></textarea>
                                <button 
                                    type="submit" 
                                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                                >
                                    Send
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <div className="h-52 overflow-y-auto bg-gray-100 border p-3 rounded-md">
                                    {chat.map((msg, index) => (
                                        <div 
                                            key={index} 
                                            className={`p-2 my-1 max-w-xs ${msg.sender === "user" ? "bg-blue-500 text-white ml-auto" : "bg-gray-200 text-gray-700"} rounded-md`}
                                            onClick={() => setSelectedMessage(msg)}
                                        >
                                            {msg.message}
                                        </div>
                                    ))}
                                </div>
                                {selectedMessage && (
                                    <div className="mt-3">
                                        <textarea
                                            placeholder="Your reply..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                        ></textarea>
                                        <button 
                                            onClick={() => handleReply(selectedMessage.messageId)} 
                                            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
                                        >
                                            Send Reply
                                        </button>
                                    </div>
                                )}
                                <button 
                                    onClick={() => setSubmitted(false)} 
                                    className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition"
                                >
                                    Start New Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
