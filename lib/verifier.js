import { Verifier as AuthLocalVerifier } from '@feathersjs/authentication-local';
import { Verifier as AuthJWTVerifier } from '@feathersjs/authentication-jwt';

const errors = require('@feathersjs/errors');

const Debug = require('debug');
const debug = Debug('feathers-rest-proxy::strategy');


export class JWTVerifier extends AuthJWTVerifier {
  // The verify function has the exact same inputs and 
  // return values as a vanilla passport strategy
  async verify(req, payload, done) { 

    const isExpired = (session) => {
      const diff = new Date(session.validTill) - Date.now()
      debug("session expiry time diff ", diff);
      return diff < 0 // 
    }
    
    // retrieve user object from jwt payload
    try {
      const session = await this.app.services.logins.get(payload.id)
      if(isExpired(session)) {        
        debug("session expired at ", payload, session);
        // the second param is false when verification fails
        // the 'payload' is the payload for the JWT access token that is generated after successful authentication
        return done(null, false, { message: 'Session Expired. Please login again' });
      } else {
        debug("session valid till ", session.validTill);
        // the second param can be any truthy value when verification succeeds
        // the 'payload' is the payload for the JWT access token that is generated after successful authentication
        return done(null, session, payload);
      }

      return done(null, session, payload);
    } catch(error) {
      debug("payload error", payload, error);
      // the second param is false when verification fails
      return done(null, false, error);
    }
  }
}