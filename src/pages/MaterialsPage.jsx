import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  History,
  X,
  Loader2,
  CheckCircle,
  Truck,
  Printer,
  Pencil,
  Trash2,
  PackageCheck,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
  Eye,
  Scale,
  Receipt,
  Upload,
  Coins,
  HandCoins,
  Wallet,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const MaterialsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProject } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState('inward'); // 'inward' (सामान आवक व लागत) or 'stock'
  const [inwardSubTab, setInwardSubTab] = useState('grouped'); // 'grouped' (सामग्री-वार कुल) or 'log' (तारीख-वार डिलीवरी)
  const [expandedMaterialKey, setExpandedMaterialKey] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [materialTransactions, setMaterialTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [inwardSearch, setInwardSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [inwardDateStart, setInwardDateStart] = useState('');
  const [inwardDateEnd, setInwardDateEnd] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);
  const [selectedReceiptDoc, setSelectedReceiptDoc] = useState(null);

  // Direct Record Material Arrival Modal State
  const [recordArrivalModalOpen, setRecordArrivalModalOpen] = useState(false);
  const [arrivalFormData, setArrivalFormData] = useState({
    materialName: '',
    category: 'Civil Materials',
    unit: 'bag',
    quantity: '',
    ratePerUnit: '',
    supplier: '',
    account: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().slice(0, 10),
    challanNumber: '',
    vehicleNumber: '',
    notes: '',
    paymentSourceType: 'direct_account', // 'direct_account' | 'contractor_advance'
    contractor: '',
    linkedAdvance: '',
  });
  const [arrivalCapturedFiles, setArrivalCapturedFiles] = useState([]);
  const [contractorPayments, setContractorPayments] = useState([]);
  const [loadingContractorPayments, setLoadingContractorPayments] = useState(false);

  // Edit Material state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);

  // Add / Edit Material Form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Civil Materials',
    brand: '',
    defaultSupplier: '',
    purchaseUnit: 'bag',
    stockUnit: 'bag',
    conversionFactor: 1,
    minStockAlert: 10,
    initialStock: 0,
    averageUnitCost: 0,
    storageLocation: 'Site Yard',
    notes: '',
  });

  // Movement Form
  const [movementData, setMovementData] = useState({
    movementType: 'usage',
    quantity: '',
    unitPrice: 0,
    date: new Date().toISOString().slice(0, 10),
    reason: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAddModal();
      searchParams.delete('add');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const loadData = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;

      const [matRes, conRes, purRes, txnRes, accRes, advRes] = await Promise.all([
        api.getMaterials(params),
        api.getContacts(),
        api.getPurchases(),
        api.getTransactions({ isMaterial: 'true', limit: 300 }),
        api.getAccounts(),
        api.getAdvances(),
      ]);

      if (matRes.success) setMaterials(matRes.data);
      if (conRes.success) setContacts(conRes.data);
      if (purRes.success) setPurchases(purRes.data);
      if (txnRes.success) setMaterialTransactions(txnRes.data);
      if (accRes.success) setAccounts(accRes.data);
      if (advRes.success) setAdvances(advRes.data);
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?._id, categoryFilter, search]);

  // Compute available unsettled advance balance for each contractor
  const contractorAdvanceMap = {};
  advances.forEach((adv) => {
    if (!adv.isCancelled && adv.contact) {
      const cId = adv.contact._id || adv.contact;
      const unsettled =
        adv.advanceDetails?.unsettledAmount ??
        (adv.amount - (adv.advanceDetails?.settledAmount || 0));
      contractorAdvanceMap[cId] = (contractorAdvanceMap[cId] || 0) + unsettled;
    }
  });

  const openRecordArrivalModal = () => {
    const defaultAcc = accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || '';
    setArrivalFormData({
      materialName: '',
      category: 'Civil Materials',
      unit: 'bag',
      quantity: '',
      ratePerUnit: '',
      supplier: '',
      account: defaultAcc,
      paymentMethod: 'cash',
      date: new Date().toISOString().slice(0, 10),
      challanNumber: '',
      vehicleNumber: '',
      notes: '',
      paymentSourceType: 'direct_account',
      contractor: '',
      linkedAdvance: '',
    });
    setContractorPayments([]);
    setArrivalCapturedFiles([]);
    setError('');
    setRecordArrivalModalOpen(true);
  };

  const fetchContractorPayments = async (contactId) => {
    if (!contactId) {
      setContractorPayments([]);
      return;
    }
    setLoadingContractorPayments(true);
    try {
      const local = [
        ...advances.filter((a) => (a.contact?._id || a.contact) === contactId),
        ...transactions.filter(
          (t) =>
            (t.contact?._id || t.contact) === contactId &&
            !t.isAdjustedFromAdvance &&
            !t.isCancelled &&
            (t.type === 'advance' || t.type === 'contractor_payment' || t.type === 'expense' || t.isAdvance)
        ),
      ];
      const seen = new Set();
      const uniqueLocal = local.filter((item) => {
        if (!item._id || seen.has(item._id)) return false;
        seen.add(item._id);
        return true;
      });
      setContractorPayments(uniqueLocal);

      const res = await api.getTransactions({ contact: contactId, limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        const serverFiltered = res.data.filter(
          (t) =>
            !t.isCancelled &&
            !t.isAdjustedFromAdvance &&
            (t.type === 'advance' || t.type === 'contractor_payment' || t.type === 'expense' || t.isAdvance)
        );
        const map = new Map();
        uniqueLocal.forEach((item) => map.set(item._id, item));
        serverFiltered.forEach((item) => map.set(item._id, item));
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setContractorPayments(combined);
      }
    } catch (err) {
      console.error('Error fetching contractor payments:', err);
    } finally {
      setLoadingContractorPayments(false);
    }
  };

  const handleContractorChange = (contactId) => {
    setArrivalFormData((prev) => ({
      ...prev,
      contractor: contactId,
      linkedAdvance: '',
    }));
    fetchContractorPayments(contactId);
  };

  const handleArrivalSubmit = async (e) => {
    e.preventDefault();
    if (!arrivalFormData.materialName.trim()) {
      setError(language === 'hi' ? 'कृपया सामग्री का नाम दर्ज करें।' : 'Please enter material name.');
      return;
    }
    const qty = Number(arrivalFormData.quantity);
    const rate = Number(arrivalFormData.ratePerUnit);
    if (!qty || qty <= 0) {
      setError(language === 'hi' ? 'कृपया सही मात्रा दर्ज करें।' : 'Please enter valid quantity.');
      return;
    }
    if (!rate || rate <= 0) {
      setError(language === 'hi' ? 'कृपया सही भाव / दर दर्ज करें।' : 'Please enter valid rate.');
      return;
    }

    const totalCost = Number((qty * rate).toFixed(2));
    const isFromAdv = arrivalFormData.paymentSourceType === 'contractor_advance';

    if (isFromAdv) {
      if (!arrivalFormData.contractor) {
        setError(
          language === 'hi'
            ? 'कृपया ठेकेदार चुनें जिनके पहले दिए एडवांस में से यह राशि काटी जानी है।'
            : 'Please select contractor to adjust from advance.'
        );
        return;
      }

      const chosenTxn = arrivalFormData.linkedAdvance
        ? contractorPayments.find((p) => p._id === arrivalFormData.linkedAdvance)
        : null;

      if (chosenTxn) {
        const avail =
          chosenTxn.advanceDetails?.unsettledAmount !== undefined
            ? chosenTxn.advanceDetails.unsettledAmount
            : chosenTxn.amount;
        if (totalCost > avail) {
          setError(
            language === 'hi'
              ? `सामग्री की कुल कीमत (₹${totalCost.toLocaleString('en-IN')}) चुने गए भुगतान के शेष बैलेंस (₹${Number(avail).toLocaleString('en-IN')}) से अधिक है।`
              : `Total cost exceeds selected payment available balance of ₹${Number(avail).toLocaleString('en-IN')}.`
          );
          return;
        }
      } else {
        const availableAdv = contractorAdvanceMap[arrivalFormData.contractor] || 0;
        if (availableAdv <= 0) {
          setError(
            language === 'hi'
              ? 'इस ठेकेदार के पास कोई बकाया/खुला एडवांस उपलब्ध नहीं है।'
              : 'This contractor has no available advance balance.'
          );
          return;
        }
        if (totalCost > availableAdv) {
          setError(
            language === 'hi'
              ? `सामग्री की कुल कीमत (₹${totalCost.toLocaleString('en-IN')}) ठेकेदार के पास उपलब्ध खुले एडवांस (₹${availableAdv.toLocaleString('en-IN')}) से अधिक है।`
              : `Total cost exceeds contractor available advance of ₹${availableAdv.toLocaleString('en-IN')}.`
          );
          return;
        }
      }
    } else {
      const acc = arrivalFormData.account || accounts[0]?._id;
      if (!acc) {
        setError(language === 'hi' ? 'कृपया भुगतान खाता चुनें।' : 'Please select payment account.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');

      let attachmentIds = [];
      if (arrivalCapturedFiles.length > 0) {
        const fileForm = new FormData();
        arrivalCapturedFiles.forEach((f) => fileForm.append('files', f));
        fileForm.append('title', `${arrivalFormData.materialName} Inward Receipt`);
        fileForm.append('documentType', 'bill');

        const uploadRes = await api.uploadDocuments(fileForm);
        if (uploadRes.success) {
          attachmentIds = uploadRes.data.map((d) => d._id);
        }
      }

      const contractorObj = contacts.find((c) => c._id === arrivalFormData.contractor);
      const contractorName = contractorObj?.name || '';
      const acc = arrivalFormData.account || accounts[0]?._id;

      const payload = {
        type: 'expense',
        amount: totalCost,
        date: arrivalFormData.date,
        account: acc,
        contact: isFromAdv ? arrivalFormData.contractor : (arrivalFormData.supplier || null),
        linkedAdvance: arrivalFormData.linkedAdvance || null,
        category: arrivalFormData.category || 'Civil Materials',
        description: isFromAdv
          ? `Material Inward: ${arrivalFormData.materialName} (${qty} ${arrivalFormData.unit} @ ₹${rate}/${arrivalFormData.unit}) [ठेकेदार एडवांस से समायोजित - ${contractorName}]`
          : `Material Inward: ${arrivalFormData.materialName} (${qty} ${arrivalFormData.unit} @ ₹${rate}/${arrivalFormData.unit})`,
        paymentMethod: isFromAdv ? 'advance_adjustment' : (arrivalFormData.paymentMethod || 'cash'),
        paymentStatus: 'paid',
        paymentSourceType: arrivalFormData.paymentSourceType,
        isAdjustedFromAdvance: isFromAdv,
        contractor: isFromAdv ? arrivalFormData.contractor : null,
        referenceNumber: arrivalFormData.challanNumber || '',
        notes: arrivalFormData.notes || '',
        materialDetails: {
          isMaterial: true,
          materialName: arrivalFormData.materialName.trim(),
          category: arrivalFormData.category || 'Civil Materials',
          unit: arrivalFormData.unit,
          quantity: qty,
          ratePerUnit: rate,
          totalMaterialCost: totalCost,
          vehicleNumber: arrivalFormData.vehicleNumber || '',
          challanNumber: arrivalFormData.challanNumber || '',
          paymentSourceType: arrivalFormData.paymentSourceType,
          isAdjustedFromAdvance: isFromAdv,
          contractor: isFromAdv ? arrivalFormData.contractor : null,
          contractorName: contractorName,
        },
        attachments: attachmentIds,
      };

      const res = await api.createTransaction(payload);
      if (res.success) {
        setRecordArrivalModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Error recording material arrival.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingMaterialId(null);
    setFormData({
      name: '',
      code: '',
      category: 'Civil Materials',
      brand: '',
      defaultSupplier: '',
      purchaseUnit: 'bag',
      stockUnit: 'bag',
      conversionFactor: 1,
      minStockAlert: 10,
      initialStock: 0,
      averageUnitCost: 0,
      storageLocation: 'Site Yard',
      notes: '',
    });
    setError('');
    setAddModalOpen(true);
  };

  const openEditModal = (mat) => {
    setIsEditMode(true);
    setEditingMaterialId(mat._id);
    setFormData({
      name: mat.name || '',
      code: mat.code || '',
      category: mat.category || 'Civil Materials',
      brand: mat.brand || '',
      defaultSupplier: mat.defaultSupplier?._id || mat.defaultSupplier || '',
      purchaseUnit: mat.purchaseUnit || 'bag',
      stockUnit: mat.stockUnit || 'bag',
      conversionFactor: mat.conversionFactor || 1,
      minStockAlert: mat.minStockAlert || 10,
      initialStock: mat.currentStock || 0,
      averageUnitCost: mat.averageUnitCost || 0,
      storageLocation: mat.storageLocation || 'Site Yard',
      notes: mat.notes || '',
    });
    setError('');
    setAddModalOpen(true);
  };

  const handleDeleteMaterial = async (mat) => {
    const confirmMsg =
      language === 'hi'
        ? `क्या आप वास्तव में "${mat.name}" को हटाना चाहते हैं?`
        : `Are you sure you want to delete material "${mat.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteMaterial(mat._id);
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete material.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(language === 'hi' ? 'कृपया सामग्री का नाम दर्ज करें।' : 'Please provide material name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (isEditMode && editingMaterialId) {
        const res = await api.updateMaterial(editingMaterialId, formData);
        if (res.success) {
          setAddModalOpen(false);
          setIsEditMode(false);
          setEditingMaterialId(null);
          await loadData();
        }
      } else {
        const res = await api.createMaterial(formData);
        if (res.success) {
          setAddModalOpen(false);
          await loadData();
        }
      }
    } catch (err) {
      setError(err.message || (language === 'hi' ? 'त्रुटि हुई।' : 'Error creating material.'));
    } finally {
      setSubmitting(false);
    }
  };

  const openUsageModal = (mat) => {
    setSelectedMaterial(mat);
    setMovementData({
      movementType: 'usage',
      quantity: '',
      unitPrice: mat.averageUnitCost || 0,
      date: new Date().toISOString().slice(0, 10),
      reason: '',
    });
    setError('');
    setUsageModalOpen(true);
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(movementData.quantity);
    if (!qty || qty <= 0) {
      setError(language === 'hi' ? 'कृपया वैध मात्रा दर्ज करें।' : 'Please enter a valid quantity.');
      return;
    }

    if (qty > selectedMaterial.currentStock) {
      setError(
        language === 'hi'
          ? `उपलब्ध स्टॉक (${selectedMaterial.currentStock} ${selectedMaterial.stockUnit}) से अधिक खपत दर्ज नहीं की जा सकती।`
          : `Usage cannot exceed current stock (${selectedMaterial.currentStock} ${selectedMaterial.stockUnit}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.recordMovement({
        material: selectedMaterial._id,
        movementType: movementData.movementType,
        quantity: qty,
        unit: selectedMaterial.stockUnit,
        unitPrice: movementData.unitPrice,
        date: movementData.date,
        reason: movementData.reason,
      });

      if (res.success) {
        setUsageModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Error recording usage.');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryModal = async (mat) => {
    setSelectedMaterial(mat);
    setHistoryModalOpen(true);
    try {
      const res = await api.getMaterial(mat._id);
      if (res.success) {
        setMovementHistory(res.data.movements || []);
      }
    } catch (err) {
      console.error('Error fetching movement history:', err);
    }
  };

  // Compile all Inward Deliveries (क्या आया, कितना आया, कितने का आया)
  const inwardEntries = [];

  // 1. Line items from Purchases
  purchases.forEach((p) => {
    if (p.items && p.items.length > 0) {
      p.items.forEach((it, idx) => {
        inwardEntries.push({
          id: `pur-${p._id}-${idx}`,
          sourceType: 'purchase',
          billNumber: p.billNumber,
          billDate: p.billDate,
          supplierName: p.supplier?.name || p.supplier?.companyName || 'Supplier',
          materialName: it.description || it.material?.name || 'Material Item',
          category: it.material?.category || 'Civil Materials',
          quantity: it.quantityReceived || it.quantityOrdered || 1,
          unit: it.unit || 'piece',
          unitPrice: it.unitPrice || 0,
          taxPercent: it.taxPercent || 0,
          totalCost: it.totalAmount || (Number(it.quantityOrdered || 1) * Number(it.unitPrice || 0)),
          vehicleNumber: '',
          challanNumber: p.billNumber || '',
          attachments: p.attachments || [],
        });
      });
    }
  });

  // 2. Direct material entries recorded via transactions
  materialTransactions.forEach((txn) => {
    if (txn.materialDetails?.isMaterial) {
      const md = txn.materialDetails;
      const isFromAdv =
        txn.isAdjustedFromAdvance ||
        md.isAdjustedFromAdvance ||
        txn.paymentSourceType === 'contractor_advance' ||
        md.paymentSourceType === 'contractor_advance';

      inwardEntries.push({
        id: `txn-${txn._id}`,
        sourceType: 'transaction',
        billNumber: md.challanNumber || txn.referenceNumber || txn.transactionId,
        billDate: txn.date,
        supplierName:
          txn.contact?.name ||
          txn.contact?.companyName ||
          md.contractorName ||
          (isFromAdv ? 'Contractor' : 'Cash / Direct Vendor'),
        materialName: md.materialName || txn.description || 'Material',
        category: md.category || txn.category || 'Civil Materials',
        quantity: md.quantity || 1,
        unit: md.unit || 'bag',
        unitPrice: md.ratePerUnit || 0,
        totalCost: md.totalMaterialCost || txn.amount,
        vehicleNumber: md.vehicleNumber || '',
        challanNumber: md.challanNumber || '',
        attachments: txn.attachments || [],
        paymentMethod: txn.paymentMethod,
        accountName: txn.account?.name,
        isAdjustedFromAdvance: isFromAdv,
        contractorName: md.contractorName || txn.contact?.name,
        paymentSourceType:
          txn.paymentSourceType ||
          md.paymentSourceType ||
          (isFromAdv ? 'contractor_advance' : 'direct_account'),
      });
    }
  });

  inwardEntries.sort((a, b) => new Date(b.billDate) - new Date(a.billDate));

  // Filter inward entries
  const filteredInwardEntries = inwardEntries.filter((entry) => {
    if (inwardSearch) {
      const q = inwardSearch.toLowerCase();
      const matchName = entry.materialName?.toLowerCase().includes(q);
      const matchSupplier = entry.supplierName?.toLowerCase().includes(q);
      const matchBill = entry.billNumber?.toLowerCase().includes(q);
      const matchVeh = entry.vehicleNumber?.toLowerCase().includes(q);
      if (!matchName && !matchSupplier && !matchBill && !matchVeh) return false;
    }
    if (unitFilter && (entry.unit || '').toLowerCase() !== unitFilter.toLowerCase()) {
      return false;
    }
    if (inwardDateStart && new Date(entry.billDate) < new Date(inwardDateStart)) return false;
    if (inwardDateEnd) {
      const end = new Date(inwardDateEnd);
      end.setHours(23, 59, 59, 999);
      if (new Date(entry.billDate) > end) return false;
    }
    return true;
  });

  // Group inward entries by Material to show "कितना सामान आया और कुल कितने का आया"
  const materialGroupedMap = {};

  filteredInwardEntries.forEach((entry) => {
    const key = entry.materialName?.trim().toLowerCase() || 'unknown';
    if (!materialGroupedMap[key]) {
      materialGroupedMap[key] = {
        key,
        name: entry.materialName,
        unit: entry.unit,
        totalQuantity: 0,
        totalCost: 0,
        deliveriesCount: 0,
        suppliers: new Set(),
        firstDate: entry.billDate,
        lastDate: entry.billDate,
        arrivals: [],
      };
    }

    const group = materialGroupedMap[key];
    group.totalQuantity += Number(entry.quantity || 0);
    group.totalCost += Number(entry.totalCost || 0);
    group.deliveriesCount += 1;
    if (entry.supplierName) group.suppliers.add(entry.supplierName);

    if (new Date(entry.billDate) < new Date(group.firstDate)) {
      group.firstDate = entry.billDate;
    }
    if (new Date(entry.billDate) > new Date(group.lastDate)) {
      group.lastDate = entry.billDate;
    }

    group.arrivals.push(entry);
  });

  const materialSummaries = Object.values(materialGroupedMap)
    .map((m) => {
      return {
        ...m,
        avgRate: m.totalQuantity > 0 ? m.totalCost / m.totalQuantity : 0,
        suppliersList: Array.from(m.suppliers).join(', '),
        arrivals: m.arrivals.sort((a, b) => new Date(b.billDate) - new Date(a.billDate)),
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);

  const totalInwardValue = filteredInwardEntries.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const uniqueMaterialsCount = materialSummaries.length;

  // Dedicated calculations for Bag and Weight/Quintal breakdowns
  const bagItems = filteredInwardEntries.filter(
    (e) => (e.unit || '').toLowerCase() === 'bag'
  );
  const totalBags = bagItems.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
  const totalBagCost = bagItems.reduce((acc, curr) => acc + Number(curr.totalCost || 0), 0);
  const avgRatePerBag = totalBags > 0 ? totalBagCost / totalBags : 0;

  // Weight statistics (Quintals / Tons)
  const weightItems = filteredInwardEntries.filter((e) => {
    const u = (e.unit || '').toLowerCase();
    return u === 'quintal' || u === 'ton' || u === 'kg';
  });
  const totalQuintals = weightItems.reduce((acc, curr) => {
    const u = (curr.unit || '').toLowerCase();
    const q = Number(curr.quantity || 0);
    if (u === 'ton') return acc + q * 10; // 1 ton = 10 quintals
    if (u === 'kg') return acc + q / 100; // 100 kg = 1 quintal
    return acc + q;
  }, 0);
  const totalWeightCost = weightItems.reduce((acc, curr) => acc + Number(curr.totalCost || 0), 0);
  const avgRatePerQuintal = totalQuintals > 0 ? totalWeightCost / totalQuintals : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="h-6 w-6 text-amber-600" />
            <span>
              {language === 'hi' ? 'सामग्री स्टॉक एवं सामान आवक' : 'Materials & Stock Inventory'}
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'hi'
              ? 'सामान क्या आया, कितना आया और कितने का आया — पूरा स्टॉक और आवक रजिस्टर'
              : 'Multi-unit stock tracking, reorder warnings, and inward goods received ledger'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openRecordArrivalModal}
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition"
          >
            <Truck className="h-4 w-4" />
            <span>{language === 'hi' ? '+ नया सामान आवक दर्ज करें' : '+ Record Material Arrival'}</span>
          </button>

          {activeTab === 'inward' && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              title="Print Register"
            >
              <Printer className="h-4 w-4" />
              <span>{t('print')}</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addMaterial')}</span>
          </button>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'stock'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>{language === 'hi' ? '📦 सामग्री स्टॉक स्थिति (Stock)' : '📦 Current Stock'}</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] ml-1">
            {materials.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inward')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'inward'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>{language === 'hi' ? '📋 सामान आवक रजिस्टर (क्या व कितना आया)' : '📋 Goods Received (Inward Hisab)'}</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] ml-1">
            {inwardEntries.length}
          </span>
        </button>
      </div>

      {/* ================= TAB 1: CURRENT STOCK OVERVIEW ================= */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Filter and Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  language === 'hi'
                    ? 'सामग्री का नाम, श्रेणी या ब्रांड से खोजें...'
                    : 'Search material by name, category, or brand...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 shadow-sm"
              />
            </div>

            <input
              type="text"
              placeholder={language === 'hi' ? 'श्रेणी फ़िल्टर...' : 'Filter Category...'}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none shadow-sm"
            />
          </div>

          {/* Material Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : materials.length > 0 ? (
              materials.map((m) => {
                const isLow = m.currentStock <= (m.minStockAlert || 0);
                return (
                  <div
                    key={m._id}
                    className={`rounded-3xl border bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                      isLow ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {m.category} {m.brand ? `• ${m.brand}` : ''}
                          </div>
                        </div>
                        {isLow ? (
                          <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                            <AlertTriangle className="h-3 w-3" />{' '}
                            {language === 'hi' ? 'कम स्टॉक' : 'Low Stock'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            {language === 'hi' ? 'स्टॉक उपलब्ध' : 'In Stock'}
                          </span>
                        )}
                      </div>

                      {/* Stock Display Highlight */}
                      <div className="my-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {language === 'hi' ? 'उपलब्ध स्टॉक' : 'Available Stock'}
                        </span>
                        <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                          {m.currentStock}{' '}
                          <span className="text-sm font-semibold text-slate-500">{m.stockUnit}</span>
                        </div>
                        {m.conversionFactor !== 1 && (
                          <div className="text-[11px] text-slate-400 mt-1">
                            1 {m.purchaseUnit} = {m.conversionFactor} {m.stockUnit}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 mb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            {language === 'hi' ? 'औसत भाव' : 'Avg Rate'}
                          </span>
                          <span className="font-bold text-slate-800">
                            {m.averageUnitCost ? `${formatINR(m.averageUnitCost)}/${m.purchaseUnit}` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            {language === 'hi' ? 'चेतावनी सीमा' : 'Alert Limit'}
                          </span>
                          <span className="font-bold text-slate-800">
                            {m.minStockAlert} {m.stockUnit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions: Usage, History, Edit, Delete */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openUsageModal(m)}
                          className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                        >
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                          <span>{language === 'hi' ? 'खपत दर्ज करें' : 'Record Usage'}</span>
                        </button>

                        <button
                          onClick={() => openHistoryModal(m)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(m)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                          title={t('edit')}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteMaterial(m)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title={t('delete')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
                <Boxes className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <div className="text-sm font-semibold text-slate-600">
                  {language === 'hi' ? 'कोई सामग्री नहीं मिली' : 'No Materials Found'}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'hi'
                    ? 'सीमेंट, रेत, सरिया, ईंट आदि जोड़ने के लिए ऊपर बटन दबाएं।'
                    : 'Click "Add Material" to define construction or project stock items.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: GOODS RECEIVED REGISTER (क्या व कितना आया) ================= */}
      {activeTab === 'inward' && (
        <div className="space-y-6">
          {/* Summary Metric Cards with Bag & Weight/Quintal Rate Breakdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Total Cost */}
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-600" />
                <span>{language === 'hi' ? 'कुल प्राप्त सामान का मूल्य' : 'Total Materials Inward'}</span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">
                {formatINR(totalInwardValue)}
              </div>
              <p className="text-[11px] text-amber-800 mt-1 font-medium">
                {language === 'hi'
                  ? `साइट पर दर्ज कुल ${filteredInwardEntries.length} आवक खेपें`
                  : `Across ${filteredInwardEntries.length} delivery lots`}
              </p>
            </div>

            {/* Card 2: Bag Statistics (Cement, Putty, etc.) */}
            <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-500/10 to-amber-100/60 p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-amber-700" />
                  <span>{language === 'hi' ? 'सीमेंट / बैग आवक' : 'Bags Received (Cement)'}</span>
                </span>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 font-bold px-1.5 py-0.2 rounded">
                  {bagItems.length} {language === 'hi' ? 'चालान' : 'lots'}
                </span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{totalBags.toLocaleString('en-IN')}</span>
                <span className="text-sm font-semibold text-slate-600">{language === 'hi' ? 'बैग / बोरी' : 'Bags'}</span>
              </div>
              <div className="text-xs text-amber-950 mt-1 font-bold flex items-center gap-1.5">
                <span>{language === 'hi' ? 'औसत भाव:' : 'Avg Rate:'}</span>
                <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-900 font-black">
                  {totalBags > 0 ? `${formatINR(avgRatePerBag)} / बैग` : '₹0 / बैग'}
                </span>
              </div>
            </div>

            {/* Card 3: Weight / Quintal Statistics (Steel / Sariya) */}
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50/40 p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{language === 'hi' ? 'सरिया / स्टील वजन' : 'Steel / Weight'}</span>
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-950 font-bold px-1.5 py-0.2 rounded">
                  {weightItems.length} {language === 'hi' ? 'चालान' : 'lots'}
                </span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{totalQuintals.toFixed(2)}</span>
                <span className="text-sm font-semibold text-slate-600">{language === 'hi' ? 'क्विंटल (Qtl)' : 'Qtl'}</span>
              </div>
              <div className="text-xs text-indigo-950 mt-1 font-bold flex items-center gap-1.5">
                <span>{language === 'hi' ? 'औसत भाव:' : 'Avg Rate:'}</span>
                <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-indigo-200 text-indigo-900 font-black">
                  {totalQuintals > 0 ? `${formatINR(avgRatePerQuintal)} / क्विंटल` : '₹0 / क्विंटल'}
                </span>
              </div>
            </div>

            {/* Card 4: Lots & Unique Materials */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-slate-500" />
                <span>{language === 'hi' ? 'कुल खेपें व सामग्री प्रकार' : 'Deliveries & Items'}</span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{filteredInwardEntries.length}</span>
                <span className="text-sm font-semibold text-slate-500">{language === 'hi' ? 'खेपें' : 'lots'}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {uniqueMaterialsCount} {language === 'hi' ? 'विभिन्न सामग्री प्रकार (सीमेंट, रेत, सरिया आदि)' : 'material types'}
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  language === 'hi'
                    ? 'सामान का नाम, सप्लायर, चालान नंबर या गाड़ी नंबर से खोजें...'
                    : 'Search by material, supplier, challan # or vehicle #...'
                }
                value={inwardSearch}
                onChange={(e) => setInwardSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 shadow-sm"
              />
            </div>

            {/* Unit Filter */}
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none shadow-sm"
            >
              <option value="">{language === 'hi' ? 'सभी इकाइयां (All Units)' : 'All Units'}</option>
              <option value="bag">{language === 'hi' ? '🛍️ बैग / बोरी (Bags Only)' : '🛍️ Bags Only'}</option>
              <option value="quintal">{language === 'hi' ? '⚖️ क्विंटल (Quintals Only)' : '⚖️ Quintals Only'}</option>
              <option value="ton">{language === 'hi' ? '🏗️ टन (Tons Only)' : '🏗️ Tons Only'}</option>
              <option value="brass">{language === 'hi' ? '🚛 ब्रास (Brass Only)' : '🚛 Brass Only'}</option>
              <option value="cft">{language === 'hi' ? '📐 घन फीट (Cu.Ft Only)' : '📐 Cu.Ft Only'}</option>
              <option value="piece">{language === 'hi' ? '🧱 नग / ईंट (Pieces Only)' : '🧱 Pieces Only'}</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={inwardDateStart}
                onChange={(e) => setInwardDateStart(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm"
              />
              <span className="text-xs text-slate-400">{t('to')}</span>
              <input
                type="date"
                value={inwardDateEnd}
                onChange={(e) => setInwardDateEnd(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm"
              />
              {(inwardSearch || unitFilter || inwardDateStart || inwardDateEnd) && (
                <button
                  onClick={() => {
                    setInwardSearch('');
                    setUnitFilter('');
                    setInwardDateStart('');
                    setInwardDateEnd('');
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100"
                  title="Clear Filters"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Inward Register Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setInwardSubTab('grouped')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                inwardSubTab === 'grouped'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>
                {language === 'hi'
                  ? '📊 सामग्री-वार कुल सारांश (किस सामान का कितना आया व कितने का आया)'
                  : '📊 Material-wise Total Summary'}
              </span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] ml-1">
                {materialSummaries.length}
              </span>
            </button>

            <button
              onClick={() => setInwardSubTab('log')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                inwardSubTab === 'log'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>
                {language === 'hi'
                  ? '📋 तारीख-वार संपूर्ण आवक सूची (Delivery Log)'
                  : '📋 Date-wise Delivery Log'}
              </span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] ml-1">
                {filteredInwardEntries.length}
              </span>
            </button>
          </div>

          {/* ================= SUB-VIEW 1: GROUPED MATERIAL SUMMARY ================= */}
          {inwardSubTab === 'grouped' && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 bg-amber-50/40 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-amber-600" />
                    <span>
                      {language === 'hi'
                        ? 'सामग्री-वार कुल आवक व कुल लागत (क्या, कितना व कितने का आया)'
                        : 'Material-wise Cumulative Received & Total Cost'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {language === 'hi'
                      ? 'प्रत्येक सामान की कुल प्राप्त मात्रा, औसत भाव, कुल रुपये और तारीख-वार इतिहास'
                      : 'Total inward quantities, average unit cost, total spent, and date-wise arrival history'}
                  </p>
                </div>

                <span className="text-xs font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200">
                  {materialSummaries.length} {language === 'hi' ? 'सामग्रियां' : 'Materials'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-4 py-3">{language === 'hi' ? 'सामग्री का नाम' : 'Material / Item'}</th>
                      <th className="px-4 py-3 text-right">{language === 'hi' ? 'कुल कितना आया' : 'Total Arrived'}</th>
                      <th className="px-4 py-3 text-right">{language === 'hi' ? 'औसत भाव' : 'Avg Rate'}</th>
                      <th className="px-4 py-3 text-right">{language === 'hi' ? 'कुल कितने का आया' : 'Total Cost'}</th>
                      <th className="px-4 py-3 text-center">{language === 'hi' ? 'कुल खेपें' : 'Lots'}</th>
                      <th className="px-4 py-3">{language === 'hi' ? 'आखिरी आवक तारीख' : 'Last Arrival'}</th>
                      <th className="px-4 py-3">{language === 'hi' ? 'सप्लायर' : 'Suppliers'}</th>
                      <th className="px-4 py-3 text-center">{language === 'hi' ? 'तारीख-वार देखें' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materialSummaries.length > 0 ? (
                      materialSummaries.map((m) => {
                        const isExpanded = expandedMaterialKey === m.key;
                        return (
                          <React.Fragment key={m.key}>
                            <tr
                              className={`hover:bg-amber-50/30 transition cursor-pointer ${
                                isExpanded ? 'bg-amber-50/40' : ''
                              }`}
                              onClick={() =>
                                setExpandedMaterialKey(isExpanded ? null : m.key)
                              }
                            >
                              <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-amber-600"></span>
                                  <span className="text-xs sm:text-sm">{m.name}</span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-right whitespace-nowrap font-black text-slate-900">
                                {m.totalQuantity}{' '}
                                <span className="font-medium text-slate-500 text-[11px]">{m.unit}</span>
                              </td>

                              <td className="px-4 py-3 text-right whitespace-nowrap text-slate-700 font-semibold">
                                {formatINR(m.avgRate)} / {m.unit}
                              </td>

                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="inline-block bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                                  <span className="text-xs sm:text-sm font-black text-amber-950">
                                    {formatINR(m.totalCost)}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-center whitespace-nowrap font-bold text-slate-700">
                                {m.deliveriesCount}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {language === 'hi' ? 'बार' : 'times'}
                                </span>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                                {formatDate(m.lastDate)}
                              </td>

                              <td className="px-4 py-3 text-slate-600 text-[11px] max-w-xs truncate">
                                {m.suppliersList || '-'}
                              </td>

                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedMaterialKey(isExpanded ? null : m.key);
                                  }}
                                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition border ${
                                    isExpanded
                                      ? 'bg-amber-600 text-white border-amber-600'
                                      : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                                  }`}
                                >
                                  <span>{language === 'hi' ? 'तारीख-वार आवक' : 'Dates'}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* EXPANDED DATE-WISE ARRIVAL TIMELINE FOR THIS MATERIAL */}
                            {isExpanded && (
                              <tr className="bg-slate-50/70">
                                <td colSpan="8" className="px-4 py-3">
                                  <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-amber-600" />
                                        <span>
                                          {m.name} — {language === 'hi' ? 'तारीख-वार आवक का पूरा हिसाब' : 'Date-wise Delivery History'}
                                        </span>
                                      </span>
                                      <span className="text-[11px] text-slate-500">
                                        {language === 'hi' ? 'कुल आया' : 'Total Received'}:{' '}
                                        <strong className="text-slate-900">
                                          {m.totalQuantity} {m.unit}
                                        </strong>{' '}
                                        • {language === 'hi' ? 'कुल लागत' : 'Total Cost'}:{' '}
                                        <strong className="text-amber-900">{formatINR(m.totalCost)}</strong>
                                      </span>
                                    </div>

                                    <table className="w-full text-left text-xs">
                                      <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                                        <tr>
                                          <th className="px-3 py-1.5">{t('date')}</th>
                                          <th className="px-3 py-1.5 text-right">{language === 'hi' ? 'कितना आया' : 'Quantity'}</th>
                                          <th className="px-3 py-1.5 text-right">{language === 'hi' ? 'भाव / दर' : 'Unit Rate'}</th>
                                          <th className="px-3 py-1.5 text-right">{language === 'hi' ? 'कुल कितने का आया' : 'Amount'}</th>
                                          <th className="px-3 py-1.5">{language === 'hi' ? 'सप्लायर' : 'Supplier'}</th>
                                          <th className="px-3 py-1.5">{language === 'hi' ? 'बिल / चालान नं.' : 'Bill / Challan #'}</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {m.arrivals.map((arr) => (
                                          <tr key={arr.id} className="hover:bg-slate-50/50">
                                            <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">
                                              {formatDate(arr.billDate)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-black text-slate-900 whitespace-nowrap">
                                              {arr.quantity} {arr.unit}
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">
                                              {formatINR(arr.unitPrice)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-black text-amber-900 whitespace-nowrap">
                                              {formatINR(arr.totalCost)}
                                            </td>
                                            <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">
                                              {arr.supplierName}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                              {arr.billNumber || '-'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          {language === 'hi'
                            ? 'कोई सामान आवक रिकॉर्ड नहीं मिला। "बिल व चालान" में नया बिल जोड़ते ही यहाँ ऑटोमैटिक दर्ज हो जाएगा।'
                            : 'No goods inward deliveries recorded yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SUB-VIEW 2: CHRONOLOGICAL DELIVERY LOG ================= */}
          {inwardSubTab === 'log' && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-amber-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="px-4 py-3">{t('date')}</th>
                      <th className="px-4 py-3">
                        {language === 'hi' ? 'सामग्री का नाम (Material Item)' : 'Material Item'}
                      </th>
                      <th className="px-4 py-3 text-right">
                        {language === 'hi' ? 'कितना आया (Quantity)' : 'Quantity Arrived'}
                      </th>
                      <th className="px-4 py-3 text-right">
                        {language === 'hi' ? 'भाव / दर (Unit Rate)' : 'Unit Rate'}
                      </th>
                      <th className="px-4 py-3 text-right">
                        {language === 'hi' ? 'कुल कितने का (Total Cost)' : 'Total Cost'}
                      </th>
                      <th className="px-4 py-3">
                        {language === 'hi' ? 'सप्लायर व खाता (Supplier & Account)' : 'Supplier & Account'}
                      </th>
                      <th className="px-4 py-3">
                        {language === 'hi' ? 'चालान व गाड़ी (Challan / Vehicle)' : 'Challan & Vehicle'}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {language === 'hi' ? 'रसीद / फोटो' : 'Proof'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInwardEntries.length > 0 ? (
                      filteredInwardEntries.map((entry) => {
                        const unitLower = (entry.unit || '').toLowerCase();
                        const isBag = unitLower === 'bag';
                        const isQuintal = unitLower === 'quintal';

                        return (
                          <tr key={entry.id} className="hover:bg-amber-50/30 transition">
                            {/* Date */}
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">
                              <div className="font-bold text-slate-900">{formatDate(entry.billDate)}</div>
                              <span className="text-[10px] text-slate-400">
                                {entry.sourceType === 'transaction'
                                  ? language === 'hi' ? '💵 सीधा भुगतान' : '💵 Cash/Direct'
                                  : language === 'hi' ? '🧾 बिल व चालान' : '🧾 Purchase Bill'}
                              </span>
                            </td>

                            {/* Material Name & Category */}
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${isBag ? 'bg-amber-500' : isQuintal ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                                <span>{entry.materialName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {entry.category || 'Civil Materials'}
                              </div>
                            </td>

                            {/* Quantity */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black ${
                                isBag
                                  ? 'bg-amber-100 text-amber-950 border border-amber-200'
                                  : isQuintal
                                  ? 'bg-indigo-100 text-indigo-950 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-900 border border-slate-200'
                              }`}>
                                {entry.quantity} {entry.unit}
                              </span>
                            </td>

                            {/* Unit Rate */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="font-black text-slate-800 text-xs">
                                {formatINR(entry.unitPrice)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-semibold">
                                {isBag
                                  ? language === 'hi' ? 'प्रति बैग' : 'per Bag'
                                  : isQuintal
                                  ? language === 'hi' ? 'प्रति क्विंटल' : 'per Quintal'
                                  : `per ${entry.unit}`}
                              </div>
                            </td>

                            {/* Total Cost */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span className="inline-block bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 font-black text-amber-950 text-xs sm:text-sm">
                                {formatINR(entry.totalCost)}
                              </span>
                            </td>

                            {/* Supplier & Account / Paid Via */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {entry.isAdjustedFromAdvance ? (
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{entry.contractorName || entry.supplierName}</span>
                                  </div>
                                  <div className="mt-1">
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-200">
                                      <HandCoins className="h-3 w-3 text-purple-700" />
                                      <span>{language === 'hi' ? 'ठेकेदार एडवांस से कटा' : 'Adjusted from Advance'}</span>
                                    </span>
                                    <div className="text-[9px] text-purple-700 mt-0.5 font-medium">
                                      {language === 'hi' ? '(बैंक/कैश खाते से नहीं कटा)' : '(Not deducted from bank)'}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-semibold text-slate-800">{entry.supplierName}</div>
                                  {entry.accountName && (
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                      <span>{entry.accountName}</span>
                                      {entry.paymentMethod && (
                                        <span className="uppercase text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                                          {entry.paymentMethod}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Challan & Vehicle */}
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700">
                              <div className="font-mono font-medium text-slate-800">
                                {entry.challanNumber || entry.billNumber || '-'}
                              </div>
                              {entry.vehicleNumber && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-sans">
                                  <Truck className="h-3 w-3 text-slate-400" />
                                  <span>{entry.vehicleNumber}</span>
                                </div>
                              )}
                            </td>

                            {/* Attachment / Proof */}
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {entry.attachments && entry.attachments.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceiptDoc(entry.attachments[0])}
                                  className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>{language === 'hi' ? 'फोटो देखें' : 'View Bill'}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          {language === 'hi'
                            ? 'कोई सामान आवक रिकॉर्ड नहीं मिला। ऊपर "+ नया सामान आवक दर्ज करें" बटन से अभी नया सामान दर्ज करें।'
                            : 'No goods inward deliveries found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= ADD / EDIT MATERIAL MODAL ================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {isEditMode
                    ? language === 'hi' ? 'सामग्री संपादित करें / बदलें' : 'Edit Material'
                    : t('addMaterial')}
                </h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'सामग्री का नाम *' : 'Material Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UltraTech Cement / TMT Rebar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('category')} *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="Cement">Cement (सीमेंट)</option>
                    <option value="Steel">Steel / TMT (सरिया)</option>
                    <option value="Aggregates">Sand & Aggregates (रेत व रोड़ी)</option>
                    <option value="Bricks">Bricks & Blocks (ईंट व ब्लॉक)</option>
                    <option value="Electrical">Electrical (बिजली सामग्री)</option>
                    <option value="Plumbing">Plumbing (नल व पाइप)</option>
                    <option value="Paint">Paint & Finish (पेंट व पुट्टी)</option>
                    <option value="Wood">Wood & Shuttering (लकड़ी व शटरिंग)</option>
                    <option value="Other">Other (अन्य सामग्री)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'ब्रांड (Brand)' : 'Brand'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Tiscon, UltraTech"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'प्राथमिक सप्लायर' : 'Default Supplier'}
                  </label>
                  <select
                    value={formData.defaultSupplier}
                    onChange={(e) => setFormData({ ...formData, defaultSupplier: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="">{language === 'hi' ? '-- सप्लायर चुनें --' : '-- Select Supplier --'}</option>
                    {contacts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Units */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {language === 'hi' ? 'खरीद इकाई' : 'Purchase Unit'}
                  </label>
                  <select
                    value={formData.purchaseUnit}
                    onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none"
                  >
                    <option value="bag">bag (बोरी)</option>
                    <option value="load">load (गाड़ी/ट्रॉली)</option>
                    <option value="tonne">tonne (टन)</option>
                    <option value="piece">piece (नग/पीस)</option>
                    <option value="kg">kg (किलोग्राम)</option>
                    <option value="cuft">cuft (घन फुट)</option>
                    <option value="thousand">thousand (हज़ार)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {language === 'hi' ? 'स्टॉक इकाई' : 'Stock Unit'}
                  </label>
                  <select
                    value={formData.stockUnit}
                    onChange={(e) => setFormData({ ...formData, stockUnit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none"
                  >
                    <option value="bag">bag</option>
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="cuft">cuft</option>
                    <option value="tonne">tonne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {language === 'hi' ? 'चेतावनी सीमा' : 'Min Alert'}
                  </label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              {!isEditMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'प्रारंभिक स्टॉक (Initial Stock)' : 'Initial Stock'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'रखने का स्थान (Storage Location)' : 'Storage Location'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Site Store Room / Yard Shed"
                  value={formData.storageLocation}
                  onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {submitting
                    ? language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...'
                    : isEditMode
                    ? language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes'
                    : language === 'hi' ? 'सामग्री जोड़ें' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USAGE MODAL */}
      {usageModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setUsageModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-700">
                <ArrowDownLeft className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'hi' ? 'खपत दर्ज करें' : 'Record Material Usage'}
                </h3>
              </div>
              <button
                onClick={() => setUsageModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
              <div className="font-bold text-slate-800 text-sm">{selectedMaterial.name}</div>
              <div>
                {language === 'hi' ? 'वर्तमान स्टॉक' : 'Available Stock'}:{' '}
                <strong className="text-amber-800">
                  {selectedMaterial.currentStock} {selectedMaterial.stockUnit}
                </strong>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleUsageSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? `खपत मात्रा (${selectedMaterial.stockUnit}) *` : `Quantity Used (${selectedMaterial.stockUnit}) *`}
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={movementData.quantity}
                  onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('date')} *
                </label>
                <input
                  type="date"
                  required
                  value={movementData.date}
                  onChange={(e) => setMovementData({ ...movementData, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'खपत का कारण / काम' : 'Purpose / Work'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ground floor slab casting..."
                  value={movementData.reason}
                  onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUsageModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {submitting
                    ? language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...'
                    : language === 'hi' ? 'खपत घटाएं' : 'Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {historyModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setHistoryModalOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {selectedMaterial.name} - {language === 'hi' ? 'आवक व खपत इतिहास' : 'Movement History'}
              </h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">{t('date')}</th>
                    <th className="px-3 py-2">{language === 'hi' ? 'प्रकार' : 'Type'}</th>
                    <th className="px-3 py-2 text-right">{language === 'hi' ? 'मात्रा' : 'Qty'}</th>
                    <th className="px-3 py-2">{language === 'hi' ? 'कारण' : 'Reason'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movementHistory.length > 0 ? (
                    movementHistory.map((m) => (
                      <tr key={m._id}>
                        <td className="px-3 py-2 text-slate-500">{formatDate(m.date)}</td>
                        <td className="px-3 py-2 font-semibold">
                          {m.movementType === 'purchase_received' ? (
                            <span className="text-emerald-700">{language === 'hi' ? 'आवक (Received)' : 'Inward'}</span>
                          ) : (
                            <span className="text-rose-700">{language === 'hi' ? 'खपत (Usage)' : 'Outward'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {m.quantity} {m.unit}
                        </td>
                        <td className="px-3 py-2 text-slate-600 truncate max-w-xs">{m.reason || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-3 py-4 text-center text-slate-400">
                        {language === 'hi' ? 'कोई इतिहास उपलब्ध नहीं' : 'No movements recorded yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= DIRECT RECORD MATERIAL ARRIVAL MODAL ================= */}
      {recordArrivalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setRecordArrivalModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-800">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {language === 'hi' ? 'सामान आवक दर्ज करें' : 'Record Material Inward'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'hi'
                      ? 'कब, कौन सा, कितना आया (बैग / क्विंटल) और कुल कितने का हुआ'
                      : 'Record inward delivery, rate per bag/quintal, and total cost'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRecordArrivalModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            {/* Quick Material Presets */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {language === 'hi' ? '⚡ त्वरित चयन (Quick Presets)' : '⚡ Quick Presets'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'UltraTech Cement (सीमेंट)', category: 'Cement', unit: 'bag', rate: 380 },
                  { name: 'Ambuja Cement (सीमेंट)', category: 'Cement', unit: 'bag', rate: 375 },
                  { name: 'TMT Sariya 12mm (सरिया)', category: 'Steel', unit: 'quintal', rate: 6500 },
                  { name: 'TMT Sariya 10mm (सरिया)', category: 'Steel', unit: 'quintal', rate: 6550 },
                  { name: 'TMT Sariya 16mm (सरिया)', category: 'Steel', unit: 'quintal', rate: 6450 },
                  { name: 'River Sand / Reti (रेत)', category: 'Aggregates', unit: 'cft', rate: 45 },
                  { name: 'Crushed Stone / Gitti (रोड़ी)', category: 'Aggregates', unit: 'cft', rate: 38 },
                  { name: 'Red Bricks 1st Class (लाल ईंट)', category: 'Bricks', unit: 'piece', rate: 9 },
                  { name: 'Stone Dust / Crusher (डस्ट)', category: 'Aggregates', unit: 'cft', rate: 34 },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setArrivalFormData((prev) => ({
                        ...prev,
                        materialName: item.name,
                        category: item.category,
                        unit: item.unit,
                        ratePerUnit: item.rate,
                      }));
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 transition"
                  >
                    + {item.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleArrivalSubmit} className="mt-4 space-y-3.5">
              {/* Material Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'सामग्री का नाम (Material) *' : 'Material Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UltraTech Cement / TMT 12mm Sariya"
                    value={arrivalFormData.materialName}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, materialName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'श्रेणी (Category) *' : 'Category *'}
                  </label>
                  <select
                    value={arrivalFormData.category}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="Cement">Cement (सीमेंट)</option>
                    <option value="Steel">Steel / TMT (सरिया)</option>
                    <option value="Aggregates">Sand & Aggregates (रेत, रोड़ी, डस्ट)</option>
                    <option value="Bricks">Bricks & Blocks (ईंट व ब्लॉक)</option>
                    <option value="Electrical">Electrical (बिजली सामग्री)</option>
                    <option value="Plumbing">Plumbing (नल व पाइप)</option>
                    <option value="Paint">Paint & Putty (पेंट व पुट्टी)</option>
                    <option value="Wood">Wood & Shuttering (लकड़ी व शटरिंग)</option>
                    <option value="Other">Other (अन्य सामग्री)</option>
                  </select>
                </div>
              </div>

              {/* Unit, Quantity & Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                {/* Unit */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'hi' ? 'इकाई (Unit) *' : 'Unit *'}
                  </label>
                  <select
                    value={arrivalFormData.unit}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, unit: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                  >
                    <option value="bag">🛍️ bag (बैग / बोरी - सीमेंट)</option>
                    <option value="quintal">⚖️ quintal (क्विंटल - सरिया/लोहा)</option>
                    <option value="ton">🏗️ ton (टन)</option>
                    <option value="kg">⚖️ kg (किलो)</option>
                    <option value="brass">🚛 brass (ब्रास - रोड़ी/रेत)</option>
                    <option value="cft">📐 cft (घन फीट - रेत/बजरी)</option>
                    <option value="piece">🧱 piece (नग / ईंट)</option>
                    <option value="trip">🚚 trip (गाड़ी / ट्रिप)</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'hi'
                      ? arrivalFormData.unit === 'bag'
                        ? 'कुल कितने बैग आये? *'
                        : arrivalFormData.unit === 'quintal'
                        ? 'कुल कितने क्विंटल आये? *'
                        : `कुल कितना आया (${arrivalFormData.unit}) *`
                      : `Quantity Received (${arrivalFormData.unit}) *`}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="e.g. 50"
                    value={arrivalFormData.quantity}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, quantity: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'hi'
                      ? arrivalFormData.unit === 'bag'
                        ? 'एक बैग का भाव (₹) *'
                        : arrivalFormData.unit === 'quintal'
                        ? 'एक क्विंटल का भाव (₹) *'
                        : arrivalFormData.unit === 'ton'
                        ? 'एक टन का भाव (₹) *'
                        : `प्रति ${arrivalFormData.unit} भाव (₹) *`
                      : `Rate per ${arrivalFormData.unit} (₹) *`}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="e.g. 380"
                    value={arrivalFormData.ratePerUnit}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, ratePerUnit: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Dynamic Auto-Calculation Card */}
              {arrivalFormData.quantity && arrivalFormData.ratePerUnit && (
                <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-500/10 via-emerald-100/50 to-teal-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-700 space-y-0.5">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-emerald-700" />
                      <span>{language === 'hi' ? 'गणना (Total Calculation):' : 'Calculation:'}</span>
                    </span>
                    <div className="text-xs font-semibold text-slate-600">
                      {arrivalFormData.quantity} {arrivalFormData.unit} × {formatINR(arrivalFormData.ratePerUnit)} /{' '}
                      {arrivalFormData.unit}
                      {arrivalFormData.unit === 'ton' && (
                        <span className="text-[11px] text-slate-500 ml-1">
                          (= {(Number(arrivalFormData.quantity) * 10).toFixed(1)} क्विंटल)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                      {language === 'hi' ? 'कुल कितने का हुआ (Total Cost)' : 'Total Cost'}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-950">
                      {formatINR(Number(arrivalFormData.quantity || 0) * Number(arrivalFormData.ratePerUnit || 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment / Funding Source Section (इसके पैसे किसपे गए?) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <HandCoins className="h-4 w-4 text-amber-600" />
                    <span>{language === 'hi' ? 'इसके पैसे किसपे गए / कहाँ से गए? *' : 'Payment / Funding Source *'}</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    {language === 'hi'
                      ? 'तय करें कि यह सीधा कंपनी खाते से खर्च हुआ है या ठेकेदार के पुराने दिए एडवांस में से कटा है।'
                      : 'Choose whether this is direct company cash/bank outflow or adjusted from contractor advance.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Direct Company Outflow */}
                    <button
                      type="button"
                      onClick={() =>
                        setArrivalFormData({
                          ...arrivalFormData,
                          paymentSourceType: 'direct_account',
                          contractor: '',
                        })
                      }
                      className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition ${
                        arrivalFormData.paymentSourceType === 'direct_account'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${arrivalFormData.paymentSourceType === 'direct_account' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {language === 'hi' ? 'सीधा भुगतान (कंपनी खाता)' : 'Direct Company Payment'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {language === 'hi' ? 'कैश या बैंक खाते से नया खर्च' : 'New expense from cash/bank'}
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Deduct from Contractor Advance */}
                    <button
                      type="button"
                      onClick={() =>
                        setArrivalFormData({
                          ...arrivalFormData,
                          paymentSourceType: 'contractor_advance',
                        })
                      }
                      className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition ${
                        arrivalFormData.paymentSourceType === 'contractor_advance'
                          ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${arrivalFormData.paymentSourceType === 'contractor_advance' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <HandCoins className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {language === 'hi' ? 'ठेकेदार के पुराने एडवांस में से कटा' : 'Deduct from Contractor Advance'}
                        </div>
                        <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                          {language === 'hi' ? 'कुल बजट/बैंक से दोबारा नहीं कटेगा' : 'No double deduction from accounts'}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* WHEN OPTION 2 (CONTRACTOR ADVANCE) IS SELECTED */}
                {arrivalFormData.paymentSourceType === 'contractor_advance' && (
                  <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 p-3.5 space-y-3 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-950 mb-1">
                          {language === 'hi' ? 'ठेकेदार / व्यक्ति चुनें *' : 'Select Contractor *'}
                        </label>
                        <select
                          required
                          value={arrivalFormData.contractor}
                          onChange={(e) => handleContractorChange(e.target.value)}
                          className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-purple-600 shadow-sm"
                        >
                          <option value="">{language === 'hi' ? '-- ठेकेदार चुनें --' : '-- Select Contractor --'}</option>
                          {contacts.map((c) => {
                            const advBalance = contractorAdvanceMap[c._id] || 0;
                            return (
                              <option key={c._id} value={c._id}>
                                {c.name} {c.role ? `(${c.role})` : ''} — {language === 'hi' ? 'कुल एडवांस:' : 'Adv:'} {formatINR(advBalance)}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                          <HandCoins className="h-3.5 w-3.5 text-purple-600" />
                          <span>{language === 'hi' ? 'ठेकेदार का पिछला भुगतान चुनें' : 'Linked Past Payment'}</span>
                        </label>
                        <select
                          value={arrivalFormData.linkedAdvance || ''}
                          onChange={(e) =>
                            setArrivalFormData({ ...arrivalFormData, linkedAdvance: e.target.value })
                          }
                          disabled={!arrivalFormData.contractor}
                          className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-purple-600 shadow-sm disabled:opacity-50"
                        >
                          <option value="">
                            {language === 'hi'
                              ? '🎯 सबसे पुराना खुला एडवांस (Auto Oldest)'
                              : '🎯 Auto Oldest Unsettled Advance'}
                          </option>
                          {contractorPayments.map((p) => {
                            const dateStr = p.date
                              ? new Date(p.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '';
                            const typeLabel =
                              p.type === 'advance' || p.isAdvance
                                ? (language === 'hi' ? 'एडवांस' : 'Advance')
                                : (language === 'hi' ? 'पेमेंट' : 'Payment');
                            const accName = p.account?.name || (language === 'hi' ? 'खाता' : 'Account');
                            const unsettled =
                              p.advanceDetails?.unsettledAmount !== undefined
                                ? p.advanceDetails.unsettledAmount
                                : p.amount;
                            const desc = p.description ? ` — "${p.description}"` : '';
                            return (
                              <option key={p._id} value={p._id}>
                                📅 {dateStr} — ₹{Number(p.amount).toLocaleString('en-IN')} ({typeLabel} via {accName}) [शेष: ₹{Number(unsettled).toLocaleString('en-IN')}]{desc}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Advance Balance Card and Reassurance */}
                    {arrivalFormData.contractor && (
                      (() => {
                        const chosenTxn = arrivalFormData.linkedAdvance
                          ? contractorPayments.find((p) => p._id === arrivalFormData.linkedAdvance)
                          : null;
                        const availableAdvance = chosenTxn
                          ? (chosenTxn.advanceDetails?.unsettledAmount !== undefined
                              ? chosenTxn.advanceDetails.unsettledAmount
                              : chosenTxn.amount)
                          : (contractorAdvanceMap[arrivalFormData.contractor] || 0);

                        const currentMaterialCost =
                          arrivalFormData.quantity && arrivalFormData.ratePerUnit
                            ? Number(arrivalFormData.quantity) * Number(arrivalFormData.ratePerUnit)
                            : 0;

                        const remainingAfter = availableAdvance - currentMaterialCost;

                        return (
                          <div className="rounded-xl border border-purple-200 bg-white p-3 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">
                                {chosenTxn
                                  ? (language === 'hi' ? 'चुने गए भुगतान का उपलब्ध बैलेंस:' : 'Selected Payment Available:')
                                  : (language === 'hi' ? 'ठेकेदार के पास उपलब्ध कुल एडवांस:' : 'Contractor Open Advance:')}
                              </span>
                              <span className="font-black text-purple-900 text-sm">
                                {formatINR(availableAdvance)}
                                {chosenTxn?.account?.name && (
                                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                                    ({chosenTxn.account.name})
                                  </span>
                                )}
                              </span>
                            </div>

                            {currentMaterialCost > 0 && (
                              <>
                                <div className="flex items-center justify-between text-rose-700">
                                  <span>{language === 'hi' ? 'इस सामान का खर्च (कटने वाली रकम):' : 'Material Amount to Deduct:'}</span>
                                  <span className="font-bold">
                                    - {formatINR(currentMaterialCost)}
                                  </span>
                                </div>
                                <div className="pt-1 border-t border-purple-100 flex items-center justify-between">
                                  <span className="font-bold text-slate-800">
                                    {language === 'hi' ? 'सामान कटने के बाद बाकी एडवांस:' : 'Remaining Advance After Deduct:'}
                                  </span>
                                  <span className={`font-black text-sm ${
                                    remainingAfter < 0 ? 'text-rose-600' : 'text-emerald-700'
                                  }`}>
                                    {formatINR(remainingAfter)}
                                  </span>
                                </div>
                              </>
                            )}

                            <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200 text-[11px] text-emerald-900 font-semibold flex items-start gap-1.5 mt-1">
                              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>
                                {language === 'hi'
                                  ? 'सुरक्षित हिसाब: यह राशि आपके बैंक या कैश बैलेंस से दोबारा नहीं कटेगी। यह ठेकेदार को पहले दिए गए एडवांस में से ही समायोजित होगी।'
                                  : 'Protected Funds: This amount is not deducted from company accounts again. It only settles the contractor’s existing advance.'}
                              </span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {/* WHEN OPTION 1 (DIRECT ACCOUNT) IS SELECTED */}
                {arrivalFormData.paymentSourceType === 'direct_account' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'hi' ? 'भुगतान खाता (Payment Account) *' : 'Payment Account *'}
                      </label>
                      <select
                        required
                        value={arrivalFormData.account}
                        onChange={(e) =>
                          setArrivalFormData({ ...arrivalFormData, account: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                      >
                        {accounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name} ({a.type}) - शेष: {formatINR(a.currentBalance || 0)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'hi' ? 'सप्लायर / वेंडर (वैकल्पिक)' : 'Supplier / Vendor'}
                      </label>
                      <select
                        value={arrivalFormData.supplier}
                        onChange={(e) =>
                          setArrivalFormData({ ...arrivalFormData, supplier: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                      >
                        <option value="">{language === 'hi' ? '-- सप्लायर चुनें (या नकद / सीधा) --' : '-- Select Supplier --'}</option>
                        {contacts.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} {c.companyName ? `(${c.companyName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'भुगतान माध्यम (Method)' : 'Payment Method'}
                  </label>
                  <select
                    value={arrivalFormData.paymentMethod}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, paymentMethod: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="cash">CASH (नकद)</option>
                    <option value="upi">UPI (फोनपे / जीपे / पेटीएम)</option>
                    <option value="bank_transfer">NEFT / RTGS / नेटबैंकिंग</option>
                    <option value="cheque">Cheque (चेक)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'आवक तारीख (Date) *' : 'Delivery Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={arrivalFormData.date}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Challan & Vehicle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'चालान / बिल नंबर' : 'Challan / Bill No.'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CH-2026-981"
                    value={arrivalFormData.challanNumber}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, challanNumber: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'गाड़ी नंबर (Vehicle No.)' : 'Vehicle No.'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RJ 14 GA 5432"
                    value={arrivalFormData.vehicleNumber}
                    onChange={(e) =>
                      setArrivalFormData({ ...arrivalFormData, vehicleNumber: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none uppercase font-mono"
                  />
                </div>
              </div>

              {/* Bill / Receipt Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'बिल / चालान / रसीद की फोटो संलग्न करें' : 'Attach Bill / Receipt Photo'}
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition">
                    <Upload className="h-4 w-4 text-slate-500" />
                    <span>{language === 'hi' ? 'फ़ाइल चुनें (Photo / PDF)' : 'Browse File'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setArrivalCapturedFiles([e.target.files[0]]);
                        }
                      }}
                    />
                  </label>

                  {arrivalCapturedFiles.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                      <PackageCheck className="h-4 w-4" />
                      <span className="font-semibold truncate max-w-xs">{arrivalCapturedFiles[0].name}</span>
                      <button
                        type="button"
                        onClick={() => setArrivalCapturedFiles([])}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'विवरण / टिप्पणी (Notes)' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'hi' ? 'e.g. ड्राइवर का नाम, साइट लोकेशन या अन्य टिप्पणी...' : 'Any remarks...'}
                  value={arrivalFormData.notes}
                  onChange={(e) =>
                    setArrivalFormData({ ...arrivalFormData, notes: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordArrivalModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {submitting
                    ? language === 'hi' ? 'दर्ज कर रहे हैं...' : 'Recording...'
                    : language === 'hi' ? 'सामान आवक दर्ज करें' : 'Record Arrival'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RECEIPT / CHALLAN PHOTO PREVIEW MODAL ================= */}
      {selectedReceiptDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedReceiptDoc(null)}
          />
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl z-10 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedReceiptDoc.title || selectedReceiptDoc.originalFileName || (language === 'hi' ? 'चालान / रसीद' : 'Document Proof')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceiptDoc(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 flex-1 overflow-auto flex items-center justify-center rounded-2xl bg-slate-50 p-2 border border-slate-100 min-h-[250px]">
              {selectedReceiptDoc.mimeType?.startsWith('image/') ||
              selectedReceiptDoc.originalFileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                <img
                  src={api.getDocumentFileUrl(selectedReceiptDoc._id)}
                  alt="Receipt Preview"
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm"
                />
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <Receipt className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                  <div className="font-semibold text-sm">{selectedReceiptDoc.originalFileName}</div>
                  <div className="text-xs text-slate-400 mt-1">{selectedReceiptDoc.mimeType}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {selectedReceiptDoc.fileSize ? `${(selectedReceiptDoc.fileSize / 1024).toFixed(1)} KB` : ''}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={api.getDocumentFileUrl(selectedReceiptDoc._id)}
                  download={selectedReceiptDoc.originalFileName}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  {language === 'hi' ? 'डाउनलोड करें' : 'Download File'}
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptDoc(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
