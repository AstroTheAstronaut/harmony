const Log = require('../../models/Log');

async function getAuditLogs() {
    try {
        // Fetch all logs
        const logs = await Log.find();
        // Sort logs by type and timestamp
        let requestLogs = [];
        let userLoginLogs = [];
        let userActivityLogs = [];
        let systemEventLogs = [];
        logs.forEach(log => {
            switch (log.type) {
                case 'song_request':
                    requestLogs.push(log);
                    break;
                case 'user_login':
                    userLoginLogs.push(log);
                    break;
                case 'user_activity':
                    userActivityLogs.push(log);
                    break;
                case 'system_event':
                    systemEventLogs.push(log);
                    break;
            }
        });
        // Sort each log type by timestamp
        requestLogs.sort((a, b) => b.timestamp - a.timestamp);
        userLoginLogs.sort((a, b) => b.timestamp - a.timestamp);
        userActivityLogs.sort((a, b) => b.timestamp - a.timestamp);
        systemEventLogs.sort((a, b) => b.timestamp - a.timestamp);
        // Return the sorted logs
        return {
            requestLogs,
            userLoginLogs,
            userActivityLogs,
            systemEventLogs
        }
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        throw new Error('Failed to fetch audit logs');
    }
}

async function addLog() {
    try {
        // Get stuff from ejs
        const { type, user, songTitle, bookTitle, ipAddress, activity, event, description } = this.req.body;
        // Create a new log entry
    } catch (err) {
        console.error('Error adding log:', err);
        throw new Error('Failed to add log');
    }
}