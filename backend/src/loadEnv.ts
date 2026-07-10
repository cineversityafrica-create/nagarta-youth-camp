// Load .env with override:true so the values in the file always win over any
// stale variables cached in the process manager's (pm2) environment. Imported
// first in index.ts so it runs before anything else reads process.env.
import { config } from 'dotenv';

config({ override: true });
