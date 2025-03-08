import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// For now we'll use a mock service that simulates AI responses
// In a production app, you would connect to an actual AI API endpoint

class AIAssistantService {
    constructor() {
        this.faqData = [
            {
                question: "How do I customize a t-shirt?",
                answer: "You can customize a t-shirt by selecting a product from our catalog and clicking 'Customize'. This will open our design studio where you can add text, upload images, or use our pre-made designs."
            },
            {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and Apple Pay."
            },
            {
                question: "How long does shipping take?",
                answer: "Standard shipping typically takes 5-7 business days. Express shipping options are available at checkout for 2-3 business day delivery."
            },
            {
                question: "Can I return a customized product?",
                answer: "We accept returns of customized products only if there is a printing defect or error on our part. Please refer to our Returns Policy page for more details."
            },
            {
                question: "What sizes do you offer?",
                answer: "We offer sizes ranging from XS to 3XL for most products. Each product page includes a detailed size chart to help you find the perfect fit."
            },
            {
                question: "How do I track my order?",
                answer: "Once your order ships, you'll receive a tracking number via email. You can also view your order status by logging into your account and visiting the Orders section."
            },
            {
                question: "Do you ship internationally?",
                answer: "Yes, we ship to most countries worldwide. International shipping times and rates vary by location and are calculated at checkout."
            }
        ];
        
        this.generalResponses = {
            greeting: "Hello! I'm UniQVerse's AI assistant. How can I help you with your custom t-shirt needs today?",
            fallback: "I don't have specific information about that. Would you like me to connect you with our customer support team?",
            thanks: "You're welcome! Is there anything else I can help you with?",
            about: "UniQVerse is a custom t-shirt design platform that allows you to create unique, personalized apparel. We offer high-quality printing, a wide range of products, and an easy-to-use design studio.",
        };
    }

    async getResponse(message) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Convert message to lowercase for easier matching
        const lowerMessage = message.toLowerCase();
        
        // Check for greetings
        if (this.containsAny(lowerMessage, ['hello', 'hi', 'hey', 'greetings'])) {
            return this.generalResponses.greeting;
        }
        
        // Check for thanks
        if (this.containsAny(lowerMessage, ['thank', 'thanks', 'appreciate'])) {
            return this.generalResponses.thanks;
        }
        
        // Check for questions about the company
        if (this.containsAny(lowerMessage, ['about', 'company', 'who are you', 'what is uniqverse'])) {
            return this.generalResponses.about;
        }
        
        // Try to match with FAQ data
        for (const faq of this.faqData) {
            // Look for keywords from the question
            const keywords = faq.question.toLowerCase().split(' ')
                .filter(word => word.length > 3)
                .filter(word => !['what', 'where', 'when', 'why', 'how', 'does', 'do', 'can', 'could', 'would', 'should', 'is', 'are', 'was', 'were'].includes(word));
                
            // If message contains multiple keywords from a FAQ question, return that answer
            const matchCount = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
            if (matchCount >= 2 || (keywords.length === 1 && lowerMessage.includes(keywords[0]))) {
                return faq.answer;
            }
        }
        
        // Look for specific keywords to give more targeted responses
        if (this.containsAny(lowerMessage, ['size', 'sizing', 'fit'])) {
            return "We offer sizes from XS to 3XL. You can find detailed size charts on each product page. If you're between sizes, we generally recommend sizing up for a more comfortable fit.";
        }
        
        if (this.containsAny(lowerMessage, ['material', 'fabric', 'cotton'])) {
            return "Most of our t-shirts are made from high-quality 100% cotton or a cotton/polyester blend for increased durability and comfort. The exact material composition is listed on each product page.";
        }
        
        if (this.containsAny(lowerMessage, ['design', 'customize', 'personalize'])) {
            return "Our user-friendly design studio allows you to add text, upload your own images, or choose from our library of designs. You can also adjust colors, sizing, and placement for complete creative control.";
        }
        
        if (this.containsAny(lowerMessage, ['shipping', 'delivery', 'ship'])) {
            return "Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available at checkout. International shipping times vary by location. All orders include tracking information.";
        }
        
        if (this.containsAny(lowerMessage, ['return', 'refund', 'exchange'])) {
            return "We accept returns within 30 days for non-customized products in original condition. Custom-designed products can only be returned if there's a printing defect. Please visit our Returns Policy page for full details.";
        }
        
        if (this.containsAny(lowerMessage, ['payment', 'pay', 'credit card'])) {
            return "We accept all major credit cards, PayPal, and Apple Pay. All payments are securely processed and your information is never stored on our servers.";
        }
        
        if (this.containsAny(lowerMessage, ['discount', 'coupon', 'promo', 'code', 'sale'])) {
            return "We regularly offer seasonal promotions and discounts. Subscribe to our newsletter for exclusive deals, or follow us on social media for the latest offers and promo codes.";
        }
        
        if (this.containsAny(lowerMessage, ['bulk', 'wholesale', 'order', 'team', 'group'])) {
            return "We offer special pricing for bulk orders of 10+ items. Please contact our customer service team at bulk@uniqverse.com for a custom quote.";
        }
        
        if (this.containsAny(lowerMessage, ['contact', 'support', 'help', 'service'])) {
            return "Our customer support team is available Monday to Friday, 9am-6pm EST. You can reach us by email at support@uniqverse.com or by phone at (555) 123-4567. You can also visit our Contact Us page for more options.";
        }
        
        // If no specific match, return the fallback response
        return this.generalResponses.fallback;
    }
    
    // Helper function to check if a string contains any of the keywords
    containsAny(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    // In a production environment, this would connect to your backend API or directly to an AI provider
    async getAIResponse(message) {
        try {
            // This is where you would make the API call to your AI provider
            // For now, we'll use our simulated responses
            const response = await this.getResponse(message);
            return response;
        } catch (error) {
            console.error("Error getting AI response:", error);
            return "Sorry, I'm having trouble connecting right now. Please try again later or contact our support team for immediate assistance.";
        }
    }
}

export const aiAssistantService = new AIAssistantService(); 