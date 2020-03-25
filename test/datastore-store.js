'use strict';

const standardTests = require('passwordless-tokenstore-test');

const DatastoreStore = require('./../passwordless-datastore');
const Datastore = require('@google-cloud/datastore');
const datastore = Datastore();

function TokenStoreFactory() {
  	return new DatastoreStore(datastore, 'passwordless-test');
}

const beforeEachTest = function(done) {
  	done();
};

const afterEachTest = function(done) {
  	done();
};

standardTests(TokenStoreFactory, beforeEachTest, afterEachTest);
