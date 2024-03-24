import { OAuthParams } from '../../src';

const params = new OAuthParams('/external/:provider/:method', (templates) => ({
   provider1: {
      url: {
         base_path: 'https://oauth.server1.com/oauth2',
         client_id: '123456789',
         response_type: 'code',
         scope: ['email']
      }
   },
   provider2: {
      url: (redirect_uri, state) =>
         `https://server2.com/oauth2?redirect_uri=${redirect_uri}&state=${state}client_id=987654321&response_type=token&scope=identify`
   },
   google: templates.google({
      client_id: '00000000'
   })
}));

export default params;
