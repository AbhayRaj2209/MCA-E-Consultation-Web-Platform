// Error jiska message client ko safely dikhaya ja sakta hai
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

module.exports = AppError;
