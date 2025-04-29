const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
    nginxConfig: path.join(__dirname, '../nginx.conf'),
    distDir: path.join(__dirname, '../dist/frontend'),
    deployDir: '/var/www/banking-frontend',
    backupDir: '/var/www/backups',
    domain: process.env.DEPLOY_DOMAIN || 'your-domain.com'
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

// Check requirements
function checkRequirements() {
    console.log('Checking system requirements...');
    
    const requirements = [
        { cmd: 'node -v', name: 'Node.js' },
        { cmd: 'npm -v', name: 'npm' },
        { cmd: 'ng --version', name: 'Angular CLI' }
    ];

    let allMet = true;
    requirements.forEach(req => {
        try {
            execSync(req.cmd, { stdio: 'ignore' });
            console.log(`✓ ${req.name} is installed`);
        } catch (error) {
            console.error(`✗ ${req.name} is not installed`);
            allMet = false;
        }
    });

    return allMet;
}

// Build application
function buildApp() {
    console.log('Building application...');
    return runCommand('ng build --configuration=production');
}

// Create backup of current deployment
function createBackup(ssh) {
    console.log('Creating backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupCommand = `mkdir -p ${config.backupDir} && cd ${config.backupDir} && tar -czf banking-frontend-${timestamp}.tar.gz ${config.deployDir}`;
    
    if (ssh) {
        return runCommand(`ssh ${ssh} "${backupCommand}"`);
    }
    return runCommand(backupCommand);
}

// Deploy application
function deployApp(ssh) {
    console.log('Deploying application...');
    
    if (ssh) {
        // Remote deployment
        runCommand(`ssh ${ssh} "mkdir -p ${config.deployDir}"`);
        return runCommand(`scp -r ${config.distDir}/* ${ssh}:${config.deployDir}/`);
    } else {
        // Local deployment
        runCommand(`mkdir -p ${config.deployDir}`);
        return runCommand(`cp -r ${config.distDir}/* ${config.deployDir}/`);
    }
}

// Setup Nginx
function setupNginx(ssh) {
    console.log('Setting up Nginx...');
    
    // Replace domain in nginx config
    let nginxConfig = fs.readFileSync(config.nginxConfig, 'utf8');
    nginxConfig = nginxConfig.replace(/your-domain\.com/g, config.domain);
    
    const tmpConfig = path.join(__dirname, 'nginx.conf.tmp');
    fs.writeFileSync(tmpConfig, nginxConfig);
    
    if (ssh) {
        // Remote server
        runCommand(`scp ${tmpConfig} ${ssh}:/etc/nginx/sites-available/banking-frontend`);
        runCommand(`ssh ${ssh} "ln -sf /etc/nginx/sites-available/banking-frontend /etc/nginx/sites-enabled/"`);
        runCommand(`ssh ${ssh} "nginx -t && systemctl reload nginx"`);
    } else {
        // Local server
        runCommand(`sudo cp ${tmpConfig} /etc/nginx/sites-available/banking-frontend`);
        runCommand(`sudo ln -sf /etc/nginx/sites-available/banking-frontend /etc/nginx/sites-enabled/`);
        runCommand(`sudo nginx -t && sudo systemctl reload nginx`);
    }
    
    fs.unlinkSync(tmpConfig);
    return true;
}

// Main deployment function
async function deploy() {
    console.log('Starting frontend deployment process...');

    // Check if SSH details are provided
    const ssh = process.env.DEPLOY_SSH || null; // e.g., "user@server"

    // Check requirements
    if (!checkRequirements()) {
        console.error('System requirements not met. Please install missing dependencies.');
        process.exit(1);
    }

    // Build application
    if (!buildApp()) {
        console.error('Build failed.');
        process.exit(1);
    }

    // Create backup
    if (!createBackup(ssh)) {
        console.error('Backup failed.');
        process.exit(1);
    }

    // Deploy application
    if (!deployApp(ssh)) {
        console.error('Deployment failed.');
        process.exit(1);
    }

    // Setup Nginx
    if (!setupNginx(ssh)) {
        console.error('Nginx setup failed.');
        process.exit(1);
    }

    console.log('Frontend deployment completed successfully!');
    console.log(`
Next steps:
1. Verify the application at https://${config.domain}
2. Run post-deployment tests
3. Monitor application performance
4. Check error logs
    `);
}

// Run deployment if called directly
if (require.main === module) {
    deploy().catch(console.error);
}

module.exports = {
    deploy,
    checkRequirements,
    buildApp,
    createBackup,
    deployApp,
    setupNginx
};