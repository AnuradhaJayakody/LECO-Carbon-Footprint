import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const users = db.getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or user not found. Please contact your LECO Corporate Administrator.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'This user account has been deactivated. Please contact your LECO Administrator.' });
  }

  // Super Admin password check (can accept default master password)
  if (normalizedEmail === 'superadmincf@leco.com' && password && password !== 'Sadmin@cf369' && password.length < 4) {
    return res.status(401).json({ error: 'Invalid password for Super Administrator.' });
  }

  res.json({
    success: true,
    user
  });
});

// 2. Facilities Endpoints
app.get('/api/facilities', (_req, res) => {
  res.json(db.getFacilities());
});

app.post('/api/facilities', (req, res) => {
  const newFac = req.body;
  if (!newFac.name || !newFac.code) {
    return res.status(400).json({ error: 'Facility code and name are required' });
  }
  const created = db.addFacility(newFac);
  res.status(201).json(created);
});

app.put('/api/facilities/:id', (req, res) => {
  const updated = db.updateFacility(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Facility not found' });
  res.json(updated);
});

app.delete('/api/facilities/:id', (req, res) => {
  const success = db.deleteFacility(req.params.id);
  if (!success) return res.status(404).json({ error: 'Facility not found or cannot be deleted' });
  res.json({ success: true });
});

// 3. Users Endpoints (RBAC)
app.get('/api/users', (_req, res) => {
  res.json(db.getUsers());
});

app.post('/api/users', (req, res) => {
  const newUser = req.body;
  if (!newUser.email || !newUser.name) {
    return res.status(400).json({ error: 'User email and name are required' });
  }
  const created = db.addUser({
    ...newUser,
    id: newUser.id || `usr-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString()
  });
  res.status(201).json(created);
});

app.put('/api/users/:id', (req, res) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

app.delete('/api/users/:id', (req, res) => {
  const success = db.deleteUser(req.params.id);
  if (!success) return res.status(400).json({ error: 'Cannot delete root Super Admin or user not found' });
  res.json({ success: true });
});

// 4. Emission Factors Endpoints
app.get('/api/emission-factors', (_req, res) => {
  res.json(db.getEmissionFactors());
});

app.post('/api/emission-factors', (req, res) => {
  const factor = req.body;
  const created = db.addEmissionFactor({
    ...factor,
    id: factor.id || `ef-${Date.now().toString(36)}`
  });
  res.status(201).json(created);
});

app.put('/api/emission-factors/:id', (req, res) => {
  const updated = db.updateEmissionFactor(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Factor not found' });
  res.json(updated);
});

app.delete('/api/emission-factors/:id', (req, res) => {
  const success = db.deleteEmissionFactor(req.params.id);
  if (!success) return res.status(404).json({ error: 'Factor not found' });
  res.json({ success: true });
});

// 5. Scope 1 Records
app.get('/api/scope1', (req, res) => {
  const { year, facilityId } = req.query;
  let items = db.getScope1();
  if (year) {
    items = items.filter(i => i.reportingYear === Number(year));
  }
  if (facilityId && facilityId !== 'ALL') {
    const allFacs = db.getFacilities();
    const targetIds = [String(facilityId)];
    allFacs.filter(f => f.parentId === facilityId).forEach(cf => targetIds.push(cf.id));
    items = items.filter(i => targetIds.includes(i.facilityId));
  }
  res.json(items);
});

app.post('/api/scope1', (req, res) => {
  const rec = req.body;
  const created = db.addScope1({
    ...rec,
    id: rec.id || `s1-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString()
  });
  res.status(201).json(created);
});

app.put('/api/scope1/:id', (req, res) => {
  const updated = db.updateScope1(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Record not found' });
  res.json(updated);
});

app.delete('/api/scope1/:id', (req, res) => {
  const success = db.deleteScope1(req.params.id);
  if (!success) return res.status(404).json({ error: 'Record not found' });
  res.json({ success: true });
});

// 6. Scope 2 Records
app.get('/api/scope2', (req, res) => {
  const { year, facilityId } = req.query;
  let items = db.getScope2();
  if (year) {
    items = items.filter(i => i.reportingYear === Number(year));
  }
  if (facilityId && facilityId !== 'ALL') {
    const allFacs = db.getFacilities();
    const targetIds = [String(facilityId)];
    allFacs.filter(f => f.parentId === facilityId).forEach(cf => targetIds.push(cf.id));
    items = items.filter(i => targetIds.includes(i.facilityId));
  }
  res.json(items);
});

app.post('/api/scope2', (req, res) => {
  const rec = req.body;
  const created = db.addScope2({
    ...rec,
    id: rec.id || `s2-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString()
  });
  res.status(201).json(created);
});

app.put('/api/scope2/:id', (req, res) => {
  const updated = db.updateScope2(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Record not found' });
  res.json(updated);
});

app.delete('/api/scope2/:id', (req, res) => {
  const success = db.deleteScope2(req.params.id);
  if (!success) return res.status(404).json({ error: 'Record not found' });
  res.json({ success: true });
});

// 7. Scope 3 Records
app.get('/api/scope3', (req, res) => {
  const { year, facilityId } = req.query;
  let items = db.getScope3();
  if (year) {
    items = items.filter(i => i.reportingYear === Number(year));
  }
  if (facilityId && facilityId !== 'ALL') {
    const allFacs = db.getFacilities();
    const targetIds = [String(facilityId)];
    allFacs.filter(f => f.parentId === facilityId).forEach(cf => targetIds.push(cf.id));
    items = items.filter(i => targetIds.includes(i.facilityId));
  }
  res.json(items);
});

app.post('/api/scope3', (req, res) => {
  const rec = req.body;
  const created = db.addScope3({
    ...rec,
    id: rec.id || `s3-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString()
  });
  res.status(201).json(created);
});

app.put('/api/scope3/:id', (req, res) => {
  const updated = db.updateScope3(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Record not found' });
  res.json(updated);
});

app.delete('/api/scope3/:id', (req, res) => {
  const success = db.deleteScope3(req.params.id);
  if (!success) return res.status(404).json({ error: 'Record not found' });
  res.json({ success: true });
});

// 8. Dashboard Analytics Summary
app.get('/api/dashboard/summary', (req, res) => {
  const year = req.query.year ? Number(req.query.year) : 2024;
  const facilityId = req.query.facilityId ? String(req.query.facilityId) : 'ALL';
  const summary = db.getDashboardSummary(year, facilityId);
  res.json(summary);
});

// Serve Static in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LECO Carbon Footprint Server running on port ${PORT}`);
});
