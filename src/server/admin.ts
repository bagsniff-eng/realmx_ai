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
            // Can add specifics here if needed
          }
        }
      },
      {
        resource: { model: getModelByName('ReferralReward'), client: prisma },
        options: {}
      }
    ],
    rootPath: '/internal-admin',
  };

  const admin = new AdminJS(adminOptions);

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => {
      // Seeded credentials from user comments
      if (email === 'bagsniff@gmail.com' && password === 'admin123') {
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
