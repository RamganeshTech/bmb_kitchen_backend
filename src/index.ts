import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/connectDB.js';
import { errorHandler } from './middleware/error.middleware.js';
import userRoutes from './routes/user_router/user.routes.js';
import organizationRoutes from './routes/organization_routes/organization.routes.js';
import menuCategoryRoutes from './routes/menuCategory_routes/menuCategory.routes.js';
import menuItemRoutes from './routes/menu_routes/menuItem.routes.js';
import restaurantTableRoutes from './routes/restaurantTable_routes/restaurantTable.routes.js';
import orderRoutes from './routes/order_routes/order.routes.js';

// Load environment variables
dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy hop (Nginx on EC2) — without this, rate-limit and
// req.ip both see Nginx's IP instead of the real client IP, and every
// request gets bucketed under one "user".
app.set('trust proxy', 1);

// Security headers — sets sane defaults (X-Content-Type-Options, HSTS,
// X-Frame-Options, etc.) with almost no config needed
app.use(helmet());

// Request logging — verbose in dev, compact in prod (avoids logging noise on EC2)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // caps JSON payload size — file uploads go through multer, not this

// Global rate limiter — applied to all /api routes.
// Individual routes (login, form submission, etc.) can layer a stricter
// limiter on top of this one, same pattern as submitFormLimiter in AdPilot.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // requests per IP per window
  standardHeaders: true, // adds RateLimit-* headers
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is running successfully!' });
});

app.use("/api/auth", userRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/menu-category", menuCategoryRoutes);
app.use("/api/menu-item", menuItemRoutes);
app.use("/api/table", restaurantTableRoutes);
app.use("/api/orders", orderRoutes);

// Health Check (Optional but recommended for EC2 monitoring)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'active', message: 'server running', timestamp: new Date().toISOString() });
});

// 404 handler — catches unmatched routes before they fall through to errorHandler
app.use((req: Request, res: Response) => {
  res.status(404).json({ ok: false, message: `Route not found: ${req.originalUrl}` });
//   return;
});

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log('DB connected ✅');
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.log('error from DB connection', error.message);
  });