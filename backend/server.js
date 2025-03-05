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
            sendTemplateMessage(session).catch(error => {
                console.error(`[SESSION] Keepalive failed for ${sessionId}:`, error);
            });
        }

        // Cleanup old sessions
        if (hoursInactive > 30 * 24) {
            userSessions.delete(sessionId);
        }
    });
}, 5 * 60 * 1000); // Run every 5 minutes

let customerCounter = 1;


const TEMPLATES = {
    CUSTOMER_MESSAGE: 'customer_message_1',
    OWNER_RESPONSE: 'owner_response_1'
  };

// WhatsApp API Config
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const OWNER_PHONE_NUMBER = process.env.OWNER_PHONE_NUMBER;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_secure_verify_token";
const BACKEND_URL = process.env.BACKEND_URL;

// Add these functions after WhatsApp API config
const sendTemplateMessage = async (session) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: "whatsapp",
                to: OWNER_PHONE_NUMBER,
                type: "template",
                template: {
                    name: "session_keepalive",
                    language: { code: "en_US" }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        session.lastActivity = new Date();
        return true;
    } catch (error) {
        console.error("[TEMPLATE ERROR]", error.response?.data || error.message);
        return false;
    }
};

const sendMessageToOwner = async (message, session) => {
    const trackedMessage = `[Customer ${session.customerId}]\n${message}`;
    return axios.post(WHATSAPP_API_URL, {
        messaging_product: "whatsapp",
        to: OWNER_PHONE_NUMBER,
        type: "text",
        text: { body: trackedMessage }
    });
};

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

// Modified send-message endpoint
app.post('/send-message', async (req, res) => {
    const { sessionId, message, customerId, isOwner } = req.body;

    try {
        const session = userSessions.get(sessionId);
        const templateName = isOwner ? TEMPLATES.OWNER_RESPONSE : TEMPLATES.CUSTOMER_MESSAGE;
        
        // Parameters structure for templates
        const parameters = isOwner 
            ? [{ type: "text", text: message }]  // Owner response template only needs message
            : [
                { type: "text", text: customerId },
                { type: "text", text: message }  // Customer message template needs ID + message
            ];

        // Send template message
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: isOwner ? session.customerPhone : OWNER_PHONE_NUMBER,  // Correct recipient
            type: "template",
            template: {
                name: templateName,
                language: { code: "en_US" },
                components: [{ type: "body", parameters }]
            }
        });

        // Store only parameters in session
        session.messages.push({
            id: response.data.messages[0].id,
            template: templateName,
            parameters: parameters.map(p => p.text),
            direction: isOwner ? 'outgoing' : 'incoming',
            timestamp: new Date()
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Template send error:', error.response?.data);
        res.status(500).json({ error: 'Failed to send template message' });
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

// Modified webhook handler
app.post('/webhook', async (req, res) => {
    const entries = req.body.entry;
    
    for (const entry of entries) {
        for (const change of entry.changes) {
            if (change.value.messages) {
                for (const msg of change.value.messages) {
                    if (msg.type === 'template' && msg.template) {
                        const { name: templateName, components } = msg.template;
                        const messageParams = components[0].parameters.map(p => p.text);
                        
                        // Find session by phone number
                        const session = Array.from(userSessions.values()).find(
                            s => s.customerPhone === msg.from
                        );

                        if (session) {
                            // Store only parameters
                            session.messages.push({
                                id: msg.id,
                                template: templateName,
                                parameters: messageParams,
                                direction: 'incoming',
                                timestamp: new Date(msg.timestamp * 1000)
                            });
                            
                            // Forward parameters only
                            const forwardTemplate = templateName === TEMPLATES.CUSTOMER_MESSAGE 
                                ? TEMPLATES.OWNER_RESPONSE
                                : TEMPLATES.CUSTOMER_MESSAGE;

                            await axios.post(WHATSAPP_API_URL, {
                                messaging_product: "whatsapp",
                                to: templateName === TEMPLATES.CUSTOMER_MESSAGE 
                                    ? OWNER_PHONE_NUMBER 
                                    : session.customerPhone,
                                type: "template",
                                template: {
                                    name: forwardTemplate,
                                    language: { code: "en_US" },
                                    components: [{
                                        type: "body",
                                        parameters: messageParams.map(p => ({ type: "text", text: p }))
                                    }]
                                }
                            });
                        }
                    }
                }
            }
        }
    }
    res.sendStatus(200);
});

app.get("/check-pending/:sessionId", (req, res) => {
    const session = userSessions.get(req.params.sessionId);
    res.json({ hasPending: !!session?.pendingMessages?.length });
});

// Enhanced webhook handler with delivery status (POST method...)
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
                                    if (session.ownerMessageIds?.includes(originalMessageId)) {
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
                                        sessionId: targetSessionId,
                                        inReplyTo: originalMessageId
                                    };

                                    // Store reply with original message context
                                    session.messages = session.messages.map(msg => {
                                        if (msg.id === originalMessageId) {
                                            return { ...msg, reply: replyData };
                                        }
                                        return msg;
                                    });

                                    // Notify all clients
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
