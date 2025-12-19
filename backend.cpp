#include <iostream>
#include <fstream>
#include <cstring>
#include <ctime>
using namespace std;

/* ======================= GLOBAL FILE NAMES ======================= */
char ORG_FILE[] = "organisers.dat";
char CUST_FILE[] = "customers.dat";
char EVENT_FILE[] = "events.dat";
char REG_FILE[] = "registrations.dat";
char STAFF_FILE[] = "staff.dat";
char VENDOR_FILE[] = "vendors.dat";

// ========================== ENUM DEFINITIONS ==========================
enum EventType { MUN = 1, OLYMPIAD, SEMINAR, CEREMONY, FESTIVAL, CONCERT, CUSTOM };
enum UserType { ORGANISER = 1, CUSTOMER = 2 };
enum AuthChoice { SIGNUP = 1, LOGIN = 2 };
enum EventMenuChoice { ADD_EVENT = 1, VIEW_EVENTS = 2, MODIFY_EVENT = 3, DELETE_EVENT = 4, EXIT_MENU = 0 };

// ========================== STRUCT DEFINITIONS ==========================
struct Organiser {
    int ID;
    char name[50], email[50], username[20], password[20];
};

struct Customer {
    int ID;
    char name[50], email[50], username[20], password[20];
};

struct Event {
    int ID, orgID;
    char name[50], orgName[50], venue[50], startDate[20], endDate[20];
    int totalSeats, soldTickets;
    EventType type;
};

struct Staff {
    int ID, eventID;
    char name[50], email[50], team[20], position[20];
};

struct Vendor {
    int ID, eventID;
    char name[50], email[50], prod_serv[50];
    float chargesDue;
};

struct Registration {
    int customerID;
    int eventID;
    int ticketNum;
    char feeStatus[10];
};

/* ======================= UTILITY ======================= */
bool isEmptyFile(const char* filename) {
    ifstream file(filename, ios::binary);
    if (!file) return true;
    bool isEmpty = file.peek() == EOF;
    file.close();
    return isEmpty;
}

bool searchOrganiserID(int targetID) {
    ifstream file(ORG_FILE, ios::binary);
    if (!file) return false;
    Organiser org;
    while (file.read((char*)&org, sizeof(Organiser))) {
        if (org.ID == targetID) {
            file.close();
            return true;
        }
    }
    file.close();
    return false;
}

bool searchCustomerID(int targetID) {
    ifstream file(CUST_FILE, ios::binary);
    if (!file) return false;
    Customer cust;
    while (file.read((char*)&cust, sizeof(Customer))) {
        if (cust.ID == targetID) {
            file.close();
            return true;
        }
    }
    file.close();
    return false;
}

bool searchEventID(int targetID) {
    ifstream file(EVENT_FILE, ios::binary);
    if (!file) return false;
    Event event;
    while (file.read((char*)&event, sizeof(Event))) {
        if (event.ID == targetID) {
            file.close();
            return true;
        }
    }
    file.close();
    return false;
}

bool searchStaffID(int targetID) {
    ifstream file(STAFF_FILE, ios::binary);
    if (!file) return false;
    Staff staff;
    while (file.read((char*)&staff, sizeof(Staff))) {
        if (staff.ID == targetID) {
            file.close();
            return true;
        }
    }
    file.close();
    return false;
}

bool searchVendorID(int targetID) {
    ifstream file(VENDOR_FILE, ios::binary);
    if (!file) return false;
    Vendor vendor;
    while (file.read((char*)&vendor, sizeof(Vendor))) {
        if (vendor.ID == targetID) {
            file.close();
            return true;
        }
    }
    file.close();
    return false;
}

bool searchRegistration(int eventID, int custID) {
    ifstream file(REG_FILE, ios::binary);
    if (!file) return false;
    Registration reg;
    while (file.read((char*)&reg, sizeof(Registration))) {
        if (reg.customerID == custID && reg.eventID == eventID) {
            file.close();
            return true;
        }
    }
    file.close();
    return false;
}

