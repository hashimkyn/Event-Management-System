window.addEventListener('error', (e) => {
    console.error('Error:', e.error);
});

// MENUS OBJECT
const menus = {
    main: document.getElementById('main-menu'),
    organiser: document.getElementById('organiser-menu'),
    customer: document.getElementById('customer-menu'),
    events: document.getElementById('event-menu'),
    details: document.getElementById('details-menu'),
    customerEvents: document.getElementById('customer-event-menu')
};

// Global state
let currentUser = null;
let currentViewEventId = null;
let currentEventDetail = null;

// Message helper
function showMessage(text, type = 'info', timeout = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), timeout);
}

// Show menu helper
function showMenu(menuId) {
    Object.values(menus).forEach(menu => {
        if (menu) menu.classList.add('hidden');
    });
    if (menus[menuId]) menus[menuId].classList.remove('hidden');
}

// Clear form helper
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
}

// ======================= LOGIN & SIGNUP =======================
async function openLogin(userType) {
    clearForm('login-form');
    const modal = document.getElementById('login-modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.dataset.userType = userType;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const submitBtn = modal.querySelector('button[type="submit"]');
    submitBtn.onclick = async (e) => {
        e.preventDefault();
        
        const username = modal.querySelector('#login-username').value.trim();
        const password = modal.querySelector('#login-password').value.trim();
        
        if (!username || !password) {
            showMessage('Please fill all fields', 'error');
            return;
        }
        
        try {
            const result = userType === 'organiser' 
                ? await window.api.organiserLogin(username, password)
                : await window.api.customerLogin(username, password);
            
            if (result.success) {
                currentUser = result.user;
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
                showMessage(`Welcome ${result.user.name}!`, 'success');
                
                if (userType === 'organiser') {
                    showMenu('events');
                    setTimeout(() => loadEventsTable(), 100);
                } else {
                    showMenu('customerEvents');
                    setTimeout(() => loadCustomerEventsTable(), 100);
                }
            } else {
                showMessage(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
}

async function openSignup(userType) {
    clearForm('signup-form');
    const modal = document.getElementById('signup-modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.dataset.userType = userType;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const submitBtn = modal.querySelector('button[type="submit"]');
    submitBtn.onclick = async (e) => {
        e.preventDefault();
        
        const name = modal.querySelector('#signup-name').value.trim();
        const email = modal.querySelector('#signup-email').value.trim();
        const username = modal.querySelector('#signup-username').value.trim();
        const password = modal.querySelector('#signup-password').value.trim();
        const passwordConfirm = modal.querySelector('#signup-password-confirm').value.trim();
        
        if (!name || !email || !username || !password || !passwordConfirm) {
            showMessage('Please fill all required fields', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        try {
            const data = { name, email, username, password };
            
            const result = userType === 'organiser'
                ? await window.api.organiserSignup(data)
                : await window.api.customerSignup(data);
            
            if (result.success) {
                showMessage(`${userType === 'organiser' ? 'Organiser' : 'Customer'} registered! ID: ${result.ID}`, 'success');
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
                clearForm('signup-form');
            } else {
                showMessage(result.message || 'Signup failed', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
}

// ======================= EVENT OPERATIONS =======================
async function openAddEvent() {
    clearForm('add-event-form');
    const modal = document.getElementById('add-event-modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const submitBtn = modal.querySelector('button[type="submit"]');
    submitBtn.onclick = async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('event-name')?.value.trim();
        const venue = document.getElementById('event-venue')?.value.trim();
        const startDate = document.getElementById('event-start')?.value.trim();
        const endDate = document.getElementById('event-end')?.value.trim();
        const totalSeatsStr = document.getElementById('event-seats')?.value.trim();
        const typeStr = document.getElementById('event-type')?.value;
        
        const totalSeats = totalSeatsStr ? parseInt(totalSeatsStr) : 0;
        const type = typeStr ? parseInt(typeStr) : 1;
        
        if (!name || !venue || !startDate || !endDate || !totalSeats || totalSeats <= 0) {
            showMessage('Please fill all fields correctly', 'error');
            return;
        }
        
        try {
            const result = await window.api.eventAdd({
                name, venue, startDate, endDate, totalSeats, type,
                orgID: currentUser ? currentUser.ID : 0,
                orgName: currentUser ? currentUser.name : 'Unknown'
            });
            
            if (result.success) {
                showMessage('Event added successfully!', 'success');
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
                clearForm('add-event-form');
                await new Promise(resolve => setTimeout(resolve, 500));
                await loadEventsTable();
            } else {
                showMessage(result.message || 'Failed to add event', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
}

async function loadEventsTable() {
    try {
        const result = await window.api.eventGetAll();
        const tbody = document.querySelector('#events-table tbody');
        
        if (!tbody) return;
        
        if (result.success && result.events && result.events.length > 0) {
            tbody.innerHTML = '';
            result.events.forEach(event => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${event.ID}</td>
                    <td>${event.name || 'N/A'}</td>
                    <td>${event.venue || 'N/A'}</td>
                    <td>${event.startDate || 'N/A'}</td>
                    <td>${event.endDate || 'N/A'}</td>
                    <td>${event.totalSeats || 0}</td>
                    <td>${event.soldTickets || 0}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7">No events yet</td></tr>';
        }
    } catch (error) {
        showMessage(`Error loading events: ${error.message}`, 'error');
    }
}

function createModifyRequestModal() {
    const modal = document.createElement('div');
    modal.id = 'modify-request-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Modify Event</h2>
                <button class="close" data-close="modify-request-modal">×</button>
            </div>
            <form id="modify-request-form" class="modal-form">
                <label for="modify-event-id">Event ID</label>
                <input id="modify-event-id" type="number" required placeholder="Enter Event ID">
                <div class="modal-actions">
                    <button type="submit">Find Event</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

async function openModifyRequest() {
    clearForm('modify-request-form');
    const modal = document.getElementById('modify-request-modal') || createModifyRequestModal();
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const submitBtn = modal.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Find Event';
    
    submitBtn.onclick = async (e) => {
        e.preventDefault();
        const eventIDStr = document.getElementById('modify-event-id')?.value.trim();
        
        if (!eventIDStr) {
            showMessage('Event ID is required', 'error');
            return;
        }
        
        const eventID = parseInt(eventIDStr);
        if (isNaN(eventID)) {
            showMessage('Event ID must be a valid number', 'error');
            return;
        }
        
        try {
            const result = await window.api.eventGetAll();
            const event = result.events.find(e => e.ID === eventID);
            
            if (!event) {
                showMessage('Event not found', 'error');
                return;
            }
            
            showModifyEventForm(event, modal, overlay);
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
}

function showModifyEventForm(event, modal, overlay) {
    const form = modal.querySelector('form');
    form.innerHTML = `
        <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Modify event details below:</p>
        
        <label for="modify-event-id-display">Event ID</label>
        <input id="modify-event-id-display" type="number" value="${event.ID}" disabled style="background: #f5f5f5;">

        <label for="modify-event-name">Event Name</label>
        <input id="modify-event-name" type="text" value="${event.name}">

        <label for="modify-event-start">Start Date</label>
        <input id="modify-event-start" type="date" value="${event.startDate}">

        <label for="modify-event-end">End Date</label>
        <input id="modify-event-end" type="date" value="${event.endDate}">

        <label for="modify-event-venue">Venue</label>
        <input id="modify-event-venue" type="text" value="${event.venue}">

        <label for="modify-event-seats">Total Seats</label>
        <input id="modify-event-seats" type="number" value="${event.totalSeats}">

        <div class="modal-actions">
            <button type="button" id="modify-back-btn">Back</button>
            <button type="submit" id="modify-save-btn">Save Changes</button>
        </div>
    `;
    
    document.getElementById('modify-back-btn').onclick = (e) => {
        e.preventDefault();
        openModifyRequest();
    };
    
    document.getElementById('modify-save-btn').onclick = async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('modify-event-name')?.value.trim();
        const startDate = document.getElementById('modify-event-start')?.value.trim();
        const endDate = document.getElementById('modify-event-end')?.value.trim();
        const venue = document.getElementById('modify-event-venue')?.value.trim();
        const totalSeats = parseInt(document.getElementById('modify-event-seats')?.value || 0);
        
        try {
            const result = await window.api.eventModify({
                ID: event.ID,
                name: name || event.name,
                startDate: startDate || event.startDate,
                endDate: endDate || event.endDate,
                venue: venue || event.venue,
                totalSeats: totalSeats || event.totalSeats
            });
            
            if (result.success) {
                showMessage('Event updated successfully!', 'success');
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
                await loadEventsTable();
            } else {
                showMessage(result.message || 'Failed to modify event', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
}

function createDeleteEventModal() {
    const modal = document.createElement('div');
    modal.id = 'delete-event-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Delete Event</h2>
                <button class="close" data-close="delete-event-modal">×</button>
            </div>
            <form id="delete-event-form" class="modal-form">
                <label for="delete-event-id">Event ID</label>
                <input id="delete-event-id" type="number" required placeholder="Enter Event ID">
                <div class="modal-actions">
                    <button type="submit">Delete Event</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

async function openDeleteEvent() {
    clearForm('delete-event-form');
    const modal = document.getElementById('delete-event-modal') || createDeleteEventModal();
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const submitBtn = modal.querySelector('button[type="submit"]');
    submitBtn.onclick = async (e) => {
        e.preventDefault();
        const eventID = parseInt(document.getElementById('delete-event-id')?.value || 0);
        
        if (!eventID) {
            showMessage('Please enter Event ID', 'error');
            return;
        }
        
        try {
            const result = await window.api.eventDelete(eventID);
            
            if (result.success) {
                showMessage('Event deleted successfully!', 'success');
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
                await loadEventsTable();
            } else {
                showMessage(result.message || 'Failed to delete event', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
}

// ======================= EVENT DETAILS =======================
async function openEventDetails() {
    const result = await window.api.eventGetAll();
    
    if (!result.success || result.events.length === 0) {
        showMessage('No events to view', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'event-select-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Select Event</h2>
                <button class="close" data-close="event-select-modal">×</button>
            </div>
            <div id="events-list" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
    `;
    modal.id = 'event-select-modal';
    document.body.appendChild(modal);
    
    const eventsList = modal.querySelector('#events-list');
    eventsList.innerHTML = result.events.map((event, index) => `
        <div data-event-id="${event.ID}" data-event-index="${index}" style="padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; cursor: pointer; border-radius: 4px; background: #fff;">
            <strong>${event.name}</strong> (ID: ${event.ID})<br>
            <small>${event.venue} | ${event.startDate}</small>
        </div>
    `).join('');
    
    // Add event delegation for event selection
    eventsList.addEventListener('click', (e) => {
        const eventDiv = e.target.closest('[data-event-id]');
        if (eventDiv) {
            const eventID = parseInt(eventDiv.dataset.eventId);
            selectEventDetail(eventID);
        }
    });
    
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden');
}

async function selectEventDetail(eventID) {
    try {
        const result = await window.api.eventGetAll();
        const event = result.events.find(e => e.ID === eventID);
        
        if (!event) {
            showMessage('Event not found', 'error');
            return;
        }
        
        currentEventDetail = event;
        currentViewEventId = eventID;
        
        const selectModal = document.getElementById('event-select-modal');
        if (selectModal) selectModal.remove();
        
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.add('hidden');
        
        updateEventDetailsMenu(event);
        showMenu('details');
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

async function openRegistrationsModal() {
    if (!currentUser || !currentUser.ID) {
        showMessage('Please login to view registrations', 'error');
        return;
    }

    const modal = document.getElementById('registrations-modal') || createRegistrationsModal();
    const overlay = document.getElementById('modal-overlay');

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');

    const list = document.getElementById('registrations-list');
    if (!list) {
        showMessage('Error loading registrations modal', 'error');
        return;
    }
    
    list.innerHTML = '<p>Loading...</p>';

    try {
        const res = await window.api.customerGetRegistrations(currentUser.ID);

        if (!res.success || !res.registrations || res.registrations.length === 0) {
            list.innerHTML = '<p>No registrations yet</p>';
            return;
        }

        let html = `<table class="events-table"><thead><tr><th>Event ID</th><th>Event Name</th><th>Ticket#</th><th>Fee Status</th></tr></thead><tbody>`;
        res.registrations.forEach(r => {
            // Use eventName from the response (it's already populated by the backend)
            const eventName = r.eventName || `Event ${r.eventID}`;
            html += `<tr>
                <td>${r.eventID}</td>
                <td>${eventName}</td>
                <td>${r.ticketNum}</td>
                <td>${r.feeStatus}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// ======================= ORGANISER STAFF MANAGEMENT =======================
async function showEditStaffPage() {
    if (!currentViewEventId) {
        showMessage('No event selected', 'error');
        return;
    }
    
    try {
        const result = await window.api.staffGetByEvent(currentViewEventId);
        const detailsMenu = document.getElementById('details-menu');
        
        let html = `<h2>${currentEventDetail.name} - Manage Staff</h2>
            <div class="button-group">
                <button id="add-staff-btn">Add Staff</button>
                <button id="staff-back-btn">Back</button>
            </div>`;
        
        if (result.success && result.staff && result.staff.length > 0) {
            html += `<table class="events-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Team</th><th>Position</th><th>Actions</th></tr></thead><tbody>`;
            result.staff.forEach(staff => {
                html += `
                    <tr>
                        <td>${staff.ID}</td>
                        <td>${staff.name}</td>
                        <td>${staff.email}</td>
                        <td>${staff.team}</td>
                        <td>${staff.position}</td>
                        <td>
                            <button data-staff-id="${staff.ID}" class="edit-staff-btn" style="margin-right: 5px;">Edit</button>
                            <button data-staff-id="${staff.ID}" class="delete-staff-btn">Delete</button>
                        </td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
        } else {
            html += '<p style="margin: 20px 0; padding: 20px; background: #f0f0f0; border-radius: 4px;">No staff members</p>';
        }
        
        detailsMenu.innerHTML = html;
        
        // Add event delegation for staff actions
        detailsMenu.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit-staff-btn')) {
                const staffID = parseInt(e.target.dataset.staffId);
                const staff = result.staff.find(s => s.ID === staffID);
                showEditStaffForm(staff);
            }
            if (e.target.classList.contains('delete-staff-btn')) {
                const staffID = parseInt(e.target.dataset.staffId);
                if (confirm('Are you sure you want to delete this staff member?')) {
                    await deleteStaffMember(staffID);
                }
            }
        });
        
        document.getElementById('add-staff-btn').onclick = showAddStaffForm;
        document.getElementById('staff-back-btn').onclick = () => updateEventDetailsMenu(currentEventDetail);
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

function showEditStaffForm(staff) {
    const detailsMenu = document.getElementById('details-menu');
    detailsMenu.innerHTML = `
        <h2>${currentEventDetail.name} - Edit Staff Member</h2>
        <form id="edit-staff-form" class="modal-form" style="max-width: 400px;">
            <label for="edit-staff-id">Staff ID</label>
            <input id="edit-staff-id" type="number" value="${staff.ID}" disabled style="background: #f5f5f5;">

            <label for="edit-staff-name">Name</label>
            <input id="edit-staff-name" type="text" value="${staff.name}" required>

            <label for="edit-staff-email">Email</label>
            <input id="edit-staff-email" type="email" value="${staff.email}" required>

            <label for="edit-staff-team">Team</label>
            <input id="edit-staff-team" type="text" value="${staff.team}" required>

            <label for="edit-staff-position">Position</label>
            <input id="edit-staff-position" type="text" value="${staff.position}" required>

            <div class="button-group">
                <button type="button" id="edit-staff-cancel-btn">Cancel</button>
                <button type="submit" id="edit-staff-save-btn">Save Changes</button>
            </div>
        </form>
    `;
    
    document.getElementById('edit-staff-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('edit-staff-name').value.trim();
        const email = document.getElementById('edit-staff-email').value.trim();
        const team = document.getElementById('edit-staff-team').value.trim();
        const position = document.getElementById('edit-staff-position').value.trim();
        
        if (!name || !email || !team || !position) {
            showMessage('Please fill all fields', 'error');
            return;
        }
        
        try {
            const result = await window.api.staffUpdate({
                ID: staff.ID,
                eventID: currentViewEventId,
                name, email, team, position
            });
            
            if (result.success) {
                showMessage('Staff updated!', 'success');
                await showEditStaffPage();
            } else {
                showMessage(result.message || 'Failed to update', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
    
    document.getElementById('edit-staff-cancel-btn').onclick = showEditStaffPage;
};

// ======================= ORGANISER VENDOR MANAGEMENT =======================
async function showEditVendorPage() {
    if (!currentViewEventId) {
        showMessage('No event selected', 'error');
        return;
    }
    
    try {
        const result = await window.api.vendorGetByEvent(currentViewEventId);
        const detailsMenu = document.getElementById('details-menu');
        
        let html = `<h2>${currentEventDetail.name} - Manage Vendors</h2>
            <div class="button-group">
                <button id="add-vendor-btn">Add Vendor</button>
                <button id="vendor-back-btn">Back</button>
            </div>`;
        
        if (result.success && result.vendors && result.vendors.length > 0) {
            html += `<table class="events-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Product/Service</th><th>Charges Due</th><th>Actions</th></tr></thead><tbody>`;
            result.vendors.forEach(vendor => {
                html += `
                    <tr>
                        <td>${vendor.ID}</td>
                        <td>${vendor.name}</td>
                        <td>${vendor.email}</td>
                        <td>${vendor.prod_serv}</td>
                        <td>${vendor.chargesDue}</td>
                        <td>
                            <button data-vendor-id="${vendor.ID}" class="edit-vendor-btn" style="margin-right: 5px;">Edit</button>
                            <button data-vendor-id="${vendor.ID}" class="delete-vendor-btn">Delete</button>
                        </td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
        } else {
            html += '<p style="margin: 20px 0; padding: 20px; background: #f0f0f0; border-radius: 4px;">No vendors</p>';
        }
        
        detailsMenu.innerHTML = html;
        
        // Add event delegation for vendor actions
        detailsMenu.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit-vendor-btn')) {
                const vendorID = parseInt(e.target.dataset.vendorId);
                const vendor = result.vendors.find(v => v.ID === vendorID);
                showEditVendorForm(vendor);
            }
            if (e.target.classList.contains('delete-vendor-btn')) {
                const vendorID = parseInt(e.target.dataset.vendorId);
                if (confirm('Are you sure you want to delete this vendor?')) {
                    await deleteVendor(vendorID);
                }
            }
        });
        
        document.getElementById('add-vendor-btn').onclick = showAddVendorForm;
        document.getElementById('vendor-back-btn').onclick = () => updateEventDetailsMenu(currentEventDetail);
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

function showEditVendorForm(vendor) {
    const detailsMenu = document.getElementById('details-menu');
    detailsMenu.innerHTML = `
        <h2>${currentEventDetail.name} - Edit Vendor</h2>
        <form id="edit-vendor-form" class="modal-form" style="max-width: 400px;">
            <label for="edit-vendor-id">Vendor ID</label>
            <input id="edit-vendor-id" type="number" value="${vendor.ID}" disabled style="background: #f5f5f5;">

            <label for="edit-vendor-name">Name</label>
            <input id="edit-vendor-name" type="text" value="${vendor.name}" required>

            <label for="edit-vendor-email">Email</label>
            <input id="edit-vendor-email" type="email" value="${vendor.email}" required>

            <label for="edit-vendor-service">Product/Service</label>
            <input id="edit-vendor-service" type="text" value="${vendor.prod_serv}" required>

            <label for="edit-vendor-charges">Charges Due</label>
            <input id="edit-vendor-charges" type="number" step="0.01" value="${vendor.chargesDue}">

            <div class="button-group">
                <button type="button" id="edit-vendor-cancel-btn">Cancel</button>
                <button type="submit" id="edit-vendor-save-btn">Save Changes</button>
            </div>
        </form>
    `;
    
    document.getElementById('edit-vendor-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('edit-vendor-name').value.trim();
        const email = document.getElementById('edit-vendor-email').value.trim();
        const prod_serv = document.getElementById('edit-vendor-service').value.trim();
        const chargesDue = parseFloat(document.getElementById('edit-vendor-charges').value || 0);
        
        if (!name || !email || !prod_serv) {
            showMessage('Please fill required fields', 'error');
            return;
        }
        
        try {
            const result = await window.api.vendorUpdate({
                ID: vendor.ID,
                eventID: currentViewEventId,
                name, email, prod_serv, chargesDue
            });
            
            if (result.success) {
                showMessage('Vendor updated!', 'success');
                await showEditVendorPage();
            } else {
                showMessage(result.message || 'Failed to update', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
    
    document.getElementById('edit-vendor-cancel-btn').onclick = showEditVendorPage;
}

// ======================= ORGANISER CUSTOMER FEE STATUS MANAGEMENT =======================
async function showManageCustomerFeesPage() {
    if (!currentEventDetail) {
        showMessage('No event selected', 'error');
        return;
    }
    
    try {
        const result = await window.api.registrationGetByEvent(currentEventDetail.ID);
        const detailsMenu = document.getElementById('details-menu');
        
        let html = `<h2>${currentEventDetail.name} - Manage Customer Fees</h2>
            <div class="button-group"><button id="fees-back-btn">Back</button></div>`;
        
        if (result.success && result.registrations && result.registrations.length > 0) {
            html += `<table class="events-table"><thead><tr><th>Customer ID</th><th>Ticket Number</th><th>Fee Status</th><th>Action</th></tr></thead><tbody>`;
            result.registrations.forEach(reg => {
                const toggleStatus = reg.feeStatus === 'Paid' ? 'Unpaid' : 'Paid';
                html += `
                    <tr>
                        <td>${reg.custID}</td>
                        <td>${reg.ticketNum}</td>
                        <td><strong>${reg.feeStatus}</strong></td>
                        <td>
                            <button data-reg-id="${reg.ID}" class="toggle-fee-btn">Mark as ${toggleStatus}</button>
                        </td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
        } else {
            html += '<p style="margin: 20px 0; padding: 20px; background: #f0f0f0; border-radius: 4px;">No customers registered</p>';
        }
        
        detailsMenu.innerHTML = html;
        
        // Add event delegation for fee toggle
        detailsMenu.addEventListener('click', async (e) => {
            if (e.target.classList.contains('toggle-fee-btn')) {
                const regID = parseInt(e.target.dataset.regId);
                const reg = result.registrations.find(r => r.ID === regID);
                const newStatus = reg.feeStatus === 'Paid' ? 'Unpaid' : 'Paid';
                
                try {
                    const updateRes = await window.api.updateCustomerFeeStatus({
                        registrationID: regID,
                        feeStatus: newStatus
                    });
                    
                    if (updateRes.success) {
                        showMessage(`Fee status updated to ${newStatus}!`, 'success');
                        await showManageCustomerFeesPage();
                    } else {
                        showMessage(updateRes.message || 'Failed to update', 'error');
                    }
                } catch (error) {
                    showMessage(`Error: ${error.message}`, 'error');
                }
            }
        });
        
        document.getElementById('fees-back-btn').onclick = () => updateEventDetailsMenu(currentEventDetail);
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

// Update the updateEventDetailsMenu to include new buttons:
function updateEventDetailsMenu(event) {
    const detailsMenu = document.getElementById('details-menu');
    
    detailsMenu.innerHTML = `
        <h2>${event.name} - Details</h2>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Event ID:</strong> ${event.ID}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><strong>Start Date:</strong> ${event.startDate}</p>
            <p><strong>End Date:</strong> ${event.endDate}</p>
            <p><strong>Seats:</strong> ${event.soldTickets}/${event.totalSeats}</p>
        </div>
        
        <div class="button-group">
            <button id="details-customer-data-btn">Customer Data</button>
            <button id="details-manage-fees-btn">Manage Fees</button>
            <button id="details-edit-staff-btn">Edit Staff</button>
            <button id="details-edit-vendor-btn">Edit Vendors</button>
            <button id="details-back-btn">Back</button>
        </div>
    `;
    
    document.getElementById('details-customer-data-btn').onclick = showCustomerDataPage;
    document.getElementById('details-manage-fees-btn').onclick = showManageCustomerFeesPage;
    document.getElementById('details-edit-staff-btn').onclick = showEditStaffPage;
    document.getElementById('details-edit-vendor-btn').onclick = showEditVendorPage;
    document.getElementById('details-back-btn').onclick = () => {
        currentEventDetail = null;
        currentViewEventId = null;
        showMenu('events');
    };
}
