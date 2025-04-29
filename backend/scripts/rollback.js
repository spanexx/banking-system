const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
    appName: 'banking-api',
    backupDir: path.join(__dirname, '../backups'),
    deploymentsDir: path.join(__dirname, '../deployments'),
};

// Utility to run commands
function runCommand(command, options = {}) {
    try {
        console.log(`Executing: ${command}`);
        execSync(command, { stdio: 'inherit', ...options });
        return true;
    } catch (error) {
        console.error(`Error executing: ${command}`);
        console.error(error.message);
        return false;
    }
}

// Get the previous deployment version
function getPreviousDeployment() {
    if (!fs.existsSync(config.deploymentsDir)) {
        console.error('No previous deployments found');
        return null;
    }

    const deployments = fs.readdirSync(config.deploymentsDir)
        .filter(f => f.startsWith('deployment-'))
        .sort()
        .reverse();

    if (deployments.length < 2) {
        console.error('No previous deployment version available');
        return null;
    }

    return deployments[1]; // Return second-to-last deployment
}

// Restore database from backup
async function restoreDatabase() {
    const backups = fs.readdirSync(config.backupDir)
        .filter(f => f.startsWith('db-backup-'))
        .sort()
        .reverse();

    if (backups.length === 0) {
        console.error('No database backups found');
        return false;
    }

    const latestBackup = backups[0];
    const backupPath = path.join(config.backupDir, latestBackup);

    try {
        // Extract the backup
        execSync(`tar -xzf "${backupPath}" -C "${config.backupDir}"`);
        
        // Restore using mongorestore
        execSync(`mongorestore --uri="${process.env.MONGO_URI}" --drop "${backupPath.replace('.tar.gz', '')}"`);
        
        // Clean up extracted files
        execSync(`rm -rf "${backupPath.replace('.tar.gz', '')}"`);
        
        console.log('Database restored successfully');
        return true;
    } catch (error) {
        console.error('Failed to restore database:', error);
        return false;
    }
}

// Rollback PM2 process
function rollbackPM2(version) {
    const versionPath = path.join(config.deploymentsDir, version);
    
    if (!fs.existsSync(versionPath)) {
        console.error('Previous version not found');
        return false;
    }

    return runCommand(`pm2 delete ${config.appName}`) &&
           runCommand(`cd "${versionPath}" && pm2 start ecosystem.config.js --env production`) &&
           runCommand('pm2 save');
}

// Main rollback function
async function rollback() {
    console.log('Starting rollback process...');

    // Get previous deployment version
    const previousVersion = getPreviousDeployment();
    if (!previousVersion) {
        process.exit(1);
    }

    console.log(`Rolling back to version: ${previousVersion}`);

    // Stop current application
    runCommand(`pm2 stop ${config.appName}`);

    // Restore database
    if (!await restoreDatabase()) {
        console.error('Database rollback failed');
        process.exit(1);
    }

    // Rollback PM2 process
    if (!rollbackPM2(previousVersion)) {
        console.error('PM2 rollback failed');
        process.exit(1);
    }

    console.log('Rollback completed successfully!');
}

// Run rollback if called directly
if (require.main === module) {
    rollback().catch(console.error);
}

module.exports = {
    rollback,
    getPreviousDeployment,
    restoreDatabase,
    rollbackPM2
};