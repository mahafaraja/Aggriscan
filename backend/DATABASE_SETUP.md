# Database Schema & Setup

## Database Structure

### Users Table
Stores farmer, officer, and admin accounts.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| phone_number | String(20) | Unique phone number (e.g., +256700000001) |
| password_hash | String(255) | Bcrypt hashed password |
| role | String(50) | 'farmer', 'officer', or 'admin' |
| sub_county | String(100) | Location in Uganda |
| created_at | DateTime | Account creation timestamp |

**Default Users (Seeded):**
```python
# Farmer
Phone: +256700000001
Password: Password123
Role: farmer
Sub-county: Mukono Town

# Officer
Phone: +256700000002
Password: Password123
Role: officer
Sub-county: Kampala Central

# Admin
Phone: +256700000003
Password: Password123
Role: admin
Sub-county: Victoria University
```

### Reports Table
Stores crop disease scan results.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users (nullable for offline scans) |
| crop_type | String(50) | 'Cassava', 'Banana', 'Bean', 'Coffee', 'Corn', 'Groundnuts', 'Potato', 'Tomato' |
| disease_label | String(100) | Disease name or 'Healthy' |
| confidence_score | Numeric(5,4) | AI confidence (0.0000 - 1.0000) |
| latitude | Numeric(9,6) | GPS latitude |
| longitude | Numeric(9,6) | GPS longitude |
| image_url | String(512) | Optional image path |
| severity | String(50) | 'Low', 'Medium', 'High' |
| offline_created_at | DateTime | When scan was performed |
| server_received_at | DateTime | When synced to server |

## Crop Types Supported
1. **Cassava** - Includes CMD (Cassava Mosaic Disease), CBSD (Brown Streak Disease)
2. **Banana** - Includes BBW (Bacterial Wilt), Panama Disease
3. **Bean** - Various bean diseases
4. **Coffee** - Coffee leaf rust, berry disease
5. **Corn/Maize** - Maize streak virus, blight
6. **Groundnuts/Peanuts** - Groundnut rosette, leaf spot
7. **Potato** - Late blight, early blight
8. **Tomato** - Various tomato diseases

## Disease Severity Levels
- **Low**: Early stage, minimal damage, treatable
- **Medium**: Moderate infection, requires treatment
- **High**: Severe infection, immediate action needed

## Sample Queries

### Get all scans by a user
```sql
SELECT * FROM reports 
WHERE user_id = 'user-uuid-here' 
ORDER BY offline_created_at DESC;
```

### Get disease hotspots
```sql
SELECT crop_type, disease_label, latitude, longitude, COUNT(*) as outbreak_count
FROM reports 
WHERE disease_label != 'Healthy'
GROUP BY crop_type, disease_label, latitude, longitude
HAVING COUNT(*) >= 5;
```

### Get recent scans (last 7 days)
```sql
SELECT * FROM reports 
WHERE offline_created_at >= NOW() - INTERVAL '7 days'
ORDER BY offline_created_at DESC;
```

## Database Connection

### Local Development
```env
DATABASE_URL=postgresql://postgres@127.0.0.1:5001/agriscan
```

### Production (Render)
```env
DATABASE_URL=postgresql://user:pass@host:5432/agriscan
# Automatically provided by Render
```

## Migrations
Tables are auto-created on app startup via SQLAlchemy:
```python
Base.metadata.create_all(bind=engine)
```

## Seeding Default Data
Default users are seeded automatically if database is empty:
```python
# Run on app startup
seed_database()
```

## Backup & Restore

### Backup
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
psql $DATABASE_URL < backup.sql
```

## Indexes
- `users.phone_number` - Unique index for fast login
- `reports.user_id` - For user history queries
- `reports.crop_type` - For filtering by crop
- `reports.disease_label` - For outbreak detection
- `reports.latitude, longitude` - For geospatial queries