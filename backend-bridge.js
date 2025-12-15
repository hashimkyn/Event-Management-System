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
const ORGANISER_SIZE = 140; // 4 + 50 + 50 + 20 + 20
const CUSTOMER_SIZE = 140;  // 4 + 50 + 50 + 20 + 20
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

            await this.executeCommand(inputs);

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

            return { success: false, message: 'Username already exists' };
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
            // Check if username already exists
            const customers = readAllFromDat('customers.dat', parseCustomer, CUSTOMER_SIZE);
            if (customers && customers.some(c => c.username === data.username)) {
                return { success: false, message: 'Username already exists' };
            }

            const inputs = [
                '2',           // Choose Customer
                '1',           // Choose Signup
                data.name,
                data.email,
                data.username,
                data.password,
                '0'            // Exit
            ];

            await this.executeCommand(inputs);

            // Read from customers.dat to get the registered customer
            const allCustomers = readAllFromDat('customers.dat', parseCustomer, CUSTOMER_SIZE);
            const newCustomer = allCustomers.find(c => c.username === data.username);

            if (newCustomer) {
                return { 
                    success: true, 
                    ID: newCustomer.ID, 
                    message: 'Customer registered successfully!' 
                };
            }

            return { success: false, message: 'Signup failed' };
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
                '1',                    // Organiser
                '2',                    // Login
                'temp_user',
                'temp_pass',
                '0',                    // Continue
                '5',                    // Event details
                data.eventID.toString(),
                '1',                    // Staff data
                '3',                    // Add staff
                data.name,
                data.email,
                data.team,
                data.position,
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            return { success: true, message: 'Staff member added successfully!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getStaffByEvent(eventID) {
        try {
            const inputs = [
                '1',                    // Organiser
                '2',                    // Login
                'temp_user',
                'temp_pass',
                '0',                    // Continue
                '5',                    // Event details
                eventID.toString(),
                '1',                    // Staff data
                '1',                    // View staff
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            const staff = [];
            const lines = output.split('\n');

            lines.forEach(line => {
                if (line.includes('ID:') && line.includes('Name:')) {
                    const idMatch = line.match(/ID:\s*(\d+)/);
                    const nameMatch = line.match(/Name:\s*([^\s]+)/);
                    const emailMatch = line.match(/Email:\s*([^\s]+)/);

                    if (idMatch) {
                        staff.push({
                            ID: parseInt(idMatch[1]),
                            name: nameMatch ? nameMatch[1] : 'Unknown',
                            email: emailMatch ? emailMatch[1] : 'N/A',
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
                '1',                    // Organiser
                '2',                    // Login
                'temp_user',
                'temp_pass',
                '0',                    // Continue
                '5',                    // Event details
                '1',                    // (placeholder event ID)
                '1',                    // Staff data
                '4',                    // Delete staff
                staffID.toString(),
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            if (output.includes('Deleted')) {
                return { success: true, message: 'Staff deleted!' };
            }

            return { success: true, message: 'Staff deleted!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ======================= VENDOR FUNCTIONS =======================
    async addVendor(data) {
        try {
            const inputs = [
                '1',                        // Organiser
                '2',                        // Login
                'temp_user',
                'temp_pass',
                '0',                        // Continue
                '5',                        // Event details
                data.eventID.toString(),
                '2',                        // Vendor data
                '3',                        // Add vendor
                data.name,
                data.email,
                data.prod_serv,
                data.chargesDue.toString(),
                '0'                         // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            return { success: true, message: 'Vendor added successfully!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getVendorsByEvent(eventID) {
        try {
            const inputs = [
                '1',                    // Organiser
                '2',                    // Login
                'temp_user',
                'temp_pass',
                '0',                    // Continue
                '5',                    // Event details
                eventID.toString(),
                '2',                    // Vendor data
                '1',                    // View vendors
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            const vendors = [];
            const lines = output.split('\n');

            lines.forEach(line => {
                if (line.includes('ID:') && line.includes('Name:')) {
                    const idMatch = line.match(/ID:\s*(\d+)/);
                    const nameMatch = line.match(/Name:\s*([^\s]+)/);
                    const emailMatch = line.match(/Email:\s*([^\s]+)/);

                    if (idMatch) {
                        vendors.push({
                            ID: parseInt(idMatch[1]),
                            name: nameMatch ? nameMatch[1] : 'Unknown',
                            email: emailMatch ? emailMatch[1] : 'N/A',
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
                '1',                    // Organiser
                '2',                    // Login
                'temp_user',
                'temp_pass',
                '0',                    // Continue
                '5',                    // Event details
                '1',                    // (placeholder)
                '2',                    // Vendor data
                '4',                    // Delete vendor
                vendorID.toString(),
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            if (output.includes('Deleted')) {
                return { success: true, message: 'Vendor deleted!' };
            }

            return { success: true, message: 'Vendor deleted!' };
        } catch (error) {
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
            const inputs = [
                '1',                    // Organiser
                '2',                    // Login
                'temp_user',
                'temp_pass',
                '0',                    // Continue
                '5',                    // Event details
                eventID.toString(),
                '3',                    // Customer data
                '1',                    // View customers
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            const registrations = [];
            const lines = output.split('\n');

            lines.forEach(line => {
                if (line.includes('ID:') && line.includes('Ticket Number:')) {
                    const custIdMatch = line.match(/ID:\s*(\d+)/);
                    const ticketMatch = line.match(/Ticket Number:\s*(\d+)/);
                    const feeMatch = line.match(/Fee Status:\s*(\w+)/);

                    if (custIdMatch) {
                        registrations.push({
                            customerID: parseInt(custIdMatch[1]),
                            ticketNum: ticketMatch ? parseInt(ticketMatch[1]) : 0,
                            feeStatus: feeMatch ? feeMatch[1] : 'Unpaid',
                            customerName: 'Customer',
                            customerEmail: 'customer@event.com'
                        });
                    }
                }
            });

            return { success: true, registrations };
        } catch (error) {
            return { success: false, registrations: [], message: error.message };
        }
    }

    async updateCustomerFeeStatus(data) {
        try {
            const fs = require('fs');
            const path = require('path');
            const registrationsFile = path.join(DATA_DIR, 'registrations.json');
            
            let registrations = [];
            if (fs.existsSync(registrationsFile)) {
                try {
                    registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
                } catch (e) {
                    registrations = [];
                }
            }
            
            const reg = registrations.find(r => r.ID === data.registrationID);
            if (!reg) {
                return { success: false, message: 'Registration not found' };
            }
            
            reg.feeStatus = data.feeStatus;
            fs.writeFileSync(registrationsFile, JSON.stringify(registrations, null, 2));
            
            console.log('Fee status updated:', data);
            return { success: true, message: 'Fee status updated!' };
        } catch (error) {
            console.error('updateCustomerFeeStatus error:', error);
            return { success: false, message: error.message };
        }
    }

    async customerSignup(data) {
        try {
            // Check if username already exists
            const customers = readAllFromDat('customers.dat', parseCustomer, CUSTOMER_SIZE);
            if (customers && customers.some(c => c.username === data.username)) {
                return { success: false, message: 'Username already exists' };
            }

            const inputs = [
                '2',           // Choose Customer
                '1',           // Choose Signup
                data.name,
                data.email,
                data.username,
                data.password,
                '0'            // Exit
            ];

            await this.executeCommand(inputs);

            // Read from customers.dat to get the registered customer
            const allCustomers = readAllFromDat('customers.dat', parseCustomer, CUSTOMER_SIZE);
            const newCustomer = allCustomers.find(c => c.username === data.username);

            if (newCustomer) {
                return { 
                    success: true, 
                    ID: newCustomer.ID, 
                    message: 'Customer registered successfully!' 
                };
            }

            return { success: false, message: 'Username already exists' };
        } catch (error) {
            console.error('customerSignup error:', error);
            return { success: false, message: error.message };
        }
    }

    async customerLogin(username, password) {
        try {
            const fs = require('fs');
            const path = require('path');
            const customersFile = path.join(DATA_DIR, 'customers.json');
            
            let customers = [];
            if (fs.existsSync(customersFile)) {
                try {
                    customers = JSON.parse(fs.readFileSync(customersFile, 'utf8'));
                } catch (e) {
                    customers = [];
                }
            }
            
            const customer = customers.find(c => c.username === username && c.password === password);
            if (!customer) {
                return { success: false, message: 'Invalid credentials' };
            }
            
            console.log('Customer logged in:', customer.ID);
            return { success: true, user: { ID: customer.ID, name: customer.name, email: customer.email } };
        } catch (error) {
            console.error('customerLogin error:', error);
            return { success: false, message: error.message };
        }
    }

    async customerRegister(data) {
        try {
            const fs = require('fs');
            const path = require('path');
            const registrationsFile = path.join(DATA_DIR, 'registrations.json');
            const eventsFile = path.join(DATA_DIR, 'events.json');
            
            let registrations = [];
            let events = [];
            
            if (fs.existsSync(registrationsFile)) {
                try {
                    registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
                } catch (e) {
                    registrations = [];
                }
            }
            
            if (fs.existsSync(eventsFile)) {
                try {
                    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
                } catch (e) {
                    events = [];
                }
            }
            
            // Check if already registered
            const alreadyRegistered = registrations.find(r => 
                r.custID === data.custID && r.eventID === data.eventID
            );
            
            if (alreadyRegistered) {
                return { success: false, message: 'Already registered for this event' };
            }
            
            // Generate ticket number
            const ticketNum = Math.floor(Math.random() * 90000) + 10000;
            
            // Create new registration
            registrations.push({
                ID: registrations.length + 1,
                custID: data.custID,
                eventID: data.eventID,
                ticketNum,
                feeStatus: 'Unpaid',
                registeredDate: new Date().toISOString()
            });
            
            // Increment sold tickets for the event
            const eventIndex = events.findIndex(e => e.ID === data.eventID);
            if (eventIndex !== -1) {
                events[eventIndex].soldTickets++;
            }
            
            fs.writeFileSync(registrationsFile, JSON.stringify(registrations, null, 2));
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
            const fs = require('fs');
            const path = require('path');
            const registrationsFile = path.join(DATA_DIR, 'registrations.json');
            const eventsFile = path.join(DATA_DIR, 'events.json');
            
            let registrations = [];
            let events = [];
            
            if (fs.existsSync(registrationsFile)) {
                try {
                    registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
                } catch (e) {
                    registrations = [];
                }
            }
            
            if (fs.existsSync(eventsFile)) {
                try {
                    events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
                } catch (e) {
                    events = [];
                }
            }
            
            // Filter registrations for this customer and add event details, excluding deleted events
            const customerRegs = registrations
                .filter(r => r.custID === custID)
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

    async staffGetByEvent(eventID) {
        try {
            const fs = require('fs');
            const path = require('path');
            const staffFile = path.join(DATA_DIR, 'staff.json');
            
            let staff = [];
            if (fs.existsSync(staffFile)) {
                try {
                    staff = JSON.parse(fs.readFileSync(staffFile, 'utf8'));
                } catch (e) {
                    staff = [];
                }
            }
            
            const eventStaff = staff.filter(s => s.eventID === eventID);
            console.log('Staff for event', eventID, ':', eventStaff);
            return { success: true, staff: eventStaff };
        } catch (error) {
            console.error('staffGetByEvent error:', error);
            return { success: false, staff: [], message: error.message };
        }
    }

    async staffAdd(data) {
        try {
            const fs = require('fs');
            const path = require('path');
            const staffFile = path.join(DATA_DIR, 'staff.json');
            
            let staff = [];
            if (fs.existsSync(staffFile)) {
                try {
                    staff = JSON.parse(fs.readFileSync(staffFile, 'utf8'));
                } catch (e) {
                    staff = [];
                }
            }
            
            const newStaff = {
                ID: staff.length > 0 ? Math.max(...staff.map(s => s.ID)) + 1 : 1,
                eventID: data.eventID,
                name: data.name,
                email: data.email,
                team: data.team,
                position: data.position,
                createdDate: new Date().toISOString()
            };
            
            staff.push(newStaff);
            fs.writeFileSync(staffFile, JSON.stringify(staff, null, 2));
            
            console.log('Staff added:', newStaff);
            return { success: true, ID: newStaff.ID, message: 'Staff added!' };
        } catch (error) {
            console.error('staffAdd error:', error);
            return { success: false, message: error.message };
        }
    }

    async staffDelete(staffID) {
        try {
            const fs = require('fs');
            const path = require('path');
            const staffFile = path.join(DATA_DIR, 'staff.json');
            
            let staff = [];
            if (fs.existsSync(staffFile)) {
                try {
                    staff = JSON.parse(fs.readFileSync(staffFile, 'utf8'));
                } catch (e) {
                    staff = [];
                }
            }
            
            const index = staff.findIndex(s => s.ID === staffID);
            if (index === -1) {
                return { success: false, message: 'Staff not found' };
            }
            
            staff.splice(index, 1);
            fs.writeFileSync(staffFile, JSON.stringify(staff, null, 2));
            
            console.log('Staff deleted:', staffID);
            return { success: true, message: 'Staff deleted!' };
        } catch (error) {
            console.error('staffDelete error:', error);
            return { success: false, message: error.message };
        }
    }

    async staffUpdate(data) {
        try {
            const fs = require('fs');
            const path = require('path');
            const staffFile = path.join(DATA_DIR, 'staff.json');
            
            let staff = [];
            if (fs.existsSync(staffFile)) {
                try {
                    staff = JSON.parse(fs.readFileSync(staffFile, 'utf8'));
                } catch (e) {
                    staff = [];
                }
            }
            
            const index = staff.findIndex(s => s.ID === data.ID);
            if (index === -1) {
                return { success: false, message: 'Staff not found' };
            }
            
            staff[index] = {
                ...staff[index],
                name: data.name,
                email: data.email,
                team: data.team,
                position: data.position
            };
            
            fs.writeFileSync(staffFile, JSON.stringify(staff, null, 2));
            
            console.log('Staff updated:', staff[index]);
            return { success: true, message: 'Staff updated!' };
        } catch (error) {
            console.error('staffUpdate error:', error);
            return { success: false, message: error.message };
        }
    }

    async vendorGetByEvent(eventID) {
        try {
            const fs = require('fs');
            const path = require('path');
            const vendorFile = path.join(DATA_DIR, 'vendors.json');
            
            let vendors = [];
            if (fs.existsSync(vendorFile)) {
                try {
                    vendors = JSON.parse(fs.readFileSync(vendorFile, 'utf8'));
                } catch (e) {
                    vendors = [];
                }
            }
            
            const eventVendors = vendors.filter(v => v.eventID === eventID);
            return { success: true, vendors: eventVendors };
        } catch (error) {
            console.error('vendorGetByEvent error:', error);
            return { success: false, vendors: [], message: error.message };
        }
    }

    async vendorAdd(data) {
        try {
            const fs = require('fs');
            const path = require('path');
            const vendorFile = path.join(DATA_DIR, 'vendors.json');
            
            let vendors = [];
            if (fs.existsSync(vendorFile)) {
                try {
                    vendors = JSON.parse(fs.readFileSync(vendorFile, 'utf8'));
                } catch (e) {
                    vendors = [];
                }
            }
            
            const newVendor = {
                ID: vendors.length > 0 ? Math.max(...vendors.map(v => v.ID)) + 1 : 1,
                eventID: data.eventID,
                name: data.name,
                email: data.email,
                prod_serv: data.prod_serv,
                chargesDue: data.chargesDue || 0,
                createdDate: new Date().toISOString()
            };
            
            vendors.push(newVendor);
            fs.writeFileSync(vendorFile, JSON.stringify(vendors, null, 2));
            
            console.log('Vendor added:', newVendor);
            return { success: true, ID: newVendor.ID, message: 'Vendor added!' };
        } catch (error) {
            console.error('vendorAdd error:', error);
            return { success: false, message: error.message };
        }
    }

    async vendorDelete(vendorID) {
        try {
            const fs = require('fs');
            const path = require('path');
            const vendorFile = path.join(DATA_DIR, 'vendors.json');
            
            let vendors = [];
            if (fs.existsSync(vendorFile)) {
                try {
                    vendors = JSON.parse(fs.readFileSync(vendorFile, 'utf8'));
                } catch (e) {
                    vendors = [];
                }
            }
            
            const index = vendors.findIndex(v => v.ID === vendorID);
            if (index === -1) {
                return { success: false, message: 'Vendor not found' };
            }
            
            vendors.splice(index, 1);
            fs.writeFileSync(vendorFile, JSON.stringify(vendors, null, 2));
            
            console.log('Vendor deleted:', vendorID);
            return { success: true, message: 'Vendor deleted!' };
        } catch (error) {
            console.error('vendorDelete error:', error);
            return { success: false, message: error.message };
        }
    }

    async vendorUpdate(data) {
        try {
            const fs = require('fs');
            const path = require('path');
            const vendorFile = path.join(DATA_DIR, 'vendors.json');
            
            let vendors = [];
            if (fs.existsSync(vendorFile)) {
                try {
                    vendors = JSON.parse(fs.readFileSync(vendorFile, 'utf8'));
                } catch (e) {
                    vendors = [];
                }
            }
            
            const index = vendors.findIndex(v => v.ID === data.ID);
            if (index === -1) {
                return { success: false, message: 'Vendor not found' };
            }
            
            vendors[index] = {
                ...vendors[index],
                name: data.name,
                email: data.email,
                prod_serv: data.prod_serv,
                chargesDue: data.chargesDue
            };
            
            fs.writeFileSync(vendorFile, JSON.stringify(vendors, null, 2));
            
            console.log('Vendor updated:', vendors[index]);
            return { success: true, message: 'Vendor updated!' };
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
            const inputs = [
                '1',                    // Organiser
                '2',                    // Login
                'temp_user',
                'temp_pass',
                '0',                    // Continue
                '5',                    // Event details
                eventID.toString(),
                '3',                    // Customer data
                '1',                    // View customers
                '0'                     // Exit
            ];

            const output = await this.executeCommand(inputs);
            console.log('Backend output:', output);

            const registrations = [];
            const lines = output.split('\n');

            lines.forEach(line => {
                if (line.includes('ID:') && line.includes('Ticket Number:')) {
                    const custIdMatch = line.match(/ID:\s*(\d+)/);
                    const ticketMatch = line.match(/Ticket Number:\s*(\d+)/);
                    const feeMatch = line.match(/Fee Status:\s*(\w+)/);

                    if (custIdMatch) {
                        registrations.push({
                            customerID: parseInt(custIdMatch[1]),
                            ticketNum: ticketMatch ? parseInt(ticketMatch[1]) : 0,
                            feeStatus: feeMatch ? feeMatch[1] : 'Unpaid',
                            customerName: 'Customer',
                            customerEmail: 'customer@event.com'
                        });
                    }
                }
            });

            return { success: true, registrations };
        } catch (error) {
            return { success: false, registrations: [], message: error.message };
        }
    }

    async updateCustomerFeeStatus(data) {
        try {
            const fs = require('fs');
            const path = require('path');
            const registrationsFile = path.join(DATA_DIR, 'registrations.json');
            
            let registrations = [];
            if (fs.existsSync(registrationsFile)) {
                try {
                    registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
                } catch (e) {
                    registrations = [];
                }
            }
            
            const reg = registrations.find(r => r.ID === data.registrationID);
            if (!reg) {
                return { success: false, message: 'Registration not found' };
            }
            
            reg.feeStatus = data.feeStatus;
            fs.writeFileSync(registrationsFile, JSON.stringify(registrations, null, 2));
            
            console.log('Fee status updated:', data);
            return { success: true, message: 'Fee status updated!' };
        } catch (error) {
            console.error('updateCustomerFeeStatus error:', error);
            return { success: false, message: error.message };
        }
    }

    async registrationGetByEvent(eventID) {
        try {
            const fs = require('fs');
            const path = require('path');
            const registrationsFile = path.join(DATA_DIR, 'registrations.json');
            const customersFile = path.join(DATA_DIR, 'customers.json');
            
            let registrations = [];
            let customers = [];
            
            if (fs.existsSync(registrationsFile)) {
                try {
                    registrations = JSON.parse(fs.readFileSync(registrationsFile, 'utf8'));
                } catch (e) {
                    registrations = [];
                }
            }
            
            if (fs.existsSync(customersFile)) {
                try {
                    customers = JSON.parse(fs.readFileSync(customersFile, 'utf8'));
                } catch (e) {
                    customers = [];
                }
            }
            
            // Filter registrations for this event and add customer details
            const eventRegs = registrations
                .filter(r => r.eventID === eventID)
                .map(r => {
                    const customer = customers.find(c => c.ID === r.custID);
                    return {
                        ...r,
                        customerName: customer ? customer.name : 'N/A',
                        customerEmail: customer ? customer.email : 'N/A'
                    };
                });
            
            console.log('Registrations for event', eventID, ':', eventRegs);
            return { success: true, registrations: eventRegs };
        } catch (error) {
            console.error('registrationGetByEvent error:', error);
            return { success: false, registrations: [], message: error.message };
        }
    }
}

module.exports = new BackendBridge();