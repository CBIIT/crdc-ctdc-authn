const winston = require('winston');

const APP_NAME = process.env.APP_NAME || 'CTDC-AuthN';
const CADR_NAME = process.env.CADR_NAME || 'Cancer Data Service';
const NIH_ICO = process.env.NIH_ICO || 'NCI';
const DEST_IP = process.env.DEST_IP || undefined;
const DEST_PORT = process.env.DEST_PORT || undefined;

// NIH CADR structured JSON format — emits _time, app, cadr_name, nih_ico on every log entry
const nihFormat = winston.format.combine(
    winston.format.timestamp({ format: () => new Date().toISOString() }),
    winston.format.errors({ stack: true }),
    winston.format((info) => {
        info._time = info.timestamp;
        delete info.timestamp;
        info.app = APP_NAME;
        info.cadr_name = CADR_NAME;
        info.nih_ico = NIH_ICO;
        if (DEST_IP) info.dest_ip = DEST_IP;
        if (DEST_PORT) info.dest_port = DEST_PORT;
        return info;
    })(),
    winston.format.json()
);

if (!global.__CTDC_WINSTON_INITIALIZED__) {
    winston.configure({
        transports: [
            new winston.transports.Console({ format: nihFormat })
        ]
    });
    global.__CTDC_WINSTON_INITIALIZED__ = true;
}

/**
 * Extract NIH CADR required fields from an Express request object.
 * @param {object} req - Express request object
 * @returns {object} NIH CADR fields extractable from the request
 */
function extractRequestContext(req) {
    if (!req) return {};
    const context = {};
    if (req.sessionID) context.session_id = req.sessionID;
    const ip = req.ip
        || (req.connection && req.connection.remoteAddress)
        || (req.socket && req.socket.remoteAddress);
    if (ip) context.src_ip = ip;
    if (req.originalUrl || req.url) context.url = req.originalUrl || req.url;
    if (req.headers) {
        if (req.headers['user-agent']) context.http_user_agent = req.headers['user-agent'];
        if (req.headers['content-type']) context.http_content_type = req.headers['content-type'];
    }
    const localPort = req.socket && req.socket.localPort;
    if (localPort) context.dest_port = String(localPort);
    else if (DEST_PORT) context.dest_port = DEST_PORT;
    const localAddress = req.socket && req.socket.localAddress;
    if (localAddress) context.dest_ip = localAddress;
    else if (DEST_IP) context.dest_ip = DEST_IP;
    return context;
}

/**
 * Log a structured NIH CADR audit event.
 * @param {string} level - Winston log level (info, warn, error, debug)
 * @param {string} eventType - NIH CADR event type (e.g. Login, Logout, Download)
 * @param {object} eventData - Event-specific fields (user_id, user_email, status, etc.)
 * @param {object} [req] - Express request object — used to populate request-context fields
 */
function logAuditEvent(level, eventType, eventData, req) {
    const requestContext = extractRequestContext(req);
    winston[level]({
        event_type: eventType,
        ...requestContext,
        ...eventData,
    });
}

module.exports = winston;
module.exports.logAuditEvent = logAuditEvent;
module.exports.extractRequestContext = extractRequestContext;
