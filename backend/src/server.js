const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");

const app = express();
const port = Number(process.env.PORT || 5000);
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const databaseFile = process.env.DATABASE_FILE || "./data/pooja-fashion.json";
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
const adminPin = process.env.ADMIN_PIN || "";
const isProduction = process.env.NODE_ENV === "production";
const databasePath = path.resolve(__dirname, "..", databaseFile);
const frontendDir = path.resolve(__dirname, "..", "..");
const hasRazorpayKeys =
  razorpayKeyId &&
  razorpayKeySecret &&
  !/your|xxxxx|change/i.test(razorpayKeyId + " " + razorpayKeySecret);

if(isProduction){
  if(!jwtSecret || jwtSecret.length < 32 || /change|secret|dev/i.test(jwtSecret)){
    throw new Error("Set a strong JWT_SECRET before running production.");
  }

  if(!adminPin || adminPin.length < 6 || /1234|2468|admin|change/i.test(adminPin)){
    throw new Error("Set a private ADMIN_PIN before running production.");
  }
}

const razorpay = hasRazorpayKeys
  ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
  : null;

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginOpenerPolicy: false
}));
app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(frontendDir));

function ensureDatabase(){
  fs.mkdirSync(path.dirname(databasePath), { recursive:true });

  if(!fs.existsSync(databasePath)){
    fs.writeFileSync(databasePath, JSON.stringify({
      users:[],
      orders:[],
      payments:[],
      reviews:[]
    }, null, 2));
  }
}

function readDb(){
  ensureDatabase();
  const db = JSON.parse(fs.readFileSync(databasePath, "utf8"));
  db.users = Array.isArray(db.users) ? db.users : [];
  db.orders = Array.isArray(db.orders) ? db.orders : [];
  db.payments = Array.isArray(db.payments) ? db.payments : [];
  db.reviews = Array.isArray(db.reviews) ? db.reviews : [];
  return db;
}

function writeDb(data){
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

function newId(prefix){
  return prefix + "-" + Date.now() + "-" + crypto.randomBytes(3).toString("hex");
}

function publicUser(user){
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email || "",
    address: user.address || ""
  };
}

function signToken(user){
  return jwt.sign({ userId: user.id }, jwtSecret, { expiresIn:"30d" });
}

function authRequired(req, res, next){
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if(!token){
    return res.status(401).json({ message:"Login required" });
  }

  try{
    const payload = jwt.verify(token, jwtSecret);
    const db = readDb();
    const user = db.users.find(item => item.id === payload.userId);

    if(!user){
      return res.status(401).json({ message:"Invalid login" });
    }

    req.user = user;
    next();
  }catch(error){
    res.status(401).json({ message:"Session expired. Please login again." });
  }
}

function optionalAuth(req, _res, next){
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if(token){
    try{
      const payload = jwt.verify(token, jwtSecret);
      const db = readDb();
      req.user = db.users.find(item => item.id === payload.userId) || null;
    }catch(error){
      req.user = null;
    }
  }

  next();
}

