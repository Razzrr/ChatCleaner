const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fetch = require('node-fetch');

class DiscordAuth {
    constructor() {
        this.token = null;
    }

    async getTokenFromBrowserCookies() {
        const browsers = [
            {
                name: 'Chrome',
                paths: [
                    path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Network', 'Cookies'),
                    path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Cookies')
                ]
            },
            {
                name: 'Edge',
                paths: [
                    path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Network', 'Cookies'),
                    path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cookies')
                ]
            },
            {
                name: 'Firefox',
                paths: [
                    path.join(process.env.APPDATA, 'Mozilla', 'Firefox', 'Profiles')
                ]
            }
        ];

        for (const browser of browsers) {
            for (const cookiePath of browser.paths) {
                if (browser.name === 'Firefox') {
                    const profilePath = this.findFirefoxProfile(cookiePath);
                    if (profilePath) {
                        const token = await this.extractFirefoxToken(profilePath);
                        if (token) {
                            console.log(chalk.green(`✓ Found token from ${browser.name}`));
                            return token;
                        }
                    }
                } else {
                    if (fs.existsSync(cookiePath)) {
                        const token = await this.extractChromiumToken(cookiePath);
                        if (token) {
                            console.log(chalk.green(`✓ Found token from ${browser.name}`));
                            return token;
                        }
                    }
                }
            }
        }
        return null;
    }

    findFirefoxProfile(profilesPath) {
        if (!fs.existsSync(profilesPath)) return null;
        
        const profiles = fs.readdirSync(profilesPath);
        for (const profile of profiles) {
            if (profile.includes('.default') || profile.includes('.default-release')) {
                const cookiesPath = path.join(profilesPath, profile, 'cookies.sqlite');
                if (fs.existsSync(cookiesPath)) {
                    return cookiesPath;
                }
            }
        }
        return null;
    }

