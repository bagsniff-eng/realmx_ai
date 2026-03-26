import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { prisma } from './db.js';

AdminJS.registerAdapter({ Database, Resource });

export const setupAdmin = async (app: any) => {
  const adminOptions = {
    resources: [
      {
        resource: { model: getModelByName('User'), client: prisma },
        options: {
          properties: {
            // Hide sensitive fields from admin list
          }
        }
      },
      {
        resource: { model: getModelByName('ReferralReward'), client: prisma },
        options: {}
      },
      {
        resource: { model: getModelByName('MiningSession'), client: prisma },
        options: {}
      },
      {
        resource: { model: getModelByName('TaskCompletion'), client: prisma },
        options: {}
      }
    ],
    rootPath: '/internal-admin',
  };

  const admin = new AdminJS(adminOptions);

  // Use environment variables for admin credentials
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@realmxai.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SESSION_SECRET || 'change-me-in-production';

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return { email, role: 'admin' };
      }
      return null;
    },
    cookieName: 'adminjs',
    cookiePassword: process.env.SESSION_SECRET || 'supersecret-admin-cookie-password',
  }, null, {
    secret: process.env.SESSION_SECRET || 'supersecret-admin-cookie-password',
    resave: false,
    saveUninitialized: true
  });

  app.use(admin.options.rootPath, adminRouter);
  return admin;
};
