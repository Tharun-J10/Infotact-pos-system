// backend/config/redisClient.js
const redis = require('redis');

const client = redis.createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('✅ Redis Connected Successfully!'));

client.connect();

module.exports = client;