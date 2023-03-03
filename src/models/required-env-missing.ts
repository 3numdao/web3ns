interface RequiredEnvMissing {
  code: number;
  key: string;
  suggestion?: string;
}

class RequiredEnvMissing extends Error {
  constructor(message: string, public key: string, public suggestion?: string) {
    super(message);
    this.code = 500;
  }

  public toInformativeObject(): string {
    return JSON.stringify({
      code: this.code,
      key: this.key,
      suggestion: this.suggestion,
    });
  }

  public getMessage() {
    return `${this.message} ${this.suggestion}`;
  }
}

export default RequiredEnvMissing;
