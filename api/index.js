const { app, connectDB } = require("../server/server");

module.exports = async (req, res) => {
  console.log(`[Vercel] Incoming request: ${req.method} ${req.url}`);

  // Connect to database
  await connectDB();

  // Handle Socket.IO upgrade requests
  if (req.url?.startsWith("/socket.io")) {
    try {
      const server = require("http").createServer();
      const io = app.get("io");
      if (io) {
        io.engine.handleRequest(req, res);
      } else {
        // Socket.IO not available in serverless, return polling fallback response
        res.status(200).end();
      }
      return;
    } catch (err) {
      console.error("[Vercel] Socket.IO Error:", err);
      res.status(200).end(); // Silent fallback
      return;
    }
  }

  // Hand over to Express app
  try {
    app(req, res);
  } catch (err) {
    console.error("[Vercel] App Error:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Internal Server Error", error: err.message });
    }
  }
};
