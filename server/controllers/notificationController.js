const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            'mailto:example@yourdomain.com',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    } catch (err) {
        console.error('Failed to set VAPID details:', err);
    }
} else {
    console.warn('VAPID keys missing. Push notifications will be disabled.');
}

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

// @desc    Check and send habit reminders (Triggered by Cron)
// @route   GET /api/notifications/remind-habits
// @access  Public (Secret Protected)
const remindHabits = async (req, res) => {
    try {
        const Habit = require('../models/Habit');
        const User = require('../models/User');
        const { isHabitDue } = require('../utils/habitUtils');
        const HabitHistory = require('../models/HabitHistory');

        // Check for secret if provided in environment
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find ALL users (timezone defaults to 'UTC' if not set)
        const users = await User.find({});
        let notificationsSent = 0;
        const log = [];

        for (const user of users) {
            const tz = user.timezone || 'UTC';

            // Get user's local time
            const now = new Date();
            const localDateStr = now.toLocaleDateString('en-US', { timeZone: tz });
            let localTimeStr = now.toLocaleTimeString('en-US', {
                timeZone: tz,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

            // Fix edge case: midnight can return "24:00" instead of "00:00"
            if (localTimeStr.startsWith('24')) {
                localTimeStr = '00' + localTimeStr.slice(2);
            }

            // "today" in user's timezone (normalized to midnight UTC for comparison)
            const localParts = localDateStr.split('/');
            const userToday = new Date(Date.UTC(localParts[2], localParts[0] - 1, localParts[1]));

            // Find due habits for this user
            const habits = await Habit.find({ userId: user._id });
            log.push({ user: user.username, tz, localTimeStr, habitCount: habits.length });

            for (const habit of habits) {
                const isDue = isHabitDue(habit, userToday);
                if (!isDue) continue;

                // Check if already completed today
                const completed = await HabitHistory.findOne({
                    userId: user._id,
                    habitId: habit._id,
                    date: userToday
                });
                if (completed) continue;

                // Check if already reminded today
                const lastReminded = habit.lastReminderSentDate ? new Date(habit.lastReminderSentDate) : null;
                const wasRemindedToday = lastReminded &&
                    lastReminded.getUTCFullYear() === userToday.getUTCFullYear() &&
                    lastReminded.getUTCMonth() === userToday.getUTCMonth() &&
                    lastReminded.getUTCDate() === userToday.getUTCDate();

                if (wasRemindedToday) continue;

                const reminderTime = habit.reminderTime || '09:00';
                console.log(`[Remind] "${habit.name}" | localTime=${localTimeStr} reminderTime=${reminderTime} | willSend=${localTimeStr >= reminderTime}`);

                // Check if reminder time has passed
                if (localTimeStr >= reminderTime) {
                    await sendNotification(user._id, {
                        title: 'Habit Reminder! ⚡',
                        body: `Don't forget to ${habit.name} today!`,
                        icon: '/HABBITLOGO.png',
                        tag: `habit-remind-${habit._id}`,
                        actions: [
                            { action: 'open', title: 'Open App' },
                            { action: 'close', title: 'Dismiss' }
                        ],
                        data: { url: '/' }
                    });

                    habit.lastReminderSentDate = now;
                    await habit.save();
                    notificationsSent++;
                    console.log(`[Remind] ✅ Sent reminder for "${habit.name}" to ${user.username}`);
                }
            }
        }

        console.log('[Remind] Check complete. Sent:', notificationsSent);
        res.json({ message: `Reminders check complete. Sent ${notificationsSent} notifications.`, log });
    } catch (error) {
        console.error('Remind habits error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    subscribe,
    unsubscribe,
    sendNotification,
    remindHabits
};
