export type SecurityRuleContext = {
  path?: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const onPath = context.path ? ` on path '${context.path}'` : '';
    const message = `Firestore Permission Denied: Cannot ${context.operation}${onPath}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }

  toContextObject() {
    return {
      message: this.message,
      context: this.context,
    };
  }
}
