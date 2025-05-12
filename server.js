const express = require('express');
const os = require('os');
const si = require('systeminformation');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/ram-usage', (req, res) => {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const ramUsage = {
        totalMemory,
        freeMemory,
        usedMemory,
        usagePercentage: (usedMemory / totalMemory) * 100,
        timestamp: new Date()
    };
    res.json(ramUsage);
});

app.get('/api/cpu-usage', async (req, res) => {
    const cpu = await si.currentLoad();
    cpu.timestamp = new Date();
    res.json(cpu);
});

app.get('/api/gpu-usage', async (req, res) => {
    const gpu = await si.graphics();
    gpu.timestamp = new Date();
    res.json(gpu);
});

app.get('/api/disk-usage', async (req, res) => {
    const disks = await si.fsSize();
    disks.forEach(disk => disk.timestamp = new Date());
    res.json(disks);
});

app.get('/api/status', (req, res) => {
	res.json({ status: 'online' });
});

app.get('/api/network-usage', async (req, res) => {
    const network = await si.networkStats();
    network.forEach(net => net.timestamp = new Date());
    res.json(network);
});

app.get('/api/ssh-sessions', async (req, res) => {
    const users = await si.users();
    const sshSessions = users.filter(user => user.tty.startsWith('pts/')).map(user => ({
        user: user.user,
        ip: user.ip,
        timestamp: new Date().toLocaleString()
    }));
    res.json({ sshSessions, timestamp: new Date().toLocaleString() });
});

const lastUserCache = {
    data: null,
    timestamp: 0
};

app.get('/api/last-user', async (req, res) => {
    const now = Date.now();
    if (now - lastUserCache.timestamp > 5000) {
        const users = await si.users();
        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }
        const lastUser = users[users.length - 1];
        const ip = lastUser.ip.split(':')[0] || 'Unknown'; // Ensure IP is not empty and only take IPv4 part
        const hostname = lastUser.host || 'Unknown';

        let location = 'Unknown';
        try {
            const response = await axios.get(`http://ip-api.com/json/${ip}`);
            location = response.data.city + ', ' + response.data.country;
        } catch (error) {
            console.error('Error fetching IP location:', error);
        }

        const startTime = new Date(lastUser.startTime).toLocaleString();
        const endTime = lastUser.endTime ? new Date(lastUser.endTime).toLocaleString() : 'N/A';

        lastUserCache.data = {
            user: lastUser.user,
            ip,
            hostname,
            location,
            startTime,
            endTime,
            timestamp: new Date().toLocaleString()
        };
        lastUserCache.timestamp = now;
    }
    res.json(lastUserCache.data);
});

app.get('/api/cpu-temperature', async (req, res) => {
    try {
        const cpuTemperature = await si.cpuTemperature();
        res.json({ temperature: cpuTemperature.main, timestamp: new Date() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch CPU temperature' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
