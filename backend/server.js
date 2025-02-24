require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Store chat sessions with session IDs
const userSessions = new Map();

// WhatsApp API Config
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const OWNER_PHONE_NUMBER = process.env.OWNER_PHONE_NUMBER;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_secure_verify_token";
const BACKEND_URL = process.env.BACKEND_URL;

// Generate or retrieve session ID
app.post("/start-session", (req, res) => {
    const sessionId = uuidv4();
    userSessions.set(sessionId, {
        messages: [],
        ownerMessageId: null
    });
    res.status(200).json({ sessionId });
});

// Handle customer messages
app.post("/send-message", async (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const session = userSessions.get(sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });

        // Send message to owner's WhatsApp
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: OWNER_PHONE_NUMBER,
            type: "text",
            text: { body: `New Message:\n${message}` }
        }, { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } });

        session.ownerMessageId = response.data.messages[0].id;
        session.messages.push({ sender: "user", message });
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error sending message:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

app.post("/send-reply", async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // Send message to owner's WhatsApp (not the customer's)
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: OWNER_PHONE_NUMBER, // Send the reply to the owner's phone number
            type: "text",
            text: { body: message } // The owner's reply message
        }, { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } });

        console.log("WhatsApp API response:", response.data);

        // Emit reply to frontend (specific to user)
        io.emit(`reply-${phone}`, { sender: "owner", message });

        res.status(200).json({ success: true, message: "Reply sent successfully" });
    } catch (error) {
        console.error("Error sending WhatsApp reply:", error.response?.data || error.message);
        res.status(500).json({ 
            error: "Failed to send reply", 
            details: error.response?.data || error.message 
        });
    }
});


// Handle owner replies
app.post("/webhook", async (req, res) => {
    const body = req.body;
    
    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages) {
        const msgData = body.entry[0].changes[0].value.messages[0];
        const context = msgData.context;

        if (context) {
            const originalMessageId = context.id;
            
            // Find session by original message ID
            let targetSessionId = null;
            for (const [sessionId, session] of userSessions.entries()) {
                if (session.ownerMessageId === originalMessageId) {
                    targetSessionId = sessionId;
                    break;
                }
            }

            if (targetSessionId) {
                const replyMessage = msgData.text.body;
                userSessions.get(targetSessionId).messages.push({ sender: "owner", message: replyMessage });
                io.emit(`reply-${targetSessionId}`, { message: replyMessage });
            }
        }
    }
    res.sendStatus(200);
});


// 🟢 Webhook Verification (GET Method)
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Check if the mode and token match what Meta expects
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified successfully!");
        res.status(200).send(challenge); // Respond with challenge to verify
    } else {
        res.sendStatus(403); // Unauthorized if token doesn't match
    }
});

// 🟢 WebSocket for Real-Time Messaging
io.on("connection", (socket) => {
    console.log("WebSocket connected");

    socket.on("join", (phone) => {
        console.log(`User connected: ${phone}`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

server.listen(5000, () => console.log(`Server running on ${BACKEND_URL || "http://localhost:5000"}`));
