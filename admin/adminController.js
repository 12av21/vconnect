import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs,
    getDoc,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    onSnapshot,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

class AdminController {
    constructor() {
        this.currentUser = null;
        this.tables = {};
        this.initializeEventListeners();
    }

    async initialize(user) {
        try {
            this.currentUser = user;
            this.showLoading(true);
            
            // Verify admin status before proceeding
            const isAdmin = await this.verifyAdminStatus(user.uid);
            if (!isAdmin) {
                window.location.href = '../index.html';
                return;
            }

            await Promise.all([
                this.loadPendingApprovals(),
                this.loadUsers(),
                this.loadStatistics()
            ]);

            this.showLoading(false);
        } catch (error) {
            console.error("Initialization error:", error);
            this.showError("Failed to initialize dashboard");
        }
    }

    async verifyAdminStatus(uid) {
        try {
            const adminDoc = await getDoc(doc(db, 'admins', uid));
            return adminDoc.exists();
        } catch (error) {
            console.error("Admin verification error:", error);
            return false;
        }
    }
    class AdminController {
        // ... existing constructor and initialize methods ...
    
        async loadPendingApprovals() {
            try {
                // Query for pending organizers
                const pendingOrganizersQuery = query(
                    collection(db, 'users'),
                    where('userType', '==', 'organizer'),
                    where('status', '==', 'pending'),
                    orderBy('createdAt', 'desc')
                );
    
                // Real-time listener for pending organizer approvals
                onSnapshot(pendingOrganizersQuery, (snapshot) => {
                    const organizerTable = document.getElementById('organizerApprovalsTable').getElementsByTagName('tbody')[0];
                    organizerTable.innerHTML = '';
    
                    snapshot.forEach(doc => {
                        const organizer = { id: doc.id, ...doc.data() };
                        const row = this.createOrganizerApprovalRow(organizer);
                        organizerTable.appendChild(row);
                    });
    
                    // Update pending count in header
                    const pendingCount = snapshot.size;
                    document.getElementById('pendingCount').textContent = pendingCount;
                });
    
            } catch (error) {
                console.error("Error loading pending organizer approvals:", error);
                this.showError("Failed to load pending approvals");
            }
        }
    
        createOrganizerApprovalRow(organizer) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${organizer.organizationLogo || 'assets/default-org-logo.png'}" 
                             class="rounded-circle me-2" 
                             width="40" height="40"
                             onerror="this.src='assets/default-org-logo.png'">
                        <div>
                            <div class="fw-bold">${organizer.organizationName || 'N/A'}</div>
                            <small class="text-muted">${organizer.organizationAddress || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="fw-bold">${organizer.name || 'N/A'}</div>
                    <small class="text-muted">${organizer.phone || 'N/A'}</small>
                </td>
                <td>${organizer.email}</td>
                <td>
                    <span class="badge bg-info">${organizer.organizationType || 'N/A'}</span>
                </td>
                <td>
                    <div class="btn-group">
                        ${this.createDocumentLinks(organizer.documents)}
                    </div>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-success" 
                                onclick="window.adminController.approveOrganizer('${organizer.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" 
                                onclick="window.adminController.rejectOrganizer('${organizer.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <button class="btn btn-sm btn-info" 
                                onclick="window.adminController.viewOrganizerDetails('${organizer.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            `;
            return tr;
        }
    
        createDocumentLinks(documents) {
            if (!documents || Object.keys(documents).length === 0) {
                return '<span class="text-muted">No documents</span>';
            }
    
            return Object.entries(documents).map(([key, url]) => `
                <a href="${url}" target="_blank" class="btn btn-sm btn-outline-primary me-1">
                    <i class="fas fa-file"></i> ${key}
                </a>
            `).join('');
        }
    
