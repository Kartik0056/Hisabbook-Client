import React, { createContext, useContext, useState } from 'react';

const translations = {
  // Navigation & Shell
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  transactions: { en: 'Transactions Ledger', hi: 'हिसाब-किताब' },
  advances: { en: 'Advances & Settlements', hi: 'पेशगी व चुकता' },
  contacts: { en: 'People & Vendors', hi: 'ठेकेदार व सप्लायर' },
  materials: { en: 'Materials & Stock', hi: 'सामग्री व स्टॉक' },
  purchases: { en: 'Bills & Invoices', hi: 'बिल व चालान' },
  vault: { en: 'Document Vault', hi: 'दस्तावेज़ व फोटो' },
  worklogs: { en: 'Daily Work Log', hi: 'दैनिक कार्य डायरी' },
  tasks: { en: 'Tasks & Progress', hi: 'कार्य व प्रगति' },
  accounts: { en: 'Accounts & Cash', hi: 'खाते व रोकड़' },
  reports: { en: 'Reports & Export', hi: 'रिपोर्ट व बैकअप' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },

  // Financial Metrics
  originalBudget: { en: 'Original Budget', hi: 'मूल बजट' },
  revisedBudget: { en: 'Revised Budget', hi: 'संशोधित बजट' },
  moneyReceived: { en: 'Total Money Received', hi: 'कुल प्राप्त धन' },
  actualExpenses: { en: 'Total Actual Expenses', hi: 'कुल वास्तविक खर्च' },
  advancesPaid: { en: 'Total Advances Paid', hi: 'कुल दी गई पेशगी' },
  unsettledAdvances: { en: 'Unsettled Advances', hi: 'बाकी पेशगी' },
  pendingBills: { en: 'Pending Bills', hi: 'बकाया बिल' },
  budgetRemaining: { en: 'Budget Remaining', hi: 'बचा हुआ बजट' },
  cashInHand: { en: 'Cash in Hand (Total)', hi: 'कुल उपलब्ध रोकड़' },
  budgetUtilization: { en: 'Budget Utilization', hi: 'बजट उपयोग' },
  setBudget: { en: 'Set Budget', hi: 'बजट सेट करें' },
  editBudget: { en: 'Edit Budget', hi: 'बजट बदलें' },
  noBudgetSet: { en: 'No Budget Configured', hi: 'स्वीकृत बजट सेट नहीं है' },
  availableFunds: { en: 'Available Funds (Cash/Bank)', hi: 'उपलब्ध फंड (रोकड़/बैंक)' },

  // Actions
  addTransaction: { en: 'New Entry', hi: 'नई एंट्री' },
  addContact: { en: 'Add Person', hi: 'व्यक्ति जोड़ें' },
  addMaterial: { en: 'Add Material', hi: 'सामग्री जोड़ें' },
  addBill: { en: 'New Bill', hi: 'नया बिल' },
  settleAdvance: { en: 'Settle Advance', hi: 'पेशगी चुकता करें' },
  recordUsage: { en: 'Record Usage', hi: 'खपत दर्ज करें' },
  connectPhone: { en: 'Connect Phone (QR)', hi: 'फ़ोन जोड़ें (QR)' },
  exportCSV: { en: 'Export CSV', hi: 'CSV डाउनलोड' },
  downloadBackup: { en: 'Download Backup', hi: 'बैकअप डाउनलोड' },

  // Transaction Types
  income: { en: 'Income', hi: 'जमा' },
  expense: { en: 'Expense', hi: 'खर्च' },
  contractor_payment: { en: 'Contractor Payment', hi: 'ठेकेदार भुगतान' },
  supplier_payment: { en: 'Supplier Payment', hi: 'सप्लायर भुगतान' },
  advance: { en: 'Advance', hi: 'पेशगी' },
  refund: { en: 'Refund', hi: 'वापसी' },
  transfer: { en: 'Account Transfer', hi: 'खाता ट्रांसफर' },
  loan_received: { en: 'Loan Received', hi: 'उधार लिया' },
  loan_repayment: { en: 'Loan Repayment', hi: 'उधार वापसी' },
  liability_payment: { en: 'Liability Payment', hi: 'देनदारी भुगतान' },

  // General labels
  amount: { en: 'Amount (₹)', hi: 'रकम (₹)' },
  date: { en: 'Date', hi: 'तारीख' },
  category: { en: 'Category', hi: 'श्रेणी' },
  account: { en: 'Account', hi: 'खाता' },
  contact: { en: 'Person / Vendor', hi: 'व्यक्ति / विक्रेता' },
  description: { en: 'Description', hi: 'विवरण' },
  status: { en: 'Status', hi: 'स्थिति' },
  actions: { en: 'Actions', hi: 'कार्रवाई' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  save: { en: 'Save', hi: 'सहेजें' },
  close: { en: 'Close', hi: 'बंद करें' },
  search: { en: 'Search...', hi: 'खोजें...' },
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...' },
  noData: { en: 'No data found', hi: 'कोई डेटा नहीं मिला' },
  all: { en: 'All', hi: 'सभी' },
  yes: { en: 'Yes', hi: 'हाँ' },
  no: { en: 'No', hi: 'नहीं' },
  done: { en: 'Done', hi: 'पूर्ण' },
  retry: { en: 'Retry', hi: 'पुन: प्रयास' },
  confirm: { en: 'Confirm', hi: 'पुष्टि करें' },
  delete: { en: 'Delete', hi: 'मिटायें' },
  edit: { en: 'Edit', hi: 'बदलें' },
  view: { en: 'View', hi: 'देखें' },
  total: { en: 'Total', hi: 'कुल' },
  balance: { en: 'Balance', hi: 'शेष' },

  // Transaction Form Labels
  txnType: { en: 'Transaction Type', hi: 'लेन-देन का प्रकार' },
  selectType: { en: 'Select type', hi: 'प्रकार चुनें' },
  sourceAccount: { en: 'Source Account', hi: 'किस खाते से' },
  selectAccount: { en: 'Select account', hi: 'खाता चुनें' },
  destAccount: { en: 'Destination Account', hi: 'किस खाते में' },
  personOptional: { en: 'Person / Vendor (Optional)', hi: 'व्यक्ति / विक्रेता (वैकल्पिक)' },
  noContactLinked: { en: 'None', hi: 'कोई नहीं' },
  paymentMethod: { en: 'Payment Method', hi: 'भुगतान का तरीका' },
  referenceNumber: { en: 'Reference / UTR No.', hi: 'रेफरेंस / UTR नंबर' },
  descriptionPurpose: { en: 'Description / Purpose', hi: 'विवरण / उद्देश्य' },
  markAdvance: { en: 'Mark as Advance', hi: 'पेशगी के रूप में दर्ज करें' },
  markAdvanceHint: {
    en: 'Cash goes out now but will be settled against a bill later.',
    hi: 'अभी पैसा दिया गया, बिल आने पर चुकता होगा।'
  },
  saveTransaction: { en: 'Save Entry', hi: 'एंट्री सहेजें' },
  recordTransaction: { en: 'Record New Entry', hi: 'नई एंट्री दर्ज करें' },
  recordTransactionHint: {
    en: 'Fill in the details below to record this transaction.',
    hi: 'लेन-देन की जानकारी नीचे भरें।',
  },
  // Material Inward & Calculation
  addMaterialDetails: {
    en: 'Record Material Inward / Delivery Details',
    hi: 'सामग्री आवक विवरण जोड़ें (सीमेंट, सरिया, ईंट आदि)',
  },
  materialNameLabel: { en: 'Material Name', hi: 'सामग्री का नाम' },
  unitType: { en: 'Measurement Unit', hi: 'माप इकाई' },
  ratePerBagLabel: { en: 'Rate per Bag (₹/bag)', hi: 'प्रति बैग दर (₹)' },
  ratePerQuintalLabel: { en: 'Rate per Quintal (₹/qtl)', hi: 'प्रति क्विंटल दर (₹)' },
  ratePerUnitLabel: { en: 'Rate per Unit (₹)', hi: 'प्रति इकाई दर (₹)' },
  quantityBagsLabel: { en: 'Number of Bags', hi: 'कुल बैग संख्या' },
  quantityQuintalsLabel: { en: 'Weight in Quintals', hi: 'कुल वजन (क्विंटल)' },
  quantityGeneralLabel: { en: 'Quantity', hi: 'मात्रा' },
  vehicleChallan: { en: 'Vehicle / Challan No.', hi: 'गाड़ी / चालान नंबर' },
  totalCalculatedCost: { en: 'Calculated Amount', hi: 'कुल हिसाब' },

  // Payment Methods
  cash: { en: 'Cash', hi: 'नकद' },
  upi: { en: 'UPI (GPay / PhonePe)', hi: 'UPI (GPay / PhonePe)' },
  bank_transfer: { en: 'Bank Transfer (NEFT/RTGS)', hi: 'बैंक ट्रांसफर (NEFT/RTGS)' },
  cheque: { en: 'Cheque', hi: 'चेक' },
  card: { en: 'Card', hi: 'कार्ड' },
  other: { en: 'Other', hi: 'अन्य' },

  // Attachment / Photo section
  attachProof: { en: 'Attach Bill / Receipt / Photo', hi: 'बिल / रसीद / फोटो लगायें' },
  takeWebcamPhoto: { en: 'Webcam Photo', hi: 'वेबकैम फोटो' },
  browseFile: { en: 'Browse File', hi: 'फ़ाइल चुनें' },
  phoneCamera: { en: 'Phone Camera (QR)', hi: 'फ़ोन कैमरा (QR)' },
  phoneUpload: { en: 'From Phone', hi: 'फ़ोन से भेजें' },
  webcamCapture: { en: 'Webcam Capture', hi: 'वेबकैम फोटो' },
  webcamHint: {
    en: 'Capture a photo of any bill or receipt using your webcam.',
    hi: 'वेबकैम से बिल या रसीद की फोटो लें।',
  },
  capturePhoto: { en: 'Capture Photo', hi: 'फोटो लें' },
  retake: { en: 'Retake', hi: 'दोबारा लें' },
  attachPhoto: { en: 'Attach Photo', hi: 'फोटो लगायें' },
  cameraUnavailable: { en: 'Camera Not Available', hi: 'कैमरा उपलब्ध नहीं' },
  startingCamera: { en: 'Starting Camera...', hi: 'कैमरा चालू हो रहा है...' },
  permissionDenied: {
    en: 'Camera permission denied. Please allow camera access in your browser settings.',
    hi: 'कैमरा की अनुमति नहीं दी गई। कृपया ब्राउज़र सेटिंग में कैमरा चालू करें।',
  },

  // Phone Pairing
  connectMobileTitle: { en: 'Connect Mobile Phone', hi: 'मोबाइल फ़ोन जोड़ें' },
  connectMobileHint: {
    en: 'Scan this QR code from your phone camera (same Wi-Fi needed).',
    hi: 'अपने फ़ोन के कैमरे से यह QR स्कैन करें (एक ही Wi-Fi पर हों)।',
  },
  generatingSession: { en: 'Generating session...', hi: 'सत्र बनाया जा रहा है...' },
  sessionInfo: {
    en: 'Single-use session • Valid for 20 minutes',
    hi: 'एक बार का सत्र • 20 मिनट तक वैध',
  },
  receivedFromPhone: { en: 'Received from Phone', hi: 'फ़ोन से प्राप्त' },
  listeningOnLan: { en: 'Waiting for photos...', hi: 'फोटो का इंतज़ार...' },
  scanQRInstruction: {
    en: 'Scan the QR code above from your phone, take a photo, and it will appear here.',
    hi: 'ऊपर दिए QR को स्कैन करें, फोटो लें, वह यहाँ दिखेगी।',
  },
  copied: { en: 'Copied!', hi: 'कॉपी हुआ!' },
  copy: { en: 'Copy', hi: 'कॉपी' },

  // Cancellation Modal
  cancelTransaction: { en: 'Cancel / Reverse', hi: 'रद्द / वापस करें' },
  cancelHint: {
    en: 'Account balance will be restored. Financial history is preserved.',
    hi: 'खाते का शेष वापस हो जायेगा। पुराना रिकॉर्ड सुरक्षित रहेगा।',
  },
  cancellationReason: { en: 'Reason for cancellation', hi: 'रद्द करने का कारण' },
  reasonPlaceholder: {
    en: 'e.g. Wrong amount, duplicate entry...',
    hi: 'जैसे: गलत रकम, दोहरी एंट्री...',
  },
  confirmCancel: { en: 'Confirm Cancellation', hi: 'रद्द करें पुष्टि' },
  nevermind: { en: 'Go Back', hi: 'वापस जायें' },

  // Detail Modal
  transactionDetails: { en: 'Transaction Details', hi: 'लेन-देन का पूरा विवरण' },
  attachedProofs: { en: 'Attached Proofs', hi: 'लगाये गये प्रमाण' },
  auditHistory: { en: 'Change History', hi: 'बदलाव का इतिहास' },

  // Filter Toolbar
  allTypes: { en: 'All Types', hi: 'सभी प्रकार' },
  allAccounts: { en: 'All Accounts', hi: 'सभी खाते' },
  allContacts: { en: 'All Contacts', hi: 'सभी व्यक्ति' },
  dateRange: { en: 'Date Range:', hi: 'तारीख़:' },
  to: { en: 'to', hi: 'से' },
  clearFilters: { en: 'Clear Filters', hi: 'फ़िल्टर हटायें' },
  applyFilter: { en: 'Apply', hi: 'लगायें' },
  searchPlaceholder: { en: 'Search by ID, description, UTR...', hi: 'ID, विवरण, UTR से खोजें...' },

  // Table Headers
  txnIdDate: { en: 'ID & Date', hi: 'आईडी व तारीख' },
  type: { en: 'Type', hi: 'प्रकार' },
  categoryPurpose: { en: 'Category & Purpose', hi: 'श्रेणी व उद्देश्य' },
  accountContact: { en: 'Account / Person', hi: 'खाता / व्यक्ति' },
  paymentInfo: { en: 'Payment', hi: 'भुगतान' },

  // Statuses
  cancelled: { en: 'Cancelled', hi: 'रद्द' },
  paid: { en: 'Paid', hi: 'भुगतान हुआ' },
  pending: { en: 'Pending', hi: 'बकाया' },
  unsettled: { en: 'Unsettled', hi: 'असमायोजित' },

  // Page subtitle
  ledgerSubtitle: {
    en: 'records • Reversible cancellation with audit history',
    hi: 'रिकॉर्ड • ऑडिट हिस्ट्री के साथ',
  },
  loadingLedger: { en: 'Loading records...', hi: 'रिकॉर्ड लोड हो रहे हैं...' },
  noTransactions: {
    en: 'No transactions found.',
    hi: 'कोई लेन-देन नहीं मिला।',
  },
  noExportData: { en: 'No data to export.', hi: 'निर्यात करने के लिए कोई डेटा नहीं।' },

  // Validation Messages
  enterValidAmount: {
    en: 'Please enter a valid amount greater than 0.',
    hi: 'कृपया 0 से अधिक सही रकम डालें।',
  },
  selectPaymentAccount: {
    en: 'Please select a payment account.',
    hi: 'कृपया भुगतान का खाता चुनें।',
  },
  provideReason: {
    en: 'Please provide a cancellation reason.',
    hi: 'कृपया रद्द करने का कारण बतायें।',
  },
  errorOccurred: {
    en: 'An error occurred. Please try again.',
    hi: 'कोई त्रुटि हुई। कृपया पुन: प्रयास करें।',
  },

  // Category placeholders
  categoryPlaceholder: {
    en: 'e.g. Labour, Material, Civil...',
    hi: 'जैसे: मजदूरी, सामान, निर्माण...',
  },
  descriptionPlaceholder: {
    en: 'What was this payment for?',
    hi: 'यह भुगतान किसलिए था?',
  },
  refPlaceholder: {
    en: 'e.g. UPI Ref 429188...',
    hi: 'जैसे: UPI Ref 429188...',
  },

  // Duplicate action
  duplicate: { en: 'Duplicate', hi: 'नकल करें' },
  viewDetails: { en: 'View Details', hi: 'विवरण देखें' },
  cancelReverse: { en: 'Cancel', hi: 'रद्द करें' },

  // Phone Upload Page
  phoneUploadTitle: { en: 'Upload from Phone', hi: 'फ़ोन से अपलोड' },
  phoneUploadHint: {
    en: 'Take a photo or select a file to send to your PC.',
    hi: 'फोटो लें या फ़ाइल चुनकर अपने कंप्यूटर पर भेजें।',
  },
  photosTransferred: {
    en: 'photo(s) transferred successfully!',
    hi: 'फोटो सफलतापूर्वक भेजी गईं!',
  },

  // General
  ref: { en: 'Ref', hi: 'रेफ' },
  party: { en: 'Party', hi: 'पार्टी' },
  method: { en: 'Method', hi: 'तरीका' },
  selfGeneral: { en: 'Self / General', hi: 'स्वयं / सामान्य' },

  // Auth & Account Creation
  signInTitle: { en: 'Sign In to Your Account', hi: 'अपने खाते में लॉगिन करें' },
  signInSubtitle: { en: 'Universal Hisab-Kitab & Project Management', hi: 'यूनिवर्सल हिसाब-किताब एवं प्रोजेक्ट प्रबंधन' },
  createFreeAccount: { en: 'Create New Account', hi: 'नया खाता बनाएं' },
  registerSubtitle: { en: 'Multi-project ledger and financial tracking', hi: 'खाता-बही एवं वित्तीय प्रबंधन' },
  emailAddress: { en: 'Email Address', hi: 'ईमेल पता' },
  password: { en: 'Password', hi: 'पासवर्ड' },
  signInBtn: { en: 'Sign In', hi: 'लॉगिन करें' },
  createAccountBtn: { en: 'Create Account & Start', hi: 'खाता बनाएं और शुरू करें' },
  dontHaveAccount: { en: "Don't have an account?", hi: 'क्या आपका खाता नहीं है?' },
  alreadyHaveAccount: { en: 'Already have an account?', hi: 'क्या पहले से खाता है?' },
  fullName: { en: 'Your Full Name', hi: 'आपका पूरा नाम' },
  phoneOptional: { en: 'Phone Number (Optional)', hi: 'फ़ोन नंबर (वैकल्पिक)' },
  firstProjectName: { en: 'Project Name', hi: 'प्रोजेक्ट का नाम' },
  projectCategory: { en: 'Project Type', hi: 'प्रोजेक्ट का प्रकार' },
  namePlaceholder: { en: 'e.g. Kartik Kumar', hi: 'जैसे: कार्तिक कुमार' },
  projectPlaceholder: { en: 'e.g. My Project / House Construction', hi: 'जैसे: मेरा प्रोजेक्ट / मकान निर्माण' },
  passwordPlaceholder: { en: 'At least 6 characters', hi: 'कम से कम 6 अक्षर' },

  // Actions & Management
  print: { en: 'Print', hi: 'प्रिंट' },
  download: { en: 'Download', hi: 'डाउनलोड' },
  editContact: { en: 'Edit Person / Vendor', hi: 'व्यक्ति / विक्रेता बदलें' },
  deleteContactConfirm: {
    en: 'Are you sure you want to delete this contact?',
    hi: 'क्या आप इस व्यक्ति / सप्लायर को हटाना चाहते हैं?',
  },
  editTransaction: { en: 'Edit Transaction', hi: 'लेन-देन बदलें' },
  deleteTransactionConfirm: {
    en: 'Are you sure you want to delete this transaction? Account balance will be restored.',
    hi: 'क्या आप इस एंट्री को हटाना चाहते हैं? खाते का बैलेंस वापस ठीक हो जाएगा।',
  },
  editBill: { en: 'Edit Bill / Invoice', hi: 'बिल / इनवॉइस बदलें' },
  deleteBillConfirm: {
    en: 'Are you sure you want to delete this bill?',
    hi: 'क्या आप इस बिल को हटाना चाहते हैं?',
  },

  // Invoice & Receipt Format
  taxInvoice: { en: 'Tax Invoice / Bill Voucher', hi: 'टैक्स इनवॉइस / पक्का बिल' },
  paymentVoucher: { en: 'Payment / Receipt Voucher', hi: 'भुगतान / जमा रसीद' },
  authorizedSignatory: { en: 'Authorized Signatory', hi: 'अधिकृत हस्ताक्षर' },
  receiverSignature: { en: 'Receiver Signature', hi: 'प्राप्तकर्ता के हस्ताक्षर' },
  billedTo: { en: 'Billed To (Project)', hi: 'बिल प्राप्तकर्ता (प्रोजेक्ट)' },
  billedBy: { en: 'Billed By (Supplier)', hi: 'बिल जारीकर्ता (सप्लायर)' },
  invoiceDate: { en: 'Invoice Date', hi: 'बिल तारीख' },
  invoiceNo: { en: 'Invoice No.', hi: 'बिल नंबर' },
  paymentTerms: { en: 'Payment Status', hi: 'भुगतान स्थिति' },

  // Goods Inward / Material Received Hisab
  goodsReceivedRegister: { en: 'Goods Received (सामान आवक)', hi: 'सामान आवक हिसाब (क्या व कितना आया)' },
  materialStockTab: { en: 'Current Stock', hi: 'मौजूदा स्टॉक' },
  goodsInwardTab: { en: 'Goods Received (क्या सामान आया)', hi: 'सामान आवक रजिस्टर' },
  itemArrived: { en: 'Item / Material Arrived', hi: 'क्या सामान आया' },
  quantityArrived: { en: 'Quantity Arrived', hi: 'कितना आया' },
  unitRate: { en: 'Rate / Price', hi: 'दर / भाव' },
  totalItemCost: { en: 'Total Cost', hi: 'कुल कितने का है' },
  supplierParty: { en: 'Supplier / Source', hi: 'कहाँ से आया (सप्लायर)' },
  billChallanNo: { en: 'Bill / Challan No.', hi: 'बिल / चालान नं.' },
  totalMaterialValue: { en: 'Total Goods Received Value', hi: 'कुल आया सामान (रुपये में)' },
  // Person-wise and Material Inward Summaries
  personWisePaymentSummary: { en: 'Person-wise Payments Summary', hi: 'पार्टी-वार कुल भुगतान हिसाब' },
  materialWiseSummary: { en: 'Material-wise Arrival & Cost Summary', hi: 'सामग्री-वार कुल आवक व लागत' },
  totalPaidToPerson: { en: 'Total Paid to Person', hi: 'कुल दिया गया पैसा' },
  itemWiseTotal: { en: 'Total Arrived', hi: 'कुल कितना आया' },
  totalCostValue: { en: 'Total Cost', hi: 'कुल कितने का आया' },
  lastArrivalDate: { en: 'Last Arrival Date', hi: 'आखिरी आमद तारीख' },
  lastPaymentDate: { en: 'Last Payment Date', hi: 'आखिरी भुगतान तारीख' },
  viewDateWise: { en: 'Date-wise Details', hi: 'तारीख-वार विवरण' },
  dateWiseLog: { en: 'Date-wise Delivery Log', hi: 'तारीख-वार डिलीवरी रजिस्टर' },
  materialGroupSummary: { en: 'Material Grouped Summary', hi: 'सामग्री-वार कुल सारांश' },
  // Contractor Advance Payment Source & Adjustments
  paymentSourcePrompt: { en: 'Whose money was used for this?', hi: 'इसके पैसे किसपे गए / कहाँ से गए?' },
  directCompanyAccount: { en: 'Direct Company Cash/Bank (New Expense)', hi: 'सीधा कंपनी भुगतान (कैश / बैंक)' },
  deductFromContractorAdvance: { en: 'Deduct from Contractor Advance', hi: 'ठेकेदार के पुराने एडवांस में से कटा' },
  newPaymentToContractor: { en: 'New Payment to Contractor', hi: 'ठेकेदार को अभी नया भुगतान दिया' },
  selectContractorToDeduct: { en: 'Select Contractor / Person', hi: 'ठेकेदार चुनें (जिनके एडवांस से कटेगा)' },
  availableAdvanceBalance: { en: 'Available Advance Balance', hi: 'ठेकेदार के पास उपलब्ध एडवांस' },
  advanceNoticeTip: {
    en: 'This amount will NOT be deducted from your bank/cash balance again. It adjusts the contractor’s existing advance.',
    hi: 'यह राशि आपके बैंक/कैश खाते से दोबारा नहीं कटेगी, बल्कि ठेकेदार के पिछले दिए एडवांस में से घटेगी।',
  },
  adjustedFromAdvanceBadge: { en: 'Contractor Advance Adjusted', hi: 'ठेकेदार एडवांस से समायोजित' },

  // Language Toggle
  switchLang: { en: 'हिंदी', hi: 'English' },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem('hisabbook_language') || 'hi'
  );

  const toggleLanguage = () => {
    const nextLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang);
    localStorage.setItem('hisabbook_language', nextLang);
  };

  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
