// import React, { useState, useEffect, useRef } from 'react';
// import * as signalR from "@microsoft/signalr";
// import { jwtDecode } from "jwt-decode";
// import { 
//   FaTimes, 
//   FaSearch,
//   FaEdit,
//   FaTrash,
//   FaCheck,
//   FaTimesCircle
// } from 'react-icons/fa';
// import { 
//   IoMdCheckmark, 
//   IoMdCheckmarkCircle
// } from 'react-icons/io';
// import { Send } from 'lucide-react';

// const MessagesModal = ({ 
//   setShowMessages, 
//   messageThreads: initialThreads 
// }) => {
//   // SignalR State
//   const [connection, setConnection] = useState(null);
//   const [connectionStatus, setConnectionStatus] = useState("Disconnected");
//   const [isAuthorized, setIsAuthorized] = useState(false);
//   const [userId, setUserId] = useState("");

//   // Message State
//   const [newMessage, setNewMessage] = useState('');
//   const [messageThreads, setMessageThreads] = useState(() => {
//     const threadsWithHistory = initialThreads?.map(thread => ({
//       ...thread,
//       messages: thread.messages || [], 
//       unread: thread.unread || false
//     })) || [];
//     return threadsWithHistory;
//   });
  
//   const [activeThread, setActiveThread] = useState(initialThreads?.[0]?.id || null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredThreads, setFilteredThreads] = useState(initialThreads || []);
//   const [editingMessageId, setEditingMessageId] = useState(null);
//   const [editMessageText, setEditMessageText] = useState('');
//   const [selectedMessageId, setSelectedMessageId] = useState(null);
//   const [activeTab, setActiveTab] = useState('all');

//   const messagesEndRef = useRef(null);
//   const messageOptionsRef = useRef(null);
//   const connRef = useRef(null);
//   const isMounted = useRef(true);

//   // --------------------------------------------------------------
//   // 1. SignalR Connection Setup for Vendor
//   // --------------------------------------------------------------
//   useEffect(() => {
//     isMounted.current = true;
    
//     const startConnection = async () => {
//       try {
//         const token = localStorage.getItem("authToken");
//         if (!token) {
//           console.warn("Please login first: no authToken in localStorage.");
//           return;
//         }

//         const decoded = jwtDecode(token);
//         const uid = decoded.nameid || decoded.sub || 
//                    decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"];
//         const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
//                     decoded.role || decoded["role"];

//         // Check if user is a vendor
//         const isVendor = role === "Vendor" || role === "2" || Number(role) === 2;
//         if (!isVendor) {
//           console.warn("Access denied. Vendors only.");
//           return;
//         }

//         setUserId(uid);
//         setIsAuthorized(true);
//         setConnectionStatus("Connecting...");

//         const hubUrl = `https://localhost:7001/chatHub?access_token=${encodeURIComponent(token)}`;

//         const conn = new signalR.HubConnectionBuilder()
//           .withUrl(hubUrl)
//           .withAutomaticReconnect([0, 1000, 3000, 5000, 10000, 15000, 30000])
//           .configureLogging(signalR.LogLevel.Information)
//           .build();

//         connRef.current = conn;

//         // Connection event handlers
//         conn.onreconnecting(() => {
//           console.log("Reconnecting...");
//           if (isMounted.current) setConnectionStatus("Reconnecting...");
//         });

//         conn.onreconnected(() => {
//           console.log("Reconnected");
//           if (isMounted.current) setConnectionStatus("Connected");
//         });

//         conn.onclose(() => {
//           console.log("Connection closed");
//           if (isMounted.current) {
//             setConnectionStatus("Disconnected");
//             setConnection(null);
//           }
//         });

//         // Handle incoming messages from support
//         conn.on("ReceiveMessage", (fromUserId, msg) => {
//           console.log("Message received from:", fromUserId, msg);
          
