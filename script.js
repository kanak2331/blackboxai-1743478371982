// Global Variables
let currentUser = null;
let currentMechanic = null;
let currentAdmin = null;
let map;
let serviceRequestMarkers = [];
let facilityMarkers = [];

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on current page
    if (document.querySelector('body').classList.contains('bg-gray-100')) {
        initUserPanel();
    } else if (document.querySelector('nav').classList.contains('bg-orange-600')) {
        initMechanicPanel();
    } else if (document.querySelector('nav').classList.contains('bg-purple-600')) {
        initAdminPanel();
    }
});

// ======================
// USER PANEL FUNCTIONS
// ======================
function initUserPanel() {
    // Initialize Map
    initMap();

    // Event Listeners
    document.getElementById('getLocation').addEventListener('click', getCurrentLocation);
    document.getElementById('requestForm').addEventListener('submit', handleServiceRequest);
    document.getElementById('showChargers').addEventListener('click', () => findNearbyFacilities('ev_charger'));
    document.getElementById('showPumps').addEventListener('click', () => findNearbyFacilities('gas_station'));

    // Load available mechanics
    loadAvailableMechanics();
}

function initMap() {
    const mapOptions = {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 12
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                document.getElementById('location').value = `${pos.lat}, ${pos.lng}`;
                map.setCenter(pos);
                new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    }
                });
            },
            () => {
                alert('Error: The Geolocation service failed or your browser doesn\'t support geolocation.');
            }
        );
    } else {
        alert('Error: Your browser doesn\'t support geolocation.');
    }
}

function handleServiceRequest(e) {
    e.preventDefault();
    
    const vehicleType = document.querySelector('input[name="vehicleType"]:checked').value;
    const issue = document.getElementById('issue').value;
    const location = document.getElementById('location').value;

    if (!location) {
        alert('Please get your location first');
        return;
    }

    // In a real app, this would be an API call
    const requestData = {
        id: Date.now(),
        userId: currentUser?.id || 'guest',
        vehicleType,
        issue,
        location,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    // Save to localStorage for demo purposes
    const requests = JSON.parse(localStorage.getItem('serviceRequests') || '[]');
    requests.push(requestData);
    localStorage.setItem('serviceRequests', JSON.stringify(requests));

    alert('Service request submitted successfully!');
    document.getElementById('requestForm').reset();
}

function loadAvailableMechanics() {
    // Mock data for demo
    const mockMechanics = [
        { id: 1, name: 'John AutoCare', specialization: 'engine', rating: 4.8, distance: '2.3 km', available: true },
        { id: 2, name: 'EV Specialists', specialization: 'ev', rating: 4.9, distance: '3.1 km', available: true },
        { id: 3, name: 'Quick Fix Garage', specialization: 'both', rating: 4.5, distance: '1.7 km', available: false }
    ];

    const mechanicsList = document.getElementById('mechanicsList');
    mechanicsList.innerHTML = '';

    mockMechanics.filter(m => m.available).forEach(mechanic => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md facility-card';
        card.innerHTML = `
            <div class="flex items-center mb-2">
                <div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <i class="fas fa-user text-gray-600 text-xl"></i>
                </div>
                <div>
                    <h3 class="font-bold">${mechanic.name}</h3>
                    <p class="text-sm text-gray-600">${mechanic.specialization === 'both' ? 'EV & Engine' : mechanic.specialization.toUpperCase()}</p>
                </div>
            </div>
            <div class="flex justify-between items-center text-sm">
                <span class="text-yellow-500">
                    ${'★'.repeat(Math.floor(mechanic.rating))}${'☆'.repeat(5 - Math.floor(mechanic.rating))}
                </span>
                <span>${mechanic.distance} away</span>
            </div>
            <button class="w-full mt-3 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition">
                Select Mechanic
            </button>
        `;
        mechanicsList.appendChild(card);
    });
}

function findNearbyFacilities(type) {
    // Clear previous markers
    facilityMarkers.forEach(marker => marker.setMap(null));
    facilityMarkers = [];

    const service = new google.maps.places.PlacesService(map);
    const request = {
        location: map.getCenter(),
        radius: '5000',
        type: [type]
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            const facilitiesList = document.getElementById('facilitiesList');
            facilitiesList.innerHTML = '';

            results.slice(0, 6).forEach(place => {
                // Add marker
                const marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name
                });
                facilityMarkers.push(marker);

                // Add to list
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded-lg shadow-md facility-card';
                card.innerHTML = `
                    <h3 class="font-bold mb-1">${place.name}</h3>
                    <p class="text-sm text-gray-600 mb-2">${place.vicinity}</p>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-yellow-500">
                            ${'★'.repeat(place.rating ? Math.floor(place.rating) : 0)}${'☆'.repeat(5 - (place.rating ? Math.floor(place.rating) : 0))}
                        </span>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}" 
                           target="_blank" 
                           class="text-blue-600 hover:text-blue-800">
                            Directions
                        </a>
                    </div>
                `;
                facilitiesList.appendChild(card);
            });
        }
    });
}

// ======================
// MECHANIC PANEL FUNCTIONS
// ======================
function initMechanicPanel() {
    // Initialize Map
    const mapOptions = {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 12
    };
    const requestMap = new google.maps.Map(document.getElementById('requestMap'), mapOptions);

    // Event Listeners
    document.getElementById('toggleAvailability').addEventListener('click', toggleAvailability);
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', updateRequestStatus);
    });

    // Load assignments
    loadAssignments();
}

