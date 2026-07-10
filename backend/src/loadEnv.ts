// Load the backend's own .env by ABSOLUTE path (one level up from the compiled
// dist/ — i.e. backend/.env), with override:true. This means it no longer
// matters what working directory pm2 launches the process from, and the file's
// values always win over any stale variables cached in pm2's environment.
import { config } from 'dotenv';
import path from 'path';

config({ override: true, path: path.resolve(__dirname, '..', '.env') });
