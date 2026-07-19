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
const smsProvider = String(process.env.SMS_PROVIDER || "").trim().toLowerCase();
const fast2SmsApiKey = process.env.FAST2SMS_API_KEY || "";
const fast2SmsOtpId = process.env.FAST2SMS_OTP_ID || "";
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || "";
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || "";
const twilioFromNumber = process.env.TWILIO_FROM_NUMBER || "";
const isProduction = process.env.NODE_ENV === "production";
const databasePath = path.resolve(__dirname, "..", databaseFile);
const frontendDir = path.resolve(__dirname, "..", "..");
const hasRazorpayKeys =
  razorpayKeyId &&
  razorpayKeySecret &&
  !/your|xxxxx|change/i.test(razorpayKeyId + " " + razorpayKeySecret);
const hasLiveRazorpayKeys = /^rzp_live_/i.test(razorpayKeyId);
const isRazorpayReady = Boolean(hasRazorpayKeys && hasLiveRazorpayKeys);
const hasSmsProvider =
  (smsProvider === "fast2sms" && fast2SmsApiKey) ||
  (smsProvider === "twilio" && twilioAccountSid && twilioAuthToken && twilioFromNumber);

if(isProduction){
  if(!jwtSecret || jwtSecret.length < 32 || /change|secret|dev/i.test(jwtSecret)){
    throw new Error("Set a strong JWT_SECRET before running production.");
  }

  if(!adminPin || adminPin.length < 6 || /1234|2468|admin|change/i.test(adminPin)){
    throw new Error("Set a private ADMIN_PIN before running production.");
  }
}

const razorpay = isRazorpayReady
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
      reviews:[],
      otps:[]
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
  db.otps = Array.isArray(db.otps) ? db.otps : [];
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

function normalizePhone(value){
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function isValidIndianPhone(value){
  return /^[6-9]\d{9}$/.test(normalizePhone(value));
}

function hashOtp(phone, otp){
  return crypto
    .createHash("sha256")
    .update(normalizePhone(phone) + "|" + String(otp) + "|" + jwtSecret)
    .digest("hex");
}

async function sendSms(phone, message){
  const cleanPhone = normalizePhone(phone);

  if(!hasSmsProvider){
    console.log("[sms disabled]", cleanPhone, message);
    return { sent:false, provider:"disabled" };
  }

  if(smsProvider === "fast2sms"){
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method:"POST",
      headers:{
        authorization:fast2SmsApiKey,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        route:"q",
        message,
        language:"english",
        flash:0,
        numbers:cleanPhone
      })
    });

    if(!response.ok){
      throw new Error("SMS provider failed");
    }

    return { sent:true, provider:"fast2sms" };
  }

  if(smsProvider === "twilio"){
    const credentials = Buffer.from(twilioAccountSid + ":" + twilioAuthToken).toString("base64");
    const body = new URLSearchParams({
      To:"+91" + cleanPhone,
      From:twilioFromNumber,
      Body:message
    });
    const response = await fetch(
      "https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(twilioAccountSid) + "/Messages.json",
      {
        method:"POST",
        headers:{
          Authorization:"Basic " + credentials,
          "Content-Type":"application/x-www-form-urlencoded"
        },
        body
      }
    );

    if(!response.ok){
      throw new Error("SMS provider failed");
    }

    return { sent:true, provider:"twilio" };
  }

  return { sent:false, provider:"disabled" };
}

async function sendOtpSms(phone, otp){
  const cleanPhone = normalizePhone(phone);

  if(!hasSmsProvider){
    console.log("[otp sms disabled]", cleanPhone, otp);
    return { sent:false, provider:"disabled" };
  }

  if(smsProvider === "fast2sms"){
    if(!fast2SmsOtpId){
      throw new Error("Set FAST2SMS_OTP_ID for OTP SMS.");
    }

    const response = await fetch("https://www.fast2sms.com/dev/otp/send", {
      method:"POST",
      headers:{
        authorization:fast2SmsApiKey,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        mobile:cleanPhone,
        otp_id:fast2SmsOtpId,
        otp:String(otp),
        otp_expiry:5,
        otp_length:6
      })
    });

    if(!response.ok){
      throw new Error("OTP SMS provider failed");
    }

    const data = await response.json().catch(() => ({}));
    if(data.return === false){
      throw new Error(data.message || "OTP SMS provider failed");
    }

    return { sent:true, provider:"fast2sms-otp" };
  }

  return sendSms(phone, "Dipali Fashion OTP is " + otp + ". It is valid for 5 minutes.");
}

