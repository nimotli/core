'use strict';

/**
 * Generate StringField class from Field
 * @param {Field} Field to overload
 * @returns {StringField} The new String field
 */
const getStringField = ({ Field, }) => {
  /**
   * Class representing a String field
   */
  class StringField extends Field {
    /**
     * Cast a value to match the specific field or throw an exception
     * @param {Mixed} value the value to cast
     * @returns {String} value the value casted to the specific fields type configuration
     */
    castValue(value) {
      const parentCasting = super.castValue(value);

      if (parentCasting === null || parentCasting === undefined) {
        return parentCasting;
      }

      return String(parentCasting);
    }

    /**
     * Check if the given value is valid for the given field
     * @param {*} value The value to check
     * @return {boolean} Return true if the given value is valid of the current field
     */
    isValid(value) {
      return super.isValid(value) && (value === null || value === undefined || typeof value === 'string');
    }

    /**
     * Return the definition of the schema field.
     * (used by ilorm to define exposed)
     * @return {{name: string, factory: string}} Return the definition of this schema field
     */
    static getFieldDefinition() {
      return {
        name: 'String',
        factory: 'string',
      };
    }
  }

  return StringField;
};

module.exports = getStringField;