/* ======================= ORGANISER FUNCTIONS ======================= */
void organiserSignup() {
    Organiser org;
    
    int newID;
    do {
        newID = (rand() % 900) + 100;
    } while (searchOrganiserID(newID));
    
    org.ID = newID;
    cin.ignore();
    cin.getline(org.name, 50);
    cin.getline(org.email, 50);
    cin.getline(org.username, 20);
    cin.getline(org.password, 20);
    
    ofstream file(ORG_FILE, ios::binary | ios::app);
    file.write((char*)&org, sizeof(Organiser));
    file.close();
    
    cout << "ORGANISER registered successfully!" << endl;
    cout << "Your ID: " << org.ID << endl;
    cout.flush();
}

void organiserLogin() {
    char username[20], password[20];
    
    cin.ignore();
    cin.getline(username, 20);
    cin.getline(password, 20);
    
    ifstream file(ORG_FILE, ios::binary);
    if (!file) {
        cout << "Invalid credentials" << endl;
        cout.flush();
        return;
    }
    
    Organiser org;
    while (file.read((char*)&org, sizeof(Organiser))) {
        if (strcmp(org.username, username) == 0 && strcmp(org.password, password) == 0) {
            cout << "ORGANISER LOGIN SUCCESS" << endl;
            cout << "ID: " << org.ID << " Name: " << org.name << " Email: " << org.email << endl;
            file.close();
            cout.flush();
            return;
        }
    }
    
    file.close();
    cout << "Invalid credentials" << endl;
    cout.flush();
}

/* ======================= CUSTOMER FUNCTIONS ======================= */
void customerSignup() {
    Customer cust;
    
    int newID;
    do {
        newID = (rand() % 900) + 100;
    } while (searchCustomerID(newID));
    
    cust.ID = newID;
    cin.ignore();
    cin.getline(cust.name, 50);
    cin.getline(cust.email, 50);
    cin.getline(cust.username, 20);
    cin.getline(cust.password, 20);
    
    ofstream file(CUST_FILE, ios::binary | ios::app);
    file.write((char*)&cust, sizeof(Customer));
    file.close();
    
    cout << "CUSTOMER registered successfully!" << endl;
    cout << "Your ID: " << cust.ID << endl;
    cout.flush();
}

void customerLogin() {
    char username[20], password[20];
    
    cin.ignore();
    cin.getline(username, 20);
    cin.getline(password, 20);
    
    ifstream file(CUST_FILE, ios::binary);
    if (!file) {
        cout << "Invalid credentials" << endl;
        cout.flush();
        return;
    }
    
    Customer cust;
    while (file.read((char*)&cust, sizeof(Customer))) {
        if (strcmp(cust.username, username) == 0 && strcmp(cust.password, password) == 0) {
            cout << "CUSTOMER LOGIN SUCCESS" << endl;
            cout << "ID: " << cust.ID << " Name: " << cust.name << " Email: " << cust.email << endl;
            file.close();
            cout.flush();
            return;
        }
    }
    
    file.close();
    cout << "Invalid credentials" << endl;
    cout.flush();
}

/* ======================= EVENT FUNCTIONS ======================= */
void addEvent() {
    Event event;
    event.orgID = 0;  // Will be set by organiser
    strcpy(event.orgName, "");
    
    int newID;
    do {
        newID = (rand() % 900) + 100;
    } while (searchEventID(newID));
    
    event.ID = newID;
    event.soldTickets = 0;
    
    cin.ignore();
    cin.getline(event.name, 50);
    cin.getline(event.startDate, 20);
    cin.getline(event.endDate, 20);
    cin.getline(event.venue, 50);
    cin >> event.totalSeats;
    int typeVal;
    cin >> typeVal;
    event.type = (EventType)typeVal;
    
    ofstream file(EVENT_FILE, ios::binary | ios::app);
    file.write((char*)&event, sizeof(Event));
    file.close();
    
    cout << "Event added successfully!" << endl;
    cout << "Event ID: " << event.ID << endl;
    cout.flush();
}