function constantTimeEqual(left, right){
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if(leftBuffer.length !== rightBuffer.length){
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function clientKey(req, prefix){
  const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return prefix + ":" + (forwardedFor || req.ip || req.socket.remoteAddress || "unknown");
}

function rateLimit({ prefix, max, windowMs }){
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = clientKey(req, prefix);
    const current = hits.get(key);

    if(!current || current.resetAt < now){
      hits.set(key, { count:1, resetAt:now + windowMs });
      next();
      return;
    }

    current.count += 1;

    if(current.count > max){
      res.status(429).json({ message:"Too many requests. Please try again later." });
      return;
    }

    next();
  };
}

const authLimiter = rateLimit({ prefix:"auth", max:20, windowMs:15 * 60 * 1000 });
const adminLimiter = rateLimit({ prefix:"admin", max:30, windowMs:15 * 60 * 1000 });
const orderLimiter = rateLimit({ prefix:"order", max:40, windowMs:15 * 60 * 1000 });
const reviewLimiter = rateLimit({ prefix:"review", max:25, windowMs:15 * 60 * 1000 });
const paymentLimiter = rateLimit({ prefix:"payment", max:40, windowMs:15 * 60 * 1000 });

function adminRequired(req, res, next){
  if(!adminPin){
    return res.status(503).json({ message:"Admin PIN is not configured" });
  }

  if(!constantTimeEqual(req.headers["x-admin-pin"], adminPin)){
    return res.status(401).json({ message:"Admin PIN required" });
  }

  next();
}

function parseAmount(value){
  const matches = String(value || "0").match(/\d+(?:\.\d+)?/g);
  return Number(matches ? matches.join("") : "0") || 0;
}

function normalizeItems(items){
  if(!Array.isArray(items) || !items.length){
    throw new Error("At least one product is required");
  }

  const normalized = items.map(item => ({
    name: String(item.name || "Product").trim(),
    image: String(item.image || ""),
    price: parseAmount(item.price),
    quantity: Math.max(1, Number(item.quantity || 1)),
    size: String(item.size || "").trim()
  })).filter(item => item.name && item.price > 0);

  if(!normalized.length){
    throw new Error("Valid products are required");
  }

  return normalized;
}

function calculateDiscount(products, couponCode){
  const subtotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const normalizedCoupon = String(couponCode || "").trim().toUpperCase();

  if(normalizedCoupon === "POOJA500" && subtotal >= 6500){
    return {
      coupon_code: normalizedCoupon,
      discount: 500,
      subtotal
    };
  }

  return {
    coupon_code: normalizedCoupon,
    discount: 0,
    subtotal
  };
}

function createOrderRecord({ user, customerName, customerPhone, customerAddress, paymentMethod, couponCode, items }){
  const db = readDb();
  const products = normalizeItems(items);
  const pricing = calculateDiscount(products, couponCode);
  const total = Math.max(0, pricing.subtotal - pricing.discount);
  const order = {
    id: newId("db-order"),
    order_id: newId("PF"),
    user_id: user ? user.id : null,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    payment_method: paymentMethod,
    payment_status: paymentMethod === "Cash On Delivery" ? "Cash On Delivery" : "Pending",
    status: "Placed",
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    coupon_code: pricing.coupon_code,
    total,
    products,
    created_at: new Date().toISOString()
  };

  db.orders.push(order);
  writeDb(db);
  return order;
}

function publicReview(review){
  return {
    id: review.id,
    productName: review.product_name,
    productImage: review.product_image || "",
    customerName: review.customer_name,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok:true, service:"Pooja Fashion API" });
});

app.get("/api/config", (_req, res) => {
  res.json({
    razorpayKeyId,
    gatewayReady: Boolean(razorpay)
  });
});

