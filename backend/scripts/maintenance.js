const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
    logDir: path.join(__dirname, '../logs'),
    uploadsDir: path.join(__dirname, '../uploads'),
    maxLogAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    backupDir: path.join(__dirname, '../backups'),
};

// Create necessary directories
function ensureDirectories() {
    [config.logDir, config.backupDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Rotate logs
function rotateLogs() {
    const now = new Date();
    const files = fs.readdirSync(config.logDir);
    
    files.forEach(file => {
        const filePath = path.join(config.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime > config.maxLogAge) {
            const archiveName = `${file}.${stats.mtime.toISOString().split('T')[0]}.gz`;
            try {
                // Compress old log file
                execSync(`gzip -c "${filePath}" > "${path.join(config.backupDir, archiveName)}"`);
                // Remove original file
                fs.unlinkSync(filePath);
                console.log(`Rotated log file: ${file}`);
            } catch (err) {
                console.error(`Failed to rotate log file ${file}:`, err);
            }
        }
    });
}

// Clean old uploads
function cleanUploads() {
    const now = new Date();
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    if (fs.existsSync(config.uploadsDir)) {
        const files = fs.readdirSync(config.uploadsDir);
        
        files.forEach(file => {
            const filePath = path.join(config.uploadsDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtime > maxAge) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Removed old upload: ${file}`);
                } catch (err) {
                    console.error(`Failed to remove old upload ${file}:`, err);
                }
            }
        });
    }
}

// Create backup of database (requires mongodump to be installed)
async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(config.backupDir, `db-backup-${timestamp}`);
    
    try {
        execSync(`mongodump --uri="${process.env.MONGO_URI}" --out="${backupPath}"`);
        console.log(`Database backup created at: ${backupPath}`);
        
        // Compress backup
        execSync(`tar -czf "${backupPath}.tar.gz" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`);
        
        // Remove uncompressed backup
        execSync(`rm -rf "${backupPath}"`);
        
        // Remove backups older than 7 days
        const oldBackups = fs.readdirSync(config.backupDir)
            .filter(f => f.startsWith('db-backup-') && f.endsWith('.tar.gz'));
        
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        oldBackups.forEach(backup => {
            const backupPath = path.join(config.backupDir, backup);
            const stats = fs.statSync(backupPath);
            
            if (stats.mtime < sevenDaysAgo) {
                fs.unlinkSync(backupPath);
                console.log(`Removed old backup: ${backup}`);
            }
        });
    } catch (err) {
        console.error('Failed to create database backup:', err);
    }
}

// Main maintenance function
async function performMaintenance() {
    console.log('Starting maintenance tasks...');
    
    try {
        ensureDirectories();
        rotateLogs();
        cleanUploads();
        await backupDatabase();
        console.log('Maintenance tasks completed successfully');
    } catch (err) {
        console.error('Error during maintenance:', err);
    }
}

// If running as main script
if (require.main === module) {
    performMaintenance();
}

module.exports = {
    performMaintenance,
    rotateLogs,
    cleanUploads,
    backupDatabase
};