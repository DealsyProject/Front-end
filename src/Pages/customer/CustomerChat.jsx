import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { jwtDecode } from "jwt-decode";
import Navbar from "../../Components/customer/Common/Navbar";

function CustomerChat() {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);

  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // =========================================================
  // 1. CONNECT + AUTH + SIGNALR SETUP
  // =========================================================
  useEffect(() => {
    const connect = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          alert("Please login first");
          return;
        }

        const decoded = jwtDecode(token);
        const uid =
          decoded.nameid ||
          decoded.sub ||
          decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"];
        const role =
          decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
          decoded.role ||
          decoded["role"];

        const isCustomer = role === "Customer" || role === "3" || Number(role) === 3;
        if (!isCustomer) {
          alert("Access denied. Customers only.");
          return;
        }

        setUserId(uid);
        setIsAuthorized(true);
        setIsConnecting(true);
        setConnectionStatus("Connecting...");

        const hubUrl = `https://localhost:7001/chatHub?access_token=${encodeURIComponent(token)}`;

        const conn = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl)
          .withAutomaticReconnect([0, 1000, 3000, 5000, 10000, 15000, 30000])
          .configureLogging(signalR.LogLevel.Information)
          .build();

        // Receive message from Support Agent
        conn.on("ReceiveMessage", (from, msg) => {
          setMessages(prev => [
            ...prev,
            {
              fromUserId: from,
              msg,
              isCustomer: false,
              timestamp: new Date(),
              id: Date.now() + Math.random()
            }
          ]);
          setAgentTyping(false);
        });

        // Agent is typing indicator
        conn.on("AgentTyping", () => {
          setAgentTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setAgentTyping(false), 4000);
        });

        conn.onreconnecting(() => setConnectionStatus("Reconnecting..."));
        conn.onreconnected(() => setConnectionStatus("Connected"));
        conn.onclose(() => {
          setConnectionStatus("Disconnected");
          setIsConnecting(false);
        });

        await conn.start();
        setConnection(conn);
        setConnectionStatus("Connected");
        setIsConnecting(false);

        // Offline messages are auto-delivered by backend on connect
      } catch (e) {
        console.error("SignalR connection failed:", e);
        setConnectionStatus("Failed");
        setIsConnecting(false);
        alert("Chat connection failed. Please refresh.");
      }
    };

    connect();

    return () => {
      connection?.stop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // =========================================================
  // 2. SEND MESSAGE + TYPING INDICATOR
  // =========================================================
  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (connection && e.target.value.trim()) {
      connection.invoke("CustomerTyping").catch(() => { });
    }
  };

  const sendMessage = async () => {
    if (!connection || !message.trim()) return;

    const txt = message.trim();
    setMessage("");

    const tempId = Date.now();
    setMessages(prev => [
      ...prev,
      {
        fromUserId: userId,
        msg: txt,
        isCustomer: true,
        timestamp: new Date(),
        id: tempId,
        status: "sending"
      }
    ]);

    try {
      await connection.invoke("SendToSupport", txt);
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, status: "sent" } : m))
      );
    } catch (e) {
      console.error("Send failed:", e);
      setMessage(txt);
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // =========================================================
  // 3. AUTO SCROLL
  // =========================================================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping]);

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // =========================================================
  // 4. UI RENDERS
  // =========================================================
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center bg-white rounded-3xl p-12 shadow-2xl max-w-md">
          <div className="text-6xl mb-6">Locked</div>
          <h2 className="text-2xl font-bold text-red-600 mb-3">Access Denied</h2>
          <p className="text-gray-600">This chat is for customers only.</p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center bg-white rounded-3xl p-12 shadow-2xl max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#97A36D] mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-800">Connecting to Support...</h3>
          <p className="text-gray-500 mt-2">{connectionStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#F5F7EB] to-[#E8F0D8] flex flex-col overflow-hidden">
      <Navbar />
      {/* Header */}
      <div className="bg-[#97A36D] shadow-xl flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-5">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Customer Support</h1>
                <p className="text-white/90">We're online and ready to help you</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 ${connectionStatus === "Connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <span className={`w-3 h-3 rounded-full ${connectionStatus === "Connected" ? "bg-green-500" : "bg-red-500"} animate-pulse`}></span>
                <span>{connectionStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-5 flex flex-col overflow-hidden">
        <div className="bg-white rounded-3xl shadow-2xl h-full flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-[#97A36D] text-white px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                
                <div>
                  <p className="text-white/80 font-bold text-sm">Our Support Team Typically replies in 2-5 minutes</p>
                </div>
              </div>
              <div className="text-sm bg-white/20 px-4 py-2 rounded-full">
                24/7 Available
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-13 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-5xl mb-6 opacity-30">Chat</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">Welcome to Dealsy Support</h3>
                <p className="text-gray-500 max-w-lg mx-auto">
                  Send us a message and our team will assist you right away. We're here 24/7!
                </p>
              </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.isCustomer ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex max-w-lg">
                      {!m.isCustomer && (
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0 shadow-lg">
                          S
                        </div>
                      )}
                      <div
                        className={`px-6 py-4 rounded-3xl shadow-md ${m.isCustomer
                          ? "bg-[#97A36D] text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                          } ${m.status === "failed" ? "border-2 border-red-400 bg-red-50" : ""}`}
                      >
                        <p className="text-base leading-relaxed break-words">{m.msg}</p>
                        <div className={`text-xs mt-2 flex items-center space-x-2 ${m.isCustomer ? "text-white/80" : "text-gray-500"}`}>
                          <span>{formatTime(m.timestamp)}</span>
                          {m.status === "sending" && <span className="animate-pulse">Sending...</span>}
                          {m.status === "sent" && <span>Delivered</span>}
                          {m.status === "failed" && <span className="text-red-600">Failed</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Agent Typing Indicator */}
                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-3 bg-white px-5 py-4 rounded-3xl border border-gray-200 shadow-md ml-14">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Agent is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Input Area (reduced size) */}
          <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={handleTyping}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#97A36D] focus:outline-none text-base transition-all duration-200"
                  disabled={connectionStatus !== "Connected"}
                  maxLength={1000}
                />
                {connectionStatus === "Connected" && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              <button
                onClick={sendMessage}
                disabled={!message.trim() || connectionStatus !== "Connected"}
                className="px-6 py-3 bg-[#97A36D] text-white rounded-xl font-semibold text-base hover:bg-[#7e8a5a] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md flex items-center space-x-2"
              >
                <span>Send</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            <div className="text-center mt-2 text-xs text-gray-400">
              Messages are encrypted 🔒
            </div>
          </div>

        </div>
        <div className={`mt-16 bg-rounded-3xl shadow-2xl p-12 text-center text-white transform hover:shadow-2xl transition-all duration-300`}>
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-4">
              Still need help? We've got you covered!
            </h3>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Our dedicated support team is available 24/7 to assist you with any questions or concerns. Choose your preferred way to connect with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/support-faq-options')}
                className={`bg-white text- px-8 py-4 rounded-xl hover:bg-lime-50 transition-all duration-300 font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Faq Options
              </button>
              <button 
                onClick={() => navigate('/support-emailsupport')}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold flex items-center justify-center gap-3 hover:border-white/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Support
              </button>
              <button 
                onClick={() => window.open('tel:+1-800-332-5791')}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold flex items-center justify-center gap-3 hover:border-white/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Support
              </button>
            </div>
            <div className="mt-6 text-white/70 text-sm">
              💡 <strong>Pro Tip:</strong> Live Chat gets you instant answers, while email is perfect for detailed issues.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerChat;