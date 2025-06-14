import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, {
            id: user._id.toString(),
            email: user.email,
            role: user.role || 'teacher'
          });
        }
        
        // Create new user
        const newUser = await User.create({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName,
          provider: 'google'
        });
        
        return done(null, {
          id: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role || 'teacher'
        });
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    if (user) {
      done(null, {
        id: user._id.toString(),
        email: user.email,
        role: user.role || 'teacher'
      });
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, false);
  }
});

export default passport;
