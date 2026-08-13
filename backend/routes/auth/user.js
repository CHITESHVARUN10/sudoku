const express = require('express');
const Router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/User');


passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        if (err) {
            console.error('Error deserializing user:', err);
            return done(err);
        }
        done(null, user);
    }); 
});

passport.use('user-local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, (email, password, done) => {
    User.findOne({ email: email }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      return done(null, user);
    });
  }));

  
  Router.post('/login',async (req, res, next) => {
    passport.authenticate('user-local-login', (err, user, info) => {
        if (err) {  res.status(500).json({ success: false, message: 'An error occurred during login.' }); }
        if (!user) { return res.status(400).json({ success: false, message: 'Invalid email or password.' }); }  
        return res.status(200).json({ success: true, message: 'Login successful.', user: user });

    });
  });
  Router.post('/register',async(req,res)=>{
    const {name,email,password} = req.body;
    try{
        const checkUser= await User.findOne({email:email});
        if(checkUser){
            return res.status(400).json({success:false,message:"User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        return res.status(201).json({ success: true, message: 'User registered successfully.' });

    }catch(err){
        console.error('Error during registration:', err);
        return res.status(500).json({success:false,message:"error has occurred during registration"});
    }
  })
  Router.get('/logout',async(req,res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }  
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    });
  })

module.exports = Router;