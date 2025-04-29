const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
    appName: 'banking-api',
    pm2Config: path.join(__dirname, '../ecosystem.config.js'),
    nginxConfig: path.join(__dirname, '../nginx.conf'),
    envExample: path.join(__dirname, '../.env.example'),
    envFile: path.join(__dirname, '../.env'),
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

// Check system requirements
function checkRequirements() {
    console.log('Checking system requirements...');
    
    const requirements = [
        { cmd: 'node -v', name: 'Node.js' },
        { cmd: 'npm -v', name: 'npm' },
        { cmd: 'pm2 -v', name: 'PM2' },
        { cmd: 'mongod --version', name: 'MongoDB' },
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

// Setup environment
function setupEnvironment() {
    console.log('Setting up environment...');
    
    if (!fs.existsSync(config.envFile)) {
        if (fs.existsSync(config.envExample)) {
            fs.copyFileSync(config.envExample, config.envFile);
            console.log('Created .env file from template');
            console.log('Please edit .env file with your production values');
            return false;
        } else {
            console.error('.env.example file not found');
            return false;
        }
    }
    return true;
}

// Install dependencies
function installDependencies() {
    console.log('Installing dependencies...');
    return runCommand('npm install --production');
}

// Setup PM2
function setupPM2() {
    console.log('Setting up PM2...');
    
    if (!fs.existsSync(config.pm2Config)) {
        console.error('PM2 ecosystem config not found');
        return false;
    }

    return runCommand(`pm2 delete ${config.appName}`, { stdio: 'ignore' }) &&
           runCommand(`pm2 start ${config.pm2Config} --env production`) &&
           runCommand('pm2 save') &&
           runCommand('pm2 startup');
}

// Setup Nginx
function setupNginx() {
    console.log('Setting up Nginx...');
    
    if (!fs.existsSync(config.nginxConfig)) {
        console.error('Nginx config not found');
        return false;
    }

    // Copy Nginx configuration
    const nginxSitePath = '/etc/nginx/sites-available/banking-system';
    fs.copyFileSync(config.nginxConfig, nginxSitePath);
    
    // Create symlink if it doesn't exist
    const nginxEnabledPath = '/etc/nginx/sites-enabled/banking-system';
    if (!fs.existsSync(nginxEnabledPath)) {
        fs.symlinkSync(nginxSitePath, nginxEnabledPath);
    }

    // Test and reload Nginx
    return runCommand('nginx -t') && runCommand('systemctl reload nginx');
}

// Setup SSL with Let's Encrypt
async function setupSSL(domain) {
    console.log('Setting up SSL...');
    
    if (!domain) {
        console.error('Domain name not provided');
        return false;
    }

    return runCommand(`certbot --nginx -d ${domain} --non-interactive --agree-tos --email admin@${domain}`);
}

// Main deployment function
async function deploy() {
    console.log('Starting deployment process...');

    // Check requirements
    if (!checkRequirements()) {
        console.error('System requirements not met. Please install missing dependencies.');
        process.exit(1);
    }

    // Setup environment
    if (!setupEnvironment()) {
        console.error('Environment setup failed.');
        process.exit(1);
    }

    // Install dependencies
    if (!installDependencies()) {
        console.error('Failed to install dependencies.');
        process.exit(1);
    }

    // Setup PM2
    if (!setupPM2()) {
        console.error('PM2 setup failed.');
        process.exit(1);
    }

    // Setup Nginx
    if (!setupNginx()) {
        console.error('Nginx setup failed.');
        process.exit(1);
    }

    // Setup SSL if domain is provided
    const domain = process.argv[2];
    if (domain) {
        if (!await setupSSL(domain)) {
            console.error('SSL setup failed.');
            process.exit(1);
        }
    } else {
        console.log('No domain provided, skipping SSL setup');
    }

    console.log('Deployment completed successfully!');
    console.log(`
Next steps:
1. Edit the .env file with your production values
2. Configure your domain DNS to point to this server
3. Review Nginx configuration and update domain name
4. Set up monitoring with PM2 Plus (optional)
5. Set up regular backups using the maintenance script
    `);
}

// Run deployment if called directly
if (require.main === module) {
    deploy().catch(console.error);
}

module.exports = {
    deploy,
    checkRequirements,
    setupEnvironment,
    installDependencies,
    setupPM2,
    setupNginx,
    setupSSL
};