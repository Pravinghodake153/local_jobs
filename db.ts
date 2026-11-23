import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = join(import.meta.dir, "arovia.db");
export const db = new Database(dbPath, { create: true });

// Enable WAL mode for concurrent performance
db.run("PRAGMA journal_mode = WAL;");

export function initDatabase() {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('worker', 'customer')) NOT NULL,
      password_hash TEXT NOT NULL,
      trade TEXT,
      city TEXT DEFAULT 'Bengaluru',
      radius_km INTEGER DEFAULT 10,
      hourly_rate INTEGER DEFAULT 350,
      bio TEXT,
      verified INTEGER DEFAULT 0,
      trust_score REAL DEFAULT 4.5,
      jobs_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Skills Proof Table (AI-checked video demonstrations)
  db.run(`
    CREATE TABLE IF NOT EXISTS skills_proof (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      trade TEXT NOT NULL,
      task_title TEXT NOT NULL,
      video_name TEXT NOT NULL,
      ai_status TEXT CHECK(ai_status IN ('pending', 'verified', 'rejected')) DEFAULT 'verified',
      ai_score INTEGER DEFAULT 92,
      checklist_json TEXT NOT NULL,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(worker_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Jobs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      worker_id INTEGER,
      title TEXT NOT NULL,
      trade TEXT NOT NULL,
      description TEXT NOT NULL,
      locality TEXT NOT NULL,
      city TEXT DEFAULT 'Bengaluru',
      radius_km INTEGER DEFAULT 10,
      price_range_min INTEGER NOT NULL,
      price_range_max INTEGER NOT NULL,
      offered_price INTEGER,
      status TEXT CHECK(status IN ('open', 'quoted', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
      customer_confirmed INTEGER DEFAULT 0,
      worker_confirmed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES users(id),
      FOREIGN KEY(worker_id) REFERENCES users(id)
    );
  `);

  // Reviews Table (Dual bilateral reviews)
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewee_id INTEGER NOT NULL,
      reviewer_role TEXT CHECK(reviewer_role IN ('worker', 'customer')) NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      has_evidence INTEGER DEFAULT 0,
      evidence_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(job_id) REFERENCES jobs(id),
      FOREIGN KEY(reviewer_id) REFERENCES users(id),
      FOREIGN KEY(reviewee_id) REFERENCES users(id)
    );
  `);

  // Password Resets Table
  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      reset_code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0
    );
  `);

  // Seed default demo accounts if not already present
  seedDemoData();
}

