import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB Course Schema
const courseSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    sub_title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    thumbnail_url: {
        type: String,
        required: false,
    },
    original_price: {
        type: Number,
        required: true,
    },
    current_price: {
        type: Number,
        required: true,
    },
    course_status: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected', 'inactive'],
        required: true,
    },
    level_id: {
        type: String,
        required: true,
    },
    lang_id: {
        type: String,
        required: true,
    },
    has_practice: {
        type: Boolean,
        required: true,
    },
    has_certificate: {
        type: Boolean,
        required: true,
    },
    requirements: {
        type: Array,
        default: [],
    },
    objectives: {
        type: Array,
        default: [],
    },
    instructor_id: {
        type: String,
        required: true,
    },
}, { _id: false });

const Course = mongoose.model('Course', courseSchema);

async function migrateCourses() {
    let mysqlConnection;
    
    try {
        console.log('🔄 Starting course migration from MySQL to MongoDB...\n');

        // Connect to MySQL
        console.log('📊 Connecting to MySQL...');
        mysqlConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        console.log('✅ MySQL connected\n');

        // Connect to MongoDB
        console.log('🍃 Connecting to MongoDB...');
        await mongoose.connect(`${process.env.MONGODB_URI}/HEDU`);
        console.log('✅ MongoDB connected\n');
        console.log('existing data:', await Course.countDocuments());


        // Fetch all courses from MySQL
        console.log('📥 Fetching courses from MySQL...');
        const [courses] = await mysqlConnection.execute(
            'SELECT * FROM Courses'
        );
        console.log(`✅ Found ${courses.length} courses\n`);

        if (courses.length === 0) {
            console.log('⚠️  No courses found in MySQL database');
            return;
        }

        // Clear existing courses in MongoDB (optional - comment out if you want to keep existing data)
        console.log('🗑️  Clearing existing courses in MongoDB...');
        // await Course.deleteMany({});
        console.log('✅ Cleared existing courses\n');

        // Transform and insert courses
        console.log('🔄 Migrating courses to MongoDB...');
        let successCount = 0;
        let failCount = 0;

        for (const mysqlCourse of courses) {
            try {
                const mongodbCourse = {
                    _id: mysqlCourse.course_id,
                    title: mysqlCourse.title,
                    sub_title: mysqlCourse.subTitle || '',
                    description: mysqlCourse.des || '',
                    thumbnail_url: mysqlCourse.picture_url || '',
                    original_price: parseFloat(mysqlCourse.originalPrice) || 0,
                    current_price: parseFloat(mysqlCourse.currentPrice) || 0,
                    course_status: mysqlCourse.course_status || 'draft',
                    level_id: mysqlCourse.lv_id || '',
                    lang_id: mysqlCourse.lang_id || '',
                    has_practice: Boolean(mysqlCourse.has_practice),
                    has_certificate: Boolean(mysqlCourse.has_certificate),
                    requirements: [], // Will be populated separately if needed
                    objectives: [], // Will be populated separately if needed
                    instructor_id: mysqlCourse.instructor_id || '',
                };

                await Course.create(mongodbCourse);
                successCount++;
                console.log(`✅ Migrated: ${mysqlCourse.title}`);
            } catch (error) {
                failCount++;
                console.error(`❌ Failed to migrate course ${mysqlCourse.course_id}: ${error.message}`);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Successfully migrated: ${successCount}`);
        console.log(`   ❌ Failed: ${failCount}`);
        console.log(`   📊 Total: ${courses.length}`);
        console.log('\n✨ Migration completed!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        // Close connections
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('\n📊 MySQL connection closed');
        }
        await mongoose.connection.close();
        console.log('🍃 MongoDB connection closed');
    }
}

// Run migration
migrateCourses()
    .then(() => {
        console.log('\n🎉 Migration process finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Migration process failed:', error);
        process.exit(1);
    });
