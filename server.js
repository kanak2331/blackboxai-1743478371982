const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        users: [],
        mechanics: [],
        serviceRequests: [],
        facilities: []
    }, null, 2));
}

// Helper function to read data
function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Helper function to write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes

// Users Endpoints
app.get('/api/users', (req, res) => {
    const data = readData();
    res.json(data.users);
});

app.post('/api/users', (req, res) => {
    const data = readData();
    const newUser = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeData(data);
    res.status(201).json(newUser);
});

// Mechanics Endpoints
app.get('/api/mechanics', (req, res) => {
    const data = readData();
    res.json(data.mechanics);
});

app.post('/api/mechanics', (req, res) => {
    const data = readData();
    const newMechanic = {
        id: Date.now().toString(),
        ...req.body,
        available: true,
        createdAt: new Date().toISOString()
    };
    data.mechanics.push(newMechanic);
    writeData(data);
    res.status(201).json(newMechanic);
});

// Service Requests Endpoints
app.get('/api/requests', (req, res) => {
    const data = readData();
    res.json(data.serviceRequests);
});

app.post('/api/requests', (req, res) => {
    const data = readData();
    const newRequest = {
        id: Date.now().toString(),
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    data.serviceRequests.push(newRequest);
    writeData(data);
    res.status(201).json(newRequest);
});

app.put('/api/requests/:id', (req, res) => {
    const data = readData();
    const requestIndex = data.serviceRequests.findIndex(r => r.id === req.params.id);
    
    if (requestIndex === -1) {
        return res.status(404).json({ error: 'Request not found' });
    }

    data.serviceRequests[requestIndex] = {
        ...data.serviceRequests[requestIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    writeData(data);
    res.json(data.serviceRequests[requestIndex]);
});

// Facilities Endpoints
app.get('/api/facilities', (req, res) => {
    const { type, lat, lng, radius } = req.query;
    // In a real app, this would query a database or external API
    const mockFacilities = [
        {
            id: 'fac1',
            name: 'EV Charging Station',
            type: 'ev_charger',
            location: { lat: parseFloat(lat) + 0.01, lng: parseFloat(lng) + 0.01 },
            address: '123 Green Energy Way'
        },
        {
            id: 'fac2',
            name: 'City Gas Station',
            type: 'gas_station',
            location: { lat: parseFloat(lat) - 0.01, lng: parseFloat(lng) - 0.01 },
            address: '456 Main Street'
        }
    ].filter(f => f.type === type);
    
    res.json(mockFacilities);
});

// Dashboard Stats
app.get('/api/stats', (req, res) => {
    const data = readData();
    res.json({
        totalUsers: data.users.length,
        activeMechanics: data.mechanics.filter(m => m.available).length,
        pendingRequests: data.serviceRequests.filter(r => r.status === 'pending').length
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Documentation:`);
    console.log(`- GET /api/users - List all users`);
    console.log(`- POST /api/users - Create new user`);
    console.log(`- GET /api/mechanics - List all mechanics`);
    console.log(`- POST /api/mechanics - Create new mechanic`);
    console.log(`- GET /api/requests - List all service requests`);
    console.log(`- POST /api/requests - Create new service request`);
    console.log(`- PUT /api/requests/:id - Update service request`);
    console.log(`- GET /api/facilities - Find nearby facilities (type, lat, lng, radius params)`);
    console.log(`- GET /api/stats - Get dashboard statistics`);
});

// For development: seed initial data
if (process.env.NODE_ENV === 'development') {
    const data = readData();
    if (data.users.length === 0) {
        data.users = [
            { id: 'user1', name: 'Test User', email: 'test@example.com', vehicleType: 'ev' }
        ];
        data.mechanics = [
            { id: 'mec1', name: 'Test Mechanic', specialization: 'engine', available: true }
        ];
        writeData(data);
    }
}