    async extractFirefoxToken(cookiesPath) {
        return new Promise((resolve) => {
            const db = new sqlite3.Database(cookiesPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    resolve(null);
                    return;
                }

                db.all(
                    "SELECT value FROM moz_cookies WHERE host = '.discord.com' AND name = 'token'",
                    (err, rows) => {
                        db.close();
                        if (err || !rows || rows.length === 0) {
                            resolve(null);
                            return;
                        }
                        resolve(rows[0].value);
                    }
                );
            });
        });
    }

    async extractChromiumToken(cookiesPath) {
        const tempPath = path.join(process.env.TEMP, 'discord_cookies_temp.db');
        
        try {
            fs.copyFileSync(cookiesPath, tempPath);
            
            return new Promise((resolve) => {
                const db = new sqlite3.Database(tempPath, sqlite3.OPEN_READONLY, (err) => {
                    if (err) {
                        resolve(null);
                        return;
                    }

                    db.all(
                        "SELECT encrypted_value, value FROM cookies WHERE host_key = '.discord.com' AND name = 'token'",
                        async (err, rows) => {
                            db.close();
                            
                            try {
                                fs.unlinkSync(tempPath);
                            } catch {}
                            
                            if (err || !rows || rows.length === 0) {
                                resolve(null);
                                return;
                            }
                            
                            if (rows[0].value) {
                                resolve(rows[0].value);
                            } else {
                                resolve(null);
                            }
                        }
                    );
                });
            });
        } catch (error) {
            return null;
        }
    }

    async loginWithCredentials(email, password) {
        console.log(chalk.blue('Attempting login with credentials...'));
        console.log(chalk.yellow('Note: Due to Discord security, manual token entry may be more reliable.'));

        try {
            const browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
                defaultViewport: null
            });
            
            const page = await browser.newPage();
            
            await page.goto('https://discord.com/login', { waitUntil: 'networkidle2' });
            
            await page.waitForSelector('input[name="email"]', { timeout: 10000 });
            await page.type('input[name="email"]', email);
            await page.type('input[name="password"]', password);
            
            await page.keyboard.press('Enter');
            
            console.log(chalk.yellow('Please complete any 2FA/captcha if required...'));
            console.log(chalk.yellow('Waiting for successful login...'));
            
            await page.waitForFunction(
                () => window.location.href.includes('/channels/'),
                { timeout: 60000 }
            );
            
            // Wait for token to be available
            await page.waitForFunction(
                () => {
                    return window.localStorage.getItem('token') ||
                           (typeof webpackChunkdiscord_app !== 'undefined');
                },
                { timeout: 10000 }
            );

            const token = await page.evaluate(() => {
                // Try multiple methods to extract token
                const getToken = () => {
                    // Method 1: Check for token in localStorage (works for some versions)
                    const localToken = window.localStorage.getItem('token');
                    if (localToken) {
                        return localToken.replace(/['"]/g, '');
                    }

                    // Method 2: Try to access via Discord's webpack modules
                    try {
                        const mods = webpackChunkdiscord_app.push([[Symbol()], {}, q => Object.values(q.c)]);
                        webpackChunkdiscord_app.pop();
                        const findModule = (filter) => {
                            for (const m of mods) {
                                if (!m.exports) continue;
                                if (filter(m.exports)) return m.exports;
                                for (const ex in m.exports) {
                                    if (filter(m.exports[ex])) return m.exports[ex];
                                }
                            }
                        };
                        const tokenModule = findModule(m => m?.default?.getToken || m?.getToken);
                        if (tokenModule) {
                            const token = tokenModule.default?.getToken?.() || tokenModule.getToken?.();
                            if (token) return token;
                        }
                    } catch (e) {
                        console.error('Webpack method failed:', e);
                    }

                    // Method 3: Try XMLHttpRequest override
                    try {
                        let token = null;
                        const originalOpen = XMLHttpRequest.prototype.open;
                        XMLHttpRequest.prototype.open = function() {
                            const authorization = this.getRequestHeader?.('Authorization');
                            if (authorization) {
                                token = authorization;
                            }
                            return originalOpen.apply(this, arguments);
                        };

                        // Trigger a request to get the token
                        const req = new XMLHttpRequest();
                        req.open('GET', '/api/v9/users/@me');
                        const authHeader = req.getRequestHeader?.('Authorization');
                        if (authHeader) return authHeader;

                        XMLHttpRequest.prototype.open = originalOpen;
                    } catch (e) {
                        console.error('XMLHttpRequest method failed:', e);
                    }

                    return null;
                };

                return getToken();
            });
            
            await browser.close();
            
            if (token) {
                console.log(chalk.green('✓ Successfully logged in and retrieved token'));
                return token;
            }
            
        } catch (error) {
            console.log(chalk.red('Login failed:', error.message));
        }
        
        return null;
    }

    async autoAuthenticate() {
        console.log(chalk.blue('🔄 Attempting automatic authentication...'));
        
        // Try saved token first
        const savedToken = this.loadSavedToken();
        if (savedToken) {
            const user = await this.validateToken(savedToken);
            if (user) {
                console.log(chalk.green(`✓ Using saved token for ${user.username}`));
                return savedToken;
            }
        }
        
        // Try to auto-login with browser
        const AutoAuth = require('./auto-auth');
        const autoAuth = new AutoAuth();
        
        try {
            const token = await autoAuth.getTokenAutomatically();
            if (token) {
                this.saveToken(token);
                return token;
            }
        } catch (error) {
            console.log(chalk.yellow('Auto-authentication failed, please use manual method'));
        }
        
        return null;
    }

    async loginWithQRCode() {
        console.log(chalk.blue('Opening QR code login...'));
        
        try {
            const browser = await puppeteer.launch({ 
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            await page.goto('https://discord.com/login', { waitUntil: 'networkidle2' });
            
            console.log(chalk.yellow('Please scan the QR code with your Discord mobile app...'));
            
            await page.waitForFunction(
                () => window.location.href.includes('/channels/'),
                { timeout: 120000 }
            );
            
            const token = await page.evaluate(() => {
                const getToken = () => {
                    const iframe = document.createElement('iframe');
                    document.body.appendChild(iframe);
                    const token = iframe.contentWindow.localStorage.token;
                    iframe.remove();
                    return token;
                };
                
                const token = getToken() || localStorage.getItem('token');
                return token ? token.replace(/"/g, '') : null;
            });
            
            await browser.close();
            
            if (token) {
                console.log(chalk.green('✓ Successfully logged in via QR code'));
                return token;
            }
            
        } catch (error) {
            console.log(chalk.red('QR login failed:', error.message));
        }
        
        return null;
    }

    async validateToken(token) {
        try {
            // Clean token
            const cleanToken = token.replace(/['"]/g, '').trim();

            const response = await fetch('https://discord.com/api/v9/users/@me', {
                headers: {
                    'Authorization': cleanToken,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (response.status === 200) {
                const user = await response.json();
                console.log(chalk.green(`✓ Token validated for user: ${user.username}`));
                return user;
            } else if (response.status === 401) {
                console.log(chalk.red('Token is invalid or expired'));
            } else {
                console.log(chalk.red(`Validation failed with status: ${response.status}`));
            }
        } catch (error) {
            console.log(chalk.red('Token validation error:', error.message));
            return null;
        }

        return null;
    }

    saveToken(token) {
        // Token saving disabled for privacy - tokens should not be stored
        // const configPath = path.join(process.cwd(), '.discord_token');
        // fs.writeFileSync(configPath, token, 'utf8');
        console.log(chalk.yellow('⚠️ Token saving is disabled for privacy'));
    }

    loadSavedToken() {
        const configPath = path.join(process.cwd(), '.discord_token');
        if (fs.existsSync(configPath)) {
            return fs.readFileSync(configPath, 'utf8').trim();
        }
        return null;
    }
}

module.exports = DiscordAuth;