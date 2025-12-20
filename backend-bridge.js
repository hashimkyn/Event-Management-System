const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKEND_EXE = path.join(__dirname, 'backend.exe');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ======================= BINARY FILE PARSING =======================
// Struct sizes based on backend.cpp
const ORGANISER_SIZE = 144; // 4 + 50 + 50 + 20 + 20
const CUSTOMER_SIZE = 144;  // 4 + 50 + 50 + 20 + 20
const EVENT_SIZE = 216;     // 4 + 4 + 50 + 50 + 50 + 20 + 20 + 4 + 4 + 4
const STAFF_SIZE = 136;     // 4 + 4 + 50 + 50 + 20 + 20
const VENDOR_SIZE = 132;    // 4 + 4 + 50 + 50 + 50 + 4
const REGISTRATION_SIZE = 24; // 4 + 4 + 4 + 10

function readNullTerminatedString(buffer, offset, maxLen) {
    let str = '';
    for (let i = 0; i < maxLen; i++) {
        const byte = buffer[offset + i];
        if (byte === 0) break;
        str += String.fromCharCode(byte);
    }
    return str;
}

function readInt32LE(buffer, offset) {
    return buffer.readInt32LE(offset);
}

function readFloatLE(buffer, offset) {
    return buffer.readFloatLE(offset);
}

function parseOrganiser(buffer) {
    return {
        ID: readInt32LE(buffer, 0),
        name: readNullTerminatedString(buffer, 4, 50),
        email: readNullTerminatedString(buffer, 54, 50),
        username: readNullTerminatedString(buffer, 104, 20),
        password: readNullTerminatedString(buffer, 124, 20)
    };
}

function parseCustomer(buffer) {
    return {
        ID: readInt32LE(buffer, 0),
        name: readNullTerminatedString(buffer, 4, 50),
        email: readNullTerminatedString(buffer, 54, 50),
        username: readNullTerminatedString(buffer, 104, 20),
        password: readNullTerminatedString(buffer, 124, 20)
    };
}

function parseEvent(buffer) {
    return {
        ID: readInt32LE(buffer, 0),
        orgID: readInt32LE(buffer, 4),
        name: readNullTerminatedString(buffer, 8, 50),
        orgName: readNullTerminatedString(buffer, 58, 50),
        venue: readNullTerminatedString(buffer, 108, 50),
        startDate: readNullTerminatedString(buffer, 158, 20),
        endDate: readNullTerminatedString(buffer, 178, 20),
        totalSeats: readInt32LE(buffer, 198),
        soldTickets: readInt32LE(buffer, 202),
        type: readInt32LE(buffer, 206)
    };
}

function parseStaff(buffer) {
    return {
        ID: readInt32LE(buffer, 0),
        eventID: readInt32LE(buffer, 4),
        name: readNullTerminatedString(buffer, 8, 50),
        email: readNullTerminatedString(buffer, 58, 50),
        team: readNullTerminatedString(buffer, 108, 20),
        position: readNullTerminatedString(buffer, 128, 20)
    };
}

function parseVendor(buffer) {
    return {
        ID: readInt32LE(buffer, 0),
        eventID: readInt32LE(buffer, 4),
        name: readNullTerminatedString(buffer, 8, 50),
        email: readNullTerminatedString(buffer, 58, 50),
        prod_serv: readNullTerminatedString(buffer, 108, 50),
        chargesDue: readFloatLE(buffer, 128)
    };
}

function parseRegistration(buffer) {
    return {
        customerID: readInt32LE(buffer, 0),
        eventID: readInt32LE(buffer, 4),
        ticketNum: readInt32LE(buffer, 8),
        feeStatus: readNullTerminatedString(buffer, 12, 10)
    };
}

// ======================= BINARY FILE WRITING FUNCTIONS =======================
function writeNullTerminatedString(buffer, offset, str, maxLen) {
    const bytes = Buffer.from(str, 'utf8');
    bytes.copy(buffer, offset, 0, Math.min(bytes.length, maxLen - 1));
    buffer[offset + Math.min(bytes.length, maxLen - 1)] = 0;
}

