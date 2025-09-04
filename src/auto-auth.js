const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline-sync');

class AutoAuth {
    constructor() {
        this.tokenPath = path.join(process.cwd(), '.discord_token');
    }

    async getTokenAutomatically() {
        console.log(chalk.blue('🔄 Starting automated Discord authentication...'));
        
        try {
            // Try to get token from Discord desktop app first
            const desktopToken = await this.getDesktopToken();
            if (desktopToken) {
                console.log(chalk.green('✓ Token retrieved from Discord Desktop'));
                return desktopToken;
            }
        } catch (e) {
            console.log(chalk.yellow('Desktop token not available, trying browser...'));
        }

        // Use Puppeteer to login and get token
        return await this.getTokenViaBrowser();
    }

    async getDesktopToken() {
        // Try to get token from Discord's local storage
        const discordPaths = [
            path.join(process.env.APPDATA, 'discord', 'Local Storage', 'leveldb'),
            path.join(process.env.LOCALAPPDATA, 'Discord', 'Local Storage', 'leveldb')
        ];

        for (const dbPath of discordPaths) {
            if (fs.existsSync(dbPath)) {
                const files = fs.readdirSync(dbPath);
                for (const file of files) {
                    if (file.endsWith('.ldb') || file.endsWith('.log')) {
                        const content = fs.readFileSync(path.join(dbPath, file), 'utf8');
                        const tokenMatch = content.match(/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/);
                        if (tokenMatch) {
                            return tokenMatch[0];
                        }
                    }
                }
            }
        }
        return null;
    }

    async getTokenViaBrowser() {
        console.log(chalk.cyan('📱 Opening Discord login...'));
        
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null
        });

        const page = await browser.newPage();

        // Check if already logged in by going to Discord web
        await page.goto('https://discord.com/app', { waitUntil: 'networkidle2' });
        
        // Check if we need to login
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
            console.log(chalk.yellow('Please login to Discord in the browser window...'));
            
            // Wait for successful login (redirect to channels)
            await page.waitForFunction(
                () => window.location.href.includes('/channels/'),
                { timeout: 120000 } // 2 minutes to login
            );
        }

        console.log(chalk.green('✓ Logged in successfully'));
        console.log(chalk.blue('Extracting token...'));

        // Extract token from localStorage
        const token = await page.evaluate(() => {
            // Try multiple methods to get the token
            const getToken = () => {
                // Method 1: Direct localStorage
                const localToken = localStorage.getItem('token');
                if (localToken) return localToken.replace(/"/g, '');

                // Method 2: Through iframe
                try {
                    const iframe = document.createElement('iframe');
                    document.body.appendChild(iframe);
                    const iframeToken = iframe.contentWindow.localStorage.token;
                    iframe.remove();
                    if (iframeToken) return iframeToken.replace(/"/g, '');
                } catch (e) {}

                // Method 3: Through webpack
                try {
                    const req = window.webpackChunkdiscord_app.push([
                        [Math.random()], 
                        {}, 
                        (req) => {
                            for (const m of Object.keys(req.c).map((x) => req.c[x].exports).filter((x) => x)) {
                                if (m.default && m.default.getToken) {
                                    return m.default.getToken();
                                }
                                if (m.getToken) {
                                    return m.getToken();
                                }
                            }
                        }
                    ]);
                    if (req) return req;
                } catch (e) {}

                return null;
            };

            return getToken();
        });

        await browser.close();

        if (token) {
            console.log(chalk.green('✓ Token extracted successfully'));
            this.saveToken(token);
            return token;
        } else {
            throw new Error('Could not extract token');
        }
    }

    async quickAuth() {
        // Check for saved token first
        if (fs.existsSync(this.tokenPath)) {
            const savedToken = fs.readFileSync(this.tokenPath, 'utf8').trim();
            if (savedToken) {
                console.log(chalk.blue('Found saved token, validating...'));
                const isValid = await this.validateToken(savedToken);
                if (isValid) {
                    console.log(chalk.green('✓ Saved token is valid'));
                    return savedToken;
                }
            }
        }

        // Try automated extraction
        try {
            const token = await this.getTokenAutomatically();
            if (token) {
                const isValid = await this.validateToken(token);
                if (isValid) {
                    this.saveToken(token);
                    return token;
                }
            }
        } catch (error) {
            console.log(chalk.red('Automated auth failed:', error.message));
        }

        // Fall back to manual input
        console.log(chalk.yellow('\n⚠️ Automated authentication failed'));
        console.log(chalk.cyan('Please get your token manually:'));
        console.log('1. Open Discord in browser');
        console.log('2. Press F12 → Console');
        console.log('3. Paste: (webpackChunkdiscord_app.push([[\'\'],[],q=>Object.values(q.c).find(e=>e.exports?.default?.getToken).exports.default.getToken()]))');
        console.log('4. Copy the token');
        
        const token = readline.question('\nPaste your token here: ', { hideEchoBack: true });
        
        if (await this.validateToken(token)) {
            this.saveToken(token);
            return token;
        }
        
        throw new Error('Invalid token');
    }

    async validateToken(token) {
        try {
            const fetch = require('node-fetch');
            const response = await fetch('https://discord.com/api/v9/users/@me', {
                headers: { 'Authorization': token }
            });
            
            if (response.status === 200) {
                const user = await response.json();
                console.log(chalk.green(`✓ Token valid for: ${user.username}#${user.discriminator}`));
                return true;
            }
        } catch (error) {
            console.log(chalk.red('Token validation failed'));
        }
        return false;
    }

    saveToken(token) {
        fs.writeFileSync(this.tokenPath, token, 'utf8');
        console.log(chalk.green('✓ Token saved for future use'));
    }
}

module.exports = AutoAuth;

// If run directly
if (require.main === module) {
    const auth = new AutoAuth();
    auth.quickAuth().then(token => {
        console.log(chalk.green('\n✅ Authentication successful!'));
        console.log(chalk.cyan('Token has been saved. You can now use the web interface.'));
    }).catch(error => {
        console.log(chalk.red('\n❌ Authentication failed:', error.message));
    });
}