function toggleAvailability() {
    const statusElement = document.getElementById('availabilityStatus');
    const isAvailable = statusElement.classList.contains('bg-green-500');
    
    if (isAvailable) {
        statusElement.classList.remove('bg-green-500');
        statusElement.classList.add('bg-red-500');
        document.querySelector('#toggleAvailability + span').textContent = 'Unavailable';
    } else {
        statusElement.classList.remove('bg-red-500');
        statusElement.classList.add('bg-green-500');
        document.querySelector('#toggleAvailability + span').textContent = 'Available';
    }
}

function loadAssignments() {
    // Mock data for demo
    const mockAssignments = [
        { 
            id: 1, 
            userId: 'user123', 
            userName: 'Alex Johnson',
            vehicleType: 'ev',
            issue: 'Battery not charging',
            location: { lat: -34.397, lng: 150.644 },
            status: 'assigned',
            createdAt: '2023-05-15T10:30:00Z'
        }
    ];

    const assignmentsContainer = document.getElementById('currentAssignments');
    assignmentsContainer.innerHTML = '';

    mockAssignments.forEach(assignment => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md request-card';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold">Request #${assignment.id}</h3>
                <span class="px-2 py-1 text-xs rounded ${
                    assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    assignment.status === 'enroute' ? 'bg-yellow-100 text-yellow-800' :
                    assignment.status === 'working' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                }">
                    ${assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </span>
            </div>
            <p class="text-sm mb-1"><strong>User:</strong> ${assignment.userName}</p>
            <p class="text-sm mb-1"><strong>Vehicle:</strong> ${assignment.vehicleType === 'ev' ? 'Electric Vehicle' : 'Internal Combustion'}</p>
            <p class="text-sm mb-3"><strong>Issue:</strong> ${assignment.issue}</p>
            <p class="text-xs text-gray-500">Received: ${new Date(assignment.createdAt).toLocaleString()}</p>
        `;
        assignmentsContainer.appendChild(card);

        // Add marker to map
        new google.maps.Marker({
            position: assignment.location,
            map: document.getElementById('requestMap'),
            title: `Request #${assignment.id}`,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
        });
    });
}

function updateRequestStatus(e) {
    const status = e.target.dataset.status;
    alert(`Request status updated to: ${status.charAt(0).toUpperCase() + status.slice(1)}`);
    // In real app, would update the request in the database
}

// ======================
// ADMIN PANEL FUNCTIONS
// ======================
function initAdminPanel() {
    // Load all data
    loadUsers();
    loadMechanics();
    loadServiceRequests();

    // Update dashboard counts
    updateDashboardCounts();
}

function loadUsers() {
    // Mock data for demo
    const mockUsers = [
        { id: 'user1', name: 'Alex Johnson', email: 'alex@example.com', vehicleType: 'ev' },
        { id: 'user2', name: 'Sam Wilson', email: 'sam@example.com', vehicleType: 'engine' }
    ];

    const usersTable = document.getElementById('usersTable');
    usersTable.innerHTML = '';

    mockUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.vehicleType === 'ev' ? 'Electric Vehicle' : 'Internal Combustion'}</td>
            <td>
                <button class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        usersTable.appendChild(row);
    });
}

function loadMechanics() {
    // Mock data for demo
    const mockMechanics = [
        { id: 'mec1', name: 'John AutoCare', specialization: 'engine', status: 'available', location: 'Downtown' },
        { id: 'mec2', name: 'EV Specialists', specialization: 'ev', status: 'busy', location: 'North District' }
    ];

    const mechanicsTable = document.getElementById('mechanicsTable');
    mechanicsTable.innerHTML = '';

    mockMechanics.forEach(mechanic => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${mechanic.id}</td>
            <td>${mechanic.name}</td>
            <td>${mechanic.specialization === 'both' ? 'EV & Engine' : mechanic.specialization.toUpperCase()}</td>
            <td>
                <span class="px-2 py-1 text-xs rounded ${
                    mechanic.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${mechanic.status.charAt(0).toUpperCase() + mechanic.status.slice(1)}
                </span>
            </td>
            <td>${mechanic.location}</td>
            <td>
                <button class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        mechanicsTable.appendChild(row);
    });
}

function loadServiceRequests() {
    // Mock data for demo
    const mockRequests = [
        { 
            id: 'req1', 
            userId: 'user1', 
            userName: 'Alex Johnson',
            vehicleType: 'ev',
            mechanicId: 'mec2',
            mechanicName: 'EV Specialists',
            status: 'assigned',
            createdAt: '2023-05-15T10:30:00Z'
        }
    ];

    const requestsTable = document.getElementById('requestsTable');
    requestsTable.innerHTML = '';

    mockRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.userName}</td>
            <td>${request.vehicleType === 'ev' ? 'Electric Vehicle' : 'Internal Combustion'}</td>
            <td>${request.mechanicName || 'Unassigned'}</td>
            <td>
                <span class="px-2 py-1 text-xs rounded ${
                    request.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                    request.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                }">
                    ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
            </td>
            <td>${new Date(request.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        requestsTable.appendChild(row);
    });
}

function updateDashboardCounts() {
    // Mock counts for demo
    document.getElementById('totalUsers').textContent = '24';
    document.getElementById('activeMechanics').textContent = '8';
    document.getElementById('pendingRequests').textContent = '5';
}