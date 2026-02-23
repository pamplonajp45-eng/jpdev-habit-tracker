import api from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BJ4i5t-Et0W8tiqzkLhiwJO7q2mYGVa79N8jxEDfFngw908TUMEY18oV9amSjgfreWiCrx7ekbk93ceKvrwSw5k';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const registerPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        if (window.innerWidth < 768) alert('Note: Push notifications on iPhone require "Add to Home Screen"');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        const permission = await Notification.requestPermission();
        console.log('Notification permission status:', permission);
        if (permission !== 'granted') {
            console.warn('Notification permission denied');
            return;
        }

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // Send subscription to server
        console.log('Sending push subscription to server...');
        const res = await api.post('/notifications/subscribe', { subscription });
        console.log('Push subscription saved to server:', res.data);
    } catch (error) {
        console.error('Error registering push:', error);
    }
};

export const unregisterPush = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
            }
        }
    } catch (error) {
        console.error('Error unregistering push:', error);
    }
};
