const errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err);

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500
        ? 'An internal server error occurred'
        : err.message;

    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
