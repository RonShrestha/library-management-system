/* ============================================
   FARM MANAGEMENT SYSTEM - APPLICATION LOGIC
   sql.js Database in Browser (WASM)
   ============================================ */

let db; // Global database instance
let SQL; // Global SQL.js instance

// ============================================
// DATABASE INITIALIZATION
// ============================================

/**
 * Initialize the sql.js WASM library and create database schema.
 * This function:
 * 1. Loads the sql.js WebAssembly module
 * 2. Creates an in-memory SQLite database
 * 3. Defines tables: Users, Crops, Inventory with relationships
 * 4. Seeds the database with initial data
 */
async function initDatabase() {
    try {
        // Initialize sql.js from CDN
        SQL = await initSqlJs();
        
        // Create new in-memory database
        db = new SQL.Database();
        console.log('✅ SQLite Database initialized in memory');

        // Create Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                role TEXT NOT NULL
            )
        `);
        console.log('✅ Users table created');

        // Create Crops table with foreign key to Users
        db.run(`
            CREATE TABLE IF NOT EXISTS Crops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                user_id INTEGER,
                FOREIGN KEY(user_id) REFERENCES Users(id)
            )
        `);
        console.log('✅ Crops table created');

        // Create Inventory table with foreign key to Crops
        db.run(`
            CREATE TABLE IF NOT EXISTS Inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                crop_id INTEGER,
                FOREIGN KEY(crop_id) REFERENCES Crops(id)
            )
        `);
        console.log('✅ Inventory table created');

        // Seed Users table with initial data
        db.run(`
            INSERT INTO Users (username, role) VALUES
            ('Ramesh Kumar', 'Farm Manager'),
            ('Priya Patel', 'Assistant Farmer'),
            ('Arjun Singh', 'Agronomist')
        `);
        console.log('✅ Users table seeded with 3 records');

        // Seed Crops table with initial data
        db.run(`
            INSERT INTO Crops (name, type, status, user_id) VALUES
            ('Wheat Field A', 'Cereal', 'Growing', 1),
            ('Tomato Greenhouse', 'Vegetable', 'Growing', 2),
            ('Mango Orchard', 'Fruit', 'Ready for Harvest', 1)
        `);
        console.log('✅ Crops table seeded with 3 records');

        // Seed Inventory table with initial data
        db.run(`
            INSERT INTO Inventory (item_name, quantity, crop_id) VALUES
            ('Fertilizer (kg)', 150, 1),
            ('Pesticide (liters)', 50, 2),
            ('Harvest Baskets', 75, 3),
            ('Irrigation Hose (meters)', 200, 1)
        `);
        console.log('✅ Inventory table seeded with 4 records');

        // Initialize UI after database is ready
        initializeUI();
        loadDashboard();
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
}

// ============================================
// UI INITIALIZATION & EVENT LISTENERS
// ============================================

/**
 * Initialize all UI event listeners and page navigation.
 */
function initializeUI() {
    // Navigation buttons
    document.getElementById('homeBtn').addEventListener('click', () => {
        switchPage('homePage');
        loadDashboard();
    });
    
    document.getElementById('recordsBtn').addEventListener('click', () => {
        switchPage('recordsPage');
        loadCropsTable();
    });

    // Tab navigation in Records page
    document.getElementById('cropsTabBtn').addEventListener('click', () => switchTab('crops'));
    document.getElementById('inventoryTabBtn').addEventListener('click', () => switchTab('inventory'));

    // Crop Form Events
    document.getElementById('addCropBtn').addEventListener('click', () => openCropModal());
    document.getElementById('closeCropModal').addEventListener('click', () => closeCropModal());
    document.getElementById('cropForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveCrop();
    });
    document.getElementById('cropSearch').addEventListener('input', () => searchCrops());

    // Inventory Form Events
    document.getElementById('addInventoryBtn').addEventListener('click', () => openInventoryModal());
    document.getElementById('closeInventoryModal').addEventListener('click', () => closeInventoryModal());
    document.getElementById('inventoryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveInventory();
    });
    document.getElementById('inventorySearch').addEventListener('input', () => searchInventory());

    // Load initial data
    populateUserSelect();
    populateCropSelect();

    console.log('✅ UI initialized with event listeners');
}

// ============================================
// PAGE NAVIGATION
// ============================================

/**
 * Switch between Home Page and Records Page.
 * Hides all pages and shows the selected one.
 * @param {string} pageId - ID of the page to display
 */
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

/**
 * Switch between Crops and Inventory tabs within Records Page.
 * @param {string} tab - 'crops' or 'inventory'
 */
function switchTab(tab) {
    const cropsTab = document.getElementById('cropsTab');
    const inventoryTab = document.getElementById('inventoryTab');
    const cropBtn = document.getElementById('cropsTabBtn');
    const inventoryBtn = document.getElementById('inventoryTabBtn');

    if (tab === 'crops') {
        cropsTab.classList.remove('hidden');
        inventoryTab.classList.add('hidden');
        cropBtn.classList.add('active');
        inventoryBtn.classList.remove('active');
        loadCropsTable();
    } else {
        cropsTab.classList.add('hidden');
        inventoryTab.classList.remove('hidden');
        cropBtn.classList.remove('active');
        inventoryBtn.classList.add('active');
        loadInventoryTable();
    }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

/**
 * Load and display the dashboard with metrics and summary tables.
 * Queries database for:
 * - Total count of users, crops, inventory items
 * - List of all users
 * - Status breakdown of crops
 */
function loadDashboard() {
    try {
        // Get total counts using COUNT() aggregate function
        const userCount = db.exec(`SELECT COUNT(*) as count FROM Users`)[0]?.values[0]?.[0] || 0;
        const cropCount = db.exec(`SELECT COUNT(*) as count FROM Crops`)[0]?.values[0]?.[0] || 0;
        const inventoryCount = db.exec(`SELECT COUNT(*) as count FROM Inventory`)[0]?.values[0]?.[0] || 0;

        // Update metric cards
        document.getElementById('totalUsers').textContent = userCount;
        document.getElementById('totalCrops').textContent = cropCount;
        document.getElementById('totalInventory').textContent = inventoryCount;

        // Load users list
        loadDashboardUsers();

        // Load crop status summary
        loadCropStatusSummary();

        console.log(`✅ Dashboard loaded: ${userCount} users, ${cropCount} crops, ${inventoryCount} items`);
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
    }
}

/**
 * Load and display users list in dashboard.
 */
function loadDashboardUsers() {
    try {
        const result = db.exec(`SELECT id, username, role FROM Users`);
        const usersList = document.getElementById('dashboardUsersList');
        usersList.innerHTML = ''; // Clear existing rows

        if (result[0]?.values) {
            result[0].values.forEach(user => {
                const [id, username, role] = user;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-4 py-2">${username}</td>
                    <td class="px-4 py-2 text-gray-600">${role}</td>
                `;
                usersList.appendChild(row);
            });
        }
    } catch (error) {
        console.error('❌ Error loading dashboard users:', error);
    }
}

