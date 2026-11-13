require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const seed = {
  products: [
    { id: "prod-tomato-powder", name: "Dried Tomato Powder", category: "Dried Products", size: "100 g pouch", price: 2500, quantity: 24, description: "A convenient way to bring tomato flavour into everyday cooking.", image: "", active: true, createdAt: new Date().toISOString() },
    { id: "prod-pepper", name: "Dried Pepper", category: "Dried Products", size: "100 g pouch", price: 1800, quantity: 18, description: "Carefully dried pepper for a longer-lasting pantry staple.", image: "", active: true, createdAt: new Date().toISOString() },
    { id: "prod-dryer", name: "EcoDry Hybrid Solar Dryer", category: "Dryers", size: "Model enquiry", price: 0, quantity: 2, description: "A hybrid solar drying solution for agricultural produce. Contact us for specifications and a quotation.", image: "", active: true, createdAt: new Date().toISOString() }
  ],
  posts: [
    { id: "post-preserve", title: "What happens when harvest exceeds demand?", category: "Food preservation", excerpt: "Drying can give farmers and processors more options when fresh produce cannot all be sold immediately.", body: "Harvest season can bring abundance, but fresh produce does not wait for the market. Drying reduces moisture and can help extend storage life when the process, packaging and storage conditions are appropriate. The right approach depends on the crop and its intended use. EcoDry works with farmers, processors and businesses to explore practical drying options.", published: true, createdAt: new Date().toISOString() },
    { id: "post-dryer", title: "Getting to know hybrid solar drying", category: "Drying technology", excerpt: "A simple introduction to how solar heat and supplementary heat can support a more consistent drying process.", body: "Hybrid solar drying combines solar energy with a supplementary heat source to support drying when sunlight is variable. Actual drying time depends on crop type, slice thickness, loading, airflow and weather. Good hygiene, suitable temperatures and moisture-safe packaging remain important.", published: true, createdAt: new Date().toISOString() }
  ],
  bookings: [],
  inquiries: [],
  subscribers: [],
  orders: []
};
function readStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
      return structuredClone(seed);
    }
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    for (const key of Object.keys(seed)) if (!Array.isArray(parsed[key])) parsed[key] = [];
    return parsed;
  } catch (e) {
    console.error("Could not read data/store.json:", e.message);
    return structuredClone(seed);
  }
}
let store = readStore();
function saveStore() {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
function id(prefix) { return `${prefix}_${crypto.randomBytes(8).toString("hex")}`; }
function clean(v, max = 5000) { return String(v ?? "").trim().slice(0, max); }
function price(v) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null; }
function adminAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Please sign in to continue." });
}

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(session({
  name: "ecodry.sid",
  secret: process.env.SESSION_SECRET || "local-development-only-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 8 }
}));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(ROOT, "public"), { extensions: ["html"] }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Upload a JPG, PNG, WEBP or GIF image (maximum 5 MB)."));
  }
});

