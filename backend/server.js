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
    console.log(`New session started: ${sessionId}`);
    res.status(200).json({ sessionId });
});

// Handle customer messages
app.post("/send-message", async (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        console.error("send-message: Missing sessionId or message");
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const session = userSessions.get(sessionId);
        if (!session) {
            console.error(`send-message: Session not found for sessionId: ${sessionId}`);
            return res.status(404).json({ error: "Session not found" });
        }

        console.log(`User message received for sessionId ${sessionId}: ${message}`);

        // Send message to owner's WhatsApp
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: OWNER_PHONE_NUMBER,
            type: "text",
            text: { body: `New Message:\n${message}` }
        }, { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } });

        console.log(`WhatsApp message sent to owner. Message ID: ${response.data.messages[0].id}`);

        session.ownerMessageId = response.data.messages[0].id;
        session.messages.push({ sender: "user", message });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error sending message to WhatsApp:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Handle owner replies
app.post("/webhook", async (req, res) => {
    const body = req.body;
    
    console.log("Webhook received: ", JSON.stringify(body, null, 2)); // Log full webhook response for debugging

    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages) {
        const msgData = body.entry[0].changes[0].value.messages[0];
        const context = msgData.context;

        console.log("Extracted message data: ", msgData);
        
        if (context) {
            const originalMessageId = context.id;
            console.log(`Received reply for original message ID: ${originalMessageId}`);

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
                console.log(`Reply found for sessionId ${targetSessionId}: ${replyMessage}`);

                userSessions.get(targetSessionId).messages.push({ sender: "owner", message: replyMessage });
                io.emit(`reply-${targetSessionId}`, { message: replyMessage });
            } else {
                console.warn(`No matching session found for owner message ID: ${originalMessageId}`);
            }
        } else {
            console.warn("Webhook message does not contain context. Might be an independent message.");
        }
    } else {
        console.warn("Webhook received but no valid message found.");
    }

    res.sendStatus(200);
});

server.listen(5000, () => console.log(`Server running on ${BACKEND_URL || "http://localhost:5000"}`));