//           setMessageThreads(prev => {
//             const updatedThreads = prev.map(thread => {
//               if (thread.id === fromUserId || thread.supportId === fromUserId) {
//                 const newMessage = {
//                   id: Date.now() + Math.random(),
//                   sender: 'Support',
//                   message: msg,
//                   time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//                   isSupport: true,
//                   timestamp: new Date()
//                 };
                
//                 return {
//                   ...thread,
//                   messages: [...thread.messages, newMessage],
//                   preview: `Support: ${msg.substring(0, 30)}...`,
//                   time: 'Just now',
//                   unread: thread.id !== activeThread
//                 };
//               }
//               return thread;
//             });
            
//             return updatedThreads;
//           });
//         });

//         await conn.start();
//         if (!isMounted.current) return;

//         setConnection(conn);
//         setConnectionStatus("Connected");

//         // Load any pending messages
//         try {
//           await conn.invoke("CheckPendingMessages");
//         } catch (invokeErr) {
//           console.warn("CheckPendingMessages failed", invokeErr);
//         }

//       } catch (e) {
//         console.error("SignalR connection failed:", e);
//         if (isMounted.current) {
//           setConnectionStatus("Failed");
//         }
//       }
//     };

//     startConnection();

//     return () => {
//       isMounted.current = false;
//       if (connRef.current) {
//         connRef.current.stop().catch(() => {});
//         connRef.current = null;
//       }
//     };
//   }, []);

//   // --------------------------------------------------------------
//   // 2. Message Handling
//   // --------------------------------------------------------------
//   const sendMessageToSupport = async (messageObj) => {
//     if (!connRef.current || !activeThread) {
//       console.error("No connection or active thread");
//       return;
//     }

//     try {
//       // Send to support (using "support" as target or specific support user ID)
//       await connRef.current.invoke("SendPrivateMessage", "support", messageObj.message);
      
//       // Update message status
//       setTimeout(() => {
//         setMessageThreads(prev => prev.map(thread => 
//           thread.id === activeThread 
//             ? {
//                 ...thread,
//                 messages: thread.messages.map(msg => 
//                   msg.id === messageObj.id ? { ...msg, status: 'delivered' } : msg
//                 )
//               }
//             : thread
//         ));
//       }, 1000);

//       setTimeout(() => {
//         setMessageThreads(prev => prev.map(thread => 
//           thread.id === activeThread 
//             ? {
//                 ...thread,
//                 messages: thread.messages.map(msg => 
//                   msg.id === messageObj.id ? { ...msg, status: 'read' } : msg
//                 )
//               }
//             : thread
//         ));
//       }, 2000);

//     } catch (error) {
//       console.error("Failed to send message:", error);
//       // Mark message as failed
//       setMessageThreads(prev => prev.map(thread => 
//         thread.id === activeThread 
//           ? {
//               ...thread,
//               messages: thread.messages.map(msg => 
//                 msg.id === messageObj.id ? { ...msg, error: true } : msg
//               )
//             }
//           : thread
//       ));
//     }
//   };

//   const handleSendMessage = () => {
//     if (newMessage.trim() && activeThread && connRef.current) {
//       const newMessageObj = {
//         id: Date.now(),
//         sender: 'You',
//         message: newMessage,
//         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         isSupport: false,
//         status: 'sent'
//       };

//       // Optimistic UI update
//       setMessageThreads(prev => prev.map(thread => 
//         thread.id === activeThread 
//           ? {
//               ...thread,
//               messages: [...thread.messages, newMessageObj],
//               preview: newMessage,
//               time: 'Just now',
//               unread: false
//             }
//           : thread
//       ));

//       setNewMessage('');
//       sendMessageToSupport(newMessageObj);
//     }
//   };

