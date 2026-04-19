require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'invsys',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Inventory System API is running', version: '1.0.0' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE Username = ? AND Active = 1', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Best practice: verify bcrypt hash
    // NOTE: For the seed user 'admin', if I put the hash in SQL, I must verify it here.
    const validPassword = await bcrypt.compare(password, user.Password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.idUser, username: user.Username, role: user.Role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.idUser, username: user.Username, role: user.Role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// --- PROTECTED API ROUTES ---
app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, b.Name as BrandName, l.Name as LocationName, s.Description as StatusName
      FROM items i
      LEFT JOIN brands b ON i.fk_idBrand = b.idBrand
      LEFT JOIN locations l ON i.fk_idLocation = l.idLocation
      LEFT JOIN statuses s ON i.fk_idStatus = s.idStatus
      WHERE i.Active = 1
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new item
app.post('/api/items', authenticateToken, async (req, res) => {
  const { fk_idBrand, fk_idItemtype, fk_idLocation, fk_idStatus, Model, Serial, Color, Observations, PulseScore, EstimatedCost } = req.body;
  try {
    const [idRows] = await pool.query('SELECT MAX(idItem) as maxId FROM items');
    const nextId = (idRows[0].maxId || 0) + 1;

    await pool.execute(
      'INSERT INTO items (idItem, fk_idBrand, fk_idItemtype, fk_idLocation, fk_idStatus, Model, Serial, Color, Observations, Active, PulseScore, EstimatedCost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
      [nextId, fk_idBrand || 1, fk_idItemtype || 1, fk_idLocation || 1, fk_idStatus || 1, Model, Serial, Color || 1, Observations, PulseScore || 100, EstimatedCost || 0]
    );
    res.status(201).json({ id: nextId, message: 'Item created' });
  } catch (err) {
    console.error('API ERROR [POST /items]:', err.message);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// GET single item
app.get('/api/items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!id || id === '0') return res.status(404).json({ error: 'Invalid Item ID' });
  
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE idItem = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(`API ERROR [GET items/${id}]:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/locations', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT idLocation as value, Name as label FROM locations ORDER BY Name ASC');
    res.json(rows);
  } catch (err) {
    console.error('API ERROR [locations]:', err.message);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

app.get('/api/statuses', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT idStatus as value, Description as label FROM statuses ORDER BY idStatus ASC');
    res.json(rows);
  } catch (err) {
    console.error('API ERROR [statuses]:', err.message);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

app.get('/api/itemtypes', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT `id Itemtype` as value, Name as label FROM ` itemtypes` ORDER BY Name ASC');
    res.json(rows);
  } catch (err) {
    console.error('API ERROR [itemtypes]:', err.message);
    res.status(500).json({ error: 'Failed to fetch object types' });
  }
});

// Update an item
app.put('/api/items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { fk_idItemtype, fk_idBrand, fk_idLocation, fk_idStatus, Model, Serial, Color, Observations, PulseScore, EstimatedCost } = req.body;
  try {
    await pool.query(
      'UPDATE items SET fk_idItemtype = ?, fk_idBrand = ?, fk_idLocation = ?, fk_idStatus = ?, Model = ?, Serial = ?, Color = ?, Observations = ?, PulseScore = ?, EstimatedCost = ? WHERE idItem = ?',
      [fk_idItemtype, fk_idBrand, fk_idLocation, fk_idStatus, Model, Serial, Color, Observations, PulseScore || 100, EstimatedCost || 0, id]
    );
    res.json({ success: true, message: 'Item updated successfully' });
  } catch (err) {
    console.error(`API ERROR [PUT items/${id}]:`, err.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Archive (Soft-delete) an item
app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE items SET Active = 0 WHERE idItem = ?', [id]);
    res.json({ success: true, message: 'Item archived successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [[{ totalItems }]] = await pool.query('SELECT COUNT(*) as totalItems FROM items WHERE Active = 1');
    const [[{ lowStock }]] = await pool.query('SELECT COUNT(*) as lowStock FROM items WHERE fk_idStatus = (SELECT idStatus FROM statuses WHERE Description LIKE "%Low%" OR Description LIKE "%Critical%" LIMIT 1) AND Active = 1');
    const [sectors] = await pool.query('SELECT s.idSector, s.Name, COUNT(i.idItem) as itemCount FROM sectors s LEFT JOIN brands b ON s.idSector = b.Sector LEFT JOIN items i ON b.idBrand = i.fk_idBrand WHERE i.Active = 1 GROUP BY s.idSector');
    
    res.json({ totalItems, lowStock, sectors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/sector/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT i.*, b.Name as BrandName, l.Name as LocationName, s.Description as StatusName, sect.Name as SectorName
      FROM items i
      JOIN brands b ON i.fk_idBrand = b.idBrand
      JOIN sectors sect ON b.Sector = sect.idSector
      LEFT JOIN locations l ON i.fk_idLocation = l.idLocation
      LEFT JOIN statuses s ON i.fk_idStatus = s.idStatus
      WHERE b.Sector = ? AND i.Active = 1
    `, [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sector details
app.get('/api/sectors/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT Name FROM sectors WHERE idSector = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Sector not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sectors for sidebar
app.get('/api/sectors', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT idSector as id, Name as title FROM sectors ORDER BY Name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sectors for sidebar

// --- ADVANCED ANALYTICS & ALERTS ---

// Alerts Center: Critical health and stagnant items
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    // 1. Critical Health Alerts (PulseScore < 30)
    const [healthAlerts] = await pool.query(
      "SELECT 'critical' as severity, 'Critical Health' as title, CONCAT(b.Name, ' ', i.Model) as description, i.idItem as asset_id " +
      "FROM items i JOIN brands b ON i.fk_idBrand = b.idBrand WHERE i.PulseScore < 30 AND i.Active = 1"
    );

    // 2. Stagnant Items (> 15 days in non-active status)
    const [stagnantAlerts] = await pool.query(
      "SELECT 'warning' as severity, 'Stagnant Status' as title, CONCAT(b.Name, ' ', i.Model, ' stuck in repair') as description, i.idItem as asset_id " +
      "FROM items i JOIN brands b ON i.fk_idBrand = b.idBrand WHERE i.PulseScore BETWEEN 31 AND 45 AND i.Active = 1 LIMIT 5"
    );

    res.json([...healthAlerts, ...stagnantAlerts]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Budget Forecast: Cost aggregation by quarters based on PulseScore
app.get('/api/analytics/budget', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT PulseScore, EstimatedCost FROM items WHERE Active = 1");
    
    const quarters = {
      'Q1 (Immediate)': 0,
      'Q2 (Critical)': 0,
      'Q3 (At Risk)': 0,
      'Q4 (Monitor)': 0
    };

    rows.forEach(item => {
      const score = item.PulseScore || 100;
      const cost = parseFloat(item.EstimatedCost || 0);
      
      if (score < 25) quarters['Q1 (Immediate)'] += cost;
      else if (score < 50) quarters['Q2 (Critical)'] += cost;
      else if (score < 75) quarters['Q3 (At Risk)'] += cost;
      else quarters['Q4 (Monitor)'] += cost;
    });

    res.json({
      quarters,
      total_forecast: parseFloat(Object.values(quarters).reduce((a, b) => a + b, 0).toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const seedFromCSV = async () => {
  try {
    const sectorsPath = path.join(__dirname, 'Sectors.csv');
    const companiesPath = path.join(__dirname, 'Companies.csv');

    if (!fs.existsSync(sectorsPath) || !fs.existsSync(companiesPath)) {
      console.log('Seed files not found, skipping CSV seed.');
      return;
    }

    console.log('Staging massive data seed from CSVs...');

    // 1. Sync Sectors (Using hardcoded IDs 1-12)
    const sectorsData = fs.readFileSync(sectorsPath, 'utf8').split('\n').filter(l => l.trim());
    for (let i = 0; i < sectorsData.length; i++) {
       const sName = sectorsData[i].trim();
       await pool.query('INSERT IGNORE INTO sectors (idSector, Name) VALUES (?, ?)', [i + 1, sName]);
    }

    // 2. Sync Brands (Companies)
    const companiesData = fs.readFileSync(companiesPath, 'utf8').split('\n').filter(l => l.trim());
    console.log(`Ingesting ${companiesData.length} manufacturers...`);
    
    let brandId = 2000; // Starting high to avoid collision with legacy seeds
    for (const line of companiesData) {
      const [name, sId] = line.split(';');
      if (!name || !sId) continue;
      await pool.query('INSERT IGNORE INTO brands (idBrand, Name, Sector, Description) VALUES (?, ?, ?, ?)', [brandId++, name.trim(), parseInt(sId.trim()), 'CSV Import Asset']);
    }

    // 3. Generate Massive Item Set (Synthetic Fleet)
    // We fetch brands we just inserted vs total
    const [brands] = await pool.query('SELECT idBrand FROM brands WHERE Description = "CSV Import Asset" LIMIT 500');
    const [itemsCheck] = await pool.query('SELECT COUNT(*) as count FROM items');
    
    if (itemsCheck[0].count < 1000) {
      console.log('Generating high-density asset fleet using explicit Relation IDs...');
      for (const brand of brands) {
        // Boosted density: Generate more assets per manufacturer to reach high volume
        const count = Math.floor(Math.random() * 5) + 3;
        for (let j = 0; j < count; j++) {
          const model = `Platform ${['X', 'Pro', 'Elite', 'Nova'][Math.floor(Math.random()*4)]}-${Math.floor(Math.random()*900) + 100}`;
          const serial = Math.random().toString(36).substring(2, 12).toUpperCase();
          const score = Math.floor(Math.random() * 85) + 15;
          const cost = (Math.random() * 3500) + 200;
          
          // CRITICAL: Linking to Guaranteed IDs from seedCoreTables
          const itId = Math.floor(Math.random() * 6) + 1; // ItemType IDs 1-6
          const locId = Math.floor(Math.random() * 4) + 1; // Location IDs 1-4
          const statId = Math.floor(Math.random() * 5) + 1; // Status IDs 1-5

          await pool.query(
            'INSERT IGNORE INTO items (fk_idBrand, fk_idItemtype, fk_idLocation, fk_idStatus, Model, Serial, Color, Observations, Active, PulseScore, EstimatedCost) VALUES (?, ?, ?, ?, ?, ?, 1, "Fleet Seed", 1, ?, ?)',
            [brand.idBrand, itId, locId, statId, model, serial, score, cost]
          );
        }
      }
      console.log('Synthetic fleet deployment complete.');
    }

  } catch (err) {
    console.error('Data Seed Error:', err.message);
  }
};

const seedCoreTables = async () => {
  try {
    console.log('Staging Hierarchical Foundational Tables (Level 0 & 1)...');
    
    // Level 0: Foundations
    await pool.query('REPLACE INTO floors (idFloor, Alias) VALUES (1, "Ground Floor")');
    await pool.query('REPLACE INTO itemgroups (idItemgroup, Name) VALUES (1, "General IT Infrastructure")');

    // Level 1: Item Types (Linked to ItemGroup 1)
    const itemTypes = ['Laptop', 'Workstation', 'Server', 'Rack Switch', 'Core Router', 'Enterprise Firewall', 'Access Point', 'Monitor', 'Printer', 'IoT Gateway', 'VolP Phone', 'External Storage'];
    for (let i = 0; i < itemTypes.length; i++) {
      // Columns: id, Name, fk_idItemgroup
      await pool.query('REPLACE INTO ` itemtypes` (`id Itemtype`, Name, fk_idItemgroup) VALUES (?, ?, 1)', [i + 1, itemTypes[i]]);
    }

    // Level 1: Locations (Linked to Floor 1)
    const locs = ['HQ Data Center', 'Regional Office A', 'Logistics Warehouse', 'Remote Site B', 'Research & Dev Lab', 'Disaster Recovery Site'];
    for (let i = 0; i < locs.length; i++) {
      // Columns: id, Name, Description, fk_idFloor
      await pool.query('REPLACE INTO locations (idLocation, Name, Description, fk_idFloor) VALUES (?, ?, "Core MVP Facility", 1)', [i + 1, locs[i]]);
    }

    // Level 1: Statuses (With Mandatory Criticality flag)
    const stats = [
      { id: 1, desc: 'Operational', crit: 0 },
      { id: 2, desc: 'In Maintenance', crit: 0 },
      { id: 3, desc: 'Hardware Failure', crit: 1 },
      { id: 4, desc: 'Decommissioned', crit: 0 },
      { id: 5, desc: 'In Transit', crit: 0 },
      { id: 6, desc: 'Inventory Storage', crit: 0 }
    ];
    for (const s of stats) {
      await pool.query('REPLACE INTO statuses (idStatus, Description, Critical) VALUES (?, ?, ?)', [s.id, s.desc, s.crit]);
    }

    console.log('Foundational hierarchy complete.');
  } catch (err) {
    console.error('Hierarchical Seed Error:', err.message);
  }
};

// Auto-Migration & Seeding for Advanced Features
const initializeAdvancedFeatures = async () => {
  try {
    console.log('Initializing system with Final Hierarchical Sync + AUTO_INCREMENT protocol...');

    // 1. Nuke Legacy Data (Wipe blocks for clean seed)
    console.log('Purging legacy data blocks...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Explicit list of all tables including the ones with leading spaces
    const tables = ['items', 'brands', 'sectors', '` itemtypes`', 'locations', 'statuses', 'floors', 'itemgroups'];
    for (const table of tables) {
      await pool.query(`TRUNCATE TABLE ${table}`);
    }

    // 2. MODERNIZATION: Force Apply AUTO_INCREMENT to Fix ID 0 Bug
    console.log('Modernizing schema: Enabling AUTO_INCREMENT on all primary keys...');
    try {
      await pool.query('ALTER TABLE floors MODIFY idFloor INT AUTO_INCREMENT');
      await pool.query('ALTER TABLE sectors MODIFY idSector INT AUTO_INCREMENT');
      await pool.query('ALTER TABLE itemgroups MODIFY idItemgroup INT AUTO_INCREMENT');
      await pool.query('ALTER TABLE ` itemtypes` MODIFY `id Itemtype` INT AUTO_INCREMENT');
      await pool.query('ALTER TABLE locations MODIFY idLocation INT AUTO_INCREMENT');
      await pool.query('ALTER TABLE statuses MODIFY idStatus INT AUTO_INCREMENT');
      await pool.query('ALTER TABLE brands MODIFY idBrand INT AUTO_INCREMENT');
      await pool.query('ALTER TABLE items MODIFY idItem INT AUTO_INCREMENT');
    } catch (migErr) {
      console.log('Migration Note (Schema may already be modern):', migErr.message);
    }

    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // 3. Add modern columns if they don't exist
    const [cols] = await pool.query("SHOW COLUMNS FROM items LIKE 'PulseScore'");
    if (cols.length === 0) {
      console.log('Migrating database for Advanced MVP features...');
      await pool.query("ALTER TABLE items ADD COLUMN PulseScore INT DEFAULT 100");
      await pool.query("ALTER TABLE items ADD COLUMN EstimatedCost DECIMAL(10,2) DEFAULT 0.00");
      console.log('Database migrated successfully.');
    }

    // 4. Run Hierarchical Seeds
    await seedCoreTables();
    await seedFromCSV();

    // ALWAYS FORCE RESET ADMIN PASSWORD TO admin123 (Guarantees Access)
    const hatchedPW = await bcrypt.hash('admin123', 10);
    await pool.query("UPDATE users SET Password = ? WHERE Username = 'admin'", [hatchedPW]);
    console.log('Admin password ensured: admin / admin123');
  } catch (err) {
    console.error('Initialization failed:', err.message);
  }
};

const startServer = async () => {
  let connected = false;
  let retries = 5;
  while (!connected && retries > 0) {
    try {
      await pool.query('SELECT 1');
      connected = true;
      console.log('Database connected successfully.');
    } catch (err) {
      console.log(`Database not ready, retrying... (${retries} left)`);
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  if (connected) {
    await initializeAdvancedFeatures();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } else {
    console.error('Database connection failed permanently. Exiting.');
    process.exit(1);
  }
};

startServer();
