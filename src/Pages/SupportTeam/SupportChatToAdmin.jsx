// SupportChatToAdmin.jsx
import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import NavbarSupport from "../../Components/SupportTeam/NavbarSupport";

// Define the primary color utility for better readability
const PRIMARY_COLOR_HEX = '#586330'; // Olive/Moss Green
const ADMIN_BUBBLE_COLOR = '#4CAF50'; // Using a standard green for the admin for visual clarity and contrast

function SupportChatToAdmin() {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
      return;
    }

    // Adjusted role decoding based on potential JWT claim variations
    const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = decoded[roleClaim] || decoded.role;
    const isSupport = role === "SupportTeam" || Number(role) === 4;
    if (!isSupport) return;

    setIsAuthorized(true);

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7001/chatHub?access_token=${encodeURIComponent(token)}`)
      .withAutomaticReconnect()
      .build();

    // Receive message FROM Admin
    conn.on("ReceiveAdminMessage", (fromAdminId, msg) => {
      setMessages(prev => [...prev, {
        from: "Admin",
        msg,
        isMe: false,
        isAdmin: true,
        timestamp: new Date()
      }]);
    });

    // Optional: echo own message (if backend echoes)
    conn.on("ReceiveSupportMessage", (fromUserId, msg) => {
      // NOTE: We rely on the immediate local addition in sendMessage,
      // but this block is kept for potential server echo handling.
      if (fromUserId === "You") {
        setMessages(prev => [...prev, {
          from: "You",
          msg,
          isMe: true,
          timestamp: new Date()
        }]);
      }
    });

    conn.onreconnecting(() => setConnectionStatus("Reconnecting..."));
    conn.onreconnected(() => setConnectionStatus("Connected"));
    conn.onclose(() => setConnectionStatus("Disconnected"));

    conn.start()
      .then(() => {
        setConnection(conn);
        setConnectionStatus("Connected");
        toast.success("Connected to Admin");
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to connect");
      });

    return () => conn?.stop();
  }, []);

  const sendMessage = async () => {
    if (!connection || !message.trim()) return;
    const text = message.trim();
    setMessage("");

    // Show immediately
    setMessages(prev => [...prev, { from: "You", msg: text, isMe: true, timestamp: new Date() }]);

    try {
      await connection.invoke("SendToAdmin", text);
    } catch (err) {
      toast.error("Failed to send");
      // Revert the message sent locally if the send fails
      setMessages(prev => prev.slice(0, -1)); 
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p>Only Support Team members can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Solid Olive Green */}<NavbarSupport/>
      <div className={`bg-[${PRIMARY_COLOR_HEX}] text-white p-6 shadow-lg`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              A
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Communication</h1>
              <p className="opacity-90">Direct line to Admin</p>
            </div>
          </div>
          {/* Connection Status */}
          <div className={`px-4 py-2 rounded-full text-sm ${connectionStatus === "Connected" ? "bg-green-500" : "bg-red-500"} text-white`}>
            {connectionStatus}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
        <div className="bg-white rounded-2xl shadow-xl h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className={`text-6xl mb-4 text-[${PRIMARY_COLOR_HEX}]`}>Admin</div>
                <p>Send a message to Admin when needed.</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-md ${
                    m.isMe 
                    ? `bg-[${PRIMARY_COLOR_HEX}] text-white` // Olive Green for Support (You)
                    : `bg-green-600 text-white` // A distinct standard green for Admin (Them)
                  }`}>
                    <div className="text-xs opacity-80 mb-1">{m.isMe ? "You" : "Admin"}</div>
                    <p>{m.msg}</p>
                    <div className="text-xs mt-1 opacity-80">{formatTime(m.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-6 bg-white">
            <div className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type your message to Admin..."
                className="flex-1 px-5 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[${PRIMARY_COLOR_HEX}]"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || connectionStatus !== "Connected"}
                className={`px-8 py-4 bg-[${PRIMARY_COLOR_HEX}] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportChatToAdmin;