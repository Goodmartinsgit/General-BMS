-- ============================================
-- Migration 017: Enhance Global Fiscal Settings
-- Purpose: Add Eldaved-BMS style fiscal period configuration
--          with period range functions and expanded period types
-- ============================================

-- Step 1: Add missing columns to global_fiscal_settings
DO $$ BEGIN
    -- Drop the old CHECK constraint on period_type if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%period_type%'
        AND constraint_schema = 'public'
    ) THEN
        ALTER TABLE global_fiscal_settings DROP CONSTRAINT IF EXISTS global_fiscal_settings_period_type_check;
    END IF;
END $$;

-- Add custom_start_date column
ALTER TABLE global_fiscal_settings
    ADD COLUMN IF NOT EXISTS custom_start_date DATE;

-- Add custom_end_date column
ALTER TABLE global_fiscal_settings
    ADD COLUMN IF NOT EXISTS custom_end_date DATE;

-- Add show_period_badge_on_dashboard column
ALTER TABLE global_fiscal_settings
    ADD COLUMN IF NOT EXISTS show_period_badge_on_dashboard BOOLEAN NOT NULL DEFAULT TRUE;

-- Add allow_users_to_override column
ALTER TABLE global_fiscal_settings
    ADD COLUMN IF NOT EXISTS allow_users_to_override BOOLEAN NOT NULL DEFAULT TRUE;

-- Update period_type default and add expanded CHECK constraint
ALTER TABLE global_fiscal_settings
    ALTER COLUMN period_type SET DEFAULT 'forever';

ALTER TABLE global_fiscal_settings
    ADD CONSTRAINT global_fiscal_settings_period_type_check
    CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly', 'forever', 'custom'));

-- Update existing rows to 'forever' if they have old values like 'annual'
UPDATE global_fiscal_settings
SET period_type = 'forever'
WHERE period_type NOT IN ('daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly', 'forever', 'custom');

-- Step 2: Ensure a default row exists
INSERT INTO global_fiscal_settings (
    organization_id, period_type, fiscal_year_start_month, fiscal_year_start_day,
    show_period_badge_on_dashboard, allow_users_to_override
)
SELECT
    (SELECT id FROM organizations LIMIT 1),
    'forever', 1, 1, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM global_fiscal_settings LIMIT 1);

-- Step 3: Create fiscal period range calculation function
CREATE OR REPLACE FUNCTION calculate_fiscal_period_range(
    p_period_type VARCHAR,
    p_custom_start DATE DEFAULT NULL,
    p_custom_end DATE DEFAULT NULL,
    p_fiscal_start_month INTEGER DEFAULT 1,
    p_fiscal_start_day INTEGER DEFAULT 1
)
RETURNS TABLE(start_date DATE, end_date DATE) AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_fiscal_year_start DATE;
BEGIN
    CASE p_period_type
        WHEN 'daily' THEN
            start_date := v_today;
            end_date := v_today;

        WHEN 'weekly' THEN
            start_date := DATE_TRUNC('week', v_today)::DATE;
            end_date := (DATE_TRUNC('week', v_today) + INTERVAL '6 days')::DATE;

        WHEN 'monthly' THEN
            start_date := DATE_TRUNC('month', v_today)::DATE;
            end_date := (DATE_TRUNC('month', v_today) + INTERVAL '1 month - 1 day')::DATE;

        WHEN 'quarterly' THEN
            start_date := DATE_TRUNC('quarter', v_today)::DATE;
            end_date := (DATE_TRUNC('quarter', v_today) + INTERVAL '3 months - 1 day')::DATE;

        WHEN 'half_yearly' THEN
            IF EXTRACT(MONTH FROM v_today) <= 6 THEN
                start_date := DATE_TRUNC('year', v_today)::DATE;
                end_date := (DATE_TRUNC('year', v_today) + INTERVAL '6 months - 1 day')::DATE;
            ELSE
                start_date := (DATE_TRUNC('year', v_today) + INTERVAL '6 months')::DATE;
                end_date := (DATE_TRUNC('year', v_today) + INTERVAL '1 year - 1 day')::DATE;
            END IF;

        WHEN 'yearly' THEN
            v_fiscal_year_start := MAKE_DATE(
                CASE
                    WHEN v_today >= MAKE_DATE(EXTRACT(YEAR FROM v_today)::INTEGER, p_fiscal_start_month, p_fiscal_start_day)
                    THEN EXTRACT(YEAR FROM v_today)::INTEGER
                    ELSE EXTRACT(YEAR FROM v_today)::INTEGER - 1
                END,
                p_fiscal_start_month,
                p_fiscal_start_day
            );
            start_date := v_fiscal_year_start;
            end_date := (v_fiscal_year_start + INTERVAL '1 year - 1 day')::DATE;

        WHEN 'custom' THEN
            start_date := COALESCE(p_custom_start, DATE_TRUNC('year', v_today)::DATE);
            end_date := COALESCE(p_custom_end, v_today);

        WHEN 'forever' THEN
            start_date := NULL;
            end_date := NULL;

        ELSE
            start_date := NULL;
            end_date := NULL;
    END CASE;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create convenience function to get current active period range
CREATE OR REPLACE FUNCTION get_active_fiscal_period_range()
RETURNS TABLE(start_date DATE, end_date DATE, period_type VARCHAR, period_label TEXT) AS $$
DECLARE
    v_settings RECORD;
    v_dates RECORD;
BEGIN
    SELECT * INTO v_settings FROM global_fiscal_settings LIMIT 1;

    IF NOT FOUND THEN
        start_date := NULL;
        end_date := NULL;
        period_type := 'forever';
        period_label := 'All Time';
        RETURN NEXT;
        RETURN;
    END IF;

    SELECT * INTO v_dates FROM calculate_fiscal_period_range(
        v_settings.period_type,
        v_settings.custom_start_date,
        v_settings.custom_end_date,
        v_settings.fiscal_year_start_month,
        v_settings.fiscal_year_start_day
    );

    start_date := v_dates.start_date;
    end_date := v_dates.end_date;
    period_type := v_settings.period_type;

    CASE v_settings.period_type
        WHEN 'daily' THEN period_label := 'Today';
        WHEN 'weekly' THEN period_label := 'This Week';
        WHEN 'monthly' THEN period_label := TO_CHAR(v_dates.start_date, 'Mon YYYY');
        WHEN 'quarterly' THEN period_label := 'Q' || EXTRACT(QUARTER FROM v_dates.start_date) || ' ' || EXTRACT(YEAR FROM v_dates.start_date);
        WHEN 'half_yearly' THEN
            IF EXTRACT(MONTH FROM v_dates.start_date) <= 6 THEN
                period_label := 'H1 ' || EXTRACT(YEAR FROM v_dates.start_date);
            ELSE
                period_label := 'H2 ' || EXTRACT(YEAR FROM v_dates.start_date);
            END IF;
        WHEN 'yearly' THEN period_label := 'FY ' || EXTRACT(YEAR FROM v_dates.start_date);
        WHEN 'custom' THEN period_label := TO_CHAR(v_dates.start_date, 'DD Mon') || ' - ' || TO_CHAR(v_dates.end_date, 'DD Mon YYYY');
        WHEN 'forever' THEN period_label := 'All Time';
        ELSE period_label := 'Unknown';
    END CASE;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_global_fiscal_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_global_fiscal_settings ON global_fiscal_settings;
CREATE TRIGGER trigger_update_global_fiscal_settings
    BEFORE UPDATE ON global_fiscal_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_global_fiscal_settings_timestamp();

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Migration 017 completed: Global fiscal settings enhanced with period range functions';
END $$;
