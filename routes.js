const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = (app, myDataBase) => {
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated) {
      return next();
    }
    return res.redirect('/');
  };

  const registerUser = async (req, res, next) => {
    try {
      const checkUser = await myDataBase.findOne({ username: req.body.username });

      if (checkUser) {
        res.redirect('/');
      } else {
        try {
          const hashPass = bcrypt.hashSync(req.body.password, 12);
          const registerUser = await myDataBase.insertOne({
            username: req.body.username,
            password: hashPass,
          });
          next(null, registerUser.ops[0]);
        } catch (error) {
          res.redirect('/');
        }
      }
    } catch (error) {
      next(error);
    }
  };

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
    });
  });

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    return res.status(200).redirect('/profile');
  });

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile', {
      username: req.user.username,
    });
  });

  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app
    .route('/register')
    .post(registerUser, passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
    });

  app.route('/auth/github').get(passport.authenticate('github'));
  app
    .route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
      req.session.user_id = req.user.id;
      res.redirect('/chat');
    });

  app.route('/chat').get(ensureAuthenticated, (req, res) => {
    res.render('chat', { user: req.user });
  });

  app.use((req, res, next) => {
    res.status(404).send('Not Found');
  });
};
