const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});

// Temporarily disabled so the server stops crashing!
// redisClient.on('error', (err) => console.log('Redis Client Error', err));

// (async () => {
//     await redisClient.connect();
//     console.log("✅ Redis cache connected!");
// })();

module.exports = redisClient;