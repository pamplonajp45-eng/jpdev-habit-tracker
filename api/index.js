const { app, connectDB } = require('../server/server');

module.exports = async (req, res) => {
    // Connect to database
    await connectDB();

    // Hand over to Express app
    app(req, res);
};