function seedDemoData() {
  const count = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (count.count > 0) return;

  // Insert Demo Workers
  // 1. Ravi - Electrician (from presentation case study)
  const insertUser = db.prepare(`
    INSERT INTO users (phone, name, role, password_hash, trade, city, radius_km, hourly_rate, bio, verified, trust_score, jobs_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    "9876543210",
    "Ravi Kumar",
    "worker",
    "demo123",
    "Electrician",
    "Bengaluru",
    10,
    450,
    "8 years field experience in residential and commercial electrical wiring, short-circuit troubleshooting, and inverter installations.",
    1,
    4.9,
    48
  );

  // 2. Suresh - Plumber
  insertUser.run(
    "9876543211",
    "Suresh M.",
    "worker",
    "demo123",
    "Plumber",
    "Bengaluru",
    12,
    400,
    "Specialist in concealed pipeline leaks, bathroom sanitary fittings, and water heater servicing.",
    1,
    4.8,
    35
  );

  // 3. Manjunath - Carpenter
  insertUser.run(
    "9876543212",
    "Manjunath R.",
    "worker",
    "demo123",
    "Carpenter",
    "Bengaluru",
    8,
    500,
    "Custom modular furniture repair, lock replacements, and doorway framing.",
    1,
    4.7,
    22
  );

  // 4. Demo Customer - Priya Sharma (Homeowner)
  insertUser.run(
    "9876543220",
    "Priya Sharma",
    "customer",
    "demo123",
    null,
    "Bengaluru",
    15,
    0,
    "Apartment resident in Indiranagar, Bengaluru. Looking for verified local tradespeople.",
    1,
    5.0,
    14
  );

  // 5. Demo Customer - Rajesh Verma (Local Contractor)
  insertUser.run(
    "9876543221",
    "Rajesh Verma",
    "customer",
    "demo123",
    null,
    "Bengaluru",
    20,
    0,
    "Commercial site supervisor hiring reliable technicians for short-term renovation contracts.",
    1,
    4.8,
    31
  );

  // Seed AI-verified skill demonstration for Ravi
  db.run(`
    INSERT INTO skills_proof (worker_id, trade, task_title, video_name, ai_status, ai_score, checklist_json)
    VALUES (
      1,
      'Electrician',
      'Dual-Phase MCB Breaker Wiring & Continuity Test',
      'ravi_demo_mcb_wiring.mp4',
      'verified',
      96,
      '{"safety_gear": "Insulated gloves and safety goggles verified", "tools_used": "Insulated wire stripper, digital multimeter, screw terminal driver", "technique": "Correct wire gauge stripping without core damage, firm screw terminal torque", "testing": "Live continuity confirmation with multimeter passing 230V specs"}'
    )
  `);

  // Seed AI-verified skill demonstration for Suresh
  db.run(`
    INSERT INTO skills_proof (worker_id, trade, task_title, video_name, ai_status, ai_score, checklist_json)
    VALUES (
      2,
      'Plumber',
      'PPR Pipe Fusion Joint & Pressure Testing',
      'suresh_pipe_fusion.mp4',
      'verified',
      94,
      '{"safety_gear": "Heat-resistant gloves verified", "tools_used": "PPR welding kit, pipe cutter, depth gauge", "technique": "Uniform heating duration, bubble-free axial alignment", "testing": "Hydrostatic pressure hold verified with zero bead weepage"}'
    )
  `);

  // Seed Sample Jobs
  const insertJob = db.prepare(`
    INSERT INTO jobs (customer_id, worker_id, title, trade, description, locality, city, radius_km, price_range_min, price_range_max, offered_price, status, customer_confirmed, worker_confirmed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Job 1: In Progress with Ravi
  insertJob.run(
    4,
    1,
    "Main Distribution Box Tripping Issue",
    "Electrician",
    "The 32A MCB trips whenever the kitchen geyser and microwave operate together. Need urgent diagnosis and load redistribution.",
    "Indiranagar, Stage 2",
    "Bengaluru",
    5,
    350,
    600,
    450,
    "in_progress",
    0,
    0
  );

  // Job 2: Open job awaiting quote
  insertJob.run(
    4,
    null,
    "Balcony Drainage Pipeline Blockage",
    "Plumber",
    "Rainwater backflow on the second floor balcony drain pipe. Needs rod cleaning and strainer replacement.",
    "Indiranagar, 100ft Road",
    "Bengaluru",
    6,
    300,
    550,
    null,
    "open",
    0,
    0
  );

  // Job 3: Completed job with mutual reviews
  insertJob.run(
    5,
    1,
    "Office Conference Room Conduit Installation",
    "Electrician",
    "Surface casing capping and 6-port power distribution box install for video conferencing setup.",
    "Koramangala, 5th Block",
    "Bengaluru",
    8,
    800,
    1400,
    1200,
    "completed",
    1,
    1
  );

  // Seed Two-Way Reviews for Job 3
  const insertReview = db.prepare(`
    INSERT INTO reviews (job_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, has_evidence, evidence_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Customer reviewed Worker
  insertReview.run(
    3,
    5,
    1,
    "customer",
    5,
    "Ravi arrived exactly on schedule with proper professional tools. Workmanship is clean and fully tested under heavy load. Highly recommended.",
    1,
    "Work inspection report signed and verified on site."
  );

  // Worker reviewed Customer
  insertReview.run(
    3,
    1,
    5,
    "worker",
    5,
    "Clear instructions, safe work site, and prompt payment upon completion. Very respectful and professional customer.",
    0,
    null
  );
}
