require("dotenv").config();
const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoose = require("mongoose");

const i18next = require("./i18n");
const i18nextMiddleware = require("i18next-http-middleware");

const { checkAuth, attachUserRole } = require("./middleware/authers");
const checkRole = require("./middleware/roleCheck");
const checkPermission = require("./routes/helpers/checkPermission");
const notificationsMiddleware = require("./middleware/notifications");
const { roles } = require("./permissions");

// Initialize express
const app = express();

// ----------- DATABASE SETUP -----------
(async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      retryWrites: true,
      dbName: process.env.MONGODB_DBNAME,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
})();

// ----------- SESSION SETUP -----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

// ----------- MIDDLEWARE -----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(i18nextMiddleware.handle(i18next));
app.use(notificationsMiddleware);
app.use(attachUserRole);

// Add user role and permission helper to res.locals
app.use((req, res, next) => {
  const userRole = req.session.user?.role || "Viewer";
  res.locals.userRole = userRole;
  res.locals.hasPermission = (permission) => {
    const rolePermissions = roles[userRole] || [];
    return (
      rolePermissions.includes("*") || rolePermissions.includes(permission)
    );
  };
  next();
});

// ----------- VIEW ENGINE -----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ----------- LANGUAGE ROUTE -----------
app.get("/change-language/:lng", (req, res) => {
  const { lng } = req.params;
  if (i18next.hasResourceBundle(lng, "translation")) {
    res.cookie("i18next", lng);
    i18next.changeLanguage(lng);
  }
  res.redirect(req.get("Referrer"));
});

// ----------- ROUTES -----------
const indexRoute = require("./routes/index");
const uploadRoute = require("./routes/upload");
const loginRoute = require("./routes/login");
const songsRoute = require("./routes/songs");
const booksRoute = require("./routes/books");
const settingsRoute = require("./routes/settings");
const superUserRoute = require("./routes/superuser");
const editSongRoute = require("./routes/edit-song");
const authRoute = require("./routes/helpers/auth");
const actionsRoute = require("./routes/helpers/actions");
const registerRouter = require("./routes/register");
const auditLogRoute = require("./routes/audit-log");
const notificationsRoute = require("./routes/notifications");
const scheduleRoute = require("./routes/schedules");
const scheduleViewRoute = require("./routes/schedule-view");
const scheduleEditRoute = require("./routes/schedule-edit");
// Public routes
app.use("/auth", authRoute);
app.use("/login", loginRoute);
app.use("/register", registerRouter);

// Some public actions (like public song view, registration checks)
app.use("/", actionsRoute);

// Protected routes
app.use("/dash", checkAuth, indexRoute);
app.use("/songs", checkAuth, songsRoute);
app.use("/books", checkAuth, booksRoute);
app.use("/upload", checkAuth, checkPermission("upload_song"), uploadRoute);
app.use("/edit-song", checkAuth, checkPermission("edit_song"), editSongRoute);
app.use(
  "/settings",
  checkAuth,
  checkPermission("access_settings"),
  settingsRoute,
);
app.use("/superuser", checkAuth, checkRole("Superuser"), superUserRoute);
app.use(
  "/audit-log",
  checkAuth,
  checkPermission("view_audit_log"),
  auditLogRoute,
);
app.use(
  "/schedules",
  checkAuth,
  checkPermission("view_schedules"),
  scheduleRoute,
);
app.use(
  "/schedule-view",
  checkAuth,
  checkPermission("view_schedules"),
  scheduleViewRoute
)
app.use(
  "/schedule-edit",
  checkAuth,
  checkPermission("edit_schedule"),
  scheduleEditRoute,
);
app.use(
  "/notifications",
  checkAuth,
  checkPermission("view_notifications"),
  notificationsRoute,
);

// Default root redirect if authenticated
app.get("/", checkAuth, (req, res) => res.redirect("/dash"));

// ----------- ERROR HANDLING -----------
// Catch-all for 404 errors
app.use((req, res, next) => {
  const err = new Error("Page Not Found");
  err.status = 404;
  next(err); // Pass to your universal error handler
});

// Universal error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  const status = err.status || 500;

  const titles = {
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: req.t ? req.t("messages.page_not_found") : "Page Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Payload Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    416: "Range Not Satisfiable",
    417: "Expectation Failed",
    418: "I'm a teapot",
    421: "Misdirected Request",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    425: "Too Early",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    451: "Unavailable For Legal Reasons",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    508: "Loop Detected",
    510: "Not Extended",
    511: "Network Authentication Required",
  };

  res.status(status).render("status/error", {
    status,
    title: titles[status] || "Error",
    message: err.message,
    t: req.t, // pass translation function if needed
  });
});

// // 404 Not Found
// app.use((req, res) => {
//   res.status(404).render('status/404', { activePage: 'home' });
// });

// 403 Forbidden (you should trigger this with explicit logic)
app.use('/forbidden', (req, res) => {
  res.status(403).render('status/403', { activePage: 'home' });
});

// ----------- SERVER START -----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