app.get("/api/config", (_req, res) => res.json({
  email: process.env.CONTACT_EMAIL || "",
  phone: process.env.CONTACT_PHONE || "",
  whatsapp: process.env.WHATSAPP_NUMBER || "",
  social: {
    instagram: process.env.INSTAGRAM_URL || "",
    facebook: process.env.FACEBOOK_URL || "",
    tiktok: process.env.TIKTOK_URL || "",
    linkedin: process.env.LINKEDIN_URL || "",
    x: process.env.X_URL || ""
  }
}));
app.get("/api/products", (req, res) => {
  const active = store.products.filter(p => p.active !== false);
  const q = clean(req.query.q, 100).toLowerCase();
  const category = clean(req.query.category, 80);
  res.json(active.filter(p => (!q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)) && (!category || category === "All" || p.category === category)));
});
app.get("/api/posts", (_req, res) => res.json(store.posts.filter(p => p.published).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))));
app.post("/api/newsletter", (req, res) => {
  const email = clean(req.body.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (!store.subscribers.some(s => s.email === email)) {
    store.subscribers.push({ id: id("sub"), email, createdAt: new Date().toISOString() }); saveStore();
  }
  res.json({ message: "Thanks for subscribing. You are on the EcoDry update list." });
});
app.post("/api/bookings", (req, res) => {
  const data = {
    name: clean(req.body.name, 120), email: clean(req.body.email, 254),
    phone: clean(req.body.phone, 60), crop: clean(req.body.crop, 120),
    quantity: clean(req.body.quantity, 120), preferredDate: clean(req.body.preferredDate, 30),
    location: clean(req.body.location, 180), notes: clean(req.body.notes, 2000)
  };
  if (!data.name || !data.phone || !data.crop) return res.status(400).json({ error: "Please provide your name, phone number and produce type." });
  store.bookings.unshift({ id: id("booking"), ...data, status: "New", createdAt: new Date().toISOString() }); saveStore();
  res.status(201).json({ message: "Your drying-service request has been received. Our team will contact you to confirm availability and pricing." });
});
app.post("/api/inquiries", (req, res) => {
  const data = { name: clean(req.body.name,120), email: clean(req.body.email,254), phone: clean(req.body.phone,60), topic: clean(req.body.topic,120), message: clean(req.body.message,3000) };
  if (!data.name || !data.message || (!data.email && !data.phone)) return res.status(400).json({ error: "Please provide your name, message and an email address or phone number." });
  store.inquiries.unshift({ id: id("inquiry"), ...data, status: "New", createdAt: new Date().toISOString() }); saveStore();
  res.status(201).json({ message: "Thanks for reaching out. Your inquiry has been sent to the EcoDry team." });
});

// Authentication. Rate limiting is scoped to login only so public forms do not lock out the admin.
app.post("/api/admin/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false }), async (req, res) => {
  const username = clean(req.body.username, 120);
  const password = String(req.body.password || "");
  const expectedUser = process.env.ADMIN_USERNAME || "ecodryadmin";
  const expectedPass = process.env.ADMIN_PASSWORD || "change-this-before-launch";
  const matchUser = username === expectedUser;
  const matchPass = await bcrypt.compare(password, await bcrypt.hash(expectedPass, 10));
  if (!matchUser || !matchPass) return res.status(401).json({ error: "Incorrect username or password." });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Could not create a secure session. Try again." });
    req.session.isAdmin = true;
    req.session.username = expectedUser;
    res.json({ message: "Signed in." });
  });
});
app.get("/api/admin/session", (req, res) => res.json({ authenticated: Boolean(req.session && req.session.isAdmin), username: req.session?.username || "" }));
app.post("/api/admin/logout", adminAuth, (req, res) => req.session.destroy(() => res.json({ message: "Signed out." })));
app.get("/api/admin/overview", adminAuth, (_req, res) => res.json({
  products: store.products, posts: store.posts,
  bookings: store.bookings, inquiries: store.inquiries, subscribers: store.subscribers,
  orders: store.orders
}));
app.post("/api/admin/products", adminAuth, upload.single("image"), (req, res) => {
  const name = clean(req.body.name, 150), category = clean(req.body.category, 80);
  const amount = price(req.body.price), quantity = Number.parseInt(req.body.quantity, 10);
  if (!name || !category || amount === null || !Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ error: "Product name, category, valid price and non-negative quantity are required." });
  const product = { id: id("prod"), name, category, size: clean(req.body.size, 120), price: amount, quantity, description: clean(req.body.description, 2000), image: req.file ? `/uploads/${req.file.filename}` : "", active: req.body.active !== "false", createdAt: new Date().toISOString() };
  store.products.unshift(product); saveStore(); res.status(201).json(product);
});
app.put("/api/admin/products/:id", adminAuth, upload.single("image"), (req, res) => {
  const p = store.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found." });
  const amount = price(req.body.price), quantity = Number.parseInt(req.body.quantity, 10);
  if (amount === null || !Number.isInteger(quantity) || quantity < 0 || !clean(req.body.name,150) || !clean(req.body.category,80)) return res.status(400).json({ error: "Enter a name, category, valid price and non-negative quantity." });
  Object.assign(p, { name: clean(req.body.name,150), category: clean(req.body.category,80), size: clean(req.body.size,120), price: amount, quantity, description: clean(req.body.description,2000), active: req.body.active !== "false" });
  if (req.file) p.image = `/uploads/${req.file.filename}`;
  saveStore(); res.json(p);
});
app.delete("/api/admin/products/:id", adminAuth, (req, res) => {
  const before = store.products.length;
  store.products = store.products.filter(p => p.id !== req.params.id);
  if (before === store.products.length) return res.status(404).json({ error: "Product not found." });
  saveStore(); res.json({ message: "Product deleted." });
});
app.post("/api/admin/posts", adminAuth, (req, res) => {
  const title = clean(req.body.title, 180), body = clean(req.body.body, 12000);
  if (!title || !body) return res.status(400).json({ error: "Post title and body are required." });
  const post = { id: id("post"), title, category: clean(req.body.category,100) || "Updates", excerpt: clean(req.body.excerpt,500) || body.slice(0,180), body, published: req.body.published !== false, createdAt: new Date().toISOString() };
  store.posts.unshift(post); saveStore(); res.status(201).json(post);
});
app.put("/api/admin/posts/:id", adminAuth, (req, res) => {
  const post = store.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found." });
  Object.assign(post, { title: clean(req.body.title,180), category: clean(req.body.category,100), excerpt: clean(req.body.excerpt,500), body: clean(req.body.body,12000), published: Boolean(req.body.published) });
  saveStore(); res.json(post);
});
app.delete("/api/admin/posts/:id", adminAuth, (req, res) => {
  const n = store.posts.length; store.posts = store.posts.filter(p => p.id !== req.params.id);
  if (n === store.posts.length) return res.status(404).json({ error: "Post not found." });
  saveStore(); res.json({ message: "Post deleted." });
});
app.patch("/api/admin/records/:type/:id", adminAuth, (req, res) => {
  const map = { bookings: store.bookings, inquiries: store.inquiries, orders: store.orders };
  const list = map[req.params.type]; if (!list) return res.status(400).json({ error: "Unsupported record type." });
  const record = list.find(x => x.id === req.params.id); if (!record) return res.status(404).json({ error: "Record not found." });
  record.status = clean(req.body.status, 50) || record.status; saveStore(); res.json(record);
});
app.get("/api/delivery-payment", (_req, res) => res.json({
  delivery: "Delivery availability, fees and estimated timelines are confirmed with the EcoDry team before dispatch.",
  payment: "BACHS is planned as the payment provider. Online card/transfer checkout will be enabled after official BACHS API documentation and merchant credentials are configured. Until then, orders are confirmed manually."
}));
app.use((err, _req, res, _next) => {
  console.error(err.message);
  const status = err instanceof multer.MulterError ? 400 : 500;
  res.status(status).json({ error: err.message || "Something went wrong. Please try again." });
});
app.listen(PORT, () => console.log(`EcoDry website running at http://localhost:${PORT}`));
