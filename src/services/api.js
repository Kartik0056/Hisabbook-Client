const API_BASE = '/api';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('hisabbook_token');
  const activeProjectId = localStorage.getItem('hisabbook_active_project_id');

  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (activeProjectId) {
    headers['x-project-id'] = activeProjectId;
  }
  return headers;
};

const handleResponse = async (response) => {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && data.message) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } finally {
      localStorage.removeItem('hisabbook_token');
      localStorage.removeItem('hisabbook_active_project_id');
    }
  },

  updateProfile: async (profileData) => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  // Projects
  getProjects: async () => {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createProject: async (projectData) => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  getProject: async (id) => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateProject: async (id, projectData) => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  switchProject: async (id) => {
    const res = await fetch(`${API_BASE}/projects/${id}/switch`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  archiveProject: async (id) => {
    const res = await fetch(`${API_BASE}/projects/${id}/archive`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  deleteProject: async (id, confirmText) => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ confirmText }),
    });
    return handleResponse(res);
  },

  addProjectMember: async (id, memberData) => {
    const res = await fetch(`${API_BASE}/projects/${id}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(memberData),
    });
    return handleResponse(res);
  },

  // Accounts
  getAccounts: async () => {
    const res = await fetch(`${API_BASE}/accounts`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createAccount: async (accountData) => {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(accountData),
    });
    return handleResponse(res);
  },

  updateAccount: async (id, accountData) => {
    const res = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(accountData),
    });
    return handleResponse(res);
  },

  transferBetweenAccounts: async (transferData) => {
    const res = await fetch(`${API_BASE}/accounts/transfer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(transferData),
    });
    return handleResponse(res);
  },

  // Budgets
  getBudgets: async () => {
    const res = await fetch(`${API_BASE}/budgets`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createBudget: async (budgetData) => {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(budgetData),
    });
    return handleResponse(res);
  },

  updateBudget: async (id, budgetData) => {
    const res = await fetch(`${API_BASE}/budgets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(budgetData),
    });
    return handleResponse(res);
  },

  // Contacts
  getContacts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/contacts?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createContact: async (contactData) => {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(contactData),
    });
    return handleResponse(res);
  },

  getContact: async (id) => {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateContact: async (id, contactData) => {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(contactData),
    });
    return handleResponse(res);
  },

  deleteContact: async (id) => {
    const res = await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Transactions
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/transactions?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createTransaction: async (txnData) => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(txnData),
    });
    return handleResponse(res);
  },

  getTransaction: async (id) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateTransaction: async (id, txnData) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(txnData),
    });
    return handleResponse(res);
  },

  cancelTransaction: async (id, reason) => {
    const res = await fetch(`${API_BASE}/transactions/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  deleteTransaction: async (id) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Advances
  getAdvances: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/advances?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  settleAdvance: async (id, settlementData) => {
    const res = await fetch(`${API_BASE}/advances/${id}/settle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settlementData),
    });
    return handleResponse(res);
  },

  // Materials & Inventory
  getMaterials: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/materials?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createMaterial: async (materialData) => {
    const res = await fetch(`${API_BASE}/materials`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(materialData),
    });
    return handleResponse(res);
  },

  getMaterial: async (id) => {
    const res = await fetch(`${API_BASE}/materials/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updateMaterial: async (id, materialData) => {
    const res = await fetch(`${API_BASE}/materials/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(materialData),
    });
    return handleResponse(res);
  },

  deleteMaterial: async (id) => {
    const res = await fetch(`${API_BASE}/materials/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getMovements: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/inventory/movements?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  recordMovement: async (movementData) => {
    const res = await fetch(`${API_BASE}/inventory/movement`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(movementData),
    });
    return handleResponse(res);
  },

  // Purchases
  getPurchases: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/purchases?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createPurchase: async (purchaseData) => {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(purchaseData),
    });
    return handleResponse(res);
  },

  getPurchase: async (id) => {
    const res = await fetch(`${API_BASE}/purchases/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  updatePurchase: async (id, purchaseData) => {
    const res = await fetch(`${API_BASE}/purchases/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(purchaseData),
    });
    return handleResponse(res);
  },

  deletePurchase: async (id) => {
    const res = await fetch(`${API_BASE}/purchases/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Documents
  getDocuments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/documents?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  uploadDocuments: async (formData) => {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse(res);
  },

  deleteDocument: async (id) => {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getDocumentFileUrl: (id) => {
    return `${API_BASE}/documents/${id}/file`;
  },

  // Work Logs
  getWorkLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/work-logs?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createWorkLog: async (workLogData) => {
    const res = await fetch(`${API_BASE}/work-logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(workLogData),
    });
    return handleResponse(res);
  },

  // Tasks
  getTasks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/tasks?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createTask: async (taskData) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  updateTask: async (id, taskData) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  deleteTask: async (id) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Milestones
  getMilestones: async () => {
    const res = await fetch(`${API_BASE}/milestones`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  createMilestone: async (milestoneData) => {
    const res = await fetch(`${API_BASE}/milestones`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(milestoneData),
    });
    return handleResponse(res);
  },

  updateMilestone: async (id, milestoneData) => {
    const res = await fetch(`${API_BASE}/milestones/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(milestoneData),
    });
    return handleResponse(res);
  },

  deleteMilestone: async (id) => {
    const res = await fetch(`${API_BASE}/milestones/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Phone QR Pairing
  createPairingSession: async () => {
    const res = await fetch(`${API_BASE}/pairing/create`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getPairingSessionStatus: async (token) => {
    const res = await fetch(`${API_BASE}/pairing/session/${token}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Reports
  getDashboardSummary: async () => {
    const res = await fetch(`${API_BASE}/reports/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getCashBook: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports/cashbook?${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getBackupExportUrl: () => {
    return `${API_BASE}/reports/backup`;
  },
};
