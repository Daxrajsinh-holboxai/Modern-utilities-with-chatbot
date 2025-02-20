require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Store chat sessions
const userSessions = new Map();

// WhatsApp API Config
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const OWNER_PHONE_NUMBER = process.env.OWNER_PHONE_NUMBER;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_secure_verify_token";
const BACKEND_URL = process.env.BACKEND_URL; // Use the backend URL from the env

// 🟢 Handle User Inquiry (Sends Message to WhatsApp)
app.post("/send-message", async (req, res) => {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // Send message to owner's WhatsApp
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: OWNER_PHONE_NUMBER,
            type: "text",
            text: { body: `New Inquiry:\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nMessage: ${message}` }
        }, { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } });

        const ownerMessageId = response.data.messages[0].id;  // Capture the message ID

        // Store session with the owner's message ID
        userSessions.set(phone, {
            name,
            email,
            phone,
            messages: [],
            ownerMessageId, // Store the owner's message ID
        });

        res.status(200).json({ success: true, message: "Message sent successfully" });

    } catch (error) {
        console.error("Error sending WhatsApp message:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

app.post("/send-reply", async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // Retrieve the session for the user
        const userSession = userSessions.get(phone);
        
        if (!userSession) {
            console.error("User session not found for phone:", phone);
            return res.status(400).json({ error: "User session not found" });
        }

        // Ensure the ownerMessageId is available
        if (!userSession.ownerMessageId) {
            console.error("Owner message ID not found for phone:", phone);
            return res.status(400).json({ error: "Owner message ID not found" });
        }

        // Send message to the user's WhatsApp
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: phone,  // Send reply to the user's phone
            type: "text",
            text: { body: message },
            context: { message_id: userSession.ownerMessageId } // Link to the original message
        }, { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` } });

        console.log("WhatsApp API response:", response.data);

        // Emit reply to frontend for the specific user
        io.emit(`reply-${phone}`, { sender: "owner", message });

        res.status(200).json({ success: true, message: "Reply sent successfully" });
    } catch (error) {
        console.error("Error sending WhatsApp reply:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send reply", details: error.response?.data || error.message });
    }
});

// 🟢 Webhook: Handle WhatsApp Messages (POST) - Receive replies from the owner
app.post("/webhook", async (req, res) => {
    const body_param = req.body;
    console.log("Received Webhook:", JSON.stringify(body_param, null, 2));

    if (body_param.object) {
        if (body_param.entry && body_param.entry[0].changes && body_param.entry[0].changes[0].value.messages) {
            const phoneNoId = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            const from = body_param.entry[0].changes[0].value.messages[0].from;
            const msgBody = body_param.entry[0].changes[0].value.messages[0].text.body;
            const context = body_param.entry[0].changes[0].value.messages[0].context; // Get the context

            if (context) {
                const originalMessageId = context.id; // Get the original message ID

                // Find the customer associated with this message ID
                let customerPhone = null;
                for (let [phone, session] of userSessions.entries()) {
                    if (session.ownerMessageId === originalMessageId) {
                        customerPhone = phone;
                        break;
                    }
                }

                if (customerPhone) {
                    // Add the owner's reply to the customer's session
                    userSessions.get(customerPhone).messages.push({ owner: msgBody });

                    // Send real-time message to chatbot frontend specific to the user
                    io.emit(`reply-${customerPhone}`, { sender: "owner", message: msgBody });
                } else {
                    console.log("No customer found for this reply.");
                }
            } else {
                console.log("Owner sent a message without context. Please reply to a specific message.");
            }
        }
    }

    res.sendStatus(200); // Return a success response to acknowledge the webhook
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
