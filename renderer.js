// MENUS OBJECT
const menus = {
    main: document.getElementById('main-menu'),
    organiser: document.getElementById('organiser-menu'),
    customer: document.getElementById('customer-menu'),
    events: document.getElementById('event-menu'),
    details: document.getElementById('details-menu'),
    staff: document.getElementById('staff-menu'),
    vendors: document.getElementById('vendors-menu'),
    customerEvents: document.getElementById('customer-event-menu')
};

// Simple toast/message helper (non-blocking)
function showMessage(text, type = 'info', timeout = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.style.position = 'fixed';
        container.style.right = '18px';
        container.style.top = '18px';
        container.style.zIndex = 20000;
        document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = text;
    el.style.marginTop = '8px';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '6px';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    el.style.color = '#fff';
    el.style.fontSize = '13px';
    if (type === 'success') el.style.background = '#28a745';
    else if (type === 'error') el.style.background = '#dc3545';
    else if (type === 'warning') el.style.background = '#ffc107'; el.style.color = type === 'warning' ? '#212529' : '#fff';
    container.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 300ms ease, transform 300ms ease';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-6px)';
        setTimeout(() => { try { container.removeChild(el); } catch (e) {} }, 320);
    }, timeout);
}

// Helper to show a menu
function showMenu(menuId) {
    Object.values(menus).forEach(menu => menu.classList.add('hidden'));
    menus[menuId].classList.remove('hidden');
}

// MAIN MENU
document.getElementById('org-btn').onclick = () => showMenu('organiser');
document.getElementById('cust-btn').onclick = () => showMenu('customer');

// ORGANISER MENU
document.getElementById('org-back-btn').onclick = () => showMenu('main');
document.getElementById('org-signup-btn').onclick = () => openSignup('organiser');
document.getElementById('org-login-btn').onclick = () => openLogin('organiser');

// CUSTOMER MENU
document.getElementById('cust-back-btn').onclick = () => showMenu('main');
document.getElementById('cust-signup-btn').onclick = () => openSignup('customer');
document.getElementById('cust-login-btn').onclick = () => openLogin('customer');

// EVENT MENU
document.getElementById('event-back-btn').onclick = () => showMenu('main');
document.getElementById('add-event-btn').onclick = () => openAddEvent();
document.getElementById('modify-event-btn').onclick = () => openModifyRequest();
document.getElementById('delete-event-btn').onclick = () => openDeleteEvent();
document.getElementById('view-details-btn').onclick = () => openViewDetailsRequest();

// CUSTOMER EVENT REGISTRATION MENU
document.getElementById('customer-back-btn').onclick = () => showMenu('customer');
document.getElementById('register-event-btn').onclick = () => openRegisterEvent();
// open the registrations modal
document.getElementById('view-registrations-btn').onclick = () => openRegistrationsModal();

// DETAILS MENU
document.getElementById('details-back-btn').onclick = () => showMenu('events');
document.getElementById('details-customers-btn').onclick = () => { if (!currentViewEventId) { showMessage('Please select an Event ID first.', 'warning'); return; } renderCustomersForCurrentEvent(); openModal(eventCustomersModal); };
document.getElementById('details-staff-menu-btn').onclick = () => { renderStaffTable(); showMenu('staff'); };
document.getElementById('details-vendors-menu-btn').onclick = () => { renderVendorsTable(); showMenu('vendors'); };

// STAFF MENU
document.getElementById('staff-back-btn').onclick = () => showMenu('details');
document.getElementById('add-staff-btn').onclick = () => openAddStaff();
document.getElementById('modify-staff-btn').onclick = () => openModifyStaffRequest();
document.getElementById('delete-staff-btn').onclick = () => openDeleteStaff();