/**
 * Load and display crop status summary in dashboard.
 * Shows count of crops by status (Growing, Ready for Harvest, Harvested).
 */
function loadCropStatusSummary() {
    try {
        const result = db.exec(`
            SELECT status, COUNT(*) as count FROM Crops GROUP BY status
        `);
        
        const statusDiv = document.getElementById('dashboardCropsStatus');
        statusDiv.innerHTML = ''; // Clear existing content

        if (result[0]?.values) {
            result[0].values.forEach(row => {
                const [status, count] = row;
                const statusDiv = document.getElementById('dashboardCropsStatus');
                const statusElement = document.createElement('div');
                statusElement.className = 'flex justify-between items-center py-2 px-3 bg-white rounded mb-2 border border-gray-200';
                statusElement.innerHTML = `
                    <span class="font-semibold text-gray-700">${status}</span>
                    <span class="bg-green-600 text-white px-3 py-1 rounded-full font-bold">${count}</span>
                `;
                statusDiv.appendChild(statusElement);
            });
        } else {
            statusDiv.innerHTML = '<p class="text-gray-500">No crops data available</p>';
        }
    } catch (error) {
        console.error('❌ Error loading crop status summary:', error);
    }
}

// ============================================
// CROPS CRUD OPERATIONS
// ============================================

