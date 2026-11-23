import { db, initDatabase } from "./db";
import { join } from "path";

// Initialize database schema and seeds
initDatabase();

const activeSessions = new Map<string, number>();

function getSessionUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const cookieHeader = req.headers.get("Cookie");
  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (cookieHeader) {
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token || !activeSessions.has(token)) return null;
  const userId = activeSessions.get(token);
  return db.query("SELECT * FROM users WHERE id = ?").get(userId) as any;
}

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

const PRICING_CORRIDORS: Record<string, { min: number; max: number; standard: number }> = {
  Electrician: { min: 300, max: 700, standard: 450 },
  Plumber: { min: 250, max: 650, standard: 400 },
  Carpenter: { min: 350, max: 850, standard: 500 },
  Mason: { min: 400, max: 950, standard: 600 },
  Painter: { min: 300, max: 750, standard: 450 },
};

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Static Assets
    if (path === "/styles.css") {
      const file = Bun.file(join(import.meta.dir, "public", "styles.css"));
      return new Response(file, { headers: { "Content-Type": "text/css; charset=utf-8" } });
    }
    if (path === "/app.js") {
      const file = Bun.file(join(import.meta.dir, "public", "app.js"));
      return new Response(file, { headers: { "Content-Type": "application/javascript; charset=utf-8" } });
    }
    if (path.startsWith("/images/") || path.startsWith("/extracted/")) {
      const filePath = join(import.meta.dir, "public", path);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const mime = path.endsWith(".jpg") || path.endsWith(".jpeg") ? "image/jpeg" : path.endsWith(".png") ? "image/png" : "application/octet-stream";
        return new Response(file, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=86400" } });
      }
    }

    // API Routes are handled below under /api/
    // Any other GET route serves the multi-page Single Page Application shell
    if (!path.startsWith("/api/")) {
      const file = Bun.file(join(import.meta.dir, "public", "index.html"));
      return new Response(file, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // ==========================================
    // API: AUTHENTICATION
    // ==========================================

    // 1. Sign Up
    if (path === "/api/auth/signup" && method === "POST") {
      try {
        const body = await req.json();
        const { phone, name, role, password, trade, city, hourly_rate, bio } = body;

        if (!phone || !name || !role || !password) {
          return jsonResponse({ error: "Phone, name, role, and password are required." }, 400);
        }

        const existing = db.query("SELECT id FROM users WHERE phone = ?").get(phone);
        if (existing) {
          return jsonResponse({ error: "An account with this phone number already exists." }, 400);
        }

        const rate = role === "worker" ? Number(hourly_rate) || 350 : 0;
        const userTrade = role === "worker" ? trade || "Electrician" : null;

        const insert = db.prepare(`
          INSERT INTO users (phone, name, role, password_hash, trade, city, radius_km, hourly_rate, bio, verified, trust_score, jobs_completed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insert.run(
          phone,
          name,
          role,
          password,
          userTrade,
          city || "Bengaluru",
          10,
          rate,
          bio || (role === "worker" ? "Skilled independent professional." : "Homeowner / service client."),
          role === "worker" ? 0 : 1,
          5.0,
          0
        );

        const newUser = db.query("SELECT * FROM users WHERE phone = ?").get(phone) as any;
        const token = crypto.randomUUID();
        activeSessions.set(token, newUser.id);

        return jsonResponse(
          { message: "Registration successful", user: newUser, token },
          201,
          { "Set-Cookie": `session_token=${token}; Path=/; HttpOnly; SameSite=Lax` }
        );
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 2. Login
    if (path === "/api/auth/login" && method === "POST") {
      try {
        const body = await req.json();
        const { phone, password } = body;

        if (!phone || !password) {
          return jsonResponse({ error: "Phone and password are required." }, 400);
        }

        const user = db.query("SELECT * FROM users WHERE phone = ?").get(phone) as any;
        if (!user || user.password_hash !== password) {
          return jsonResponse({ error: "Invalid phone number or password." }, 401);
        }

        const token = crypto.randomUUID();
        activeSessions.set(token, user.id);

        return jsonResponse(
          { message: "Login successful", user, token },
          200,
          { "Set-Cookie": `session_token=${token}; Path=/; HttpOnly; SameSite=Lax` }
        );
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 3. Demo Login (Instant access)
    if (path === "/api/auth/demo-login" && method === "POST") {
      try {
        const body = await req.json();
        const { phone } = body;

        if (!phone) {
          return jsonResponse({ error: "Demo phone parameter missing." }, 400);
        }

        const user = db.query("SELECT * FROM users WHERE phone = ?").get(phone) as any;
        if (!user) {
          return jsonResponse({ error: "Demo user account not found in database." }, 404);
        }

        const token = crypto.randomUUID();
        activeSessions.set(token, user.id);

        return jsonResponse(
          { message: "Demo authentication successful", user, token },
          200,
          { "Set-Cookie": `session_token=${token}; Path=/; HttpOnly; SameSite=Lax` }
        );
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 4. Forgot Password - Request OTP / Code
    if (path === "/api/auth/forgot-password/request" && method === "POST") {
      try {
        const body = await req.json();
        const { phone } = body;

        if (!phone) {
          return jsonResponse({ error: "Phone number is required." }, 400);
        }

        const user = db.query("SELECT id, name FROM users WHERE phone = ?").get(phone) as any;
        if (!user) {
          return jsonResponse({ error: "No account found with this registered phone number." }, 404);
        }

        // Generate a 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

        db.run(
          "INSERT INTO password_resets (phone, reset_code, expires_at, used) VALUES (?, ?, ?, 0)",
          [phone, code, expiresAt]
        );

        return jsonResponse({
          message: "Verification code sent to registered phone number.",
          phone,
          demo_code: code, // Provided directly for immediate testing without external SMS gateway
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 5. Forgot Password - Reset with Code
    if (path === "/api/auth/forgot-password/reset" && method === "POST") {
      try {
        const body = await req.json();
        const { phone, code, new_password } = body;

        if (!phone || !code || !new_password) {
          return jsonResponse({ error: "Phone, code, and new password are required." }, 400);
        }

        const resetRecord = db.query(
          "SELECT * FROM password_resets WHERE phone = ? AND reset_code = ? AND used = 0 ORDER BY id DESC LIMIT 1"
        ).get(phone, code) as any;

        if (!resetRecord) {
          return jsonResponse({ error: "Invalid or already used verification code." }, 400);
        }

        if (Date.now() > resetRecord.expires_at) {
          return jsonResponse({ error: "Verification code has expired. Please request a new one." }, 400);
        }

        // Update password and mark code used
        db.run("UPDATE users SET password_hash = ? WHERE phone = ?", [new_password, phone]);
        db.run("UPDATE password_resets SET used = 1 WHERE id = ?", [resetRecord.id]);

        return jsonResponse({ message: "Password updated successfully. You can now login with your new password." });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 6. Current User Session
    if (path === "/api/auth/me" && method === "GET") {
      const user = getSessionUser(req);
      if (!user) return jsonResponse({ user: null });
      return jsonResponse({ user });
    }

    // 7. Logout
    if (path === "/api/auth/logout" && method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        activeSessions.delete(authHeader.substring(7));
      }
      return jsonResponse(
        { message: "Logged out" },
        200,
        { "Set-Cookie": "session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT" }
      );
    }

    // ==========================================
    // API: PRICING CORRIDOR
    // ==========================================
    if (path === "/api/pricing-corridor" && method === "GET") {
      return jsonResponse(PRICING_CORRIDORS);
    }

    // ==========================================
    // API: WORKERS & VERIFIED SKILLS
    // ==========================================

    // List workers with filter
    if (path === "/api/workers" && method === "GET") {
      const trade = url.searchParams.get("trade");
      const maxRadius = Number(url.searchParams.get("radius")) || 15;

      let query = "SELECT id, name, role, trade, city, radius_km, hourly_rate, bio, verified, trust_score, jobs_completed, created_at FROM users WHERE role = 'worker'";
      const params: any[] = [];

      if (trade && trade !== "All") {
        query += " AND trade = ?";
        params.push(trade);
      }

      query += " AND radius_km <= ? ORDER BY trust_score DESC, jobs_completed DESC";
      params.push(maxRadius);

      const workers = db.query(query).all(...params) as any[];

      // Attach skills proof to each worker
      const workersWithProofs = workers.map((w) => {
        const proofs = db.query("SELECT * FROM skills_proof WHERE worker_id = ?").all(w.id);
        const reviews = db.query("SELECT r.*, u.name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewee_id = ? ORDER BY r.id DESC LIMIT 3").all(w.id);
        return { ...w, proofs, recent_reviews: reviews };
      });

      return jsonResponse(workersWithProofs);
    }

    // Worker details
    if (path.startsWith("/api/workers/") && method === "GET") {
      const workerId = Number(path.split("/")[3]);
      const worker = db.query("SELECT id, name, role, trade, city, radius_km, hourly_rate, bio, verified, trust_score, jobs_completed, created_at FROM users WHERE id = ? AND role = 'worker'").get(workerId) as any;

      if (!worker) return jsonResponse({ error: "Worker not found" }, 404);

      const proofs = db.query("SELECT * FROM skills_proof WHERE worker_id = ?").all(workerId);
      const reviews = db.query("SELECT r.*, u.name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewee_id = ? ORDER BY r.id DESC").all(workerId);

      return jsonResponse({ ...worker, proofs, reviews });
    }

    // AI Skill Verification Submission (Simulating Amazon Bedrock analysis rubric)
    if (path === "/api/workers/verify-skill" && method === "POST") {
      const user = getSessionUser(req);
      if (!user || user.role !== "worker") {
        return jsonResponse({ error: "Unauthorized. Worker login required." }, 401);
      }

      const body = await req.json();
      const { trade, task_title, video_name } = body;

      const rubrics: Record<string, any> = {
        Electrician: {
          score: 95,
          checklist: {
            safety_gear: "Verified: High-voltage insulated safety gloves and non-conductive shoes detected",
            tools_used: "Verified: Calibrated digital multimeter, wire stripper, torque screwdriver",
            technique: "Verified: Correct cable gauge handling, phase/neutral polarity check passed",
            testing: "Verified: Live load continuity test within nominal 230V (+/- 5%) range",
          },
        },
        Plumber: {
          score: 93,
          checklist: {
            safety_gear: "Verified: Heat-resistant work gloves and anti-slip protective footwear",
            tools_used: "Verified: PPR pipe fusion tool, deburring cutter, hydrostatic pressure gauge",
            technique: "Verified: Uniform circular bead alignment and correct heating dwell time",
            testing: "Verified: 10-bar hydrostatic pressure test held with zero leakage",
          },
        },
        Carpenter: {
          score: 91,
          checklist: {
            safety_gear: "Verified: Eye protection goggles and dust respirator in place",
            tools_used: "Verified: Precision mortise gauge, chisel set, level meter",
            technique: "Verified: Clean 90-degree miter joints with smooth edge routing",
            testing: "Verified: Structural weight load test passed with zero joint deflection",
          },
        },
        default: {
          score: 90,
          checklist: {
            safety_gear: "Verified: Personal protective equipment guidelines met",
            tools_used: "Verified: Appropriate trade tools recognized in video stream",
            technique: "Verified: Standard operational sequence executed according to trade rubric",
            testing: "Verified: Workmanship completion verified against evaluation criteria",
          },
        },
      };

      const selectedRubric = rubrics[trade || user.trade] || rubrics.default;

      // Insert skill proof
      db.run(
        `INSERT INTO skills_proof (worker_id, trade, task_title, video_name, ai_status, ai_score, checklist_json)
         VALUES (?, ?, ?, ?, 'verified', ?, ?)`,
        [
          user.id,
          trade || user.trade || "Electrician",
          task_title || "Practical Standard Demonstration",
          video_name || "worker_task_demo.mp4",
          selectedRubric.score,
          JSON.stringify(selectedRubric.checklist),
        ]
      );

      // Upgrade worker status to verified and adjust trust score
      db.run(
        "UPDATE users SET verified = 1, trust_score = ROUND(MIN(5.0, trust_score + 0.2), 1) WHERE id = ?",
        [user.id]
      );

      return jsonResponse({
        message: "Skill demonstration successfully analyzed and verified by AI checklist engine.",
        verified: true,
        ai_score: selectedRubric.score,
        checklist: selectedRubric.checklist,
      });
    }

    // Update worker profile
    if (path === "/api/workers/profile" && method === "PUT") {
      const user = getSessionUser(req);
      if (!user || user.role !== "worker") {
        return jsonResponse({ error: "Unauthorized. Worker login required." }, 401);
      }

      const body = await req.json();
      const { hourly_rate, radius_km, bio, trade } = body;

      db.run(
        "UPDATE users SET hourly_rate = ?, radius_km = ?, bio = ?, trade = ? WHERE id = ?",
        [
          Number(hourly_rate) || user.hourly_rate,
          Number(radius_km) || user.radius_km,
          bio !== undefined ? bio : user.bio,
          trade || user.trade,
          user.id,
        ]
      );

      const updated = db.query("SELECT * FROM users WHERE id = ?").get(user.id);
      return jsonResponse({ message: "Profile updated successfully", user: updated });
    }

    // ==========================================
    // API: JOBS
    // ==========================================

    // Get Jobs
    if (path === "/api/jobs" && method === "GET") {
      const user = getSessionUser(req);
      const filter = url.searchParams.get("filter"); // 'all', 'mine', 'open'

      let query = `
        SELECT j.*, 
               c.name as customer_name, c.phone as customer_phone,
               w.name as worker_name, w.phone as worker_phone
        FROM jobs j
        JOIN users c ON j.customer_id = c.id
        LEFT JOIN users w ON j.worker_id = w.id
      `;

      const params: any[] = [];

      if (user) {
        if (user.role === "customer" && filter === "mine") {
          query += " WHERE j.customer_id = ?";
          params.push(user.id);
        } else if (user.role === "worker") {
          if (filter === "mine") {
            query += " WHERE j.worker_id = ?";
            params.push(user.id);
          } else {
            // Worker sees jobs matching their trade and status open/in_progress
            query += " WHERE (j.status = 'open' AND (j.trade = ? OR ? = 'All')) OR j.worker_id = ?";
            params.push(user.trade || "Electrician", user.trade || "Electrician", user.id);
          }
        }
      }

      query += " ORDER BY j.id DESC";
      const jobs = db.query(query).all(...params);
      return jsonResponse(jobs);
    }

    // Create Job (Customer posts job)
    if (path === "/api/jobs" && method === "POST") {
      const user = getSessionUser(req);
      if (!user || user.role !== "customer") {
        return jsonResponse({ error: "Unauthorized. Customer account required to post a job." }, 401);
      }

      const body = await req.json();
      const { title, trade, description, locality, radius_km, price_range_min, price_range_max } = body;

      if (!title || !trade || !description || !locality) {
        return jsonResponse({ error: "Title, trade, description, and locality are required." }, 400);
      }

      const minP = Number(price_range_min) || 300;
      const maxP = Number(price_range_max) || 600;

      const insert = db.prepare(`
        INSERT INTO jobs (customer_id, title, trade, description, locality, city, radius_km, price_range_min, price_range_max, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
      `);

      insert.run(user.id, title, trade, description, locality, user.city || "Bengaluru", Number(radius_km) || 10, minP, maxP);

      return jsonResponse({ message: "Job posted successfully within location radius circle." }, 201);
    }

    // Worker Quotes / Accepts Job
    if (path.match(/^\/api\/jobs\/\d+\/quote$/) && method === "POST") {
      const user = getSessionUser(req);
      if (!user || user.role !== "worker") {
        return jsonResponse({ error: "Unauthorized. Worker login required." }, 401);
      }

      const jobId = Number(path.split("/")[3]);
      const body = await req.json();
      const { offered_price } = body;

      const job = db.query("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
      if (!job) return jsonResponse({ error: "Job not found" }, 404);
      if (job.status !== "open" && job.status !== "quoted") {
        return jsonResponse({ error: "Job is already assigned or closed." }, 400);
      }

      const price = Number(offered_price) || job.price_range_min;

      db.run(
        "UPDATE jobs SET worker_id = ?, offered_price = ?, status = 'quoted' WHERE id = ?",
        [user.id, price, jobId]
      );

      return jsonResponse({ message: "Quote submitted successfully.", offered_price: price });
    }

    // Customer Accepts Worker Quote
    if (path.match(/^\/api\/jobs\/\d+\/accept-quote$/) && method === "POST") {
      const user = getSessionUser(req);
      if (!user || user.role !== "customer") {
        return jsonResponse({ error: "Unauthorized. Customer account required." }, 401);
      }

      const jobId = Number(path.split("/")[3]);
      const job = db.query("SELECT * FROM jobs WHERE id = ? AND customer_id = ?").get(jobId, user.id) as any;
      if (!job) return jsonResponse({ error: "Job not found or access denied." }, 404);

      db.run("UPDATE jobs SET status = 'in_progress' WHERE id = ?", [jobId]);

      return jsonResponse({ message: "Quote accepted. Work is now in progress." });
    }

    // Confirm Completion (Two-way mutual confirmation)
    if (path.match(/^\/api\/jobs\/\d+\/confirm$/) && method === "POST") {
      const user = getSessionUser(req);
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

      const jobId = Number(path.split("/")[3]);
      const job = db.query("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
      if (!job) return jsonResponse({ error: "Job not found" }, 404);

      if (user.id !== job.customer_id && user.id !== job.worker_id) {
        return jsonResponse({ error: "You are not a participant in this job." }, 403);
      }

      let customerConfirmed = job.customer_confirmed;
      let workerConfirmed = job.worker_confirmed;

      if (user.id === job.customer_id) customerConfirmed = 1;
      if (user.id === job.worker_id) workerConfirmed = 1;

      const isBothConfirmed = customerConfirmed === 1 && workerConfirmed === 1;
      const newStatus = isBothConfirmed ? "completed" : "in_progress";

      db.run(
        "UPDATE jobs SET customer_confirmed = ?, worker_confirmed = ?, status = ? WHERE id = ?",
        [customerConfirmed, workerConfirmed, newStatus, jobId]
      );

      if (isBothConfirmed && job.status !== "completed") {
        // Increment jobs_completed count for worker and customer
        if (job.worker_id) {
          db.run("UPDATE users SET jobs_completed = jobs_completed + 1 WHERE id = ?", [job.worker_id]);
        }
        db.run("UPDATE users SET jobs_completed = jobs_completed + 1 WHERE id = ?", [job.customer_id]);
      }

      return jsonResponse({
        message: isBothConfirmed ? "Job completed and confirmed by both parties." : "Your confirmation is recorded. Awaiting counterparty confirmation.",
        customer_confirmed: customerConfirmed,
        worker_confirmed: workerConfirmed,
        status: newStatus,
      });
    }

    // ==========================================
    // API: TWO-WAY REVIEWS
    // ==========================================
    if (path === "/api/reviews" && method === "POST") {
      const user = getSessionUser(req);
      if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

      const body = await req.json();
      const { job_id, rating, comment, has_evidence, evidence_note } = body;

      const job = db.query("SELECT * FROM jobs WHERE id = ?").get(job_id) as any;
      if (!job) return jsonResponse({ error: "Job record not found" }, 404);

      const isCustomer = user.id === job.customer_id;
      const isWorker = user.id === job.worker_id;

      if (!isCustomer && !isWorker) {
        return jsonResponse({ error: "You must be a verified participant of this job to submit a review." }, 403);
      }

      const revieweeId = isCustomer ? job.worker_id : job.customer_id;
      if (!revieweeId) {
        return jsonResponse({ error: "Counterparty not found on this job." }, 400);
      }

      // Check if already reviewed
      const existing = db.query("SELECT id FROM reviews WHERE job_id = ? AND reviewer_id = ?").get(job_id, user.id);
      if (existing) {
        return jsonResponse({ error: "You have already submitted a review for this job." }, 400);
      }

      db.run(
        `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, has_evidence, evidence_note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          job_id,
          user.id,
          revieweeId,
          user.role,
          Math.min(5, Math.max(1, Number(rating) || 5)),
          comment || "Work concluded according to mutual terms.",
          has_evidence ? 1 : 0,
          evidence_note || null,
        ]
      );

      // Recalculate reviewee average trust score
      const stats = db.query(
        "SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewee_id = ?"
      ).get(revieweeId) as any;

      if (stats && stats.count > 0) {
        db.run("UPDATE users SET trust_score = ROUND(?, 1) WHERE id = ?", [stats.avg_rating, revieweeId]);
      }

      return jsonResponse({ message: "Two-way verified review recorded successfully." }, 201);
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  },
});

console.log(`SkillSetu server running at http://localhost:${server.port}`);
