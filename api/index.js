const { app, connectDB } = require('../server/server');

module.exports = async (req, res) => {
    console.log(`[Vercel] Incoming request: ${req.method} ${req.url}`);

    // Connect to database
    await connectDB();

    // Hand over to Express app
    try {
        app(req, res);
    } catch (err) {
        console.error('[Vercel] App Error:', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal Server Error', error: err.message });
        }
    }
};
