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
import inventoryRoutes from './routes/inventory_routes/inventory.routes.js';
import purchaseRoutes from './routes/purchase_routes/purchase.routes.js';
import recipeCostRoutes from './routes/recipeCost_routes/recipeCost.routes.js';
import wastageAdjustmentRoutes from './routes/wastageAdjustment_routes/wastageAdjustment.routes.js';
import vendorRoutes from './routes/vendor_routes/vendor.routes.js';
import outletRoutes from './routes/outlet_routes/outlet.routes.js';
import offerRoutes from './routes/offer_routes/offer.routes.js';
import expenseRoutes from './routes/expense_routes/expense.routes.js';
import loyaltyProgramRoutes from './routes/loyaltyProgram_routes/loyaltyProgram.routes.js';
import dayClosingRoutes from './routes/dayClosing_routes/dayClosing.routes.js';
import subscriptionRoutes from './routes/subscription_routes/subscription.routes.js';
import taxSettingsRoutes from './routes/taxSetting_routes/taxSetting.routes.js';
import centralKitchenRoutes from './routes/centralKitchen_routes/centralKitchen.routes.js';
import paymentRoutes from './routes/order_routes/payment_routes/payment.routes.js';
import printerRoutes from './routes/printer_routes/printer.routes.js';
import supportTicketRoutes from './routes/supportTicket_routes/supportTicket.routes.js';
import roleRoutes from './routes/user_router/role_routes/role.routes.js';
import reportRoutes from './routes/report_routes/report.routes.js';
import dashboardRoutes from './routes/dashboard_routes/dashboard.routes.js';
import notificationSettingsRoutes from './routes/notification_routes/notificationSetting.routes.js';
import notificationRoutes from './routes/notification_routes/notification.routes.js';
import integrationRoutes from './routes/integration_routes/integration.routes.js';

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
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/recipe-cost", recipeCostRoutes);
app.use('/api/wastage-adjustments', wastageAdjustmentRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/outlet', outletRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/offer', offerRoutes);
app.use('/api/loyalty-program', loyaltyProgramRoutes);


app.use('/api/day-closing', dayClosingRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/tax-settings', taxSettingsRoutes);
app.use('/api/central-kitchen', centralKitchenRoutes);
app.use('/api/payment', paymentRoutes);

app.use('/api/printer', printerRoutes);
app.use('/api/support-ticket', supportTicketRoutes);
app.use('/api/role', roleRoutes);

app.use('/api/report', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/notification-settings', notificationSettingsRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/integration', integrationRoutes);

// Health Check (Optional but recommended for EC2 monitoring)
app.get('/api/health', (req: Request, res: Response) => {
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