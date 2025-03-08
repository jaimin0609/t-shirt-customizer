export const products = [
    // Customizable Products
    {
        id: 1,
        name: "Classic Cotton T-Shirt",
        price: 29.99,
        category: "customizable-tshirts",
        gender: "men",
        ageGroup: "adult",
        isCustomizable: true,
        description: "Premium cotton basic t-shirt perfect for customization",
        images: {
            white: {
                front: "/images/tshirts/classic/white-front.png",
                back: "/images/tshirts/classic/white-back.png"
            },
            black: {
                front: "/images/tshirts/classic/black-front.png",
                back: "/images/tshirts/classic/black-back.png"
            }
        },
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        colors: ["white", "black", "navy", "red", "gray"],
        tags: ["basic", "cotton", "casual", "customizable"],
        featured: true
    },
    {
        id: 2,
        name: "V-Neck Premium Tee",
        price: 34.99,
        category: "t-shirts",
        gender: "women",
        ageGroup: "adult",
        description: "Soft and stylish v-neck t-shirt",
        images: {
            white: {
                front: "https://placeit-img-1-p.cdn.aws.placeit.net/uploads/stage/stage_image/180061/optimized_product_thumb_m37588.jpg",
                back: "https://placeit-img-1-p.cdn.aws.placeit.net/uploads/stage/stage_image/34877/optimized_product_thumb_24977a__4_.jpg"
            },
            black: {
                front: "/images/tshirts/vneck/black-front.png",
                back: "/images/tshirts/vneck/black-back.png"
            }
        },
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["white", "black", "pink", "navy"],
        tags: ["v-neck", "premium", "fitted"],
        featured: true
    },
    {
        id: 3,
        name: "Youth Basic Tee",
        price: 24.99,
        category: "t-shirts",
        gender: "unisex",
        ageGroup: "youth",
        description: "Durable and comfortable youth t-shirt",
        images: {
            white: {
                front: "https://placeit-img-1-p.cdn.aws.placeit.net/uploads/stage/stage_image/197265/optimized_product_thumb_stream.jpg",
                back: "https://placeit-img-1-p.cdn.aws.placeit.net/uploads/stage/stage_image/197271/optimized_product_thumb_stream.jpg"
            },
            black: {
                front: "/images/tshirts/youth/black-front.png",
                back: "/images/tshirts/youth/black-back.png"
            }
        },
        sizes: ["YXS", "YS", "YM", "YL", "YXL"],
        colors: ["white", "black", "red", "blue"],
        tags: ["youth", "basic", "school"],
        featured: false
    },
    // Ready-made Products
    {
        id: 101,
        name: "Urban Streetwear Hoodie",
        price: 49.99,
        category: "hoodies",
        gender: "unisex",
        ageGroup: "adult",
        isCustomizable: false,
        description: "Trendy streetwear hoodie with modern design",
        image: "/images/readymade/hoodies/urban-streetwear.png",
        sizes: ["S", "M", "L", "XL"],
        colors: ["black"],
        tags: ["streetwear", "urban", "trendy"],
        featured: true
    },
    {
        id: 102,
        name: "Classic Baseball Cap",
        price: 24.99,
        category: "caps",
        gender: "unisex",
        ageGroup: "adult",
        isCustomizable: false,
        description: "Traditional 6-panel baseball cap",
        image: "/images/readymade/caps/classic-baseball.png",
        sizes: ["One Size"],
        colors: ["navy", "black", "red"],
        tags: ["casual", "sports", "classic"],
        featured: false
    },
    {
        id: 103,
        name: "Snapback Urban Cap",
        price: 29.99,
        category: "caps",
        gender: "unisex",
        ageGroup: "adult",
        isCustomizable: false,
        description: "Modern snapback with flat brim",
        image: "/images/readymade/caps/snapback-urban.png",
        sizes: ["One Size"],
        colors: ["black/gold", "navy/white", "red/black"],
        tags: ["urban", "trendy", "streetwear"],
        featured: true
    },
    {
        id: 104,
        name: "Running Shoes Pro",
        price: 89.99,
        category: "shoes",
        gender: "unisex",
        ageGroup: "adult",
        isCustomizable: false,
        description: "Professional running shoes with air cushion",
        image: "/images/readymade/shoes/running-pro.png",
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["black/red", "grey/blue", "white/black"],
        tags: ["sports", "running", "professional"],
        featured: true
    },
    {
        id: 105,
        name: "Casual Sneakers",
        price: 69.99,
        category: "shoes",
        gender: "unisex",
        ageGroup: "adult",
        isCustomizable: false,
        description: "Comfortable everyday sneakers",
        image: "/images/readymade/shoes/casual-sneakers.png",
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["white", "black", "grey"],
        tags: ["casual", "comfortable", "everyday"],
        featured: false
    }
];

export const categories = [
    // Customizable Categories
    {
        id: "customizable-tshirts",
        name: "Customizable T-Shirts",
        subcategories: ["crew-neck", "v-neck", "polo", "tank-top"],
        isCustomizable: true
    },
    // Ready-made Categories
    {
        id: "hoodies",
        name: "Hoodies",
        subcategories: ["pullover", "zip-up", "sleeveless"],
        isCustomizable: false
    },
    {
        id: "caps",
        name: "Caps",
        subcategories: ["baseball", "snapback", "fitted", "beanie"],
        isCustomizable: false
    },
    {
        id: "shoes",
        name: "Shoes",
        subcategories: ["running", "casual", "sports", "lifestyle"],
        isCustomizable: false
    }
];

export const genders = [
    { id: "men", name: "Men" },
    { id: "women", name: "Women" },
    { id: "unisex", name: "Unisex" }
];

export const ageGroups = [
    { id: "adult", name: "Adults" },
    { id: "youth", name: "Youth" },
    { id: "kids", name: "Kids" }
];

export const colors = [
    { id: "white", name: "White", hex: "#FFFFFF" },
    { id: "black", name: "Black", hex: "#000000" },
    { id: "navy", name: "Navy", hex: "#000080" },
    { id: "red", name: "Red", hex: "#FF0000" },
    { id: "gray", name: "Gray", hex: "#808080" },
    { id: "pink", name: "Pink", hex: "#FFC0CB" },
    { id: "blue", name: "Blue", hex: "#0000FF" }
];

export const styles = [
    { id: "casual", name: "Casual" },
    { id: "athletic", name: "Athletic" },
    { id: "premium", name: "Premium" },
    { id: "basic", name: "Basic" }
];

// Add shoe sizes
export const shoeSizes = [
    "6", "6.5", "7", "7.5", "8", "8.5", "9", 
    "9.5", "10", "10.5", "11", "11.5", "12"
];

// Add cap sizes
export const capSizes = [
    "S/M", "L/XL", "One Size", "Adjustable"
]; 