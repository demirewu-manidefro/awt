/**
 * passport.js
 * Configures Google OAuth 2.0 strategy via Passport.js
 * The strategy finds or creates a user in the DB on successful Google auth.
 */

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const UserModel = require('../models/user.model');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;
        const avatarUrl = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email returned from Google profile'), null);
        }

        // Try to find user by Google ID first, then by email
        let user = await UserModel.findByGoogleId(googleId);

        if (!user) {
          // Check if email already registered via email/password
          user = await UserModel.findByEmail(email);

          if (user) {
            // Link the Google ID to the existing account
            user = await UserModel.linkGoogleId(user.id, googleId, avatarUrl);
          } else {
            // Brand-new user — create via Google
            user = await UserModel.createGoogleUser({
              email,
              googleId,
              displayName,
              avatarUrl,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Passport session serialization (we use JWT, but passport still needs these)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
