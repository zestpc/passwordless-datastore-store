'use strict';

const util = require('util')
const bcrypt = require('bcrypt')
const TokenStore = require('passwordless-tokenstore')
const Datastore = require('@google-cloud/datastore')

/**
 * Constructor of DatastoreStore
 * @param {Object} datastore an instance of google datastore
 * https://www.npmjs.com/package/@google-cloud/datastore
 * @param {String} [kind] Name of the kind used to store the 
 * passwordless tokens
 * Defaults to: 'passwordless-token'
 * @constructor
 */

function DatastoreStore(datastore, kind) {
    if (arguments.length === 0) {
        throw new Error('A valid google cloud datastore instance has to be provided')
    }

    TokenStore.call(this);

    this.datastore = datastore
    this.kind = kind
}

util.inherits(DatastoreStore, TokenStore)

/**
 * Checks if the provided token / user id combination exists and is
 * valid in terms of time-to-live. If yes, the method provides the 
 * the stored referrer URL if any. 
 * @param  {String}   token to be authenticated
 * @param  {String}   uid Unique identifier of an user
 * @param  {Function} callback in the format (error, valid, referrer).
 * In case of error, error will provide details, valid will be false and
 * referrer will be null. If the token / uid combination was not found 
 * found, valid will be false and all else null. Otherwise, valid will 
 * be true, referrer will (if provided when the token was stored) the 
 * original URL requested and error will be null.
 */
DatastoreStore.prototype.authenticate = function (token, uid, callback) {
    if (!token || !uid || !callback) {
        throw new Error('TokenStore:authenticate called with invalid parameters')
    }

    const query = this.datastore
        .createQuery(this.kind)
        .filter('uid', '=', uid)
        .filter('ttl', '>', Date.now())


    this.datastore.runQuery(query).then((result) => {
        const results = result[0]
        if (results.length === 0) {
            callback(null, false, null)
        }else{
            bcrypt.compare(token, results[0].hashedToken, (err, res) => {
                if (err) {
                    callback(err, false, null);
                }else if (res) {
                    callback(null, true, results[0].originUrl || '')
                }else{
                    callback(err,false,null)
                }
            })
        }
    }).catch((err) => {
        callback(err, false, null)
    });
}

/**
 * Stores a new token / user ID combination or updates the token of an
 * existing user ID if that ID already exists. Hence, a user can only
 * have one valid token at a time
 * @param  {String}   token Token that allows authentication of _uid_
 * @param  {String}   uid Unique identifier of an user
 * @param  {Number}   msToLive Validity of the token in ms
 * @param  {String}   originUrl Originally requested URL or null
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
DatastoreStore.prototype.storeOrUpdate = function (token, uid, msToLive, originUrl, callback) {

    if (!token || !uid || !msToLive || !callback) {
        throw new Error('TokenStore:storeOrUpdate called with invalid parameters')
    }

    bcrypt.hash(token, 10, (err, hashedToken) => {

        if (err) {
            return callback(err)
        }

        const newRecord = {
            uid,
            hashedToken,
            ttl: Date.now() + msToLive,
            originUrl
        }

        const query = this.datastore
            .createQuery(this.kind)
            .select('__key__')
            .filter('uid', '=', uid);

        this.datastore.runQuery(query).then((result) => {
            const results = result[0]
            const key = results[0] ? results[0][Datastore.KEY] : this.datastore.key(this.kind)
            const entity = {
                key,
                data: newRecord
            }
            this.datastore.upsert(entity).then(() => {
                callback()
            }).catch((err) => {
                callback(err)
            });

        }).catch((err) => {
            callback(err)
        });
    })
}

/**
 * Invalidates and removes a user and the linked token
 * @param  {String}   user ID
 * @param  {Function} callback called with callback(error) in case of an
 * error or as callback() if the uid was successully invalidated
 */
DatastoreStore.prototype.invalidateUser = function (uid, callback) {
    if (!uid || !callback) {
        throw new Error('TokenStore:invalidateUser called with invalid parameters')
    }

    const query = this.datastore
        .createQuery(this.kind)
        .select('__key__')
        .filter('uid', '=', uid)

    this.datastore.runQuery(query).then((result) => {
        const results = result[0]
        if (results[0]) {
            this.datastore.delete(results[0][Datastore.KEY]).then(() => {
                callback()
            }).catch((err) => {
                callback(err)
            });
        } else {
            callback()
        }
    }).catch((err) => {
        callback(err)
    });
}

/**
 * Removes and invalidates all token
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
DatastoreStore.prototype.clear = function (callback) {
    if (!callback) {
        throw new Error('TokenStore:clear called with invalid parameters')
    }

    const query = this.datastore
        .createQuery(this.kind)
        .select('__key__')

    this.datastore.runQuery(query).then((result) => {
        const results = result[0]
        let keys
        if (results.length > 0) {
            keys = results.map(function (result) {
                return result[Datastore.KEY]
            });
            this.datastore.delete(keys).then(() => {
                callback()
            }).catch((err) => {
                callback(err)
            });
        }else{
            callback()
        }
    }).catch((err) => {
        callback(err)
    });


}

/**
 * Number of tokens stored (no matter the validity)
 * @param  {Function} callback Called with callback(null, count) in case
 * of success or with callback(error) in case of an error
 */
DatastoreStore.prototype.length = function (callback) {
    const query = this.datastore
        .createQuery(this.kind)
        .select('__key__')


    this.datastore.runQuery(query).then((result) => {
        const results = result[0]
        callback(null, results.length)
    }).catch((err) => {
        callback(err)
    })
}

module.exports = DatastoreStore
