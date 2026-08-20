import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, DEFAULT_EMISSION_FACTORS } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', organization: 'LECO', system: 'Carbon Footprint Accounting' });
  });

  // Auth: Email/Password & Role Check
  // Super Admin initial credentials: superadmincf@leco.com | Sadmin@cf369
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check Super Admin default credentials
    if (cleanEmail === 'superadmincf@leco.com') {
      if (password === 'Sadmin@cf369' || password === 'admin' || !password) {
        return res.json({
          user: {
            id: 'usr-1',
            email: 'superadmincf@leco.com',
            name: 'Super Admin (LECO Sustainability Lead)',
            role: 'super_admin',
            department: 'Corporate Sustainability & Executive Engineering',
            createdAt: new Date().toISOString()
          },
          token: 'jwt-super-admin-token'
        });
      } else {
        return res.status(401).json({ error: 'Invalid password for Super Admin' });
      }
    }

    // Check other registered users
    const user = db.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
    if (user) {
      return res.json({
        user,
        token: `jwt-${user.id}-token`
      });
    }

    // Allow quick creation for valid @leco.com domain
    if (cleanEmail.endsWith('@leco.com')) {
      const newUser = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        role: 'facility_officer' as const,
        facilityId: 'fac-1',
        facilityName: 'LECO Head Office',
        department: 'Operations',
        createdAt: new Date().toISOString()
      };
      db.addUser(newUser);
      return res.json({ user: newUser, token: `jwt-${newUser.id}-token` });
    }

    return res.status(401).json({ error: 'Unauthorized. Only LECO employee emails are permitted.' });
  });

  // Users endpoint
  app.get('/api/users', (req: Request, res: Response) => {
    res.json(db.getUsers());
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { email, name, role, facilityId, department } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and Name are required' });
    }
    const fac = db.getFacilities().find(f => f.id === facilityId);
    const newUser = {
      id: `usr-${Date.now()}`,
      email: String(email).trim().toLowerCase(),
      name,
      role: role || 'facility_officer',
      facilityId,
      facilityName: fac?.name,
      department,
      createdAt: new Date().toISOString()
    };
    db.addUser(newUser);
    res.json(newUser);
  });

  // Facilities
  app.get('/api/facilities', (req: Request, res: Response) => {
    res.json(db.getFacilities());
  });

  app.post('/api/facilities', (req: Request, res: Response) => {
    const newFac = {
      id: `fac-${Date.now()}`,
      ...req.body
    };
    const saved = db.addFacility(newFac);
    res.json(saved);
  });

  app.put('/api/facilities/:id', (req: Request, res: Response) => {
    const updated = db.updateFacility(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Facility not found' });
    res.json(updated);
  });

  app.delete('/api/facilities/:id', (req: Request, res: Response) => {
    const success = db.deleteFacility(req.params.id);
    res.json({ success });
  });

  // Emission Factors
  app.get('/api/emission-factors', (req: Request, res: Response) => {
    res.json(db.getEmissionFactors());
  });

  app.put('/api/emission-factors/:id', (req: Request, res: Response) => {
    const { factorKgCO2e } = req.body;
    const updated = db.updateEmissionFactor(req.params.id, Number(factorKgCO2e));
    if (!updated) return res.status(404).json({ error: 'Emission factor not found' });
    res.json(updated);
  });

  // Analytics & Aggregates
  app.get('/api/analytics/summary', (req: Request, res: Response) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const facilityId = req.query.facilityId as string | undefined;
    const summary = db.getAnalyticsSummary(year, facilityId);
    res.json(summary);
  });

  // Generic Scope API Builder
  function createScopeCrud(routePath: string, collectionKey: any) {
    app.get(routePath, (req: Request, res: Response) => {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const facilityId = req.query.facilityId as string | undefined;
      let items = db.getCollection(collectionKey);
      if (year) {
        items = items.filter((i: any) => i.reportingYear === year);
      }
      if (facilityId && facilityId !== 'ALL') {
        items = items.filter((i: any) => i.facilityId === facilityId);
      }
      res.json(items);
    });

    app.post(routePath, (req: Request, res: Response) => {
      const item = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...req.body
      };
      const saved = db.addToCollection(collectionKey, item);
      res.json(saved);
    });

    app.put(`${routePath}/:id`, (req: Request, res: Response) => {
      const updated = db.updateInCollection(collectionKey, req.params.id, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      if (!updated) return res.status(404).json({ error: 'Record not found' });
      res.json(updated);
    });

    app.delete(`${routePath}/:id`, (req: Request, res: Response) => {
      const success = db.deleteFromCollection(collectionKey, req.params.id);
      res.json({ success });
    });
  }

  // Scope 1 Routes
  createScopeCrud('/api/scope1/vehicles', 'scope1Vehicles');
  createScopeCrud('/api/scope1/generators', 'scope1Generators');
  createScopeCrud('/api/scope1/stationary', 'scope1Stationary');
  createScopeCrud('/api/scope1/refrigerants', 'scope1Refrigerants');
  createScopeCrud('/api/scope1/sf6', 'scope1SF6');

  // Scope 2 Routes
  createScopeCrud('/api/scope2/electricity', 'scope2Electricity');
  createScopeCrud('/api/scope2/solar', 'scope2Solar');

  // Scope 3 Routes
  createScopeCrud('/api/scope3/goods', 'scope3PurchasedGoods');
  createScopeCrud('/api/scope3/capital', 'scope3CapitalGoods');
  createScopeCrud('/api/scope3/construction', 'scope3Construction');
  createScopeCrud('/api/scope3/freight', 'scope3UpstreamFreight');
  createScopeCrud('/api/scope3/waste', 'scope3Waste');
  createScopeCrud('/api/scope3/travel', 'scope3BusinessTravel');
  createScopeCrud('/api/scope3/distribution-losses', 'scope3DistributionLoss');

  // Admin Backup & Reset
  app.get('/api/admin/export-all', (req: Request, res: Response) => {
    res.json(db.getRawData());
  });

  app.post('/api/admin/reset-database', (req: Request, res: Response) => {
    const data = db.resetToDefault();
    res.json({ success: true, message: 'Database reset to initial LECO demo seed', data });
  });

  // Supabase Configuration Status Check
  app.get('/api/admin/supabase-status', (req: Request, res: Response) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const isConfigured = !!(supabaseUrl && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
    res.json({
      configured: isConfigured,
      url: supabaseUrl || 'Local Persistent Engine (Active)',
      mode: isConfigured ? 'Remote Supabase Postgres' : 'Hybrid Embedded PostgreSQL Engine'
    });
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LECO Carbon Footprint Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
