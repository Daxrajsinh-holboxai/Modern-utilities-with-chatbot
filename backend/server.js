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

// Add session maintenance scheduler
setInterval(() => {
    const now = new Date();
    userSessions.forEach((session, sessionId) => {
        const hoursInactive = (now - session.lastActivity) / 3600000;

        // Send template if approaching 24h limit
        if (hoursInactive >= 23 && hoursInactive < 24) {
            axios.post(WHATSAPP_API_URL, {
                messaging_product: "whatsapp",
                to: OWNER_PHONE_NUMBER,
                type: "template",
                template: {
                    name: "session_keepalive",
                    language: { code: "en_US" }
                }
            }).then(() => {
                session.lastActivity = new Date();
            });
        }

        // Cleanup old sessions
        if (hoursInactive > 30 * 24) {
            userSessions.delete(sessionId);
        }
    });
}, 5 * 60 * 1000); // Run every 5 minutes

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

        // Send message using the "customer_message_2" template
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: OWNER_PHONE_NUMBER,
            type: "template",
            template: {
                name: "customer_message",
                language: { code: "en_US" },
                components: [{
                    type: "body",
                    parameters: [
                        { type: "text", text: customerId },
                        { type: "text", text: message }
                    ]
                }]
            }
        }, {
            headers: {
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`
            }
        });

        const messageData = {
            id: response.data.messages[0].id,
            content: message,
            timestamp: new Date(),
            status: "sent",
            customerId,
            sessionId
        };

        session.ownerMessageIds = [...(session.ownerMessageIds || []), messageData.id];
        session.messages.push(messageData);
        session.lastActivity = new Date();

        res.status(200).json({
            success: true,
            messageId: messageData.id,
            customerId
        });

    } catch (error) {
        console.error(`[ERROR] Failed to send message:`, error.response?.data || error.message);
        res.status(500).json({
            error: "Failed to send message",
            details: error.response?.data || error.message
        });
    }
});


// Add endpoint to handle template responses
app.post("/handle-template-response", async (req, res) => {
    const { sessionId } = req.body;
    const session = userSessions.get(sessionId);
    
    // Send pending messages
    if (session?.pendingMessages) {
        session.pendingMessages.forEach(async (msg) => {
            await sendMessageToOwner(msg);
        });
        session.pendingMessages = [];
    }
});

app.post("/webhook", async (req, res) => {
    const body = req.body;
    console.log("[WEBHOOK] Received event:", JSON.stringify(body, null, 2));

    try {
        if (body.object && body.entry) {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value.messages) {
                        for (const msg of change.value.messages) {
                            if (msg.type === "text") {
                                const replyMessage = msg.text.body;
                                const originalMessageId = msg.context?.id;

                                console.log(`[INCOMING] Reply received: ${replyMessage}`);

                                let targetSessionId = null;
                                for (const [sessionId, session] of userSessions.entries()) {
                                    if (session.ownerMessageIds?.includes(originalMessageId)) {
                                        targetSessionId = sessionId;
                                        break;
                                    }
                                }

                                if (targetSessionId) {
                                    const session = userSessions.get(targetSessionId);

                                    // Send owner response using "owner_response_2" template
                                    await axios.post(WHATSAPP_API_URL, {
                                        messaging_product: "whatsapp",
                                        to: session.customerId, 
                                        type: "template",
                                        template: {
                                            name: "owner_response",
                                            language: { code: "en_US" },
                                            components: [{
                                                type: "body",
                                                parameters: [{ type: "text", text: replyMessage }]
                                            }]
                                        }
                                    }, {
                                        headers: {
                                            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`
                                        }
                                    });

                                    const replyData = {
                                        id: uuidv4(),
                                        sender: "owner",
                                        message: replyMessage,
                                        timestamp: new Date(),
                                        status: "delivered",
                                        customerId: session.customerId,
                                        sessionId: targetSessionId,
                                        inReplyTo: originalMessageId
                                    };

                                    session.messages.push(replyData);
                                    session.lastActivity = new Date();

                                    io.to(targetSessionId).emit(`update-${targetSessionId}`, session.messages);
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
