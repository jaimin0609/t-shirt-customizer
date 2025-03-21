import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

// Define password validation regex patterns
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Validate password strength against security requirements
 * @param {string} password - The password to validate
 * @returns {boolean} True if password meets all requirements
 */
const validatePasswordStrength = (password) => {
    if (!password || typeof password !== 'string') {
        return false;
    }
    
    // Check minimum length
    if (password.length < PASSWORD_MIN_LENGTH) {
        return false;
    }
    
    // Check for at least one uppercase, one lowercase, one number, one special char
    if (!PASSWORD_REGEX.test(password)) {
        return false;
    }
    
    // Check for common passwords (basic implementation)
    const commonPasswords = [
        'password', 'admin123', '123456', 'qwerty', 'letmein', 
        'welcome', 'monkey', 'password123', '123456789', 'qwerty123'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
        return false;
    }
    
    return true;
};

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: {
            isIn: [['admin', 'manager', 'editor', 'user']]
        }
    },
    permissions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        get() {
            const rawValue = this.getDataValue('permissions');
            return rawValue ? rawValue : this.getDefaultPermissions();
        }
    },
    profileImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    resetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    tokenVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    lastPasswordChange: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failedLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    accountLockedUntil: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                // Validate password strength on creation
                if (!validatePasswordStrength(user.password)) {
                    throw new Error('Password does not meet security requirements');
                }
                
                // Use a higher cost factor for increased security (10-12 is recommended)
                user.password = await bcrypt.hash(user.password, 12);
                user.lastPasswordChange = new Date();
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                // Validate password strength on update
                if (!validatePasswordStrength(user.password)) {
                    throw new Error('Password does not meet security requirements');
                }
                
                user.password = await bcrypt.hash(user.password, 12);
                user.lastPasswordChange = new Date();
                
                // Increment tokenVersion to invalidate existing tokens
                if (user.tokenVersion !== undefined) {
                    user.tokenVersion += 1;
                }
            }
        }
    },
    // Add instance methods to the model
    instanceMethods: {
        /**
         * Compare a password with the stored hash
         * @param {string} candidatePassword - Password to compare
         * @returns {Promise<boolean>} True if passwords match
         */
        comparePassword: async function(candidatePassword) {
            return bcrypt.compare(candidatePassword, this.password);
        },
        
        /**
         * Increment failed login attempts counter
         * @returns {Promise} Update result
         */
        incrementFailedLoginAttempts: async function() {
            this.failedLoginAttempts += 1;
            
            // Lock account after 5 failed attempts for 30 minutes
            if (this.failedLoginAttempts >= 5) {
                const lockTime = new Date();
                lockTime.setMinutes(lockTime.getMinutes() + 30);
                this.accountLockedUntil = lockTime;
            }
            
            return this.save();
        },
        
        /**
         * Reset failed login attempts counter
         * @returns {Promise} Update result
         */
        resetFailedLoginAttempts: async function() {
            this.failedLoginAttempts = 0;
            this.accountLockedUntil = null;
            return this.save();
        }
    }
});

// Add instance methods (Sequelize v6 syntax)
User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.incrementFailedLoginAttempts = async function() {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.failedLoginAttempts >= 5) {
        const lockTime = new Date();
        lockTime.setMinutes(lockTime.getMinutes() + 30);
        this.accountLockedUntil = lockTime;
    }
    
    return this.save();
};

User.prototype.resetFailedLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
    return this.save();
};

/**
 * Get default permissions based on role
 */
User.prototype.getDefaultPermissions = function() {
    const role = this.getDataValue('role');
    
    switch(role) {
        case 'admin':
            return {
                users: ['create', 'read', 'update', 'delete', 'manage'],
                products: ['create', 'read', 'update', 'delete', 'manage'],
                orders: ['create', 'read', 'update', 'delete', 'manage'],
                analytics: ['read', 'export'],
                settings: ['update']
            };
        case 'manager':
            return {
                users: ['read'],
                products: ['create', 'read', 'update'],
                orders: ['read', 'update'],
                analytics: ['read'],
                settings: []
            };
        case 'editor':
            return {
                users: [],
                products: ['read', 'update'],
                orders: ['read'],
                analytics: [],
                settings: []
            };
        case 'user':
        default:
            return {
                users: [],
                products: ['read'],
                orders: ['read'],
                analytics: [],
                settings: []
            };
    }
};

export default User; 