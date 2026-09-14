export class ApiResponse {
  static success<T>(data: T = null as any, msg = 'Success') {
    return {
      success: true,
      msg,
      data,
    };
  }

  static error(msg = 'Something went wrong') {
    return {
      success: false,
      msg,
    };
  }
}
