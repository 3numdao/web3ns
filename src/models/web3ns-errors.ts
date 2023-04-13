export interface Web3nsError {
  error: string;
  httpStatus: number;
}

export class Web3nsError extends Error {
  // protected httpStatus: number;
  // protected name: string;

  constructor(message: string, error: string, httpStatus?: number) {
    super(message);

    this.error = error;
    this.httpStatus = httpStatus || 500;
  }

  toObject() {
    return { error: this.error, message: this.message };
  }
}

export class Web3nsNotFoundError extends Web3nsError {
  constructor(message: string) {
    super(message, 'NotFoundError', 404);
  }
}

export default Web3nsNotFoundError;
