import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

export default function setupPassport() {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Only set up Google strategy if credentials are provided
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallback = process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback';

  console.log('[Passport] Google Client ID:', googleId ? 'SET' : 'NOT SET');
  console.log('[Passport] Google Client Secret:', googleSecret ? 'SET' : 'NOT SET');

  if (googleId && googleSecret) {
    console.log('[Passport] Registering Google OAuth strategy...');
    passport.use(new GoogleStrategy({
      clientID: googleId,
      clientSecret: googleSecret,
      callbackURL: googleCallback,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Prefer linking by googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        const email = profile.emails?.[0]?.value;
        if (email) {
          // If a user exists with same email (signed up via email/password), link accounts
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            user.name = user.name || profile.displayName;
            user.avatar = user.avatar || profile.photos?.[0]?.value;
            await user.save();
            return done(null, user);
          }
        }

        // Otherwise create new user
        user = await User.create({
          googleId: profile.id,
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
        });
        done(null, user);
      } catch (err) {
        done(err);
      }
    }));
    console.log('[Passport] Google OAuth strategy registered successfully!');
  } else {
    console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.');
  }
}
