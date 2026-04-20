const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./src/config/db");
const { globalErrorHandler } = require("./src/middleware/errorMiddleware");
const User = require("./src/models/userModel");
const bcrypt = require("bcryptjs");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", require("./src/routes/auth-routes"));
app.use("/api/tenants", require("./src/routes/tenant-routes"));
app.use("/api/users", require("./src/routes/user-routes"));
app.use("/api/contacts", require("./src/routes/contact-routes"));
app.use("/api/import", require("./src/routes/import-routes"));
app.use("/api/lists", require("./src/routes/list-routes"));
app.use("/api/exophones", require("./src/routes/exophone-routes"));
app.use("/api/campaigns", require("./src/routes/campaign-routes"));
app.use("/api/calls", require("./src/routes/call-routes"));
app.use("/", require("./src/routes/call-routes")); // Mounting at root for /exotel/press/1

// Socket.io integration
io.on("connection", (socket) => {
  console.log("User connected to socket");
  socket.on("disconnect", () => {
    console.log("User disconnected from socket");
  });
});

// Attach socket IO to app so controllers can emit
app.set("io", io);

// Error Middleware (must be last)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8080;

const seedAdminIfNeeded = async () => {
  try {
    const adminCount = await User.countDocuments({ role: "super_admin" });
    if (adminCount === 0) {
      console.log("No super_admin found. Seeding default admin account...");

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await User.create({
        name: "System Admin",
        email: "admin@exotel.com",
        password: hashedPassword,
        role: "super_admin",
      });
      console.log("Admin seeded! Login with admin@exotel.com : admin123");
    }
  } catch (error) {
    console.error("Failed to seed admin:", error);
  }
};

server.listen(PORT, async () => {
  await seedAdminIfNeeded();
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});
