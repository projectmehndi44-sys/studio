
import { EventEmitter } from 'events';

// This is a simple, shared event emitter instance.
// We are using the node 'events' module, which is available in Next.js environments.
export const errorEmitter = new EventEmitter();