function writeRegistrationToDat(registration) {
    const filepath = path.join(DATA_DIR, 'registrations.dat');
    const buffer = Buffer.alloc(REGISTRATION_SIZE);
    
    buffer.writeInt32LE(registration.customerID, 0);
    buffer.writeInt32LE(registration.eventID, 4);
    buffer.writeInt32LE(registration.ticketNum, 8);
    writeNullTerminatedString(buffer, 12, registration.feeStatus, 10);
    
    fs.appendFileSync(filepath, buffer);
}

function writeStaffToDat(staff) {
    const filepath = path.join(DATA_DIR, 'staff.dat');
    const buffer = Buffer.alloc(STAFF_SIZE);
    
    buffer.writeInt32LE(staff.ID, 0);
    buffer.writeInt32LE(staff.eventID, 4);
    writeNullTerminatedString(buffer, 8, staff.name, 50);
    writeNullTerminatedString(buffer, 58, staff.email, 50);
    writeNullTerminatedString(buffer, 108, staff.team, 20);
    writeNullTerminatedString(buffer, 128, staff.position, 20);
    
    fs.appendFileSync(filepath, buffer);
}

function writeVendorToDat(vendor) {
    const filepath = path.join(DATA_DIR, 'vendors.dat');
    const buffer = Buffer.alloc(VENDOR_SIZE);
    
    buffer.writeInt32LE(vendor.ID, 0);
    buffer.writeInt32LE(vendor.eventID, 4);
    writeNullTerminatedString(buffer, 8, vendor.name, 50);
    writeNullTerminatedString(buffer, 58, vendor.email, 50);
    writeNullTerminatedString(buffer, 108, vendor.prod_serv, 50);
    buffer.writeFloatLE(vendor.chargesDue, 128);
    
    fs.appendFileSync(filepath, buffer);
}

// ======================= FILE READING FUNCTIONS =======================
function readAllFromDat(filename, parseFunc, size) {
    const filepath = path.join(DATA_DIR, filename);
    const results = [];
    
    if (!fs.existsSync(filepath)) {
        return results;
    }
    
    try {
        const data = fs.readFileSync(filepath);
        for (let i = 0; i < data.length; i += size) {
            if (i + size <= data.length) {
                results.push(parseFunc(data.slice(i, i + size)));
            }
        }
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
    }
    
    return results;
}

function findById(filename, parseFunc, size, id) {
    const filepath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
        return null;
    }
    
    try {
        const data = fs.readFileSync(filepath);
        for (let i = 0; i < data.length; i += size) {
            if (i + size <= data.length) {
                const obj = parseFunc(data.slice(i, i + size));
                if (obj.ID === id) {
                    return obj;
                }
            }
        }
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
    }
    
    return null;
}

function findByUsername(filename, parseFunc, size, username) {
    const filepath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
        return null;
    }
    
    try {
        const data = fs.readFileSync(filepath);
        for (let i = 0; i < data.length; i += size) {
            if (i + size <= data.length) {
                const obj = parseFunc(data.slice(i, i + size));
                if (obj.username === username) {
                    return obj;
                }
            }
        }
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
    }
    
    return null;
}

