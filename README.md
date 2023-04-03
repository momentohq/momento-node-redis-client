# What and Why?

This project provides a Momento-backed implementation [@redis/client](https://github.com/redis/node-redis). The goal is to provide a drop-in replacement for [@redis/client](https://github.com/redis/node-redis) so that you can use the same code with either a Redis server or a Momento account.

# Examples

## basic

CLI app demoing a client backed by Redis vs backed by Momento. The code is the same except for client instantiation.

## express-session

[Express.js](https://github.com/expressjs/express) app with [express-session](https://github.com/expressjs/session) and the [connect-redis](https://github.com/tj/connect-redis) backend. `MomentoRedisClient` is compatible with [connect-redis](https://github.com/tj/connect-redis); no code changes needed!
