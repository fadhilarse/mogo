import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import postgres from 'postgres';
import cron from 'node-cron';

// Koneksi ke PostgreSQL pakai password lu: 25desember
const sql = postgres('postgres://postgres:25desember@localhost:5432/mogo_db');

const initDB = async () => {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date DATE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE`;
    
    // FITUR BARU: Nyawa & Status Panen
    await sql`ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS health INT DEFAULT 100`;
    await sql`ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS is_harvested BOOLEAN DEFAULT FALSE`;
    
    console.log("Database schema updated dengan fitur Nyawa, Panen, Foto Profil & Banner!");
  } catch (err) {
    console.error("Info DB Setup:", err);
  }
};
initDB();

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({ assets: 'public', prefix: '/public' })) 
  
  // ==================== AUTH ====================
  .post('/api/register', async ({ body }) => {
    let { name, email, password } = body as { name?: string; email?: string; password?: string };
    name = name?.trim(); email = email?.trim(); password = password?.trim();
    if (!name || !email || !password) return { status: 'error', message: 'Lengkapi data!' };
    try {
      const [existingUser] = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existingUser) return { status: 'error', message: 'Email sudah terdaftar!' };
      const [newUser] = await sql`INSERT INTO users (name, level, streak, email, password) VALUES (${name}, 'Petani Pemula 🐣', 0, ${email}, ${password}) RETURNING *`;
      return { status: 'success', message: 'Pendaftaran berhasil!', data: newUser };
    } catch (err: any) { return { status: 'error', message: err.message }; }
  })
  .post('/api/login', async ({ body }) => {
    let { email, password } = body as { email?: string; password?: string };
    if (!email || !password) return { status: 'error', message: 'Lengkapi data!' };
    try {
      const [user] = await sql`SELECT * FROM users WHERE email = ${email} AND password = ${password}`;
      if (!user) return { status: 'error', message: 'Email/Password salah.' };
      return { status: 'success', message: 'Login berhasil!', data: user };
    } catch (err: any) { return { status: 'error', message: err.message }; }
  })

  // ==================== UPLOAD FOTO PROFIL ====================
  .post('/api/upload', async ({ body }) => {
    const { image } = body as { image?: File };
    if (!image) return { status: 'error', message: 'Tidak ada file gambar yang diunggah!' };

    try {
      const fileExtension = image.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      const path = `./public/uploads/${fileName}`;
      
      await Bun.write(path, image);
      
      const fileUrl = `http://localhost:3000/public/uploads/${fileName}`;
      return { status: 'success', message: 'Foto berhasil diunggah!', url: fileUrl };
    } catch (err: any) {
      return { status: 'error', message: 'Gagal mengunggah file: ' + err.message };
    }
  })
  
  // ==================== READ: DASHBOARD DATA ====================
  .get('/api/dashboard/:userId', async ({ params }) => {
    const { userId } = params;
    try {
      const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
      if (!user) return { status: 'error', message: 'User tidak ditemukan' };

      const plants = await sql`SELECT *, ROUND((current_day::decimal / target_days::decimal) * 100) as progress_percent FROM user_plants WHERE user_id = ${userId} AND is_harvested = FALSE ORDER BY id ASC`;
      const trophies = await sql`SELECT * FROM user_plants WHERE user_id = ${userId} AND is_harvested = TRUE ORDER BY id DESC`;
      const tasks = await sql`SELECT * FROM daily_tasks WHERE user_id = ${userId} ORDER BY id ASC`;

      return { status: 'success', data: { user, plants, trophies, tasks } };
    } catch (err: any) { return { status: 'error', message: err.message }; }
  })

  // ==================== UPDATE: EDIT PROFIL ====================
  .patch('/api/users/:userId', async ({ params, body }) => {
    const { userId } = params;
    const { name, email, photo_url, banner_url } = body as { name?: string; email?: string; photo_url?: string; banner_url?: string };
    
    if (!name || !email) return { status: 'error', message: 'Nama dan Email tidak boleh kosong!' };
    
    try {
      const [emailCheck] = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${userId}`;
      if (emailCheck) return { status: 'error', message: 'Email sudah terdaftar oleh pengguna lain!' };

      const [updatedUser] = await sql`
        UPDATE users 
        SET 
          name = ${name}, 
          email = ${email},
          photo_url = COALESCE(${photo_url || null}, photo_url),
          banner_url = COALESCE(${banner_url || null}, banner_url) 
        WHERE id = ${userId} 
        RETURNING *
      `;
      
      await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${userId}, '✏️ Memperbarui profil akun')`;

      return { status: 'success', message: 'Profil berhasil diperbarui!', data: updatedUser };
    } catch (err: any) { 
      return { status: 'error', message: err.message }; 
    }
  })

  // ==================== UPDATE: PASSWORD ====================
  .patch('/api/users/:userId/password', async ({ params, body }) => {
    const { userId } = params;
    const { oldPassword, newPassword } = body as { oldPassword?: string; newPassword?: string };

    // Validasi ini wajib ada supaya TypeScript tahu newPassword bukan 'undefined'
    if (!oldPassword || !newPassword) {
        return { status: 'error', message: 'Password lama dan baru tidak boleh kosong!' };
    }

    try {
      const [user] = await sql`SELECT password FROM users WHERE id = ${userId}`;
      if (!user) return { status: 'error', message: 'User tidak ditemukan' };
      if (user.password !== oldPassword) return { status: 'error', message: 'Password lama salah!' };

      await sql`UPDATE users SET password = ${newPassword} WHERE id = ${userId}`;
      await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${userId}, '🔒 Berhasil memperbarui kata sandi keamanan')`;

      return { status: 'success', message: 'Password berhasil diubah!' };
    } catch (err: any) {
      return { status: 'error', message: err.message };
    }
  })

  // ==================== DELETE: HAPUS AKUN ====================
  .delete('/api/users/:userId', async ({ params }) => {
    const { userId } = params;
    try {
      // Hapus data berelasi dulu
      await sql`DELETE FROM daily_tasks WHERE user_id = ${userId}`;
      await sql`DELETE FROM user_plants WHERE user_id = ${userId}`;
      await sql`DELETE FROM activity_logs WHERE user_id = ${userId}`;
      // Hapus user utama
      await sql`DELETE FROM users WHERE id = ${userId}`;
      
      return { status: 'success', message: 'Akun berhasil dihapus permanen' };
    } catch (err: any) { 
      return { status: 'error', message: err.message }; 
    }
  })
  
  // ==================== CREATE: TAMBAH TANAMAN ====================
  .post('/api/plants', async ({ body }) => {
    const { user_id, name, variety, location_type, target_days } = body as { user_id: number; name: string; variety?: string; location_type?: string; target_days?: number };
    try {
      const [newPlant] = await sql`
        INSERT INTO user_plants (user_id, name, variety, location_type, current_day, target_days, status_phase, health, is_harvested)
        VALUES (${user_id}, ${name}, ${variety || 'Rekomendasi AI'}, ${location_type || 'Pot / Hidroponik'}, 1, ${target_days || 30}, 'Fase Penyemaian', 100, FALSE)
        RETURNING *
      `;
      await sql`
        INSERT INTO daily_tasks (user_id, plant_id, task_text, is_completed) VALUES
        (${user_id}, ${newPlant.id}, ${`🌱 Hari 1: Semai benih ${name} pada media dan beri lubang dangkal`}, FALSE),
        (${user_id}, ${newPlant.id}, ${`💧 Siram ${name} perlahan dengan sistem spray agar benih tidak hanyut`}, FALSE)
      `;
      return { status: 'success', message: 'Tanaman ditambahkan!', data: newPlant };
    } catch (err: any) { return { status: 'error', message: err.message }; }
  })
  
  // ==================== DELETE: HAPUS TANAMAN ====================
  .delete('/api/plants/:plantId', async ({ params }) => {
    const { plantId } = params;
    try {
      await sql`DELETE FROM daily_tasks WHERE plant_id = ${plantId}`;
      await sql`DELETE FROM user_plants WHERE id = ${plantId}`;
      return { status: 'success', message: 'Tanaman dihapus' };
    } catch (err: any) { return { status: 'error', message: err.message }; }
  })

  // ==================== FITUR BARU: PANEN TANAMAN ====================
  .patch('/api/plants/:plantId/harvest', async ({ params, body }) => {
    const { plantId } = params;
    const { user_id } = body as { user_id: number };
    try {
      const [harvested] = await sql`UPDATE user_plants SET is_harvested = TRUE WHERE id = ${plantId} RETURNING name`;
      await sql`DELETE FROM daily_tasks WHERE plant_id = ${plantId}`;
      await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${user_id}, ${'🌾 YAY! Berhasil memanen ' + harvested.name})`;
      return { status: 'success', message: 'Tanaman berhasil dipanen!' };
    } catch (err: any) { return { status: 'error', message: err.message }; }
  })

  // ==================== AI PREDICT ====================
  .post('/api/predict', async ({ body }) => {
    try {
      const inputData = JSON.stringify(body);
      const proc = Bun.spawn(["./env/Scripts/python.exe", "predict.py", inputData], { cwd: "../ai" });
      const output = await new Response(proc.stdout).text();
      return JSON.parse(output);
    } catch (error) { return { status: "error", message: "AI Engine error" }; }
  })
  
  // ==================== UPDATE: CENTANG MISI ====================
  .patch('/api/tasks/:taskId/complete', async ({ params, body }) => {
    const { taskId } = params;
    const { user_id } = body as { user_id: number };
    try {
      const [updatedTask] = await sql`UPDATE daily_tasks SET is_completed = TRUE WHERE id = ${taskId} RETURNING *`;
      if (updatedTask) {
         await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${user_id}, ${'✅ Selesai: ' + updatedTask.task_text})`;
         const [user] = await sql`SELECT last_active_date, level FROM users WHERE id = ${user_id}`;
         const todayStr = new Date().toISOString().split('T')[0];
         const lastActiveStr = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;
         
         if (lastActiveStr !== todayStr) {
            await sql`UPDATE users SET streak = COALESCE(streak, 0) + 1, last_active_date = CURRENT_DATE, is_frozen = FALSE WHERE id = ${user_id}`;
            await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${user_id}, '🔥 Daily Streak bertambah!')`;
            
            await sql`UPDATE user_plants SET health = LEAST(health + 10, 100) WHERE user_id = ${user_id} AND is_harvested = FALSE AND health > 0`;
         }

         const [completedTasks] = await sql`SELECT COUNT(*) as total FROM daily_tasks WHERE user_id = ${user_id} AND is_completed = TRUE`;
         const totalMisi = Number(completedTasks.total);

         let newLevel = 'Petani Pemula 🐣';
         if (totalMisi >= 50) newLevel = 'Master Agrikultur 👑';
         else if (totalMisi >= 25) newLevel = 'Petani Ahli 🎖️';
         else if (totalMisi >= 10) newLevel = 'Petani Terampil 🏅';
         else if (totalMisi >= 5) newLevel = 'Petani Berkembang 🌱';

         if (user.level !== newLevel) {
            await sql`UPDATE users SET level = ${newLevel} WHERE id = ${user_id}`;
            await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${user_id}, ${'🎉 Selamat! Gelar milikmu naik menjadi ' + newLevel})`;
         }
      }
      return { status: 'success', message: 'Misi selesai!' };
    } catch (err: any) { return { status: 'error', message: err.message }; }
  })
  
  // ==================== READ: AMBIL LOG REPORT ====================
  .get('/api/logs/:userId', async ({ params }) => {
     try {
        const logs = await sql`SELECT * FROM activity_logs WHERE user_id = ${params.userId} ORDER BY created_at DESC LIMIT 30`;
        return { status: 'success', data: logs };
     } catch (err: any) { return { status: 'error', message: err.message }; }
  })
  .listen(3000);

console.log(`🚀 MOGO Backend active at ${app.server?.hostname}:${app.server?.port}`);

// =========================================================================
// CRON JOB: ROADMAP AGRONOMI BERBASIS FASE & DATASET AI
// =========================================================================

cron.schedule('0 0 * * *', async () => {
  console.log("Menjalankan Cron Job MOGO (Agronomy Roadmap)...");
  try {
    const users = await sql`SELECT id, is_frozen, last_active_date FROM users`;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    for (const user of users) {
      const lastActiveStr = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;
      
      // CEK PENALTI
      if (lastActiveStr !== yesterdayStr && lastActiveStr !== todayStr) {
        if (user.is_frozen) {
           await sql`UPDATE users SET streak = 0 WHERE id = ${user.id}`;
           await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${user.id}, '💔 Streak hangus kembali ke 0.')`;
        } else {
           await sql`UPDATE users SET is_frozen = TRUE WHERE id = ${user.id}`;
           await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${user.id}, '🧊 Streak dibekukan.')`;
        }
        await sql`UPDATE user_plants SET health = GREATEST(health - 25, 0) WHERE user_id = ${user.id} AND is_harvested = FALSE`;
        await sql`INSERT INTO activity_logs (user_id, action_text) VALUES (${user.id}, '🥀 Beberapa tanamanmu layu karena tidak dirawat.')`;
      }

      await sql`DELETE FROM daily_tasks WHERE user_id = ${user.id}`;
      
      // TAMBAH UMUR TANAMAN
      const plants = await sql`UPDATE user_plants SET current_day = current_day + 1 WHERE user_id = ${user.id} AND is_harvested = FALSE AND health > 0 RETURNING *`;
      
      for (const plant of plants) {
        const currentDay = plant.current_day;
        let newTasks = [];

        // 1. TARIK DATA DARI DATASET AI
        let plantParams = null;
        try {
           const aiRes = await fetch('http://localhost:3000/api/predict', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ tanaman: plant.name })
           });
           const aiData = await aiRes.json();
           if (aiData.status === 'success') {
               plantParams = aiData.parameter_ideal;
           }
        } catch(e) {
           console.error("Gagal narik data AI buat Cron:", e);
        }

        const pupuk = plantParams?.pupuk || "Nutrisi AB Mix standar";
        const penyiraman = plantParams?.penyiraman || "Siram secukupnya 2x sehari";
        const sinar = plantParams?.sinar_matahari || "Sinar matahari 4-6 jam";
        const suhu = plantParams?.suhu || "Suhu ideal ruang";
        const tips = plantParams?.tips || "Perhatikan kelembapan media tanam";

        // 2. ROADMAP MISI BERDASARKAN FASE
        if (currentDay === 2 || currentDay === 3) {
            newTasks.push(`🔍 Cek Perkecambahan: Pastikan media tetap lembap & suhu di kisaran ${suhu}`);
        } else if (currentDay === 4) {
            newTasks.push(`🌤️ Pencahayaan Awal: Kenalkan ${plant.name} ke sinar matahari pagi (${sinar}) secara bertahap`);
        } else if (currentDay === 7) {
            newTasks.push(`🧪 Pemberian Nutrisi Pertama: Berikan pupuk awal (${pupuk}) dosis ringan`);
        } else if (currentDay === 10 || currentDay === 15) {
            newTasks.push(`🔄 Rotasi Pot: Putar posisi pot ${plant.name} 180° agar batang lurus & cahaya merata`);
        } else if (currentDay === 14) {
            newTasks.push(`📸 Jurnal Foto: Dokumentasikan laju pertumbuhan tinggi dan lebar kanopi ${plant.name}`);
        } else if (currentDay === 18) {
            newTasks.push(`🧹 Sanitasi Lahan: Bersihkan area sekitar media dari lumut atau gulma liar`);
        } else if (currentDay === 21) {
            newTasks.push(`✂️ Pruning Pemeliharaan: Gunting daun tua di bagian bawah agar nutrisi fokus ke pucuk`);
        } else if (currentDay === 24) {
            newTasks.push(`💡 Tips Ahli MOGO: ${tips}`);
        } else if (currentDay >= 26) {
            newTasks.push(`🔍 Inspeksi Akhir: Pastikan tidak ada hama/penyakit menjelang masa panen ${plant.name}`);
        }

        // 3. MISI RUTIN HARIAN
        const dailyMissions = [
          `💧 Panduan Penyiraman: Lakukan ${penyiraman}`,
          `🌡️ Cek Lingkungan: Pertahankan suhu di kisaran ${suhu}`,
          `🐛 Cek Hama: Periksa bagian bawah daun ${plant.name} dari kutu atau hama`,
          `☀️ Cek Cahaya: Pastikan paparan ${sinar} tercukupi`
        ];

        newTasks.push(dailyMissions[currentDay % dailyMissions.length]);
        newTasks.push(dailyMissions[(currentDay + 1) % dailyMissions.length]);

        // 4. INSERT SEMUA MISI KE DATABASE
        for (const taskMsg of newTasks) {
          await sql`INSERT INTO daily_tasks (user_id, plant_id, task_text, is_completed) VALUES (${user.id}, ${plant.id}, ${taskMsg}, FALSE)`;
        }
      }
    }
    
    console.log("Cron Job Roadmap Agronomi selesai!");
  } catch (error) { console.error("Cron Job Error:", error); }
});