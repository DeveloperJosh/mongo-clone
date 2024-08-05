import Ajv from 'ajv';
import addFormats from 'ajv-formats';

class SchemaManager {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.schemas = {};
  }

  setSchema(collectionName, schema) {
    this.schemas[collectionName] = this.ajv.compile(schema);
  }

  validateDocument(collectionName, document) {
    const validate = this.schemas[collectionName];
    if (validate) {
      const valid = validate(document);
      if (!valid) {
        throw new Error(`Schema validation failed: ${this.ajv.errorsText(validate.errors)}`);
      }
    }
  }
}

export default SchemaManager;
