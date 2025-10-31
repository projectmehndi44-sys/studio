

export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    public context: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        const message = `Firestore Permission Denied: Insufficient permissions for a '${context.operation}' operation on path '${context.path}'.`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;

        // This is to make the error object serializable for Next.js error overlay
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
}
