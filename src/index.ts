import 'dotenv/config';

import { serve } from '@hono/node-server';
import { app } from './app';

serve(app); // port 3000
