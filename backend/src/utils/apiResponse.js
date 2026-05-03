class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'Internal server error', statusCode = 500, errors = null) {
    const payload = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden — insufficient permissions') {
    return ApiResponse.error(res, message, 403);
  }

  static badRequest(res, message = 'Bad request', errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  static conflict(res, message = 'Resource already exists') {
    return ApiResponse.error(res, message, 409);
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;
