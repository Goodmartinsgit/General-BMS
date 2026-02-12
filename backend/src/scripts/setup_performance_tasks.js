const { pool } = require('../config/db');

const setupPerformanceTasks = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Performance Tasks database setup...');

        // 1. Create ENUM types
        console.log('Creating ENUM types...');
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE retail_task_type AS ENUM (
                    'sales_count',
                    'sales_amount', 
                    'tiles_quantity',
                    'accessories_quantity',
                    'general_product_quantity'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE retail_task_status AS ENUM (
                    'scheduled',
                    'active',
                    'paused',
                    'completed',
                    'failed',
                    'ended',
                    'cancelled'
                );
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Create retail_performance_tasks table
        console.log('Creating retail_performance_tasks table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS retail_performance_tasks (
                id SERIAL PRIMARY KEY,
                task_number VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                task_type retail_task_type NOT NULL,
                target_value DECIMAL(15, 2) NOT NULL,
                target_min DECIMAL(15, 2),
                target_max DECIMAL(15, 2),
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                extended_end_time TIMESTAMP,
                status retail_task_status NOT NULL DEFAULT 'scheduled',
                created_by UUID NOT NULL REFERENCES users(id),
                paused_at TIMESTAMP,
                paused_by UUID REFERENCES users(id),
                resumed_at TIMESTAMP,
                ended_at TIMESTAMP,
                ended_by UUID REFERENCES users(id),
                end_reason TEXT,
                cancelled_at TIMESTAMP,
                cancelled_by UUID REFERENCES users(id),
                cancel_reason TEXT,
                completion_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT check_target_value_positive CHECK (target_value > 0),
                CONSTRAINT check_time_range CHECK (start_time < end_time)
            )
        `);

        // 3. Create task_assignments table
        console.log('Creating task_assignments table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_assignments (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES retail_performance_tasks(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT NOW(),
                notified_at TIMESTAMP,
                notification_sent BOOLEAN DEFAULT FALSE,
                UNIQUE (task_id, user_id)
            )
        `);

        // 4. Create task_progress table
        console.log('Creating task_progress table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_progress (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES retail_performance_tasks(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
                contribution_value DECIMAL(15, 2) NOT NULL,
                recorded_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (task_id, sale_id, user_id)
            )
        `);

        // 5. Create task_pause_history table
        console.log('Creating task_pause_history table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS task_pause_history (
                id SERIAL PRIMARY KEY,
                task_id INTEGER NOT NULL REFERENCES retail_performance_tasks(id) ON DELETE CASCADE,
                paused_at TIMESTAMP NOT NULL,
                paused_by UUID REFERENCES users(id),
                resumed_at TIMESTAMP,
                resumed_by UUID REFERENCES users(id),
                pause_duration_seconds INTEGER,
                pause_reason TEXT
            )
        `);

        // 6. Create Materialized View for performance
        console.log('Creating task_summary materialized view...');
        await client.query(`
            CREATE MATERIALIZED VIEW IF NOT EXISTS task_progress_summary AS
            SELECT 
                tp.task_id,
                tp.user_id,
                SUM(tp.contribution_value) AS total_progress,
                COUNT(tp.id) AS contribution_count,
                MAX(tp.recorded_at) AS last_updated
            FROM task_progress tp
            GROUP BY tp.task_id, tp.user_id
        `);

        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_task_progress_summary_task_user 
            ON task_progress_summary(task_id, user_id)
        `);

        // 7. Create helper functions and triggers
        console.log('Creating helper functions and triggers...');
        
        // Task Number Generation
        await client.query(`
            CREATE OR REPLACE FUNCTION generate_rpt_number()
            RETURNS VARCHAR(50) AS $$
            DECLARE
                current_year VARCHAR(4);
                next_number INTEGER;
            BEGIN
                current_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
                SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM '\\d+$') AS INTEGER)), 0) + 1 INTO next_number
                FROM retail_performance_tasks
                WHERE task_number LIKE 'RPT-' || current_year || '-%';
                RETURN 'RPT-' || current_year || '-' || LPAD(next_number::VARCHAR, 5, '0');
            END;
            $$ LANGUAGE plpgsql;
        `);

        await client.query(`
            CREATE OR REPLACE FUNCTION set_rpt_number()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.task_number IS NULL OR NEW.task_number = '' THEN
                    NEW.task_number := generate_rpt_number();
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS trigger_set_rpt_number ON retail_performance_tasks;
            CREATE TRIGGER trigger_set_rpt_number
            BEFORE INSERT ON retail_performance_tasks
            FOR EACH ROW EXECUTE FUNCTION set_rpt_number();
        `);

        console.log('Performance Tasks setup completed successfully!');
    } catch (error) {
        console.error('Error during Performance Tasks setup:', error);
    } finally {
        client.release();
    }
};

setupPerformanceTasks().then(() => process.exit());
