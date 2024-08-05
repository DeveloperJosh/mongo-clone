class Model {
    constructor(name, schemaManager, apiWrapper) {
      this.name = name;
      this.schemaManager = schemaManager;
      this.apiWrapper = apiWrapper;
      this.apiWrapper.createCollection(this.name); // Ensure the collection is created
    }
  
    async create(document) {
      this.schemaManager.validateDocument(this.name, document);
      return this.apiWrapper.insert(this.name, document);
    }
  
    async find(query) {
      return this.apiWrapper.find(this.name, query);
    }
  
    async findById(id) {
      return this.apiWrapper.findById(this.name, id);
    }
  
    async update(query, update) {
      return this.apiWrapper.update(this.name, query, update);
    }
  
    async updateOne(id, update) {
      return this.apiWrapper.updateOne(this.name, id, update);
    }
  
    async delete(query) {
      return this.apiWrapper.delete(this.name, query);
    }
  }
  
  export default Model;
  