void viewEvents() {
    ifstream file(EVENT_FILE, ios::binary);
    if (!file || isEmptyFile(EVENT_FILE)) {
        cout << "No events found" << endl;
        cout.flush();
        return;
    }
    
    Event event;
    while (file.read((char*)&event, sizeof(Event))) {
        cout << "ID: " << event.ID << " Name: " << event.name << " Venue: " << event.venue 
             << " Seats: " << event.soldTickets << "/" << event.totalSeats << endl;
    }
    
    file.close();
    cout.flush();
}

void modifyEvent() {
    int eventID;
    cin >> eventID;
    
    if (!searchEventID(eventID)) {
        cout << "Event not found" << endl;
        cout.flush();
        return;
    }
    
    ifstream fileRead(EVENT_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Event event;
    while (fileRead.read((char*)&event, sizeof(Event))) {
        if (event.ID == eventID) {
            cin.ignore();
            cin.getline(event.name, 50);
            cin.getline(event.startDate, 20);
            cin.getline(event.endDate, 20);
            cin.getline(event.venue, 50);
            cin >> event.totalSeats;
        }
        fileWrite.write((char*)&event, sizeof(Event));
    }
    
    fileRead.close();
    fileWrite.close();
    
    remove(EVENT_FILE);
    rename("temp.dat", EVENT_FILE);
    
    cout << "Event Updated successfully!" << endl;
    cout.flush();
}

void deleteEvent() {
    int eventID;
    cin >> eventID;
    
    if (!searchEventID(eventID)) {
        cout << "Event not found" << endl;
        cout.flush();
        return;
    }
    
    ifstream fileRead(EVENT_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Event event;
    while (fileRead.read((char*)&event, sizeof(Event))) {
        if (event.ID != eventID) {
            fileWrite.write((char*)&event, sizeof(Event));
        }
    }
    
    fileRead.close();
    fileWrite.close();
    
    remove(EVENT_FILE);
    rename("temp.dat", EVENT_FILE);
    
    cout << "Event Deleted successfully!" << endl;
    cout.flush();
}

/* ======================= STAFF FUNCTIONS ======================= */
void addStaff(int eventID) {
    Staff staff;
    
    int newID;
    do {
        newID = (rand() % 900) + 100;
    } while (searchStaffID(newID));
    
    staff.ID = newID;
    staff.eventID = eventID;
    
    cin.ignore();
    cin.getline(staff.name, 50);
    cin.getline(staff.email, 50);
    cin.getline(staff.team, 20);
    cin.getline(staff.position, 20);
    
    ofstream file(STAFF_FILE, ios::binary | ios::app);
    file.write((char*)&staff, sizeof(Staff));
    file.close();
    
    cout << "Staff member added successfully!" << endl;
    cout.flush();
}

void viewStaff(int eventID) {
    ifstream file(STAFF_FILE, ios::binary);
    if (!file) {
        cout << "No staff found" << endl;
        cout.flush();
        return;
    }
    
    Staff staff;
    bool found = false;
    while (file.read((char*)&staff, sizeof(Staff))) {
        if (staff.eventID == eventID) {
            cout << "ID: " << staff.ID << " Name: " << staff.name << " Email: " << staff.email 
                 << " Team: " << staff.team << " Position: " << staff.position << endl;
            found = true;
        }
    }
    
    file.close();
    if (!found) cout << "No staff found for this event" << endl;
    cout.flush();
}

void deleteStaff() {
    int staffID;
    cin >> staffID;
    
    if (!searchStaffID(staffID)) {
        cout << "Staff not found" << endl;
        cout.flush();
        return;
    }
    
    ifstream fileRead(STAFF_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Staff staff;
    while (fileRead.read((char*)&staff, sizeof(Staff))) {
        if (staff.ID != staffID) {
            fileWrite.write((char*)&staff, sizeof(Staff));
        }
    }
    
    fileRead.close();
    fileWrite.close();
    
    remove(STAFF_FILE);
    rename("temp.dat", STAFF_FILE);
    
    cout << "Staff Deleted successfully!" << endl;
    cout.flush();
}

/* ======================= VENDOR FUNCTIONS ======================= */
void addVendor(int eventID) {
    Vendor vendor;
    
    int newID;
    do {
        newID = (rand() % 900) + 100;
    } while (searchVendorID(newID));
    
    vendor.ID = newID;
    vendor.eventID = eventID;
    
    cin.ignore();
    cin.getline(vendor.name, 50);
    cin.getline(vendor.email, 50);
    cin.getline(vendor.prod_serv, 50);
    cin >> vendor.chargesDue;
    
    ofstream file(VENDOR_FILE, ios::binary | ios::app);
    file.write((char*)&vendor, sizeof(Vendor));
    file.close();
    
    cout << "Vendor added successfully!" << endl;
    cout.flush();
}

void viewVendors(int eventID) {
    ifstream file(VENDOR_FILE, ios::binary);
    if (!file) {
        cout << "No vendors found" << endl;
        cout.flush();
        return;
    }
    
    Vendor vendor;
    bool found = false;
    while (file.read((char*)&vendor, sizeof(Vendor))) {
        if (vendor.eventID == eventID) {
            cout << "ID: " << vendor.ID << " Name: " << vendor.name << " Email: " << vendor.email 
                 << " Product/Service: " << vendor.prod_serv << " Charges: " << vendor.chargesDue << endl;
            found = true;
        }
    }
    
    file.close();
    if (!found) cout << "No vendors found for this event" << endl;
    cout.flush();
}

void deleteVendor() {
    int vendorID;
    cin >> vendorID;
    
    if (!searchVendorID(vendorID)) {
        cout << "Vendor not found" << endl;
        cout.flush();
        return;
    }
    
    ifstream fileRead(VENDOR_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Vendor vendor;
    while (fileRead.read((char*)&vendor, sizeof(Vendor))) {
        if (vendor.ID != vendorID) {
            fileWrite.write((char*)&vendor, sizeof(Vendor));
        }
    }
    
    fileRead.close();
    fileWrite.close();
    
    remove(VENDOR_FILE);
    rename("temp.dat", VENDOR_FILE);
    
    cout << "Vendor Deleted successfully!" << endl;
    cout.flush();
}

/* ======================= REGISTRATION FUNCTIONS ======================= */
void addRegistration() {
    Registration reg;
    
    cin >> reg.customerID;
    cin >> reg.eventID;
    cin >> reg.ticketNum;
    cin.ignore();
    cin.getline(reg.feeStatus, 10);
    
    ofstream file(REG_FILE, ios::binary | ios::app);
    file.write((char*)&reg, sizeof(Registration));
    file.close();
    
    cout << "Registration added successfully!" << endl;
    cout.flush();
}

void getRegistrationsByCustomer() {
    int custID;
    cin >> custID;
    
    ifstream file(REG_FILE, ios::binary);
    if (!file) {
        cout << "No registrations found" << endl;
        cout.flush();
        return;
    }
    
    Registration reg;
    bool found = false;
    while (file.read((char*)&reg, sizeof(Registration))) {
        if (reg.customerID == custID) {
            cout << "ID: " << reg.customerID << " EventID: " << reg.eventID 
                 << " Ticket: " << reg.ticketNum << " Status: " << reg.feeStatus << endl;
            found = true;
        }
    }
    
    file.close();
    if (!found) cout << "No registrations found for this customer" << endl;
    cout.flush();
}

void getRegistrationsByEvent() {
    int eventID;
    cin >> eventID;
    
    ifstream file(REG_FILE, ios::binary);
    if (!file) {
        cout << "No registrations found" << endl;
        cout.flush();
        return;
    }
    
    Registration reg;
    bool found = false;
    while (file.read((char*)&reg, sizeof(Registration))) {
        if (reg.eventID == eventID) {
            // Look up customer details from customers.dat
            ifstream custFile(CUST_FILE, ios::binary);
            Customer cust;
            char custName[50] = "Unknown";
            char custEmail[50] = "unknown@email.com";
            bool customerFound = false;
            
            while (custFile.read((char*)&cust, sizeof(Customer))) {
                if (cust.ID == reg.customerID) {
                    strcpy(custName, cust.name);
                    strcpy(custEmail, cust.email);
                    customerFound = true;
                    break;
                }
            }
            custFile.close();
            
            // Debug output
            cerr << "DEBUG: Lookup for custID " << reg.customerID << ", found: " << (customerFound ? "YES" : "NO") << ", name: " << custName << ", email: " << custEmail << endl;
            
            cout << "CustID: " << reg.customerID << " Name: " << custName << " Email: " << custEmail 
                 << " Ticket: " << reg.ticketNum << " Status: " << reg.feeStatus << endl;
            found = true;
        }
    }
    
    file.close();
    if (!found) cout << "No registrations found for this event" << endl;
    cout.flush();
}

void updateRegistrationFeeStatus() {
    int custID, eventID;
    char feeStatus[10];
    
    cin >> custID >> eventID;
    cin.ignore();
    cin.getline(feeStatus, 10);
    
    cerr << "DEBUG updateRegistrationFeeStatus: custID=" << custID << ", eventID=" << eventID << ", feeStatus=" << feeStatus << endl;
    
    ifstream fileRead(REG_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Registration reg;
    bool found = false;
    int totalRegs = 0;
    while (fileRead.read((char*)&reg, sizeof(Registration))) {
        totalRegs++;
        cerr << "DEBUG: Checking reg - custID=" << reg.customerID << ", eventID=" << reg.eventID << endl;
        if (reg.customerID == custID && reg.eventID == eventID) {
            strcpy(reg.feeStatus, feeStatus);
            found = true;
            cerr << "DEBUG: Found matching registration, updating feeStatus to " << feeStatus << endl;
        }
        fileWrite.write((char*)&reg, sizeof(Registration));
    }
    
    fileRead.close();
    fileWrite.close();
    
    cerr << "DEBUG: Total regs checked: " << totalRegs << ", found: " << (found ? "YES" : "NO") << endl;
    
    if (found) {
        remove(REG_FILE);
        rename("temp.dat", REG_FILE);
        cout << "Fee Status Updated successfully!" << endl;
    } else {
        remove("temp.dat");
        cout << "Registration not found" << endl;
    }
    cout.flush();
}

/* ======================= STAFF FUNCTIONS ======================= */
void addStaffToFile() {
    Staff staff;
    
    int newID;
    do {
        newID = (rand() % 900) + 100;
    } while (searchStaffID(newID));
    
    staff.ID = newID;
    cin >> staff.eventID;
    cin.ignore();
    cin.getline(staff.name, 50);
    cin.getline(staff.email, 50);
    cin.getline(staff.team, 20);
    cin.getline(staff.position, 20);
    
    ofstream file(STAFF_FILE, ios::binary | ios::app);
    file.write((char*)&staff, sizeof(Staff));
    file.close();
    
    cout << "Staff member added successfully!" << endl;
    cout << "Staff ID: " << staff.ID << endl;
    cout.flush();
}

void getStaffByEventFile() {
    int eventID;
    cin >> eventID;
    
    ifstream file(STAFF_FILE, ios::binary);
    if (!file) {
        cout << "No staff found" << endl;
        cout.flush();
        return;
    }
    
    Staff staff;
    bool found = false;
    while (file.read((char*)&staff, sizeof(Staff))) {
        if (staff.eventID == eventID) {
            cout << "ID: " << staff.ID << " Name: " << staff.name << " Email: " << staff.email 
                 << " Team: " << staff.team << " Position: " << staff.position << endl;
            found = true;
        }
    }
    
    file.close();
    if (!found) cout << "No staff found for this event" << endl;
    cout.flush();
}

void deleteStaffFromFile() {
    int staffID;
    cin >> staffID;
    
    if (!searchStaffID(staffID)) {
        cout << "Staff not found" << endl;
        cout.flush();
        return;
    }
    
    ifstream fileRead(STAFF_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Staff staff;
    while (fileRead.read((char*)&staff, sizeof(Staff))) {
        if (staff.ID != staffID) {
            fileWrite.write((char*)&staff, sizeof(Staff));
        }
    }
    
    fileRead.close();
    fileWrite.close();
    
    remove(STAFF_FILE);
    rename("temp.dat", STAFF_FILE);
    
    cout << "Staff Deleted successfully!" << endl;
    cout.flush();
}

void updateStaffInFile() {
    int staffID;
    cin >> staffID;
    
    if (!searchStaffID(staffID)) {
        cout << "Staff not found" << endl;
        cout.flush();
        return;
    }
    
    char name[50], email[50], team[20], position[20];
    cin.ignore();
    cin.getline(name, 50);
    cin.getline(email, 50);
    cin.getline(team, 20);
    cin.getline(position, 20);
    
    ifstream fileRead(STAFF_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Staff staff;
    while (fileRead.read((char*)&staff, sizeof(Staff))) {
        if (staff.ID == staffID) {
            strcpy(staff.name, name);
            strcpy(staff.email, email);
            strcpy(staff.team, team);
            strcpy(staff.position, position);
        }
        fileWrite.write((char*)&staff, sizeof(Staff));
    }
    
    fileRead.close();
    fileWrite.close();
    
    remove(STAFF_FILE);
    rename("temp.dat", STAFF_FILE);
    
    cout << "Staff Updated successfully!" << endl;
    cout.flush();
}

/* ======================= VENDOR FUNCTIONS ======================= */
void addVendorToFile() {
    Vendor vendor;
    
    int newID;
    do {
        newID = (rand() % 900) + 100;
    } while (searchVendorID(newID));
    
    vendor.ID = newID;
    cin >> vendor.eventID;
    cin.ignore();
    cin.getline(vendor.name, 50);
    cin.getline(vendor.email, 50);
    cin.getline(vendor.prod_serv, 50);
    cin >> vendor.chargesDue;
    
    ofstream file(VENDOR_FILE, ios::binary | ios::app);
    file.write((char*)&vendor, sizeof(Vendor));
    file.close();
    
    cout << "Vendor added successfully!" << endl;
    cout << "Vendor ID: " << vendor.ID << endl;
    cout.flush();
}

void getVendorsByEventFile() {
    int eventID;
    cin >> eventID;
    
    ifstream file(VENDOR_FILE, ios::binary);
    if (!file) {
        cout << "No vendors found" << endl;
        cout.flush();
        return;
    }
    
    Vendor vendor;
    bool found = false;
    while (file.read((char*)&vendor, sizeof(Vendor))) {
        if (vendor.eventID == eventID) {
            cout << "ID: " << vendor.ID << " Name: " << vendor.name << " Email: " << vendor.email 
                 << " Product/Service: " << vendor.prod_serv << " Charges: " << vendor.chargesDue << endl;
            found = true;
        }
    }
    
    file.close();
    if (!found) cout << "No vendors found for this event" << endl;
    cout.flush();
}

void deleteVendorFromFile() {
    int vendorID;
    cin >> vendorID;
    
    if (!searchVendorID(vendorID)) {
        cout << "Vendor not found" << endl;
        cout.flush();
        return;
    }
    
    ifstream fileRead(VENDOR_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Vendor vendor;
    while (fileRead.read((char*)&vendor, sizeof(Vendor))) {
        if (vendor.ID != vendorID) {
            fileWrite.write((char*)&vendor, sizeof(Vendor));
        }
    }
    
    fileRead.close();
    fileWrite.close();
    
    remove(VENDOR_FILE);
    rename("temp.dat", VENDOR_FILE);
    
    cout << "Vendor Deleted successfully!" << endl;
    cout.flush();
}

void updateVendorInFile() {
    int vendorID;
    cin >> vendorID;
    
    if (!searchVendorID(vendorID)) {
        cout << "Vendor not found" << endl;
        cout.flush();
        return;
    }
    
    char name[50], email[50], prod_serv[50];
    float chargesDue;
    cin.ignore();
    cin.getline(name, 50);
    cin.getline(email, 50);
    cin.getline(prod_serv, 50);
    cin >> chargesDue;
    
    ifstream fileRead(VENDOR_FILE, ios::binary);
    ofstream fileWrite("temp.dat", ios::binary);
    
    Vendor vendor;
    while (fileRead.read((char*)&vendor, sizeof(Vendor))) {
        if (vendor.ID == vendorID) {
            strcpy(vendor.name, name);
            strcpy(vendor.email, email);
            strcpy(vendor.prod_serv, prod_serv);
            vendor.chargesDue = chargesDue;
        }
        fileWrite.write((char*)&vendor, sizeof(Vendor));
    }
    
    fileRead.close();
    fileWrite.close();
    
    remove(VENDOR_FILE);
    rename("temp.dat", VENDOR_FILE);
    
    cout << "Vendor Updated successfully!" << endl;
    cout.flush();
}

/* ======================= ORGANISER EVENT MENU ======================= */
void organiserEventMenu() {
    int choice;
    while (cin >> choice) {
        if (choice == ADD_EVENT) {
            addEvent();
        } else if (choice == VIEW_EVENTS) {
            viewEvents();
        } else if (choice == MODIFY_EVENT) {
            modifyEvent();
        } else if (choice == DELETE_EVENT) {
            deleteEvent();
        } else if (choice == EXIT_MENU) {
            break;
        }
    }
}

/* ======================= MAIN MENU ======================= */
int main() {
    srand((unsigned)time(0));
    
    int userType;
    
    while (cin >> userType) {
        // Handle operation codes 10+ (registrations, staff, vendors)
        if (userType >= 10) {
            int operation = userType;
            switch (operation) {
                case 10:  // Get registrations by event
                    getRegistrationsByEvent();
                    break;
                case 11:  // Update registration fee status
                    updateRegistrationFeeStatus();
                    break;
                case 12:  // Add registration
                    addRegistration();
                    break;
                case 13:  // Add staff
                    addStaffToFile();
                    break;
                case 14:  // Get staff by event
                    getStaffByEventFile();
                    break;
                case 15:  // Delete staff
                    deleteStaffFromFile();
                    break;
                case 16:  // Add vendor
                    addVendorToFile();
                    break;
                case 17:  // Get vendors by event
                    getVendorsByEventFile();
                    break;
                case 18:  // Delete vendor
                    deleteVendorFromFile();
                    break;
                case 19:  // Update staff
                    updateStaffInFile();
                    break;
                case 20:  // Update vendor
                    updateVendorInFile();
                    break;
            }
            
            // Read exit signal
            int exitChoice;
            if (!(cin >> exitChoice)) {
                break;
            }
            if (exitChoice == 0) {
                break;
            }
            continue;
        }
        
        switch (userType) {
            case ORGANISER: {  // Organiser
                int choice;
                cin >> choice;
                
                switch (choice) {
                    case SIGNUP:
                        organiserSignup();
                        break;
                    case LOGIN:
                        organiserLogin();
                        // After successful login, handle organiser menu
                        organiserEventMenu();
                        break;
                }
                break;
            }
            case CUSTOMER: {  // Customer
                int choice;
                cin >> choice;
                
                switch (choice) {
                    case SIGNUP:
                        customerSignup();
                        break;
                    case LOGIN:
                        customerLogin();
                        break;
                }
                break;
            }
        }
        
        // Read exit signal
        int exitChoice;
        if (!(cin >> exitChoice)) {
            break;
        }
        if (exitChoice == 0) {
            break;
        }
    }
    
    return 0;
}
