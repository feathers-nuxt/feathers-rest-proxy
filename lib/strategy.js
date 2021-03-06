const Strategy = require('passport-custom');

const Debug = require('debug');
const debug = Debug('feathers-rest-proxy::strategy');

module.exports = (opts) => {
  return function() {
    const app = this;
    const verifier = async (req, done) => {

      opts.userService = 'proxyauth';
      
      try {

        const {username, password} = req.query;
        
        const params = Object.assign({}, req);
        delete params.query.username;
        delete params.query.password;
        delete params.query.strategy;

        params.query.urlSuffix = '/login'

        // get token and user profile from remote API
        const res = await app.service('proxyauth').create({username, password}, params);

        if(res) {

          // store session i.e token and user profile 
          let now = new Date();
          let later = new Date(now.getTime() + 50*60000); // expires in 60 minutes
          const session = Object.assign({
            validFrom: now,
            validTill: later
          }, res.data)
          const login = await app.service('logins').create(session)
          debug('rest strategy done ', username, password, login, session);
          return done(null, login, { id: login.id });

        } else {

          debug('rest strategy remote login error', error);
          return done(error);

        }


      } catch (error) {
        debug('rest strategy error', error);
        return done(error);
      }

    };

    // register the strategy in the app.passport instance
    app.passport.use('rest', new Strategy(verifier));
  };

};