// VENDORS MENU
document.getElementById('vendors-back-btn').onclick = () => showMenu('details');
document.getElementById('add-vendor-btn').onclick = () => openAddVendor();
document.getElementById('modify-vendor-btn').onclick = () => openModifyVendorRequest();
document.getElementById('delete-vendor-btn').onclick = () => openDeleteVendor();

/* Modal helpers and handlers */
const overlay = document.getElementById('modal-overlay');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const addEventModal = document.getElementById('add-event-modal');
const deleteEventModal = document.getElementById('delete-event-modal');
const modifyRequestModal = document.getElementById('modify-request-modal');
const editEventModal = document.getElementById('edit-event-modal');
const registrationsModal = document.getElementById('registrations-modal');
const registerEventModal = document.getElementById('register-event-modal');
const viewDetailsRequestModal = document.getElementById('view-details-request-modal');

// Staff modals
const addStaffModal = document.getElementById('add-staff-modal');
const modifyStaffRequestModal = document.getElementById('modify-staff-request-modal');
const editStaffModal = document.getElementById('edit-staff-modal');
const deleteStaffModal = document.getElementById('delete-staff-modal');

// Vendor modals
const addVendorModal = document.getElementById('add-vendor-modal');
const modifyVendorRequestModal = document.getElementById('modify-vendor-request-modal');
const editVendorModal = document.getElementById('edit-vendor-modal');
const deleteVendorModal = document.getElementById('delete-vendor-modal');

let currentViewEventId = null;

// modal refs for lists (no longer used - replaced with menus)
const eventCustomersModal = document.getElementById('event-customers-modal');
const eventStaffModal = null;      // removed - now using staff menu
const eventVendorsModal = null;    // removed - now using vendors menu

// simple sample staff/vendors data (can be replaced by real data later)
const sampleStaff = [
    { staffId: 'S001', name: 'John Smith', role: 'Coordinator', eventId: 'E1001' },
    { staffId: 'S002', name: 'Alice Brown', role: 'Security', eventId: 'E1001' },
    { staffId: 'S003', name: 'Mike Davis', role: 'Setup Manager', eventId: 'E1002' }
];
const sampleVendors = [
    { vendorId: 'V001', name: 'Catering Co', service: 'Catering', eventId: 'E1001' },
    { vendorId: 'V002', name: 'AV Works', service: 'Audio/Visual', eventId: 'E1001' },
    { vendorId: 'V003', name: 'Floral Designs', service: 'Decorations', eventId: 'E1002' }
];

function openViewDetailsRequest() {
    if (!viewDetailsRequestModal) {
        showMessage('Details request dialog is not available.', 'error');
        return;
    }
    openModal(viewDetailsRequestModal);
}


function openModal(modalEl) {
    overlay.classList.remove('hidden');
    overlay.classList.add('show');
    modalEl.classList.remove('hidden');
    modalEl.classList.add('show');
    // prevent background scroll while modal open
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    // focus first input for accessibility
    const first = modalEl.querySelector('input, button, [tabindex]');
    if (first && typeof first.focus === 'function') first.focus();
}

function closeModal(modalEl) {
    overlay.classList.remove('show');
    overlay.classList.add('hidden');
    modalEl.classList.remove('show');
    modalEl.classList.add('hidden');
    try { document.body.style.overflow = ''; } catch (e) {}
}

function openLogin(role) {
    loginModal.dataset.role = role; // 'organiser' or 'customer'
    openModal(loginModal);
}

function openSignup(role) {
    signupModal.dataset.role = role;
    openModal(signupModal);
}

function openAddEvent() {
    openModal(addEventModal);
}

function openDeleteEvent() {
    openModal(deleteEventModal);
}

function openModifyRequest() {
    openModal(modifyRequestModal);
}

function openEditEvent() {
    openModal(editEventModal);
}

function openRegistrationsModal() {
    renderRegistrationsInto('registrations-table');
    if (!registrationsModal) {
        console.error('Registrations modal element not found');
        showMessage('Registrations are currently unavailable. Please reload the application.', 'error');
        return;
    }
    openModal(registrationsModal);
}

