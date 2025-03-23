class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = `${statusCode}`.startsWith(4) ? 'fail' : 'Error';
  }
}

export default ApiError;