// Standalone executeCommand for use outside class
function executeCommandSync(inputs) {
    return new Promise((resolve, reject) => {
        const child = spawn(BACKEND_EXE, [], {
            cwd: DATA_DIR,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Send all inputs with newlines
        const inputString = inputs.join('\n') + '\n';
        child.stdin.write(inputString);
        child.stdin.end();

        child.on('close', (code) => {
            resolve(stdout);
        });

        // Timeout after 15 seconds
        setTimeout(() => {
            child.kill();
            reject(new Error('Backend timeout'));
        }, 15000);
    });
}

class BackendBridge {
    // Execute command by spawning backend process and sending input via stdin
    executeCommand(inputs) {
        return new Promise((resolve, reject) => {
            const child = spawn(BACKEND_EXE, [], {
                cwd: DATA_DIR,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Send all inputs with newlines
            const inputString = inputs.join('\n') + '\n';
            child.stdin.write(inputString);
            child.stdin.end();

            child.on('close', (code) => {
                resolve(stdout);
            });

            // Timeout after 15 seconds
            setTimeout(() => {
                child.kill();
                reject(new Error('Backend timeout'));
            }, 15000);
        });
    }

    // ======================= ORGANISER FUNCTIONS =======================
    async organiserSignup(data) {
        try {
            // Check if username already exists
            const organisers = readAllFromDat('organisers.dat', parseOrganiser, ORGANISER_SIZE);
            if (organisers && organisers.some(o => o.username === data.username)) {
                return { success: false, message: 'Username already exists' };
            }

            const inputs = [
                '1',           // Choose Organiser
                '1',           // Choose Signup
                data.name,
                data.email,
                data.username,
                data.password,
                '0'            // Exit (removed banking input)
            ];

            const output = await this.executeCommand(inputs);
            console.log('Organiser signup output:', output);

            // Small delay to ensure file is written
            await new Promise(resolve => setTimeout(resolve, 100));

            // Read from organisers.dat to get the registered organiser
            const allOrganisers = readAllFromDat('organisers.dat', parseOrganiser, ORGANISER_SIZE);
            const newOrganiser = allOrganisers.find(o => o.username === data.username);

            if (newOrganiser) {
                return { 
                    success: true, 
                    ID: newOrganiser.ID, 
                    message: 'Organiser registered successfully!' 
                };
            }

            // If we still can't find it, check if the output mentions success
            if (output.includes('registered successfully') || output.includes('Your ID:')) {
                return { 
                    success: true, 
                    message: 'Organiser registered successfully!' 
                };
            }

            return { success: false, message: 'Signup failed' };
        } catch (error) {
            console.error('organiserSignup error:', error);
            return { success: false, message: error.message };
        }
    }

    async organiserLogin(username, password) {
        try {
            const inputs = [
                '1',           // Choose Organiser
                '2',           // Choose Login
                username,
                password,
                '0'            // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            if (output.includes('Invalid credentials')) {
                return { success: false, message: 'Invalid credentials' };
            }

            if (output.includes('ORGANISER')) {
                // Successfully logged in
                return {
                    success: true,
                    user: {
                        ID: 999, // Parse from file later if needed
                        name: username,
                        email: 'organiser@event.com',
                        username: username
                    }
                };
            }

            return { success: false, message: 'Login failed' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ======================= CUSTOMER FUNCTIONS =======================
    async customerSignup(data) {
        try {
            console.log('Starting customer signup for:', data.username);
            
            // Check if username already exists
            const customers = readAllFromDat('customers.dat', parseCustomer, CUSTOMER_SIZE) || [];
            console.log('Existing customers:', customers);
            console.log('Checking if username exists:', data.username);
            
            const usernameExists = customers.length > 0 && customers.some(c => {
                console.log('Comparing:', c.username, 'with', data.username, '=', c.username === data.username);
                return c.username === data.username;
            });
            
            if (usernameExists) {
                console.log('Username already exists');
                return { success: false, message: 'Username already exists' };
            }

            console.log('Username is unique, proceeding with signup');
            const inputs = [
                '2',           // Choose Customer
                '1',           // Choose Signup
                data.name,
                data.email,
                data.username,
                data.password,
                '0'            // Exit
            ];

            console.log('Customer signup inputs:', inputs);
            const output = await this.executeCommand(inputs);
            console.log('Customer signup output:', output);

            // Small delay to ensure file is written
            await new Promise(resolve => setTimeout(resolve, 500));

            // Read from customers.dat to get the registered customer
            const allCustomers = readAllFromDat('customers.dat', parseCustomer, CUSTOMER_SIZE) || [];
            console.log('All customers after signup:', allCustomers);
            console.log('Looking for username:', data.username);
            const newCustomer = allCustomers.find(c => {
                console.log('Checking customer:', c.username, 'ID:', c.ID);
                return c.username === data.username;
            });

            if (newCustomer) {
                console.log('Found new customer:', newCustomer);
                return { 
                    success: true, 
                    ID: newCustomer.ID, 
                    message: 'Customer registered successfully!' 
                };
            }

            console.log('Customer NOT found in file after signup');
            console.log('Backend output was:', output);
            return { success: false, message: 'Signup failed - customer not written to database' };
        } catch (error) {
            console.error('customerSignup error:', error);
            return { success: false, message: error.message };
        }
    }

    async customerLogin(username, password) {
        try {
            const customer = findByUsername('customers.dat', parseCustomer, CUSTOMER_SIZE, username);
            
            if (!customer) {
                return { success: false, message: 'Invalid credentials' };
            }

            if (customer.password === password) {
                return {
                    success: true,
                    user: {
                        ID: customer.ID,
                        name: customer.name,
                        email: customer.email,
                        username: customer.username
                    }
                };
            }

            return { success: false, message: 'Invalid credentials' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ======================= EVENT FUNCTIONS =======================
    async addEvent(data) {
        try {
            const inputs = [
                '1',                    // Organiser
                '2',                    // Login
                'temp_user',            // placeholder
                'temp_pass',            // placeholder
                '1',                    // Add event
                data.name,
                data.startDate,
                data.endDate,
                data.venue,
                data.totalSeats.toString(),
                data.type.toString(),
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Add event output:', output);

            // Store event data in a JSON file for retrieval
            const fs = require('fs');
            const path = require('path');
            const eventsFile = path.join(DATA_DIR, 'events.json');
            
            let events = [];
            if (fs.existsSync(eventsFile)) {
                try {
                    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
                } catch (e) {
                    events = [];
                }
            }
            
            // Extract event ID from output
            const idMatch = output.match(/Event ID:\s*(\d+)/i);
            const eventId = idMatch ? parseInt(idMatch[1]) : Math.floor(Math.random() * 9000) + 1000;
            
            events.push({
                ID: eventId,
                name: data.name,
                venue: data.venue,
                startDate: data.startDate,
                endDate: data.endDate,
                totalSeats: data.totalSeats,
                soldTickets: 0,
                type: data.type,
                orgID: data.orgID,
                orgName: data.orgName
            });
            
            fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
            
            if (output.includes('added successfully') || output.includes('Event ID:')) {
                return { success: true, message: 'Event added successfully!' };
            }

            return { success: false, message: 'Failed to add event' };
        } catch (error) {
            console.error('addEvent error:', error);
            return { success: false, message: error.message };
        }
    }

    async getAllEvents() {
        try {
            const fs = require('fs');
            const path = require('path');
            const eventsFile = path.join(DATA_DIR, 'events.json');
            
            let events = [];
            if (fs.existsSync(eventsFile)) {
                try {
                    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
                } catch (e) {
                    events = [];
                }
            }
            
            console.log('Retrieved events from JSON:', events);
            return { success: true, events };
        } catch (error) {
            console.error('getAllEvents error:', error);
            return { success: false, events: [], message: error.message };
        }
    }

    async modifyEvent(data) {
        try {
            const fs = require('fs');
            const path = require('path');
            const eventsFile = path.join(DATA_DIR, 'events.json');
            
            let events = [];
            if (fs.existsSync(eventsFile)) {
                try {
                    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
                } catch (e) {
                    events = [];
                }
            }
            
            // Find and update event
            const eventIndex = events.findIndex(e => e.ID === data.ID);
            if (eventIndex === -1) {
                return { success: false, message: 'Event not found' };
            }
            
            // Update only provided fields
            if (data.name) events[eventIndex].name = data.name;
            if (data.startDate) events[eventIndex].startDate = data.startDate;
            if (data.endDate) events[eventIndex].endDate = data.endDate;
            if (data.venue) events[eventIndex].venue = data.venue;
            if (data.totalSeats) events[eventIndex].totalSeats = data.totalSeats;
            
            fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
            
            console.log('Event modified:', events[eventIndex]);
            return { success: true, message: 'Event updated successfully!' };
        } catch (error) {
            console.error('modifyEvent error:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteEvent(eventID) {
        try {
            const fs = require('fs');
            const path = require('path');
            const eventsFile = path.join(DATA_DIR, 'events.json');
            
            let events = [];
            if (fs.existsSync(eventsFile)) {
                try {
                    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
                } catch (e) {
                    events = [];
                }
            }
            
            // Find and remove event
            const eventIndex = events.findIndex(e => e.ID === eventID);
            if (eventIndex === -1) {
                return { success: false, message: 'Event not found' };
            }
            
            const deletedEvent = events.splice(eventIndex, 1);
            fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
            
            console.log('Event deleted:', deletedEvent[0]);
            return { success: true, message: 'Event deleted successfully!' };
        } catch (error) {
            console.error('deleteEvent error:', error);
            return { success: false, message: error.message };
        }
    }

    // ======================= STAFF FUNCTIONS =======================
    async addStaff(data) {
        try {
            const inputs = [
                '13',                       // Operation: Add staff
                data.eventID.toString(),
                data.name,
                data.email,
                data.team,
                data.position,
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend staff output:', output);

            return { success: true, message: 'Staff member added successfully!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getStaffByEvent(eventID) {
        try {
            const inputs = [
                '14',                       // Operation: Get staff by event
                eventID.toString(),
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend staff output:', output);

            const staff = [];
            const lines = output.split('\n');

            lines.forEach(line => {
                line = line.trim();
                if (line.includes('ID:') && line.includes('Name:')) {
                    const idMatch = line.match(/ID:\s*(\d+)/);
                    const nameMatch = line.match(/Name:\s*(.+?)(?:\s+Email:|$)/);
                    const emailMatch = line.match(/Email:\s*(.+?)(?:\s+Team:|$)/);
                    const teamMatch = line.match(/Team:\s*(.+?)(?:\s+Position:|$)/);
                    const positionMatch = line.match(/Position:\s*(.+?)(?:\s*$)/);

                    if (idMatch) {
                        staff.push({
                            ID: parseInt(idMatch[1]),
                            name: nameMatch ? nameMatch[1].trim() : 'Unknown',
                            email: emailMatch ? emailMatch[1].trim() : 'N/A',
                            team: teamMatch ? teamMatch[1].trim() : 'N/A',
                            position: positionMatch ? positionMatch[1].trim() : 'N/A',
                            eventID: eventID
                        });
                    }
                }
            });

            return { success: true, staff };
        } catch (error) {
            return { success: false, staff: [], message: error.message };
        }
    }

    async staffDelete(staffID) {
        try {
            const inputs = [
                '15',                       // Operation: Delete staff
                staffID.toString(),
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            return { success: true, message: 'Staff deleted!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ======================= VENDOR FUNCTIONS =======================
    async addVendor(data) {
        try {
            const inputs = [
                '16',                       // Operation: Add vendor
                data.eventID.toString(),
                data.name,
                data.email,
                data.prod_serv,
                data.chargesDue.toString(),
                '0'                         // Exit
            ];

            console.log('addVendor inputs:', inputs);
            const output = await this.executeCommand(inputs);
            console.log('Backend vendor output:', output);

            if (output.includes('added successfully')) {
                return { success: true, message: 'Vendor added successfully!' };
            }

            return { success: false, message: output || 'Failed to add vendor' };
        } catch (error) {
            console.error('addVendor error:', error);
            return { success: false, message: error.message };
        }
    }

    async getVendorsByEvent(eventID) {
        try {
            const inputs = [
                '17',                       // Operation: Get vendors by event
                eventID.toString(),
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend vendor output:', output);

            const vendors = [];
            const lines = output.split('\n');

            lines.forEach(line => {
                if (line.includes('ID:') && line.includes('Name:')) {
                    const idMatch = line.match(/ID:\s*(\d+)/);
                    const nameMatch = line.match(/Name:\s*(.+?)(?:\s+Email:|$)/);
                    const emailMatch = line.match(/Email:\s*(.+?)(?:\s+Product\/Service:|$)/);
                    const prodMatch = line.match(/Product\/Service:\s*(.+?)(?:\s+Charges:|$)/);
                    const chargesMatch = line.match(/Charges:\s*(\d+)/);

                    if (idMatch) {
                        vendors.push({
                            ID: parseInt(idMatch[1]),
                            name: nameMatch ? nameMatch[1].trim() : 'Unknown',
                            email: emailMatch ? emailMatch[1].trim() : 'N/A',
                            prod_serv: prodMatch ? prodMatch[1].trim() : 'N/A',
                            chargesDue: chargesMatch ? parseInt(chargesMatch[1]) : 0,
                            eventID: eventID
                        });
                    }
                }
            });

            return { success: true, vendors };
        } catch (error) {
            return { success: false, vendors: [], message: error.message };
        }
    }

    async vendorDelete(vendorID) {
        try {
            const inputs = [
                '18',                       // Operation: Delete vendor
                vendorID.toString(),
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            return { success: true, message: 'Vendor deleted!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Alias methods for backward compatibility with renderer.js naming
    async staffAdd(data) {
        return this.addStaff(data);
    }

    async staffGetByEvent(eventID) {
        return this.getStaffByEvent(eventID);
    }

    async staffUpdate(data) {
        try {
            const inputs = [
                '19',                       // Operation: Update staff
                data.ID.toString(),
                data.name,
                data.email,
                data.team,
                data.position,
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend staff update output:', output);
            console.log('Output type:', typeof output, 'Length:', output.length);

            if (output.toLowerCase().includes('updated successfully') || output.toLowerCase().includes('update')) {
                return { success: true, message: 'Staff updated successfully!' };
            }

            return { success: false, message: output || 'Failed to update staff' };
        } catch (error) {
            console.error('staffUpdate error:', error);
            return { success: false, message: error.message };
        }
    }

    async vendorAdd(data) {
        return this.addVendor(data);
    }

    async vendorGetByEvent(eventID) {
        return this.getVendorsByEvent(eventID);
    }

    async vendorUpdate(data) {
        try {
            const inputs = [
                '20',                       // Operation: Update vendor
                data.ID.toString(),
                data.name,
                data.email,
                data.prod_serv,
                data.chargesDue.toString(),
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend vendor update output:', output);
            console.log('Output type:', typeof output, 'Length:', output.length);

            if (output.toLowerCase().includes('updated successfully') || output.toLowerCase().includes('update')) {
                return { success: true, message: 'Vendor updated successfully!' };
            }

            return { success: false, message: output || 'Failed to update vendor' };
        } catch (error) {
            console.error('vendorUpdate error:', error);
            return { success: false, message: error.message };
        }
    }

    // ======================= REGISTRATION FUNCTIONS =======================
    async registerForEvent(data) {
        try {
            const inputs = [
                '2',                        // Customer
                '2',                        // Login
                'temp_user',
                'temp_pass',
                '0',                        // Continue
                '2',                        // Register
                data.eventID.toString(),
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            const ticketMatch = output.match(/ticket number is\s*(\d+)/i);

            if (output.includes('Already Registered')) {
                const prevTicket = output.match(/ticket number is\s*(\d+)/i);
                return {
                    success: false,
                    message: `Already registered! Ticket: ${prevTicket ? prevTicket[1] : 'N/A'}`
                };
            }

            if (output.includes('successfully') || ticketMatch) {
                return {
                    success: true,
                    ticketNum: ticketMatch ? parseInt(ticketMatch[1]) : 0,
                    message: 'Registered successfully!'
                };
            }

            return { success: false, message: 'Registration failed' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getRegistrationsByEvent(eventID) {
        try {
            // Call backend to get registrations for this event from .dat file
            const inputs = [
                '10',                   // Operation: Get registrations by event
                eventID.toString(),
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend registration output:', output);

            const registrations = [];
            const lines = output.split('\n');

            lines.forEach(line => {
                if (line.includes('CustID:')) {
                    const custIdMatch = line.match(/CustID:\s*(\d+)/);
                    const nameMatch = line.match(/Name:\s*([^\s]+(?:\s+[^\s]+)?)\s+Email:/);
                    const emailMatch = line.match(/Email:\s*(\S+)/);
                    const ticketMatch = line.match(/Ticket:\s*(\d+)/);
                    const statusMatch = line.match(/Status:\s*(\w+)/);

                    if (custIdMatch) {
                        registrations.push({
                            customerID: parseInt(custIdMatch[1]),
                            customerName: nameMatch ? nameMatch[1] : 'Unknown',
                            customerEmail: emailMatch ? emailMatch[1] : 'unknown@email.com',
                            ticketNum: ticketMatch ? parseInt(ticketMatch[1]) : 0,
                            feeStatus: statusMatch ? statusMatch[1] : 'Unpaid'
                        });
                    }
                }
            });

            return { success: true, registrations };
        } catch (error) {
            return { success: false, registrations: [], message: error.message };
        }
    }

    async registrationGetByEvent(eventID) {
        // Alias for renderer.js compatibility
        return this.getRegistrationsByEvent(eventID);
    }

    async updateCustomerFeeStatus(data) {
        try {
            const inputs = [
                '11',                   // Operation: Update registration fee status
                data.custID.toString(),
                data.eventID.toString(),
                data.feeStatus,
                '0'                     // Exit
            ];

            console.log('updateCustomerFeeStatus inputs:', inputs);
            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            if (output.includes('Updated successfully') || output.includes('updated successfully')) {
                return { success: true, message: 'Fee status updated!' };
            }

            return { success: false, message: output || 'Failed to update fee status' };
        } catch (error) {
            console.error('updateCustomerFeeStatus error:', error);
            return { success: false, message: error.message };
        }
    }

    async customerRegister(data) {
        try {
            const eventsFile = path.join(DATA_DIR, 'events.json');
            
            let events = [];
            
            if (fs.existsSync(eventsFile)) {
                try {
                    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
                } catch (e) {
                    events = [];
                }
            }
            
            // Check if event exists and has available seats
            const event = events.find(e => e.ID === data.eventID);
            if (!event) {
                return { success: false, message: 'Event not found' };
            }
            
            if (event.soldTickets >= event.totalSeats) {
                return { success: false, message: 'All seats are filled for this event' };
            }
            
            // Check if already registered
            const registrations = readAllFromDat('registrations.dat', parseRegistration, REGISTRATION_SIZE);
            const alreadyRegistered = registrations.find(r => 
                r.customerID === data.custID && r.eventID === data.eventID
            );
            
            if (alreadyRegistered) {
                return { success: false, message: 'Already registered for this event' };
            }
            
            // Generate ticket number
            const ticketNum = Math.floor(Math.random() * 90000) + 10000;
            
            // Call backend to add registration to .dat file
            const inputs = [
                '12',                           // Operation: Add registration
                data.custID.toString(),
                data.eventID.toString(),
                ticketNum.toString(),
                'Unpaid',
                '0'                             // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend registration output:', output);

            if (!output.includes('added successfully')) {
                return { success: false, message: 'Failed to register with backend' };
            }
            
            // Increment sold tickets for the event
            const eventIndex = events.findIndex(e => e.ID === data.eventID);
            if (eventIndex !== -1) {
                events[eventIndex].soldTickets++;
            }
            
            fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
            
            console.log('Customer registered:', { custID: data.custID, eventID: data.eventID, ticketNum });
            return { success: true, ticketNum, message: 'Registered successfully!' };
        } catch (error) {
            console.error('customerRegister error:', error);
            return { success: false, message: error.message };
        }
    }

    async customerGetRegistrations(custID) {
        try {
            const eventsFile = path.join(DATA_DIR, 'events.json');
            
            let events = [];
            
            if (fs.existsSync(eventsFile)) {
                try {
                    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
                } catch (e) {
                    events = [];
                }
            }
            
            // Read registrations from .dat file
            const registrations = readAllFromDat('registrations.dat', parseRegistration, REGISTRATION_SIZE);
            
            // Filter registrations for this customer and add event details, excluding deleted events
            const customerRegs = registrations
                .filter(r => r.customerID === custID)
                .filter(r => events.some(e => e.ID === r.eventID)) // Only include registrations for events that still exist
                .map(r => {
                    const event = events.find(e => e.ID === r.eventID);
                    return {
                        ...r,
                        eventName: event ? event.name : 'Unknown Event',
                        eventID: r.eventID
                    };
                });
            
            console.log('Customer registrations:', customerRegs);
            return { success: true, registrations: customerRegs };
        } catch (error) {
            console.error('customerGetRegistrations error:', error);
            return { success: false, registrations: [], message: error.message };
        }
    }

    // ======================= REGISTRATION FUNCTIONS =======================
    async registerForEvent(data) {
        try {
            const inputs = [
                '2',                        // Customer
                '2',                        // Login
                'temp_user',
                'temp_pass',
                '0',                        // Continue
                '2',                        // Register
                data.eventID.toString(),
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            const ticketMatch = output.match(/ticket number is\s*(\d+)/i);

            if (output.includes('Already Registered')) {
                const prevTicket = output.match(/ticket number is\s*(\d+)/i);
                return {
                    success: false,
                    message: `Already registered! Ticket: ${prevTicket ? prevTicket[1] : 'N/A'}`
                };
            }

            if (output.includes('successfully') || ticketMatch) {
                return {
                    success: true,
                    ticketNum: ticketMatch ? parseInt(ticketMatch[1]) : 0,
                    message: 'Registered successfully!'
                };
            }

            return { success: false, message: 'Registration failed' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getRegistrationsByEvent(eventID) {
        try {
            const inputs = [
                '10',                   // Operation: Get registrations by event
                eventID.toString(),
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend registration output:', output);

            const registrations = [];
            const lines = output.split('\n');

            lines.forEach(line => {
                if (line.includes('CustID:')) {
                    const custIdMatch = line.match(/CustID:\s*(\d+)/);
                    const nameMatch = line.match(/Name:\s*([^\s]+(?:\s+[^\s]+)?)\s+Email:/);
                    const emailMatch = line.match(/Email:\s*(\S+)/);
                    const ticketMatch = line.match(/Ticket:\s*(\d+)/);
                    const statusMatch = line.match(/Status:\s*(\w+)/);

                    if (custIdMatch) {
                        registrations.push({
                            customerID: parseInt(custIdMatch[1]),
                            customerName: nameMatch ? nameMatch[1] : 'Unknown',
                            customerEmail: emailMatch ? emailMatch[1] : 'unknown@email.com',
                            ticketNum: ticketMatch ? parseInt(ticketMatch[1]) : 0,
                            feeStatus: statusMatch ? statusMatch[1] : 'Unpaid'
                        });
                    }
                }
            });

            return { success: true, registrations };
        } catch (error) {
            return { success: false, registrations: [], message: error.message };
        }
    }

    async getStaffCountByEvent(eventID) {
        try {
            const inputs = ['21', eventID.toString(), '0'];
            const output = await this.executeCommand(inputs);
            const match = output.match(/Staff Count:\s*(\d+)/i);
            return match ? { success: true, count: parseInt(match[1]) } : { success: false, count: 0 };
        } catch (error) {
            return { success: false, count: 0, message: error.message };
        }
    }

    async getVendorCountByEvent(eventID) {
        try {
            const inputs = ['22', eventID.toString(), '0'];
            const output = await this.executeCommand(inputs);
            const match = output.match(/Vendor Count:\s*(\d+)/i);
            return match ? { success: true, count: parseInt(match[1]) } : { success: false, count: 0 };
        } catch (error) {
            return { success: false, count: 0, message: error.message };
        }
    }
}

module.exports = new BackendBridge();