/**
 * Load and display all crops in the crops table.
 * Executes: SELECT * FROM Crops with JOIN to get farmer names
 */
function loadCropsTable() {
    try {
        const result = db.exec(`
            SELECT Crops.id, Crops.name, Crops.type, Crops.status, Users.username
            FROM Crops
            LEFT JOIN Users ON Crops.user_id = Users.id
            ORDER BY Crops.id DESC
        `);

        const cropsList = document.getElementById('cropsList');
        cropsList.innerHTML = ''; // Clear existing rows

        if (result[0]?.values) {
            result[0].values.forEach(crop => {
                const [id, name, type, status, username] = crop;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-300 px-4 py-2">${id}</td>
                    <td class="border border-gray-300 px-4 py-2 font-semibold">${name}</td>
                    <td class="border border-gray-300 px-4 py-2">${type}</td>
                    <td class="border border-gray-300 px-4 py-2">
                        <span class="px-3 py-1 rounded-full text-sm font-semibold ${
                            status === 'Growing' ? 'bg-blue-100 text-blue-800' :
                            status === 'Ready for Harvest' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }">${status}</span>
                    </td>
                    <td class="border border-gray-300 px-4 py-2">${username || 'N/A'}</td>
                    <td class="border border-gray-300 px-4 py-2 text-center">
                        <button onclick="editCrop(${id})" class="action-btn edit-btn">✏️ Edit</button>
                        <button onclick="deleteCrop(${id})" class="action-btn delete-btn">🗑️ Delete</button>
                    </td>
                `;
                cropsList.appendChild(row);
            });
        } else {
            cropsList.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No crops found. Add one to get started!</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error loading crops table:', error);
    }
}

/**
 * Open the Add Crop modal form.
 * Resets form fields and sets modal title to "Add Crop".
 */
function openCropModal() {
    document.getElementById('cropId').value = '';
    document.getElementById('cropForm').reset();
    document.getElementById('cropModalTitle').textContent = 'Add Crop';
    document.getElementById('cropModal').classList.remove('hidden');
}

/**
 * Close the Add/Edit Crop modal.
 */
function closeCropModal() {
    document.getElementById('cropModal').classList.add('hidden');
    document.getElementById('cropForm').reset();
}

/**
 * Save a new crop or update existing crop.
 * Validates form inputs before executing INSERT or UPDATE query.
 */
function saveCrop() {
    const cropId = document.getElementById('cropId').value;
    const name = document.getElementById('cropName').value.trim();
    const type = document.getElementById('cropType').value;
    const status = document.getElementById('cropStatus').value;
    const userId = document.getElementById('cropUserId').value;

    // Client-side form validation
    if (!name || !type || !status || !userId) {
        alert('❌ All fields are required!');
        return;
    }

    try {
        if (cropId) {
            // UPDATE existing crop
            db.run(
                `UPDATE Crops SET name = ?, type = ?, status = ?, user_id = ? WHERE id = ?`,
                [name, type, status, userId, cropId]
            );
            console.log(`✅ Crop ${cropId} updated`);
        } else {
            // INSERT new crop
            db.run(
                `INSERT INTO Crops (name, type, status, user_id) VALUES (?, ?, ?, ?)`,
                [name, type, status, userId]
            );
            console.log('✅ New crop inserted');
        }

        closeCropModal();
        loadCropsTable();
        loadDashboard(); // Refresh dashboard metrics
    } catch (error) {
        console.error('❌ Error saving crop:', error);
        alert('Error saving crop: ' + error.message);
    }
}

/**
 * Load crop data into the modal for editing.
 * Executes SELECT query to fetch crop details.
 * @param {number} id - Crop ID to edit
 */
function editCrop(id) {
    try {
        const result = db.exec(
            `SELECT id, name, type, status, user_id FROM Crops WHERE id = ?`,
            [id]
        );

        if (result[0]?.values[0]) {
            const [cropId, name, type, status, userId] = result[0].values[0];
            document.getElementById('cropId').value = cropId;
            document.getElementById('cropName').value = name;
            document.getElementById('cropType').value = type;
            document.getElementById('cropStatus').value = status;
            document.getElementById('cropUserId').value = userId;
            document.getElementById('cropModalTitle').textContent = `Edit Crop: ${name}`;
            document.getElementById('cropModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('❌ Error editing crop:', error);
    }
}

/**
 * Delete a crop from the database.
 * Shows browser confirmation dialog before executing DELETE query.
 * @param {number} id - Crop ID to delete
 */
function deleteCrop(id) {
    if (!confirm('⚠️ Are you sure you want to delete this crop? This action cannot be undone.')) {
        return;
    }

    try {
        // First, delete associated inventory items (foreign key constraint)
        db.run(`DELETE FROM Inventory WHERE crop_id = ?`, [id]);
        
        // Then delete the crop
        db.run(`DELETE FROM Crops WHERE id = ?`, [id]);
        
        console.log(`✅ Crop ${id} and associated inventory items deleted`);
        loadCropsTable();
        loadDashboard(); // Refresh dashboard metrics
    } catch (error) {
        console.error('❌ Error deleting crop:', error);
        alert('Error deleting crop: ' + error.message);
    }
}

/**
 * Search crops by name using SQL LIKE operator.
 * Executes: SELECT * FROM Crops WHERE name LIKE %searchTerm%
 */
function searchCrops() {
    const searchTerm = document.getElementById('cropSearch').value.trim();

    try {
        let query = `
            SELECT Crops.id, Crops.name, Crops.type, Crops.status, Users.username
            FROM Crops
            LEFT JOIN Users ON Crops.user_id = Users.id
        `;

        if (searchTerm) {
            query += ` WHERE Crops.name LIKE '%${searchTerm}%'`;
        }

        const result = db.exec(query);
        const cropsList = document.getElementById('cropsList');
        cropsList.innerHTML = '';

        if (result[0]?.values && result[0].values.length > 0) {
            result[0].values.forEach(crop => {
                const [id, name, type, status, username] = crop;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-300 px-4 py-2">${id}</td>
                    <td class="border border-gray-300 px-4 py-2 font-semibold">${name}</td>
                    <td class="border border-gray-300 px-4 py-2">${type}</td>
                    <td class="border border-gray-300 px-4 py-2">
                        <span class="px-3 py-1 rounded-full text-sm font-semibold ${
                            status === 'Growing' ? 'bg-blue-100 text-blue-800' :
                            status === 'Ready for Harvest' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }">${status}</span>
                    </td>
                    <td class="border border-gray-300 px-4 py-2">${username || 'N/A'}</td>
                    <td class="border border-gray-300 px-4 py-2 text-center">
                        <button onclick="editCrop(${id})" class="action-btn edit-btn">✏️ Edit</button>
                        <button onclick="deleteCrop(${id})" class="action-btn delete-btn">🗑️ Delete</button>
                    </td>
                `;
                cropsList.appendChild(row);
            });
        } else {
            cropsList.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No crops found matching your search.</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error searching crops:', error);
    }
}

