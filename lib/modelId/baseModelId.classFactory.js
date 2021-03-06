const assert = require('assert');
const { FIELD, MODEL_ID, } = require('../constants');

/**
 * Create a class BaseModel Id bound with ilorm and the given model
 * @param {Model} Model bind to this model
 * @returns {BaseModelId} Return BaseModelId
 */
const baseModelIdFactory = ({ Model, }) => {
  const PRIMARY_KEYS = Model.getSchema().getPrimaryKeys();

  /**
   * A ModelID represent a unique id bound with a model
   */
  class BaseModelId {
    /**
     * Instantiate the baseModelId bound with the given id
     * @param {Mixed} id The id linked with ModelId
     */
    constructor(id) {

      if (typeof id !== 'object') {
        assert(PRIMARY_KEYS.length === 1, `IlormError: Try instantiate ModelId with a bad parameter: ${id}`);

        this[MODEL_ID.ID] = {
          [PRIMARY_KEYS[0][FIELD.NAME]]: id,
        };
      } else {
        this[MODEL_ID.ID] = {};

        PRIMARY_KEYS.forEach((primaryKey) => {
          assert(
            id[primaryKey[FIELD.NAME]],
            `IlormError: Try instantiate ModelId, missing key: ${primaryKey[FIELD.NAME]} in ${Object.keys(id)}`
          );

          this[MODEL_ID.ID][primaryKey[FIELD.NAME]] = id[primaryKey[FIELD.NAME]];
        });
      }
      this[MODEL_ID.MODEL] = Model;
    }

    /**
     * Resolve instance linked with the current id
     * @returns {Model} The model linked with the given id
     */
    resolveInstance() {
      const query = Model.query();

      for (const key of PRIMARY_KEYS) {
        query[key[FIELD.NAME]].is(this[MODEL_ID.ID][key[FIELD.NAME]]);
      }

      return query.findOne();
    }

  }

  return BaseModelId;
};

module.exports = baseModelIdFactory;