function openRegisterEvent() {
    if (!registerEventModal) {
        console.error('Register modal element not found');
        showMessage('Registration dialog is not available. Please reload the application.', 'error');
        return;
    }
    openModal(registerEventModal);
}

// Register Event form handling
const registerEventForm = document.getElementById('register-event-form');
if (registerEventForm) {
    registerEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('register-event-id').value.trim();
        if (!id) { showMessage('Please enter an Event ID to continue.', 'error'); return; }
        const ev = sampleEvents.find(ev => ev.id === id);
        if (!ev) { showMessage('Event not found. Verify the Event ID and try again.', 'error'); return; }
        if (typeof ev.totalSeats === 'number' && typeof ev.ticketsSold === 'number' && ev.ticketsSold >= ev.totalSeats) {
            showMessage('Registration failed: the event is fully booked.', 'error');
            return;
        }
        // prevent duplicate registration for the same event (single registration per session)
        const already = sampleRegistrations.find(r => r.eventId === id);
        if (already) { showMessage('You are already registered for this event.', 'info'); return; }
        // increment tickets sold
        ev.ticketsSold = (ev.ticketsSold || 0) + 1;
        // add registration record (default unpaid)
        sampleRegistrations.push({ eventId: id, paid: false });
        // re-render tables
        renderEventsInto('events-table');
        const cwrap = document.getElementById('customer-events-table-wrap');
        if (cwrap && !cwrap.classList.contains('hidden')) {
            renderEventsInto('customer-events-table');
        }
        closeModal(registerEventModal);
        showMessage('Registration completed successfully.', 'success');
    });
}

// View Details request form handling
const viewDetailsRequestForm = document.getElementById('view-details-request-form');
if (viewDetailsRequestForm) {
    viewDetailsRequestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('view-details-event-id').value.trim();
        if (!id) { showMessage('Please enter an Event ID to continue.', 'error'); return; }
        const ev = sampleEvents.find(ev => ev.id === id);
        if (!ev) { showMessage('Event not found. Verify the Event ID and try again.', 'error'); return; }
        // set current ID and open details
        currentViewEventId = id;
        const nameEl = document.getElementById('view-details-event-name');
        const idSpan = document.getElementById('view-details-event-id-span');
        if (nameEl) nameEl.textContent = ev.name || '(deleted event)';
        if (idSpan) idSpan.textContent = `(${id})`;
        closeModal(viewDetailsRequestModal);
        showMenu('details');
    });
}