        async approveOrganizer(organizerId) {
            try {
                this.showLoading(true);
    
                // Get organizer data
                const organizerDoc = await getDoc(doc(db, 'users', organizerId));
                const organizerData = organizerDoc.data();
    
                if (!organizerData) {
                    throw new Error("Organizer data not found");
                }
    
                // Update user status
                await updateDoc(doc(db, 'users', organizerId), {
                    status: 'active',
                    approvedAt: Timestamp.now(),
                    approvedBy: this.currentUser.uid
                });
    
                // Create organizer document in organizers collection
                await setDoc(doc(db, 'organizers', organizerId), {
                    userId: organizerId,
                    organizationName: organizerData.organizationName,
                    organizationType: organizerData.organizationType,
                    email: organizerData.email,
                    phone: organizerData.phone,
                    address: organizerData.organizationAddress,
                    logo: organizerData.organizationLogo,
                    documents: organizerData.documents,
                    createdAt: Timestamp.now(),
                    status: 'active'
                });
    
                // Send notification
                await addDoc(collection(db, 'notifications'), {
                    userId: organizerId,
                    type: 'organizer_approval',
                    message: 'Your organization account has been approved!',
                    createdAt: Timestamp.now()
                });
    
                this.showSuccess('Organizer approved successfully');
            } catch (error) {
                console.error("Error approving organizer:", error);
                this.showError("Failed to approve organizer");
            } finally {
                this.showLoading(false);
            }
        }
    
        async rejectOrganizer(organizerId) {
            try {
                this.showLoading(true);
    
                // Get organizer data
                const organizerDoc = await getDoc(doc(db, 'users', organizerId));
                const organizerData = organizerDoc.data();
    
                if (!organizerData) {
                    throw new Error("Organizer data not found");
                }
    
                // Update user status
                await updateDoc(doc(db, 'users', organizerId), {
                    status: 'rejected',
                    rejectedAt: Timestamp.now(),
                    rejectedBy: this.currentUser.uid
                });
    
                // Send notification
                await addDoc(collection(db, 'notifications'), {
                    userId: organizerId,
                    type: 'organizer_rejection',
                    message: 'Your organization account application has been rejected.',
                    createdAt: Timestamp.now()
                });
    
                this.showSuccess('Organizer rejected successfully');
            } catch (error) {
                console.error("Error rejecting organizer:", error);
                this.showError("Failed to reject organizer");
            } finally {
                this.showLoading(false);
            }
        }
    
        async viewOrganizerDetails(organizerId) {
            try {
                const organizerDoc = await getDoc(doc(db, 'users', organizerId));
                const organizerData = organizerDoc.data();
    
                if (!organizerData) {
                    throw new Error("Organizer data not found");
                }
    
                // Show organizer details modal
                const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
                document.getElementById('userDetailsContent').innerHTML = this.createOrganizerDetailsHTML(organizerData);
                modal.show();
            } catch (error) {
                console.error("Error loading organizer details:", error);
                this.showError("Failed to load organizer details");
            }
        }
    
        createOrganizerDetailsHTML(organizer) {
            return `
                <div class="user-profile">
                    <div class="text-center mb-4">
                        <img src="${organizer.organizationLogo || 'assets/default-org-logo.png'}" 
                             class="rounded-circle mb-3" 
                             width="100" height="100"
                             onerror="this.src='assets/default-org-logo.png'">
                        <h4>${organizer.organizationName}</h4>
                        <p class="text-muted">${organizer.organizationType}</p>
                    </div>
                    <div class="user-info">
                        <h5>Organization Details</h5>
                        <p><strong>Address:</strong> ${organizer.organizationAddress || 'N/A'}</p>
                        <p><strong>Email:</strong> ${organizer.email}</p>
                        <p><strong>Phone:</strong> ${organizer.phone || 'N/A'}</p>
                        
                        <h5 class="mt-4">Contact Person</h5>
                        <p><strong>Name:</strong> ${organizer.name}</p>
                        <p><strong>Position:</strong> ${organizer.position || 'N/A'}</p>
                        
                        <h5 class="mt-4">Documents</h5>
                        <div class="document-links">
                            ${this.createDocumentLinks(organizer.documents)}
                        </div>
                    </div>
                </div>
            `;
        }
    }
    