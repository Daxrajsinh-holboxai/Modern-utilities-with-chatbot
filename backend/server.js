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

// Store chat sessions with additional metadata
const userSessions = new Map();

let customerCounter = 1;

// WhatsApp API Config
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const OWNER_PHONE_NUMBER = process.env.OWNER_PHONE_NUMBER;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_secure_verify_token";
const BACKEND_URL = process.env.BACKEND_URL;

// Generate session with customer identification
app.post("/start-session", (req, res) => {
    const sessionId = uuidv4();
    // const customerId = `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const customerId = `cust${customerCounter++}`;
    
    userSessions.set(sessionId, {
        customerId,
        messages: [],
        ownerMessageId: null,
        status: "active",
        createdAt: new Date(),
        lastActivity: new Date()
    });

    console.log(`[SESSION] New session started: ${sessionId} for customer ${customerId}`);
    res.status(200).json({ sessionId, customerId });
});

// Enhanced send-message with tracking
app.post("/send-message", async (req, res) => {
    const { sessionId, message, customerId } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const session = userSessions.get(sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });

        // Add customer identifier to message
        const trackedMessage = `[Customer ${session.customerId}]\n${message}`;
        
        console.log(`[OUTGOING] Sending message from ${session.customerId}: ${message}`);
        
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: OWNER_PHONE_NUMBER,
            type: "text",
            text: { body: trackedMessage }
        }, { 
            headers: { 
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                "X-Debug-Session": sessionId
            } 
        });

        const messageData = {
            id: response.data.messages[0].id,
            content: message,
            timestamp: new Date(),
            status: "sent",
            customerId: session.customerId,
            sessionId
        };

        session.ownerMessageId = messageData.id;
        session.messages.push(messageData);
        session.lastActivity = new Date();

        console.log(`[STATUS] Message ${messageData.id} sent successfully`);
        console.log(`[DEBUG] WhatsApp API Response:`, response.data);

        res.status(200).json({ 
            success: true, 
            messageId: messageData.id,
            customerId: session.customerId
        });

    } catch (error) {
        console.error(`[ERROR] Failed to send message: ${error.response?.data || error.message}`);
        res.status(500).json({ 
            error: "Failed to send message",
            details: error.response?.data || error.message 
        });
    }
});

// Webhook verification (GET method)
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Check if the mode and token match what Meta expects
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("[WEBHOOK] Verification successful");
        res.status(200).send(challenge); // Respond with challenge to verify
    } else {
        console.warn("[WEBHOOK] Verification failed: Invalid token or mode");
        res.sendStatus(403); // Unauthorized if token doesn't match
    }
});

// Enhanced webhook handler with delivery status (POST method)
app.post("/webhook", async (req, res) => {
    const body = req.body;
    console.log("[WEBHOOK] Received event:", JSON.stringify(body, null, 2));

    try {
        if (body.object && body.entry) {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value.messages) {
                        for (const msg of change.value.messages) {
                            const context = msg.context;
                            const statuses = change.value.statuses;

                            if (statuses) {
                                // Handle message status updates
                                for (const status of statuses) {
                                    console.log(`[STATUS] Message ${status.id} status: ${status.status}`);
                                    updateMessageStatus(status.id, status.status);
                                }
                            }

                            if (context) {
                                // Handle owner replies
                                const originalMessageId = context.id;
                                const replyMessage = msg.text.body;
                                
                                console.log(`[INCOMING] Reply received for message ${originalMessageId}`);
                                
                                let targetSessionId = null;
                                for (const [sessionId, session] of userSessions.entries()) {
                                    if (session.ownerMessageId === originalMessageId) {
                                        targetSessionId = sessionId;
                                        break;
                                    }
                                }

                                if (targetSessionId) {
                                    const session = userSessions.get(targetSessionId);
                                    const replyData = {
                                        id: uuidv4(),
                                        message: replyMessage,
                                        timestamp: new Date(),
                                        status: "delivered",
                                        customerId: session.customerId,
                                        sessionId: targetSessionId
                                    };

                                    session.messages.push(replyData);
                                    session.lastActivity = new Date();

                                    console.log(`[ROUTING] Sending reply to session ${targetSessionId} (${session.customerId})`);
                                    io.to(targetSessionId).emit(`reply-${targetSessionId}`, replyData);
                                }
                            }
                        }
                    }
                }
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("[WEBHOOK ERROR]", error);
        res.status(500).send("Webhook processing failed");
    }
});

function updateMessageStatus(messageId, status) {
    for (const [sessionId, session] of userSessions.entries()) {
        const message = session.messages.find(m => m.id === messageId);
        if (message) {
            message.status = status;
            console.log(`[STATUS] Updated message ${messageId} status to ${status} for ${session.customerId}`);
            session.lastActivity = new Date();
            return;
        }
    }
    console.warn(`[WARNING] Message ${messageId} not found for status update`);
}

// WebSocket enhancements
io.on("connection", (socket) => {
    console.log(`[WS] New connection: ${socket.id}`);

    socket.on("join", (sessionId) => {
        console.log(`[WS] Client joined session: ${sessionId}`);
        socket.join(sessionId);
    });

    socket.on("disconnect", () => {
        console.log(`[WS] Client disconnected: ${socket.id}`);
    });
});

server.listen(5000, () => console.log(`Server running on ${BACKEND_URL || "http://localhost:5000"}`));