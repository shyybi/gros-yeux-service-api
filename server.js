const express = require('express');
const os = require('os');
const si = require('systeminformation');
const app = express();
const port = 3000;

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
	res.send('online');
});

app.get('/api/network-usage', async (req, res) => {
    const network = await si.networkStats();
    network.forEach(net => net.timestamp = new Date());
    res.json(network);
});

app.get('/api/ssh-sessions', async (req, res) => {
    const users = await si.users();
    const sshSessions = users.filter(user => user.tty.startsWith('pts/')).length;
    res.json({ sshSessions, timestamp: new Date() });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
