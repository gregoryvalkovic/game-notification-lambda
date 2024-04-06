const http = require("http");


const defaultOptions = {
    host: 'discord.com',
    port: 80, // or 443 for https
    headers: {
        'Content-Type': 'application/json',
    }
}

export const post = (path, payload) => new Promise((resolve, reject) => {
    const options = { ...defaultOptions, path, method: 'POST' };
    const req = http.request(options, res => {
        let buffer = "";
        res.on('data', chunk => buffer += chunk)
        res.on('end', () => resolve(JSON.parse(buffer)))
    });
    req.on('error', e => reject(e.message));
    req.write(JSON.stringify(payload));
    req.end();
})