// ============================================
// INVENTORY CRUD OPERATIONS
// ============================================

/**
 * Load and display all inventory items in the inventory table.
 * Executes: SELECT * FROM Inventory with JOIN to get crop names
 */
function loadInventoryTable() {
    try {
        const result = db.exec(`
            SELECT Inventory.id, Inventory.item_name, Inventory.quantity, Crops.name
            FROM Inventory
            LEFT JOIN Crops ON Inventory.crop_id = Crops.id
            ORDER BY Inventory.id DESC
        `);

        const inventoryList = document.getElementById('inventoryList');
        inventoryList.innerHTML = '';

        if (result[0]?.values) {
            result[0].values.forEach(item => {
                const [id, itemName, quantity, cropName] = item;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-300 px-4 py-2">${id}</td>
                    <td class="border border-gray-300 px-4 py-2 font-semibold">${itemName}</td>
                    <td class="border border-gray-300 px-4 py-2">${quantity}</td>
                    <td class="border border-gray-300 px-4 py-2">${cropName || 'N/A'}</td>
                    <td class="border border-gray-300 px-4 py-2 text-center">
                        <button onclick="editInventory(${id})" class="action-btn edit-btn">✏️ Edit</button>
                        <button onclick="deleteInventory(${id})" class="action-btn delete-btn">🗑️ Delete</button>
                    </td>
                `;
                inventoryList.appendChild(row);
            });
        } else {
            inventoryList.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No inventory items found. Add one to get started!</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error loading inventory table:', error);
    }
}

/**
 * Open the Add Inventory Item modal form.
 * Resets form fields and sets modal title to "Add Inventory Item".
 */
function openInventoryModal() {
    document.getElementById('inventoryId').value = '';
    document.getElementById('inventoryForm').reset();
    document.getElementById('inventoryModalTitle').textContent = 'Add Inventory Item';
    document.getElementById('inventoryModal').classList.remove('hidden');
}

/**
 * Close the Add/Edit Inventory modal.
 */
function closeInventoryModal() {
    document.getElementById('inventoryModal').classList.add('hidden');
    document.getElementById('inventoryForm').reset();
}

/**
 * Save a new inventory item or update existing item.
 * Validates form inputs before executing INSERT or UPDATE query.
 */
function saveInventory() {
    const inventoryId = document.getElementById('inventoryId').value;
    const itemName = document.getElementById('itemName').value.trim();
    const quantity = document.getElementById('itemQuantity').value;
    const cropId = document.getElementById('itemCropId').value;

    // Client-side form validation
    if (!itemName || !quantity || !cropId) {
        alert('❌ All fields are required!');
        return;
    }

    if (quantity <= 0) {
        alert('❌ Quantity must be greater than 0!');
        return;
    }

    try {
        if (inventoryId) {
            // UPDATE existing inventory item
            db.run(
                `UPDATE Inventory SET item_name = ?, quantity = ?, crop_id = ? WHERE id = ?`,
                [itemName, quantity, cropId, inventoryId]
            );
            console.log(`✅ Inventory item ${inventoryId} updated`);
        } else {
            // INSERT new inventory item
            db.run(
                `INSERT INTO Inventory (item_name, quantity, crop_id) VALUES (?, ?, ?)`,
                [itemName, quantity, cropId]
            );
            console.log('✅ New inventory item inserted');
        }

        closeInventoryModal();
        loadInventoryTable();
        loadDashboard(); // Refresh dashboard metrics
    } catch (error) {
        console.error('❌ Error saving inventory item:', error);
        alert('Error saving inventory item: ' + error.message);
    }
}

/**
 * Load inventory item data into the modal for editing.
 * Executes SELECT query to fetch item details.
 * @param {number} id - Inventory item ID to edit
 */
function editInventory(id) {
    try {
        const result = db.exec(
            `SELECT id, item_name, quantity, crop_id FROM Inventory WHERE id = ?`,
            [id]
        );

        if (result[0]?.values[0]) {
            const [inventoryId, itemName, quantity, cropId] = result[0].values[0];
            document.getElementById('inventoryId').value = inventoryId;
            document.getElementById('itemName').value = itemName;
            document.getElementById('itemQuantity').value = quantity;
            document.getElementById('itemCropId').value = cropId;
            document.getElementById('inventoryModalTitle').textContent = `Edit Item: ${itemName}`;
            document.getElementById('inventoryModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('❌ Error editing inventory item:', error);
    }
}

/**
 * Delete an inventory item from the database.
 * Shows browser confirmation dialog before executing DELETE query.
 * @param {number} id - Inventory item ID to delete
 */
function deleteInventory(id) {
    if (!confirm('⚠️ Are you sure you want to delete this inventory item?')) {
        return;
    }

    try {
        db.run(`DELETE FROM Inventory WHERE id = ?`, [id]);
        console.log(`✅ Inventory item ${id} deleted`);
        loadInventoryTable();
        loadDashboard(); // Refresh dashboard metrics
    } catch (error) {
        console.error('❌ Error deleting inventory item:', error);
        alert('Error deleting inventory item: ' + error.message);
    }
}

/**
 * Search inventory items by name using SQL LIKE operator.
 * Executes: SELECT * FROM Inventory WHERE item_name LIKE %searchTerm%
 */
function searchInventory() {
    const searchTerm = document.getElementById('inventorySearch').value.trim();

    try {
        let query = `
            SELECT Inventory.id, Inventory.item_name, Inventory.quantity, Crops.name
            FROM Inventory
            LEFT JOIN Crops ON Inventory.crop_id = Crops.id
        `;

        if (searchTerm) {
            query += ` WHERE Inventory.item_name LIKE '%${searchTerm}%'`;
        }

        const result = db.exec(query);
        const inventoryList = document.getElementById('inventoryList');
        inventoryList.innerHTML = '';

        if (result[0]?.values && result[0].values.length > 0) {
            result[0].values.forEach(item => {
                const [id, itemName, quantity, cropName] = item;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-300 px-4 py-2">${id}</td>
                    <td class="border border-gray-300 px-4 py-2 font-semibold">${itemName}</td>
                    <td class="border border-gray-300 px-4 py-2">${quantity}</td>
                    <td class="border border-gray-300 px-4 py-2">${cropName || 'N/A'}</td>
                    <td class="border border-gray-300 px-4 py-2 text-center">
                        <button onclick="editInventory(${id})" class="action-btn edit-btn">✏️ Edit</button>
                        <button onclick="deleteInventory(${id})" class="action-btn delete-btn">🗑️ Delete</button>
                    </td>
                `;
                inventoryList.appendChild(row);
            });
        } else {
            inventoryList.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No inventory items found matching your search.</td></tr>';
        }
    } catch (error) {
        console.error('❌ Error searching inventory items:', error);
    }
}

// ============================================
// HELPER FUNCTIONS - POPULATE DROPDOWNS
// ============================================

/**
 * Populate the User dropdown in Crop modal.
 * Executes: SELECT id, username FROM Users
 */
function populateUserSelect() {
    try {
        const result = db.exec(`SELECT id, username FROM Users ORDER BY username`);
        const select = document.getElementById('cropUserId');
        
        if (result[0]?.values) {
            result[0].values.forEach(user => {
                const [id, username] = user;
                const option = document.createElement('option');
                option.value = id;
                option.textContent = username;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Error populating user select:', error);
    }
}

/**
 * Populate the Crop dropdown in Inventory modal.
 * Executes: SELECT id, name FROM Crops
 */
function populateCropSelect() {
    try {
        const result = db.exec(`SELECT id, name FROM Crops ORDER BY name`);
        const select = document.getElementById('itemCropId');
        
        if (result[0]?.values) {
            result[0].values.forEach(crop => {
                const [id, name] = crop;
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Error populating crop select:', error);
    }
}

// ============================================
// APPLICATION STARTUP
// ============================================

/**
 * Initialize the entire application when DOM is ready.
 * Waits for sql.js to load, then initializes database and UI.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Farm Management System starting...');
    initDatabase();
});
