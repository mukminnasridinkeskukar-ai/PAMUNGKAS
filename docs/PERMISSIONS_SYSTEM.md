# PAMUNGKAS - Permission System Documentation

## 📋 Overview

Permission system PAMUNGKAS mengimplementasikan **Role-Based Access Control (RBAC)** dengan **granular permissions**. Sistem ini memastikan keamanan data di level database (PostgreSQL RLS) sambil menyediakan UI yang dinamis di frontend.

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (UI)                          │
│  permissions.js: hasPermission(), hasRole(), etc.           │
│  - Untuk menampilkan/sembunyikan menu                       │
│  - Untuk enable/disable tombol                              │
│  - BUKAN untuk security!                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (PostgreSQL)                      │
│  RLS Policies: Keamanan SEBENARNYA                           │
│  - Filter data otomatis berdasarkan role                    │
│  - Enforce akses per unit kerja                             │
│  Tidak bisa di-bypass dari frontend                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model

### Tabel Utama

```
auth.users (Supabase Auth)
    ↓ 1:1
profiles (Data user lengkap)
    ↓ N:1 via user_roles
roles (Definisi role)
    ↓ N:N via role_permissions
permissions (Definisi permission granular)
```

---

## 🔐 6 Role Levels

| # | Role | Level | Deskripsi | Akses Utama |
|---|------|-------|-----------|-------------|
| 1 | SUPER_ADMIN | 1 | Super Administrator | **Semua permission** (full access) |
| 2 | ADMIN | 2 | Administrator | Operasional organisasi + user management |
| 3 | VERIFIKATOR | 3 | Verifikator | Verifikasi data SDM, kompetensi, sertifikat |
| 4 | PENGELOLA_SDMK | 4 | Pengelola SDM Kesehatan | Kelola data SDM & kompetensi |
| 5 | OPERATOR | 5 | Operator | Input data unit sendiri saja |
| 6 | PIMPINAN | 6 | Pimpinan | Dashboard & laporan (read-only) |

---

## 📝 Daftar Permissions (50+)

Format: `module.action`

**Modules:**
- **dashboard** - view, access
- **sdmk** - view, create, update, delete, verify, export, import
- **competency** - view, create, update, delete, verify
- **activity** - view, create, update, delete, approve
- **participant** - view, create, update, delete
- **certificate** - view, create, update, verify
- **report** - view, export, custom
- **user** - view, create, update, delete, manage_roles, manage_permissions, activate_deactivate
- **settings** - view, manage, master_data
- **organization** - view, manage
- **audit_log** - view, export

---

## 💻 Frontend Usage Examples

```javascript
// Load permissions
await ensurePermissionsLoaded();

// Check permission
if (await hasPermission('sdmk.create')) {
    showCreateButton();
}

// Check role
if (await hasRole('SUPER_ADMIN')) {
    showAdminPanel();
}

// Get user info
const user = await getCurrentUser();
const profile = await getCurrentProfile();
const roles = await getUserRoles();
const perms = await getUserPermissions();

// Dynamic sidebar
await updateSidebarWithPermissions();
```

---

## 📁 File Structure

### SQL Files (supabase/sql/)
1. `07_permissions_schema.sql` - Permissions & role_permissions tables
2. `08_role_permissions_seed.sql` - Seed data mapping
3. `09_rls_permissions.sql` - RLS policies

### JavaScript Files (assets/js/)
- `permissions.js` - Permission management module (**NEW**)

---

## ⚠️ Security Notes

✅ **DO:**
- RLS sebagai security utama
- Frontend permission untuk UX saja
- Validasi di backend/RLS

❌ **DON'T:**
- Percaya JavaScript untuk security
- Hardcode role check tanpa RLS
- Taruh service_role key di frontend

---

**Version**: 1.2.0-permissions  
**Status**: ✅ Ready for Testing
