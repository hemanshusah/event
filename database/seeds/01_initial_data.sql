-- Initial seed data for Growth Catalyst Platform
-- Version: 1.0

-- Insert default admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_verified, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@growthcatalyst.com', '$2b$10$rQZ8K9vX8K9vX8K9vX8K9e', 'Super', 'Admin', 'admin', true, true);

-- Insert gamification settings
INSERT INTO gamification_settings (action_type, points, is_active) VALUES
('profile_complete', 100, true),
('rsvp_event', 50, true),
('stage_promotion', 500, true),
('vdr_access_request', 200, true),
('startup_access_request', 150, true),
('event_attendance', 75, true),
('first_login', 25, true),
('complete_onboarding', 200, true);

-- Insert sample events
INSERT INTO events (id, name, description, stage, status, start_date, end_date, venue, max_capacity, is_public, is_invite_only) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Catalyst Connect - Noida', 'Scouting event for early-stage startups in Noida', 'scouting', 'published', '2025-11-15 09:00:00', '2025-11-15 17:00:00', 'Noida Convention Center', 200, true, false),
('650e8400-e29b-41d4-a716-446655440002', 'The Growth Catalyst Unconference', 'Deal sourcing event for selected startups', 'deal_sourcing', 'draft', '2025-12-10 09:00:00', '2025-12-10 18:00:00', 'Delhi Marriott Hotel', 100, false, true),
('650e8400-e29b-41d4-a716-446655440003', 'Catalyst Ascent Retreat', 'Private retreat for final stage startups', 'retreat', 'draft', '2025-12-20 08:00:00', '2025-12-22 20:00:00', 'Rajasthan Palace Resort', 50, false, false);
