import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB Schemas
const languageSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true, unique: true }
}, { _id: false, timestamps: false });

const levelSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true, unique: true }
}, { _id: false, timestamps: false });

const categorySchema = new mongoose.Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true, unique: true }
}, { _id: false, timestamps: false });

const labelingSchema = new mongoose.Schema({
    category_id: { type: String, required: true, ref: 'Category' },
    course_id: { type: String, required: true, ref: 'Course' }
}, { timestamps: false });
labelingSchema.index({ category_id: 1, course_id: 1 }, { unique: true });

const headingSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true },
    sub_title: { type: String, required: true }
}, { _id: false, timestamps: false });

const headingCategorySchema = new mongoose.Schema({
    heading_id: { type: String, required: true, ref: 'Heading' },
    category_id: { type: String, required: true, ref: 'Category' }
}, { timestamps: false });
headingCategorySchema.index({ heading_id: 1, category_id: 1 }, { unique: true });

// Models
const Language = mongoose.model('Language', languageSchema);
const Level = mongoose.model('Level', levelSchema);
const Category = mongoose.model('Category', categorySchema);
const Labeling = mongoose.model('Labeling', labelingSchema);
const Heading = mongoose.model('Heading', headingSchema);
const HeadingCategory = mongoose.model('HeadingCategory', headingCategorySchema);

async function migrateLookupTables() {
    let mysqlConnection;
    
    try {
        console.log('🔄 Starting lookup tables migration from MySQL to MongoDB...\n');

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

        // Migrate Languages
        await migrateLanguages(mysqlConnection);
        
        // Migrate Levels
        await migrateLevels(mysqlConnection);
        
        // Migrate Categories
        await migrateCategories(mysqlConnection);
        
        // Migrate Labeling
        await migrateLabeling(mysqlConnection);
        
        // Migrate Headings
        await migrateHeadings(mysqlConnection);
        
        // Migrate HeadingCategory
        await migrateHeadingCategory(mysqlConnection);

        console.log('\n✨ All migrations completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('\n📊 MySQL connection closed');
        }
        await mongoose.connection.close();
        console.log('🍃 MongoDB connection closed');
    }
}

async function migrateLanguages(mysqlConnection) {
    console.log('🌐 Migrating Languages...');
    
    const existingCount = await Language.countDocuments();
    console.log(`   Existing Languages in MongoDB: ${existingCount}`);
    
    const [rows] = await mysqlConnection.execute('SELECT * FROM Languages');
    console.log(`   Found ${rows.length} languages in MySQL`);
    
    if (rows.length === 0) {
        console.log('   ⚠️ No languages to migrate\n');
        return;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rows) {
        try {
            const language = {
                _id: row.lang_id,
                title: row.title
            };
            
            const existing = await Language.findById(row.lang_id);
            if (existing) {
                await Language.updateOne({ _id: row.lang_id }, language);
                updated++;
            } else {
                await Language.create(language);
                created++;
            }
        } catch (error) {
            console.error(`   ❌ Error migrating language ${row.lang_id}:`, error.message);
            skipped++;
        }
    }
    
    console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}\n`);
}

async function migrateLevels(mysqlConnection) {
    console.log('📊 Migrating Levels...');
    
    const existingCount = await Level.countDocuments();
    console.log(`   Existing Levels in MongoDB: ${existingCount}`);
    
    const [rows] = await mysqlConnection.execute('SELECT * FROM Levels');
    console.log(`   Found ${rows.length} levels in MySQL`);
    
    if (rows.length === 0) {
        console.log('   ⚠️ No levels to migrate\n');
        return;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rows) {
        try {
            const level = {
                _id: row.lv_id,
                title: row.title
            };
            
            const existing = await Level.findById(row.lv_id);
            if (existing) {
                await Level.updateOne({ _id: row.lv_id }, level);
                updated++;
            } else {
                await Level.create(level);
                created++;
            }
        } catch (error) {
            console.error(`   ❌ Error migrating level ${row.lv_id}:`, error.message);
            skipped++;
        }
    }
    
    console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}\n`);
}