async function notifyOrderConfirmed(order){
  const message = "Dipali Fashion: Your order " + order.order_id +
    " is confirmed. Amount Rs. " + order.total +
    ". We will contact you before dispatch. Thank you.";

  try{
    const result = await sendSms(order.customer_phone, message);
    order.customer_sms_status = result.sent ? "Sent" : "Not configured";
    order.customer_sms_provider = result.provider;
    order.customer_sms_at = new Date().toISOString();
  }catch(error){
    order.customer_sms_status = "Failed";
    order.customer_sms_error = error.message;
  }
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

  if(normalizedCoupon === "DIPALI500" && subtotal >= 6500){
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

function createOrderRecord({ user, customerName, customerPhone, customerAddress, deliveryInfo, paymentMethod, couponCode, items }){
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
    delivery_info: deliveryInfo || null,
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
  res.json({ ok:true, service:"Dipali Fashion API" });
});

app.get("/api/config", (_req, res) => {
  res.json({
    razorpayKeyId: isRazorpayReady ? razorpayKeyId : "",
    gatewayReady: Boolean(razorpay),
    paymentMode: isRazorpayReady ? (hasLiveRazorpayKeys ? "live" : "test") : "cod",
    smsReady: Boolean(hasSmsProvider)
  });
});

app.post("/api/auth/send-otp", authLimiter, async (req, res) => {
  const phone = normalizePhone(req.body.phone);

  if(!isValidIndianPhone(phone)){
    return res.status(400).json({ message:"Valid 10 digit mobile number is required" });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const db = readDb();
  const now = Date.now();
  db.otps = db.otps.filter(item => {
    return item.phone !== phone && new Date(item.expires_at).getTime() > now;
  });
  db.otps.push({
    id:newId("otp"),
    phone,
    otp_hash:hashOtp(phone, otp),
    purpose:String(req.body.purpose || "login").slice(0, 24),
    attempts:0,
    expires_at:new Date(now + 5 * 60 * 1000).toISOString(),
    created_at:new Date().toISOString()
  });
  writeDb(db);

  try{
    const smsResult = await sendOtpSms(phone, otp);
    res.json({
      message:smsResult.sent ? "OTP sent to your phone." : "OTP generated for testing.",
      smsSent:smsResult.sent,
      devOtp:isProduction ? undefined : otp
    });
  }catch(error){
    res.status(503).json({
      message:"OTP created, but SMS could not be sent. Try again or use password login.",
      devOtp:isProduction ? undefined : otp
    });
  }
});

app.post("/api/auth/verify-otp", authLimiter, (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const otp = String(req.body.otp || "").trim();
  const name = String(req.body.name || "").trim();

  if(!isValidIndianPhone(phone) || !/^\d{6}$/.test(otp)){
    return res.status(400).json({ message:"Phone and 6 digit OTP are required" });
  }

  const db = readDb();
  const now = Date.now();
  const otpRecord = db.otps.find(item => {
    return item.phone === phone && new Date(item.expires_at).getTime() > now;
  });

  if(!otpRecord){
    return res.status(400).json({ message:"OTP expired. Please request a new OTP." });
  }

  otpRecord.attempts = Number(otpRecord.attempts || 0) + 1;

  if(otpRecord.attempts > 5 || otpRecord.otp_hash !== hashOtp(phone, otp)){
    writeDb(db);
    return res.status(401).json({ message:"Invalid OTP" });
  }

  let user = db.users.find(item => item.phone === phone);

  if(!user){
    user = {
      id:newId("user"),
      name:name || "Dipali Fashion Customer",
      phone,
      email:"",
      password_hash:"",
      address:"",
      created_at:new Date().toISOString(),
      created_with:"otp"
    };
    db.users.push(user);
  }else if(name && (!user.name || user.name === "Dipali Fashion Customer")){
    user.name = name;
  }

  db.otps = db.otps.filter(item => item.id !== otpRecord.id);
  writeDb(db);

  res.json({ token:signToken(user), user:publicUser(user) });
});

app.post("/api/auth/register", authLimiter, (req, res) => {
  const { name, phone, email, password, address } = req.body;

  if(!name || !phone || !password){
    return res.status(400).json({ message:"Name, phone and password are required" });
  }

  if(!isValidIndianPhone(phone)){
    return res.status(400).json({ message:"Valid 10 digit mobile number is required" });
  }

  if(String(password).length < 6){
    return res.status(400).json({ message:"Password must be at least 6 characters" });
  }

  const db = readDb();
  const normalizedPhone = normalizePhone(phone);
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
  const phoneId = normalizePhone(identifier);
  const user = db.users.find(item => {
    return item.phone === phoneId || (item.email && item.email.toLowerCase() === loginId);
  });

  if(!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)){
    return res.status(401).json({ message:"Invalid login details" });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get("/api/account/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.put("/api/account/profile", authRequired, (req, res) => {
  const { name, phone, email, address } = req.body;

  if(!phone){
    return res.status(400).json({ message:"Phone is required" });
  }

  if(!/^[6-9]\d{9}$/.test(String(phone).trim())){
    return res.status(400).json({ message:"Valid 10 digit mobile number is required" });
  }

  const db = readDb();
  const user = db.users.find(item => item.id === req.user.id);

  if(String(name || "").trim()){
    user.name = String(name).trim();
  }
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

app.patch("/api/orders/:orderId/cancel", authRequired, (req, res) => {
  const db = readDb();
  const order = db.orders.find(item => {
    return item.order_id === req.params.orderId && item.user_id === req.user.id;
  });

  if(!order){
    return res.status(404).json({ message:"Order not found" });
  }

  if(/cancel/i.test(order.status || "")){
    return res.status(400).json({ message:"Order is already cancelled" });
  }

  if(/shipped|delivered/i.test(order.status || "")){
    return res.status(400).json({ message:"This order cannot be cancelled online. Please contact support." });
  }

  if(/paid/i.test(order.payment_status || "")){
    order.status = "Cancel Requested";
  }else{
    order.status = "Cancelled";
    order.payment_status = "Cancelled";
  }

  order.cancelled_at = new Date().toISOString();
  writeDb(db);
  res.json({ order });
});

app.post("/api/orders", orderLimiter, optionalAuth, async (req, res) => {
  const { customerName, customerPhone, customerAddress, deliveryInfo, paymentMethod, couponCode, items } = req.body;

  if(!customerName || !customerPhone || !customerAddress || !paymentMethod){
    return res.status(400).json({ message:"Customer details and payment method are required" });
  }

  if(!isValidIndianPhone(customerPhone)){
    return res.status(400).json({ message:"Valid 10 digit mobile number is required" });
  }

  try{
    const order = createOrderRecord({
      user: req.user,
      customerName,
      customerPhone:normalizePhone(customerPhone),
      customerAddress,
      deliveryInfo,
      paymentMethod,
      couponCode,
      items
    });

    if(paymentMethod === "Cash On Delivery"){
      await notifyOrderConfirmed(order);
      const db = readDb();
      const storedOrder = db.orders.find(item => item.id === order.id);
      if(storedOrder){
        Object.assign(storedOrder, {
          customer_sms_status:order.customer_sms_status,
          customer_sms_provider:order.customer_sms_provider,
          customer_sms_at:order.customer_sms_at,
          customer_sms_error:order.customer_sms_error
        });
        writeDb(db);
      }
    }

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

app.post("/api/payments/razorpay/verify", paymentLimiter, optionalAuth, async (req, res) => {
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
  await notifyOrderConfirmed(order);

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
  console.log("Dipali Fashion API running on port " + port);
});
