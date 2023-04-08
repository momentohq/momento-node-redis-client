import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import {createClient, Momento} from 'momento-redis-client';

// Initialize client
const redisClient = createClient(
  new Momento.CacheClient({
    configuration: Momento.Configurations.Laptop.v1(),
    credentialProvider: Momento.CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  }),
  'cache'
);
redisClient.connect().catch(console.error);
redisClient.on('error', console.error);

// Initialize session store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'app:',
});

const app = express();
const port = 3000;

app.use(
  session({
    store: redisStore,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'keyboard cat',
  })
);

declare module 'express-session' {
  interface SessionData {
    views: number;
  }
}

app.get('/', (req, res) => {
  let body = '';
  console.log('Someone viewed. Session ID:', req.sessionID);
  if (req.session.views) {
    req.session.views++;
    body += '<p>Welcome back!</p>';
  } else {
    req.session.views = 1;
    body += '<p>First time visiting? View this page in several browsers :)</p>';
  }
  body += `<p>Viewed <strong>${req.session.views}</strong> times.</p>`;
  res.send(body);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
