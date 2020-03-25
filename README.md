# Passwordless-Googledatastore-Store

This module provides token storage for [Passwordless](https://github.com/florianheinemann/passwordless), a node.js module for express that allows website authentication without password using verification through email or other means. Visit the project's website https://passwordless.net for more details.

Tokens are stored in a Google Datastore database and are hashed and salted using [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/).

## Usage

First, install the module:

`$ npm install github:zestpc/passwordless-datastore-store --save`

Afterwards, follow the guide for [Passwordless](https://github.com/florianheinemann/passwordless). A typical implementation may look like this:

```javascript
var passwordless = require('passwordless');
const Datastore = require('@google-cloud/datastore')
const DatastoreStore = require('passwordless-datastore-store')
const datastore = Datastore()

passwordless.init(new DatastoreStore(datastore, 'passwordless'))

passwordless.addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
        // Send out a token
    });
    
app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken());
```

## Initialization

```javascript
new datastoreStore(datastore, [kind]);
```
* **datastore:** *(object)* an instance of google datastore
 * https://www.npmjs.com/package/@google-cloud/datastore
* **[kind]:** *(string)* Optional. Name of the kind used to store the passwordless tokens
 * Defaults to: 'passwordless-token'

Example:
```javascript
const Datastore = require('@google-cloud/datastore')
const DatastoreStore = require('passwordless-datastore-store')
const datastore = Datastore()

passwordless.init(new DatastoreStore(datastore, 'passwordless-token'))
```

## Hash and salt
As the tokens are equivalent to passwords (even though they do have the security advantage of only being valid for a limited time) they have to be protected in the same way. passwordless-datastore-store uses [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/) with automatically created random salts. To generate the salt 10 rounds are used.

## Tests

`$ npm test`

## License

[MIT License](http://opensource.org/licenses/MIT)

## Author
Pratham Shah [@1pratham](http://facebook.com/1pratham/)