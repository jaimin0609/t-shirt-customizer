document.addEventListener('DOMContentLoaded', function() {
    // Get the current language from localStorage or default to 'en'
    const currentLang = localStorage.getItem('selectedLanguage') || 'en';
    
    // Add click event listeners to language options
    document.querySelectorAll('.dropdown-menu [data-lang]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedLang = this.getAttribute('data-lang');
            console.log('Selected language:', selectedLang); // Debug log
            localStorage.setItem('selectedLanguage', selectedLang);
            
            // Update the UI to show selected language
            updateLanguageUI(selectedLang);
        });
    });

    // Initial UI update
    console.log('Initial language:', currentLang); // Debug log
    updateLanguageUI(currentLang);
});

function updateLanguageUI(lang) {
    // Here you can add translations for your UI elements
    const translations = {
        en: {
            // Sidebar & Navigation
            home: 'HOME',
            analytics: 'Analytics',
            dashboard: 'Dashboard',
            reports: 'Reports',
            ecommerce: 'Ecommerce',
            products: 'Products',
            addProduct: 'Add Product',
            orders: 'Orders',
            customers: 'Customers',
            profile: 'Profile',
            logout: 'Logout',
            
            // Page Headers
            analyticsOverview: 'Analytics Overview',
            quickAccess: 'Quick Access',
            settings: 'Settings',
            
            // Stats Cards
            pageviews: 'Pageviews',
            avgSession: 'Avg Session',
            visitors: 'Visitors',
            bounceRate: 'Bounce Rate',
            vsLastWeek: 'vs last week',
            
            // Profile Modal
            editProfile: 'Edit Profile',
            name: 'Name',
            email: 'Email',
            newPassword: 'New Password (leave blank to keep current)',
            cancel: 'Cancel',
            saveChanges: 'Save Changes',
            
            // Notifications
            notifications: 'Notifications',
            newOrder: 'New order received',
            minutesAgo: 'mins ago',
            
            // Common Actions
            search: 'Search...',
            selectLanguage: 'Select Language',
            
            // Orders Page
            orderManagement: 'Order Management',
            searchOrders: 'Search orders...',
            orderId: 'Order ID',
            customer: 'Customer',
            date: 'Date',
            items: 'Items',
            total: 'Total',
            status: 'Status',
            actions: 'Actions',
            orderDetails: 'Order Details',
            updateStatus: 'Update Status',
            close: 'Close',
            allStatus: 'All Status',
            pending: 'Pending',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
            viewDetails: 'View Details',
            updateOrder: 'Update Order'
        },
        es: {
            // Sidebar & Navigation
            home: 'INICIO',
            analytics: 'Análisis',
            dashboard: 'Panel',
            reports: 'Informes',
            ecommerce: 'Comercio',
            products: 'Productos',
            addProduct: 'Añadir Producto',
            orders: 'Pedidos',
            customers: 'Clientes',
            profile: 'Perfil',
            logout: 'Cerrar Sesión',
            
            // Page Headers
            analyticsOverview: 'Resumen Analítico',
            quickAccess: 'Acceso Rápido',
            settings: 'Configuración',
            
            // Stats Cards
            pageviews: 'Páginas Vistas',
            avgSession: 'Sesión Promedio',
            visitors: 'Visitantes',
            bounceRate: 'Tasa de Rebote',
            vsLastWeek: 'vs semana anterior',
            
            // Profile Modal
            editProfile: 'Editar Perfil',
            name: 'Nombre',
            email: 'Correo',
            newPassword: 'Nueva Contraseña (dejar en blanco para mantener la actual)',
            cancel: 'Cancelar',
            saveChanges: 'Guardar Cambios',
            
            // Notifications
            notifications: 'Notificaciones',
            newOrder: 'Nuevo pedido recibido',
            minutesAgo: 'minutos atrás',
            
            // Common Actions
            search: 'Buscar...',
            selectLanguage: 'Seleccionar Idioma',
            
            // Orders Page
            orderManagement: 'Gestión de Pedidos',
            searchOrders: 'Buscar pedidos...',
            orderId: 'ID de Pedido',
            customer: 'Cliente',
            date: 'Fecha',
            items: 'Artículos',
            total: 'Total',
            status: 'Estado',
            actions: 'Acciones',
            orderDetails: 'Detalles del Pedido',
            updateStatus: 'Actualizar Estado',
            close: 'Cerrar',
            allStatus: 'Todos los Estados',
            pending: 'Pendiente',
            processing: 'Procesando',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado',
            viewDetails: 'Ver Detalles',
            updateOrder: 'Actualizar Pedido'
        },
        fr: {
            // Sidebar & Navigation
            home: 'ACCUEIL',
            analytics: 'Analytique',
            dashboard: 'Tableau de Bord',
            reports: 'Rapports',
            ecommerce: 'Commerce',
            products: 'Produits',
            addProduct: 'Ajouter un Produit',
            orders: 'Commandes',
            customers: 'Clients',
            profile: 'Profil',
            logout: 'Déconnexion',
            
            // Page Headers
            analyticsOverview: 'Aperçu Analytique',
            quickAccess: 'Accès Rapide',
            settings: 'Paramètres',
            
            // Stats Cards
            pageviews: 'Pages Vues',
            avgSession: 'Session Moyenne',
            visitors: 'Visiteurs',
            bounceRate: 'Taux de Rebond',
            vsLastWeek: 'vs semaine dernière',
            
            // Profile Modal
            editProfile: 'Modifier le Profil',
            name: 'Nom',
            email: 'Email',
            newPassword: 'Nouveau Mot de Passe (laisser vide pour garder l\'actuel)',
            cancel: 'Annuler',
            saveChanges: 'Enregistrer',
            
            // Notifications
            notifications: 'Notifications',
            newOrder: 'Nouvelle commande reçue',
            minutesAgo: 'minutes',
            
            // Common Actions
            search: 'Rechercher...',
            selectLanguage: 'Choisir la Langue',
            
            // Orders Page
            orderManagement: 'Gestion des Commandes',
            searchOrders: 'Rechercher des commandes...',
            orderId: 'ID de Commande',
            customer: 'Client',
            date: 'Date',
            items: 'Articles',
            total: 'Total',
            status: 'Statut',
            actions: 'Actions',
            orderDetails: 'Détails de la Commande',
            updateStatus: 'Mettre à jour le Statut',
            close: 'Fermer',
            allStatus: 'Tous les Statuts',
            pending: 'En attente',
            processing: 'En traitement',
            shipped: 'Expédié',
            delivered: 'Livré',
            cancelled: 'Annulé',
            viewDetails: 'Voir les Détails',
            updateOrder: 'Mettre à jour la Commande'
        }
    };

    // Get the translation object for the selected language
    const t = translations[lang] || translations.en;
    
    // Update text content for elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (t[key]) {
            element.textContent = t[key];
        }
    });

    // Update placeholders for inputs with data-translate-placeholder
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (t[key]) {
            element.placeholder = t[key];
        }
    });

    // Update aria-labels with data-translate-aria
    document.querySelectorAll('[data-translate-aria]').forEach(element => {
        const key = element.getAttribute('data-translate-aria');
        if (t[key]) {
            element.setAttribute('aria-label', t[key]);
        }
    });

    // Add a class to indicate the currently selected language
    document.querySelectorAll('[data-lang]').forEach(langItem => {
        langItem.classList.toggle('active', langItem.getAttribute('data-lang') === lang);
    });
} 