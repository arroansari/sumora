const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

function validateRegister(req, res, next) {
  try {
    req.body = registerSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ValidationError',
        message: err.errors[0]?.message || 'Invalid input data',
        details: err.errors,
      });
    }
    next(err);
  }
}

function validateLogin(req, res, next) {
  try {
    req.body = loginSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ValidationError',
        message: err.errors[0]?.message || 'Invalid input data',
        details: err.errors,
      });
    }
    next(err);
  }
}

module.exports = {
  validateRegister,
  validateLogin,
};

