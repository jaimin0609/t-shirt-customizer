import { useState, useRef, useEffect } from 'react';
import { aiAssistantService } from '../../services/aiAssistantService';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

const AiChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm UniQVerse's AI assistant. How can I help you with your custom t-shirt needs today?",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!input.trim()) return;

        // Add user message
        const userMessage = {
            id: messages.length + 1,
            text: input.trim(),
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Get AI response
            const response = await aiAssistantService.getAIResponse(input.trim());

            // Add AI message
            const aiMessage = {
                id: messages.length + 2,
                text: response,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error getting AI response:", error);
            // Add error message
            const errorMessage = {
                id: messages.length + 2,
                text: "Sorry, I had trouble processing that. Please try again or contact our support team.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    // Format timestamp for messages
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {/* Chat Button */}
            <button
                onClick={toggleChat}
                className={`${isOpen ? 'hidden' : 'flex'} items-center justify-center p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105`}
                aria-label="Open chat assistant"
            >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </button>

            {/* Chat Window */}
            <div className={`${isOpen ? 'flex' : 'hidden'} flex-col bg-white rounded-lg shadow-xl w-80 sm:w-96 h-[500px] max-h-[80vh] overflow-hidden border border-gray-200`}>
                {/* Chat Header */}
                <div className="flex items-center justify-between bg-blue-600 text-white p-4">
                    <div className="flex items-center space-x-2">
                        <SparklesIcon className="h-5 w-5 text-yellow-300" />
                        <h3 className="font-medium">UniQVerse Assistant</h3>
                    </div>
                    <button
                        onClick={toggleChat}
                        className="text-white hover:text-gray-200 transition-colors"
                        aria-label="Close chat"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-lg ${message.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm">{message.text}</p>
                                <span className={`text-xs mt-1 block ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {formatTime(message.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start mb-4">
                            <div className="bg-white text-gray-800 p-3 rounded-lg border border-gray-200 rounded-bl-none">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type your question..."
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isTyping}
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AiChatWidget; 