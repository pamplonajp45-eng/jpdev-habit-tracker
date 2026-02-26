try {
    console.log('Testing SharedHabitRoutes...');
    require('./routes/sharedHabitRoutes');
    console.log('SharedHabitRoutes OK');

    console.log('Testing authRoutes...');
    require('./routes/authRoutes');
    console.log('authRoutes OK');

    console.log('Testing habitRoutes...');
    require('./routes/habitRoutes');
    console.log('habitRoutes OK');

    console.log('Testing chatRoutes...');
    require('./routes/chatRoutes');
    console.log('chatRoutes OK');
} catch (e) {
    console.error('FAILED TO REQUIRE:', e.message);
    console.error(e.stack);
}