// Render lists filtered by currentViewEventId
function renderCustomersForCurrentEvent() {
    const table = document.getElementById('event-customers-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    const filtered = sampleRegistrations.filter(r => r.eventId === currentViewEventId);
    filtered.forEach((reg, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>CUST-${idx + 1}</td>
            <td>${reg.paid ? 'Paid' : 'Unpaid'}</td>
            <td><button class="btn-secondary" onclick="togglePaidForCurrent('${reg.eventId}', ${idx})">Toggle Paid</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function togglePaidForCurrent(eventId, idx) {
    const regs = sampleRegistrations.filter(r => r.eventId === eventId);
    if (regs[idx]) {
        regs[idx].paid = !regs[idx].paid;
        renderCustomersForCurrentEvent();
    }
}

function renderStaffForCurrentEvent() {
    const table = document.getElementById('event-staff-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    const filtered = sampleStaff.filter(s => s.eventId === currentViewEventId);
    filtered.forEach((s, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.staffId}</td>
            <td>${s.name}</td>
            <td>${s.role}</td>
            <td>${s.eventId}</td>
            <td><button class="btn-secondary" onclick="openStaffDetail('${s.staffId}')">View</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderVendorsForCurrentEvent() {
    const table = document.getElementById('event-vendors-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    const filtered = sampleVendors.filter(v => v.eventId === currentViewEventId);
    filtered.forEach((v, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${v.vendorId}</td>
            <td>${v.name}</td>
            <td>${v.service}</td>
            <td>${v.eventId}</td>
            <td><button class="btn-secondary" onclick="openVendorDetail('${v.vendorId}')">View</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// small helpers for opening detail modals (by id)
function openStaffDetail(staffId) {
    const s = sampleStaff.find(x => x.staffId === staffId);
    if (!s) return;
    showMessage(`Staff: ${s.name} — ${s.role}`, 'info');
}

function openVendorDetail(vendorId) {
    const v = sampleVendors.find(x => x.vendorId === vendorId);
    if (!v) return;
    showMessage(`Vendor: ${v.name} — ${v.service}`, 'info');
}

// Close elements (any element with data-close attribute)
document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-close');
        const modal = document.getElementById(target);
        if (modal) closeModal(modal);
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        [loginModal, signupModal, addEventModal, deleteEventModal, modifyRequestModal, editEventModal, registrationsModal, registerEventModal, eventCustomersModal, eventStaffModal, eventVendorsModal].forEach(m => { if (m && !m.classList.contains('hidden')) closeModal(m); });
    }
});

// Overlay click closes any open modal
overlay.addEventListener('click', () => {
    [loginModal, signupModal, addEventModal, deleteEventModal, modifyRequestModal, editEventModal, registrationsModal, registerEventModal, eventCustomersModal, eventStaffModal, eventVendorsModal].forEach(m => { if (m && !m.classList.contains('hidden')) closeModal(m); });
});

// Switch links between login and signup inside modals
document.getElementById('login-to-signup').addEventListener('click', () => {
    const role = loginModal.dataset.role || 'customer';
    closeModal(loginModal);
    openSignup(role);
});
document.getElementById('signup-to-login').addEventListener('click', () => {
    const role = signupModal.dataset.role || 'customer';
    closeModal(signupModal);
    openLogin(role);
});

// Login form submission
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const role = loginModal.dataset.role || 'customer';
    // Basic validation already enforced by 'required' attributes
    closeModal(loginModal);
    if (role === 'organiser') {
        showMenu('events');
    } else {
        // populate and reveal the customer events table only after customer login
        renderEventsInto('customer-events-table');
        const wrap = document.getElementById('customer-events-table-wrap');
        if (wrap) wrap.classList.remove('hidden');
        showMenu('customerEvents');
    }
});

// Signup form submission (simple client-side simulation)
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = document.getElementById('signup-password').value;
    const pwd2 = document.getElementById('signup-password-confirm').value;
    if (pwd !== pwd2) {
        showMessage('Passwords do not match. Please re-enter your password.', 'error');
        return;
    }
    const role = signupModal.dataset.role || 'customer';
    // Simulate successful signup then open appropriate area or go to login
    closeModal(signupModal);
    // After signup, automatically open login so user can login
    openLogin(role);
});

// Add Event form submission
const addEventForm = document.getElementById('add-event-form');
if (addEventForm) {
    addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('add-event-name').value.trim();
        const start = document.getElementById('add-event-start').value;
        const end = document.getElementById('add-event-end').value;
        const seats = parseInt(document.getElementById('add-event-seats').value, 10);
        if (!name || !start || !end || Number.isNaN(seats)) {
            showMessage('Please complete all required fields correctly.', 'error');
            return;
        }
            const venue = document.getElementById('add-event-venue').value.trim();
            if (!venue) { showMessage('Please provide a venue for the event.', 'error'); return; }
        // auto-generate a unique event ID
        const id = 'E' + Date.now();
            const newEv = { name, venue, id, startDate: start, endDate: end, totalSeats: seats, ticketsSold: 0 };
        sampleEvents.push(newEv);
        // re-render organiser table
        renderEventsInto('events-table');
        // if customer table visible, re-render it too
        const cwrap = document.getElementById('customer-events-table-wrap');
        if (cwrap && !cwrap.classList.contains('hidden')) {
            renderEventsInto('customer-events-table');
        }
        closeModal(addEventModal);
    });
}

// Delete Event form submission
const deleteEventForm = document.getElementById('delete-event-form');
if (deleteEventForm) {
    deleteEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('delete-event-id').value.trim();
        if (!id) { showMessage('Please enter an Event ID to delete.', 'error'); return; }
        const idx = sampleEvents.findIndex(ev => ev.id === id);
        if (idx === -1) {
            showMessage('Event ID not found. Please verify and try again.', 'error');
            return;
        }
        // remove the event
        sampleEvents.splice(idx, 1);
        // re-render organiser table
        renderEventsInto('events-table');
        // if customer table visible, re-render it too
        const cwrap = document.getElementById('customer-events-table-wrap');
        if (cwrap && !cwrap.classList.contains('hidden')) {
            renderEventsInto('customer-events-table');
        }
        closeModal(deleteEventModal);
    });
}

