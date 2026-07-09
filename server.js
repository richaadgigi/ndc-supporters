const http = require('http');
const { parse } = require('url');
const next = require('next');

const port = process.env.PORT || 3004;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    http.createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(port, (err) => {
        if (err) {
            console.error('Failed to start server:', err);
            process.exit(1);
        }
        console.log(`> Ready on http://localhost:${port}`);
    });
}).catch((err) => {
    console.error('Error during app prepare:', err);
    process.exit(1);
});
