// AdminSupportChat.jsx — White + #8ba03e Accent Version
import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import Navbar from "../../Components/Admin/Navbar";

function AdminSupportChat() {
  const [connection, setConnection] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
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

    const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role;
    if (role !== "Admin" && Number(role) !== 5) return;

    setIsAuthorized(true);

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7001/chatHub?access_token=${encodeURIComponent(token)}`)
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveAdminMessage", (fromAgentId, msg) => {
      setMessages(prev => ({
        ...prev,
        [fromAgentId]: [...(prev[fromAgentId] || []), {
          from: fromAgentId,
          msg,
          isMe: false,
          timestamp: new Date()
        }]
      }));
    });

    conn.onreconnecting(() => toast.loading("Reconnecting..."));
    conn.onreconnected(() => toast.success("Reconnected"));
    conn.onclose(() => toast.error("Connection lost"));

    conn.start()
      .then(async () => {
        setConnection(conn);
        toast.success("Connected to support system");

        const supportList = await conn.invoke("GetSupportTeam");
        setAgents(supportList.map(a => ({
          userId: a.userId,
          fullName: a.fullName || "Support Agent",
          email: a.email || ""
        })));
      })
      .catch(err => {
        console.error(err);
        toast.error("Connection failed");
      });

    return () => conn?.stop();
  }, []);

  const sendMessage = async () => {
    if (!connection || !selectedAgent || !message.trim()) return;

    const text = message.trim();
    setMessage("");

    setMessages(prev => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] || []), {
        from: "You",
        msg: text,
        isMe: true,
        timestamp: new Date()
      }]
    }));

    try {
      await connection.invoke("SendToSupportAgent", selectedAgent, text);
    } catch (err) {
      toast.error("Message failed to send");
      setMessages(prev => ({
        ...prev,
        [selectedAgent]: prev[selectedAgent].map((m, i, arr) =>
          i === arr.length - 1 ? { ...m, error: true } : m
        )
      }));
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[selectedAgent]]);

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar/> 
        {/* Navbar still shows even on denied */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-4xl font-bold text-gray-800">Access Denied — Admin Only</div>
        </div>
      </div>
    );
  }

  const currentChat = selectedAgent ? messages[selectedAgent] || [] : [];

return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Your Navbar - Fixed at Top */}
      <Navbar />
      <div>
<div>__xp//</div>
<div>__xp//</div>
</div>
      {/* Main Chat Layout - Takes remaining space */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-xl flex flex-col border-r border-gray-200">
          <div className="p-6 bg-[#8ba03e] text-white">
            <h1 className="text-2xl font-bold">Support Agents</h1>
            <p className="text-sm opacity-90">Click to start private chat</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {agents.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No agents online</div>
            ) : (
              agents.map(agent => (
                <div
                  key={agent.userId}
                  onClick={() => setSelectedAgent(agent.userId)}
                  className={`p-5 flex items-center space-x-4 cursor-pointer transition-all border-b border-gray-100
                    ${selectedAgent === agent.userId 
                      ? "bg-[#8ba03e]/5 border-l-4 border-l-[#8ba03e]" 
                      : "hover:bg-gray-50"
                    }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-[#8ba03e] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {agent.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-4 border-white rounded-full shadow"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.fullName}</h3>
                    <p className="text-sm text-gray-500">{agent.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedAgent ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl font-bold text-[#8ba03e] mb-4">Select Agent</div>
                <p className="text-xl text-gray-500">Choose an agent from the list to begin</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-[#8ba03e] text-white p-6 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/25 rounded-full flex items-center justify-center text-3xl font-bold">
                    {agents.find(a => a.userId === selectedAgent)?.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {agents.find(a => a.userId === selectedAgent)?.fullName}
                    </h2>
                    <p className="opacity-90">Private Admin Support Chat</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                {/* Messages remain the same */}
                {currentChat.length === 0 ? (
                  <div className="text-center py-24 text-gray-400">
                    <p className="text-lg">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {currentChat.map((m, i) => (
                      <div key={i} className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xl px-6 py-4 rounded-2xl shadow-md ${
                          m.isMe 
                            ? "bg-[#8ba03e] text-white" 
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}>
                          {!m.isMe && <div className="text-xs font-medium text-[#8ba03e] mb-1">Support Agent</div>}
                          <p className="text-lg leading-relaxed">{m.msg}</p>
                          <div className={`text-xs mt-2 ${m.isMe ? "opacity-80" : "text-gray-500"}`}>
                            {formatTime(m.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-gray-200">
                <div className="flex space-x-4 max-w-5xl mx-auto">
                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={`Message ${agents.find(a => a.userId === selectedAgent)?.fullName}...`}
                    className="flex-1 px-6 py-4 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8ba03e] text-gray-800 placeholder-gray-500 text-lg transition"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className="px-10 py-4 bg-[#8ba03e] text-white rounded-xl font-bold hover:bg-[#7a8f35] transition disabled:opacity-50 shadow-lg hover:shadow-xl"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSupportChat;