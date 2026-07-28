-- Enable PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop tables if they exist (for clean runs)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'officer', 'admin')),
    sub_county VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Reports Table with WGS84 Spatial Coordinates
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    crop_type VARCHAR(50) NOT NULL,
    disease_label VARCHAR(100) NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    image_url VARCHAR(512),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')),
    offline_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    server_received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index using latitude/longitude for geographic querying
CREATE INDEX idx_reports_latitude ON reports (latitude);
CREATE INDEX idx_reports_longitude ON reports (longitude);
CREATE INDEX idx_reports_crop_disease ON reports (crop_type, disease_label);

-- Seed Default Test Accounts:
-- Password for all seed users is 'Password123' (bcrypt hash: $2b$12$6K8VjR10Z4Tz7Yf2vX/Yxea/p1C54vEpx533WbJp4wBvP7bW0y6G2)
INSERT INTO users (phone_number, password_hash, role, sub_county) VALUES
('+256700000001', '$2b$12$6K8VjR10Z4Tz7Yf2vX/Yxea/p1C54vEpx533WbJp4wBvP7bW0y6G2', 'farmer', 'Mukono Town'),
('+256700000002', '$2b$12$6K8VjR10Z4Tz7Yf2vX/Yxea/p1C54vEpx533WbJp4wBvP7bW0y6G2', 'officer', 'Kampala Central'),
('+256700000003', '$2b$12$6K8VjR10Z4Tz7Yf2vX/Yxea/p1C54vEpx533WbJp4wBvP7bW0y6G2', 'admin', 'Victoria University');
