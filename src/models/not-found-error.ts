interface NotFoundError {
  name: string;
  code: number;
  address: string | null;
}

class NotFoundError extends Error {
  constructor(message: string, name: string, address: string | null) {
    super(message);

    this.name = name;
    this.code = 404;
    this.address = address;
  }

  toInformativeObject() {
    return { name: this.name, address: this.address, message: this.message };
  }
}

export default NotFoundError;