// Modify Request form: load event by ID and open edit modal
const modifyRequestForm = document.getElementById('modify-request-form');
if (modifyRequestForm) {
    modifyRequestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('modify-event-id').value.trim();
        if (!id) { showMessage('Please enter an Event ID to modify.', 'error'); return; }
        const ev = sampleEvents.find(ev => ev.id === id);
        if (!ev) { showMessage('Event not found. Verify the Event ID and try again.', 'error'); return; }
        // populate edit form
        document.getElementById('edit-event-id').value = ev.id;
        document.getElementById('edit-event-name').value = ev.name;
        document.getElementById('edit-event-start').value = ev.startDate;
        document.getElementById('edit-event-end').value = ev.endDate;
        document.getElementById('edit-event-seats').value = ev.totalSeats;
        document.getElementById('edit-event-venue').value = ev.venue || '';
        closeModal(modifyRequestModal);
        openEditEvent();
    });
}

// Edit Event form submission: save changes back to sampleEvents
const editEventForm = document.getElementById('edit-event-form');
if (editEventForm) {
    editEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-event-id').value.trim();
        const name = document.getElementById('edit-event-name').value.trim();
        const start = document.getElementById('edit-event-start').value;
        const end = document.getElementById('edit-event-end').value;
        const seats = parseInt(document.getElementById('edit-event-seats').value, 10);
        const venue = document.getElementById('edit-event-venue').value.trim();
        if (!id || !name || !start || !end || Number.isNaN(seats) || !venue) {
            showMessage('Please complete all fields correctly before saving.', 'error');
            return;
        }
        const idx = sampleEvents.findIndex(ev => ev.id === id);
        if (idx === -1) { showMessage('Event not found. Please verify the Event ID.', 'error'); return; }
        // update fields (keep ticketsSold as-is)
        sampleEvents[idx].name = name;
        sampleEvents[idx].venue = venue;
        sampleEvents[idx].startDate = start;
        sampleEvents[idx].endDate = end;
        sampleEvents[idx].totalSeats = seats;
        // re-render tables
        renderEventsInto('events-table');
        const cwrap = document.getElementById('customer-events-table-wrap');
        if (cwrap && !cwrap.classList.contains('hidden')) {
            renderEventsInto('customer-events-table');
        }
        closeModal(editEventModal);
    });
}

// --- Events data and rendering ---
const sampleEvents = [
    { name: 'Summer Fest', venue: 'Central Park', id: 'E1001', startDate: '2025-06-01', endDate: '2025-06-03', totalSeats: 500, ticketsSold: 120 },
    { name: 'Tech Conference', venue: 'Convention Center', id: 'E1002', startDate: '2025-09-10', endDate: '2025-09-12', totalSeats: 300, ticketsSold: 250 },
    { name: 'Charity Gala', venue: 'Grand Ballroom', id: 'E1003', startDate: '2025-12-05', endDate: '2025-12-05', totalSeats: 200, ticketsSold: 180 }
];

