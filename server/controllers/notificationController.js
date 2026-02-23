const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// Configure web-push
webpush.setVapidDetails(
    'mailto:example@yourdomain.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribe = async (req, res) => {
    try {
        const { subscription } = req.body;

        // Save subscription to database
        await PushSubscription.findOneAndUpdate(
            { 'subscription.endpoint': subscription.endpoint },
            { user: req.user._id, subscription },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
};

// @desc    Unsubscribe from push notifications
// @route   POST /api/notifications/unsubscribe
// @access  Private
const unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        await PushSubscription.findOneAndDelete({ 'subscription.endpoint': endpoint });
        res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Unsubscription error:', error);
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
};

// Internal utility to send push notification
const sendNotification = async (userId, payload) => {
    try {
        const subscriptions = await PushSubscription.find({ user: userId });

        const notifications = subscriptions.map(sub => {
            return webpush.sendNotification(sub.subscription, JSON.stringify(payload))
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Sub expired or no longer valid
                        return PushSubscription.findByIdAndDelete(sub._id);
                    }
                    console.error('Push error:', err);
                });
        });

        await Promise.all(notifications);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

module.exports = {
    subscribe,
    unsubscribe,
    sendNotification
};
