const express = require('express');
const path = require('path');
const { addDevice, getDevices, removeDevice } = require('./src/MultipleDevices');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api/devices', (req, res) => {
  res.json(getDevices());
});

app.post('/api/pair', async (req, res) => {
  try {
    let { number } = req.body;
    if (!number) return res.json({ error: "Enter your WhatsApp number" });
    number = number.replace(/[^0-9]/g, '');
    // NO QR - Pairing Code Only
    const code = await addDevice(number);
    res.json({ code });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.post('/api/remove', async (req, res) => {
  try {
    await removeDevice(req.body.number);
    res.json({ ok: true });
  } catch (e) {
    res.json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MINI ZYRA running on port ${PORT}`);
  console.log(`Pair Page: http://localhost:${PORT}`);
  console.log(`Pairing Method: CODE ONLY - No QR in terminal`);
});
