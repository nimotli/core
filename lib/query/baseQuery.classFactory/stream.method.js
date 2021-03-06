'use strict';

const { Readable, Transform, } = require('stream');

const { CONNECTOR, LINKED_WITH, } = require('../../constants').QUERY.FIELDS;

const WAIT_TTL = 100;

/**
 * Stream used to restrict query to another query
 */
class LinkedStream extends Readable {
  /**
   * Create a LinkedStream object
   * @param {Query} query The query used as primary target
   */
  constructor({ query, }) {
    super({
      objectMode: true,
    });


    this.query = query;
    this.lockComplexQueryResolve = null;
    this.internalStream = null;
    this.isFinished = false;

    this.runInternal();
  }

  /**
   * Internal async system to make it works
   * @returns {Promise<void>} Return nothing
   */
  async runInternal() {
    await this.query.runComplexQuery(async () => {
      this.internalStream = await this.query[CONNECTOR].stream(this.query);

      let streamReadyResolve;

      const waitForStream = new Promise((resolve) => {
        streamReadyResolve = resolve;
      });

      this.internalStream.on('readable', streamReadyResolve);

      await waitForStream;

      await new Promise((resolve) => {
        this.lockComplexQueryResolve = resolve;
      });

      return true;
    });

    this.push(null);
    this.isFinished = true;
  }

  /**
   * Method required per Readable interface to create a valid Read stream
   * @returns {Promise} Return nothing really interesting
   * @private
   */
  _read() {
    if (this.isFinished) {
      return;
    }

    if (!this.internalStream) {
      setTimeout(() => this._read(), WAIT_TTL);

      return;
    }

    const value = this.internalStream.read();

    if (value !== null) {
      this.push(value);

      return;
    }

    this.internalStream.destroy();
    this.internalStream = null;

    this.lockComplexQueryResolve();

    this._read();
  }

  /**
   * Create a LinkedStream object
   * @param {Query} query The query used as primary target
   * @returns {LinkedStream} The created linked stream
   */
  static createLinkedStream({ query, }) {
    return new LinkedStream({
      query,
    });
  }
}

/**
 * Transform stream to instantiate instance from the db source stream
 */
class InstantiateStream extends Transform {
  /**
   * Defined by the model
   * @param {Query} query The model to instantiate per each database entry
   */
  constructor(query) {
    super({
      objectMode: true,
    });

    this.query = query;
  }

  /**
   * Transform method of the Transform stream, overload to instantiate model instance.
   * @param {Object} rawInstance the model from the database
   * @param {String} encoding The encoding of the database source
   * @param {Function} callback Function called back from the result database
   * @returns {void} Return nothing
   * @private
   */
  _transform(rawInstance, encoding, callback) {
    callback(null, this.query.applySelectBehaviorOnConnectorResult(rawInstance));
  }
}

/**
 * Create a stream method from the query instance
 * @param {QueryBase} query The query instance to use
 * @returns {Promise.<Stream>} The stream to use.
 */
const streamMethod = async (query) => {
  if (query[LINKED_WITH].length) {
    const readStream = await LinkedStream.createLinkedStream({
      query,
    });

    return readStream
      .pipe(new InstantiateStream(query));
  }

  const rawStream = await query[CONNECTOR].stream(query);

  return rawStream
    .pipe(new InstantiateStream(query));
};

module.exports = streamMethod;