async function migrateCategories(mysqlConnection) {
    console.log('🗂️  Migrating Categories...');
    
    const existingCount = await Category.countDocuments();
    console.log(`   Existing Categories in MongoDB: ${existingCount}`);
    
    const [rows] = await mysqlConnection.execute('SELECT * FROM Categories');
    console.log(`   Found ${rows.length} categories in MySQL`);
    
    if (rows.length === 0) {
        console.log('   ⚠️ No categories to migrate\n');
        return;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rows) {
        try {
            const category = {
                _id: row.category_id,
                title: row.title
            };
            
            const existing = await Category.findById(row.category_id);
            if (existing) {
                await Category.updateOne({ _id: row.category_id }, category);
                updated++;
            } else {
                await Category.create(category);
                created++;
            }
        } catch (error) {
            console.error(`   ❌ Error migrating category ${row.category_id}:`, error.message);
            skipped++;
        }
    }
    
    console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}\n`);
}

async function migrateLabeling(mysqlConnection) {
    console.log('🏷️  Migrating Labeling (Course-Category mappings)...');
    
    const existingCount = await Labeling.countDocuments();
    console.log(`   Existing Labelings in MongoDB: ${existingCount}`);
    
    const [rows] = await mysqlConnection.execute('SELECT * FROM Labeling');
    console.log(`   Found ${rows.length} labelings in MySQL`);
    
    if (rows.length === 0) {
        console.log('   ⚠️ No labelings to migrate\n');
        return;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rows) {
        try {
            const labeling = {
                category_id: row.category_id,
                course_id: row.course_id
            };
            
            const existing = await Labeling.findOne({
                category_id: row.category_id,
                course_id: row.course_id
            });
            
            if (existing) {
                updated++;
            } else {
                await Labeling.create(labeling);
                created++;
            }
        } catch (error) {
            console.error(`   ❌ Error migrating labeling ${row.category_id}-${row.course_id}:`, error.message);
            skipped++;
        }
    }
    
    console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}\n`);
}

async function migrateHeadings(mysqlConnection) {
    console.log('📑 Migrating Headings...');
    
    const existingCount = await Heading.countDocuments();
    console.log(`   Existing Headings in MongoDB: ${existingCount}`);
    
    const [rows] = await mysqlConnection.execute('SELECT * FROM headings');
    console.log(`   Found ${rows.length} headings in MySQL`);
    
    if (rows.length === 0) {
        console.log('   ⚠️ No headings to migrate\n');
        return;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rows) {
        try {
            const heading = {
                _id: row.heading_id,
                title: row.title,
                sub_title: row.sub_title
            };
            
            const existing = await Heading.findById(row.heading_id);
            if (existing) {
                await Heading.updateOne({ _id: row.heading_id }, heading);
                updated++;
            } else {
                await Heading.create(heading);
                created++;
            }
        } catch (error) {
            console.error(`   ❌ Error migrating heading ${row.heading_id}:`, error.message);
            skipped++;
        }
    }
    
    console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}\n`);
}

async function migrateHeadingCategory(mysqlConnection) {
    console.log('🔗 Migrating Heading-Category mappings...');
    
    const existingCount = await HeadingCategory.countDocuments();
    console.log(`   Existing Heading-Category mappings in MongoDB: ${existingCount}`);
    
    const [rows] = await mysqlConnection.execute('SELECT * FROM heading_category');
    console.log(`   Found ${rows.length} heading-category mappings in MySQL`);
    
    if (rows.length === 0) {
        console.log('   ⚠️ No heading-category mappings to migrate\n');
        return;
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const row of rows) {
        try {
            const headingCategory = {
                heading_id: row.heading_id,
                category_id: row.category_id
            };
            
            const existing = await HeadingCategory.findOne({
                heading_id: row.heading_id,
                category_id: row.category_id
            });
            
            if (existing) {
                updated++;
            } else {
                await HeadingCategory.create(headingCategory);
                created++;
            }
        } catch (error) {
            console.error(`   ❌ Error migrating heading-category ${row.heading_id}-${row.category_id}:`, error.message);
            skipped++;
        }
    }
    
    console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}\n`);
}

// Run migration
migrateLookupTables()
    .then(() => {
        console.log('✅ Migration process completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration process failed:', error);
        process.exit(1);
    });
