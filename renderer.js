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
    const modal = document.getElementById('login-modal');
    const overlay = document.getElementById('modal-overlay');
    
    // Clear all form fields
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.reset();
        loginForm.querySelectorAll('input').forEach(input => {
            input.value = '';
        });
    }
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const loginToSignup = document.getElementById('login-to-signup');
    
    if (loginToSignup) {
        loginToSignup.onclick = () => {
            modal.classList.add('hidden');
            openSignup(userType);
        };
    }
    
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        if (!username || !password) {
            showMessage('Please enter username and password', 'error');
            return;
        }
        
        try {
            let result;
            if (userType === 'organiser') {
                result = await window.api.organiserLogin(username, password);
            } else {
                result = await window.api.customerLogin(username, password);
            }
            
            if (result.success) {
                currentUser = result.user;
                showMessage(`Welcome ${currentUser.name}!`, 'success');
                
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
                
                // Clear the form
                loginForm.reset();
                loginForm.querySelectorAll('input').forEach(input => {
                    input.value = '';
                });
                
                // Navigate to appropriate menu
                if (userType === 'organiser') {
                    loadOrganizerEvents();
                } else {
                    showCustomerEventMenu();
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
    const modal = document.getElementById('signup-modal');
    const overlay = document.getElementById('modal-overlay');
    
    // Clear all form fields
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.reset();
        signupForm.querySelectorAll('input').forEach(input => {
            input.value = '';
        });
    }
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const signupToLogin = document.getElementById('signup-to-login');
    
    if (signupToLogin) {
        signupToLogin.onclick = () => {
            modal.classList.add('hidden');
            openLogin(userType);
        };
    }
    
    signupForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('signup-username').value.trim();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const passwordConfirm = document.getElementById('signup-password-confirm').value.trim();
        
        if (!username || !name || !email || !password || !passwordConfirm) {
            showMessage('Please fill all fields', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        try {
            let result;
            if (userType === 'organiser') {
                result = await window.api.organiserSignup({
                    username, name, email, password
                });
            } else {
                result = await window.api.customerSignup({
                    username, name, email, password
                });
            }
            
            if (result.success) {
                showMessage('Account created! Please login.', 'success');
                
                // Clear the form
                signupForm.reset();
                signupForm.querySelectorAll('input').forEach(input => {
                    input.value = '';
                });
                
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
                setTimeout(() => openLogin(userType), 500);
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

async function loadCustomerEventsTable() {
    try {
        const tbody = document.querySelector('#customer-events-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

        const result = await window.api.eventGetAll();

        if (!result.success || !result.events || result.events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No events available</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        result.events.forEach(ev => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ev.ID}</td>
                <td>${ev.name || 'N/A'}</td>
                <td>${ev.venue || 'N/A'}</td>
                <td>${ev.startDate || 'N/A'}</td>
                <td>${ev.endDate || 'N/A'}</td>
                <td>${ev.totalSeats || 0}</td>
                <td>${ev.soldTickets || 0}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        const tbody = document.querySelector('#customer-events-table tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7">Error loading events</td></tr>`;
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
    const modal = document.getElementById('modify-request-modal') || createModifyRequestModal();
    const overlay = document.getElementById('modal-overlay');
    
    // Reset the form to initial state
    modal.querySelector('form').innerHTML = `
        <label for="modify-event-id">Event ID</label>
        <input id="modify-event-id" type="number" required placeholder="Enter Event ID">
        <div class="modal-actions">
            <button type="submit">Find Event</button>
        </div>
    `;
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const form = modal.querySelector('form');
    form.onsubmit = async (e) => {
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
    
    form.onsubmit = async (e) => {
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
    
    document.getElementById('modify-back-btn').onclick = (e) => {
        e.preventDefault();
        openModifyRequest();
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
    eventsList.innerHTML = result.events.map((event) => `
        <div data-event-id="${event.ID}" style="padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; cursor: pointer; border-radius: 4px; background: #fff;">
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

// ======================= EVENT DETAILS PAGE =======================
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
            <p><strong>Staff Members:</strong> <span id="staff-count-display">Loading...</span></p>
            <p><strong>Vendors:</strong> <span id="vendor-count-display">Loading...</span></p>
        </div>
        
        <button id="details-customer-data-btn" style="margin-right: 10px; margin-bottom: 10px;">Customer Data</button>
        <button id="details-edit-staff-btn" style="margin-right: 10px; margin-bottom: 10px;">Edit Staff</button>
        <button id="details-edit-vendor-btn" style="margin-right: 10px; margin-bottom: 10px;">Edit Vendors</button>
        <button id="details-back-btn" style="margin-bottom: 10px;">Back</button>
    `;
    
    document.getElementById('details-customer-data-btn').onclick = showCustomerDataPage;
    document.getElementById('details-edit-staff-btn').onclick = showEditStaffPage;
    document.getElementById('details-edit-vendor-btn').onclick = showEditVendorPage;
    document.getElementById('details-back-btn').onclick = () => {
        currentEventDetail = null;
        currentViewEventId = null;
        showMenu('events');
    };
    
    // Fetch counts asynchronously and update display
    loadEventCounts(event.ID);
}

async function loadEventCounts(eventID) {
    try {
        const staffCountResult = await window.api.getStaffCountByEvent(eventID);
        const vendorCountResult = await window.api.getVendorCountByEvent(eventID);
        
        const staffCountSpan = document.getElementById('staff-count-display');
        const vendorCountSpan = document.getElementById('vendor-count-display');
        
        if (staffCountSpan) {
            staffCountSpan.textContent = staffCountResult.success ? staffCountResult.count : '0';
        }
        if (vendorCountSpan) {
            vendorCountSpan.textContent = vendorCountResult.success ? vendorCountResult.count : '0';
        }
    } catch (error) {
        console.error('Error loading event counts:', error);
    }
}

async function showCustomerDataPage() {
    if (!currentEventDetail) {
        showMessage('No event selected', 'error');
        return;
    }
    
    try {
        const result = await window.api.registrationGetByEvent(currentEventDetail.ID);
        const detailsMenu = document.getElementById('details-menu');
        
        let html = `<h2>${currentEventDetail.name} - Customer Data</h2>
            <button id="customer-data-back-btn" style="margin-bottom: 20px;">Back</button>`;
        
        if (result.success && result.registrations && result.registrations.length > 0) {
            html += `<table class="events-table"><thead><tr><th>Customer Name</th><th>Customer Email</th><th>Ticket Number</th><th>Fee Status</th><th>Action</th></tr></thead><tbody>`;
            result.registrations.forEach(reg => {
                const toggleStatus = reg.feeStatus === 'Paid' ? 'Unpaid' : 'Paid';
                html += `<tr>
                    <td>${reg.customerName || 'N/A'}</td>
                    <td>${reg.customerEmail || 'N/A'}</td>
                    <td>${reg.ticketNum}</td>
                    <td><strong>${reg.feeStatus}</strong></td>
                    <td>
                        <button data-cust-id="${reg.customerID}" data-event-id="${currentEventDetail.ID}" class="toggle-fee-btn">Mark as ${toggleStatus}</button>
                    </td>
                </tr>`;
            });
            html += `</tbody></table>`;
        } else {
            html += '<p style="margin: 20px 0; padding: 20px; background: #f0f0f0; border-radius: 4px;">No customers registered</p>';
        }
        
        detailsMenu.innerHTML = html;
        
        // Store registrations for use in event delegation
        const registrationsData = result.registrations;
        
        // Add event delegation for fee toggle
        detailsMenu.addEventListener('click', async (e) => {
            if (e.target.classList.contains('toggle-fee-btn')) {
                const custID = parseInt(e.target.dataset.custId);
                const eventID = parseInt(e.target.dataset.eventId);
                const reg = registrationsData.find(r => r.customerID === custID);
                
                if (!reg) {
                    showMessage('Registration not found', 'error');
                    return;
                }
                
                const newStatus = reg.feeStatus === 'Paid' ? 'Unpaid' : 'Paid';
                
                try {
                    const updateRes = await window.api.updateCustomerFeeStatus({
                        custID: custID,
                        eventID: eventID,
                        feeStatus: newStatus
                    });
                    
                    if (updateRes.success) {
                        showMessage(`Fee status updated to ${newStatus}!`, 'success');
                        await showCustomerDataPage();
                    } else {
                        showMessage(updateRes.message || 'Failed to update', 'error');
                    }
                } catch (error) {
                    showMessage(`Error: ${error.message}`, 'error');
                }
            }
        });
        
        document.getElementById('customer-data-back-btn').onclick = () => updateEventDetailsMenu(currentEventDetail);
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

async function showEditStaffPage() {
    if (!currentViewEventId) {
        showMessage('No event selected', 'error');
        return;
    }
    
    try {
        const result = await window.api.staffGetByEvent(currentViewEventId);
        const detailsMenu = document.getElementById('details-menu');
        
        let html = `<h2>${currentEventDetail.name} - Manage Staff</h2>
            <button id="add-staff-btn" style="margin-bottom: 10px;">Add Staff</button>
            <button id="staff-back-btn" style="margin-bottom: 20px;">Back</button>`;
        
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
}

function showAddStaffForm() {
    const detailsMenu = document.getElementById('details-menu');
    detailsMenu.innerHTML = `
        <h2>${currentEventDetail.name} - Add Staff Member</h2>
        <form id="add-staff-details-form" class="modal-form" style="max-width: 400px;">
            <label for="staff-name-input">Staff Name</label>
            <input id="staff-name-input" type="text" required>
            <label for="staff-email-input">Email</label>
            <input id="staff-email-input" type="email" required>
            <label for="staff-team-input">Team</label>
            <input id="staff-team-input" type="text" required>
            <label for="staff-position-input">Position</label>
            <input id="staff-position-input" type="text" required>
            <div class="button-group">
                <button type="submit" id="staff-submit-btn">Add Staff</button>
                <button type="button" id="staff-cancel-btn">Cancel</button>
            </div>
        </form>
    `;
    
    document.getElementById('add-staff-details-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('staff-name-input').value.trim();
        const email = document.getElementById('staff-email-input').value.trim();
        const team = document.getElementById('staff-team-input').value.trim();
        const position = document.getElementById('staff-position-input').value.trim();
        
        if (!name || !email || !team || !position) {
            showMessage('Please fill all fields', 'error');
            return;
        }
        
        try {
            const result = await window.api.staffAdd({
                eventID: currentViewEventId,
                name, email, team, position
            });
            
            if (result.success) {
                showMessage('Staff added!', 'success');
                await showEditStaffPage();
            } else {
                showMessage(result.message || 'Failed', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
    
    document.getElementById('staff-cancel-btn').onclick = showEditStaffPage;
}

async function deleteStaffMember(staffID) {
    try {
        const result = await window.api.staffDelete(staffID);
        if (result.success) {
            showMessage('Staff deleted!', 'success');
            await showEditStaffPage();
        } else {
            showMessage(result.message || 'Failed', 'error');
        }
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

async function showEditVendorPage() {
    if (!currentViewEventId) {
        showMessage('No event selected', 'error');
        return;
    }
    
    try {
        const result = await window.api.vendorGetByEvent(currentViewEventId);
        const detailsMenu = document.getElementById('details-menu');
        
        let html = `<h2>${currentEventDetail.name} - Manage Vendors</h2>
            <button id="add-vendor-btn" style="margin-bottom: 10px;">Add Vendor</button>
            <button id="vendor-back-btn" style="margin-bottom: 20px;">Back</button>`;
        
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

function showAddVendorForm() {
    const detailsMenu = document.getElementById('details-menu');
    detailsMenu.innerHTML = `
        <h2>${currentEventDetail.name} - Add Vendor</h2>
        <form id="add-vendor-details-form" class="modal-form" style="max-width: 400px;">
            <label for="vendor-name-input">Vendor Name</label>
            <input id="vendor-name-input" type="text" required>
            <label for="vendor-email-input">Email</label>
            <input id="vendor-email-input" type="email" required>
            <label for="vendor-service-input">Product/Service</label>
            <input id="vendor-service-input" type="text" required>
            <label for="vendor-charges-input">Charges Due</label>
            <input id="vendor-charges-input" type="number" step="0.01">
            <div class="button-group">
                <button type="submit" id="vendor-submit-btn">Add Vendor</button>
                <button type="button" id="vendor-cancel-btn">Cancel</button>
            </div>
        </form>
    `;
    
    document.getElementById('add-vendor-details-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('vendor-name-input').value.trim();
        const email = document.getElementById('vendor-email-input').value.trim();
        const prod_serv = document.getElementById('vendor-service-input').value.trim();
        const chargesDue = parseFloat(document.getElementById('vendor-charges-input').value || 0);
        
        if (!name || !email || !prod_serv) {
            showMessage('Please fill required fields', 'error');
            return;
        }
        
        try {
            const result = await window.api.vendorAdd({
                eventID: currentViewEventId,
                name, email, prod_serv, chargesDue
            });
            
            if (result.success) {
                showMessage('Vendor added!', 'success');
                await showEditVendorPage();
            } else {
                showMessage(result.message || 'Failed', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
    
    document.getElementById('vendor-cancel-btn').onclick = showEditVendorPage;
}

async function deleteVendor(vendorID) {
    try {
        const result = await window.api.vendorDelete(vendorID);
        if (result.success) {
            showMessage('Vendor deleted!', 'success');
            await showEditVendorPage();
        } else {
            showMessage(result.message || 'Failed', 'error');
        }
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

// ======================= CUSTOMER REGISTRATION =======================
function createRegisterEventModal() {
    const modal = document.createElement('div');
    modal.id = 'register-event-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Register for Event</h2>
                <button class="close" data-close="register-event-modal">×</button>
            </div>
            <form id="register-event-form" class="modal-form">
                <label for="register-event-id">Event ID</label>
                <input id="register-event-id" type="number" required>
                <div class="modal-actions">
                    <button type="submit">Register</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

async function openRegisterEvent() {
    const modal = document.getElementById('register-event-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (!currentUser || !currentUser.ID) {
        showMessage('Please login first', 'error');
        return;
    }
    
    // Clear previous input values
    const registerForm = document.getElementById('register-event-form');
    if (registerForm) registerForm.reset();
    document.getElementById('register-event-id').value = '';
    
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    const form = modal.querySelector('#register-event-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const eventID = parseInt(document.getElementById('register-event-id').value || 0);
        
        if (!eventID) {
            showMessage('Please enter Event ID', 'error');
            return;
        }

        try {
            // Validate event exists
            const eventsResult = await window.api.eventGetAll();
            const eventExists = eventsResult.success && eventsResult.events?.some(ev => ev.ID === eventID);
            
            if (!eventExists) {
                showMessage('Event ID does not exist', 'error');
                return;
            }

            const res = await window.api.customerRegister({
                custID: currentUser.ID,
                eventID
            });
            
            if (res && res.success) {
                showMessage(`Registered! Ticket #${res.ticketNum || ''}`, 'success');
                modal.classList.add('hidden');
                overlay.classList.add('hidden');
                document.getElementById('register-event-id').value = '';
                await loadCustomerEventsTable();
            } else {
                showMessage(res?.message || 'Registration failed', 'error');
            }
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    };
}

// View registrations
async function openRegistrationsModal() {
    if (!currentUser || !currentUser.ID) {
        showMessage('Please login to view registrations', 'error');
        return;
    }

    try {
        const res = await window.api.customerGetRegistrations(currentUser.ID);

        if (!res.success || !res.registrations || res.registrations.length === 0) {
            showMessage('No registrations yet', 'info');
            return;
        }

        const menu = document.getElementById('customer-event-menu');
        let html = `<h2>My Registrations</h2>
            <button id="registrations-back-btn" style="margin-bottom: 20px;">Back to Events</button>
            <table class="events-table" style="margin-top: 0;">
                <thead>
                    <tr>
                        <th>Event ID</th>
                        <th>Event Name</th>
                        <th>Ticket #</th>
                        <th>Fee Status</th>
                    </tr>
                </thead>
                <tbody>`;
        
        res.registrations.forEach(r => {
            const eventName = r.eventName || `Event ${r.eventID}`;
            html += `<tr>
                <td>${r.eventID}</td>
                <td>${eventName}</td>
                <td>${r.ticketNum}</td>
                <td>${r.feeStatus}</td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
        
        menu.innerHTML = html;
        
        // Bind the back button immediately after setting innerHTML
        const backBtn = document.getElementById('registrations-back-btn');
        if (backBtn) {
            backBtn.onclick = () => {
                showCustomerEventMenu();
            };
        }
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
}

// ======================= INITIALIZE APP =======================
function initializeApp() {
    // Main menu buttons
    const orgBtn = document.getElementById('org-btn');
    const custBtn = document.getElementById('cust-btn');
    
    if (orgBtn) orgBtn.onclick = () => showMenu('organiser');
    if (custBtn) custBtn.onclick = () => showMenu('customer');
    
    // Organiser menu
    const orgBackBtn = document.getElementById('org-back-btn');
    const orgSignupBtn = document.getElementById('org-signup-btn');
    const orgLoginBtn = document.getElementById('org-login-btn');
    
    if (orgBackBtn) orgBackBtn.onclick = () => showMenu('main');
    if (orgSignupBtn) orgSignupBtn.onclick = () => openSignup('organiser');
    if (orgLoginBtn) orgLoginBtn.onclick = () => openLogin('organiser');
    
    // Customer menu
    const custBackBtn = document.getElementById('cust-back-btn');
    const custSignupBtn = document.getElementById('cust-signup-btn');
    const custLoginBtn = document.getElementById('cust-login-btn');
    
    if (custBackBtn) custBackBtn.onclick = () => showMenu('main');
    if (custSignupBtn) custSignupBtn.onclick = () => openSignup('customer');
    if (custLoginBtn) custLoginBtn.onclick = () => openLogin('customer');
    
    // Event menu
    const addEventBtn = document.getElementById('add-event-btn');
    const modifyEventBtn = document.getElementById('modify-event-btn');
    const deleteEventBtn = document.getElementById('delete-event-btn');
    const eventDetailsBtn = document.getElementById('event-details-btn');
    const eventBackBtn = document.getElementById('event-back-btn');
    
    if (addEventBtn) addEventBtn.onclick = openAddEvent;
    if (modifyEventBtn) modifyEventBtn.onclick = openModifyRequest;
    if (deleteEventBtn) deleteEventBtn.onclick = openDeleteEvent;
    if (eventDetailsBtn) eventDetailsBtn.onclick = openEventDetails;
    if (eventBackBtn) eventBackBtn.onclick = () => {
        currentUser = null;
        currentViewEventId = null;
        showMenu('main');
    };
    
    // Overlay click to close modals
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.onclick = () => {
            overlay.classList.add('hidden');
            document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
        };
    }
    
    // Close button handlers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close')) {
            const modalId = e.target.getAttribute('data-close');
            const modal = document.getElementById(modalId);
            const overlay = document.getElementById('modal-overlay');
            
            if (modal) modal.classList.add('hidden');
            if (overlay && !document.querySelectorAll('.modal:not(.hidden)').length) {
                overlay.classList.add('hidden');
            }
        }
    });
}

// Helper function to show/hide menus
function showMenu(menuName) {
    // Hide all menus first
    Object.values(menus).forEach(menu => {
        if (menu) menu.classList.add('hidden');
    });
    
    // Show the requested menu
    if (menus[menuName]) {
        menus[menuName].classList.remove('hidden');
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Add these functions after the openLogin function:

async function loadOrganizerEvents() {
    try {
        const result = await window.api.eventGetAll();
        
        if (result.success && result.events) {
            const filteredEvents = result.events.filter(e => e.orgID === currentUser.ID);
            
            const tbody = document.querySelector('#events-table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (filteredEvents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No events yet</td></tr>';
            } else {
                filteredEvents.forEach(ev => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${ev.ID}</td>
                        <td>${ev.name}</td>
                        <td>${ev.venue}</td>
                        <td>${ev.startDate}</td>
                        <td>${ev.endDate}</td>
                        <td>${ev.totalSeats}</td>
                        <td>${ev.soldTickets || 0}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
        
        showMenu('events');
    } catch (error) {
        showMessage(`Error loading events: ${error.message}`, 'error');
    }
}

function showCustomerEventMenu() {
    const customerMenu = document.getElementById('customer-event-menu');
    
    // Recreate the entire menu HTML
    customerMenu.innerHTML = `
        <h2>Customer - Events</h2>
        <button id="register-event-btn" style="margin-bottom: 10px;">Register for Event</button>
        <button id="view-registrations-btn" style="margin-bottom: 10px;">View My Registrations</button>
        <button id="customer-events-back-btn" style="margin-bottom: 20px;">Back</button>
        <table id="customer-events-table" class="events-table">
            <thead>
                <tr>
                    <th>Event ID</th>
                    <th>Event Name</th>
                    <th>Venue</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Total Seats</th>
                    <th>Sold Tickets</th>
                </tr>
            </thead>
            <tbody>
                <tr><td colspan="7">Loading...</td></tr>
            </tbody>
        </table>
    `;
    
    // Now bind the event listeners to the newly created buttons
    const registerBtn = document.getElementById('register-event-btn');
    const viewRegsBtn = document.getElementById('view-registrations-btn');
    const backBtn = document.getElementById('customer-events-back-btn');
    
    if (registerBtn) registerBtn.onclick = openRegisterEvent;
    if (viewRegsBtn) viewRegsBtn.onclick = openRegistrationsModal;
    if (backBtn) {
        backBtn.onclick = () => {
            currentUser = null;
            showMenu('main');
        };
    }
    
    loadCustomerEventsTable();
    showMenu('customerEvents');
}