// in-memory registrations (eventId, paid)
const sampleRegistrations = [];

function renderRegistrationsInto(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    sampleRegistrations.forEach(reg => {
        const ev = sampleEvents.find(e => e.id === reg.eventId) || {};
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ev.name || '(deleted event)'}</td>
            <td>${ev.venue || ''}</td>
            <td>${reg.eventId}</td>
            <td>${reg.paid ? 'Paid' : 'Unpaid'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEventsInto(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    sampleEvents.forEach(ev => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ev.name}</td>
            <td>${ev.venue || ''}</td>
            <td>${ev.id}</td>
            <td>${ev.startDate}</td>
            <td>${ev.endDate}</td>
            <td>${ev.totalSeats}</td>
            <td>${ev.ticketsSold}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Render default events into both organiser and customer tables (if present)
// Render organiser events table on load; customer table is rendered only after login
renderEventsInto('events-table');

function renderStaffTable() {
    const table = document.getElementById('staff-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Filter staff by current event ID
    const filteredStaff = sampleStaff.filter(s => s.eventId === currentViewEventId);
    
    filteredStaff.forEach(staff => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${staff.staffId}</td>
            <td>${staff.name}</td>
            <td>${staff.role}</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (filteredStaff.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="3" style="text-align:center; color:#999;">No staff assigned to this event</td>';
        tbody.appendChild(tr);
    }
}

function renderVendorsTable() {
    const table = document.getElementById('vendors-table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Filter vendors by current event ID
    const filteredVendors = sampleVendors.filter(v => v.eventId === currentViewEventId);
    
    filteredVendors.forEach(vendor => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${vendor.vendorId}</td>
            <td>${vendor.name}</td>
            <td>${vendor.service}</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (filteredVendors.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="3" style="text-align:center; color:#999;">No vendors assigned to this event</td>';
        tbody.appendChild(tr);
    }
}

// STAFF CRUD FUNCTIONS
function openAddStaff() {
    document.getElementById('add-staff-form').reset();
    openModal(addStaffModal);
}

function openModifyStaffRequest() {
    document.getElementById('modify-staff-request-form').reset();
    openModal(modifyStaffRequestModal);
}

function openDeleteStaff() {
    document.getElementById('delete-staff-form').reset();
    openModal(deleteStaffModal);
}

// VENDOR CRUD FUNCTIONS
function openAddVendor() {
    document.getElementById('add-vendor-form').reset();
    openModal(addVendorModal);
}

function openModifyVendorRequest() {
    document.getElementById('modify-vendor-request-form').reset();
    openModal(modifyVendorRequestModal);
}

function openDeleteVendor() {
    document.getElementById('delete-vendor-form').reset();
    openModal(deleteVendorModal);
}

// Add Staff Form Handler
document.getElementById('add-staff-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('add-staff-name').value;
    const role = document.getElementById('add-staff-role').value;
    
    const newStaffId = 'S' + (Math.max(...sampleStaff.map(s => parseInt(s.staffId.substring(1)) || 0)), 0) + 1;
    sampleStaff.push({ staffId: newStaffId, name, role, eventId: currentViewEventId });
    
    showMessage(`Staff member '${name}' added successfully!`, 'success');
    closeModal(addStaffModal);
    renderStaffTable();
};

// Delete Staff Form Handler
document.getElementById('delete-staff-form').onsubmit = (e) => {
    e.preventDefault();
    const staffId = document.getElementById('delete-staff-id').value;
    const idx = sampleStaff.findIndex(s => s.staffId === staffId);
    
    if (idx < 0) {
        showMessage(`Staff ID '${staffId}' not found.`, 'error');
        return;
    }
    
    const staff = sampleStaff[idx];
    sampleStaff.splice(idx, 1);
    showMessage(`Staff member '${staff.name}' deleted successfully!`, 'success');
    closeModal(deleteStaffModal);
    renderStaffTable();
};

// Modify Staff Request Form Handler
document.getElementById('modify-staff-request-form').onsubmit = (e) => {
    e.preventDefault();
    const staffId = document.getElementById('modify-staff-id').value;
    const staff = sampleStaff.find(s => s.staffId === staffId);
    
    if (!staff) {
        showMessage(`Staff ID '${staffId}' not found.`, 'error');
        return;
    }
    
    document.getElementById('edit-staff-id').value = staff.staffId;
    document.getElementById('edit-staff-name').value = staff.name;
    document.getElementById('edit-staff-role').value = staff.role;
    
    closeModal(modifyStaffRequestModal);
    openModal(editStaffModal);
};

// Edit Staff Form Handler
document.getElementById('edit-staff-form').onsubmit = (e) => {
    e.preventDefault();
    const staffId = document.getElementById('edit-staff-id').value;
    const name = document.getElementById('edit-staff-name').value;
    const role = document.getElementById('edit-staff-role').value;
    
    const staff = sampleStaff.find(s => s.staffId === staffId);
    if (staff) {
        staff.name = name;
        staff.role = role;
        showMessage(`Staff member updated successfully!`, 'success');
    }
    
    closeModal(editStaffModal);
    renderStaffTable();
};

// Add Vendor Form Handler
document.getElementById('add-vendor-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('add-vendor-name').value;
    const service = document.getElementById('add-vendor-service').value;
    
    const newVendorId = 'V' + (Math.max(...sampleVendors.map(v => parseInt(v.vendorId.substring(1)) || 0)), 0) + 1;
    sampleVendors.push({ vendorId: newVendorId, name, service, eventId: currentViewEventId });
    
    showMessage(`Vendor '${name}' added successfully!`, 'success');
    closeModal(addVendorModal);
    renderVendorsTable();
};

// Delete Vendor Form Handler
document.getElementById('delete-vendor-form').onsubmit = (e) => {
    e.preventDefault();
    const vendorId = document.getElementById('delete-vendor-id').value;
    const idx = sampleVendors.findIndex(v => v.vendorId === vendorId);
    
    if (idx < 0) {
        showMessage(`Vendor ID '${vendorId}' not found.`, 'error');
        return;
    }
    
    const vendor = sampleVendors[idx];
    sampleVendors.splice(idx, 1);
    showMessage(`Vendor '${vendor.name}' deleted successfully!`, 'success');
    closeModal(deleteVendorModal);
    renderVendorsTable();
};

// Modify Vendor Request Form Handler
document.getElementById('modify-vendor-request-form').onsubmit = (e) => {
    e.preventDefault();
    const vendorId = document.getElementById('modify-vendor-id').value;
    const vendor = sampleVendors.find(v => v.vendorId === vendorId);
    
    if (!vendor) {
        showMessage(`Vendor ID '${vendorId}' not found.`, 'error');
        return;
    }
    
    document.getElementById('edit-vendor-id').value = vendor.vendorId;
    document.getElementById('edit-vendor-name').value = vendor.name;
    document.getElementById('edit-vendor-service').value = vendor.service;
    
    closeModal(modifyVendorRequestModal);
    openModal(editVendorModal);
};

// Edit Vendor Form Handler
document.getElementById('edit-vendor-form').onsubmit = (e) => {
    e.preventDefault();
    const vendorId = document.getElementById('edit-vendor-id').value;
    const name = document.getElementById('edit-vendor-name').value;
    const service = document.getElementById('edit-vendor-service').value;
    
    const vendor = sampleVendors.find(v => v.vendorId === vendorId);
    if (vendor) {
        vendor.name = name;
        vendor.service = service;
        showMessage(`Vendor updated successfully!`, 'success');
    }
    
    closeModal(editVendorModal);
    renderVendorsTable();
};
