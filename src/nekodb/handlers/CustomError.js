// CustomError.js
class CustomError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'CustomError';
      this.status = status;
    }
  }
  
  export default CustomError;
  