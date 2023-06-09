require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GithubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');

module.exports = (app, myDataBase) => {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'https://advanced-node-s211.onrender.com/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
        try {
          const user = await myDataBase.findOneAndUpdate(
            { id: profile.id },
            {
              $setOnInsert: {
                id: profile.id,
                username: profile.username,
                name: profile.displayName || 'John Doe',
                photo: profile.photos[0].value || '',
                email: Array.isArray(profile.emails) ? profile.emails[0].value : 'No public email',
                created_on: new Date(),
                provider: profile.provider || '',
              },
              $set: {
                last_login: new Date(),
              },
              $inc: {
                login_count: 1,
              },
            },
            { upsert: true, new: true }
          );
          return cb(null, user.value);
        } catch (error) {
          console.error(error);
        }
      }
    )
  );

  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`User ${username} attempted to log in`);
        if (err) return done(err);
        if (!user) return done(null, false);
        if (!bcrypt.compareSync(password, user.password)) return done(null, false);
        return done(null, user);
      });
    })
  );
};