//   // --------------------------------------------------------------
//   // 3. UI Helpers and Effects
//   // --------------------------------------------------------------
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (messageOptionsRef.current && !messageOptionsRef.current.contains(event.target)) {
//         setSelectedMessageId(null);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const getActiveThreadMessages = () => {
//     if (!activeThread) return [];
//     const thread = messageThreads.find(t => t.id === activeThread);
//     return thread?.messages || [];
//   };

//   useEffect(() => {
//     if (searchQuery.trim() === '') {
//       setFilteredThreads(messageThreads);
//     } else {
//       const filtered = messageThreads.filter(thread =>
//         thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         thread.preview.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//       setFilteredThreads(filtered);
//     }
//   }, [searchQuery, messageThreads]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [getActiveThreadMessages()]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const handleThreadClick = (threadId) => {
//     setActiveThread(threadId);
//     setSelectedMessageId(null);
//     setEditingMessageId(null);
    
//     setMessageThreads(prev => prev.map(thread => 
//       thread.id === threadId 
//         ? { ...thread, unread: false }
//         : thread
//     ));
//   };

//   const handleSearchChange = (e) => {
//     setSearchQuery(e.target.value);
//   };

//   const handleMessageClick = (messageId) => {
//     setSelectedMessageId(selectedMessageId === messageId ? null : messageId);
//   };

//   const handleEditMessage = (message) => {
//     setEditingMessageId(message.id);
//     setEditMessageText(message.message);
//     setSelectedMessageId(null);
//   };

//   const handleSaveEdit = () => {
//     if (editMessageText.trim() && activeThread) {
//       setMessageThreads(prev => prev.map(thread => 
//         thread.id === activeThread 
//           ? {
//               ...thread,
//               messages: thread.messages.map(msg => 
//                 msg.id === editingMessageId 
//                   ? { 
//                       ...msg, 
//                       message: editMessageText,
//                       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//                       edited: true 
//                     }
//                   : msg
//               ),
//               preview: editMessageText,
//               time: 'Just now'
//             }
//           : thread
//       ));
//       setEditingMessageId(null);
//       setEditMessageText('');
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditingMessageId(null);
//     setEditMessageText('');
//   };

//   const handleDeleteMessage = (messageId) => {
//     if (activeThread) {
//       setMessageThreads(prev => prev.map(thread => 
//         thread.id === activeThread 
//           ? {
//               ...thread,
//               messages: thread.messages.filter(msg => msg.id !== messageId),
//               preview: thread.messages.length > 1 ? thread.messages[thread.messages.length - 2]?.message : 'No messages',
//               time: 'Just now'
//             }
//           : thread
//       ));
//       setSelectedMessageId(null);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const renderMessageStatus = (status) => {
//     switch (status) {
//       case 'sent':
//         return <IoMdCheckmark className="w-4 h-4 text-gray-400" />;
//       case 'delivered':
//         return <IoMdCheckmark className="w-4 h-4 text-gray-400" />;
//       case 'read':
//         return <IoMdCheckmarkCircle className="w-4 h-4 text-[#586330]" />;
//       default:
//         return null;
//     }
//   };

//   const activeThreadData = messageThreads.find(thread => thread.id === activeThread);
//   const threadMessages = getActiveThreadMessages();

//   if (!isAuthorized) {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
//           <div className="text-red-600 text-xl font-semibold mb-4">Access Denied</div>
//           <div className="text-gray-600 mb-4">This chat is for vendors only.</div>
//           <button 
//             onClick={() => setShowMessages(false)}
//             className="bg-[#586330] text-white px-6 py-2 rounded-lg hover:bg-[#586330]/80 transition-colors"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex overflow-hidden shadow-lg border border-gray-200">
//         {/* Left Sidebar */}
//         <div className="w-96 bg-gray-100 border-r border-gray-200 flex flex-col">
//           <div className="p-4 border-b border-gray-200">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-lg font-semibold text-[#586330]">Vendor Support</h2>
//               <div className="flex items-center gap-2">
//                 <div className={`w-2 h-2 rounded-full ${
//                   connectionStatus === "Connected" ? "bg-green-500" : 
//                   connectionStatus.includes("Reconnecting") ? "bg-yellow-500" : "bg-red-500"
//                 }`} />
//                 <span className="text-xs text-gray-500">{connectionStatus}</span>
//                 <button 
//                   onClick={() => setShowMessages(false)}
//                   className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors"
//                 >
//                   <FaTimes className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>

//             <div className="relative mb-4">
//               <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search support chats"
//                 className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#586330]/40"
//                 value={searchQuery}
//                 onChange={handleSearchChange}
//               />
//             </div>

//             <div className="flex gap-2">
//               {['all', 'active', 'closed'].map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//                     activeTab === tab
//                       ? "bg-[#586330] text-white"
//                       : "text-gray-600 hover:bg-[#586330] hover:text-white"
//                   }`}
//                 >
//                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="flex-1 overflow-y-auto">
//             {filteredThreads.length > 0 ? (
//               filteredThreads.map((thread) => (
//                 <div
//                   key={thread.id}
//                   onClick={() => handleThreadClick(thread.id)}
//                   className={`p-4 border-b border-gray-200 cursor-pointer transition ${
//                     activeThread === thread.id ? "bg-[#586330]/20" : "hover:bg-gray-100"
//                   } ${thread.unread ? 'border-l-4 border-l-[#586330]' : ''}`}
//                 >
//                   <div className="flex items-start gap-3">
//                     <div className="w-10 h-10 rounded-full bg-[#586330]/10 text-[#586330] flex items-center justify-center font-medium">
//                       {thread.title.charAt(0)}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center justify-between mb-1">
//                         <h3 className="font-medium text-gray-800 truncate">{thread.title}</h3>
//                         <span className="text-xs text-gray-400">{thread.time}</span>
//                       </div>
//                       <p className="text-xs text-gray-500 truncate">
//                         {thread.preview}
//                       </p>
//                       {thread.unread && (
//                         <div className="w-2 h-2 bg-[#586330] rounded-full mt-1" />
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="flex flex-col items-center justify-center h-32 text-gray-500">
//                 <FaSearch className="w-6 h-6 mb-2" />
//                 <p className="text-sm">No support chats found</p>
//                 <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Panel */}
//         <div className="flex-1 flex flex-col bg-white">
//           {activeThreadData ? (
//             <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
//               <div>
//                 <h2 className="text-lg font-semibold text-[#586330]">
//                   Support Chat - {activeThreadData.title}
//                 </h2>
//                 <p className="text-sm text-gray-600">Connected to support team</p>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className={`w-2 h-2 rounded-full ${
//                   connectionStatus === "Connected" ? "bg-green-500" : "bg-red-500"
//                 }`} />
//                 <span className="text-xs text-gray-500">{connectionStatus}</span>
//                 <div className="w-10 h-10 rounded-full bg-[#586330]/10 text-[#586330] flex items-center justify-center ml-2">
//                   {activeThreadData.title.charAt(0)}
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
//               <div className="flex items-center space-x-3">
//                 <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
//                   <span className="text-gray-600 font-medium">?</span>
//                 </div>
//                 <span className="font-semibold text-gray-800">Select a support chat</span>
//               </div>
//             </div>
//           )}

//           <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
//             {activeThread ? (
//               <>
//                 {threadMessages.map((msg) => (
//                   <div
//                     key={msg.id}
//                     className={`flex items-start gap-3 ${
//                       msg.isSupport ? "" : "flex-row-reverse"
//                     }`}
//                   >
//                     {editingMessageId === msg.id ? (
//                       <div className="max-w-md w-full">
//                         <div className="bg-white rounded-2xl p-2 shadow-sm border border-[#586330]">
//                           <input
//                             type="text"
//                             value={editMessageText}
//                             onChange={(e) => setEditMessageText(e.target.value)}
//                             className="w-full px-3 py-2 text-gray-800 text-sm focus:outline-none"
//                             autoFocus
//                             onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
//                           />
//                           <div className="flex justify-end space-x-2 mt-2">
//                             <button
//                               onClick={handleCancelEdit}
//                               className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
//                             >
//                               <FaTimesCircle className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={handleSaveEdit}
//                               className="p-1 text-[#586330] hover:text-[#586330]/80 transition-colors"
//                             >
//                               <FaCheck className="w-4 h-4" />
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     ) : (
//                       <div
//                         className={`flex flex-col ${
//                           msg.isSupport ? "items-start" : "items-end"
//                         }`}
//                       >
//                         <div
//                           className={`max-w-md px-4 py-3 rounded-2xl relative cursor-pointer ${
//                             msg.isSupport
//                               ? "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
//                               : "bg-[#586330]/80 text-white rounded-tr-none"
//                           } shadow-sm hover:opacity-95 transition-opacity ${
//                             selectedMessageId === msg.id ? 'ring-2 ring-[#586330]' : ''
//                           }`}
//                           onClick={() => !msg.isSupport && handleMessageClick(msg.id)}
//                         >
//                           <p className="text-sm">{msg.message}</p>
//                           {msg.error && (
//                             <div className="text-xs text-red-600 mt-1">Failed to send</div>
//                           )}
                          
//                           {/* Message Options */}
//                           {!msg.isSupport && selectedMessageId === msg.id && (
//                             <div 
//                               ref={messageOptionsRef}
//                               className="absolute top-0 right-0 mt-8 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-32"
//                             >
//                               <button
//                                 onClick={() => handleEditMessage(msg)}
//                                 className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
//                               >
//                                 <FaEdit className="w-3 h-3" />
//                                 <span>Edit</span>
//                               </button>
//                               <button
//                                 onClick={() => handleDeleteMessage(msg.id)}
//                                 className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
//                               >
//                                 <FaTrash className="w-3 h-3" />
//                                 <span>Delete</span>
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                         <div className={`flex items-center space-x-1 mt-1 ${
//                           msg.isSupport ? "justify-start" : "justify-end"
//                         }`}>
//                           <span className="text-xs text-gray-400 flex items-center">
//                             {msg.time}
//                             {msg.edited && (
//                               <span className="ml-1 text-xs opacity-60">(edited)</span>
//                             )}
//                           </span>
//                           {!msg.isSupport && msg.status && (
//                             <span className="ml-1">
//                               {renderMessageStatus(msg.status)}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//                 <div ref={messagesEndRef} />
//               </>
//             ) : (
//               <div className="flex items-center justify-center h-full">
//                 <div className="text-center">
//                   <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <span className="text-gray-400 text-2xl">💬</span>
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-600 mb-2">Vendor Support</h3>
//                   <p className="text-gray-500 max-w-sm">
//                     Select a support chat to start messaging. Your conversations with support team will appear here.
//                   </p>
//                   <div className="mt-4 text-sm text-gray-400">
//                     Connection: {connectionStatus}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {activeThread && (
//             <div className="p-6 border-t border-gray-200 bg-white">
//               <div className="flex items-center gap-3">
//                 <input
//                   type="text"
//                   placeholder="Type your message to support..."
//                   value={newMessage}
//                   onChange={(e) => setNewMessage(e.target.value)}
//                   onKeyDown={handleKeyPress}
//                   className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#586330]/40"
//                   disabled={connectionStatus !== "Connected"}
//                 />
//                 <button
//                   onClick={handleSendMessage}
//                   disabled={!newMessage.trim() || connectionStatus !== "Connected"}
//                   className="p-3 bg-[#586330]/80 hover:bg-[#586330] text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <Send className="w-5 h-5" />
//                 </button>
//               </div>
//               <div className="text-xs text-gray-500 mt-2 flex justify-between">
//                 <span>
//                   {connectionStatus === "Connected" 
//                     ? "Connected to support team" 
//                     : connectionStatus === "Reconnecting..."
//                     ? "Reconnecting to support..."
//                     : "Disconnected from support"}
//                 </span>
//                 <span>{newMessage.length}/500</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MessagesModal;