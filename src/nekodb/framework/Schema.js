class Schema {
    constructor(schemaDefinition) {
      this.schemaDefinition = schemaDefinition;
    }
  
    validate(document, schema = this.schemaDefinition) {
      for (const key in schema) {
        const field = schema[key];
        const value = document[key];
  
        if (field.required && value === undefined) {
          throw new Error(`Validation failed: ${key} is required`);
        }
  
        if (value !== undefined) {
          if (field.type === 'array') {
            if (!Array.isArray(value)) {
              throw new Error(`Validation failed: ${key} should be an array`);
            }
            if (field.items) {
              value.forEach(item => this.validate(item, field.items));
            }
          } else if (field.type === 'object') {
            if (typeof value !== 'object' || Array.isArray(value)) {
              throw new Error(`Validation failed: ${key} should be an object`);
            }
            this.validate(value, field.properties);
          } else if (typeof value !== field.type) {
            throw new Error(`Validation failed: ${key} should be of type ${field.type}`);
          }
        }
      }
    }
  
    validateUpdate(update, schema = this.schemaDefinition) {
      if (update.$push) {
        for (const [key, value] of Object.entries(update.$push)) {
          if (!schema[key] || schema[key].type !== 'array') {
            throw new Error(`Validation failed: ${key} should be an array to perform $push`);
          }
          if (schema[key].items) {
            this.validate(value, schema[key].items);
          }
        }
      }
  
      if (update.$pull) {
        for (const [key, value] of Object.entries(update.$pull)) {
          if (!schema[key] || schema[key].type !== 'array') {
            throw new Error(`Validation failed: ${key} should be an array to perform $pull`);
          }
          // For $pull, we don't need to validate the value itself since it's a condition for removal
        }
      }
    }
  }
  
  export { Schema };
  