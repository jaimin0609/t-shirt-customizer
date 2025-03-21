import express from 'express';
import authController from '../controllers/authController.js';
import errorController from '../controllers/errorController.js';
import { validateLogin, validateRegistration } from '../validators/authValidators.js';

const router = express.Router();

// Wrap async route handlers with the catchAsync utility
router.post('/register', 
  validateRegistration, 
  errorController.catchAsync(authController.register)
);

router.post('/login', 
  validateLogin, 
  errorController.catchAsync(authController.login)
);

router.post('/refresh-token', 
  errorController.catchAsync(authController.refreshToken)
);

router.post('/logout', 
  errorController.catchAsync(authController.logout)
);

export default router; 