app.post("/api/auth/register", authLimiter, (req, res) => {
  const { name, phone, email, password, address } = req.body;

  if(!name || !phone || !password){
    return res.status(400).json({ message:"Name, phone and password are required" });
  }

  if(!/^[6-9]\d{9}$/.test(String(phone).trim())){
    return res.status(400).json({ message:"Valid 10 digit mobile number is required" });
  }

  if(String(password).length < 6){
    return res.status(400).json({ message:"Password must be at least 6 characters" });
  }

  const db = readDb();
  const normalizedPhone = String(phone).trim();
  const normalizedEmail = email ? String(email).trim().toLowerCase() : "";
  const exists = db.users.some(user => {
    return user.phone === normalizedPhone || (normalizedEmail && user.email === normalizedEmail);
  });

  if(exists){
    return res.status(409).json({ message:"Account already exists with this phone or email" });
  }

  const user = {
    id: newId("user"),
    name: String(name).trim(),
    phone: normalizedPhone,
    email: normalizedEmail,
    password_hash: bcrypt.hashSync(password, 10),
    address: address || "",
    created_at: new Date().toISOString()
  };

  db.users.push(user);
  writeDb(db);

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post("/api/auth/login", authLimiter, (req, res) => {
  const { identifier, password } = req.body;

  if(!identifier || !password){
    return res.status(400).json({ message:"Phone/email and password are required" });
  }

  const db = readDb();
  const loginId = String(identifier).trim().toLowerCase();
  const user = db.users.find(item => {
    return item.phone === identifier || (item.email && item.email.toLowerCase() === loginId);
  });

  if(!user || !bcrypt.compareSync(password, user.password_hash)){
    return res.status(401).json({ message:"Invalid login details" });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get("/api/account/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.put("/api/account/profile", authRequired, (req, res) => {
  const { name, phone, email, address } = req.body;

  if(!name || !phone){
    return res.status(400).json({ message:"Name and phone are required" });
  }

  if(!/^[6-9]\d{9}$/.test(String(phone).trim())){
    return res.status(400).json({ message:"Valid 10 digit mobile number is required" });
  }

  const db = readDb();
  const user = db.users.find(item => item.id === req.user.id);

  user.name = String(name).trim();
  user.phone = String(phone).trim();
  user.email = email ? String(email).trim().toLowerCase() : "";
  user.address = address || "";

  writeDb(db);
  res.json({ user: publicUser(user) });
});

app.get("/api/orders", authRequired, (req, res) => {
  const db = readDb();
  const orders = db.orders
    .filter(order => order.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ orders });
});

app.post("/api/orders", orderLimiter, optionalAuth, (req, res) => {
  const { customerName, customerPhone, customerAddress, paymentMethod, couponCode, items } = req.body;

  if(!customerName || !customerPhone || !customerAddress || !paymentMethod){
    return res.status(400).json({ message:"Customer details and payment method are required" });
  }

  if(!/^[6-9]\d{9}$/.test(String(customerPhone).trim())){
    return res.status(400).json({ message:"Valid 10 digit mobile number is required" });
  }

  try{
    const order = createOrderRecord({
      user: req.user,
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod,
      couponCode,
      items
    });

    res.status(201).json({ order });
  }catch(error){
    res.status(400).json({ message:error.message });
  }
});

app.get("/api/admin/orders", adminLimiter, adminRequired, (_req, res) => {
  const db = readDb();
  const orders = db.orders
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ orders });
});

app.get("/api/reviews", (req, res) => {
  const db = readDb();
  const productName = String(req.query.productName || "").trim().toLowerCase();
  const reviews = db.reviews
    .filter(review => {
      return review.approved !== false &&
        (!productName || String(review.product_name || "").toLowerCase() === productName);
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(publicReview);

  res.json({ reviews });
});

app.post("/api/reviews", reviewLimiter, optionalAuth, (req, res) => {
  const { productName, productImage, customerName, rating, comment } = req.body;
  const cleanProductName = String(productName || "").trim();
  const cleanCustomerName = String(customerName || "").trim();
  const cleanComment = String(comment || "").trim();
  const cleanRating = Math.max(1, Math.min(5, Number(rating || 5)));

  if(!cleanProductName || !cleanCustomerName || !cleanComment){
    return res.status(400).json({ message:"Product, name and review are required" });
  }

  if(cleanComment.length < 8){
    return res.status(400).json({ message:"Please write a little more about the product" });
  }

  const db = readDb();
  const review = {
    id: newId("review"),
    user_id: req.user ? req.user.id : null,
    product_name: cleanProductName,
    product_image: String(productImage || ""),
    customer_name: cleanCustomerName,
    rating: cleanRating,
    comment: cleanComment.slice(0, 400),
    approved: true,
    created_at: new Date().toISOString()
  };

  db.reviews.push(review);
  writeDb(db);

  res.status(201).json({ review: publicReview(review) });
});

app.post("/api/payments/razorpay/create-order", paymentLimiter, optionalAuth, async (req, res) => {
  if(!razorpay){
    return res.status(503).json({ message:"Razorpay keys are not configured" });
  }

  const db = readDb();
  const { orderId } = req.body;
  const order = db.orders.find(item => {
    return item.order_id === orderId &&
      (!req.user || !item.user_id || item.user_id === req.user.id);
  });

  if(!order){
    return res.status(404).json({ message:"Order not found" });
  }

  try{
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.order_id,
      notes: {
        customerName: order.customer_name,
        customerPhone: order.customer_phone
      }
    });

    db.payments.push({
      id: newId("payment"),
      order_id: order.id,
      gateway: "Razorpay",
      razorpay_order_id: razorpayOrder.id,
      status: "Created",
      raw_json: razorpayOrder,
      created_at: new Date().toISOString()
    });

    writeDb(db);

    res.json({
      razorpayOrder,
      keyId: razorpayKeyId,
      order
    });
  }catch(error){
    res.status(500).json({ message:"Could not create Razorpay order" });
  }
});

app.post("/api/payments/razorpay/verify", paymentLimiter, optionalAuth, (req, res) => {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  const db = readDb();
  const order = db.orders.find(item => {
    return item.order_id === orderId &&
      (!req.user || !item.user_id || item.user_id === req.user.id);
  });

  if(!order){
    return res.status(404).json({ message:"Order not found" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if(expectedSignature !== razorpay_signature){
    return res.status(400).json({ message:"Payment verification failed" });
  }

  order.payment_status = "Paid";
  order.status = "Confirmed";

  const payment = db.payments.find(item => {
    return item.order_id === order.id && item.razorpay_order_id === razorpay_order_id;
  });

  if(payment){
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;
    payment.status = "Paid";
  }

  writeDb(db);
  res.json({ order });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message:"Server error" });
});

ensureDatabase();

app.listen(port, () => {
  console.log("Pooja Fashion API running on port " + port);
});
