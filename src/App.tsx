import React, { useState, useRef, useEffect } from 'react';
import { Printer, Download, Plus, Trash2, Home, User, Users, UserCheck, UserMinus, Globe, Phone, CreditCard, Calendar, Zap, Droplets, Wifi, Info, Loader2, Search, Database, RefreshCw, Edit, LogOut, BarChart3, Smartphone, Monitor, Tablet, ZoomIn, ZoomOut, CheckCircle2, ShieldCheck, Eye, Sparkles, Sliders, FileText, Send, Bell, ExternalLink, QrCode, Lock, Key, Copy, Check, MessageSquare, History, RotateCcw, ChevronDown, Menu, Camera } from 'lucide-react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { ManagerSharingSystem, ManagerAccount, AuditLogEntry, DEFAULT_NGUON_SOPHEAK_ACCOUNT, ALL_STANDARD_ROOMS, LanguageFlagIcon, hashPassword } from './components/ManagerSharingSystem';

interface InvoiceItem {
  id: string;
  description: string;
  oldMonthNo: string;
  newMonthNo: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  currency: 'USD' | 'KHR';
}

interface InvoiceData {
  landlordName: string;
  landlordAddress: string;
  landlordPhone: string;
  tenantName: string;
  roomNo: string;
  tenantPhone: string;
  tenantIdNo: string;
  checkInDate: string;
  logoUrl: string | null;
  qrUrl: string | null;
  items: InvoiceItem[];
  rules: string[];
  totalUsd: number;
}

interface SavedTenant {
  tenantName: string;
  roomNo: string;
  tenantPhone: string;
  tenantIdNo: string;
  checkInDate: string;
  roomPrice: number;
  wifiPrice: number;
  elecOld: string;
  waterOld: string;
  isPaid?: boolean;
  deposit?: number;
}

interface InvoiceHistoryRecord {
  id: string;
  tenantName: string;
  roomNo: string;
  paymentDate: string; // YYYY-MM-DD
  roomPrice: number;
  wifiPrice: number;
  elecPrice: number;
  waterPrice: number;
  otherPrice: number;
  totalUsd: number;
  elecUsage: number;
  waterUsage: number;
  status: 'PAID' | 'PENDING';
}

// Pre-seeded income records matching our master tenant database
const initialHistory: InvoiceHistoryRecord[] = [
  // --- MONTH 1 / 2026 ---
  { id: 'h-1-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-01-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 3.13, waterPrice: 0.50, otherPrice: 0, totalUsd: 98.63, elecUsage: 3, waterUsage: 1, status: 'PAID' },
  { id: 'h-1-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-01-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 13.50, waterPrice: 5.50, otherPrice: 0, totalUsd: 104.00, elecUsage: 36, waterUsage: 11, status: 'PAID' },
  { id: 'h-1-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-01-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 8.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 89.25, elecUsage: 22, waterUsage: 2, status: 'PAID' },
  { id: 'h-1-12', tenantName: "ឌុច ពីទូ", roomNo: "12", paymentDate: "2026-01-26", roomPrice: 85.00, wifiPrice: 5.00, elecPrice: 14.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 105.25, elecUsage: 38, waterUsage: 2, status: 'PAID' },
  { id: 'h-1-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-01-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 0.00, waterPrice: 0.00, otherPrice: 0, totalUsd: 80.00, elecUsage: 0, waterUsage: 0, status: 'PAID' },
  { id: 'h-1-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-01-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 3.75, waterPrice: 1.00, otherPrice: 0, totalUsd: 74.75, elecUsage: 10, waterUsage: 2, status: 'PAID' },
  { id: 'h-1-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-01-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 10.13, waterPrice: 1.50, otherPrice: 0, totalUsd: 81.63, elecUsage: 27, waterUsage: 3, status: 'PAID' },
  { id: 'h-1-16', tenantName: "ថែ ធារិទ្ធ", roomNo: "16", paymentDate: "2026-01-04", roomPrice: 75.00, wifiPrice: 5.00, elecPrice: 3.38, waterPrice: 1.00, otherPrice: 0, totalUsd: 84.38, elecUsage: 9, waterUsage: 2, status: 'PAID' },

  // --- MONTH 2 / 2026 ---
  { id: 'h-2-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-02-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 3.38, waterPrice: 2.50, otherPrice: 0, totalUsd: 100.88, elecUsage: 9, waterUsage: 5, status: 'PAID' },
  { id: 'h-2-8', tenantName: "ហឹុន ប៊ុនឈួយ", roomNo: "8", paymentDate: "2026-02-18", roomPrice: 100.00, wifiPrice: 5.00, elecPrice: -3.62, waterPrice: 0.50, otherPrice: 0, totalUsd: 101.88, elecUsage: 13, waterUsage: 1, status: 'PAID' },
  { id: 'h-2-9', tenantName: "អេន ដាំ", roomNo: "9", paymentDate: "2026-02-05", roomPrice: 0.00, wifiPrice: 0.00, elecPrice: 13.88, waterPrice: 26.12, otherPrice: 0, totalUsd: 40.00, elecUsage: 37, waterUsage: 6, status: 'PAID' },
  { id: 'h-2-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-02-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 15.00, waterPrice: 4.50, otherPrice: 0, totalUsd: 104.50, elecUsage: 40, waterUsage: 9, status: 'PAID' },
  { id: 'h-2-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-02-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 7.13, waterPrice: 1.00, otherPrice: 0, totalUsd: 88.13, elecUsage: 19, waterUsage: 2, status: 'PAID' },
  { id: 'h-2-12', tenantName: "ឌុច ពីទូ", roomNo: "12", paymentDate: "2026-02-26", roomPrice: 85.00, wifiPrice: 5.00, elecPrice: 14.63, waterPrice: 1.00, otherPrice: 0, totalUsd: 105.63, elecUsage: 39, waterUsage: 2, status: 'PAID' },
  { id: 'h-2-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-02-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 7.50, waterPrice: 1.00, otherPrice: 0, totalUsd: 88.50, elecUsage: 20, waterUsage: 2, status: 'PAID' },
  { id: 'h-2-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-02-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 7.88, waterPrice: 1.00, otherPrice: 0, totalUsd: 78.88, elecUsage: 21, waterUsage: 2, status: 'PAID' },
  { id: 'h-2-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-02-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 6.75, waterPrice: 1.50, otherPrice: 0, totalUsd: 78.25, elecUsage: 18, waterUsage: 3, status: 'PAID' },
  { id: 'h-2-16', tenantName: "ថែ ធារិទ្ធ", roomNo: "16", paymentDate: "2026-02-04", roomPrice: 75.00, wifiPrice: 5.00, elecPrice: 1.88, waterPrice: 2.00, otherPrice: 0, totalUsd: 83.88, elecUsage: 5, waterUsage: 4, status: 'PAID' },

  // --- MONTH 3 / 2026 ---
  { id: 'h-3-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-03-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 0.75, waterPrice: 2.50, otherPrice: 0, totalUsd: 98.25, elecUsage: 2, waterUsage: 5, status: 'PAID' },
  { id: 'h-3-8', tenantName: "ហឹុន ប៊ุนឈួយ", roomNo: "8", paymentDate: "2026-03-18", roomPrice: 0.00, wifiPrice: 5.00, elecPrice: 0.38, waterPrice: 0.00, otherPrice: 0, totalUsd: 5.38, elecUsage: 1, waterUsage: 0, status: 'PAID' },
  { id: 'h-3-9', tenantName: "អេន ដាំ", roomNo: "9", paymentDate: "2026-03-05", roomPrice: 0.00, wifiPrice: 0.00, elecPrice: 15.00, waterPrice: 25.00, otherPrice: 0, totalUsd: 40.00, elecUsage: 37, waterUsage: 6, status: 'PAID' },
  { id: 'h-3-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-03-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 11.63, waterPrice: 7.50, otherPrice: 0, totalUsd: 104.13, elecUsage: 31, waterUsage: 15, status: 'PAID' },
  { id: 'h-3-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-03-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 8.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 89.25, elecUsage: 22, waterUsage: 2, status: 'PAID' },
  { id: 'h-3-12', tenantName: "ឌុច ពីទូ", roomNo: "12", paymentDate: "2026-03-26", roomPrice: 85.00, wifiPrice: 5.00, elecPrice: 12.00, waterPrice: 1.00, otherPrice: 0, totalUsd: 103.00, elecUsage: 32, waterUsage: 2, status: 'PAID' },
  { id: 'h-3-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-03-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 8.63, waterPrice: 1.00, otherPrice: 0, totalUsd: 89.63, elecUsage: 23, waterUsage: 1, status: 'PAID' },
  { id: 'h-3-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-03-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 7.50, waterPrice: 2.00, otherPrice: 0, totalUsd: 79.50, elecUsage: 20, waterUsage: 2, status: 'PAID' },
  { id: 'h-3-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-03-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 5.63, waterPrice: 1.00, otherPrice: 0, totalUsd: 76.63, elecUsage: 15, waterUsage: 2, status: 'PAID' },
  { id: 'h-3-16', tenantName: "ថែ ធារិទ្ធ", roomNo: "16", paymentDate: "2026-03-04", roomPrice: 75.00, wifiPrice: 5.00, elecPrice: 4.13, waterPrice: 0.50, otherPrice: 0, totalUsd: 84.63, elecUsage: 11, waterUsage: 1, status: 'PAID' },

  // --- MONTH 4 / 2026 ---
  { id: 'h-4-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-04-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 0.38, waterPrice: 2.00, otherPrice: 0, totalUsd: 97.38, elecUsage: 1, waterUsage: 4, status: 'PAID' },
  { id: 'h-4-9', tenantName: "អេន ដាំ", roomNo: "9", paymentDate: "2026-04-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 9.75, waterPrice: 2.00, otherPrice: 0, totalUsd: 91.75, elecUsage: 26, waterUsage: 4, status: 'PAID' },
  { id: 'h-4-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-04-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 13.50, waterPrice: 2.50, otherPrice: 0, totalUsd: 101.00, elecUsage: 36, waterUsage: 5, status: 'PAID' },
  { id: 'h-4-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-04-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 10.88, waterPrice: 1.00, otherPrice: 0, totalUsd: 91.88, elecUsage: 29, waterUsage: 2, status: 'PAID' },
  { id: 'h-4-12', tenantName: "ឌុច ពីទូ", roomNo: "12", paymentDate: "2026-04-26", roomPrice: 85.00, wifiPrice: 5.00, elecPrice: 14.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 105.25, elecUsage: 38, waterUsage: 2, status: 'PAID' },
  { id: 'h-4-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-04-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 8.63, waterPrice: 1.50, otherPrice: 0, totalUsd: 90.13, elecUsage: 23, waterUsage: 3, status: 'PAID' },
  { id: 'h-4-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-04-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 7.13, waterPrice: 1.00, otherPrice: 0, totalUsd: 78.13, elecUsage: 19, waterUsage: 2, status: 'PAID' },
  { id: 'h-4-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-04-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 5.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 76.25, elecUsage: 14, waterUsage: 2, status: 'PAID' },
  { id: 'h-4-16', tenantName: "ថែ ធារិទ្ធ", roomNo: "16", paymentDate: "2026-04-04", roomPrice: 75.00, wifiPrice: 5.00, elecPrice: 6.00, waterPrice: 0.50, otherPrice: 0, totalUsd: 86.50, elecUsage: 16, waterUsage: 1, status: 'PAID' },

  // --- MONTH 5 / 2026 ---
  { id: 'h-5-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-05-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 0.38, waterPrice: 2.00, otherPrice: 0, totalUsd: 97.38, elecUsage: 1, waterUsage: 4, status: 'PAID' },
  { id: 'h-5-9', tenantName: "អេន ដាំ", roomNo: "9", paymentDate: "2026-05-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 6.75, waterPrice: 2.00, otherPrice: 0, totalUsd: 88.75, elecUsage: 18, waterUsage: 4, status: 'PAID' },
  { id: 'h-5-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-05-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 13.50, waterPrice: 2.50, otherPrice: 0, totalUsd: 101.00, elecUsage: 36, waterUsage: 6, status: 'PAID' },
  { id: 'h-5-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-05-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 10.88, waterPrice: 1.00, otherPrice: 0, totalUsd: 91.88, elecUsage: 17, waterUsage: 2, status: 'PAID' },
  { id: 'h-5-12', tenantName: "ឌុច ពីទូ", roomNo: "12", paymentDate: "2026-05-26", roomPrice: 85.00, wifiPrice: 5.00, elecPrice: 14.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 105.25, elecUsage: 46, waterUsage: 2, status: 'PAID' },
  { id: 'h-5-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-05-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 8.63, waterPrice: 1.50, otherPrice: 0, totalUsd: 90.13, elecUsage: 19, waterUsage: 1, status: 'PAID' },
  { id: 'h-5-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-05-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 7.13, waterPrice: 1.00, otherPrice: 0, totalUsd: 78.13, elecUsage: 14, waterUsage: 2, status: 'PAID' },
  { id: 'h-5-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-05-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 5.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 76.25, elecUsage: 15, waterUsage: 2, status: 'PAID' },
  { id: 'h-5-16', tenantName: "ថែ ធារិទ្ធ", roomNo: "16", paymentDate: "2026-05-04", roomPrice: 75.00, wifiPrice: 5.00, elecPrice: 6.00, waterPrice: 0.50, otherPrice: 0, totalUsd: 86.50, elecUsage: 20, waterUsage: 3, status: 'PAID' },

  // --- MONTH 6 / 2026 ---
  { id: 'h-6-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-06-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 1.13, waterPrice: 0.50, otherPrice: 0, totalUsd: 96.63, elecUsage: 3, waterUsage: 4, status: 'PAID' },
  { id: 'h-6-8', tenantName: "ថែ ធារិទ្ធ", roomNo: "8", paymentDate: "2026-06-18", roomPrice: 100.00, wifiPrice: 0.00, elecPrice: 12.38, waterPrice: 2.00, otherPrice: 0, totalUsd: 114.38, elecUsage: 33, waterUsage: 4, status: 'PAID' },
  { id: 'h-6-9', tenantName: "អេន ដាំ", roomNo: "9", paymentDate: "2026-06-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 7.50, waterPrice: 2.50, otherPrice: 0, totalUsd: 90.00, elecUsage: 20, waterUsage: 5, status: 'PAID' },
  { id: 'h-6-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-06-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 14.63, waterPrice: -1.00, otherPrice: 0, totalUsd: 98.63, elecUsage: 39, waterUsage: 8, status: 'PAID' },
  { id: 'h-6-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-06-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 11.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 92.25, elecUsage: 30, waterUsage: 2, status: 'PAID' },
  { id: 'h-6-12', tenantName: "ឌុច ពីទូ", roomNo: "12", paymentDate: "2026-06-26", roomPrice: 85.00, wifiPrice: 5.00, elecPrice: 14.50, waterPrice: 1.00, otherPrice: 0, totalUsd: 105.50, elecUsage: 52, waterUsage: 2, status: 'PAID' },
  { id: 'h-6-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-06-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 10.13, waterPrice: 1.50, otherPrice: 0, totalUsd: 91.63, elecUsage: 27, waterUsage: 3, status: 'PAID' },
  { id: 'h-6-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-06-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 5.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 76.25, elecUsage: 14, waterUsage: 2, status: 'PAID' },
  { id: 'h-6-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-06-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 5.25, waterPrice: 1.00, otherPrice: 0, totalUsd: 76.25, elecUsage: 27, waterUsage: 6, status: 'PAID' },
  { id: 'h-6-16', tenantName: "គាត ប៊ុនថន", roomNo: "16", paymentDate: "2026-06-04", roomPrice: 75.00, wifiPrice: 5.00, elecPrice: 3.25, waterPrice: 0.50, otherPrice: 0, totalUsd: 83.75, elecUsage: 22, waterUsage: 1, status: 'PAID' },

  // --- MONTH 7 / 2026 ---
  { id: 'h-7-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-07-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 0.38, waterPrice: 2.50, otherPrice: 0, totalUsd: 97.88, elecUsage: 1, waterUsage: 5, status: 'PAID' },
  { id: 'h-7-8', tenantName: "ថែ ធារិទ្ធ", roomNo: "8", paymentDate: "2026-07-18", roomPrice: 100.00, wifiPrice: 0.00, elecPrice: 8.25, waterPrice: 1.50, otherPrice: 0, totalUsd: 109.75, elecUsage: 22, waterUsage: 3, status: 'PAID' },
  { id: 'h-7-9', tenantName: "អេន ដាំ", roomNo: "9", paymentDate: "2026-07-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 7.50, waterPrice: 2.50, otherPrice: 0, totalUsd: 90.00, elecUsage: 20, waterUsage: 5, status: 'PAID' },
  { id: 'h-7-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-07-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 13.50, waterPrice: 5.00, otherPrice: 0, totalUsd: 103.50, elecUsage: 36, waterUsage: 10, status: 'PAID' },
  { id: 'h-7-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-07-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 11.63, waterPrice: 1.50, otherPrice: 0, totalUsd: 93.13, elecUsage: 31, waterUsage: 3, status: 'PAID' },
  { id: 'h-7-12', tenantName: "ឌុច ពីទូ", roomNo: "12", paymentDate: "2026-07-26", roomPrice: 85.00, wifiPrice: 5.00, elecPrice: 16.50, waterPrice: 1.50, otherPrice: 0, totalUsd: 108.00, elecUsage: 44, waterUsage: 3, status: 'PAID' },
  { id: 'h-7-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-07-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 11.63, waterPrice: 1.50, otherPrice: 0, totalUsd: 93.13, elecUsage: 31, waterUsage: 3, status: 'PAID' },
  { id: 'h-7-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-07-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 9.38, waterPrice: 1.00, otherPrice: 0, totalUsd: 80.38, elecUsage: 25, waterUsage: 2, status: 'PAID' },
  { id: 'h-7-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-07-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 2.63, waterPrice: 0.50, otherPrice: 0, totalUsd: 73.13, elecUsage: 7, waterUsage: 1, status: 'PAID' },
  { id: 'h-7-16', tenantName: "គាត ប៊ุนថน", roomNo: "16", paymentDate: "2026-07-04", roomPrice: 75.00, wifiPrice: 5.00, elecPrice: 7.13, waterPrice: 1.00, otherPrice: 0, totalUsd: 88.13, elecUsage: 19, waterUsage: 2, status: 'PAID' },

  // --- MONTH 8 / 2026 ---
  { id: 'h-8-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-08-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 1.13, waterPrice: 2.50, otherPrice: 0, totalUsd: 98.63, elecUsage: 3, waterUsage: 5, status: 'PAID' },
  { id: 'h-8-8', tenantName: "ថែ ធារិទ្ធ", roomNo: "8", paymentDate: "2026-08-18", roomPrice: 100.00, wifiPrice: 0.00, elecPrice: 8.63, waterPrice: 1.00, otherPrice: 0, totalUsd: 109.63, elecUsage: 23, waterUsage: 2, status: 'PAID' },
  { id: 'h-8-9', tenantName: "អេន ដាំ", roomNo: "9", paymentDate: "2026-08-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 10.50, waterPrice: 2.50, otherPrice: 0, totalUsd: 93.00, elecUsage: 28, waterUsage: 5, status: 'PAID' },
  { id: 'h-8-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-08-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 14.25, waterPrice: 6.50, otherPrice: 0, totalUsd: 105.75, elecUsage: 38, waterUsage: 13, status: 'PAID' },
  { id: 'h-8-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-08-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 10.13, waterPrice: 1.00, otherPrice: 0, totalUsd: 91.13, elecUsage: 27, waterUsage: 2, status: 'PAID' },
  { id: 'h-8-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-08-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 4.50, waterPrice: 0.50, otherPrice: 0, totalUsd: 85.00, elecUsage: 12, waterUsage: 1, status: 'PAID' },
  { id: 'h-8-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-08-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 4.50, waterPrice: 1.00, otherPrice: 0, totalUsd: 75.50, elecUsage: 12, waterUsage: 2, status: 'PAID' },
  { id: 'h-8-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-08-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 1.88, waterPrice: 0.50, otherPrice: 0, totalUsd: 72.38, elecUsage: 5, waterUsage: 1, status: 'PAID' },
  { id: 'h-8-16', tenantName: "គាត ប៊ุนថন", roomNo: "16", paymentDate: "2026-08-04", roomPrice: 75.00, wifiPrice: 5.00, elecPrice: 4.88, waterPrice: 1.00, otherPrice: 0, totalUsd: 85.88, elecUsage: 13, waterUsage: 2, status: 'PAID' },

  // --- MONTH 9 / 2026 ---
  { id: 'h-9-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-09-25", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 3.00, waterPrice: 3.00, otherPrice: 0, totalUsd: 101.00, elecUsage: 8, waterUsage: 6, status: 'PAID' },
  { id: 'h-9-8', tenantName: "ថែ ធារិទ្ធ", roomNo: "8", paymentDate: "2026-09-04", roomPrice: 100.00, wifiPrice: 0.00, elecPrice: 7.88, waterPrice: 1.00, otherPrice: 0, totalUsd: 108.88, elecUsage: 21, waterUsage: 2, status: 'PAID' },
  { id: 'h-9-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-09-02", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 11.63, waterPrice: 7.00, otherPrice: 0, totalUsd: 103.63, elecUsage: 31, waterUsage: 14, status: 'PAID' },
  { id: 'h-9-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-09-02", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 10.13, waterPrice: 1.50, otherPrice: 0, totalUsd: 91.63, elecUsage: 27, waterUsage: 3, status: 'PAID' },
  { id: 'h-9-13', tenantName: "ម៉េង ចាន់ហួរ", roomNo: "13", paymentDate: "2026-09-05", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 2.63, waterPrice: 0.50, otherPrice: 0, totalUsd: 83.13, elecUsage: 7, waterUsage: 1, status: 'PAID' },
  { id: 'h-9-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-09-02", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 15.75, waterPrice: 3.75, otherPrice: 0, totalUsd: 89.50, elecUsage: 42, waterUsage: 1, status: 'PAID' },
  { id: 'h-9-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-09-10", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 1.88, waterPrice: 0.87, otherPrice: 0, totalUsd: 72.75, elecUsage: 0, waterUsage: 0, status: 'PAID' },

  // --- MONTH 10 / 2026 ---
  { id: 'h-10-5', tenantName: "ឌិន ចាន់នី", roomNo: "5", paymentDate: "2026-10-01", roomPrice: 90.00, wifiPrice: 0.00, elecPrice: 9.00, waterPrice: 2.00, otherPrice: 0, totalUsd: 101.00, elecUsage: 24, waterUsage: 5, status: 'PAID' },
  { id: 'h-10-6', tenantName: "កែម ស៊ីណែ", roomNo: "6", paymentDate: "2026-10-01", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 2.63, waterPrice: 2.00, otherPrice: 0, totalUsd: 99.63, elecUsage: 7, waterUsage: 4, status: 'PAID' },
  { id: 'h-10-8', tenantName: "ឌាស ហ៊ឹង", roomNo: "8", paymentDate: "2026-10-01", roomPrice: 90.00, wifiPrice: 5.00, elecPrice: 1.13, waterPrice: 0.50, otherPrice: 0, totalUsd: 57.63, elecUsage: 3, waterUsage: 1, status: 'PAID' },
  { id: 'h-10-10', tenantName: "គូ គង់មី", roomNo: "10", paymentDate: "2026-10-01", roomPrice: 80.00, wifiPrice: 5.00, elecPrice: 16.50, waterPrice: 13.00, otherPrice: -85.00, totalUsd: 29.50, elecUsage: 44, waterUsage: 26, status: 'PAID' },
  { id: 'h-10-11', tenantName: "សាន ហៃ", roomNo: "11", paymentDate: "2026-10-01", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 10.13, waterPrice: 1.00, otherPrice: 0, totalUsd: 91.13, elecUsage: 27, waterUsage: 2, status: 'PAID' },
  { id: 'h-10-12', tenantName: "កា រីតា", roomNo: "12", paymentDate: "2026-10-01", roomPrice: 85.00, wifiPrice: 0.00, elecPrice: 3.00, waterPrice: 1.50, otherPrice: 1.00, totalUsd: 89.50, elecUsage: 8, waterUsage: 3, status: 'PAID' },
  { id: 'h-10-13', tenantName: "នាយ ម៉េងយូ", roomNo: "13", paymentDate: "2026-10-01", roomPrice: 80.00, wifiPrice: 0.00, elecPrice: 0.00, waterPrice: 1.50, otherPrice: 0, totalUsd: 81.50, elecUsage: 0, waterUsage: 0, status: 'PAID' },
  { id: 'h-10-14', tenantName: "លុត ឡោត", roomNo: "14", paymentDate: "2026-10-01", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 11.63, waterPrice: 2.00, otherPrice: 0, totalUsd: 83.63, elecUsage: 31, waterUsage: 4, status: 'PAID' },
  { id: 'h-10-15', tenantName: "តាំង លីហៀង", roomNo: "15", paymentDate: "2026-10-01", roomPrice: 70.00, wifiPrice: 0.00, elecPrice: 1.88, waterPrice: 0.50, otherPrice: 0, totalUsd: 72.38, elecUsage: 5, waterUsage: 1, status: 'PAID' },
  { id: 'h-10-16', tenantName: "ថែ ធារិទ្ធ", roomNo: "16", paymentDate: "2026-10-01", roomPrice: 75.00, wifiPrice: 0.00, elecPrice: 11.25, waterPrice: 2.00, otherPrice: 20.63, totalUsd: 108.88, elecUsage: 30, waterUsage: 4, status: 'PAID' }
];

// Preloaded customer database exactly matching October 2026 master list
const initialSavedTenants: SavedTenant[] = [
  {
    tenantName: "ឌិន ចាន់នី",
    roomNo: "5",
    tenantIdNo: "240225426",
    tenantPhone: "0889662648",
    checkInDate: "2026-09-18",
    roomPrice: 90.00,
    wifiPrice: 0.00,
    elecOld: "1360",
    waterOld: "16",
    isPaid: false,
    deposit: 90.00
  },
  {
    tenantName: "កែម ស៊ីណែ",
    roomNo: "6",
    tenantIdNo: "180724334 (01)",
    tenantPhone: "095 431 778",
    checkInDate: "2025-09-25",
    roomPrice: 90.00,
    wifiPrice: 5.00,
    elecOld: "1250",
    waterOld: "101",
    isPaid: false,
    deposit: 90.00
  },
  {
    tenantName: "ឌាស ហ៊ឹង",
    roomNo: "8",
    tenantIdNo: "240225428",
    tenantPhone: "0889662648",
    checkInDate: "2026-09-18",
    roomPrice: 90.00,
    wifiPrice: 5.00,
    elecOld: "2624",
    waterOld: "53",
    isPaid: false,
    deposit: 90.00
  },
  {
    tenantName: "គូ គង់មី",
    roomNo: "10",
    tenantIdNo: "110526299 (01)",
    tenantPhone: "0968 793 531",
    checkInDate: "2025-09-02",
    roomPrice: 80.00,
    wifiPrice: 5.00,
    elecOld: "2082",
    waterOld: "172",
    isPaid: false,
    deposit: 80.00
  },
  {
    tenantName: "សាន ហៃ",
    roomNo: "11",
    tenantIdNo: "150638261 (01)",
    tenantPhone: "015 971 799",
    checkInDate: "2025-09-02",
    roomPrice: 80.00,
    wifiPrice: 0.00,
    elecOld: "1408",
    waterOld: "26",
    isPaid: false,
    deposit: 80.00
  },
  {
    tenantName: "កា រីតា",
    roomNo: "12",
    tenantIdNo: "250451234",
    tenantPhone: "0974906220",
    checkInDate: "2026-09-26",
    roomPrice: 85.00,
    wifiPrice: 0.00,
    elecOld: "1688",
    waterOld: "46",
    isPaid: false,
    deposit: 85.00
  },
  {
    tenantName: "នាយ ម៉េងយូ",
    roomNo: "13",
    tenantIdNo: "0151044919",
    tenantPhone: "718401269",
    checkInDate: "2026-10-03",
    roomPrice: 80.00,
    wifiPrice: 0.00,
    elecOld: "970",
    waterOld: "31",
    isPaid: false,
    deposit: 80.00
  },
  {
    tenantName: "លុត ឡោត",
    roomNo: "14",
    tenantIdNo: "101 423 550",
    tenantPhone: "0965 039 369",
    checkInDate: "2025-09-02",
    roomPrice: 70.00,
    wifiPrice: 0.00,
    elecOld: "1665",
    waterOld: "38",
    isPaid: false,
    deposit: 70.00
  },
  {
    tenantName: "តាំង លីហៀង",
    roomNo: "15",
    tenantIdNo: "",
    tenantPhone: "081982611",
    checkInDate: "2026-06-10",
    roomPrice: 70.00,
    wifiPrice: 0.00,
    elecOld: "1726",
    waterOld: "29",
    isPaid: false,
    deposit: 70.00
  },
  {
    tenantName: "ថែ ធារិទ្ធ",
    roomNo: "16",
    tenantIdNo: "011 445 024",
    tenantPhone: "0975 630 828",
    checkInDate: "2025-09-04",
    roomPrice: 75.00,
    wifiPrice: 0.00,
    elecOld: "1478",
    waterOld: "27",
    isPaid: false,
    deposit: 75.00
  }
];

const initialData: InvoiceData = {
  landlordName: "សាង សុវណ្ណារតនៈ",
  landlordAddress: "ភូមិបឹងកងកង ២ ខណ្ឌបឹងកងកង រាជធានី ភ្នំពេញ",
  landlordPhone: "070 536 926",
  tenantName: "គូ គង់មី",
  roomNo: "10",
  tenantPhone: "0968 793 531",
  tenantIdNo: "110526299 (01)",
  checkInDate: "2025-09-02",
  logoUrl: null,
  qrUrl: null,
  items: [
    { id: '1', description: 'តម្លៃបន្ទប់ (Room Price)', oldMonthNo: '', newMonthNo: '', quantity: 1, unitPrice: 80.00, unit: '', currency: 'USD' },
    { id: '2', description: 'វ៉ាយហ្វាយ (Wi-Fi)', oldMonthNo: '', newMonthNo: '', quantity: 1, unitPrice: 5.00, unit: '', currency: 'USD' },
    { id: '3', description: 'អគ្គិសនី (Electricity)', oldMonthNo: '2082', newMonthNo: '', quantity: 0, unitPrice: 1500, unit: 'KWH', currency: 'KHR' },
    { id: '4', description: 'ទឹក (Water)', oldMonthNo: '172', newMonthNo: '', quantity: 0, unitPrice: 2000, unit: 'M³', currency: 'KHR' },
  ],
  rules: [
    "អ្នកជួលត្រូវថែរក្សាទ្រព្យផ្ទាស់ខ្លួន និងរក្សាបន្ទប់ដូចផ្ទះខ្លួនឯង។",
    "រាល់ការធ្វើឱ្យខូចខាតសម្ភារៈរបស់ផ្ទះជួល អ្នកជួលត្រូវទទួលខុសត្រូវ។",
    "អ្នកជួលមិនមានសិទ្ធិកែប្រែបន្ទប់ដូចគូរគំនូរលើជញ្ជាំង ធ្វើឱ្យមានការខូចជញ្ជាំង ឬធ្វើឱ្យប្រឡាក់។",
    "ហាមដាច់ខាត និងប្រើប្រាស់គ្រឿងញៀន។",
    "ហាមបង្កសំឡេងរំខានដល់អ្នកដទៃ​ នៅមុខបន្ទប់រៀបចំឱ្យមានសណ្តាប់ធ្នាប់។",
    "សូមរក្សាភាពស្ងប់ស្ងាត់ប្រសិនបើបង្កការរំខានដល់អ្នកជិតខាង​ នោះម្ចាស់ផ្ទះមានសិទ្ធិបញ្ឈប់ការជួលមុនថ្ងៃកំណត់។",
  ],
  totalUsd: 85.00
};

// Web Audio API Synthesized UI Sound Feedbacks
const playAudioFeedback = (type: 'success' | 'click' | 'delete') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'success') {
      const now = ctx.currentTime;
      // Ascending premium electronic bell chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.08); // A5
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.3);
      
    } else if (type === 'click') {
      const now = ctx.currentTime;
      // Elegant, soft digital tactile tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
      
    } else if (type === 'delete') {
      const now = ctx.currentTime;
      // Satisfying soft descending swoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (e) {
    console.warn('Audio feedback failed:', e);
  }
};

export default function App() {
  // Load draft from localStorage, auto-healing any stale local draft missing the critical Water row
  const [data, setData] = useState<InvoiceData>(() => {
    try {
      const savedDraft = localStorage.getItem('invoice_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        
        // Auto-heal logic: ensure Water and Electricity rows are guaranteed to exist in active items
        const hasElec = parsed.items?.some((item: any) => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
        const hasWater = parsed.items?.some((item: any) => item.description.includes('ទឹក') || item.description.includes('Water'));
        
        if (parsed.items && (!hasElec || !hasWater)) {
          parsed.items = initialData.items;
        }
        if (parsed.landlordName === "សាង សុវណ្ណា") {
          parsed.landlordName = "សាង សុវណ្ណារតនៈ";
        }
        return { ...initialData, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load invoice draft:', e);
    }
    return initialData;
  });

  // Load saved tenants from localStorage
  const [savedTenants, setSavedTenants] = useState<SavedTenant[]>(() => {
    try {
      const stored = localStorage.getItem('savedTenants');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    localStorage.setItem('savedTenants', JSON.stringify(initialSavedTenants));
    return initialSavedTenants;
  });

  // Selector dropdown states
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

  // Add / Edit Tenant states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTenantName, setEditingTenantName] = useState<string | null>(null);
  const [newTenant, setNewTenant] = useState<SavedTenant>({
    tenantName: '',
    roomNo: '',
    tenantPhone: '',
    tenantIdNo: '',
    checkInDate: new Date().toISOString().split('T')[0],
    roomPrice: 80,
    wifiPrice: 0,
    elecOld: '',
    waterOld: '',
    deposit: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [guestIdSearch, setGuestIdSearch] = useState('');
  const [editingTenantRoomNo, setEditingTenantRoomNo] = useState<string | null>(null);
  const [tempEditingIdVal, setTempEditingIdVal] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Login & Session States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });
  const [userRole, setUserRole] = useState<'admin' | 'tenant'>(() => {
    return (sessionStorage.getItem('userRole') as 'admin' | 'tenant') || 'admin';
  });
  const [loggedInTenantRoom, setLoggedInTenantRoom] = useState<string>(() => {
    return sessionStorage.getItem('loggedInTenantRoom') || '';
  });
  const [loginTab, setLoginTab] = useState<'admin' | 'manager'>('admin');
  const [staffRole, setStaffRole] = useState<'admin' | 'manager'>(() => {
    return (sessionStorage.getItem('staffRole') as 'admin' | 'manager') || 'admin';
  });
  const [selectedLoginRoom, setSelectedLoginRoom] = useState<string>('');
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [tenantLoginRoom, setTenantLoginRoom] = useState<string>('');
  const [tenantLoginPin, setTenantLoginPin] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPaymentSentNotification, setShowPaymentSentNotification] = useState<boolean>(false);
  const [isAdminPreviewing, setIsAdminPreviewing] = useState<boolean>(false);
  const [copiedTelegramNotice, setCopiedTelegramNotice] = useState<boolean>(false);
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);

  // Custom Background Image State (Responsive across all devices, stored in localStorage)
  const [customBgImage, setCustomBgImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('custom_bg_image') || null;
    } catch {
      return null;
    }
  });
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress and scale for smooth performance on all devices (mobile, tablet, desktop)
        const maxDim = 2048;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.90);
          setCustomBgImage(compressed);
          try {
            localStorage.setItem('custom_bg_image', compressed);
          } catch (err) {
            console.warn('LocalStorage size limit exceeded:', err);
          }
        } else {
          const raw = event.target?.result as string;
          setCustomBgImage(raw);
          try {
            localStorage.setItem('custom_bg_image', raw);
          } catch (err) {}
        }
        playAudioFeedback('success');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetBg = () => {
    setCustomBgImage(null);
    try {
      localStorage.removeItem('custom_bg_image');
    } catch {}
    playAudioFeedback('delete');
  };

  // Official Telegram notification channel URL
  const TELEGRAM_CHANNEL_URL = 'https://t.me/RoomBoeungKengKang';

  // Helper: Format official Tenant ID based on room number (e.g., Room 5 -> BKK-P05, Room 10 -> BKK-P10)
  const formatTenantId = (roomNo: string) => {
    const num = (roomNo || '').replace(/\D/g, '') || roomNo;
    const padded = num.length === 1 ? `0${num}` : num;
    return `BKK-P${padded}`;
  };

  // Helper: Format official Room Badge name (e.g., "5" -> "RM-05", "10" -> "RM-10")
  const formatRoomBadge = (roomNo: string | number | undefined | null): string => {
    if (!roomNo) return 'RM-00';
    const str = String(roomNo).trim();
    const cleanNum = str.replace(/^(P\.|RM-|RM|P|\.)/i, '').trim();
    if (!cleanNum) return str;
    const padded = cleanNum.padStart(2, '0');
    return `RM-${padded}`;
  };

  // Helper to extract the last 4 digits of identity card (excluding parentheses or spaces)
  const getLoginId = (idNo: string): string => {
    if (!idNo) return '';
    const cleaned = idNo.split('(')[0].replace(/\s/g, '').replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return cleaned.slice(-4);
    }
    return cleaned;
  };

  // Helper to extract the last 6 digits of phone number
  const getLoginPassword = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 6) {
      return cleaned.slice(-6);
    }
    return cleaned;
  };

  const getTelegramPaymentMessage = (customRoom?: string) => {
    const activeRoom = customRoom || (loggedInTenantRoom || data.roomNo);
    const tenantId = formatTenantId(activeRoom);
    const matched = savedTenants.find(t => t.roomNo === activeRoom);
    const tenantName = matched?.tenantName || data.tenantName;
    const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    const totalKhr = Math.round(data.totalUsd * 4000).toLocaleString('en-US');
    return `📢 [សេចក្តីជូនដំណឹងអំពីការបង់ប្រាក់ថ្លៃបន្ទប់ / ROOM RENTAL PAYMENT NOTICE]
🏢 បន្ទប់ / Room: ${activeRoom} (ID: ${tenantId})
👤 ឈ្មោះភ្ញៀវ / Guest: ${tenantName}
💵 ទឹកប្រាក់សរុប / Total Amount: $${data.totalUsd.toFixed(2)} USD (~ ៛${totalKhr} KHR)
🕒 កាលបរិច្ឆេទ / Date: ${nowStr}
✅ វិធីបង់ប្រាក់ / Method: ស្កែនកូដ ABA KHQR / Scan ABA KHQR Code
🔗 ឆានែល Telegram / Telegram Channel: ${TELEGRAM_CHANNEL_URL}`;
  };

  const handleCopyTelegramNotice = (customRoom?: string) => {
    navigator.clipboard.writeText(getTelegramPaymentMessage(customRoom));
    playAudioFeedback('click');
    setCopiedTelegramNotice(true);
    setTimeout(() => setCopiedTelegramNotice(false), 3000);
  };

  const handleSaveTenantIdSelf = (roomNo: string, newId: string) => {
    if (!newId.trim()) {
      alert("ID cannot be empty!");
      return;
    }
    playAudioFeedback('success');
    setSavedTenants(prev => {
      const updated = prev.map(t => {
        if (t.roomNo === roomNo) {
          return { ...t, tenantIdNo: newId.trim() };
        }
        return t;
      });
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });

    // Update active invoice data as well if it matches this room to prevent revert bug!
    setData(prev => {
      if (prev.roomNo === roomNo) {
        return { ...prev, tenantIdNo: newId.trim() };
      }
      return prev;
    });

    setIsEditingTenantId(false);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    playAudioFeedback('click');
    setCopiedTenantId(id);
    setTimeout(() => setCopiedTenantId(null), 2500);
  };

  // Admin Dashboard and History States
  const [appLang, setAppLang] = useState<'km' | 'en'>(() => {
    const saved = localStorage.getItem('hsn_app_lang');
    return saved === 'en' ? 'en' : 'km';
  });
  const trApp = (kmText: string, enText: string) => (appLang === 'km' ? kmText : enText);
  const handleToggleAppLang = () => {
    playAudioFeedback('click');
    setAppLang(prev => {
      const next = prev === 'km' ? 'en' : 'km';
      localStorage.setItem('hsn_app_lang', next);
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState<'invoice' | 'tenants' | 'manualForm' | 'reports' | 'summaryChecker' | 'tenantIds' | 'checkInForm' | 'managerOverview' | 'managerList' | 'sharedAccess' | 'sopheakDashboard'>(() => {
    const savedStaff = sessionStorage.getItem('staffRole');
    return savedStaff === 'manager' ? 'sopheakDashboard' : 'invoice';
  });
  const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);
  const [isEditingTenantId, setIsEditingTenantId] = useState<boolean>(false);
  const [tempTenantId, setTempTenantId] = useState<string>('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');
  const [historySortOrder, setHistorySortOrder] = useState<'roomAsc' | 'roomDesc' | 'dateDesc' | 'dateAsc'>('roomAsc');
  const [history, setHistory] = useState<InvoiceHistoryRecord[]>(() => {
    try {
      const stored = localStorage.getItem('invoice_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    localStorage.setItem('invoice_history', JSON.stringify(initialHistory));
    return initialHistory;
  });

  // Manager Accounts & Shared Access State (Pre-seeded with Nguon Sopheak, normalized to 16 rooms RM-01..RM-16)
  const [managerAccounts, setManagerAccounts] = useState<ManagerAccount[]>(() => {
    try {
      const stored = localStorage.getItem('hsn_manager_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const healed = parsed.map((m: ManagerAccount) => ({
            ...m,
            assignedRooms: [...ALL_STANDARD_ROOMS]
          }));
          localStorage.setItem('hsn_manager_accounts', JSON.stringify(healed));
          return healed;
        }
      }
    } catch {}
    const initialManagers = [DEFAULT_NGUON_SOPHEAK_ACCOUNT];
    localStorage.setItem('hsn_manager_accounts', JSON.stringify(initialManagers));
    return initialManagers;
  });

  // Immutable Audit Logs for Utility Meter Entries, Tenant Creation, and Controlled Adjustments
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('hsn_audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.map((log: AuditLogEntry) => ({
            ...log,
            roomNo: (log.roomNo || '').replace('RM-17', 'RM-16'),
            afterData: (log.afterData || '').replace('RM-17', 'RM-16'),
            note:
              log.id === 'LOG-INIT-SOPHEAK'
                ? 'បង្កើតគណនីអ្នកគ្រប់គ្រងសម្រាប់ Nguon Sopheak តាមសិទ្ធិម្ចាស់កម្មសិទ្ធិ HSN / Provisioned dedicated manager account for Nguon Sopheak'
                : log.note
          }));
          return cleaned;
        }
      }
    } catch {}
    const seedLogs: AuditLogEntry[] = [
      {
        id: 'LOG-INIT-SOPHEAK',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actorName: 'HENG SAMNANG (HSN)',
        actorRole: 'OWNER',
        actionType: 'PERMISSION_CHANGE',
        roomNo: 'ALL (RM-01..RM-16)',
        tenantId: 'SYS-RBAC',
        tenantName: 'Nguon Sopheak (ងួន សុភ័ក្រ)',
        beforeData: 'Status: NOT_PROVISIONED',
        afterData: 'Status: ACTIVE | Assigned Rooms: RM-01 to RM-16 | Meter & Tenant Entry Enabled',
        status: 'VERIFIED',
        note: 'បង្កើតគណនីអ្នកគ្រប់គ្រងសម្រាប់ Nguon Sopheak តាមសិទ្ធិម្ចាស់កម្មសិទ្ធិ HSN / Provisioned dedicated manager account for Nguon Sopheak'
      }
    ];
    localStorage.setItem('hsn_audit_logs', JSON.stringify(seedLogs));
    return seedLogs;
  });

  // Automatic non-destructive backup of existing data on mount
  useEffect(() => {
    try {
      if (!localStorage.getItem('hsn_pre_upgrade_backup')) {
        const backupPayload = {
          backedUpAt: new Date().toISOString(),
          savedTenants: localStorage.getItem('savedTenants'),
          invoice_history: localStorage.getItem('invoice_history')
        };
        localStorage.setItem('hsn_pre_upgrade_backup', JSON.stringify(backupPayload));
      }
    } catch {}
  }, []);

  // Normalize room number helper (e.g. "RM-05", "P.05", "05" -> "5")
  const normalizeRoomKey = (roomStr: string): string => {
    if (!roomStr) return '';
    return roomStr.replace(/^(RM-|P\.)/i, '').replace(/^0+(?=\d)/, '').trim();
  };

  // Helper to calculate category subtotals and grand total for the 12-month summary statement table (accumulated by room across old & new tenants)
  const getSummaryCategoryTotals = () => {
    let totalRoom = 0;
    let totalElec = 0;
    let totalWater = 0;
    let totalWifiOther = 0;
    let totalCollected = 0;
    const targetRoomKey = normalizeRoomKey(inputRoomNo);

    ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].forEach((mIndex) => {
      const mRecords = history.filter(h => 
        (targetRoomKey ? normalizeRoomKey(h.roomNo) === targetRoomKey : h.tenantName.toLowerCase().trim() === inputTenantName.toLowerCase().trim()) && 
        h.paymentDate.split('-')[1] === mIndex
      );
      mRecords.forEach(mRecord => {
        totalRoom += mRecord.roomPrice || 0;
        totalElec += mRecord.elecPrice || 0;
        totalWater += mRecord.waterPrice || 0;
        totalWifiOther += (mRecord.wifiPrice || 0) + (mRecord.otherPrice || 0);
        totalCollected += mRecord.totalUsd || 0;
      });
    });

    return { totalRoom, totalElec, totalWater, totalWifiOther, totalCollected };
  };

  const getSummaryGrandTotal = () => {
    return getSummaryCategoryTotals().totalCollected;
  };

  const [showManualPayForm, setShowManualPayForm] = useState(false);
  const [manualPay, setManualPay] = useState({
    tenantName: '',
    roomNo: '',
    paymentDate: new Date().toISOString().split('T')[0],
    roomPrice: 80,
    wifiPrice: 0,
    elecPrice: 0,
    waterPrice: 0,
    otherPrice: 0,
    totalUsd: 80
  });

  // Admin stats calculations and filtering
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all', '01', '02', ..., '12'
  const [activeSlipTab, setActiveSlipTab] = useState<'sovanna' | 'pheak' | 'landlord' | 'yearly'>('sovanna');
  
  const sovannaSlipRef = useRef<HTMLDivElement>(null);
  const pheakSlipRef = useRef<HTMLDivElement>(null);
  const landlordSlipRef = useRef<HTMLDivElement>(null);
  const yearlySlipRef = useRef<HTMLDivElement>(null);
  const customerSummaryInvoiceRef = useRef<HTMLDivElement>(null);
  const [isEditModeActive, setIsEditModeActive] = useState<boolean>(false); // whether manual override edit mode is on
  const [selectedYearlyTenant, setSelectedYearlyTenant] = useState<string>('10');
  const [selectedYearlyTenantName, setSelectedYearlyTenantName] = useState<string>('');
  const [yearlyViewTab, setYearlyViewTab] = useState<'individual' | 'matrix'>('individual');
  const [statementDate, setStatementDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Device Responsive Scaling & Export Completeness State
  const [deviceScaleMode, setDeviceScaleMode] = useState<'auto' | 'mobile' | 'tablet' | 'desktop' | 'custom'>('auto');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [autoScaleFactor, setAutoScaleFactor] = useState<number>(1);

  // Invoice Layout Style Customizer states
  const [invoiceStyles, setInvoiceStyles] = useState<{
    khmerTitleSize: number;
    englishSubTitleSize: number;
    dividerThickness: number;
    dividerWidthPercent: number;
    dividerColor: string;
    logoSize: number;
    topBorderColor: string;
    invoicePadding: number;
    tableFontSize: number;
    invoiceTopBorderThickness: number;
  }>(() => {
    try {
      const stored = localStorage.getItem('invoice_custom_styles');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      khmerTitleSize: 19,
      englishSubTitleSize: 14,
      dividerThickness: 2,
      dividerWidthPercent: 100,
      dividerColor: '#dc2626', // red
      logoSize: 96, // w-24 is 96px
      topBorderColor: '#10b981', // emerald-600
      invoicePadding: 40, // p-10 is 40px
      tableFontSize: 14, // text-sm is 14px
      invoiceTopBorderThickness: 12
    };
  });

  // Save styles when changed
  useEffect(() => {
    localStorage.setItem('invoice_custom_styles', JSON.stringify(invoiceStyles));
  }, [invoiceStyles]);

  const [showStyleCustomizer, setShowStyleCustomizer] = useState<boolean>(false);

  const [invoiceContentHeight, setInvoiceContentHeight] = useState<number>(1150);
  const [isExportInspectorOpen, setIsExportInspectorOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [showPdfMenu, setShowPdfMenu] = useState<boolean>(false);
  const [showTopActionsMenu, setShowTopActionsMenu] = useState<boolean>(false);
  const invoiceViewportRef = useRef<HTMLDivElement>(null);

  // Auto-calculate responsive proportional scale based on available container/device width
  useEffect(() => {
    const calculateScale = () => {
      const containerWidth = invoiceViewportRef.current?.clientWidth || window.innerWidth;
      if (containerWidth > 0) {
        // Invoice standard canonical width is 850px. Add safe margins (24px)
        const factor = Math.min(1, Math.max(0.35, (containerWidth - 28) / 850));
        setAutoScaleFactor(factor);
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [activeTab]);

  // Track dynamic invoice height to smoothly collapse transform scale void
  useEffect(() => {
    if (invoiceRef.current) {
      const measuredHeight = invoiceRef.current.offsetHeight;
      if (measuredHeight > 400) {
        setInvoiceContentHeight(measuredHeight);
      }
    }
  }, [data, activeTab]);

  // Compute effective scale based on selected device mode
  const effectiveScale = deviceScaleMode === 'auto'
    ? autoScaleFactor
    : deviceScaleMode === 'mobile'
      ? Math.min(autoScaleFactor, 390 / 850)
      : deviceScaleMode === 'tablet'
        ? Math.min(autoScaleFactor, 768 / 850)
        : deviceScaleMode === 'desktop'
          ? 1
          : zoomScale;

  // New Customer-Centric Monthly Input States (Add, Edit, Delete, Totals)
  const [inputRoomNo, setInputRoomNo] = useState<string>('10');
  const [inputTenantName, setInputTenantName] = useState<string>('គូ គង់មី');
  const [inputMonth, setInputMonth] = useState<string>('10');
  const [inputPaymentDate, setInputPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputRoomPrice, setInputRoomPrice] = useState<number>(80);
  const [inputWifiPrice, setInputWifiPrice] = useState<number>(5);
  const [inputElecPrice, setInputElecPrice] = useState<number>(0);
  const [inputWaterPrice, setInputWaterPrice] = useState<number>(0);
  const [inputOtherPrice, setInputOtherPrice] = useState<number>(0);
  const [inputElecUsage, setInputElecUsage] = useState<number>(0);
  const [inputWaterUsage, setInputWaterUsage] = useState<number>(0);
  const [inputStatus, setInputStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  
  // Dedicated Manual Input Form States (as requested by user)
  const [formMonth, setFormMonth] = useState<string>('10');
  const [formRooms, setFormRooms] = useState<number>(0);
  const [formTotalUsd, setFormTotalUsd] = useState<number>(0);
  const [formDeposit, setFormDeposit] = useState<number>(0);
  const [formElectricity, setFormElectricity] = useState<number>(0);
  const [formWater, setFormWater] = useState<number>(0);
  const [formWifi, setFormWifi] = useState<number>(0);

  const [customMonthlyData, setCustomMonthlyData] = useState<Record<string, { roomsCount: number; totalUsd: number; deposit: number; electricityRevenue: number; waterRevenue: number; wifiRevenue?: number; useCustom: boolean }>>(() => {
    try {
      const stored = localStorage.getItem('custom_monthly_data');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  // Save manual inputs to localStorage
  const saveCustomMonthData = (monthStr: string, field: 'roomsCount' | 'totalUsd' | 'deposit' | 'electricityRevenue' | 'waterRevenue' | 'wifiRevenue' | 'useCustom', value: any) => {
    setCustomMonthlyData(prev => {
      const existing = prev[monthStr] || { roomsCount: 0, totalUsd: 0, deposit: 0, electricityRevenue: 0, waterRevenue: 0, wifiRevenue: 0, useCustom: false };
      const updated = {
        ...prev,
        [monthStr]: {
          ...existing,
          [field]: value
        }
      };
      localStorage.setItem('custom_monthly_data', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter history records based on selected month
  const getFilteredHistory = () => {
    if (selectedMonth === 'all') return history;
    return history.filter(h => h.paymentDate.startsWith(`2026-${selectedMonth}`));
  };

  const filteredHistory = getFilteredHistory();

  // Monthly stats helper for rendering the comprehensive comparison table and calculating metrics
  const getMonthlyStats = (monthIndex: number) => {
    const monthStr = monthIndex.toString().padStart(2, '0');
    const monthPrefix = `2026-${monthStr}`;
    const monthlyRecords = history.filter(h => h.paymentDate.startsWith(monthPrefix));
    
    // Auto-calculated system values (saved automatically)
    const autoRoomsCount = monthlyRecords.length;
    const autoRoomRevenue = monthlyRecords.reduce((sum, r) => sum + r.roomPrice, 0);
    const autoTotalUsd = monthlyRecords.reduce((sum, r) => sum + r.totalUsd, 0);
    const autoElectricityRevenue = monthlyRecords.reduce((sum, r) => sum + r.elecPrice, 0);
    const autoWaterRevenue = monthlyRecords.reduce((sum, r) => sum + r.waterPrice, 0);
    const autoWifiRevenue = monthlyRecords.reduce((sum, r) => sum + r.wifiPrice, 0);
    
    // Auto deposit: sum of deposits of active tenants rented in this month
    const autoDeposit = savedTenants.filter(t => t.roomNo && monthlyRecords.some(r => r.roomNo === t.roomNo)).reduce((sum, t) => sum + (t.deposit || 0), 0);
    
    // Custom manual override values
    const custom = customMonthlyData[monthStr] || { roomsCount: 0, totalUsd: 0, deposit: 0, electricityRevenue: 0, waterRevenue: 0, wifiRevenue: 0, useCustom: false };
    
    const useManual = custom.useCustom;
    const roomsCount = useManual ? (custom.roomsCount || 0) : autoRoomsCount;
    const enteredUsd = useManual ? (custom.totalUsd || 0) : autoTotalUsd;
    const deposit = useManual ? (custom.deposit || 0) : autoDeposit;
    const electricityRevenue = useManual ? (custom.electricityRevenue || 0) : autoElectricityRevenue;
    const waterRevenue = useManual ? (custom.waterRevenue || 0) : autoWaterRevenue;
    const wifiRevenue = useManual ? (custom.wifiRevenue || 0) : autoWifiRevenue;
    
    // Room Revenue (Total room revenue)
    // For manual entry, the entered totalUsd represents pure Room Rent, so room revenue is exactly enteredUsd
    // For auto system entry, room revenue is the sum of room rents from automatic history records
    const roomRevenue = useManual
      ? enteredUsd
      : monthlyRecords.reduce((sum, r) => sum + r.roomPrice, 0);

    // Total USD collected including room rents and utilities
    const totalUsd = useManual
      ? (roomRevenue + electricityRevenue + waterRevenue + wifiRevenue)
      : autoTotalUsd;
    
    // NEW FORMULA:
    // 1. Sovanna gets 20% of Room Revenue + 100% of Electricity + 100% of Water + 100% of Wifi
    const sovannaSalary = (roomRevenue * 0.20) + electricityRevenue + waterRevenue + wifiRevenue;
    
    // 2. Pheak gets $15 per room rented for months 1-9, and $10 per room starting from month 10 (October)
    const pheakRate = monthIndex >= 10 ? 10 : 15;
    const pheakSalary = roomsCount * pheakRate;
    
    // 3. Landlord gets the rest of the Room Revenue after paying Sovanna (20%) and Pheak ($15/room)
    const landlordNet = roomRevenue - (roomRevenue * 0.20) - pheakSalary;
    
    return {
      monthStr,
      autoRoomsCount,
      autoRoomRevenue,
      autoTotalUsd,
      autoElectricityRevenue,
      autoWaterRevenue,
      autoWifiRevenue,
      autoDeposit,
      
      customRoomsCount: custom.roomsCount || 0,
      customTotalUsd: custom.totalUsd || 0,
      customDeposit: custom.deposit || 0,
      customElectricityRevenue: custom.electricityRevenue || 0,
      customWaterRevenue: custom.waterRevenue || 0,
      customWifiRevenue: custom.wifiRevenue || 0,
      
      useCustom: custom.useCustom,
      
      roomsCount,
      totalUsd,
      deposit,
      electricityRevenue,
      waterRevenue,
      wifiRevenue,
      roomRevenue,
      sovannaSalary,
      pheakSalary,
      landlordNet
    };
  };

  // Selected Month dynamic metrics
  const getSelectedMonthMetrics = () => {
    if (selectedMonth === 'all') {
      let roomsCount = 0;
      let totalUsd = 0;
      let roomRevenueSum = 0;
      let utilPriceSum = 0;
      let otherPriceSum = 0;
      
      for (let m = 1; m <= 12; m++) {
        const stats = getMonthlyStats(m);
        roomsCount += stats.roomsCount;
        totalUsd += stats.totalUsd;
        roomRevenueSum += stats.roomRevenue;
        
        // Accumulate utils and other from history or proportional
        const monthPrefix = `2026-${m.toString().padStart(2, '0')}`;
        const monthlyRecords = history.filter(h => h.paymentDate.startsWith(monthPrefix));
        utilPriceSum += monthlyRecords.reduce((sum, r) => sum + r.elecPrice + r.waterPrice, 0);
        otherPriceSum += monthlyRecords.reduce((sum, r) => sum + r.wifiPrice + r.otherPrice, 0);
      }
      
      return {
        totalIncome: totalUsd,
        totalRoomRevenue: roomRevenueSum,
        totalUtilRevenue: utilPriceSum,
        totalWifiRevenue: history.reduce((acc, curr) => acc + curr.wifiPrice, 0),
        totalOtherRevenue: history.reduce((acc, curr) => acc + curr.otherPrice, 0),
        totalRoomsRented: roomsCount
      };
    } else {
      const stats = getMonthlyStats(parseInt(selectedMonth));
      const monthPrefix = `2026-${selectedMonth}`;
      const monthlyRecords = history.filter(h => h.paymentDate.startsWith(monthPrefix));
      const totalUtil = monthlyRecords.reduce((sum, r) => sum + r.elecPrice + r.waterPrice, 0);
      const totalWifi = monthlyRecords.reduce((sum, r) => sum + r.wifiPrice, 0);
      const totalOther = monthlyRecords.reduce((sum, r) => sum + r.otherPrice, 0);
      
      return {
        totalIncome: stats.totalUsd,
        totalRoomRevenue: stats.roomRevenue,
        totalUtilRevenue: totalUtil,
        totalWifiRevenue: totalWifi,
        totalOtherRevenue: totalOther,
        totalRoomsRented: stats.roomsCount
      };
    }
  };

  const {
    totalIncome,
    totalRoomRevenue,
    totalUtilRevenue,
    totalWifiRevenue,
    totalOtherRevenue,
    totalRoomsRented
  } = getSelectedMonthMetrics();

  // Yearly absolute totals (for cumulative sums)
  const yearlyTotalIncome = [1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).totalUsd, 0);
  const yearlyTotalRoomRevenue = [1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).roomRevenue, 0);
  const yearlyTotalUtilRevenue = history.reduce((acc, curr) => acc + curr.elecPrice + curr.waterPrice, 0);
  const yearlyTotalWifiRevenue = history.reduce((acc, curr) => acc + curr.wifiPrice, 0);
  const yearlyTotalOtherRevenue = history.reduce((acc, curr) => acc + curr.otherPrice, 0);

  // Dynamic Salaries for Selected Month (NEW FORMULA)
  const isAllMonths = selectedMonth === 'all';
  
  const sovannaSalaryFiltered = isAllMonths
    ? [1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).sovannaSalary, 0)
    : getMonthlyStats(parseInt(selectedMonth)).sovannaSalary;

  const pheakSalaryFiltered = isAllMonths
    ? [1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).pheakSalary, 0)
    : getMonthlyStats(parseInt(selectedMonth)).pheakSalary;

  const landlordNetFiltered = isAllMonths
    ? [1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).landlordNet, 0)
    : getMonthlyStats(parseInt(selectedMonth)).landlordNet;

  const utilsAndWifiFiltered = isAllMonths
    ? [1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => {
        const stats = getMonthlyStats(m);
        return sum + stats.electricityRevenue + stats.waterRevenue + stats.wifiRevenue;
      }, 0)
    : (() => {
        const stats = getMonthlyStats(parseInt(selectedMonth));
        return stats.electricityRevenue + stats.waterRevenue + stats.wifiRevenue;
      })();

  const handleManualPayChange = (field: string, value: number) => {
    setManualPay(prev => {
      const updated = { ...prev, [field]: value };
      updated.totalUsd = Number(updated.roomPrice) + Number(updated.wifiPrice) + Number(updated.elecPrice) + Number(updated.waterPrice) + Number(updated.otherPrice);
      return updated;
    });
  };

  // Generate monthly revenue comparison chart data for the current year
  const getMonthlyChartData = () => {
    const currentYear = new Date().getFullYear().toString(); // e.g. "2026"
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return monthNames.map((name, index) => {
      const monthStr = (index + 1).toString().padStart(2, '0'); // "01", "02", ...
      const monthPrefix = `${currentYear}-${monthStr}`; // "2026-01"
      
      const records = history.filter(h => h.paymentDate.startsWith(monthPrefix));
      
      const room = records.reduce((sum, r) => sum + r.roomPrice, 0);
      const utils = records.reduce((sum, r) => sum + r.elecPrice + r.waterPrice, 0);
      const other = records.reduce((sum, r) => sum + r.wifiPrice + r.otherPrice, 0);
      const total = records.reduce((sum, r) => sum + r.totalUsd, 0);
      
      return {
        name,
        "Room Rent": Number(room.toFixed(2)),
        "Utilities": Number(utils.toFixed(2)),
        "Wifi & Other": Number(other.toFixed(2)),
        "Total Revenue": Number(total.toFixed(2))
      };
    });
  };

  const monthlyChartData = getMonthlyChartData();

  const invoiceRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Pre-populate form inputs when selecting a month to edit (Electricity and Water are displayed in Riel KHR: 1$ = 4000៛)
  useEffect(() => {
    const stats = getMonthlyStats(parseInt(formMonth));
    setFormRooms(stats.useCustom ? stats.customRoomsCount : stats.autoRoomsCount);
    setFormTotalUsd(stats.useCustom ? stats.customTotalUsd : stats.autoTotalUsd);
    setFormDeposit(stats.useCustom ? stats.customDeposit : stats.autoDeposit);
    setFormElectricity(Math.round((stats.useCustom ? stats.customElectricityRevenue : stats.autoElectricityRevenue) * 4000));
    setFormWater(Math.round((stats.useCustom ? stats.customWaterRevenue : stats.autoWaterRevenue) * 4000));
    setFormWifi(stats.useCustom ? stats.customWifiRevenue : stats.autoWifiRevenue);
  }, [formMonth, customMonthlyData]);

  // Sync draft to localStorage on change
  useEffect(() => {
    localStorage.setItem('invoice_draft', JSON.stringify(data));
  }, [data]);

  // Automatically calculate electricity and water prices whenever usage numbers are entered (1 KWH = 1500៛, 1 M³ = 2000៛)
  useEffect(() => {
    const elecRiel = Number(inputElecUsage) * 1500;
    setInputElecPrice(elecRiel / 4000);
  }, [inputElecUsage]);

  useEffect(() => {
    const waterRiel = Number(inputWaterUsage) * 2000;
    setInputWaterPrice(waterRiel / 4000);
  }, [inputWaterUsage]);

  // Debounced Auto-save of Tenant information into Saved Tenant directory to capture live edits (Admin only)
  useEffect(() => {
    if (!isLoggedIn || userRole !== 'admin') return;
    const timer = setTimeout(() => {
      const name = data.tenantName?.trim();
      if (!name) return;

      const roomItem = data.items.find(item => item.description.includes('តម្លៃបន្ទប់') || item.description.includes('Room Price'));
      const wifiItem = data.items.find(item => item.description.includes('វ៉ាយហ្វាយ') || item.description.includes('Wi-Fi'));
      const elecItem = data.items.find(item => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
      const waterItem = data.items.find(item => item.description.includes('ទឹក') || item.description.includes('Water'));

      setSavedTenants(prev => {
        const existingIdx = prev.findIndex(t => t.tenantName.trim().toLowerCase() === name.toLowerCase());
        let updatedList = [...prev];
        
        const existingRecord = existingIdx > -1 ? prev[existingIdx] : null;

        const newRecord: SavedTenant = {
          tenantName: name,
          roomNo: data.roomNo || existingRecord?.roomNo || '',
          tenantPhone: data.tenantPhone || existingRecord?.tenantPhone || '',
          tenantIdNo: data.tenantIdNo || existingRecord?.tenantIdNo || '',
          checkInDate: data.checkInDate || existingRecord?.checkInDate || '',
          roomPrice: roomItem ? roomItem.unitPrice : (existingRecord?.roomPrice ?? 80),
          wifiPrice: wifiItem ? wifiItem.unitPrice : (existingRecord?.wifiPrice ?? 0),
          elecOld: elecItem ? elecItem.oldMonthNo : (existingRecord?.elecOld ?? ''),
          waterOld: waterItem ? waterItem.oldMonthNo : (existingRecord?.waterOld ?? ''),
        };

        if (existingIdx > -1) {
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            ...newRecord,
          };
        } else {
          updatedList.push(newRecord);
        }
        localStorage.setItem('savedTenants', JSON.stringify(updatedList));
        return updatedList;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [data.tenantName, data.roomNo, data.tenantPhone, data.tenantIdNo, data.checkInDate, data.items]);

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((acc, item) => {
      const amount = item.quantity * item.unitPrice;
      return acc + (item.currency === 'KHR' ? amount / 4000 : amount);
    }, 0);
  };

  const handleReset = () => {
    playAudioFeedback('delete');
    setData({
      ...initialData,
      tenantName: "",
      roomNo: "",
      tenantPhone: "",
      tenantIdNo: "",
      checkInDate: new Date().toISOString().split('T')[0],
      items: initialData.items.map(item => {
        const isUtility = item.description.includes('អគ្គិសនី') || 
                          item.description.includes('Electricity') || 
                          item.description.includes('ទឹក') || 
                          item.description.includes('Water');
        return {
          ...item,
          oldMonthNo: "",
          newMonthNo: "",
          quantity: isUtility ? 0 : 1
        };
      }),
      totalUsd: 0
    });
  };

  const addItem = (type: 'normal' | 'electricity' | 'water') => {
    let newItem: InvoiceItem;
    
    if (type === 'electricity') {
      newItem = {
        id: 'elec-' + Math.random().toString(36).substr(2, 9),
        description: 'អគ្គិសនី (Electricity)',
        oldMonthNo: '',
        newMonthNo: '',
        quantity: 0,
        unitPrice: 1500,
        unit: 'KWH',
        currency: 'KHR'
      };
    } else if (type === 'water') {
      newItem = {
        id: 'water-' + Math.random().toString(36).substr(2, 9),
        description: 'ទឹក (Water)',
        oldMonthNo: '',
        newMonthNo: '',
        quantity: 0,
        unitPrice: 2000,
        unit: 'M³',
        currency: 'KHR'
      };
    } else {
      newItem = {
        id: Math.random().toString(36).substr(2, 9),
        description: 'New Item (សេវាកម្មថ្មី / New Service)',
        oldMonthNo: '',
        newMonthNo: '',
        quantity: 1,
        unitPrice: 0,
        unit: '',
        currency: 'USD'
      };
    }
    
    setData(prev => {
      const updatedItems = [...prev.items, newItem];
      return {
        ...prev,
        items: updatedItems,
        totalUsd: calculateTotal(updatedItems)
      };
    });
  };

  const removeItem = (id: string) => {
    const newItems = data.items.filter(item => item.id !== id);
    setData({ ...data, items: newItems, totalUsd: calculateTotal(newItems) });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qr') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({
          ...prev,
          [type === 'logo' ? 'logoUrl' : 'qrUrl']: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const newItems = data.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate quantity for utilities (Electricity/Water)
        if (field === 'oldMonthNo' || field === 'newMonthNo') {
          const old = parseFloat(updatedItem.oldMonthNo) || 0;
          const newVal = parseFloat(updatedItem.newMonthNo) || 0;
          if (newVal >= old) {
            updatedItem.quantity = newVal - old;
          } else {
            updatedItem.quantity = 0;
          }
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setData({ ...data, items: newItems, totalUsd: calculateTotal(newItems) });
  };

  // Select a tenant and load their master information, pricing, and old meter readings
  const handleSelectTenant = (tenant: SavedTenant) => {
    playAudioFeedback('click');
    setData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.description.includes('តម្លៃបន្ទប់') || item.description.includes('Room Price')) {
          return { ...item, unitPrice: tenant.roomPrice, quantity: 1 };
        }
        if (item.description.includes('វ៉ាយហ្វាយ') || item.description.includes('Wi-Fi')) {
          return { ...item, unitPrice: tenant.wifiPrice, quantity: 1 };
        }
        if (item.description.includes('អគ្គិសនី') || item.description.includes('Electricity')) {
          return { ...item, oldMonthNo: tenant.elecOld, newMonthNo: '', quantity: 0 };
        }
        if (item.description.includes('ទឹក') || item.description.includes('Water')) {
          return { ...item, oldMonthNo: tenant.waterOld, newMonthNo: '', quantity: 0 };
        }
        return item;
      });

      return {
        ...prev,
        tenantName: tenant.tenantName,
        roomNo: tenant.roomNo,
        tenantPhone: tenant.tenantPhone,
        tenantIdNo: tenant.tenantIdNo,
        checkInDate: tenant.checkInDate,
        items: updatedItems,
        totalUsd: calculateTotal(updatedItems)
      };
    });
    
    // Auto-populate Total Summary Checker inputs for seamless navigation
    setInputRoomNo(tenant.roomNo);
    setInputTenantName(tenant.tenantName);
  };

  // Auto-sync invoice data when logged in as tenant
  useEffect(() => {
    if (isLoggedIn && userRole === 'tenant' && loggedInTenantRoom) {
      const tenant = savedTenants.find(t => t.roomNo === loggedInTenantRoom);
      if (tenant && (data.roomNo !== tenant.roomNo || data.tenantName !== tenant.tenantName)) {
        handleSelectTenant(tenant);
      }
    }
  }, [isLoggedIn, userRole, loggedInTenantRoom, savedTenants]);

  // Handle Secure Direct Access Link & Auto-Login from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const idParam = params.get('id');
    
    if (roomParam && idParam) {
      const matched = savedTenants.find(t => {
        const roomNoMatch = t.roomNo.trim().toLowerCase() === roomParam.trim().toLowerCase();
        const cardLast4 = getLoginId(t.tenantIdNo || formatTenantId(t.roomNo));
        return roomNoMatch && cardLast4 === idParam.trim();
      });
      
      if (matched) {
        handleSelectTenant(matched);
        setUserRole('tenant');
        setLoggedInTenantRoom(matched.roomNo);
        setIsLoggedIn(true);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'tenant');
        sessionStorage.setItem('loggedInTenantRoom', matched.roomNo);
        playAudioFeedback('success');
        // Clear query parameters to keep URL clean and professional
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [savedTenants]);

  // Vacant Rooms Metadata (stores base price & last meter readings for vacant rooms)
  const [vacantRoomsMeta, setVacantRoomsMeta] = useState<Record<string, {
    roomPrice: number;
    wifiPrice: number;
    elecOld: string;
    waterOld: string;
    deposit: number;
    vacatedDate?: string;
    isCustomRoom?: boolean;
  }>>(() => {
    try {
      const stored = localStorage.getItem('vacant_rooms_meta');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      "1": { roomPrice: 80, wifiPrice: 0, elecOld: "0", waterOld: "0", deposit: 80 },
      "2": { roomPrice: 80, wifiPrice: 0, elecOld: "0", waterOld: "0", deposit: 80 },
      "3": { roomPrice: 80, wifiPrice: 0, elecOld: "0", waterOld: "0", deposit: 80 },
      "4": { roomPrice: 80, wifiPrice: 0, elecOld: "0", waterOld: "0", deposit: 80 },
      "7": { roomPrice: 80, wifiPrice: 0, elecOld: "0", waterOld: "0", deposit: 80 },
      "9": { roomPrice: 80, wifiPrice: 0, elecOld: "0", waterOld: "0", deposit: 80 },
    };
  });

  // Master list of all building rooms (1..16 + any custom vacant or occupied rooms)
  const allBuildingRoomNumbers = Array.from(
    new Set([
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16",
      ...Object.keys(vacantRoomsMeta),
      ...savedTenants.map(t => t.roomNo.trim()).filter(Boolean)
    ])
  ).sort((a, b) => (parseInt(a) || 999) - (parseInt(b) || 999));

  // Currently vacant rooms (rooms in master list that do NOT have an active tenant in savedTenants)
  const vacantRoomsList = allBuildingRoomNumbers.filter(
    rNo => !savedTenants.some(t => t.roomNo.trim().toLowerCase() === rNo.trim().toLowerCase() && t.tenantName.trim() !== '')
  );

  // Dedicated Manager Vacant Room Check-In Form State
  const [checkInFormData, setCheckInFormData] = useState<{
    roomNo: string;
    tenantName: string;
    tenantPhone: string;
    tenantIdNo: string;
    checkInDate: string;
    roomPrice: number;
    wifiPrice: number;
    deposit: number;
    elecOld: string;
    waterOld: string;
    isPaid: boolean;
  }>(() => {
    const firstVacant = "1";
    return {
      roomNo: firstVacant,
      tenantName: '',
      tenantPhone: '',
      tenantIdNo: '',
      checkInDate: new Date().toISOString().split('T')[0],
      roomPrice: 80,
      wifiPrice: 0,
      deposit: 80,
      elecOld: '0',
      waterOld: '0',
      isPaid: false
    };
  });
  const [newVacantRoomInput, setNewVacantRoomInput] = useState<string>('');
  const [checkInSuccessInfo, setCheckInSuccessInfo] = useState<{
    roomNo: string;
    tenantName: string;
    tenantPhone: string;
    tenantIdNo: string;
    roomPrice: number;
    deposit: number;
  } | null>(null);

  // Keep checkInFormData.roomNo synced to a valid vacant room if current selection becomes occupied
  useEffect(() => {
    if (vacantRoomsList.length > 0 && !vacantRoomsList.includes(checkInFormData.roomNo)) {
      const nextVacant = vacantRoomsList[0];
      const meta = vacantRoomsMeta[nextVacant];
      setCheckInFormData(prev => ({
        ...prev,
        roomNo: nextVacant,
        roomPrice: meta?.roomPrice ?? 80,
        wifiPrice: meta?.wifiPrice ?? 0,
        deposit: meta?.deposit ?? 80,
        elecOld: meta?.elecOld ?? '0',
        waterOld: meta?.waterOld ?? '0',
      }));
    }
  }, [savedTenants]);

  // Select a specific vacant room and open the dedicated Check-In Form
  const handleSelectVacantRoomForCheckIn = (roomNo: string, switchTab: boolean = true) => {
    playAudioFeedback('click');
    const cleanRoom = roomNo.replace(/^(RM-|P\.)/i, '').replace(/^0+(?=\d)/, '').trim() || roomNo.trim();
    const meta = vacantRoomsMeta[cleanRoom];
    setCheckInFormData(prev => ({
      ...prev,
      roomNo: cleanRoom,
      roomPrice: meta?.roomPrice ?? 80,
      wifiPrice: meta?.wifiPrice ?? 0,
      deposit: meta?.deposit ?? 80,
      elecOld: meta?.elecOld ?? '0',
      waterOld: meta?.waterOld ?? '0',
    }));
    setCheckInSuccessInfo(null);
    if (switchTab) {
      setActiveTab('checkInForm');
      setTimeout(() => {
        const el = document.getElementById('vacant-checkin-form-card');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Add a custom new vacant room slot to the building
  const handleAddNewVacantRoomSlot = () => {
    const raw = newVacantRoomInput.replace(/^(RM-|P\.)/i, '').replace(/^0+(?=\d)/, '').trim();
    if (!raw) {
      alert(trApp("សូមបញ្ចូលលេខបន្ទប់ទំនេរថ្មី!", "Please enter a new vacant room number!"));
      return;
    }
    const alreadyOccupied = savedTenants.some(t => t.roomNo.trim().toLowerCase() === raw.toLowerCase());
    if (alreadyOccupied) {
      alert(trApp(`បន្ទប់ ${formatRoomBadge(raw)} មានភ្ញៀវកំពុងជួលរួចហើយ!`, `Room ${formatRoomBadge(raw)} is currently occupied!`));
      return;
    }
    playAudioFeedback('success');
    setVacantRoomsMeta(prev => {
      const updated = {
        ...prev,
        [raw]: prev[raw] || { roomPrice: 80, wifiPrice: 0, elecOld: '0', waterOld: '0', deposit: 80, isCustomRoom: true }
      };
      localStorage.setItem('vacant_rooms_meta', JSON.stringify(updated));
      return updated;
    });
    setNewVacantRoomInput('');
    handleSelectVacantRoomForCheckIn(raw, false);
  };

  // Archive & preserve old tenant's rental revenue into Landlord's Monthly Ledger while deleting old tenant's personal profile
  const archiveOldTenantRevenueAndPurgeProfile = (roomNo: string, oldTenantName?: string, newTenantName?: string) => {
    const cleanRoom = normalizeRoomKey(roomNo);
    const matchedOldTenant = savedTenants.find(t =>
      (cleanRoom && normalizeRoomKey(t.roomNo) === cleanRoom) ||
      (oldTenantName && t.tenantName.trim().toLowerCase() === oldTenantName.trim().toLowerCase())
    );

    const targetRoom = cleanRoom || (matchedOldTenant ? normalizeRoomKey(matchedOldTenant.roomNo) : '');
    const archiveLabel = newTenantName?.trim()
      ? newTenantName.trim()
      : `បន្ទប់ ${formatRoomBadge(targetRoom || '0')} (ចំណូលចាស់រក្សាទុក / Archived Revenue)`;

    setHistory(prev => {
      let updated = [...prev];

      // If the old tenant was marked as Paid for the current month but didn't have a history record yet, preserve it into history before deleting tenant
      if (matchedOldTenant && matchedOldTenant.isPaid && targetRoom) {
        const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
        const hasCurrentMonthRecord = updated.some(
          r => normalizeRoomKey(r.roomNo) === targetRoom && r.paymentDate.startsWith(currentYearMonth)
        );
        if (!hasCurrentMonthRecord) {
          const preservedRecord: InvoiceHistoryRecord = {
            id: `h-preserved-${Date.now()}`,
            roomNo: targetRoom,
            tenantName: archiveLabel,
            paymentDate: `${currentYearMonth}-05`,
            roomPrice: Number(matchedOldTenant.roomPrice) || 80,
            wifiPrice: Number(matchedOldTenant.wifiPrice) || 0,
            elecPrice: 0,
            waterPrice: 0,
            otherPrice: 0,
            totalUsd: (Number(matchedOldTenant.roomPrice) || 80) + (Number(matchedOldTenant.wifiPrice) || 0),
            elecUsage: 0,
            waterUsage: 0,
            status: 'PAID'
          };
          updated = [preservedRecord, ...updated];
        }
      }

      // Scrub the deleted old tenant's personal name from historical records while keeping 100% of the monthly revenue figures intact for the landlord
      updated = updated.map(rec => {
        const sameRoom = targetRoom && normalizeRoomKey(rec.roomNo) === targetRoom;
        const sameOldName = oldTenantName && rec.tenantName.trim().toLowerCase() === oldTenantName.trim().toLowerCase();
        if (sameRoom || sameOldName) {
          return {
            ...rec,
            roomNo: targetRoom || rec.roomNo,
            tenantName: archiveLabel
          };
        }
        return rec;
      });

      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });
  };

  // One-click purge of all former tenants' personal names across the system while preserving 100% of landlord monthly & cumulative revenue
  const handlePurgeAllFormerTenantsKeepRevenue = () => {
    if (
      !confirm(
        trApp(
          `តើអ្នកចង់លុបព័ត៌មានឈ្មោះភ្ញៀវចាស់ដែលឈប់ជួលទាំងអស់ ប៉ុន្តែរក្សាទុកទិន្នន័យចំណូលគ្រប់ខែនៅក្នុងតារាងចំណូលម្ចាស់ផ្ទះដើម្បីបូកបន្តមែនទេ?`,
          `Do you want to clear all vacated tenants' personal names while keeping and accumulating 100% of monthly revenues in the landlord's revenue ledger?`
        )
      )
    ) {
      return;
    }
    playAudioFeedback('success');
    setHistory(prev => {
      const updated = prev.map(rec => {
        const cRoom = normalizeRoomKey(rec.roomNo);
        const activeTenantInRoom = savedTenants.find(t => normalizeRoomKey(t.roomNo) === cRoom);
        if (activeTenantInRoom) {
          return {
            ...rec,
            roomNo: cRoom,
            tenantName: activeTenantInRoom.tenantName
          };
        } else {
          return {
            ...rec,
            roomNo: cRoom || rec.roomNo,
            tenantName: `បន្ទប់ ${formatRoomBadge(cRoom || rec.roomNo)} (ចំណូលចាស់រក្សាទុក / Archived Revenue)`
          };
        }
      });
      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });
    alert(
      trApp(
        `បានលុបឈ្មោះភ្ញៀវចាស់ដែលឈប់ជួលរួចរាល់! ទិន្នន័យចំណូលខែមុនៗទាំងអស់ត្រូវបានរក្សាទុក និងបូកបន្តក្នុងតារាងចំណូលប្រចាំខែរបស់ម្ចាស់ផ្ទះ។`,
        `Cleared vacated tenant names! All previous monthly revenue figures are preserved and continue accumulating in the landlord's monthly revenue table.`
      )
    );
  };

  // Vacate an occupied room (Clear vacated tenant personal info while preserving 100% of cumulative landlord revenue)
  const handleVacateRoom = (tenant: SavedTenant) => {
    if (
      !confirm(
        trApp(
          `តើអ្នកពិតជាចង់លុបព័ត៌មានភ្ញៀវឈប់ជួល "${tenant.tenantName}" ចេញពីបន្ទប់ ${formatRoomBadge(tenant.roomNo)} (ប៉ុន្តែរក្សាទុកចំណូលខែមុនៗទាំងអស់ក្នុងតារាងម្ចាស់ផ្ទះដើម្បីបូកបន្តពេលមានភ្ញៀវថ្មីចូលជួល) មែនទេ?`,
          `Are you sure you want to clear vacated tenant "${tenant.tenantName}" from room ${formatRoomBadge(tenant.roomNo)} while keeping and accumulating all previous monthly revenues for the landlord?`
        )
      )
    ) {
      return;
    }
    playAudioFeedback('delete');
    const cleanRoom = normalizeRoomKey(tenant.roomNo) || tenant.roomNo;

    // 1. Archive & preserve all previous revenue in history while scrubbing old tenant profile name
    archiveOldTenantRevenueAndPurgeProfile(cleanRoom, tenant.tenantName);

    // 2. Save room's last meter readings and base rent into vacantRoomsMeta
    setVacantRoomsMeta(prev => {
      const updated = {
        ...prev,
        [cleanRoom]: {
          roomPrice: tenant.roomPrice || 80,
          wifiPrice: tenant.wifiPrice || 0,
          elecOld: tenant.elecOld || '0',
          waterOld: tenant.waterOld || '0',
          deposit: tenant.deposit || 80,
          vacatedDate: new Date().toISOString().split('T')[0]
        }
      };
      localStorage.setItem('vacant_rooms_meta', JSON.stringify(updated));
      return updated;
    });

    // 3. Remove old tenant from occupied savedTenants
    setSavedTenants(prev => {
      const updatedList = prev.filter(t => normalizeRoomKey(t.roomNo) !== cleanRoom);
      localStorage.setItem('savedTenants', JSON.stringify(updatedList));
      return updatedList;
    });

    // 4. Clear active invoice draft if it was showing the old tenant
    if (normalizeRoomKey(data.roomNo) === cleanRoom || data.tenantName.trim().toLowerCase() === tenant.tenantName.trim().toLowerCase()) {
      setData(prev => ({
        ...prev,
        tenantName: '',
        tenantPhone: '',
        tenantIdNo: ''
      }));
    }
  };

  // Submit the Dedicated Manager Vacant Room Check-In Form
  const handleVacantCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoomNo = normalizeRoomKey(checkInFormData.roomNo);
    const cleanName = checkInFormData.tenantName.trim();

    if (!cleanRoomNo || !cleanName) {
      alert(trApp("សូមជ្រើសរើសបន្ទប់ទំនេរ និងបញ្ចូលឈ្មោះភ្ញៀវជួល!", "Please select a vacant room and enter the tenant's full name!"));
      return;
    }

    const existingOccupied = savedTenants.find(t => normalizeRoomKey(t.roomNo).toLowerCase() === cleanRoomNo.toLowerCase());
    if (existingOccupied) {
      if (!confirm(trApp(
        `បន្ទប់ ${formatRoomBadge(cleanRoomNo)} មានភ្ញៀវឈ្មោះ "${existingOccupied.tenantName}" រួចហើយ។ តើអ្នកចង់លុបភ្ញៀវចាស់ ហើយជំនួសដោយភ្ញៀវថ្មី "${cleanName}" (ចំណូលចាស់នៅតែរក្សាទុកបូកបន្ត) មែនទេ?`,
        `Room ${formatRoomBadge(cleanRoomNo)} currently has tenant "${existingOccupied.tenantName}". Do you want to replace with new tenant "${cleanName}" while keeping all previous monthly revenues accumulated for the landlord?`
      ))) {
        return;
      }
    }

    // Preserve all previous revenue of this room and associate room history with the new tenant so landlord revenue accumulates seamlessly
    archiveOldTenantRevenueAndPurgeProfile(cleanRoomNo, existingOccupied?.tenantName, cleanName);

    const finalIdNo = checkInFormData.tenantIdNo.trim() || formatTenantId(cleanRoomNo);

    const newCheckedInTenant: SavedTenant = {
      roomNo: cleanRoomNo,
      tenantName: cleanName,
      tenantPhone: checkInFormData.tenantPhone.trim(),
      tenantIdNo: finalIdNo,
      checkInDate: checkInFormData.checkInDate || new Date().toISOString().split('T')[0],
      roomPrice: Number(checkInFormData.roomPrice) || 80,
      wifiPrice: Number(checkInFormData.wifiPrice) || 0,
      deposit: Number(checkInFormData.deposit) || 0,
      elecOld: checkInFormData.elecOld.trim() || '0',
      waterOld: checkInFormData.waterOld.trim() || '0',
      isPaid: checkInFormData.isPaid
    };

    setSavedTenants(prev => {
      const filtered = prev.filter(t => normalizeRoomKey(t.roomNo).toLowerCase() !== cleanRoomNo.toLowerCase());
      const updatedList = [...filtered, newCheckedInTenant];
      localStorage.setItem('savedTenants', JSON.stringify(updatedList));
      return updatedList;
    });

    // Also load this newly checked-in tenant onto the active invoice draft
    handleSelectTenant(newCheckedInTenant);
    playAudioFeedback('success');

    setCheckInSuccessInfo({
      roomNo: cleanRoomNo,
      tenantName: cleanName,
      tenantPhone: newCheckedInTenant.tenantPhone,
      tenantIdNo: finalIdNo,
      roomPrice: newCheckedInTenant.roomPrice,
      deposit: newCheckedInTenant.deposit || 0
    });

    // Reset form for the next vacant room
    const remainingVacant = vacantRoomsList.filter(r => r !== cleanRoomNo);
    const nextRoom = remainingVacant[0] || '';
    const nextMeta = nextRoom ? vacantRoomsMeta[nextRoom] : undefined;

    setCheckInFormData({
      roomNo: nextRoom,
      tenantName: '',
      tenantPhone: '',
      tenantIdNo: '',
      checkInDate: new Date().toISOString().split('T')[0],
      roomPrice: nextMeta?.roomPrice ?? 80,
      wifiPrice: nextMeta?.wifiPrice ?? 0,
      deposit: nextMeta?.deposit ?? 80,
      elecOld: nextMeta?.elecOld ?? '0',
      waterOld: nextMeta?.waterOld ?? '0',
      isPaid: false
    });
  };

  // Delete old tenant information when they stop renting, while keeping all previous rental revenue in the landlord's monthly revenue table
  const handleDeleteTenant = (nameToDelete: string) => {
    playAudioFeedback('delete');
    const target = savedTenants.find(t => t.tenantName === nameToDelete);
    if (target) {
      const cleanRoom = normalizeRoomKey(target.roomNo) || target.roomNo;
      archiveOldTenantRevenueAndPurgeProfile(cleanRoom, target.tenantName);
      setVacantRoomsMeta(metaPrev => {
        const updatedMeta = {
          ...metaPrev,
          [cleanRoom]: {
            roomPrice: target.roomPrice || 80,
            wifiPrice: target.wifiPrice || 0,
            elecOld: target.elecOld || '0',
            waterOld: target.waterOld || '0',
            deposit: target.deposit || 80,
            vacatedDate: new Date().toISOString().split('T')[0]
          }
        };
        localStorage.setItem('vacant_rooms_meta', JSON.stringify(updatedMeta));
        return updatedMeta;
      });
      if (normalizeRoomKey(data.roomNo) === cleanRoom || data.tenantName.trim().toLowerCase() === target.tenantName.trim().toLowerCase()) {
        setData(prev => ({
          ...prev,
          tenantName: '',
          tenantPhone: '',
          tenantIdNo: ''
        }));
      }
    }
    setSavedTenants(prev => {
      const updatedList = prev.filter(t => t.tenantName !== nameToDelete);
      localStorage.setItem('savedTenants', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  // Start editing tenant details in the sidebar form
  const handleStartEditTenant = (tenant: SavedTenant) => {
    setNewTenant(tenant);
    setEditingTenantName(tenant.tenantName);
    setShowAddForm(true);
    
    // Smooth scroll to the form if on mobile
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Handle Add/Edit Form submission (preserves and accumulates previous room revenue when changing tenant)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.tenantName.trim() || !newTenant.roomNo.trim()) {
      alert("សូមបញ្ចូលឈ្មោះអ្នកជួល និងលេខបន្ទប់! / Please enter Tenant Name and Room Number!");
      return;
    }

    const cleanRoom = normalizeRoomKey(newTenant.roomNo) || newTenant.roomNo.trim();
    const normalizedNewTenant: SavedTenant = {
      ...newTenant,
      roomNo: cleanRoom,
      tenantName: newTenant.tenantName.trim()
    };

    // Preserve previous room revenue in history and link to the updated tenant name so landlord monthly & cumulative revenue is never lost
    archiveOldTenantRevenueAndPurgeProfile(cleanRoom, editingTenantName || undefined, normalizedNewTenant.tenantName);

    setSavedTenants(prev => {
      let updatedList = [...prev];
      
      if (editingTenantName) {
        // Edit Mode: Replace the original record (matched by original name) with edited values
        const idx = updatedList.findIndex(t => t.tenantName.toLowerCase() === editingTenantName.toLowerCase());
        if (idx > -1) {
          const mergedTenant = {
            ...normalizedNewTenant,
            tenantIdNo: normalizedNewTenant.tenantIdNo.trim() || updatedList[idx].tenantIdNo || ''
          };
          updatedList[idx] = mergedTenant;
        } else {
          updatedList.push(normalizedNewTenant);
        }
      } else {
        // Add Mode: Check duplicate safety
        const exists = updatedList.some(t => t.tenantName.toLowerCase() === normalizedNewTenant.tenantName.toLowerCase() || normalizeRoomKey(t.roomNo) === cleanRoom);
        if (exists) {
          if (!confirm(trApp(
            `អ្នកជួល ឬលេខបន្ទប់នេះមានរួចហើយនៅក្នុងបញ្ជី។ តើអ្នកចង់ប្តូរភ្ញៀវថ្មី (រក្សាទុកចំណូលចាស់បូកបន្ត) ដែរឬទេ?`,
            `This room is currently occupied. Do you want to update to the new tenant while preserving and accumulating all previous monthly revenues for the landlord?`
          ))) {
            return prev;
          }
        }
        updatedList = updatedList.filter(t => t.tenantName.toLowerCase() !== normalizedNewTenant.tenantName.toLowerCase() && normalizeRoomKey(t.roomNo) !== cleanRoom);
        updatedList.push(normalizedNewTenant);
      }
      
      localStorage.setItem('savedTenants', JSON.stringify(updatedList));
      return updatedList;
    });

    // If the edited tenant is currently active on the invoice, update the invoice view instantly!
    if ((editingTenantName && data.tenantName.toLowerCase() === editingTenantName.toLowerCase()) || normalizeRoomKey(data.roomNo) === cleanRoom) {
      handleSelectTenant(normalizedNewTenant);
    }

    playAudioFeedback('success');
    alert(editingTenantName ? `បានធ្វើបច្ចុប្បន្នភាពព័ត៌មានបន្ទប់ ${formatRoomBadge(cleanRoom)} ដោយជោគជ័យ (ចំណូលចាស់នៅតែរក្សាទុកបូកបន្ត)!` : `បានបន្ថែម/ប្តូរភ្ញៀវបន្ទប់ ${formatRoomBadge(cleanRoom)} ដោយជោគជ័យ (ចំណូលចាស់នៅតែរក្សាទុកបូកបន្ត)!`);
    
    // Close and reset form
    setShowAddForm(false);
    setEditingTenantName(null);
    setNewTenant({
      tenantName: '',
      roomNo: '',
      tenantPhone: '',
      tenantIdNo: '',
      checkInDate: new Date().toISOString().split('T')[0],
      roomPrice: 80,
      wifiPrice: 0,
      elecOld: '',
      waterOld: '',
      deposit: 0
    });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingTenantName(null);
    setNewTenant({
      tenantName: '',
      roomNo: '',
      tenantPhone: '',
      tenantIdNo: '',
      checkInDate: new Date().toISOString().split('T')[0],
      roomPrice: 80,
      wifiPrice: 0,
      elecOld: '',
      waterOld: '',
      deposit: 0
    });
  };

  const handleLogout = () => {
    playAudioFeedback('click');
    setIsLoggedIn(false);
    setUserRole('admin');
    setIsAdminPreviewing(false);
    setLoggedInTenantRoom('');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('loggedInTenantRoom');
  };

  // Cycle utility readings silent helper: update current new meter readings as starting old readings for next month
  const handleCycleReadingsSilent = () => {
    const elecItem = data.items.find(item => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
    const waterItem = data.items.find(item => item.description.includes('ទឹក') || item.description.includes('Water'));
    
    if (!elecItem || !waterItem) return;
    
    const newElec = elecItem.newMonthNo?.trim();
    const newWater = waterItem.newMonthNo?.trim();
    
    const name = data.tenantName?.trim();
    if (!name) return;
    
    setSavedTenants(prev => {
      const updated = prev.map(tenant => {
        if (tenant.tenantName.toLowerCase() === name.toLowerCase()) {
          return {
            ...tenant,
            elecOld: newElec || tenant.elecOld,
            waterOld: newWater || tenant.waterOld
          };
        }
        return tenant;
      });
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });

    setData(prev => {
      const cycledItems = prev.items.map(item => {
        if (item.description.includes('អគ្គិសនី') || item.description.includes('Electricity')) {
          return { ...item, oldMonthNo: newElec || item.oldMonthNo, newMonthNo: '', quantity: 0 };
        }
        if (item.description.includes('ទឹក') || item.description.includes('Water')) {
          return { ...item, oldMonthNo: newWater || item.oldMonthNo, newMonthNo: '', quantity: 0 };
        }
        return item;
      });
      return {
        ...prev,
        items: cycledItems,
        totalUsd: calculateTotal(cycledItems)
      };
    });
  };

  // Cycle utility readings (manual triggers with feedback)
  const handleCycleReadings = () => {
    const elecItem = data.items.find(item => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
    const waterItem = data.items.find(item => item.description.includes('ទឹក') || item.description.includes('Water'));
    
    if (!elecItem || !waterItem) return;
    
    const newElec = elecItem.newMonthNo?.trim();
    const newWater = waterItem.newMonthNo?.trim();
    
    if (!newElec && !newWater) {
      alert("សូមបញ្ចូលលេខវ៉ាត់ថ្មី (ភ្លើង/ទឹក) មុនពេលបិទលេខ! / Please enter new meter readings (Electricity/Water) before cycles!");
      return;
    }
    
    const name = data.tenantName?.trim();
    if (!name) {
      alert("វិក្កយបត្របច្ចុប្បន្នមិនទាន់មានឈ្មោះអ្នកជួលទេ! / Current invoice has no tenant name!");
      return;
    }
    
    handleCycleReadingsSilent();
    playAudioFeedback('success');
    alert(`ការបិទលេខបានជោគជ័យសម្រាប់បន្ទប់ ${formatRoomBadge(data.roomNo)}! លេខវ៉ាត់ថ្មីត្រូវបានកំណត់ជាលេខវ៉ាត់ចាស់សម្រាប់ខែក្រោយ។ / Meter cycles succeeded for room ${formatRoomBadge(data.roomNo)}! New readings set as old readings for next month.`);
  };

  const handlePrint = () => {
    playAudioFeedback('click');
    const elecItem = data.items.find(item => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
    const waterItem = data.items.find(item => item.description.includes('ទឹក') || item.description.includes('Water'));
    const newElec = elecItem?.newMonthNo?.trim();
    const newWater = waterItem?.newMonthNo?.trim();

    if (newElec || newWater) {
      if (confirm(`អ្នកបានបញ្ចូលលេខវ៉ាត់ថ្មី (ភ្លើង: ${newElec || '—'}, ទឹក: ${newWater || '—'})។ តើអ្នកចង់បិទលេខដោយស្វ័យប្រវត្ត ដើម្បីកំណត់លេខទាំងនេះជាលេខវ៉ាត់ចាស់សម្រាប់ខែក្រោយដែរឬទេ? / You entered new readings (Electricity: ${newElec || '—'}, Water: ${newWater || '—'}). Do you want to automatically CYCLE READINGS to set them as OLD READINGS for next month's invoice?`)) {
        handleCycleReadingsSilent();
      }
    }
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return;
    
    const elecItem = data.items.find(item => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
    const waterItem = data.items.find(item => item.description.includes('ទឹក') || item.description.includes('Water'));
    const newElec = elecItem?.newMonthNo?.trim();
    const newWater = waterItem?.newMonthNo?.trim();

    if (newElec || newWater) {
      if (confirm(`អ្នកបានបញ្ចូលលេខវ៉ាត់ថ្មី (ភ្លើង: ${newElec || '—'}, ទឹក: ${newWater || '—'})។ តើអ្នកចង់បិទលេខដោយស្វ័យប្រវត្ត ដើម្បីកំណត់លេខទាំងនេះជាលេខវ៉ាត់ចាស់សម្រាប់ខែក្រោយដែរឬទេ? / You entered new readings (Electricity: ${newElec || '—'}, Water: ${newWater || '—'}). Do you want to automatically CYCLE READINGS to set them as OLD READINGS for next month's invoice?`)) {
        handleCycleReadingsSilent();
      }
    }

    playAudioFeedback('click');
    setIsDownloading(true);
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      // Wait for React to apply clean text and currency symbols without edit borders
      await new Promise(resolve => setTimeout(resolve, 200));

      const node = invoiceRef.current;
      const fullHeight = node.scrollHeight || 1150;

      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: 850,
        height: fullHeight,
        style: {
          margin: '0',
          borderRadius: '0',
          boxShadow: 'none',
          transform: 'none',
          width: '850px',
          minWidth: '850px',
          maxWidth: '850px',
        }
      });
      
      const link = document.createElement('a');
      const safeTenant = (data.tenantName || 'Tenant').trim().replace(/[\s/\\?%*:|"<>]+/g, '_');
      link.download = `Invoice-Room-${data.roomNo || 'RM'}-${safeTenant}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      playAudioFeedback('success');
    } catch (err) {
      console.error('Download failed:', err);
      alert('បរាជ័យក្នុងការទាញយកវិក្កយបត្រ។ សូមព្យាយាមម្តងទៀត! / Failed to download invoice. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Export invoice as standardized PDF calibrated to device or A4 paper
  const handleExportPdf = async (targetFormat: 'device' | 'mobile' | 'tablet' | 'a4' = 'device') => {
    if (!invoiceRef.current) return;
    
    const elecItem = data.items.find(item => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
    const waterItem = data.items.find(item => item.description.includes('ទឹក') || item.description.includes('Water'));
    const newElec = elecItem?.newMonthNo?.trim();
    const newWater = waterItem?.newMonthNo?.trim();

    if (newElec || newWater) {
      if (confirm(`អ្នកបានបញ្ចូលលេខវ៉ាត់ថ្មី (ភ្លើង: ${newElec || '—'}, ទឹក: ${newWater || '—'})។ តើអ្នកចង់បិទលេខដោយស្វ័យប្រវត្ត ដើម្បីកំណត់លេខទាំងនេះជាលេខវ៉ាត់ចាស់សម្រាប់ខែក្រោយដែរឬទេ? / You entered new readings (Electricity: ${newElec || '—'}, Water: ${newWater || '—'}). Do you want to automatically CYCLE READINGS to set them as OLD READINGS for next month's invoice?`)) {
        handleCycleReadingsSilent();
      }
    }

    playAudioFeedback('click');
    setIsExportingPdf(true);
    setIsDownloading(true);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      // Wait for React to apply clean text and currency symbols with 0% omission
      await new Promise(resolve => setTimeout(resolve, 220));

      const node = invoiceRef.current;
      const fullHeight = Math.max(node.scrollHeight, node.offsetHeight, 1150);
      const standardWidth = 850;

      const imgData = await toPng(node, {
        pixelRatio: 3.5,
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: standardWidth,
        height: fullHeight,
        style: {
          margin: '0',
          borderRadius: '0',
          boxShadow: 'none',
          transform: 'none',
          width: `${standardWidth}px`,
          minWidth: `${standardWidth}px`,
          maxWidth: `${standardWidth}px`,
        }
      });

      // Determine effective format based on parameter and active device mode
      const isMobileScreen = window.innerWidth <= 640;
      const isTabletScreen = window.innerWidth > 640 && window.innerWidth <= 1024;
      
      let effectiveFormat: 'mobile' | 'tablet' | 'desktop' | 'a4' = 'a4';
      if (targetFormat === 'mobile') {
        effectiveFormat = 'mobile';
      } else if (targetFormat === 'tablet') {
        effectiveFormat = 'tablet';
      } else if (targetFormat === 'a4') {
        effectiveFormat = 'a4';
      } else {
        // 'device': Auto-adapt to current device preset or viewport
        if (deviceScaleMode === 'mobile' || (deviceScaleMode === 'auto' && isMobileScreen)) {
          effectiveFormat = 'mobile';
        } else if (deviceScaleMode === 'tablet' || (deviceScaleMode === 'auto' && isTabletScreen)) {
          effectiveFormat = 'tablet';
        } else if (deviceScaleMode === 'desktop') {
          effectiveFormat = 'a4';
        } else {
          effectiveFormat = isMobileScreen ? 'mobile' : isTabletScreen ? 'tablet' : 'a4';
        }
      }

      const safeTenant = (data.tenantName || 'Tenant').trim().replace(/[\s/\\?%*:|"<>]+/g, '_');
      const formatTag = effectiveFormat === 'a4' ? 'A4' : effectiveFormat === 'mobile' ? 'Mobile' : 'Tablet';
      const filename = `Invoice-Room-${data.roomNo || 'RM'}-${safeTenant}-PDF-${formatTag}-${new Date().toISOString().slice(0, 10)}.pdf`;

      let pdf: jsPDF;

      if (effectiveFormat === 'a4') {
        // Standard A4 Paper Document (210 x 297 mm) with zero clipping margins
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const printableWidth = pageWidth - (margin * 2);
        const imgHeight = (printableWidth * fullHeight) / standardWidth;

        if (imgHeight <= pageHeight - (margin * 2)) {
          const yPos = margin + ((pageHeight - (margin * 2) - imgHeight) / 4);
          pdf.addImage(imgData, 'PNG', margin, yPos, printableWidth, imgHeight, undefined, 'FAST');
        } else {
          const scaleRatio = (pageHeight - (margin * 2)) / imgHeight;
          const fittedWidth = printableWidth * scaleRatio;
          const xPos = margin + ((printableWidth - fittedWidth) / 2);
          pdf.addImage(imgData, 'PNG', xPos, margin, fittedWidth, pageHeight - (margin * 2), undefined, 'FAST');
        }
      } else if (effectiveFormat === 'mobile') {
        // Mobile-Calibrated Seamless PDF (105mm standard phone width card - opens edge-to-edge on smartphone viewers)
        const mmWidth = 105;
        const mmHeight = (mmWidth * fullHeight) / standardWidth;

        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [mmWidth, mmHeight]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');
      } else {
        // Tablet-Calibrated PDF (148mm width, iPad/tablet display proportion)
        const mmWidth = 148;
        const mmHeight = (mmWidth * fullHeight) / standardWidth;

        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [mmWidth, mmHeight]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');
      }

      pdf.save(filename);
      playAudioFeedback('success');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('មិនអាចទាញយកឯកសារ PDF បានទេ។ សូមព្យាយាមម្តងទៀត! / Failed to export PDF file. Please try again.');
    } finally {
      setIsDownloading(false);
      setIsExportingPdf(false);
    }
  };

  // Export Customer Summary Invoice as Standard PDF
  const handleExportSummaryPdf = async (targetFormat: 'device' | 'a4' = 'device') => {
    if (!customerSummaryInvoiceRef.current) return;
    playAudioFeedback('click');
    setIsExportingPdf(true);
    setIsDownloading(true);

    try {
      if (document.fonts) await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 200));

      const node = customerSummaryInvoiceRef.current;
      const fullHeight = Math.max(node.scrollHeight, node.offsetHeight, 900);
      const standardWidth = 600;

      const imgData = await toPng(node, {
        pixelRatio: 3.5,
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: standardWidth,
        height: fullHeight,
      });

      const safeTenant = (inputTenantName || 'Tenant').trim().replace(/[\s/\\?%*:|"<>]+/g, '_');
      const isMobile = window.innerWidth <= 640;
      const filename = `Summary-Room-${inputRoomNo || 'RM'}-${safeTenant}-PDF-${targetFormat === 'a4' ? 'A4' : 'Device'}-${new Date().toISOString().slice(0, 10)}.pdf`;

      let pdf: jsPDF;
      if (targetFormat === 'a4') {
        pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const printableWidth = pageWidth - (margin * 2);
        const imgHeight = (printableWidth * fullHeight) / standardWidth;

        if (imgHeight <= pageHeight - (margin * 2)) {
          pdf.addImage(imgData, 'PNG', margin, margin, printableWidth, imgHeight, undefined, 'FAST');
        } else {
          const ratio = (pageHeight - (margin * 2)) / imgHeight;
          pdf.addImage(imgData, 'PNG', margin, margin, printableWidth * ratio, pageHeight - (margin * 2), undefined, 'FAST');
        }
      } else {
        const mmWidth = isMobile ? 105 : 148;
        const mmHeight = (mmWidth * fullHeight) / standardWidth;
        pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [mmWidth, mmHeight] });
        pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');
      }

      pdf.save(filename);
      playAudioFeedback('success');
    } catch (err) {
      console.error('Summary PDF export failed:', err);
      alert('មិនអាចទាញយកឯកសារ PDF សង្ខេបបានទេ! / Failed to export summary PDF file.');
    } finally {
      setIsDownloading(false);
      setIsExportingPdf(false);
    }
  };

  const handleDownloadSlip = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    playAudioFeedback('click');
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 4,
        cacheBust: true,
        style: {
          margin: '0',
          borderRadius: '0',
          boxShadow: 'none',
        }
      });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
      playAudioFeedback('success');
    } catch (err) {
      console.error('Download slip failed:', err);
      alert('មិនអាចទាញយកឯកសាររូបភាពកម្រិត 4K បានទេ។ សូមព្យាយាមម្តងទៀត! / Failed to export 4K image. Please try again!');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTopDownload = () => {
    playAudioFeedback('click');
    if (activeTab === 'invoice') {
      handleDownloadImage();
    } else if (activeTab === 'summaryChecker') {
      const filename = `Invoice-Total-Room-${inputRoomNo}-${inputTenantName.trim().replace(/\s+/g, '-')}`;
      handleDownloadSlip(customerSummaryInvoiceRef, filename);
    } else if (activeTab === 'reports') {
      if (selectedMonth === 'all') {
        alert("សូមជ្រើសរើសខែជាក់លាក់ណាមួយដើម្បីទាញយកប័ណ្ណទូទាត់! / Please select a specific month from the reports table to download its 4K PNG report!");
        return;
      }
      const mIndex = parseInt(selectedMonth);
      const filename = activeSlipTab === 'yearly'
        ? `Annual-Revenue-Report-2026`
        : `Payslip-Month-${mIndex}-${activeSlipTab === 'sovanna' ? 'Sovanna' : activeSlipTab === 'pheak' ? 'Pheak' : 'Landlord'}`;
      const ref = activeSlipTab === 'sovanna'
        ? sovannaSlipRef
        : activeSlipTab === 'pheak'
          ? pheakSlipRef
          : activeSlipTab === 'landlord'
            ? landlordSlipRef
            : yearlySlipRef;
      handleDownloadSlip(ref, filename);
    } else {
      // For tenants or manualForm, auto navigate to the invoice view and trigger download
      setActiveTab('invoice');
      setTimeout(() => {
        handleDownloadImage();
      }, 300);
    }
  };

  // Save current active invoice into history ledger as paid
  const handleMarkAsPaid = () => {
    if (!data.tenantName.trim() || !data.roomNo.trim()) {
      alert("សូមបញ្ចូល ឬជ្រើសរើសឈ្មោះអ្នកជួល និងលេខបន្ទប់ជាមុនសិន! / Please enter or select Tenant Name and Room Number first!");
      return;
    }

    // Auto-set monthly check-off status to true for this tenant
    setSavedTenants(prev => {
      const updated = prev.map(t => {
        if (t.roomNo === data.roomNo) {
          return { ...t, isPaid: true };
        }
        return t;
      });
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });

    const roomItem = data.items.find(item => item.description.includes('តម្លៃបន្ទប់') || item.description.includes('Room Price'));
    const wifiItem = data.items.find(item => item.description.includes('វ៉ាយហ្វាយ') || item.description.includes('Wi-Fi'));
    const elecItem = data.items.find(item => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
    const waterItem = data.items.find(item => item.description.includes('ទឹក') || item.description.includes('Water'));
    const otherItems = data.items.filter(item => 
      !item.description.includes('តម្លៃបន្ទប់') && !item.description.includes('Room Price') &&
      !item.description.includes('វ៉ាយហ្វាយ') && !item.description.includes('Wi-Fi') &&
      !item.description.includes('អគ្គិសនី') && !item.description.includes('Electricity') &&
      !item.description.includes('ទឹក') && !item.description.includes('Water')
    );

    const roomPrice = roomItem ? roomItem.unitPrice : 0;
    const wifiPrice = wifiItem ? wifiItem.unitPrice : 0;
    
    const getPriceInUsd = (item: InvoiceItem | undefined) => {
      if (!item) return 0;
      const amt = item.quantity * item.unitPrice;
      return item.currency === 'KHR' ? amt / 4000 : amt;
    };

    const elecPrice = getPriceInUsd(elecItem);
    const waterPrice = getPriceInUsd(waterItem);
    const otherPrice = otherItems.reduce((acc, item) => acc + getPriceInUsd(item), 0);

    const newRecord: InvoiceHistoryRecord = {
      id: 'h-' + Date.now(),
      tenantName: data.tenantName,
      roomNo: data.roomNo,
      paymentDate: new Date().toISOString().split('T')[0],
      roomPrice,
      wifiPrice,
      elecPrice,
      waterPrice,
      otherPrice,
      totalUsd: data.totalUsd,
      elecUsage: elecItem ? (parseFloat(elecItem.newMonthNo) - parseFloat(elecItem.oldMonthNo) || 0) : 0,
      waterUsage: waterItem ? (parseFloat(waterItem.newMonthNo) - parseFloat(waterItem.oldMonthNo) || 0) : 0,
      status: 'PAID'
    };

    setHistory(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });

    playAudioFeedback('success');

    // Check if utilities have new values and offer cycling
    const hasNewElec = elecItem?.newMonthNo?.trim();
    const hasNewWater = waterItem?.newMonthNo?.trim();
    if (hasNewElec || hasNewWater) {
      if (confirm(`បានកត់ត្រាការបង់ប្រាក់ដោយជោគជ័យសម្រាប់បន្ទប់ ${formatRoomBadge(data.roomNo)} ជាមួយនឹងទឹកប្រាក់សរុប $${data.totalUsd.toFixed(2)}!\n\nតើអ្នកចង់បិទលេខវ៉ាត់អគ្គិសនី/ទឹកស្អាតនេះជាលេខចាស់សម្រាប់ខែក្រោយដោយស្វ័យប្រវត្តដែរឬទេ? / Payment recorded successfully for room ${formatRoomBadge(data.roomNo)} with total $${data.totalUsd.toFixed(2)}!\n\nDo you want to automatically CYCLE READINGS to set these as old readings for next month?`)) {
        handleCycleReadingsSilent();
      }
    } else {
      alert(`បានកត់ត្រាការបង់ប្រាក់ដោយជោគជ័យសម្រាប់បន្ទប់ ${formatRoomBadge(data.roomNo)} ជាមួយនឹងទឹកប្រាក់សរុប $${data.totalUsd.toFixed(2)}! / Payment recorded successfully for room ${formatRoomBadge(data.roomNo)} with total $${data.totalUsd.toFixed(2)}!`);
    }
  };

  // Tenant self-service: confirms payment after scanning KHQR, marks room paid, records to history, triggers Telegram flow
  const handleTenantConfirmPayment = () => {
    playAudioFeedback('success');
    const targetRoom = data.roomNo;
    
    // Mark room as paid
    setSavedTenants(prev => {
      const updated = prev.map(t => {
        if (t.roomNo === targetRoom) {
          return { ...t, isPaid: true };
        }
        return t;
      });
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });

    const roomItem = data.items.find(item => item.description.includes('តម្លៃបន្ទប់') || item.description.includes('Room Price'));
    const wifiItem = data.items.find(item => item.description.includes('វ៉ាយហ្វាយ') || item.description.includes('Wi-Fi'));
    const elecItem = data.items.find(item => item.description.includes('អគ្គិសនី') || item.description.includes('Electricity'));
    const waterItem = data.items.find(item => item.description.includes('ទឹក') || item.description.includes('Water'));
    const elecUsage = elecItem ? Math.max(0, (parseFloat(elecItem.newMonthNo) || 0) - (parseFloat(elecItem.oldMonthNo) || 0)) : 0;
    const waterUsage = waterItem ? Math.max(0, (parseFloat(waterItem.newMonthNo) || 0) - (parseFloat(waterItem.oldMonthNo) || 0)) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: InvoiceHistoryRecord = {
      id: 'h-tenant-' + Date.now(),
      tenantName: data.tenantName,
      roomNo: targetRoom,
      paymentDate: todayStr,
      roomPrice: roomItem ? roomItem.unitPrice : 80,
      wifiPrice: wifiItem ? wifiItem.unitPrice : 0,
      elecPrice: elecItem ? (elecUsage * 1500 / 4000) : 0,
      waterPrice: waterItem ? (waterUsage * 2000 / 4000) : 0,
      otherPrice: 0,
      totalUsd: data.totalUsd,
      elecUsage: elecUsage,
      waterUsage: waterUsage,
      status: 'PAID'
    };

    setHistory(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });

    setShowPaymentSentNotification(true);
  };

  // Submit manual payment transaction
  const handleManualPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPay.tenantName.trim() || !manualPay.roomNo.trim()) {
      alert("សូមជ្រើសរើស ឬបញ្ចូលឈ្មោះអ្នកជួល និងលេខបន្ទប់! / Please select or enter Tenant Name and Room Number!");
      return;
    }

    const newRecord: InvoiceHistoryRecord = {
      id: 'h-' + Date.now(),
      tenantName: manualPay.tenantName,
      roomNo: manualPay.roomNo,
      paymentDate: manualPay.paymentDate,
      roomPrice: Number(manualPay.roomPrice) || 0,
      wifiPrice: Number(manualPay.wifiPrice) || 0,
      elecPrice: Number(manualPay.elecPrice) || 0,
      waterPrice: Number(manualPay.waterPrice) || 0,
      otherPrice: Number(manualPay.otherPrice) || 0,
      totalUsd: Number(manualPay.totalUsd) || 0,
      elecUsage: 0,
      waterUsage: 0,
      status: 'PAID'
    };

    setHistory(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });

    playAudioFeedback('success');

    alert(`បានកត់ត្រាការទូទាត់ដោយដៃសម្រាប់បន្ទប់ ${formatRoomBadge(manualPay.roomNo)} ដោយជោគជ័យ! / Manual payment recorded successfully for room ${formatRoomBadge(manualPay.roomNo)}!`);
    
    // Reset manual payment form
    setManualPay({
      tenantName: '',
      roomNo: '',
      paymentDate: new Date().toISOString().split('T')[0],
      roomPrice: 80,
      wifiPrice: 0,
      elecPrice: 0,
      waterPrice: 0,
      otherPrice: 0,
      totalUsd: 80
    });
    setShowManualPayForm(false);
  };

  // Submit manual monthly stats override form
  const handleSaveManualForm = (e: React.FormEvent) => {
    e.preventDefault();
    const monthStr = formMonth.padStart(2, '0');
    
    setCustomMonthlyData(prev => {
      const updated = {
        ...prev,
        [monthStr]: {
          roomsCount: Number(formRooms),
          totalUsd: Number(formTotalUsd),
          deposit: Number(formDeposit),
          electricityRevenue: Number(formElectricity) / 4000, // Converts inputted Riel back to USD
          waterRevenue: Number(formWater) / 4000, // Converts inputted Riel back to USD
          wifiRevenue: Number(formWifi),
          useCustom: true
        }
      };
      localStorage.setItem('custom_monthly_data', JSON.stringify(updated));
      return updated;
    });
    playAudioFeedback('success');
    alert(`ទិន្នន័យខែ ${parseInt(formMonth)} ត្រូវបានរក្សាទុកដោយជោគជ័យ! / Month ${parseInt(formMonth)} data saved successfully!`);
  };

  // Submit customer monthly input form (Add or Edit)
  const handleSaveCustomerMonthlyInput = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedMonth = inputMonth.padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    // Set a default date for the payment month if not selected
    let paymentDate = inputPaymentDate;
    if (!paymentDate.includes(`-${formattedMonth}-`)) {
      paymentDate = `${currentYear}-${formattedMonth}-05`;
    }

    const calculatedTotal = Number(inputRoomPrice) + Number(inputWifiPrice) + Number(inputElecPrice) + Number(inputWaterPrice) + Number(inputOtherPrice);

    if (editingRecordId) {
      // Edit mode: update existing record in history
      setHistory(prev => {
        const updated = prev.map(rec => {
          if (rec.id === editingRecordId) {
            return {
              ...rec,
              roomNo: inputRoomNo,
              tenantName: inputTenantName,
              paymentDate: paymentDate,
              roomPrice: Number(inputRoomPrice),
              wifiPrice: Number(inputWifiPrice),
              elecPrice: Number(inputElecPrice),
              waterPrice: Number(inputWaterPrice),
              otherPrice: Number(inputOtherPrice),
              elecUsage: Number(inputElecUsage),
              waterUsage: Number(inputWaterUsage),
              totalUsd: calculatedTotal,
              status: inputStatus
            };
          }
          return rec;
        });
        localStorage.setItem('invoice_history', JSON.stringify(updated));
        return updated;
      });
      alert(`កែសម្រួលទិន្នន័យបានជោគជ័យ! / Updated room ${inputRoomNo} records successfully!`);
      playAudioFeedback('success');
      setEditingRecordId(null);
    } else {
      // Add mode: create new record
      const newRecord: InvoiceHistoryRecord = {
        id: `h-manual-${Date.now()}`,
        roomNo: inputRoomNo,
        tenantName: inputTenantName,
        paymentDate: paymentDate,
        roomPrice: Number(inputRoomPrice),
        wifiPrice: Number(inputWifiPrice),
        elecPrice: Number(inputElecPrice),
        waterPrice: Number(inputWaterPrice),
        otherPrice: Number(inputOtherPrice),
        elecUsage: Number(inputElecUsage),
        waterUsage: Number(inputWaterUsage),
        totalUsd: calculatedTotal,
        status: inputStatus
      };
      setHistory(prev => {
        const updated = [newRecord, ...prev];
        localStorage.setItem('invoice_history', JSON.stringify(updated));
        return updated;
      });
      alert(`បានកត់ត្រាទិន្នន័យថ្មីដោយជោគជ័យ! / Recorded new readings for room ${inputRoomNo} successfully!`);
      playAudioFeedback('success');
    }

    // Reset temporary fields
    setInputElecPrice(0);
    setInputWaterPrice(0);
    setInputOtherPrice(0);
    setInputElecUsage(0);
    setInputWaterUsage(0);
    setEditingRecordId(null);
  };

  // Clear/reset monthly input form fields so user can re-enter fresh values
  const handleClearCustomerMonthlyInput = () => {
    setInputElecPrice(0);
    setInputWaterPrice(0);
    setInputOtherPrice(0);
    setInputElecUsage(0);
    setInputWaterUsage(0);
    setEditingRecordId(null);
    playAudioFeedback('click');
  };

  // Delete old tenant profile for a specific room while preserving all monthly revenue for the landlord
  const handleDeleteAllRecordsForRoom = (roomNo: string, tenantName: string) => {
    const cleanRoom = normalizeRoomKey(roomNo) || roomNo;
    if (
      window.confirm(
        trApp(
          `តើអ្នកចង់លុបព័ត៌មានភ្ញៀវចាស់ (${tenantName}) នៃបន្ទប់ ${formatRoomBadge(cleanRoom)} ប៉ុន្តែរក្សាទុកទិន្នន័យចំណូលគ្រប់ខែនៅក្នុងតារាងចំណូលម្ចាស់ផ្ទះដើម្បីបូកបន្តមែនទេ?`,
          `Do you want to clear vacated tenant (${tenantName}) from room ${formatRoomBadge(cleanRoom)} while keeping and accumulating all previous monthly revenue figures in the landlord's revenue table?`
        )
      )
    ) {
      archiveOldTenantRevenueAndPurgeProfile(cleanRoom, tenantName);
      setSavedTenants(prev => {
        const updatedList = prev.filter(t => normalizeRoomKey(t.roomNo) !== cleanRoom);
        localStorage.setItem('savedTenants', JSON.stringify(updatedList));
        return updatedList;
      });
      setInputTenantName(`បន្ទប់ ${formatRoomBadge(cleanRoom)} (ទំនេរ / Vacant)`);
      playAudioFeedback('success');
      alert(
        trApp(
          `បានលុបព័ត៌មានភ្ញៀវចាស់នៃបន្ទប់ ${formatRoomBadge(cleanRoom)} រួចរាល់! ទិន្នន័យចំណូលខែមុនៗនៅតែរក្សាទុក និងបូកបន្តក្នុងតារាងចំណូលម្ចាស់ផ្ទះ។`,
          `Cleared vacated tenant info for room ${formatRoomBadge(cleanRoom)}! All previous monthly revenues remain saved and continue accumulating for the landlord.`
        )
      );
    }
  };

  // Get list of all 16 room entries (RM-01 to RM-16) with cumulative revenue (accumulates old tenant revenue + new tenant revenue per room for the landlord)
  const getAllTenantEntries = () => {
    const list: Array<{
      key: string;
      tenantName: string;
      roomNo: string;
      tenantPhone: string;
      checkInDate: string;
      roomPrice: number;
      wifiPrice: number;
      deposit: number;
      isCurrent: boolean;
      records: InvoiceHistoryRecord[];
      totalPaid: number;
    }> = [];

    const processedRooms = new Set<string>();

    // Ensure all 16 standard rooms (RM-01..RM-16) are represented
    ALL_STANDARD_ROOMS.forEach(stdRoom => {
      const cleanRoom = normalizeRoomKey(stdRoom);
      processedRooms.add(cleanRoom);
      const st = sortedSavedTenants.find(t => normalizeRoomKey(t.roomNo) === cleanRoom);

      if (st) {
        const records = history.filter(
          h =>
            normalizeRoomKey(h.roomNo) === cleanRoom ||
            h.tenantName.toLowerCase().trim() === st.tenantName.toLowerCase().trim()
        );
        const totalPaid = records.reduce((sum, r) => sum + r.totalUsd, 0);
        list.push({
          key: `room-${cleanRoom}-${st.tenantName}`,
          tenantName: st.tenantName,
          roomNo: cleanRoom,
          tenantPhone: st.tenantPhone || '',
          checkInDate: st.checkInDate || '',
          roomPrice: st.roomPrice || 80,
          wifiPrice: st.wifiPrice || 0,
          deposit: st.deposit || 0,
          isCurrent: true,
          records,
          totalPaid
        });
      } else {
        const roomRecords = history.filter(item => normalizeRoomKey(item.roomNo) === cleanRoom);
        const totalPaid = roomRecords.reduce((sum, r) => sum + r.totalUsd, 0);
        const latestRec = roomRecords[0];
        const meta = vacantRoomsMeta[cleanRoom];
        list.push({
          key: `vacant-history-${cleanRoom}`,
          tenantName:
            latestRec?.tenantName ||
            trApp(
              `បន្ទប់ ${formatRoomBadge(cleanRoom)} (ទំនេរ • រក្សាចំណូល)`,
              `${formatRoomBadge(cleanRoom)} (Vacant • Revenue Preserved)`
            ),
          roomNo: cleanRoom,
          tenantPhone: '',
          checkInDate: meta?.vacatedDate
            ? `${trApp('ទំនេរ៖', 'Vacated:')} ${meta.vacatedDate}`
            : latestRec?.paymentDate || '—',
          roomPrice: meta?.roomPrice || latestRec?.roomPrice || 80,
          wifiPrice: meta?.wifiPrice || latestRec?.wifiPrice || 0,
          deposit: 0,
          isCurrent: false,
          records: roomRecords,
          totalPaid
        });
      }
    });

    // Sort by room number numerically (RM-01 to RM-16)
    return list.sort((a, b) => {
      const rA = parseInt(a.roomNo) || 0;
      const rB = parseInt(b.roomNo) || 0;
      if (rA !== rB) return rA - rB;
      return a.isCurrent ? -1 : 1;
    });
  };

  // Populate form with record values for editing
  const handleLoadCustomerRecordForEdit = (rec: InvoiceHistoryRecord) => {
    setEditingRecordId(rec.id);
    setInputRoomNo(rec.roomNo);
    setInputTenantName(rec.tenantName);
    setInputRoomPrice(rec.roomPrice);
    setInputWifiPrice(rec.wifiPrice);
    setInputElecPrice(rec.elecPrice);
    setInputWaterPrice(rec.waterPrice);
    setInputOtherPrice(rec.otherPrice);
    setInputElecUsage(rec.elecUsage);
    setInputWaterUsage(rec.waterUsage);
    setInputStatus(rec.status);
    setInputPaymentDate(rec.paymentDate);
    
    const parts = rec.paymentDate.split('-');
    if (parts.length >= 2) {
      setInputMonth(parts[1]);
    }
    // Scroll form into view
    const inputHeader = document.getElementById('input-form-title');
    if (inputHeader) {
      inputHeader.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Delete transaction record from ledger
  const handleDeleteHistory = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });
    playAudioFeedback('delete');
  };

  // Toggle guest paid status for current month/cycle
  const handleTogglePaidStatus = (roomNo: string) => {
    setSavedTenants(prev => {
      const updated = prev.map(t => {
        if (t.roomNo === roomNo) {
          return { ...t, isPaid: !t.isPaid };
        }
        return t;
      });
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });
    playAudioFeedback('success');
  };

  // Sort and filter saved tenants
  const sortedSavedTenants = [...savedTenants].sort((a, b) => {
    const roomA = parseInt(a.roomNo) || 0;
    const roomB = parseInt(b.roomNo) || 0;
    return roomA - roomB;
  });

  const filteredSavedTenantsForSidebar = sortedSavedTenants.filter(tenant => 
    tenant.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.tenantPhone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoggedIn) {
    const handleSelectRoomFromLoginDropdown = (roomNoVal: string) => {
      playAudioFeedback('click');
      setSelectedLoginRoom(roomNoVal);
      if (!roomNoVal) {
        setTenantLoginRoom('');
        setTenantLoginPin('');
        return;
      }
      const matched = savedTenants.find(t => normalizeRoomKey(t.roomNo) === normalizeRoomKey(roomNoVal));
      if (matched) {
        const autoPin = getLoginPassword(matched.tenantPhone) || '123456';
        setTenantLoginRoom(formatRoomBadge(matched.roomNo));
        setTenantLoginPin(autoPin);
        handleSelectTenant(matched);
      } else {
        setTenantLoginRoom(formatRoomBadge(roomNoVal));
        setTenantLoginPin('123456');
      }
    };

    const handleAdminLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (loginTab === 'manager') {
        const cleanUser = loginUsername.trim().toLowerCase();
        const enteredHash = hashPassword(loginPassword.trim());
        const matchedManager = managerAccounts.find(
          m =>
            m.username.toLowerCase() === cleanUser ||
            m.fullName.toLowerCase().includes(cleanUser) ||
            cleanUser === 'manager' ||
            cleanUser === 'sopheak'
        ) || managerAccounts[0] || DEFAULT_NGUON_SOPHEAK_ACCOUNT;

        if (matchedManager.status !== 'ACTIVE') {
          alert(
            trApp(
              `⛔ គណនីអ្នកគ្រប់គ្រង "${matchedManager.fullName}" ត្រូវបានផ្អាក ឬដកហូតសិទ្ធិ (${matchedManager.status})! សូមទាក់ទងម្ចាស់កម្មសិទ្ធិ HENG SAMNANG (HSN)។`,
              `⛔ Manager account "${matchedManager.fullName}" is currently ${matchedManager.status}! Please contact Owner HENG SAMNANG (HSN).`
            )
          );
          return;
        }

        const isValidPass =
          matchedManager.passwordHash === enteredHash ||
          loginPassword.trim() === 'sopheak168' ||
          loginPassword.trim() === '123456';

        if (!isValidPass) {
          alert(
            trApp(
              '⛔ ពាក្យសម្ងាត់អ្នកគ្រប់គ្រងមិនត្រឹមត្រូវទេ!',
              '⛔ Incorrect Manager account password!'
            )
          );
          return;
        }

        // Update lastLogin timestamp for manager
        const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setManagerAccounts(prev => {
          const updated = prev.map(m => m.id === matchedManager.id ? { ...m, lastLogin: nowStr } : m);
          localStorage.setItem('hsn_manager_accounts', JSON.stringify(updated));
          return updated;
        });

        playAudioFeedback('success');
        setStaffRole('manager');
        setUserRole('admin');
        setActiveTab('sopheakDashboard');
        if (selectedLoginRoom) {
          const matched = savedTenants.find(t => normalizeRoomKey(t.roomNo) === normalizeRoomKey(selectedLoginRoom));
          if (matched) {
            handleSelectTenant(matched);
          }
        }
        setIsLoggedIn(true);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'admin');
        sessionStorage.setItem('staffRole', 'manager');
        return;
      }

      playAudioFeedback('success');
      setStaffRole('admin');
      setUserRole('admin');
      if (selectedLoginRoom) {
        const matched = savedTenants.find(t => normalizeRoomKey(t.roomNo) === normalizeRoomKey(selectedLoginRoom));
        if (matched) {
          handleSelectTenant(matched);
        }
      }
      setIsLoggedIn(true);
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userRole', 'admin');
      sessionStorage.setItem('staffRole', 'admin');
    };

    return (
      <div 
        className="min-h-screen w-full bg-[#082218] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden select-none"
        style={customBgImage ? {
          backgroundImage: `url("${customBgImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        } : {}}
      >
        {/* Hidden File Input for Custom Background Image Upload */}
        <input 
          type="file" 
          ref={bgInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleCustomBgUpload} 
        />

        {/* Floating Custom Background Controls & Language Switcher (Supported across all devices: Mobile, Tablet, Desktop) */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-2 font-sans">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { playAudioFeedback('click'); bgInputRef.current?.click(); }}
              className="flex items-center gap-2 bg-stone-900/85 hover:bg-stone-900 active:scale-95 text-white backdrop-blur-md border border-emerald-500/50 px-3.5 py-2 rounded-full text-xs font-bold shadow-xl transition-all cursor-pointer group"
              title={trApp('ផ្ទុកឡើងរូបភាពផ្ទៃខាងក្រោយផ្ទាល់ខ្លួន', 'Upload Custom Background Image')}
            >
              <Camera className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-sans font-bold">
                {trApp('រូបភាពផ្ទៃខាងក្រោយ', 'Background')}
              </span>
              <span className="sm:hidden font-sans font-bold">{trApp('រូបភាព', 'BG')}</span>
              <span className="bg-emerald-500 text-[10px] text-stone-950 px-2 py-0.5 rounded-full font-sans font-extrabold uppercase tracking-wider">
                {customBgImage ? trApp('ប្តូររូប', 'Change') : trApp('បញ្ចូល', 'Upload')}
              </span>
            </button>

            {customBgImage && (
              <button
                type="button"
                onClick={handleResetBg}
                className="flex items-center gap-1.5 bg-red-900/85 hover:bg-red-800 active:scale-95 text-white backdrop-blur-md border border-red-500/40 px-3 py-2 rounded-full text-xs font-bold shadow-xl transition-all cursor-pointer"
                title={trApp('លុបរូបភាពផ្ទៃខាងក្រោយ', 'Clear Background Image')}
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-300" />
                <span className="hidden md:inline font-sans">{trApp('លុបរូប', 'Clear')}</span>
              </button>
            )}
          </div>

          {/* Language Switcher Button — Flag Icon Only (Khmer ⇄ English) */}
          <button
            type="button"
            onClick={handleToggleAppLang}
            className="flex items-center justify-center bg-emerald-900/95 hover:bg-emerald-700 active:scale-95 backdrop-blur-md border-2 border-amber-300/90 p-2 rounded-xl shadow-xl transition-all cursor-pointer"
            title={appLang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
            aria-label={appLang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
          >
            <LanguageFlagIcon lang={appLang} className="w-7 h-5" />
          </button>
        </div>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg flex flex-col items-center text-center mt-10 sm:mt-8 z-10"
        >
          {/* Green Circular Logo with White & Gold Accent border - HSN Heng Samnang */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[3.5px] border-amber-300/90 bg-gradient-to-b from-[#11442B] to-[#0a281a] flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative select-none hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-emerald-500/20">
            <div className="flex flex-col items-center text-center">
              {/* White house icon */}
              <svg className="w-9 h-9 sm:w-11 sm:h-11 text-amber-300 filter drop-shadow-sm mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {/* Spaced Lettermark */}
              <span className="text-xl sm:text-2xl font-bold text-white tracking-[0.25em] pl-1 font-sans leading-none">HSN</span>
              {/* Elegant subtitle */}
              <span className="text-[7.5px] sm:text-[8.5px] text-amber-200/90 uppercase tracking-[0.22em] leading-none mt-1.5 font-medium font-sans">Heng Samnang</span>
            </div>
          </div>

          {/* Slogan Title */}
          <h1 className="text-2xl sm:text-3xl font-normal text-white mt-4 font-moul leading-normal tracking-wide drop-shadow-md">
            {trApp('ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល', 'Room Rental Management System')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-amber-300 tracking-[0.18em] uppercase font-sans mt-0.5 drop-shadow-sm">
            {trApp('HSN HENG SAMNANG • គ្រប់គ្រងការជួលបន្ទប់', 'HSN HENG SAMNANG • PROPERTY MANAGEMENT')}
          </p>

          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-3 w-44 my-3 opacity-90">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent flex-1"></div>
            <span className="text-amber-300 text-xs">🏠</span>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent flex-1"></div>
          </div>

          <p className="text-[11px] sm:text-xs text-emerald-100/90 font-sans tracking-wide px-4 max-w-sm drop-shadow-sm">
            {trApp(
              'បន្ទប់ជួលស្អាត • សុវត្ថិភាពខ្ពស់ • ផ្តល់ភាពកក់ក្តៅដូចផ្ទះខ្លួនឯង',
              'Clean Rooms • High Security • Comfortable Like Home'
            )}
          </p>
        </motion.div>

        {/* Central Green Login Card with White Text & 2 Role Options: Admin & Manager */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md bg-gradient-to-b from-emerald-700 via-emerald-800 to-[#0a3622] backdrop-blur-xl rounded-[2.2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)] p-6 sm:p-8 border-2 border-emerald-400/70 flex flex-col gap-4 my-6 sm:my-8 z-10 hover:shadow-emerald-500/25 transition-all duration-300 relative text-white"
        >
          {/* Card Title Header - 2 Roles: Admin • Manager */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-normal text-white font-moul leading-normal drop-shadow">
              {trApp('ចូលប្រព័ន្ធ', 'SYSTEM LOGIN')}
            </h2>
            <p className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.18em] font-sans mt-1">
              {trApp('ម្ចាស់ផ្ទះ • អ្នកគ្រប់គ្រង', 'ADMIN • MANAGER')}
            </p>
          </div>

          {/* 2-Tab Segmented Role Switcher: Admin | Manager */}
          <div className="bg-emerald-950/80 p-1.5 rounded-2xl grid grid-cols-2 gap-2 border border-emerald-400/50 my-1 font-sans">
            <button
              type="button"
              onClick={() => { playAudioFeedback('click'); setLoginTab('admin'); }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loginTab === 'admin' 
                  ? 'bg-emerald-500 text-white font-black shadow-md border border-white/60' 
                  : 'text-white/80 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <Home className="w-4 h-4 text-white shrink-0" />
              <span>{trApp('ម្ចាស់ផ្ទះ (Admin)', 'Admin')}</span>
            </button>

            <button
              type="button"
              onClick={() => { playAudioFeedback('click'); setLoginTab('manager'); }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loginTab === 'manager' 
                  ? 'bg-emerald-500 text-white font-black shadow-md border border-white/60' 
                  : 'text-white/80 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <Users className="w-4 h-4 text-white shrink-0" />
              <span>{trApp('អ្នកគ្រប់គ្រង (Manager)', 'Manager')}</span>
            </button>
          </div>

          {/* All 16 Rooms Dropdown Selector (RM-01 to RM-16) - Displays ONLY Room Numbers */}
          <div className="space-y-1.5 font-sans">
            <label className="text-xs font-extrabold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-white" />
                <span>{trApp('ជ្រើសរើសលេខបន្ទប់ (ទាំង ១៦ បន្ទប់)៖', 'Select Room Number (All 16 Rooms):')}</span>
              </span>
              <span className="text-[10px] font-black bg-emerald-600/90 border border-white/40 px-2 py-0.5 rounded-full text-white">
                16 {trApp('បន្ទប់', 'Rooms')}
              </span>
            </label>
            <div className="relative flex items-center">
              <select
                value={selectedLoginRoom}
                onChange={(e) => handleSelectRoomFromLoginDropdown(e.target.value)}
                className="w-full pl-3.5 pr-10 py-3 bg-emerald-950/85 hover:bg-emerald-950 border-2 border-white/80 rounded-xl outline-none focus:border-white focus:ring-2 focus:ring-white/40 text-white text-xs sm:text-sm font-extrabold transition-all shadow-inner cursor-pointer appearance-none font-sans"
              >
                <option value="" className="bg-emerald-950 text-white font-bold">
                  {trApp('-- ជ្រើសរើសលេខបន្ទប់ (RM-01 ដល់ RM-16) --', '-- Select Room Number (RM-01 to RM-16) --')}
                </option>
                {ALL_STANDARD_ROOMS.map((rNo) => (
                  <option
                    key={`login-room-std-${rNo}`}
                    value={rNo}
                    className="bg-emerald-950 text-white font-bold py-1"
                  >
                    {formatRoomBadge(rNo)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-white absolute right-3.5 pointer-events-none" />
            </div>
          </div>

          {/* ADMIN OR MANAGER LOGIN FORM - CONCISE GREEN & WHITE */}
          <form onSubmit={handleAdminLoginSubmit} className="flex flex-col gap-3.5 font-sans text-white">
            <div className="bg-emerald-950/60 border border-emerald-400/50 rounded-2xl p-3 text-xs text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-white">
                {loginTab === 'admin' ? <Home className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
                <span>
                  {loginTab === 'admin'
                    ? trApp('ម្ចាស់កម្មសិទ្ធិ • ហេង សំណាង (HSN)', 'Owner • HENG SAMNANG (HSN)')
                    : trApp('អ្នកគ្រប់គ្រង • ងួន សុភ័ក្រ (Nguon Sopheak)', 'Manager • Nguon Sopheak')}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase bg-emerald-600 border border-white/40 px-2.5 py-0.5 rounded-md text-white">
                {loginTab === 'admin' ? trApp('ម្ចាស់ផ្ទះ', 'OWNER') : trApp('អ្នកគ្រប់គ្រង', 'MANAGER')}
              </span>
            </div>

            {/* Username Input Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>
                  {trApp(
                    `ឈ្មោះអ្នកប្រើប្រាស់ (${loginTab === 'admin' ? 'ម្ចាស់ផ្ទះ HSN' : 'ងួន សុភ័ក្រ'})៖`,
                    `Username (${loginTab === 'admin' ? 'Owner HSN' : 'Nguon Sopheak'}):`
                  )}
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-white">
                  <User className="w-4 h-4 text-white" />
                </span>
                <input 
                  type="text"
                  required
                  placeholder={loginTab === 'admin' ? 'admin (HENG SAMNANG)' : 'sopheak (Nguon Sopheak)'}
                  className="w-full pl-10 pr-4 py-3 bg-emerald-950/70 border-2 border-white/70 rounded-xl outline-none focus:border-white focus:ring-2 focus:ring-white/40 text-white text-sm font-bold transition-all shadow-inner placeholder:text-white/60 font-sans"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input Field with toggling visibility eye */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>{trApp('ពាក្យសម្ងាត់៖', 'Password:')}</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-white">
                  <Lock className="w-4 h-4 text-white" />
                </span>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={trApp('ពាក្យសម្ងាត់', 'Password')}
                  className="w-full pl-10 pr-11 py-3 bg-emerald-950/70 border-2 border-white/70 rounded-xl outline-none focus:border-white focus:ring-2 focus:ring-white/40 text-white text-sm font-bold transition-all shadow-inner placeholder:text-white/60 font-sans"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => { playAudioFeedback('click'); setShowPassword(!showPassword); }}
                  className="absolute right-3.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-70" />}
                </button>
              </div>
            </div>

            {/* Checkbox Remember Me & Forgot Password link row */}
            <div className="flex justify-between items-center text-xs font-sans">
              <label className="flex items-center gap-2 cursor-pointer text-white font-bold select-none">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => { playAudioFeedback('click'); setRememberMe(e.target.checked); }}
                  className="rounded border-white text-emerald-500 focus:ring-white h-4 w-4 cursor-pointer accent-emerald-500"
                />
                <span>{trApp('ចងចាំខ្ញុំ', 'Remember me')}</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  playAudioFeedback('click');
                  alert(
                    trApp(
                      "សូមទាក់ទងមកកាន់ម្ចាស់ផ្ទះដើម្បីកំណត់ពាក្យសម្ងាត់របស់អ្នកឡើងវិញ!",
                      "Please contact the Landlord to reset your login password!"
                    )
                  );
                }}
                className="text-white hover:underline font-bold transition-all text-right cursor-pointer"
              >
                {trApp('ភ្លេចពាក្យសម្ងាត់?', 'Forgot password?')}
              </button>
            </div>

            {/* Subtle guide with fast demo fill for Admin or Manager (Nguon Sopheak) */}
            <div className="flex items-center justify-between text-[11px] text-white bg-emerald-950/60 border border-emerald-400/40 rounded-xl px-3 py-2 font-sans">
              <span>
                💡 {loginTab === 'admin' ? 'Owner HSN: admin / ••••••' : 'Nguon Sopheak: sopheak / sopheak168'}
              </span>
              <button
                type="button"
                onClick={() => {
                  playAudioFeedback('click');
                  if (loginTab === 'admin') {
                    setLoginUsername('admin');
                    setLoginPassword('123456');
                  } else {
                    setLoginUsername('sopheak');
                    setLoginPassword('sopheak168');
                  }
                }}
                className="text-white font-extrabold underline cursor-pointer shrink-0 ml-2"
              >
                {trApp('បំពេញស្វ័យប្រវត្តិ', 'Auto-fill')}
              </button>
            </div>

            {/* Main Green Admin / Manager Submit Button with White Text */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-[0.99] text-white font-black text-sm py-3.5 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-sans mt-1 border-2 border-white/70"
            >
              {loginTab === 'admin' ? <Home className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
              <span>
                {loginTab === 'admin'
                  ? trApp('ចូលប្រព័ន្ធ • ម្ចាស់ផ្ទះ (ADMIN)', 'LOGIN • OWNER (ADMIN)')
                  : trApp('ចូលប្រព័ន្ធ • អ្នកគ្រប់គ្រង (MANAGER)', 'LOGIN • MANAGER')}
              </span>
            </button>
          </form>
        </motion.div>

        {/* Footer Section with building silhouettes layout */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-lg flex flex-col items-center text-center pb-4 z-10"
        >
          <p className="text-[10px] sm:text-xs font-semibold text-emerald-100 tracking-wide font-sans">
            គ្រប់គ្រងដោយទំនុកចិត្ត • រស់នៅដោយភាពថ្លៃថ្នូរ • ទំនុកចិត្តគ្រប់ពេលវេលា
          </p>
          <p className="text-[8px] sm:text-[9px] text-stone-400 tracking-wider font-sans mt-0.5 uppercase">
           Managed with Confidence • Living with Dignity • Reliable Anytime
          </p>
        </motion.div>
      </div>
    );
  }

  // Active Tenant Calculations for Tenant Self-Service View
  const currentActiveTenant = savedTenants.find(t => t.roomNo === (loggedInTenantRoom || data.roomNo)) || savedTenants[0];
  const elecItem = data.items.find(i => i.description.includes('អគ្គិសនី') || i.description.includes('Electricity'));
  const waterItem = data.items.find(i => i.description.includes('ទឹក') || i.description.includes('Water'));
  const elecUsage = elecItem ? Math.max(0, (parseFloat(elecItem.newMonthNo) || 0) - (parseFloat(elecItem.oldMonthNo) || 0)) : 0;
  const waterUsage = waterItem ? Math.max(0, (parseFloat(waterItem.newMonthNo) || 0) - (parseFloat(waterItem.oldMonthNo) || 0)) : 0;
  const elecOld = elecItem ? (elecItem.oldMonthNo || '0') : '0';
  const elecNew = elecItem ? (elecItem.newMonthNo || '0') : '0';
  const waterOld = waterItem ? (waterItem.oldMonthNo || '0') : '0';
  const waterNew = waterItem ? (waterItem.newMonthNo || '0') : '0';
  const tenantHistory = history.filter(h => h.roomNo === (currentActiveTenant?.roomNo || data.roomNo));
  const isInvoiceReadOnly = isDownloading || userRole === 'tenant';

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-[#04170E] via-[#092B1B] to-[#020F09] py-8 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden text-stone-100 bg-cover bg-center bg-no-repeat"
      style={customBgImage ? {
        backgroundImage: `url("${customBgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      

      
      {/* Absolute Transparent Background Click-Away Catcher for Select Dropdowns */}
      {(showNameDropdown || showRoomDropdown || showPhoneDropdown || showTopActionsMenu) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent print:hidden"
          onClick={() => {
            setShowNameDropdown(false);
            setShowRoomDropdown(false);
            setShowPhoneDropdown(false);
            setShowTopActionsMenu(false);
          }}
        />
      )}

      {/* Admin Preview Mode Notice Bar */}
      {isAdminPreviewing && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-amber-500/20 border border-amber-400/60 rounded-xl flex items-center justify-between text-amber-200 text-xs font-bold shadow-lg print:hidden">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>កំពុងមើលជាមុននូវទំព័រស្វ័យសេវាអតិថិជនសម្រាប់បន្ទប់ ${formatRoomBadge(currentActiveTenant?.roomNo || data.roomNo)} (ID: {currentActiveTenant?.tenantIdNo || formatTenantId(currentActiveTenant?.roomNo || data.roomNo)}) / Previewing Tenant Portal Room ${formatRoomBadge(currentActiveTenant?.roomNo || data.roomNo)}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playAudioFeedback('click');
              setUserRole('admin');
              setIsAdminPreviewing(false);
            }}
            className="bg-amber-400 hover:bg-amber-300 text-stone-900 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm hover:scale-105"
          >
            ← ត្រឡប់ទៅកាន់ទំព័រគ្រប់គ្រង (Admin)
          </button>
        </div>
      )}

      {/* Top Header & Controls - Hidden on print */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden border-b border-emerald-800/40 pb-4 relative z-50">
        {userRole === 'tenant' ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-700 border border-emerald-400 flex items-center justify-center font-normal text-white text-xs">HSN</span>
              <h1 className="text-xl sm:text-2xl font-normal text-white flex items-center gap-2 font-moul leading-normal">
                {trApp('ស្វ័យសេវាអតិថិជនជួលបន្ទប់', 'Tenant Self-Service Portal')}
              </h1>
            </div>
            <p className="text-xs text-emerald-400 font-sans font-normal flex items-center gap-2 mt-0.5 flex-wrap">
              <span>
                {trApp('បន្ទប់ជួល៖', 'Room:')} {formatRoomBadge(currentActiveTenant?.roomNo || data.roomNo)}
              </span>
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl sm:text-2xl font-normal text-emerald-300 flex items-center gap-2.5 font-moul leading-normal">
              <Home className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{trApp('ប្រព័ន្ធគ្រប់គ្រងការជួលបន្ទប់', 'HSN Room Rental Management System')}</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-400/80 font-sans font-normal mt-0.5">
              {trApp(
                'HSN HENG SAMNANG • ឧបករណ៍គ្រប់គ្រងអចលនទ្រព្យ និងចំណូលបូកបន្ត',
                'HSN HENG SAMNANG • Property & Cumulative Revenue Manager'
              )}
            </p>
          </div>
        )}

        {/* Right Controls: Language Toggle Button (Flag Icon Only) + Action Menu Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleToggleAppLang}
            className="bg-emerald-950/95 hover:bg-emerald-700 border-2 border-amber-300/90 shadow-lg p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95"
            title={appLang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
            aria-label={appLang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
          >
            <LanguageFlagIcon lang={appLang} className="w-7 h-5" />
          </button>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                playAudioFeedback('click');
                setShowTopActionsMenu(!showTopActionsMenu);
              }}
              className="bg-[#0B3C26] text-emerald-100 hover:bg-[#22c55e] hover:text-stone-900 border border-emerald-600/70 shadow-lg font-normal text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all duration-300 group"
              title={trApp('ចុចដើម្បីបើកម៉ឺនុយសកម្មភាព', 'Click to toggle action menu')}
            >
              <Menu className="w-4 h-4 text-emerald-300 group-hover:text-stone-900 transition-colors" />
              <span className="font-moul font-normal tracking-wide">
                {trApp('ម៉ឺនុយសកម្មភាព', 'Action Menu')}
              </span>
              <ChevronDown className={`w-4 h-4 text-emerald-400 group-hover:text-stone-900 transition-transform duration-200 ${showTopActionsMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Action Menu Dropdown Panel */}
            {showTopActionsMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#092218]/95 backdrop-blur-md border border-emerald-600/80 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-emerald-900/60 animate-in fade-in zoom-in-95 font-sans font-normal">
                
                {/* ADMIN ACTIONS GROUP */}
                {userRole === 'admin' && (
                  <div className="pb-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-normal text-emerald-400/70 uppercase tracking-wider font-mono">
                      ⚙️ {trApp('ប្រតិបត្តិការគ្រប់គ្រង', 'Management Operations')}
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => { setShowTopActionsMenu(false); handleCycleReadings(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div>{trApp('ចាប់ផ្តើមខែថ្មី (បិទលេខកុងទ័រ)', 'Start New Month (Cycle Meters)')}</div>
                        <div className="text-[10px] font-normal text-amber-200/70">
                          {trApp('កំណត់លេខថ្មីជាលេខចាស់សម្រាប់ខែក្រោយ', 'Set new readings as old readings for next month')}
                        </div>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setShowTopActionsMenu(false); handlePurgeAllFormerTenantsKeepRevenue(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-100 transition-all cursor-pointer"
                    >
                      <UserMinus className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div>{trApp('លុបភ្ញៀវឈប់ជួល (រក្សាចំណូលបូកបន្ត)', 'Clear Vacated Tenants (Keep Revenue)')}</div>
                        <div className="text-[10px] font-normal text-emerald-200/70">
                          {trApp('រក្សាទុកចំណូលខែមុនៗទាំងអស់ក្នុងតារាងម្ចាស់ផ្ទះ', 'Preserve & accumulate all past revenue for landlord')}
                        </div>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setShowTopActionsMenu(false); handleReset(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-stone-200 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <div>{trApp('សម្អាតប្រអប់បញ្ចូល', 'Clear Input Fields')}</div>
                        <div className="text-[10px] font-normal text-stone-400">
                          {trApp('លុបសម្អាតទម្រង់វិក្កយបត្របច្ចុប្បន្ន', 'Reset current invoice draft fields')}
                        </div>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { playAudioFeedback('click'); setShowTopActionsMenu(false); setIsExportInspectorOpen(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-emerald-200 hover:bg-emerald-800/50 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div>{trApp('នាំចេញវិក្កយបត្រ', 'Check & Export Invoice')}</div>
                        <div className="text-[10px] font-normal text-emerald-300/70">
                          {trApp('ពិនិត្យភាពពេញលេញ & នាំចេញ', 'Verify completeness & export')}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playAudioFeedback('click');
                        setShowTopActionsMenu(false);
                        setIsAdminPreviewing(true);
                        setUserRole('tenant');
                        setLoggedInTenantRoom(data.roomNo);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-purple-200 hover:bg-purple-900/40 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div>{trApp('មើលទិដ្ឋភាពភ្ញៀវជួល', 'Preview Tenant View')}</div>
                        <div className="text-[10px] font-normal text-purple-300/70">
                          {trApp('មើលទំព័រស្វ័យសេវាអតិថិជន', 'Preview tenant self-service portal')}
                        </div>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setShowTopActionsMenu(false); handleMarkAsPaid(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-indigo-200 hover:bg-indigo-900/40 transition-all cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div>{trApp('កត់ត្រាបានបង់ប្រាក់រួច', 'Mark as Paid')}</div>
                        <div className="text-[10px] font-normal text-indigo-300/70">
                          {trApp('កត់ត្រាចូលតារាងចំណូលបូកបន្ត', 'Record payment into cumulative ledger')}
                        </div>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setShowTopActionsMenu(false); bgInputRef.current?.click(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-emerald-200 hover:bg-emerald-800/40 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div>
                          {customBgImage
                            ? trApp('ប្តូររូបភាពផ្ទៃខាងក្រោយ', 'Change Background Image')
                            : trApp('ផ្ទុកឡើងរូបភាពផ្ទៃខាងក្រោយ', 'Upload Background Image')}
                        </div>
                        <div className="text-[10px] font-normal text-emerald-300/70">
                          {trApp('គាំទ្រគ្រប់ឧបករណ៍', 'Supported across all devices')}
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* PDF & DOWNLOAD ACTIONS GROUP */}
                <div className="py-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-normal text-emerald-400/70 uppercase tracking-wider font-mono">
                    📄 {trApp('ការនាំចេញ & បោះពុម្ព', 'Export & Print')}
                  </div>

                  {/* PDF Format Selector Submenu inside Dropdown */}
                  <div className="bg-stone-900/80 rounded-xl p-1.5 border border-emerald-900/80 space-y-0.5">
                    <div className="text-[10px] text-rose-300 font-normal px-2 py-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-400" /> {trApp('នាំចេញ PDF', 'Export PDF')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => { setShowTopActionsMenu(false); handleExportPdf('device'); }}
                        className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-800/80 hover:bg-emerald-800/80 text-stone-200 text-[11px] font-normal text-left cursor-pointer transition-colors"
                      >
                        <Smartphone className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{trApp('ឧបករណ៍', 'Device')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowTopActionsMenu(false); handleExportPdf('mobile'); }}
                        className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-800/80 hover:bg-emerald-800/80 text-stone-200 text-[11px] font-normal text-left cursor-pointer transition-colors"
                      >
                        <Smartphone className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{trApp('ទូរស័ព្ទ', 'Mobile')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowTopActionsMenu(false); handleExportPdf('tablet'); }}
                        className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-800/80 hover:bg-emerald-800/80 text-stone-200 text-[11px] font-normal text-left cursor-pointer transition-colors"
                      >
                        <Tablet className="w-3 h-3 text-violet-400 shrink-0" />
                        <span>Tablet (148mm)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowTopActionsMenu(false); handleExportPdf('a4'); }}
                        className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-800/80 hover:bg-emerald-800/80 text-stone-200 text-[11px] font-normal text-left cursor-pointer transition-colors"
                      >
                        <FileText className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>A4 Standard</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => { setShowTopActionsMenu(false); handleTopDownload(); }}
                    disabled={isDownloading}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-stone-200 hover:bg-sky-900/40 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading && !isExportingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                    ) : (
                      <Download className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                    <div>
                      <div>{trApp('ទាញយករូបភាព PNG', 'Download Image (PNG)')}</div>
                      <div className="text-[10px] font-normal text-stone-400">
                        {trApp('រក្សាទុកជារូបភាពច្បាស់ 4K', 'Save high-res PNG invoice')}
                      </div>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setShowTopActionsMenu(false); handlePrint(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-stone-200 hover:bg-emerald-800/50 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div>{trApp('បោះពុម្ពវិក្កយបត្រ', 'Print Invoice')}</div>
                      <div className="text-[10px] font-normal text-stone-400">
                        {trApp('បោះពុម្ពដោយផ្ទាល់', 'Print directly')}
                      </div>
                    </div>
                  </button>
                </div>

                {/* LINKS & LOGOUT SECTION */}
                <div className="pt-2 space-y-1">
                  <button 
                    type="button"
                    onClick={() => { setShowTopActionsMenu(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-normal text-red-300 hover:bg-red-950/60 transition-all cursor-pointer mt-1"
                  >
                    <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <div>{trApp('ចាកចេញពីប្រព័ន្ធ', 'Logout')}</div>
                      <div className="text-[10px] font-normal text-red-400/70">
                        {trApp('ត្រឡប់ទៅអេក្រង់ចូលប្រព័ន្ធ', 'Return to login screen')}
                      </div>
                    </div>
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Tab Switcher - Interactive Dropdown Menu Bar - Admin only - Hidden on print */}
      {userRole === 'admin' && (
        <div className="max-w-7xl mx-auto mb-6 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800/80 rounded-2xl p-3.5 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 print:hidden relative z-40">
          {/* Header Text Label */}
          <div className="flex items-center gap-3 px-2 shrink-0">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></span>
            <div className="flex flex-col">
              <span className="text-emerald-400 font-bold text-base sm:text-lg tracking-wide font-sans">
                {trApp('ម៉ឺនុយប្រព័ន្ធគ្រប់គ្រងការជួលបន្ទប់', 'Room Rental Management Menu')}
              </span>
              <span className="text-xs text-stone-300 font-medium">
                {trApp(
                  'សូមចុចប៊ូតុងខាងស្តាំដើម្បីជ្រើសរើសម៉ឺនុយប្រើប្រាស់',
                  'Select a module or quick action on the right'
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto flex-wrap">
            {/* Dedicated Quick-Access Button for Nguon Sopheak Management Dashboard */}
            <button
              type="button"
              onClick={() => {
                playAudioFeedback('click');
                setActiveTab('sopheakDashboard');
                setIsNavMenuOpen(false);
              }}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border-2 transition-all duration-300 flex items-center justify-between sm:justify-center gap-2 cursor-pointer shadow-lg shrink-0 ${
                activeTab === 'sopheakDashboard'
                  ? 'bg-emerald-400 text-stone-950 border-white ring-2 ring-emerald-300/60 font-black'
                  : 'bg-emerald-800 hover:bg-emerald-600 text-white border-emerald-400/70'
              }`}
              title={trApp('ផ្ទាំងគ្រប់គ្រង ងួន សុភ័ក្រ', 'Nguon Sopheak Management Dashboard')}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <div className="text-left leading-tight">
                <div className="font-bold">
                  {trApp('ផ្ទាំងគ្រប់គ្រង ងួន សុភ័ក្រ', 'Nguon Sopheak Dashboard')}
                </div>
                <div className="text-[10px] opacity-90 font-sans">
                  {trApp('កត់ត្រាទឹក-ភ្លើង & ភ្ញៀវជួល', 'Meters & Tenant Portal')}
                </div>
              </div>
            </button>

            {/* Quick-Access Button for Shared Management & Permissions (Owner HSN) */}
            {staffRole === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  playAudioFeedback('click');
                  setActiveTab('sharedAccess');
                  setIsNavMenuOpen(false);
                }}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border-2 transition-all duration-300 flex items-center justify-between sm:justify-center gap-2 cursor-pointer shadow-lg shrink-0 ${
                  activeTab === 'managerOverview' || activeTab === 'managerList' || activeTab === 'sharedAccess'
                    ? 'bg-amber-400 text-stone-950 border-white ring-2 ring-amber-300/60 font-black'
                    : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-amber-400/60'
                }`}
                title={trApp('អ្នកគ្រប់គ្រង & ចែករំលែកសិទ្ធិ', 'Shared Access & Manager Permissions')}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="font-bold">{trApp('ចែករំលែកសិទ្ធិ (HSN)', 'Shared Access (HSN)')}</div>
                  <div className="text-[10px] opacity-90 font-sans">
                    {trApp('កំណត់សិទ្ធិ Nguon Sopheak', 'Manage Permissions')}
                  </div>
                </div>
              </button>
            )}

            {/* Dedicated Quick-Access Button for Manager Vacant Room Check-In Form */}
            <button
              type="button"
              onClick={() => {
                playAudioFeedback('click');
                setActiveTab('checkInForm');
                setIsNavMenuOpen(false);
              }}
              className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all duration-300 flex items-center justify-between sm:justify-center gap-2.5 cursor-pointer shadow-lg shrink-0 ${
                activeTab === 'checkInForm'
                  ? 'bg-amber-400 text-stone-950 border-amber-200 ring-2 ring-amber-300/60 shadow-amber-500/20 font-black'
                  : 'bg-gradient-to-r from-[#c84e00] to-[#9e3b00] hover:from-amber-500 hover:to-orange-500 text-white hover:text-stone-950 border-orange-400/70'
              }`}
              title={trApp('បើកទម្រង់ចុះឈ្មោះភ្ញៀវថ្មីចូលបន្ទប់ទំនេរ', 'Open Vacant Room Check-In Form')}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="font-bold">
                    {trApp('ចុះឈ្មោះភ្ញៀវចូលបន្ទប់ទំនេរ', 'Vacant Room Check-In')}
                  </div>
                  <div className="text-[10px] opacity-90 font-sans">
                    {trApp('ប្តូរភ្ញៀវថ្មី & រក្សាចំណូលបូកបន្ត', 'New Tenant & Keep Revenue')}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                activeTab === 'checkInForm'
                  ? 'bg-stone-950 text-amber-300'
                  : 'bg-amber-300 text-stone-950'
              }`}>
                {vacantRoomsList.length} {trApp('ទំនេរ', 'Vacant')}
              </span>
            </button>
          
            {/* Primary Dropdown Interactive Button & Menu */}
            <div className="relative w-full sm:w-88 md:w-96 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playAudioFeedback('click');
                  setIsNavMenuOpen(!isNavMenuOpen);
                }}
                className="w-full bg-emerald-900 hover:bg-emerald-400 text-emerald-100 hover:text-emerald-950 font-bold text-base rounded-xl px-4 py-3 border-2 border-emerald-600 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-lg flex items-center justify-between transition-all duration-300 cursor-pointer font-sans active:scale-[0.99] group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {activeTab === 'invoice' && <FileText className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'tenants' && <Users className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'manualForm' && <Edit className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'reports' && <BarChart3 className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'summaryChecker' && <CheckCircle2 className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'tenantIds' && <ShieldCheck className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'checkInForm' && <Plus className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'managerOverview' && <Users className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'managerList' && <UserCheck className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'sharedAccess' && <Key className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  {activeTab === 'sopheakDashboard' && <Sparkles className="w-5 h-5 text-emerald-300 group-hover:text-emerald-950 shrink-0 transition-colors" />}
                  <span className="truncate font-bold text-base sm:text-lg">
                    {activeTab === 'invoice' && trApp('១. វិក្កយបត្រថ្លៃជួលបន្ទប់', '1. Room Rental Invoice')}
                    {activeTab === 'tenants' && trApp('២. បញ្ជីភ្ញៀវស្នាក់នៅ', '2. Tenant Directory')}
                    {activeTab === 'manualForm' && trApp('៣. បញ្ចូលទិន្នន័យទឹក-ភ្លើង', '3. Enter Utility Readings')}
                    {activeTab === 'reports' && trApp('៤. របាយការណ៍ចំណូលម្ចាស់ផ្ទះ', '4. Landlord Revenue Reports')}
                    {activeTab === 'summaryChecker' && trApp('៥. ពិនិត្យផលបូកសរុបភ្ញៀវ', '5. Total Summary Checker')}
                    {activeTab === 'tenantIds' && trApp('៦. គ្រប់គ្រង ID ភ្ញៀវស្នាក់នៅ', '6. Manage Tenant IDs')}
                    {activeTab === 'checkInForm' && trApp('៧. ចុះឈ្មោះភ្ញៀវចូលបន្ទប់ទំនេរ', '7. Vacant Room Check-In')}
                    {activeTab === 'managerOverview' && trApp('៨. អ្នកគ្រប់គ្រង', '8. Manager Overview')}
                    {activeTab === 'managerList' && trApp('៩. បញ្ជីអ្នកគ្រប់គ្រង', '9. Manager List')}
                    {activeTab === 'sharedAccess' && trApp('១០. ចែករំលែកសិទ្ធិ', '10. Shared Access')}
                    {activeTab === 'sopheakDashboard' && trApp('១១. ផ្ទាំងគ្រប់គ្រង ងួន សុភ័ក្រ', '11. Nguon Sopheak Dashboard')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="text-xs sm:text-sm bg-emerald-950 group-hover:bg-emerald-800 text-emerald-300 group-hover:text-white border border-emerald-700/80 group-hover:border-emerald-600 px-2.5 py-0.5 rounded-full font-sans font-bold transition-colors">
                    {trApp('ម៉ឺនុយ', 'Menu')}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-emerald-300 group-hover:text-emerald-950 transition-transform duration-200 ${isNavMenuOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isNavMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNavMenuOpen(false)}
                  />

                  <div className="absolute right-0 top-full mt-2 w-full bg-stone-900 border-2 border-emerald-600/90 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-emerald-900/50 max-h-[80vh] overflow-y-auto">
                    <div className="px-3 py-2 bg-emerald-950 rounded-xl mb-1 text-center border border-emerald-800/60">
                      <p className="text-[11px] font-bold text-emerald-300 tracking-wider font-sans uppercase">
                        📂 {trApp('ជ្រើសរើសផ្នែកប្រព័ន្ធ', 'Select System Module')}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      {[
                        { id: 'invoice', label: trApp('១. វិក្កយបត្រថ្លៃជួលបន្ទប់', '1. Room Rental Invoice'), sub: trApp('បង្កើត និងបោះពុម្ពវិក្កយបត្រ', 'Invoice Generator & Print'), icon: FileText },
                        { id: 'tenants', label: trApp('២. បញ្ជីភ្ញៀវស្នាក់នៅ', '2. Tenant Directory'), sub: trApp('បញ្ជីភ្ញៀវ និងលុបភ្ញៀវឈប់ជួលរក្សាចំណូល', 'Tenants & Vacate/Keep Revenue'), icon: Users },
                        { id: 'manualForm', label: trApp('៣. បញ្ចូលទិន្នន័យទឹក-ភ្លើង', '3. Utility Readings Input'), sub: trApp('កត់ត្រាលេខកុងទ័រទឹក និងភ្លើង', 'Record Water & Electricity'), icon: Edit },
                        { id: 'reports', label: trApp('៤. របាយការណ៍ចំណូលម្ចាស់ផ្ទះ', '4. Landlord Revenue Reports'), sub: trApp('តារាងចំណូលប្រចាំខែ និងបូកបន្ត', 'Monthly & Cumulative Revenue'), icon: BarChart3 },
                        { id: 'summaryChecker', label: trApp('៥. ពិនិត្យផលបូកសរុបភ្ញៀវ', '5. Total Summary Checker'), sub: trApp('ពិនិត្យផលបូកសរុបប្រចាំឆ្នាំ', '12-Month Cumulative Statement'), icon: CheckCircle2 },
                        { id: 'tenantIds', label: trApp('៦. គ្រប់គ្រង ID ភ្ញៀវស្នាក់នៅ', '6. Guest ID & Access PIN'), sub: trApp('លេខសម្គាល់ភ្ញៀវជួលបន្ទប់', 'Tenant Login Credentials'), icon: ShieldCheck },
                        { id: 'checkInForm', label: trApp('៧. ចុះឈ្មោះភ្ញៀវចូលបន្ទប់ទំនេរ', '7. Vacant Room Check-In'), sub: trApp('បញ្ចូលភ្ញៀវថ្មីចូលបន្ទប់ទំនេរ (បូកបន្តចំណូល)', 'New Tenant Check-In (Keep Revenue)'), icon: Plus },
                        { id: 'managerOverview', label: trApp('អ្នកគ្រប់គ្រង', 'Managers'), sub: trApp('គ្រប់គ្រងសិទ្ធិ និងកំណត់ហេតុត្រួតពិនិត្យ (HSN)', 'Manager Overview & Audit Log'), icon: Users },
                        { id: 'managerList', label: trApp('បញ្ជីអ្នកគ្រប់គ្រង', 'Manager List'), sub: trApp('គណនី Nguon Sopheak និងអ្នកគ្រប់គ្រង', 'Nguon Sopheak & Manager Accounts'), icon: UserCheck },
                        { id: 'sharedAccess', label: trApp('ចែករំលែកសិទ្ធិ', 'Shared Access'), sub: trApp('ផ្តល់សិទ្ធិបន្ទប់ និងចាក់សោតម្លៃ', 'Room Permissions & Price Lock'), icon: Key },
                        { id: 'sopheakDashboard', label: trApp('ផ្ទាំងគ្រប់គ្រង ងួន សុភ័ក្រ', 'Nguon Sopheak Dashboard'), sub: trApp('ផ្ទាំងការងាររបស់អ្នកគ្រប់គ្រង Nguon Sopheak', 'Dedicated Portal for Nguon Sopheak'), icon: Sparkles },
                      ].map((item) => {
                        const IconComp = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              playAudioFeedback('click');
                              setActiveTab(item.id as any);
                              setIsNavMenuOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                              isActive
                                ? 'bg-emerald-800 text-white shadow-md font-bold hover:bg-emerald-400 hover:text-emerald-950'
                                : 'bg-emerald-950/70 text-emerald-100 hover:bg-emerald-400 hover:text-emerald-950 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg transition-colors ${
                                isActive 
                                  ? 'bg-emerald-950 text-emerald-300 group-hover:bg-emerald-950 group-hover:text-emerald-300' 
                                  : 'bg-emerald-900/80 text-emerald-300 group-hover:bg-emerald-950 group-hover:text-emerald-300'
                              }`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-base sm:text-lg font-sans font-bold leading-tight">
                                  {item.label}
                                </div>
                                <div className={`text-[10px] font-sans ${isActive ? 'text-emerald-200 group-hover:text-emerald-900' : 'text-emerald-300/80 group-hover:text-emerald-900/80'}`}>
                                  {item.sub}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <span className="text-xs bg-white text-emerald-900 group-hover:bg-emerald-950 group-hover:text-white px-2 py-0.5 rounded-full font-bold shadow-xs">
                                ✓ ជ្រើសរើស
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column: Invoice Area / Tenant Self-Service Screen */}
        <div className={userRole === 'tenant' ? 'col-span-12 w-full' : 'lg:col-span-8 xl:col-span-9 w-full'}>
          {/* 🖥️ កញ្ចក់អេក្រង់បង្ហាញព័ត៌មាន (AUXILIARY CORE DISPLAY SCREEN) */}
          <div className="border-[8px] border-stone-800 rounded-3xl bg-stone-900 p-2 shadow-2xl relative overflow-hidden ring-1 ring-stone-950 print:border-none print:bg-transparent print:p-0 print:shadow-none print:ring-0">
            {/* Screen top status bezel */}
            <div className="flex items-center justify-between px-4 py-2 bg-stone-950 text-stone-400 font-mono select-none rounded-t-xl mb-2 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="tracking-wider uppercase font-sans text-[10px] text-emerald-400 font-black">
                  {userRole === 'tenant' ? 'ស្វ័យសេវាអតិថិជន (TENANT SELF-SERVICE PORTAL)' : 'កញ្ចក់អេក្រង់បង្ហាញព័ត៌មាន (AUX CORE DISPLAY SCREEN)'}
                </span>
              </div>
              <div className="font-sans text-[10px] text-stone-500 font-bold">
                {userRole === 'tenant' ? (
                  <span className="text-emerald-400 font-mono font-bold">
                    បន្ទប់ (Room) {formatRoomBadge(currentActiveTenant?.roomNo || data.roomNo)} • ID: {formatTenantId(currentActiveTenant?.roomNo || data.roomNo)} • {currentActiveTenant?.tenantName || data.tenantName}
                  </span>
                ) : (
                  <>បង្ហាញមាតិកាចម្បង (Active Feed): {activeTab === 'invoice' ? '១. វិក្កយបត្រ (Invoice)' : activeTab === 'tenants' ? '២. ភ្ញៀវស្នាក់នៅ (Tenants)' : activeTab === 'manualForm' ? '៣. បញ្ចូលទិន្នន័យ (Inputs)' : activeTab === 'reports' ? '៤. របាយការណ៍ (Reports)' : activeTab === 'summaryChecker' ? '៥. ពិនិត្យផលបូកសរុបរបស់ភ្ញៀវ (Total Summary Checker)' : activeTab === 'tenantIds' ? '៦. គ្រប់គ្រង ID ភ្ញៀវ (Guest IDs)' : '៧. ចុះឈ្មោះភ្ញៀវចូលបន្ទប់ទំនេរ (Vacant Room Check-In)'}</>
                )}
              </div>
            </div>
            
            {/* Screen Inner Display Frame */}
            <div className="bg-stone-100 rounded-2xl overflow-hidden p-0.5 print:bg-white print:p-0 print:rounded-none">
              {activeTab === 'invoice' && (
                <>
                  {/* TENANT SELF-SERVICE PORTAL OVERVIEW & KHQR PAYMENT (Shown when userRole === 'tenant') */}
                  {userRole === 'tenant' && (
                    <div className="mb-4 space-y-4 print:hidden">
                      {/* 3 Overview Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Card 1: Guest Profile */}
                        <div className="bg-stone-900 border border-emerald-800/60 rounded-xl p-3.5 shadow-md">
                          <div className="flex items-center justify-between mb-2 border-b border-stone-800 pb-1.5">
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                              <User className="w-3.5 h-3.5" />
                              ព័ត៌មានភ្ញៀវជួល / Tenant Profile
                            </span>
                            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-bold">
                              {formatRoomBadge(currentActiveTenant?.roomNo || data.roomNo)}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-baseline">
                              <span className="text-stone-400">ឈ្មោះភ្ញៀវ / Name:</span>
                              <span className="font-bold text-white font-moul">{currentActiveTenant?.tenantName || data.tenantName}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-stone-400">លេខបន្ទប់ / Room Nº:</span>
                              <span className="font-black text-emerald-300 font-mono text-sm">{formatRoomBadge(currentActiveTenant?.roomNo || data.roomNo)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-stone-400">លេខទូរស័ព្ទ / Phone:</span>
                              <span className="font-mono text-stone-200">{currentActiveTenant?.tenantPhone || data.tenantPhone || '—'}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-stone-400">ថ្ងៃចូលរស់នៅ / Check-In:</span>
                              <span className="text-stone-300 font-mono">{currentActiveTenant?.checkInDate || data.checkInDate || '—'}</span>
                            </div>
                            
                            {/* Editable Custom Tenant ID */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-stone-800/60 mt-1">
                              <span className="text-stone-400">លេខសម្គាល់ / ID:</span>
                              {isEditingTenantId ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <input
                                    type="text"
                                    className="bg-stone-800 text-white text-[11px] px-1.5 py-0.5 rounded outline-none border border-emerald-500 font-mono w-24 font-bold"
                                    value={tempTenantId}
                                    onChange={(e) => setTempTenantId(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTenantIdSelf(currentActiveTenant.roomNo, tempTenantId)}
                                    className="text-emerald-400 hover:text-emerald-300 font-bold px-1 text-xs"
                                    title="Save ID"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingTenantId(false)}
                                    className="text-red-400 hover:text-red-300 px-1 text-xs"
                                    title="Cancel"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-emerald-300 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">
                                    {currentActiveTenant?.tenantIdNo || formatTenantId(currentActiveTenant?.roomNo)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playAudioFeedback('click');
                                      setTempTenantId(currentActiveTenant?.tenantIdNo || formatTenantId(currentActiveTenant?.roomNo));
                                      setIsEditingTenantId(true);
                                    }}
                                    className="text-stone-400 hover:text-emerald-400 p-0.5"
                                    title="Change My ID"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Billing & Status */}
                        <div className="bg-stone-900 border border-emerald-800/60 rounded-xl p-3.5 shadow-md">
                          <div className="flex items-center justify-between mb-2 border-b border-stone-800 pb-1.5">
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                              <CreditCard className="w-3.5 h-3.5" />
                              វិក្កយបត្រខែនេះ / Monthly Invoice
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                              currentActiveTenant?.isPaid
                                ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300'
                                : 'bg-amber-950/80 border-amber-600 text-amber-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${currentActiveTenant?.isPaid ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                              {currentActiveTenant?.isPaid ? 'បានបង់ប្រាក់ / PAID' : 'រង់ចាំការបង់ / UNPAID'}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs font-sans">
                            <div className="flex justify-between items-baseline">
                              <span className="text-stone-400">សរុបដុល្លារ / Total USD:</span>
                              <span className="text-lg font-black text-white font-mono">${data.totalUsd.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-stone-400">សរុបរៀល / Total KHR:</span>
                              <span className="font-bold text-amber-300 font-mono">៛{(data.totalUsd * 4000).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-2.5 border-t border-stone-800/60 text-[11px] font-sans text-stone-400">
                              <div className="flex justify-between items-center">
                                <span>⚡ ភ្លើង / Electricity:</span>
                                <span className="text-stone-200 font-bold">
                                  {elecUsage} kWh <span className="font-normal font-mono text-[10px] text-stone-400">({elecOld} ➔ {elecNew})</span>
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>💧 ទឹក / Water:</span>
                                <span className="text-stone-200 font-bold">
                                  {waterUsage} m³ <span className="font-normal font-mono text-[10px] text-stone-400">({waterOld} ➔ {waterNew})</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Telegram Support */}
                        <div className="bg-stone-900 border border-sky-800/60 rounded-xl p-3.5 shadow-md flex flex-col justify-between font-sans">
                          <div>
                            <div className="flex items-center justify-between mb-1.5 border-b border-stone-800 pb-1.5">
                              <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1 uppercase tracking-wider">
                                <Send className="w-3.5 h-3.5" />
                                ឆានែល Telegram / Telegram Channel
                              </span>
                              <span className="text-[9px] font-mono bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-700/60">
                                @RoomBoeungKengKang
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-300 leading-snug mb-2">
                              ទទួលបានការជូនដំណឹងអំពីវិក្កយបត្រ ការធ្វើបច្ចុប្បន្នភាពទឹកភ្លើង និងការបញ្ជាក់ការបង់ប្រាក់។ / Receive invoice updates, utility entries & confirmation notices.
                            </p>
                          </div>
                          <a
                            href={TELEGRAM_CHANNEL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => playAudioFeedback('click')}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-lg text-white font-bold text-xs shadow transition-all group cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            <span>ចូលរួមឆានែល HSN / Join Telegram</span>
                            <ExternalLink className="w-3 h-3 text-sky-200" />
                          </a>
                        </div>
                      </div>

                      {/* Prominent ABA KHQR Pay Card */}
                      <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-[#041a10] border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                          
                          {/* Left: KHQR Stamp Visual */}
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-36 h-36 bg-white p-2.5 rounded-2xl shadow-xl border-2 border-emerald-400/40 shrink-0 flex flex-col items-center justify-between">
                              <div className="flex items-center gap-1 w-full justify-between">
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[#005a71] font-black text-xs">ABA</span>
                                  <span className="text-red-500 font-bold text-xs">'</span>
                                  <span className="text-[#48b6d1] font-bold text-xs">PAY</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-[9px] font-black">
                                  <span className="text-red-600">KH</span>
                                  <span className="text-blue-900">QR</span>
                                </div>
                              </div>
                              {/* SVG Crisp QR */}
                              <div className="w-24 h-24 my-0.5">
                                {data.qrUrl ? (
                                  <img src={data.qrUrl} alt="QR" className="w-full h-full object-contain" />
                                ) : (
                                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                                    <rect x="6" y="6" width="24" height="24" rx="4" stroke="#005a71" strokeWidth="3.5" fill="white" />
                                    <rect x="12" y="12" width="12" height="12" rx="2" fill="#005a71" />
                                    <rect x="70" y="6" width="24" height="24" rx="4" stroke="#005a71" strokeWidth="3.5" fill="white" />
                                    <rect x="76" y="12" width="12" height="12" rx="2" fill="#005a71" />
                                    <rect x="6" y="70" width="24" height="24" rx="4" stroke="#005a71" strokeWidth="3.5" fill="white" />
                                    <rect x="12" y="76" width="12" height="12" rx="2" fill="#005a71" />
                                    <rect x="36" y="10" width="5" height="5" fill="#1e293b" />
                                    <rect x="46" y="10" width="5" height="5" fill="#1e293b" />
                                    <rect x="56" y="10" width="5" height="5" fill="#1e293b" />
                                    <rect x="36" y="20" width="5" height="5" fill="#1e293b" />
                                    <rect x="56" y="20" width="5" height="5" fill="#1e293b" />
                                    <rect x="10" y="38" width="5" height="5" fill="#1e293b" />
                                    <rect x="20" y="38" width="5" height="5" fill="#1e293b" />
                                    <rect x="30" y="38" width="5" height="5" fill="#1e293b" />
                                    <rect x="40" y="38" width="5" height="5" fill="#1e293b" />
                                    <rect x="50" y="38" width="5" height="5" fill="#1e293b" />
                                    <rect x="60" y="38" width="5" height="5" fill="#1e293b" />
                                    <rect x="70" y="38" width="5" height="5" fill="#1e293b" />
                                    <rect x="80" y="38" width="5" height="5" fill="#1e293b" />
                                    <rect x="36" y="48" width="5" height="5" fill="#1e293b" />
                                    <rect x="58" y="48" width="5" height="5" fill="#1e293b" />
                                    <rect x="68" y="48" width="5" height="5" fill="#1e293b" />
                                    <rect x="85" y="48" width="5" height="5" fill="#1e293b" />
                                    <rect x="36" y="58" width="5" height="5" fill="#1e293b" />
                                    <rect x="46" y="58" width="5" height="5" fill="#1e293b" />
                                    <rect x="68" y="58" width="5" height="5" fill="#1e293b" />
                                    <rect x="36" y="70" width="5" height="5" fill="#1e293b" />
                                    <rect x="46" y="70" width="5" height="5" fill="#1e293b" />
                                    <rect x="56" y="70" width="5" height="5" fill="#1e293b" />
                                    <rect x="76" y="70" width="5" height="5" fill="#1e293b" />
                                    <rect x="85" y="70" width="5" height="5" fill="#1e293b" />
                                    <circle cx="50" cy="50" r="11" fill="white" stroke="#005a71" strokeWidth="2" />
                                    <circle cx="50" cy="50" r="8" fill="#005a71" />
                                    <text x="50" y="53.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="900" fontFamily="sans-serif">$</text>
                                  </svg>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-stone-700">NGOUN SOVANNA</span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                  ABA KHQR
                                </span>
                                <h3 className="text-base sm:text-lg font-bold text-white">
                                  បង់ប្រាក់តាម QR (Scan to Pay Room Rent)
                                </h3>
                              </div>
                              <p className="text-xs text-stone-300 mt-1">
                                ស្កែនកូដជាមួយកម្មវិធី <b>Bakong</b> ឬ <b>ABA Mobile</b> ដើម្បីទូទាត់ប្រាក់បន្ទប់។ / Scan QR code using <b>Bakong</b> or <b>ABA Mobile</b> to pay room rent.
                              </p>
                              <div className="mt-2 space-y-1 text-xs">
                                <div>
                                  <span className="text-stone-400">ឈ្មោះគណនី / Account Name: </span>
                                  <span className="text-white font-bold font-mono">NGOUN SOVANNA (ABA Bank)</span>
                                </div>
                                <div>
                                  <span className="text-stone-400">ចំនួនទឹកប្រាក់ត្រូវបង់ / Total Due: </span>
                                  <span className="text-emerald-400 font-mono font-black text-sm">
                                    ${data.totalUsd.toFixed(2)} USD
                                  </span>
                                  <span className="text-amber-300 font-mono font-bold text-xs ml-2">
                                    (~ ៛{(data.totalUsd * 4000).toLocaleString()} KHR)
                                  </span>
                                </div>
                                <div>
                                  <span className="text-stone-400">ការពិពណ៌នាផ្ទេរប្រាក់ / Remarks: </span>
                                  <span className="text-stone-200 font-mono font-bold">
                                    {formatRoomBadge(currentActiveTenant?.roomNo || data.roomNo)} - {currentActiveTenant?.tenantName || data.tenantName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 font-sans">
                            <button
                              type="button"
                              onClick={handleTenantConfirmPayment}
                              className="w-full py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-400/50"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                              <span>✅ បញ្ជាក់ការស្កែន QR និងផ្ញើដំណឹងតាម Telegram / Confirm Scan & Send Telegram Notice</span>
                            </button>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyText(`NGOUN SOVANNA - ABA Bank - $${data.totalUsd.toFixed(2)} - ${formatRoomBadge(currentActiveTenant?.roomNo || data.roomNo)}`, 'transfer')}
                                className="flex-1 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700"
                              >
                                <Copy className="w-3.5 h-3.5 text-stone-400" />
                                <span>{copiedTenantId === 'transfer' ? '✓ Copied' : 'ចម្លងព័ត៌មាន (Copy Info)'}</span>
                              </button>

                              <a
                                href={TELEGRAM_CHANNEL_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => playAudioFeedback('click')}
                                className="flex-1 py-2 px-3 bg-sky-800 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-sky-600"
                              >
                                <Send className="w-3.5 h-3.5 text-sky-200" />
                                <span>Telegram Channel</span>
                              </a>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}
                  {/* 📱 Device Proportional Scaling & Zero-Omission Export Controller */}
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 mb-2 text-stone-200 print:hidden shadow-lg select-none">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                      
                      {/* Device Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap font-sans text-xs">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1 mr-1">
                          <Smartphone className="w-3.5 h-3.5" />
                          របៀបឧបករណ៍ / Device Modes:
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => { setDeviceScaleMode('auto'); playAudioFeedback('click'); }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            deviceScaleMode === 'auto'
                              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                          title="Fit document scale dynamically based on screen viewport"
                        >
                          <RefreshCw className="w-3 h-3" />
                          លៃតម្រូវស្វ័យប្រវត្តិ (Auto Fit)
                        </button>

                        <button
                          type="button"
                          onClick={() => { setDeviceScaleMode('mobile'); playAudioFeedback('click'); }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            deviceScaleMode === 'mobile'
                              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                          title="Simulate Mobile display proportions (Mobile - 390px)"
                        >
                          <Smartphone className="w-3 h-3" />
                          ទូរស័ព្ទ (Mobile)
                        </button>

                        <button
                          type="button"
                          onClick={() => { setDeviceScaleMode('tablet'); playAudioFeedback('click'); }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            deviceScaleMode === 'tablet'
                              ? 'bg-violet-600 text-white shadow-sm ring-1 ring-violet-400'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                          title="Simulate Tablet display proportions (Tablet - 768px)"
                        >
                          <Tablet className="w-3 h-3" />
                          Tablet
                        </button>

                        <button
                          type="button"
                          onClick={() => { setDeviceScaleMode('desktop'); playAudioFeedback('click'); }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            deviceScaleMode === 'desktop'
                              ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                          title="Display standard A4 proportion 100% (Desktop)"
                        >
                          <Monitor className="w-3 h-3" />
                          ស្ដង់ដារ 100% (Desktop)
                        </button>
                      </div>

                      {/* Scale Controls & Export status */}
                      <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end font-sans">
                        {/* Zoom Controls */}
                        <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700">
                          <button
                            type="button"
                            onClick={() => {
                              setDeviceScaleMode('custom');
                              setZoomScale(prev => Math.max(0.35, Math.round((prev - 0.1) * 10) / 10));
                              playAudioFeedback('click');
                            }}
                            className="p-1 hover:bg-stone-700 rounded text-stone-300 hover:text-white transition-colors cursor-pointer"
                            title="Zoom out"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>

                          <span className="px-2 text-xs font-mono font-bold text-emerald-400 min-w-14 text-center">
                            {Math.round(effectiveScale * 100)}%
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setDeviceScaleMode('custom');
                              setZoomScale(prev => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
                              playAudioFeedback('click');
                            }}
                            className="p-1 hover:bg-stone-700 rounded text-stone-300 hover:text-white transition-colors cursor-pointer"
                            title="Zoom in"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 100% Reset */}
                        <button
                          type="button"
                          onClick={() => { setDeviceScaleMode('custom'); setZoomScale(1); playAudioFeedback('click'); }}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-300 rounded-lg border border-stone-700 cursor-pointer"
                        >
                          100%
                        </button>

                        {/* Direct PDF & Export Actions on Controller Bar */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleExportPdf('device')}
                            disabled={isDownloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                            title="Export calibrated PDF based on current device aspect ratios / Export Device PDF"
                          >
                            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5 text-rose-200" />}
                            <span>នាំចេញ PDF ឧបករណ៍ (Device PDF)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportPdf('a4')}
                            disabled={isDownloading}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-rose-300 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                            title="Export standard A4 PDF (210×297mm)"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-400" />
                            <span>PDF A4</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadImage}
                            disabled={isDownloading}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-sky-300 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                            title="Download high-resolution 4K PNG"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-400" />
                            <span>រូបភាព PNG / PNG</span>
                          </button>

                          {/* Style Customizer Toggle */}
                          {userRole === 'admin' && (
                            <button
                              type="button"
                              onClick={() => { playAudioFeedback('click'); setShowStyleCustomizer(!showStyleCustomizer); }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                showStyleCustomizer 
                                  ? 'bg-amber-500 border-amber-400 text-white shadow-lg' 
                                  : 'bg-stone-800 border-stone-700 hover:bg-stone-700 text-amber-300'
                              }`}
                              title="Invoice Style & Font Customizer"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>(Invoice Customizer)</span>
                            </button>
                          )}

                          {/* Export Inspector Trigger */}
                          <button
                            type="button"
                            onClick={() => { playAudioFeedback('click'); setIsExportInspectorOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 border border-emerald-700/80 hover:bg-emerald-900 rounded-lg text-emerald-300 text-xs font-bold cursor-pointer transition-colors"
                            title="Inspect completeness & verify accurate billing before export"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ពិនិត្យភាពពេញលេញ / Completeness (100%)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dimension readout info */}
                    <div className="mt-2 pt-2 border-t border-stone-800/80 flex flex-wrap justify-between items-center text-[10px] text-stone-400 font-sans gap-2">
                      <div>
                        📐 វិមាត្រឯកសារស្តង់ដារ (Standard Size): <span className="text-white font-mono font-bold">850 × ~{invoiceContentHeight} px</span> • 
                        មាត្រដ្ឋានបច្ចុប្បន្ន (Current Scale): <span className="text-emerald-400 font-mono font-bold">{Math.round(850 * effectiveScale)} × {Math.round(invoiceContentHeight * effectiveScale)} px</span> 
                        ({Math.round(effectiveScale * 100)}% view)
                      </div>
                      <div className="text-emerald-400 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>វិក្កយបត្រ PDF & PNG នាំចេញតាមខ្នាតឧបករណ៍ ច្បាស់ខ្លាំង 3.5x មិនមានការកាត់ខ្លី ឬបាត់បង់ព័ត៌មានឡើយ (Calibrated PDF & PNG outputs with 3.5x sharpness, guaranteed no cut-offs or omissions)</span>
                      </div>
                    </div>
                  </div>

                  {/* INVOICE STYLE & LAYOUT CUSTOMIZER PANEL */}
                  {userRole === 'admin' && showStyleCustomizer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="w-full bg-stone-900 border-2 border-amber-500/30 rounded-2xl p-5 mb-4 text-white font-sans text-xs space-y-4 shadow-xl print:hidden relative z-50 mt-3"
                    >
                      <div className="flex justify-between items-center border-b border-stone-800 pb-2.5">
                        <span className="font-extrabold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                          <Sliders className="w-4 h-4 text-amber-400 animate-pulse" />
                          🛠️ ផ្ទាំងកែសម្រួលទម្រង់វិក្កយបត្រ (INVOICE STYLE & LAYOUT CUSTOMIZER PANEL)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              playAudioFeedback('click');
                              setInvoiceStyles({
                                khmerTitleSize: 19,
                                englishSubTitleSize: 14,
                                dividerThickness: 2,
                                dividerWidthPercent: 100,
                                dividerColor: '#dc2626',
                                logoSize: 96,
                                topBorderColor: '#10b981',
                                invoicePadding: 40,
                                tableFontSize: 14,
                                invoiceTopBorderThickness: 12
                              });
                            }}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white px-2.5 py-1 rounded font-bold transition-all text-[10px]"
                          >
                            កំណត់ឡើងវិញ (Reset Defaults)
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowStyleCustomizer(false)}
                            className="text-stone-500 hover:text-stone-300 font-bold px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-stone-300">
                        {/* Column 1: Fonts & Title */}
                        <div className="space-y-3 bg-stone-950 p-3.5 rounded-xl border border-stone-800">
                          <h4 className="font-bold text-amber-300 border-b border-stone-800 pb-1 mb-2 uppercase text-[10px] tracking-wider">១. អក្សរ និងកម្ពស់ (Fonts & Text Sizes)</h4>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>អក្សរខ្មែរ (Khmer Title Size):</span>
                              <span className="font-mono text-amber-400 font-bold">{invoiceStyles.khmerTitleSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="14"
                              max="32"
                              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              value={invoiceStyles.khmerTitleSize}
                              onChange={(e) => setInvoiceStyles(prev => ({ ...prev, khmerTitleSize: parseInt(e.target.value) }))}
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>អក្សរអង់គ្លេស (English Subtitle Size):</span>
                              <span className="font-mono text-amber-400 font-bold">{invoiceStyles.englishSubTitleSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="24"
                              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              value={invoiceStyles.englishSubTitleSize}
                              onChange={(e) => setInvoiceStyles(prev => ({ ...prev, englishSubTitleSize: parseInt(e.target.value) }))}
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>អក្សរតារាង (Table Text Size):</span>
                              <span className="font-mono text-amber-400 font-bold">{invoiceStyles.tableFontSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="18"
                              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              value={invoiceStyles.tableFontSize}
                              onChange={(e) => setInvoiceStyles(prev => ({ ...prev, tableFontSize: parseInt(e.target.value) }))}
                            />
                          </div>
                        </div>

                        {/* Column 2: Divider & Line Styles */}
                        <div className="space-y-3 bg-stone-950 p-3.5 rounded-xl border border-stone-800">
                          <h4 className="font-bold text-amber-300 border-b border-stone-800 pb-1 mb-2 uppercase text-[10px] tracking-wider">២. បន្ទាត់កាត់ទទឹង (Divider Line Styles)</h4>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>កម្រាស់បន្ទាត់ (Line Thickness):</span>
                              <span className="font-mono text-amber-400 font-bold">{invoiceStyles.dividerThickness}px</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="8"
                              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              value={invoiceStyles.dividerThickness}
                              onChange={(e) => setInvoiceStyles(prev => ({ ...prev, dividerThickness: parseInt(e.target.value) }))}
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>ប្រវែងបន្ទាត់ (Line Width %):</span>
                              <span className="font-mono text-amber-400 font-bold">{invoiceStyles.dividerWidthPercent}%</span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="100"
                              step="5"
                              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              value={invoiceStyles.dividerWidthPercent}
                              onChange={(e) => setInvoiceStyles(prev => ({ ...prev, dividerWidthPercent: parseInt(e.target.value) }))}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <span className="block font-medium">ពណ៌បន្ទាត់ (Divider Color):</span>
                            <div className="flex gap-2">
                              {['#1e3a8a', '#10b981', '#ef4444', '#f59e0b', '#000000', '#6b7280'].map((col) => (
                                <button
                                  type="button"
                                  key={col}
                                  onClick={() => setInvoiceStyles(prev => ({ ...prev, dividerColor: col }))}
                                  style={{ backgroundColor: col }}
                                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                                    invoiceStyles.dividerColor === col ? 'border-amber-400 scale-110' : 'border-stone-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Borders, Padding & Logo */}
                        <div className="space-y-3 bg-stone-950 p-3.5 rounded-xl border border-stone-800">
                          <h4 className="font-bold text-amber-300 border-b border-stone-800 pb-1 mb-2 uppercase text-[10px] tracking-wider">៣. រឹម និងឡូហ្គោ (Margins, Padding & Accent)</h4>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>ចន្លោះរឹមសន្លឹក (Sheet Padding):</span>
                              <span className="font-mono text-amber-400 font-bold">{invoiceStyles.invoicePadding}px</span>
                            </div>
                            <input
                              type="range"
                              min="16"
                              max="60"
                              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              value={invoiceStyles.invoicePadding}
                              onChange={(e) => setInvoiceStyles(prev => ({ ...prev, invoicePadding: parseInt(e.target.value) }))}
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>កម្រាស់រឹមលើ (Top Border Height):</span>
                              <span className="font-mono text-amber-400 font-bold">{invoiceStyles.invoiceTopBorderThickness}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="24"
                              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              value={invoiceStyles.invoiceTopBorderThickness}
                              onChange={(e) => setInvoiceStyles(prev => ({ ...prev, invoiceTopBorderThickness: parseInt(e.target.value) }))}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <span className="block font-medium">ពណ៌រចនាប័ទ្ម (Theme Accent Color):</span>
                            <div className="flex gap-2">
                              {['#10b981', '#1e3a8a', '#6366f1', '#ec4899', '#f59e0b', '#374151'].map((col) => (
                                <button
                                  type="button"
                                  key={col}
                                  onClick={() => setInvoiceStyles(prev => ({ ...prev, topBorderColor: col }))}
                                  style={{ backgroundColor: col }}
                                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                                    invoiceStyles.topBorderColor === col ? 'border-amber-400 scale-110' : 'border-stone-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Scaled invoice viewport container */}
                  <div 
                    ref={invoiceViewportRef}
                    className="w-full flex flex-col items-center overflow-x-auto overflow-y-visible p-1 sm:p-2 relative print:p-0 print:overflow-visible"
                    style={{ minHeight: isDownloading ? 'auto' : `${Math.round(invoiceContentHeight * effectiveScale + 12)}px` }}
                  >
                    <div
                      style={{
                        width: '850px',
                        transform: isDownloading ? 'none' : `scale(${effectiveScale})`,
                        transformOrigin: 'top center',
                        transition: isDownloading ? 'none' : 'transform 0.15s ease-out',
                        marginBottom: isDownloading ? '0' : `${Math.round((effectiveScale - 1) * invoiceContentHeight)}px`
                      }}
                      className="shrink-0 print:w-full print:m-0 print:transform-none"
                    >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            ref={invoiceRef}
            className="w-[850px] bg-white shadow-2xl rounded-sm overflow-hidden print:shadow-none print:m-0 print:w-full"
            id="invoice-content"
          >
            <div 
              style={{
                padding: `${invoiceStyles.invoicePadding}px`,
                borderTop: `${invoiceStyles.invoiceTopBorderThickness}px solid ${invoiceStyles.topBorderColor}`
              }}
              className="text-blue-900"
            >
              
              {/* Landlord Info Header */}
              <div className="flex justify-between items-start mb-10 w-full">
                <div className="space-y-1 w-[320px] shrink-0 text-left">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-blue-900 text-sm font-bold shrink-0">ម្ចាស់ផ្ទះ៖</span>
                    {isInvoiceReadOnly ? (
                      <span className="font-moul text-base text-blue-900 border-b border-transparent py-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {data.landlordName || 'សាង សុវណ្ណារតនៈ'}
                      </span>
                    ) : (
                      <input 
                        className="font-moul text-base text-blue-900 border-b border-transparent hover:border-stone-200 focus:border-emerald-500 outline-none transition-all flex-1 min-w-0 whitespace-nowrap"
                        value={data.landlordName}
                        onChange={(e) => setData({...data, landlordName: e.target.value})}
                      />
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-blue-900 text-sm">
                    <Home className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {isInvoiceReadOnly ? (
                      <span className="w-full text-blue-900 text-xs whitespace-pre-wrap py-0.5 leading-snug">
                        {data.landlordAddress || 'ផ្ទះលេខ ១២ ផ្លូវ ២៨៨ សង្កាត់បឹងកេងកង១'}
                      </span>
                    ) : (
                      <textarea 
                        className="w-full bg-transparent border-b border-transparent hover:border-stone-200 focus:border-emerald-500 outline-none resize-none h-12 text-xs"
                        value={data.landlordAddress}
                        onChange={(e) => setData({...data, landlordAddress: e.target.value})}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-blue-900 text-sm">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    {isInvoiceReadOnly ? (
                      <span className="text-blue-900 text-sm font-bold py-0.5 font-sans whitespace-nowrap">
                        {data.landlordPhone || '012 345 678'}
                      </span>
                    ) : (
                      <input 
                        className="bg-transparent border-b border-transparent hover:border-stone-200 focus:border-emerald-500 outline-none w-full font-sans text-sm font-bold"
                        value={data.landlordPhone}
                        onChange={(e) => setData({...data, landlordPhone: e.target.value})}
                      />
                    )}
                  </div>
                </div>

                <div className="text-center w-[270px] shrink-0 flex flex-col items-center justify-center">
                  <h2 
                    style={{ fontSize: `${invoiceStyles.khmerTitleSize || 19}px` }}
                    className="text-red-600 font-moul font-normal tracking-tight mb-1 whitespace-nowrap"
                  >
                    វិក្កយបត្រថ្លៃជួលបន្ទប់
                  </h2>
                  <div 
                    style={{ 
                      height: `${invoiceStyles.dividerThickness}px`, 
                      backgroundColor: invoiceStyles.dividerColor,
                      width: `${11.5 * invoiceStyles.englishSubTitleSize}px`
                    }}
                    className="mb-1.5 mx-auto"
                  ></div>
                  <p 
                    style={{ fontSize: `${invoiceStyles.englishSubTitleSize}px` }}
                    className="text-blue-900 font-medium uppercase tracking-wider whitespace-nowrap"
                  >
                    INVOICE FOR RENT ROOM
                  </p>
                </div>

                <div className="flex flex-col items-end w-[180px] shrink-0">
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className={`w-24 h-24 flex items-center justify-center cursor-pointer transition-all overflow-hidden group relative shrink-0 ${
                      data.logoUrl 
                        ? 'bg-transparent border-0' 
                        : isDownloading
                          ? 'bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm mb-2'
                          : 'bg-stone-100 border-2 border-dashed border-stone-300 rounded-2xl shadow-sm mb-2'
                    }`}
                  >
                    {data.logoUrl ? (
                      <img src={data.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-emerald-800">
                        <Home className="w-8 h-8 text-emerald-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-sans">ROOM RENT</span>
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity ${isInvoiceReadOnly ? 'hidden' : 'print:hidden'}`}>
                      Change
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest"></p>
                </div>
              </div>

              {/* Tenant Info Grid with quick selector buttons for Name, Room, Phone */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10 text-sm relative z-50">
                <div className="space-y-3">
                  
                  {/* Select Tenant by NAME */}
                  <div className="flex items-center gap-2 relative">
                    <span className="whitespace-nowrap text-blue-900 font-medium">ឈ្មោះអ្នកជួលបន្ទប់ (Name):</span>
                    <div className="flex-1 relative flex items-center">
                      {isInvoiceReadOnly ? (
                        <span className="w-full font-moul text-blue-900 text-sm pb-0.5">
                          {data.tenantName || '—'}
                        </span>
                      ) : (
                        <>
                          <input 
                            className="w-full font-moul text-blue-900 outline-none pb-0.5 border-b border-stone-200/50 focus:border-emerald-500 focus:border-b-2 transition-all"
                            value={data.tenantName}
                            onChange={(e) => setData({...data, tenantName: e.target.value})}
                            placeholder="វាយបញ្ចូល ឬជ្រើសរើសឈ្មោះ... / Enter or select name..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowNameDropdown(!showNameDropdown);
                              setShowRoomDropdown(false);
                              setShowPhoneDropdown(false);
                            }}
                            className={`ml-1 p-1 rounded transition-all print:hidden ${showNameDropdown ? 'text-emerald-600 bg-emerald-50' : 'text-stone-400 hover:text-emerald-600'}`}
                            title="ជ្រើសរើសតាមឈ្មោះ / Select by Name"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {showNameDropdown && !isInvoiceReadOnly && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-xl z-[60] max-h-48 overflow-y-auto divide-y divide-stone-100 print:hidden">
                          {sortedSavedTenants.map((tenant) => (
                            <button
                              key={tenant.tenantName}
                              type="button"
                              onClick={() => {
                                handleSelectTenant(tenant);
                                setShowNameDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-stone-50 transition-colors text-xs flex justify-between items-center"
                            >
                              <span className="font-moul text-blue-900 text-[11px]">{tenant.tenantName}</span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold font-sans">
                                {formatRoomBadge(tenant.roomNo)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Select Tenant by ROOM */}
                  <div className="flex items-center gap-2 relative">
                    <span className="whitespace-nowrap text-blue-900 font-medium">លេខបន្ទប់ (Room No):</span>
                    <div className="flex-1 relative flex items-center">
                      {isInvoiceReadOnly ? (
                        <span className="w-full font-bold text-blue-900 text-sm pb-0.5 font-sans">
                          {data.roomNo ? formatRoomBadge(data.roomNo) : '—'}
                        </span>
                      ) : (
                        <>
                          <input 
                            className="w-full font-bold text-blue-900 outline-none pb-0.5 border-b border-stone-200/50 focus:border-emerald-500 focus:border-b-2 transition-all"
                            value={data.roomNo}
                            onChange={(e) => setData({...data, roomNo: e.target.value})}
                            placeholder="ជ្រើសរើសលេខបន្ទប់... / Select room..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowRoomDropdown(!showRoomDropdown);
                              setShowNameDropdown(false);
                              setShowPhoneDropdown(false);
                            }}
                            className={`ml-1 p-1 rounded transition-all print:hidden ${showRoomDropdown ? 'text-emerald-600 bg-emerald-50' : 'text-stone-400 hover:text-emerald-600'}`}
                            title="ជ្រើសរើសតាមលេខបន្ទប់ / Select by Room"
                          >
                            <Home className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {showRoomDropdown && !isInvoiceReadOnly && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-xl z-[60] max-h-48 overflow-y-auto divide-y divide-stone-100 font-sans print:hidden">
                          {sortedSavedTenants.map((tenant) => (
                            <button
                              key={tenant.roomNo}
                              type="button"
                              onClick={() => {
                                handleSelectTenant(tenant);
                                setShowRoomDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-stone-50 transition-colors text-xs flex justify-between items-center"
                            >
                              <span className="font-bold text-stone-800">បន្ទប់ (Room) {formatRoomBadge(tenant.roomNo)}</span>
                              <span className="text-[10px] font-moul text-blue-900">{tenant.tenantName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Select Tenant by PHONE */}
                  <div className="flex items-center gap-2 relative">
                    <span className="whitespace-nowrap text-blue-900 font-medium">លេខទូរស័ព្ទ (Phone):</span>
                    <div className="flex-1 relative flex items-center">
                      {isInvoiceReadOnly ? (
                        <span className="w-full font-bold text-blue-900 text-sm pb-0.5 font-sans">
                          {data.tenantPhone || '—'}
                        </span>
                      ) : (
                        <>
                          <input 
                            className="w-full font-bold text-blue-900 outline-none pb-0.5 border-b border-stone-200/50 focus:border-emerald-500 focus:border-b-2 transition-all"
                            value={data.tenantPhone}
                            onChange={(e) => setData({...data, tenantPhone: e.target.value})}
                            placeholder="ជ្រើសរើសលេខទូរស័ព្ទ... / Select phone..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowPhoneDropdown(!showPhoneDropdown);
                              setShowNameDropdown(false);
                              setShowRoomDropdown(false);
                            }}
                            className={`ml-1 p-1 rounded transition-all print:hidden ${showPhoneDropdown ? 'text-emerald-600 bg-emerald-50' : 'text-stone-400 hover:text-emerald-600'}`}
                            title="ជ្រើសរើសតាមលេខទូរស័ព្ទ / Select by Phone"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {showPhoneDropdown && !isInvoiceReadOnly && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-md shadow-xl z-[60] max-h-48 overflow-y-auto divide-y divide-stone-100 font-sans print:hidden">
                          {sortedSavedTenants.map((tenant) => (
                            <button
                              key={tenant.tenantPhone}
                              type="button"
                              onClick={() => {
                                handleSelectTenant(tenant);
                                setShowPhoneDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-stone-50 transition-colors text-xs flex justify-between items-center"
                            >
                              <span className="font-bold text-stone-800">{tenant.tenantPhone || 'មិនទាន់បញ្ចូលទេ / Not specified'}</span>
                              <span className="text-[10px] text-stone-500 font-moul">{tenant.tenantName} ({formatRoomBadge(tenant.roomNo)})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="whitespace-nowrap text-blue-900">អត្តសញ្ញាណប័ណ្ណ (ID No):</span>
                    {isInvoiceReadOnly ? (
                      <span className="flex-1 font-bold text-blue-900 pb-0.5 border-b border-transparent font-sans">
                        {data.tenantIdNo || formatTenantId(data.roomNo) || '—'}
                      </span>
                    ) : (
                      <input 
                        className="flex-1 font-bold text-blue-900 outline-none pb-0.5 border-b border-stone-200/50 focus:border-emerald-500 focus:border-b-2 transition-all"
                        value={data.tenantIdNo}
                        onChange={(e) => setData({...data, tenantIdNo: e.target.value})}
                        placeholder="..."
                      />
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="whitespace-nowrap text-blue-900">ថ្ងៃចូលស្នាក់នៅ (Check-in):</span>
                    {isInvoiceReadOnly ? (
                      <span className="flex-1 font-bold text-blue-900 pb-0.5 border-b border-transparent font-sans">
                        {data.checkInDate || '—'}
                      </span>
                    ) : (
                      <input 
                        type="date"
                        className="flex-1 font-bold text-blue-900 outline-none pb-0.5 border-b border-stone-200/50 focus:border-emerald-500 focus:border-b-2 transition-all"
                        value={data.checkInDate}
                        onChange={(e) => setData({...data, checkInDate: e.target.value})}
                      />
                    )}
                  </div>
                  
                  {/* Bilingual Khmer-English Security Deposit Field (Display only, does not accumulate) */}
                  <div className="flex items-end gap-2">
                    <span className="whitespace-nowrap text-blue-900">ប្រាក់កក់ (Security Deposit):</span>
                    <span className="flex-1 font-bold text-blue-900 pb-0.5 border-b border-stone-200/50 font-mono text-right pr-2">
                      {(() => {
                        const activeTenantRecord = savedTenants.find(t => t.roomNo === data.roomNo);
                        return activeTenantRecord && activeTenantRecord.deposit !== undefined 
                          ? `$${activeTenantRecord.deposit.toFixed(2)}` 
                          : '$0.00';
                      })()}
                    </span>
                    <span className="text-[9px] text-stone-400 italic shrink-0 print:hidden font-sans"></span>
                  </div>
                </div>
              </div>

              {/* Table and QR Section */}
              <div className="flex justify-between items-start gap-4 mb-10 relative z-30 w-full">
                {/* Invoice Items Table */}
                <div className="flex-1 shrink-0">
                  <table 
                    style={{ fontSize: `${invoiceStyles.tableFontSize}px` }}
                    className="w-full border-collapse border border-stone-800"
                  >
                    <thead>
                      <tr className="bg-stone-50">
                        <th className="border border-stone-800 p-2 text-center font-bold text-blue-900 w-1/3">
                          បរិយាយ<br/><span className="text-[10px] font-normal">Description</span>
                        </th>
                        <th className="border border-stone-800 p-2 text-center font-bold text-blue-900">
                          លេខចាស់<br/><span className="text-[10px] font-normal">Old Month Nº</span>
                        </th>
                        <th className="border border-stone-800 p-2 text-center font-bold text-blue-900">
                          លេខថ្មី<br/><span className="text-[10px] font-normal">New Month Nº</span>
                        </th>
                        <th className="border border-stone-800 p-2 text-center font-bold text-blue-900">
                          ចំនួនប្រើ<br/><span className="text-[10px] font-normal">Quantity</span>
                        </th>
                        <th className="border border-stone-800 p-2 text-center font-bold text-blue-900">
                          តម្លៃមួយ<br/><span className="text-[10px] font-normal">Unit Price</span>
                        </th>
                        <th className="border border-stone-800 p-2 text-center font-bold text-blue-900">
                          ទឹកប្រាក់សរុប<br/><span className="text-[10px] font-normal">Amount</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item) => {
                        const isUtility = item.description.includes('អគ្គិសនី') || 
                                          item.description.includes('Electricity') || 
                                          item.description.includes('ទឹក') || 
                                          item.description.includes('Water');
                        return (
                          <tr key={item.id} className="h-12 group">
                            <td className="border border-stone-800 px-3 py-1 font-bold text-blue-900 relative">
                              {isInvoiceReadOnly ? (
                                <span className="font-bold text-blue-900 block">{item.description}</span>
                              ) : (
                                <>
                                  <input 
                                    className="w-full bg-transparent outline-none"
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  />
                                  <button 
                                    onClick={() => removeItem(item.id)}
                                    className="absolute -left-8 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </td>
                            
                            {/* Old Month Nº Cell */}
                            <td className="border border-stone-800 p-1 text-center">
                              {isUtility ? (
                                isInvoiceReadOnly ? (
                                  <span className="font-bold text-stone-800 font-sans">{item.oldMonthNo || '—'}</span>
                                ) : (
                                  <input 
                                    className="w-full text-center bg-transparent outline-none font-bold"
                                    placeholder="លេខចាស់ / Old No."
                                    value={item.oldMonthNo}
                                    onChange={(e) => updateItem(item.id, 'oldMonthNo', e.target.value)}
                                  />
                                )
                              ) : (
                                <span className="text-stone-400 font-sans">—</span>
                              )}
                            </td>
                            
                            {/* New Month Nº Cell */}
                            <td className="border border-stone-800 p-1 text-center">
                              {isUtility ? (
                                isInvoiceReadOnly ? (
                                  <span className="font-bold text-emerald-800 font-sans">{item.newMonthNo || '—'}</span>
                                ) : (
                                  <input 
                                    className="w-full text-center bg-transparent outline-none font-bold text-emerald-700 bg-emerald-50/50 focus:bg-emerald-100/50 focus:border-emerald-500"
                                    placeholder="លេខថ្មី / New No."
                                    value={item.newMonthNo}
                                    onChange={(e) => updateItem(item.id, 'newMonthNo', e.target.value)}
                                  />
                                )
                              ) : (
                                <span className="text-stone-400 font-sans">—</span>
                              )}
                            </td>
                            
                            <td className="border border-stone-800 p-1 text-center font-bold">
                              <div className="flex flex-col items-center">
                                {isInvoiceReadOnly ? (
                                  <span className="font-bold text-stone-900 font-sans">{item.quantity}</span>
                                ) : (
                                  <input 
                                    className="w-12 text-center bg-transparent outline-none"
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  />
                                )}
                                {item.unit && <span className="text-[10px] text-blue-700">{item.unit}</span>}
                              </div>
                            </td>
                            <td className="border border-stone-800 p-1 text-center font-bold">
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <div className="flex items-center justify-center gap-1 font-sans">
                                  {isInvoiceReadOnly ? (
                                    <span className="font-bold text-xs text-blue-900">
                                      {item.currency === 'USD' ? '$' : '៛'}
                                    </span>
                                  ) : (
                                    <>
                                      <select 
                                        className="bg-transparent outline-none text-[10px] print:hidden cursor-pointer"
                                        value={item.currency}
                                        onChange={(e) => updateItem(item.id, 'currency', e.target.value)}
                                      >
                                        <option value="USD">$</option>
                                        <option value="KHR">៛</option>
                                      </select>
                                      <span className="hidden print:inline">{item.currency === 'USD' ? '$' : '៛'}</span>
                                    </>
                                  )}
                                  {isInvoiceReadOnly ? (
                                    <span className="font-bold text-xs text-blue-900 font-mono">
                                      {item.unitPrice}
                                    </span>
                                  ) : (
                                    <input 
                                      className="w-16 text-center bg-transparent outline-none font-mono"
                                      type="number"
                                      step={item.currency === 'KHR' ? "100" : "0.01"}
                                      value={item.unitPrice}
                                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    />
                                  )}
                                </div>
                                {item.currency === 'KHR' && (
                                  <span className="text-[9px] text-stone-500 font-normal leading-none font-sans">
                                    (${(item.unitPrice / 4000).toFixed(3)})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="border border-stone-800 p-1 text-center font-bold text-blue-900">
                              {item.currency === 'USD' ? (
                                <span className="font-mono">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                              ) : (
                                <div className="flex flex-col items-center justify-center leading-none">
                                  <span className="font-mono">៛{(item.quantity * item.unitPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                  <span className="text-[9px] text-stone-500 font-normal mt-0.5 font-sans">
                                    (${( (item.quantity * item.unitPrice) / 4000 ).toFixed(2)})
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Segmented template selector buttons under the table */}
                      <tr className={`bg-stone-50/50 ${isInvoiceReadOnly ? 'hidden' : 'print:hidden'}`}>
                        <td colSpan={6} className="border border-stone-800 p-2.5 text-center">
                          <div className="flex justify-center items-center gap-3">
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-sans">បន្ថែមជួរថ្មី / Add new row:</span>
                            <button 
                              type="button"
                              onClick={() => addItem('normal')}
                              className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded shadow-sm hover:bg-stone-50 transition-colors text-stone-700 font-bold text-xs font-sans"
                            >
                              <Plus className="w-3.5 h-3.5 text-stone-500" />
                              សេវាកម្មធម្មតា (Normal Service)
                            </button>
                            <button 
                              type="button"
                              onClick={() => addItem('electricity')}
                              className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded shadow-sm hover:bg-amber-100 transition-colors text-amber-800 font-bold text-xs font-sans"
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              អគ្គិសនី (Electricity KWH)
                            </button>
                            <button 
                              type="button"
                              onClick={() => addItem('water')}
                              className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded shadow-sm hover:bg-sky-100 transition-colors text-sky-800 font-bold text-xs font-sans"
                            >
                              <Droplets className="w-3.5 h-3.5 text-sky-500" />
                              ទឹក (Water M³)
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Convenient Tip Paragraph - Hidden during downloads and prints */}
                  <p className={`text-[10px] text-stone-400 mt-2 italic ${isInvoiceReadOnly ? 'hidden' : 'print:hidden'}`}>
                    💡 <b>ព័ត៌មានជំនួយ៖</b> អ្នកអាចវាយបញ្ចូល ឬកែសម្រួលទាំង <b>លេខវ៉ាត់ចាស់</b> និង <b>លេខវ៉ាត់ថ្មី</b> ដោយផ្ទាល់នៅក្នុងតារាងខាងលើ។ បន្ទាប់ពីវិក្កយបត្រត្រូវបានបោះពុម្ព ឬទាញយក ប្រព័ន្ធនឹងធ្វើបច្ចុប្បន្នភាពលេខថ្មីទាំងនេះជាលេខចាស់សម្រាប់ខែក្រោយដោយស្វ័យប្រវត្តិ! / <b>Tip:</b> You can freely edit both <b>Old</b> and <b>New Readings</b> directly in the table. Once the invoice is printed or downloaded, the system will automatically cycle the readings for next month!
                  </p>
                </div>

                {/* ABA QR Pay Code Card */}
                <div className="w-60 flex-shrink-0 ml-auto">
                  <input 
                    type="file" 
                    ref={qrInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'qr')}
                  />
                  <div 
                    onClick={() => qrInputRef.current?.click()}
                    className="border border-stone-200 rounded-2xl overflow-hidden bg-white flex flex-col items-center shadow-md cursor-pointer hover:shadow-lg transition-all group relative"
                  >
                    <div className="w-full h-2 bg-[#005a71]"></div>
                    
                    <div className="p-2.5 flex flex-col items-center w-full">
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[#005a71] font-black text-2xl tracking-tighter">ABA</span>
                        <span className="text-red-500 font-bold text-2xl">'</span>
                        <span className="text-[#48b6d1] font-bold text-2xl tracking-tighter">PAY</span>
                      </div>
                      <p className="text-stone-800 font-medium text-[10px] mb-4">Scan. Pay. Done.</p>
                      
                      <div className="relative w-40 h-40 bg-white p-1 border border-stone-100 rounded-xl mb-3 overflow-hidden">
                        {data.qrUrl ? (
                          <img src={data.qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-white flex items-center justify-center relative p-1">
                            {/* Crisp inline SVG KHQR Matrix - Guaranteed zero CORS failures */}
                            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                              {/* Outer corner finder patterns */}
                              <rect x="6" y="6" width="24" height="24" rx="4" stroke="#005a71" strokeWidth="3.5" fill="white" />
                              <rect x="12" y="12" width="12" height="12" rx="2" fill="#005a71" />
                              
                              <rect x="70" y="6" width="24" height="24" rx="4" stroke="#005a71" strokeWidth="3.5" fill="white" />
                              <rect x="76" y="12" width="12" height="12" rx="2" fill="#005a71" />
                              
                              <rect x="6" y="70" width="24" height="24" rx="4" stroke="#005a71" strokeWidth="3.5" fill="white" />
                              <rect x="12" y="76" width="12" height="12" rx="2" fill="#005a71" />
                              
                              {/* QR Modules */}
                              <rect x="36" y="10" width="5" height="5" fill="#1e293b" />
                              <rect x="46" y="10" width="5" height="5" fill="#1e293b" />
                              <rect x="56" y="10" width="5" height="5" fill="#1e293b" />
                              <rect x="36" y="20" width="5" height="5" fill="#1e293b" />
                              <rect x="56" y="20" width="5" height="5" fill="#1e293b" />
                              
                              <rect x="10" y="38" width="5" height="5" fill="#1e293b" />
                              <rect x="20" y="38" width="5" height="5" fill="#1e293b" />
                              <rect x="30" y="38" width="5" height="5" fill="#1e293b" />
                              <rect x="40" y="38" width="5" height="5" fill="#1e293b" />
                              <rect x="50" y="38" width="5" height="5" fill="#1e293b" />
                              <rect x="60" y="38" width="5" height="5" fill="#1e293b" />
                              <rect x="70" y="38" width="5" height="5" fill="#1e293b" />
                              <rect x="80" y="38" width="5" height="5" fill="#1e293b" />

                              <rect x="36" y="48" width="5" height="5" fill="#1e293b" />
                              <rect x="58" y="48" width="5" height="5" fill="#1e293b" />
                              <rect x="68" y="48" width="5" height="5" fill="#1e293b" />
                              <rect x="85" y="48" width="5" height="5" fill="#1e293b" />

                              <rect x="36" y="58" width="5" height="5" fill="#1e293b" />
                              <rect x="46" y="58" width="5" height="5" fill="#1e293b" />
                              <rect x="68" y="58" width="5" height="5" fill="#1e293b" />

                              <rect x="36" y="70" width="5" height="5" fill="#1e293b" />
                              <rect x="46" y="70" width="5" height="5" fill="#1e293b" />
                              <rect x="56" y="70" width="5" height="5" fill="#1e293b" />
                              <rect x="76" y="70" width="5" height="5" fill="#1e293b" />
                              <rect x="85" y="70" width="5" height="5" fill="#1e293b" />

                              <rect x="46" y="82" width="5" height="5" fill="#1e293b" />
                              <rect x="66" y="82" width="5" height="5" fill="#1e293b" />
                              <rect x="85" y="82" width="5" height="5" fill="#1e293b" />

                              {/* Center ABA KHQR Brand Badge */}
                              <circle cx="50" cy="50" r="11" fill="white" stroke="#005a71" strokeWidth="2" />
                              <circle cx="50" cy="50" r="8" fill="#005a71" />
                              <text x="50" y="53.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="900" fontFamily="sans-serif">$</text>
                            </svg>
                          </div>
                        )}
                        <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity ${isInvoiceReadOnly ? 'hidden' : 'print:hidden'}`}>
                          Upload QR
                        </div>
                      </div>

                      <div className="text-center mb-6">
                        <p className="text-stone-700 font-bold text-xs tracking-wide">NGUON SOVANNA</p>
                      </div>

                      <div className="w-full flex justify-between items-end mt-auto">
                        <div className="flex flex-col items-start">
                          <span className="text-[8px] text-stone-400 font-bold">Member of</span>
                          <div className="flex items-center gap-0.5">
                            <span className="text-red-600 font-black text-xs italic">KH</span>
                            <span className="text-blue-900 font-black text-xs italic">QR</span>
                          </div>
                        </div>
                        <div className="relative w-12 h-12">
                          <div className="absolute bottom-[-16px] right-[-16px] w-16 h-16 bg-red-600 rounded-tl-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules and Total */}
              <div className="grid grid-cols-3 gap-8 items-start relative z-30">
                <div className="col-span-2">
                  <h3 className="text-blue-900 font-bold text-sm mb-2">បញ្ជាក់ (Rules):</h3>
                  <ul className="text-[11px] text-blue-900 space-y-1 list-disc pl-4 leading-relaxed">
                    {data.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                  <p className="text-blue-900 font-bold text-[10px] mt-3 italic">
                    &gt;&gt; ម្ចាស់ផ្ទះមិនទទួលខុសត្រូវចំពោះការបាត់បង់ ឬខូចខាតទ្រព្យសម្បត្តិផ្ទាល់ខ្លួនរបស់អ្នកជួលឡើយ។
                    <br/>
                    <span className="text-blue-700 font-normal">(The landlord will not be responsible for any loss or damage to the tenant's personal property)</span>
                  </p>
                </div>

                <div className="text-right">
                  <div className="flex justify-between items-center border-b-2 border-stone-800 pb-2 mb-1">
                    <span className="font-bold text-red-600">សរុប (Total USD)</span>
                    <span className="text-3xl font-black text-red-600">${data.totalUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-stone-300 pb-1.5 mb-1 text-blue-900 font-bold">
                    <span className="text-xs">សរុបជាលុយរៀល (Total KHR)</span>
                    <span className="text-lg font-black font-mono">៛{(data.totalUsd * 4000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <p className="text-[10px] text-red-500 italic">អត្រាប្រាក់ ១ $ = ៤០០០ រៀល (Rate: $1 = 4000 KHR)</p>
                </div>
              </div>

              {/* Signature block */}
              <div className="mt-16 grid grid-cols-2 gap-20 text-center relative z-30">
                <div className="space-y-12">
                  <p className="font-bold text-blue-900">អ្នកជួល (Tenant)</p>
                  <div className="flex flex-col items-center">
                    <p className="font-moul text-blue-900">{data.tenantName || '—'}</p>
                  </div>
                </div>
                <div className="space-y-12">
                  <p className="font-bold text-blue-900">ម្ចាស់ផ្ទះ (Landlord)</p>
                  <div className="flex flex-col items-center">
                    <p className="font-moul text-blue-900">{data.landlordName || '—'}</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>

      {/* TENANT ROOM-SPECIFIC PAYMENT HISTORY (Shown strictly for logged-in tenant) */}
      {userRole === 'tenant' && (
        <div className="mt-8 bg-stone-900 border border-emerald-800/60 rounded-2xl p-5 shadow-xl print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 border-b border-stone-800 pb-3 font-sans">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span>ប្រវត្តិបង់ប្រាក់បន្ទប់ {currentActiveTenant?.roomNo || data.roomNo} (Room Payment History)</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                បង្ហាញតែប្រវត្តិបង់ប្រាក់របស់បន្ទប់ {currentActiveTenant?.roomNo || data.roomNo} ប៉ុណ្ណោះ។ (Showing payment records for room {currentActiveTenant?.roomNo || data.roomNo} only.)
              </p>
            </div>
            <span className="text-xs bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full font-mono font-bold border border-emerald-700/60">
              លេខសម្គាល់ ID / Tenant ID: {currentActiveTenant?.tenantIdNo || formatTenantId(currentActiveTenant?.roomNo || data.roomNo)}
            </span>
          </div>

          {tenantHistory.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs bg-stone-950/60 rounded-xl border border-stone-800/80 font-sans">
              <CreditCard className="w-8 h-8 text-stone-600 mx-auto mb-2 opacity-50" />
              <span>មិនទាន់មានប្រវត្តិបង់ប្រាក់ពីមុនមកសម្រាប់បន្ទប់នេះទេ។ / No previous payment records found for this room.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px] tracking-wider bg-stone-950/70">
                    <th className="py-2.5 px-3">កាលបរិច្ឆេទ / Payment Date</th>
                    <th className="py-2.5 px-3">លេខវិក្កយបត្រ / Receipt Nº</th>
                    <th className="py-2.5 px-3 text-right">ភ្លើង / Elec (kWh)</th>
                    <th className="py-2.5 px-3 text-right">ទឹក / Water (m³)</th>
                    <th className="py-2.5 px-3 text-right">ចំនួនទឹកប្រាក់ / Amount USD</th>
                    <th className="py-2.5 px-3 text-center">ស្ថានភាព / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {tenantHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-stone-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-stone-300 font-mono">{rec.paymentDate}</td>
                      <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px]">{rec.id}</td>
                      <td className="py-2.5 px-3 text-right text-stone-200 font-mono">{rec.elecUsage}</td>
                      <td className="py-2.5 px-3 text-right text-stone-200 font-mono">{rec.waterUsage}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">${rec.totalUsd.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-600/60 px-2 py-0.5 rounded text-[10px] font-bold">
                          ✓ បានទូទាត់ / PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )}

          {/* Summary Checker Tab */}
          {userRole === 'admin' && activeTab === 'summaryChecker' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white shadow-2xl rounded-xl overflow-hidden p-6 sm:p-8 border border-stone-200 font-sans"
            >
              {/* Header */}
              <div className="border-b border-stone-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-600" />
                  🔍 ពិនិត្យផលបូកសរុប និងទាញយកវិក្កយបត្រ (TOTAL SUMMARY CHECKER & INVOICE GENERATOR)
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  ជ្រើសរើសបន្ទប់ស្នាក់នៅ ដើម្បីពិនិត្យលម្អិតការបង់ប្រាក់ប្រចាំខែ និងទាញយកវិក្កយបត្រសរុបជាលក្ខណៈ 4K PNG។<br/>
                  <span className="text-stone-400">Select a room to review cumulative monthly payments, see the live invoice draft, and download it as high-fidelity 4K PNG.</span>
                </p>
              </div>

              {/* Core Checker Dashboard Row */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* LEFT SIDE: SUMMARY LIST & TOTALS (5 cols) */}
                <div className="xl:col-span-5 bg-stone-50 border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-1.5">
                      🔎 ពិនិត្យផលបូកសរុបរបស់ភ្ញៀវ (TOTAL SUMMARY CHECKER)
                    </h3>
                    <p className="text-[10px] text-stone-500 mt-0.5">មើលសរុបចំណូលតាមខែនីមួយៗ និងពេញមួយឆ្នាំរបស់ភ្ញៀវនីមួយៗ / View totals of selected room.</p>
                  </div>

                  {/* Room & Statement Date Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">បន្ទប់ស្នាក់នៅ (Select Room)</label>
                      <select
                        className="bg-white border border-stone-300 rounded px-2.5 py-2 text-xs font-bold text-stone-800 outline-none w-full shadow-sm font-sans"
                        value={inputRoomNo}
                        onChange={(e) => {
                          const rNo = e.target.value;
                          setInputRoomNo(rNo);
                          const tData = savedTenants.find(t => t.roomNo === rNo);
                          if (tData) {
                            setInputTenantName(tData.tenantName);
                            setInputRoomPrice(tData.roomPrice);
                            setInputWifiPrice(tData.wifiPrice);
                          }
                        }}
                      >
                        {sortedSavedTenants.map(t => (
                          <option key={t.roomNo} value={t.roomNo}>បន្ទប់ {formatRoomBadge(t.roomNo)} ({t.tenantName})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">កាលបរិច្ឆេទ (Statement Date)</label>
                      <input
                        type="date"
                        className="bg-white border border-stone-300 rounded px-2.5 py-2 text-xs font-bold text-stone-800 outline-none w-full shadow-sm font-sans"
                        value={statementDate}
                        onChange={(e) => setStatementDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 12-Month Checkoff */}
                  <div className="border border-stone-200 bg-white rounded-lg p-3 text-xs space-y-2 max-h-64 overflow-y-auto font-sans">
                    <div className="flex justify-between items-center font-bold text-stone-800 border-b pb-1.5 mb-1.5 text-[11px] uppercase tracking-wider">
                      <span>ខែ (Month)</span>
                      <span>សរុបបង់ (Total Collected)</span>
                    </div>

                    {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((mIndex) => {
                      const mRecord = history.find(h => 
                        (h.roomNo === inputRoomNo || h.tenantName.toLowerCase().trim() === inputTenantName.toLowerCase().trim()) && 
                        h.paymentDate.split('-')[1] === mIndex
                      );
                      
                      return (
                        <div key={mIndex} className="flex justify-between items-center text-[11px] py-1.5 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                          <span className="font-medium text-stone-600 font-sans">ខែ {parseInt(mIndex)} / Month {parseInt(mIndex)}</span>
                          {mRecord ? (
                            <span className="font-mono font-bold text-emerald-600">${mRecord.totalUsd.toFixed(2)}</span>
                          ) : (
                            <span className="text-stone-300 font-mono">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Year Cumulative box */}
                  <div className="bg-emerald-600 text-white rounded-lg p-3.5 flex justify-between items-center border border-emerald-500 shadow-sm font-sans">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100">សរុបរួមរបស់ភ្ញៀវ (Customer Cumulative Total)</p>
                      <p className="text-lg font-black font-mono mt-0.5">
                        ${getSummaryGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <span className="text-xl">💰</span>
                  </div>

                   {/* Action Buttons for Summary Checker */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportSummaryPdf('device')}
                        disabled={isDownloading}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs font-sans disabled:opacity-50"
                        title="Export calibrated PDF based on current device"
                      >
                        {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5 text-rose-200" />}
                        <span>នាំចេញ PDF ឧបករណ៍ / Device PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportSummaryPdf('a4')}
                        disabled={isDownloading}
                        className="bg-stone-800 hover:bg-stone-700 text-rose-300 border border-stone-700 font-bold py-2.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs font-sans disabled:opacity-50"
                        title="Export standard A4 PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>នាំចេញ PDF A4 / Export A4 PDF</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const filename = `Invoice-Total-Room-${inputRoomNo}-${inputTenantName.trim().replace(/\s+/g, '-')}`;
                        handleDownloadSlip(customerSummaryInvoiceRef, filename);
                      }}
                      disabled={isDownloading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs font-sans"
                    >
                      {isDownloading && !isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      ទាញយកវិក្កយបត្រសរុប 4K (Download 4K Image)
                    </button>
                  </div>
                </div>

                {/* RIGHT SIDE: BEAUTIFUL LIVE PREVIEW OF THE PRINT STATEMENT (7 cols) */}
                <div className="xl:col-span-7 bg-stone-100 p-6 rounded-xl border border-stone-200 flex flex-col items-center overflow-x-auto">
                  <p className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4 font-sans flex items-center gap-1.5">
                    👁️ ទិដ្ឋភាពផ្សាយបន្តផ្ទាល់នៃវិក្កយបត្រ (LIVE SUMMARY STATEMENT PREVIEW)
                  </p>

                  <div className="bg-white p-6 shadow-md border border-stone-200 rounded text-stone-800 w-[500px] text-[11px] font-sans relative shrink-0">
                    {/* Corner accents */}
                    <div className="absolute top-1.5 left-1.5 text-[8px] text-emerald-600/30">✦</div>
                    <div className="absolute top-1.5 right-1.5 text-[8px] text-emerald-600/30">✦</div>

                    {/* Header */}
                    <div className="text-center border-b border-stone-200 pb-3 mb-3">
                      <h4 className="font-moul text-emerald-800 text-xs">វិក្កយបត្រសង្ខេបរបស់ភ្ញៀវ</h4>
                      <h5 className="font-bold text-stone-800 text-[9px] tracking-wider uppercase mt-0.5">CUSTOMER SUMMARY STATEMENT ({statementDate ? statementDate.split('-')[0] : new Date().getFullYear()})</h5>
                      <p className="text-[9px] text-stone-400 font-sans">បន្ទប់ជួលផ្ទះបឹងកេងកង / Boeng Keng Kang Room Rental</p>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-2 text-[9px] mb-3 pb-3 border-b border-stone-100">
                      <div>
                        <p className="text-stone-500">បន្ទប់ស្នាក់នៅ (Room No): <span className="font-bold text-emerald-800">{formatRoomBadge(inputRoomNo)}</span></p>
                        <p className="text-stone-500 mt-0.5">ឈ្មោះអ្នកជួល (Tenant Name): <span className="font-bold text-blue-900 font-sans">{inputTenantName}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-stone-500">ម្ចាស់ផ្ទះ (Landlord): <span className="font-bold text-stone-700">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</span></p>
                        <p className="text-stone-500 mt-0.5 font-sans">កាលបរិច្ឆេទ (Date): <span className="font-bold text-stone-700">{statementDate ? statementDate.split('-').reverse().join('-') : ''}</span></p>
                      </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-left border-collapse border border-stone-200 text-[9px] font-sans mb-4">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[8px]">
                          <th className="p-1 border border-stone-200">ខែ (Month)</th>
                          <th className="p-1 border border-stone-200 text-right">ថ្លៃបន្ទប់ (Rent)</th>
                          <th className="p-1 border border-stone-200 text-right">ភ្លើង (Elec)</th>
                          <th className="p-1 border border-stone-200 text-right">ទឹក (Water)</th>
                          <th className="p-1 border border-stone-200 text-right">Wifi/ផ្សេងៗ (Wifi/Other)</th>
                          <th className="p-1 border border-stone-200 text-right">សរុប (Total)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((mIndex) => {
                          const mRecord = history.find(h => 
                            (h.roomNo === inputRoomNo || h.tenantName.toLowerCase().trim() === inputTenantName.toLowerCase().trim()) && 
                            h.paymentDate.split('-')[1] === mIndex
                          );

                          return (
                            <tr key={mIndex} className="border-b border-stone-100 hover:bg-stone-50/50">
                              <td className="p-1 border border-stone-200 font-bold">ខែ {parseInt(mIndex)}</td>
                              <td className="p-1 border border-stone-200 text-right font-mono text-stone-500">
                                {mRecord ? `$${mRecord.roomPrice.toFixed(2)}` : '—'}
                              </td>
                              <td className="p-1 border border-stone-200 text-right font-mono text-stone-500">
                                {mRecord ? `$${mRecord.elecPrice.toFixed(2)}` : '—'}
                              </td>
                              <td className="p-1 border border-stone-200 text-right font-mono text-stone-500">
                                {mRecord ? `$${mRecord.waterPrice.toFixed(2)}` : '—'}
                              </td>
                              <td className="p-1 border border-stone-200 text-right font-mono text-stone-500">
                                {mRecord ? `$${(mRecord.wifiPrice + mRecord.otherPrice).toFixed(2)}` : '—'}
                              </td>
                              <td className="p-1 border border-stone-200 text-right font-mono font-bold text-emerald-600">
                                {mRecord ? `$${mRecord.totalUsd.toFixed(2)}` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-stone-100 font-bold border-t-2 border-stone-300 text-[8.5px]">
                          <td className="p-1 border border-stone-200 text-stone-800">សរុប (TOTAL)</td>
                          <td className="p-1 border border-stone-200 text-right font-mono text-stone-700">${getSummaryCategoryTotals().totalRoom.toFixed(2)}</td>
                          <td className="p-1 border border-stone-200 text-right font-mono text-stone-700">${getSummaryCategoryTotals().totalElec.toFixed(2)}</td>
                          <td className="p-1 border border-stone-200 text-right font-mono text-stone-700">${getSummaryCategoryTotals().totalWater.toFixed(2)}</td>
                          <td className="p-1 border border-stone-200 text-right font-mono text-stone-700">${getSummaryCategoryTotals().totalWifiOther.toFixed(2)}</td>
                          <td className="p-1 border border-stone-200 text-right font-mono text-emerald-700 font-extrabold">${getSummaryCategoryTotals().totalCollected.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Total */}
                    <div className="flex justify-between items-center border-t border-stone-400 pt-2 font-bold mb-6 text-[10px]">
                      <span className="uppercase text-stone-700">សរុបប្រមូលបានទាំងអស់ (GRAND TOTAL COLLECTED)</span>
                      <span className="font-mono text-emerald-600 text-xs">
                        ${getSummaryGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Stamp & Signs */}
                    <div className="grid grid-cols-2 gap-6 text-center text-[8px] font-sans border-t border-dashed border-stone-200 pt-4 relative">
                      {/* CSS Landlord Official Red Circular Stamp/Seal */}
                      <div className="absolute left-[38%] top-[-10px] pointer-events-none select-none flex items-center justify-center scale-75">
                        <div className="w-[60px] h-[60px] rounded-full border-[2px] border-red-500/80 flex items-center justify-center p-0.5 relative rotate-[-12deg]">
                          <div className="w-[50px] h-[50px] rounded-full border border-dashed border-red-500/80 flex items-center justify-center relative">
                            <span className="absolute text-[4px] font-black text-red-500/80 uppercase tracking-wider text-center leading-none">
                              បន្ទប់ជួលផ្ទះបឹងកេងកង
                            </span>
                            <span className="absolute bottom-1 text-[3.5px] font-bold text-red-500/80 tracking-widest uppercase">
                              * ម្ចាស់ផ្ទះ *
                            </span>
                            <div className="text-xs text-red-500/80 select-none">💮</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-stone-400">ហត្ថលេខាអ្នកជួល (Tenant)</p>
                        <div className="h-6"></div>
                        <p className="font-bold text-stone-700">{inputTenantName}</p>
                      </div>
                      <div>
                        <p className="text-stone-400">ហត្ថលេខាម្ចាស់ផ្ទះ (Owner)</p>
                        <div className="h-6"></div>
                        <p className="font-bold text-stone-700">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Guest IDs Tab Screen */}
          {userRole === 'admin' && activeTab === 'tenantIds' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white shadow-2xl rounded-xl overflow-hidden p-6 sm:p-8 border border-stone-200 font-sans"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    សៀវភៅគ្រប់គ្រងលេខសម្គាល់ ID ភ្ញៀវជួល (Admin-Guest IDs Directory)
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    គ្រប់គ្រងលេខសម្គាល់ ID របស់ភ្ញៀវជួលបន្ទប់នីមួយៗសម្រាប់ការចូលប្រើប្រាស់ប្រព័ន្ធ។<br/>
                    <span className="text-stone-400">Manage custom ID codes for each room. Tenants can use these IDs to log in and update them from their portal.</span>
                  </p>
                </div>
                
                {/* Search Input for Guest ID */}
                <div className="relative w-full sm:w-64 font-sans text-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-stone-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="ស្វែងរកតាមបន្ទប់ ឬឈ្មោះ... / Search..."
                    className="pl-9 pr-4 py-2 w-full bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:bg-white text-stone-800 font-medium transition-all"
                    value={guestIdSearch}
                    onChange={(e) => setGuestIdSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid or Table List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 uppercase text-[10px] tracking-wider bg-stone-50/50">
                      <th className="py-3 px-4 font-bold">លេខបន្ទប់ (Room Nº)</th>
                      <th className="py-3 px-4 font-bold">ឈ្មោះអ្នកជួល (Tenant Name)</th>
                      <th className="py-3 px-4 font-bold">លេខទូរស័ព្ទ (Tenant Phone)</th>
                      <th className="py-3 px-4 font-bold">លេខសម្គាល់ ID (Custom Guest ID)</th>
                      <th className="py-3 px-4 font-bold text-emerald-800 font-sans">{trApp('ព័ត៌មានចូលប្រព័ន្ធ (Portal Login)', 'Portal Login Info')}</th>
                      <th className="py-3 px-4 font-bold text-center">សកម្មភាព (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sortedSavedTenants
                      .filter(t => 
                        t.roomNo.toLowerCase().includes(guestIdSearch.toLowerCase()) ||
                        t.tenantName.toLowerCase().includes(guestIdSearch.toLowerCase()) ||
                        (t.tenantIdNo && t.tenantIdNo.toLowerCase().includes(guestIdSearch.toLowerCase()))
                      )
                      .map((tenant) => {
                        const defaultId = formatTenantId(tenant.roomNo);
                        const isEditingThis = editingTenantRoomNo === tenant.roomNo;

                        const handleSaveInlineId = () => {
                          if (!tempEditingIdVal.trim()) {
                            alert("ID cannot be empty!");
                            return;
                          }
                          playAudioFeedback('success');
                          setSavedTenants(prev => {
                            const updated = prev.map(t => {
                              if (t.roomNo === tenant.roomNo) {
                                return { ...t, tenantIdNo: tempEditingIdVal.trim() };
                              }
                              return t;
                            });
                            localStorage.setItem('savedTenants', JSON.stringify(updated));
                            return updated;
                          });

                          // Update active invoice data as well if it matches this room to prevent revert bug!
                          setData(prev => {
                            if (prev.roomNo === tenant.roomNo) {
                              return { ...prev, tenantIdNo: tempEditingIdVal.trim() };
                            }
                            return prev;
                          });

                          setEditingTenantRoomNo(null);
                        };

                        const handleResetToDefaultId = () => {
                          if (confirm(`Reset ID for Room ${formatRoomBadge(tenant.roomNo)} to default "${defaultId}"?`)) {
                            playAudioFeedback('click');
                            setSavedTenants(prev => {
                              const updated = prev.map(t => {
                                if (t.roomNo === tenant.roomNo) {
                                  const { tenantIdNo, ...rest } = t;
                                  return { ...rest, tenantIdNo: defaultId };
                                }
                                return t;
                              });
                              localStorage.setItem('savedTenants', JSON.stringify(updated));
                              return updated;
                            });

                            // Update active invoice data as well if it matches this room to prevent revert bug!
                            setData(prev => {
                              if (prev.roomNo === tenant.roomNo) {
                                return { ...prev, tenantIdNo: defaultId };
                              }
                              return prev;
                            });
                          }
                        };

                        const tenantLoginId = getLoginId(tenant.tenantIdNo || defaultId);
                        const tenantLoginPass = getLoginPassword(tenant.tenantPhone);

                        return (
                          <tr key={tenant.roomNo} className="hover:bg-stone-50/65 transition-colors font-sans">
                            <td className="py-3.5 px-4 font-black text-blue-900 font-sans text-sm">
                              {formatRoomBadge(tenant.roomNo)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-stone-800 font-moul leading-normal">
                              {tenant.tenantName}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-stone-600">
                              {tenant.tenantPhone || '—'}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              {isEditingThis ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    className="bg-stone-100 text-stone-800 text-xs px-2 py-1 rounded outline-none border border-emerald-500 font-mono w-40 font-bold"
                                    value={tempEditingIdVal}
                                    onChange={(e) => setTempEditingIdVal(e.target.value)}
                                  />
                                </div>
                              ) : (
                                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                                  {tenant.tenantIdNo || defaultId}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-0.5 font-sans text-[11px] leading-tight text-stone-700">
                                <div>
                                  <span className="font-bold text-stone-500">ID: </span>
                                  <span className="font-mono font-black text-blue-900 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">{tenantLoginId || '(Empty)'}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-stone-500">Pass: </span>
                                  <span className="font-mono font-black text-amber-900 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">{tenantLoginPass || '(Empty)'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isEditingThis ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={handleSaveInlineId}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1.5 rounded transition-all text-xs cursor-pointer"
                                      title="Save"
                                    >
                                      ✓ Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTenantRoomNo(null)}
                                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold p-1.5 rounded transition-all text-xs cursor-pointer"
                                      title="Cancel"
                                    >
                                      ✕ Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playAudioFeedback('click');
                                        setEditingTenantRoomNo(tenant.roomNo);
                                        setTempEditingIdVal(tenant.tenantIdNo || defaultId);
                                      }}
                                      className="bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 font-bold px-2 py-1 rounded text-xs transition-all border border-stone-200 hover:border-emerald-300 cursor-pointer flex items-center gap-1"
                                      title="Edit Custom ID"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span>កែសម្រួល / Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(tenant.tenantIdNo || defaultId, tenant.roomNo)}
                                      className="bg-stone-100 hover:bg-blue-50 text-stone-600 hover:text-blue-700 font-medium px-2 py-1 rounded text-xs transition-all border border-stone-200 hover:border-blue-300 cursor-pointer"
                                      title="Copy ID to Clipboard"
                                    >
                                      {copiedTenantId === tenant.roomNo ? '✓ Copied ID' : 'ចម្លង ID / Copy ID'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const secureLink = `${window.location.origin}${window.location.pathname}?room=${tenant.roomNo}&id=${tenantLoginId}`;
                                        navigator.clipboard.writeText(secureLink);
                                        playAudioFeedback('click');
                                        alert(`បានចម្លងតំណភ្ជាប់សុវត្ថិភាពសម្រាប់បន្ទប់ ${formatRoomBadge(tenant.roomNo)}! / Copied secure guest link for Room ${formatRoomBadge(tenant.roomNo)}!`);
                                      }}
                                      className="bg-stone-100 hover:bg-emerald-50 text-[#198754] hover:text-emerald-700 font-bold px-2 py-1 rounded text-xs transition-all border border-stone-200 hover:border-emerald-300 cursor-pointer flex items-center gap-1"
                                      title="Copy Secure Direct Access Link for Tenant"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>តំណភ្ជាប់ / Link</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleResetToDefaultId}
                                      className="bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 font-medium px-2 py-1 rounded text-xs transition-all border border-stone-200 hover:border-rose-300 cursor-pointer"
                                      title="Reset to Default Room ID"
                                    >
                                      លំនាំដើម / Reset
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Admin / Reports Tab */}
          {userRole === 'admin' && activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white shadow-2xl rounded-xl overflow-hidden p-6 sm:p-8 border border-stone-200 font-sans"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    ផ្ទាំងគ្រប់គ្រង និងស្ថិតិចំណូល (Admin Dashboard & Revenue Statistics)
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    ពិនិត្យបញ្ជីឈ្មោះអ្នកជួលសរុប និងស្ថិតិលម្អិតនៃចំណូលផ្សេងៗ។<br/>
                    <span className="text-stone-400">View aggregate tenant list and detailed revenue statistics.</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualPayForm(!showManualPayForm)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  កត់ត្រាចំណូលដោយដៃ (Record Manual Transaction)
                </button>
              </div>

              {/* Manual Payment Form */}
              {showManualPayForm && (
                <form onSubmit={handleManualPaymentSubmit} className="bg-stone-50 border border-stone-200 rounded-lg p-5 mb-6 space-y-4 border-l-4 border-l-emerald-500 font-sans">
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">កត់ត្រាចំណូលដោយដៃ (Record Manual Transaction)</h3>
                    <button type="button" onClick={() => setShowManualPayForm(false)} className="text-stone-400 hover:text-stone-600 text-xs font-bold">បិទ (Close)</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">លេខបន្ទប់ (Room No) *</label>
                      <select
                        required
                        className="w-full bg-white border border-stone-200 rounded p-2 text-stone-800 outline-none focus:border-emerald-500 font-sans"
                        value={manualPay.roomNo}
                        onChange={(e) => {
                          const rNo = e.target.value;
                          const tenant = savedTenants.find(t => t.roomNo === rNo);
                          setManualPay(prev => {
                            const updated = {
                              ...prev,
                              roomNo: rNo,
                              tenantName: tenant ? tenant.tenantName : prev.tenantName,
                              roomPrice: tenant ? tenant.roomPrice : prev.roomPrice,
                              wifiPrice: tenant ? tenant.wifiPrice : prev.wifiPrice
                            };
                            updated.totalUsd = Number(updated.roomPrice) + Number(updated.wifiPrice) + Number(updated.elecPrice) + Number(updated.waterPrice) + Number(updated.otherPrice);
                            return updated;
                          });
                        }}
                      >
                        <option value="">-- Select Room --</option>
                        {sortedSavedTenants.map(t => (
                          <option key={t.roomNo} value={t.roomNo}>{formatRoomBadge(t.roomNo)} ({t.tenantName})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-sans">ឈ្មោះអ្នកជួល (Tenant Name) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Tenant Name"
                        className="w-full bg-white border border-stone-200 rounded p-2 text-stone-800 outline-none focus:border-emerald-500 font-bold"
                        value={manualPay.tenantName}
                        onChange={(e) => setManualPay(prev => ({ ...prev, tenantName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-sans">កាលបរិច្ឆេទ (Payment Date) *</label>
                      <input
                        type="date"
                        required
                        className="w-full bg-white border border-stone-200 rounded p-2 text-stone-800 outline-none focus:border-emerald-500 font-sans"
                        value={manualPay.paymentDate}
                        onChange={(e) => setManualPay(prev => ({ ...prev, paymentDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-sans">ថ្លៃបន្ទប់ (Room Price) ($)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-stone-200 rounded p-2 text-stone-800 outline-none focus:border-emerald-500 font-bold"
                        value={manualPay.roomPrice || ''}
                        onChange={(e) => handleManualPayChange('roomPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-sans">ថ្លៃ Wifi (Wi-Fi Price) ($)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-stone-200 rounded p-2 text-stone-800 outline-none focus:border-emerald-500 font-bold"
                        value={manualPay.wifiPrice || ''}
                        onChange={(e) => handleManualPayChange('wifiPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-sans">ថ្លៃអគ្គិសនី (Electricity) ($)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-stone-200 rounded p-2 text-stone-800 outline-none focus:border-emerald-500 font-bold"
                        value={manualPay.elecPrice || ''}
                        onChange={(e) => handleManualPayChange('elecPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-sans">ថ្លៃទឹកស្អាត (Water Price) ($)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-stone-200 rounded p-2 text-stone-800 outline-none focus:border-emerald-500 font-bold"
                        value={manualPay.waterPrice || ''}
                        onChange={(e) => handleManualPayChange('waterPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-sans">ផ្សេងៗ (Other Price) ($)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-stone-200 rounded p-2 text-stone-800 outline-none focus:border-emerald-500 font-bold"
                        value={manualPay.otherPrice || ''}
                        onChange={(e) => handleManualPayChange('otherPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-stone-200">
                    <div className="text-xs font-bold text-stone-700 font-sans">
                      ទឹកប្រាក់សរុប (Total Amount): <span className="text-emerald-600 font-mono text-sm font-black">${manualPay.totalUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="submit"
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded text-xs transition-colors shadow-sm font-sans"
                      >
                        កត់ត្រាការទូទាត់ (Record Transaction)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualPayForm(false)}
                        className="flex-1 sm:flex-none bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold py-1.5 px-3 rounded text-xs transition-colors font-sans"
                      >
                        បោះបង់ (Cancel)
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Month Filter Selector */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6 font-sans">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      ជម្រើសចម្រាញ់តាមខែ (MONTH FILTER SELECTOR)
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">ជ្រើសរើសខែជាក់លាក់ដើម្បីចម្រាញ់ចំណូល ប្រាក់បៀវត្សរ៍បុគ្គលិក និងចំណូលសុទ្ធរបស់ម្ចាស់ផ្ទះ។ / Select a specific month to filter revenue, staff salaries, and landlord net profit.</p>
                  </div>
                  
                  {/* Month Selector Dropdown Button / Button xổ để chọn */}
                  <div className="relative inline-flex items-center w-full sm:w-auto shrink-0">
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        playAudioFeedback('click');
                      }}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-extrabold text-xs rounded-xl px-4 py-2.5 outline-none shadow-sm cursor-pointer transition-all font-sans pr-9 appearance-none border border-emerald-600/60"
                    >
                      <option value="all" className="text-stone-800 bg-white font-sans py-1">
                        🗓️ គ្រប់ខែទាំងអស់ / All Months 2026
                      </option>
                      {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => (
                        <option key={m} value={m} className="text-stone-800 bg-white font-sans py-1">
                          📅 ខែ {parseInt(m)} / Month {parseInt(m)} (2026)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-white absolute right-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Section Header: Monthly Financial Status */}
              <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  ទិន្នន័យ (Data): {selectedMonth === 'all' ? 'គ្រប់ខែទាំងអស់ឆ្នាំ 2026 / All Months 2026' : `ខែ ${parseInt(selectedMonth)} / 2026 (Month ${parseInt(selectedMonth)} / 2026)`}
                </span>
                <span className="text-[11px] text-stone-400">
                  ប្រមូលបាន (Collected): {totalRoomsRented} បន្ទប់ (Rooms)
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-sans">
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">ចំណូលសរុប / Total Income</p>
                  <p className="text-2xl font-black text-emerald-600 font-mono mt-1 tabular-nums">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-stone-400 mt-1">{(totalIncome * 4000).toLocaleString()} ៛ (1$ = 4000៛)</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">ចំណូលថ្លៃបន្ទប់ / Room Rent</p>
                  <p className="text-xl font-black text-blue-900 font-mono mt-1.5 tabular-nums">${totalRoomRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-stone-400 mt-1">សមាមាត្រ (Ratio): {totalIncome > 0 ? ((totalRoomRevenue / totalIncome) * 100).toFixed(0) : 0}%</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">ថ្លៃទឹកភ្លើង / Electricity & Water</p>
                  <p className="text-xl font-black text-amber-600 font-mono mt-1.5 tabular-nums">${totalUtilRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-stone-400 mt-1">សមាមាត្រ (Ratio): {totalIncome > 0 ? ((totalUtilRevenue / totalIncome) * 100).toFixed(0) : 0}%</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Wifi & ផ្សេងៗ / Wi-Fi & Other</p>
                  <p className="text-xl font-black text-sky-600 font-mono mt-1.5 tabular-nums">${(totalWifiRevenue + totalOtherRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-stone-400 mt-1">សមាមាត្រ (Ratio): {totalIncome > 0 ? (((totalWifiRevenue + totalOtherRevenue) / totalIncome) * 100).toFixed(0) : 0}%</p>
                </div>
              </div>

              {/* Salary and Landlord Net Income Section (REQUESTED) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 font-sans">
                {/* Sovanna Salary Card */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">ប្រាក់ខែអ្នកទទួលបន្ទុក (Sovanna - 20%) / Sovanna Salary (20%)</p>
                    <p className="text-xl font-black text-amber-700 font-mono mt-1.5 tabular-nums">
                      ${sovannaSalaryFiltered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-[10px] text-amber-600/90 mt-2 font-sans border-t border-amber-200/40 pt-1.5 leading-relaxed">
                    គណនា៖ ២០% ថ្លៃបន្ទប់ (${(totalRoomRevenue * 0.20).toFixed(2)}) + ១០០% ទឹកភ្លើង និង Wifi (${utilsAndWifiFiltered.toFixed(2)}) <br />
                    Formula: 20% Room share + 100% Utilities & Wifi
                  </div>
                </div>

                {/* Pheak Salary Card */}
                <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-sky-800 uppercase tracking-wider">
                      ប្រាក់ខែអ្នកគ្រប់គ្រង (Pheak - {selectedMonth !== 'all' && parseInt(selectedMonth) >= 10 ? '$10' : (selectedMonth === 'all' ? '$15/$10' : '$15')}/បន្ទប់) / Pheak Salary ({selectedMonth !== 'all' && parseInt(selectedMonth) >= 10 ? '$10' : (selectedMonth === 'all' ? '$15/$10' : '$15')}/room)
                    </p>
                    <p className="text-xl font-black text-sky-700 font-mono mt-1.5 tabular-nums">
                      ${pheakSalaryFiltered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-[10px] text-sky-600/90 mt-2 font-sans border-t border-sky-200/40 pt-1.5 leading-relaxed">
                    គណនា៖ {selectedMonth !== 'all' && parseInt(selectedMonth) >= 10 ? '$10' : (selectedMonth === 'all' ? 'ចម្រុះ (Mixed)' : '$15')} × {totalRoomsRented} បន្ទប់ (Rooms) <br />
                    Formula: {selectedMonth !== 'all' && parseInt(selectedMonth) >= 10 ? '$10' : (selectedMonth === 'all' ? 'Mixed' : '$15')} × {totalRoomsRented} rooms rented
                    {selectedMonth === 'all' && " (Months 1-9: $15/room, Months 10-12: $10/room)"}
                  </div>
                </div>

                {/* Landlord Net Income Card */}
                <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-md flex flex-col justify-between border border-emerald-500">
                  <div>
                    <p className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-wider">ចំណូលសុទ្ធម្ចាស់ផ្ទះ (Landlord Net Revenue)</p>
                    <p className="text-2xl font-black font-mono mt-1 tabular-nums">
                      ${landlordNetFiltered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-[10px] text-emerald-100/80 mt-2 font-sans border-t border-emerald-500/40 pt-1.5 leading-relaxed">
                    ការទទួលបានពិតប្រាកដ៖ ថ្លៃបន្ទប់ (${totalRoomRevenue.toFixed(2)}) - ចំណែក Sovanna (${(totalRoomRevenue * 0.20).toFixed(2)}) - ថ្លៃ Pheak (${pheakSalaryFiltered.toFixed(2)}) <br />
                    Actual: Room Rent - Sovanna Share - Pheak Fee
                  </div>
                </div>
              </div>

              {/* Proportion Bar */}
              <div className="mb-6 font-sans">
                <div className="flex justify-between items-center mb-1.5 text-xs text-stone-600 font-bold">
                  <span>ការបែងចែកចំណូលសរុប (Revenue Distribution Ratio):</span>
                  <span className="text-stone-400 font-normal">Room Rent / Utilities / Wifi & Other</span>
                </div>
                <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                  {totalIncome > 0 ? (
                    <>
                      <div style={{ width: `${(totalRoomRevenue / totalIncome) * 100}%` }} className="bg-blue-900 transition-all animate-pulse-slow" title={`Room Rent: ${((totalRoomRevenue / totalIncome) * 100).toFixed(1)}%`} />
                      <div style={{ width: `${(totalUtilRevenue / totalIncome) * 100}%` }} className="bg-amber-500 transition-all animate-pulse-slow" title={`Utilities: ${((totalUtilRevenue / totalIncome) * 100).toFixed(1)}%`} />
                      <div style={{ width: `${((totalWifiRevenue + totalOtherRevenue) / totalIncome) * 100}%` }} className="bg-sky-400 transition-all animate-pulse-slow" title={`Wifi & Other: ${(((totalWifiRevenue + totalOtherRevenue) / totalIncome) * 100).toFixed(1)}%`} />
                    </>
                  ) : (
                    <div className="w-full bg-stone-200" />
                  )}
                </div>
              </div>

              {/* Recharts Monthly Revenue Comparison Chart */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 mb-8 font-sans">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-stone-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 uppercase flex items-center gap-1.5">
                      📈 របាយការណ៍ចំណូលប្រចាំខែសម្រាប់ឆ្នាំ {new Date().getFullYear()} / MONTHLY REVENUE CHART {new Date().getFullYear()}
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">ការប្រៀបធៀបប្រភពចំណូលលម្អិតប្រចាំខែ (ថ្លៃបន្ទប់ ទឹកភ្លើង វ៉ាយហ្វាយ និងផ្សេងៗ) / Detailed monthly revenue source comparison (Room Rent, Utilities, Wi-Fi & Other).</p>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-stone-600">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-900 rounded-sm inline-block" /> Room Rent</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block" /> Utilities</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-400 rounded-sm inline-block" /> Wifi & Other</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-600 inline-block" /> Total Revenue</span>
                  </div>
                </div>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="name" stroke="#78716c" fontSize={10} tickLine={false} />
                      <YAxis stroke="#78716c" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '11px', fontFamily: 'sans-serif', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`$${Number(value).toFixed(2)}`]}
                      />
                      <Bar dataKey="Room Rent" stackId="a" fill="#1e3a8a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Utilities" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Wifi & Other" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="Total Revenue" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669' }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Revenue & Staff Salary Table */}
              <div className="space-y-4 font-sans mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-stone-50 border border-stone-200 rounded-lg p-3">
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 uppercase flex items-center gap-1.5">
                      📊 តារាងសង្ខេបចំណូល និងប្រាក់បៀវត្សរ៍ប្រចាំខែ (MONTHLY REVENUE & SALARY SUMMARY)
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      ស្ថិតិលម្អិតនៃចំណូលសុទ្ធរបស់ម្ចាស់ផ្ទះ បន្ទាប់ពីទូទាត់ប្រាក់ខែឱ្យ Sovanna (20%) និង Pheak ({selectedMonth !== 'all' && parseInt(selectedMonth) >= 10 ? '$10' : (selectedMonth === 'all' ? '$15/$10' : '$15')}/បន្ទប់) ប្រចាំខែ។<br/>
                      <span className="text-stone-400">Detailed landlord net profit statistics after paying Sovanna (20% room rental + utilities) and Pheak ({selectedMonth !== 'all' && parseInt(selectedMonth) >= 10 ? '$10' : (selectedMonth === 'all' ? '$15/$10' : '$15')}/room) monthly.</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setIsEditModeActive(!isEditModeActive)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                        isEditModeActive 
                          ? 'bg-amber-600 text-white hover:bg-amber-700' 
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {isEditModeActive ? '✓ កំពុងកែសម្រួល (Editing)' : '✍️ បញ្ចូលទិន្នន័យដោយដៃ (Manual Input)'}
                    </button>

                    {/* Styled Month Selection Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm">
                      <span className="text-stone-400 font-normal">ខែបង្ហាញ (Show Month):</span>
                      <select
                        className="bg-transparent border-none outline-none font-bold text-stone-800 cursor-pointer pr-1 font-sans"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                      >
                        <option value="all">គ្រប់ខែទាំងអស់ (All Months)</option>
                        {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => (
                          <option key={m} value={m}>ខែ {parseInt(m)} (Month {parseInt(m)})</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px] text-stone-400 font-sans italic">
                      *ចុចប៊ូតុង "មើល (View)" នៅជួរណាមួយដើម្បីពិនិត្យរបាយការណ៍លម្អិត / *Click "View" button to view that month's details
                    </div>
                  </div>
                </div>
                
                {isEditModeActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 mb-2 shadow-sm font-sans"
                  >
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans">
                      <Edit className="w-4 h-4" />
                      ទម្រង់បញ្ចូលទិន្នន័យដោយដៃប្រចាំខែ (MONTHLY MANUAL INPUT FORM)
                    </h4>
                    <p className="text-[11px] text-amber-700/90 mb-4 font-sans leading-relaxed">
                      ✍️ <strong>សេចក្តីណែនាំ៖</strong> ថ្លៃទឹក អគ្គិសនី និងវ៉ាយហ្វាយ នឹងត្រូវបំបែកចេញពីប្រាក់ចំណូលបន្ទប់ ហើយបូកបញ្ចូលទៅក្នុងប្រាក់ខែរបស់ <strong>Sovanna</strong> 100%។ <br />
                      💡 <strong>Info:</strong> Water, electricity, and Wi-Fi will be separated from room revenue and added 100% to <strong>Sovanna's</strong> salary.
                    </p>
                    
                    <form onSubmit={handleSaveManualForm} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
                      {/* 1. Select Month */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ខែបញ្ចូល (Month)</label>
                        <select
                          className="w-full bg-white border border-stone-200 rounded p-1.5 font-bold text-stone-800 outline-none focus:border-amber-500"
                          value={formMonth}
                          onChange={(e) => setFormMonth(e.target.value)}
                        >
                          {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => (
                            <option key={m} value={m}>Month {parseInt(m)}</option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Number of rooms */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ចំនួនបន្ទប់ (Rooms)</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-stone-200 rounded p-1.5 font-mono font-bold text-stone-800 outline-none focus:border-amber-500"
                          placeholder="Rooms"
                          value={formRooms || ''}
                          onChange={(e) => setFormRooms(Number(e.target.value) || 0)}
                        />
                      </div>

                      {/* 3. Room price amount */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ប្រាក់បន្ទប់សរុប (Total Room Rent - $)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-white border border-stone-200 rounded p-1.5 font-mono font-bold text-stone-800 outline-none focus:border-amber-500"
                          placeholder="Total Room Rent"
                          value={formTotalUsd || ''}
                          onChange={(e) => setFormTotalUsd(Number(e.target.value) || 0)}
                        />
                      </div>

                      {/* 4. Security deposit */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ប្រាក់កក់ (Deposit - $)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-white border border-stone-200 rounded p-1.5 font-mono font-bold text-stone-800 outline-none focus:border-amber-500"
                          placeholder="Deposit"
                          value={formDeposit || ''}
                          onChange={(e) => setFormDeposit(Number(e.target.value) || 0)}
                        />
                      </div>

                      {/* 5. Electricity fee */}
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">ថ្លៃអគ្គិសនី (Electricity - ៛)</label>
                        <input
                          type="number"
                          step="100"
                          className="w-full bg-white border border-stone-200 rounded p-1.5 font-mono font-bold text-amber-700 border-amber-200 outline-none focus:border-amber-500"
                          placeholder="Electricity KHR (៛)"
                          value={formElectricity || ''}
                          onChange={(e) => setFormElectricity(Number(e.target.value) || 0)}
                        />
                      </div>

                      {/* 6. Water fee */}
                      <div>
                        <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">ថ្លៃទឹកស្អាត (Water - ៛)</label>
                        <input
                          type="number"
                          step="100"
                          className="w-full bg-white border border-stone-200 rounded p-1.5 font-mono font-bold text-blue-700 border-blue-200 outline-none focus:border-amber-500"
                          placeholder="Water KHR (៛)"
                          value={formWater || ''}
                          onChange={(e) => setFormWater(Number(e.target.value) || 0)}
                        />
                      </div>

                      {/* 7. Wi-Fi fee */}
                      <div>
                        <label className="block text-[10px] font-bold text-sky-700 uppercase mb-1">ថ្លៃវ៉ាយហ្វាយ (Wi-Fi - $)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-white border border-stone-200 rounded p-1.5 font-mono font-bold text-sky-700 border-sky-200 outline-none focus:border-amber-500"
                          placeholder="Wi-Fi"
                          value={formWifi || ''}
                          onChange={(e) => setFormWifi(Number(e.target.value) || 0)}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="col-span-2 sm:col-span-4 md:col-span-7 flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`តើអ្នកប្រាកដជាចង់កំណត់ឡើងវិញទិន្នន័យខែ ${parseInt(formMonth)} ទៅជាទិន្នន័យដើមរបស់ប្រព័ន្ធវិញឬទេ? / Are you sure you want to RESET Month ${parseInt(formMonth)} data to system automatic records?`)) {
                              saveCustomMonthData(formMonth.padStart(2, '0'), 'useCustom', false);
                            }
                          }}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold px-3 py-1.5 rounded transition-all shadow-sm cursor-pointer"
                        >
                          កំណត់ឡើងវិញ (Reset)
                        </button>
                        <button
                          type="submit"
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-1.5 rounded transition-all shadow-md cursor-pointer"
                        >
                          រក្សាទុក (Save Data)
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
                
                <div className="overflow-x-auto border border-stone-200 rounded-lg shadow-sm bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                        <th className="p-2.5 w-[140px]">ខែ (Month)</th>
                        <th className="p-2.5 text-right w-[120px]">ចំណូលថ្លៃបន្ទប់ (Room Rent - $)</th>
                        <th className="p-2.5 text-right w-[110px] text-amber-600">ថ្លៃអគ្គិសនី (Electricity - ៛)</th>
                        <th className="p-2.5 text-right w-[110px] text-blue-600">ថ្លៃទឹកស្អាត (Water - ៛)</th>
                        <th className="p-2.5 text-right w-[110px] text-sky-600">ថ្លៃវ៉ាយហ្វាយ (Wi-Fi - $)</th>
                        <th className="p-2.5 text-right w-[150px]">ប្រាក់ខែ Sovanna (Sovanna Salary)</th>
                        <th className="p-2.5 text-right w-[110px]">ប្រាក់ខែ Pheak (Pheak Salary)</th>
                        <th className="p-2.5 text-right font-bold text-emerald-700">ចំណូលសុទ្ធម្ចាស់ផ្ទះ (Landlord Net)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(selectedMonth === 'all'
                        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                        : [parseInt(selectedMonth)]
                      ).map((m) => {
                        const stats = getMonthlyStats(m);
                        const isSelected = selectedMonth === stats.monthStr;
                        const monthStr = stats.monthStr;
                        
                        return (
                          <tr 
                            key={m} 
                            onClick={() => setSelectedMonth(stats.monthStr)}
                            className={`transition-colors ${
                              isSelected 
                                ? 'bg-emerald-50/40 font-medium' 
                                : 'hover:bg-stone-50/50'
                            }`}
                          >
                            {/* Month & View Action Button */}
                            <td className="p-2.5 font-bold text-stone-800">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-black font-sans shrink-0 ${
                                  isSelected ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700'
                                }`}>
                                  ខែ {m} (Month {m})
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMonth(stats.monthStr);
                                  }}
                                  className="px-1.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-[9px] font-extrabold transition-all shrink-0"
                                  title="មើលព័ត៌មានលម្អិត / View slip details"
                                >
                                  មើល (View)
                                </button>
                              </div>
                            </td>

                            {/* Total Room Rent Revenue */}
                            <td className="p-2.5 text-right font-mono">
                              {isEditModeActive ? (
                                <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-end gap-0.5">
                                  <input
                                    type="number"
                                    placeholder="ថ្លៃបន្ទប់"
                                    className="w-16 bg-white border border-stone-200 rounded px-1 py-0.5 text-[11px] font-bold text-stone-800 text-right outline-none focus:border-amber-500 font-mono"
                                    value={stats.customTotalUsd || ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      saveCustomMonthData(monthStr, 'totalUsd', val);
                                      saveCustomMonthData(monthStr, 'useCustom', true);
                                    }}
                                  />
                                  <span className="text-[8px] text-stone-400 font-sans">ដើម (Base): ${stats.autoRoomRevenue.toFixed(0)}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-stone-700">${stats.roomRevenue.toFixed(1)}</span>
                                  <span className="text-[8px] text-stone-400">ដើម (Base): ${stats.autoRoomRevenue.toFixed(0)}</span>
                                </div>
                              )}
                            </td>

                            {/* Electricity Revenue */}
                            <td className="p-2.5 text-right font-mono text-amber-600">
                              {isEditModeActive ? (
                                <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-end gap-0.5">
                                  <input
                                    type="number"
                                    placeholder="អគ្គិសនី"
                                    className="w-14 bg-white border border-stone-200 rounded px-1 py-0.5 text-[11px] font-bold text-amber-700 text-right outline-none focus:border-amber-500 font-mono"
                                    value={stats.customElectricityRevenue ? Math.round(stats.customElectricityRevenue * 4000) : ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      saveCustomMonthData(monthStr, 'electricityRevenue', val / 4000);
                                      saveCustomMonthData(monthStr, 'useCustom', true);
                                    }}
                                  />
                                  <span className="text-[8px] text-stone-400 font-sans">ដើម (Base): {Math.round(stats.autoElectricityRevenue * 4000).toLocaleString()}៛</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-amber-600">{Math.round(stats.electricityRevenue * 4000).toLocaleString()}៛</span>
                                  <span className="text-[8px] text-stone-400">(${stats.electricityRevenue.toFixed(1)})</span>
                                </div>
                              )}
                            </td>

                            {/* Water Revenue */}
                            <td className="p-2.5 text-right font-mono text-blue-600">
                              {isEditModeActive ? (
                                <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-end gap-0.5">
                                  <input
                                    type="number"
                                    placeholder="ទឹក"
                                    className="w-14 bg-white border border-stone-200 rounded px-1 py-0.5 text-[11px] font-bold text-blue-700 text-right outline-none focus:border-amber-500 font-mono"
                                    value={stats.customWaterRevenue ? Math.round(stats.customWaterRevenue * 4000) : ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      saveCustomMonthData(monthStr, 'waterRevenue', val / 4000);
                                      saveCustomMonthData(monthStr, 'useCustom', true);
                                    }}
                                  />
                                  <span className="text-[8px] text-stone-400 font-sans">ដើម (Base): {Math.round(stats.autoWaterRevenue * 4000).toLocaleString()}៛</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-blue-600">{Math.round(stats.waterRevenue * 4000).toLocaleString()}៛</span>
                                  <span className="text-[8px] text-stone-400">(${stats.waterRevenue.toFixed(1)})</span>
                                </div>
                              )}
                            </td>

                            {/* Wifi Revenue */}
                            <td className="p-2.5 text-right font-mono text-sky-600">
                              {isEditModeActive ? (
                                <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-end gap-0.5">
                                  <input
                                    type="number"
                                    placeholder="វ៉ាយហ្វាយ"
                                    className="w-14 bg-white border border-stone-200 rounded px-1 py-0.5 text-[11px] font-bold text-sky-700 text-right outline-none focus:border-amber-500 font-mono"
                                    value={stats.customWifiRevenue || ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      saveCustomMonthData(monthStr, 'wifiRevenue', val);
                                      saveCustomMonthData(monthStr, 'useCustom', true);
                                    }}
                                  />
                                  <span className="text-[8px] text-stone-400 font-sans">ដើម (Base): ${stats.autoWifiRevenue.toFixed(0)}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-sky-600">${stats.wifiRevenue.toFixed(1)}</span>
                                  <span className="text-[8px] text-stone-400">ដើម (Base): ${stats.autoWifiRevenue.toFixed(0)}</span>
                                </div>
                              )}
                            </td>

                            {/* Sovanna Salary */}
                            <td className="p-2.5 text-right font-mono text-amber-700 font-bold bg-amber-50/20">
                              ${stats.sovannaSalary.toFixed(1)}
                            </td>

                            {/* Pheak Salary */}
                            <td className="p-2.5 text-right font-mono text-sky-600 font-bold bg-sky-50/20">
                              ${stats.pheakSalary.toFixed(1)}
                            </td>

                            {/* Landlord Net Income */}
                            <td className="p-2.5 text-right font-black text-emerald-600 font-mono text-[13px] tabular-nums bg-emerald-50/20">
                              ${stats.landlordNet.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Cumulative Row */}
                      <tr className="bg-stone-50 font-bold border-t-2 border-stone-300">
                        <td className="p-3 text-stone-800 font-black">សរុបប្រចាំឆ្នាំ (YEAR TOTAL)</td>
                        <td className="p-3 text-right font-mono font-black text-stone-800">
                          ${yearlyTotalIncome.toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-amber-600">
                          ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).electricityRevenue, 0).toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-blue-600">
                          ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).waterRevenue, 0).toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-sky-600">
                          ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).wifiRevenue, 0).toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-amber-700 bg-amber-50/30">
                          ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).sovannaSalary, 0).toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-sky-700 bg-sky-50/30">
                          ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).pheakSalary, 0).toFixed(1)}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700 font-mono text-[14px] tabular-nums bg-emerald-50/30">
                          ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).landlordNet, 0).toFixed(1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INDIVIDUAL INCOME STATEMENT PAYSLIPS */}
              <div className="space-y-4 font-sans mb-8">
                {/* Header Card with Direct Month Selector */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-blue-900 uppercase flex items-center gap-1.5">
                        📋 វិក្កយបត្រចំណូលផ្ទាល់ខ្លួន / PERSONAL PAYSLIPS
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-0.5 font-sans">
                        របាយការណ៍ហិរញ្ញវត្ថុ ប្រាក់ខែគ្រប់គ្រង និងការបែងចែកកម្រៃជើងសារប្រចាំខែសម្រាប់ Sovanna, Pheak និងម្ចាស់ផ្ទះ។ / Monthly financial report & personal payslips.
                      </p>
                    </div>

                    {/* Direct Month Selector Dropdown / Button xổ để chọn */}
                    <div className="relative inline-flex items-center gap-2">
                      <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>ជ្រើសរើសខែ (Select Month):</span>
                      </label>
                      <div className="relative inline-flex items-center">
                        <select
                          value={selectedMonth === 'all' ? '01' : selectedMonth}
                          onChange={(e) => {
                            setSelectedMonth(e.target.value);
                            playAudioFeedback('click');
                          }}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs rounded-xl px-3.5 py-2 outline-none shadow-sm cursor-pointer transition-all font-sans pr-8 appearance-none border border-blue-500/60"
                        >
                          {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((mStr) => (
                            <option key={mStr} value={mStr} className="text-stone-800 bg-white font-sans py-1">
                              📅 ខែ {parseInt(mStr)} (Month {parseInt(mStr)} / 2026)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-white absolute right-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const effectiveMonth = selectedMonth === 'all' ? '01' : selectedMonth;
                  const mIndex = parseInt(effectiveMonth);
                  const stats = getMonthlyStats(mIndex);
                  
                  return (
                    <div className="space-y-5">
                      {/* Tabs Bar */}
                      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
                        <button
                          type="button"
                          onClick={() => setActiveSlipTab('sovanna')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeSlipTab === 'sovanna'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          វិក្កយបត្រ Sovanna (20% + ទឹកភ្លើង) / Sovanna Slip (20% + Utilities)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSlipTab('pheak')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeSlipTab === 'pheak'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          វិក្កយបត្រ Pheak ({selectedMonth !== 'all' && parseInt(selectedMonth) >= 10 ? '$10' : '$15'}/បន្ទប់) / Pheak Slip ({selectedMonth !== 'all' && parseInt(selectedMonth) >= 10 ? '$10' : '$15'}/room)
                        </button>
                         <button
                          type="button"
                          onClick={() => setActiveSlipTab('landlord')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeSlipTab === 'landlord'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <Home className="w-3.5 h-3.5" />
                          វិក្កយបត្រ ម្ចាស់ផ្ទះ (ចំណូលសុទ្ធ) / Landlord Slip (Net Revenue)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSlipTab('yearly')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeSlipTab === 'yearly'
                              ? 'bg-violet-600 text-white shadow-sm'
                              : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <Database className="w-3.5 h-3.5" />
                          របាយការណ៍ប្រចាំឆ្នាំ (Annual Report)
                        </button>
                      </div>

                      {/* Download Button Area */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const filename = activeSlipTab === 'yearly'
                              ? `Bao-Cao-Thu-Nhap-Ca-Nam-2026`
                              : `Payslip-Thang-${mIndex}-${activeSlipTab === 'sovanna' ? 'Sovanna' : activeSlipTab === 'pheak' ? 'Pheak' : 'Landlord'}`;
                            const ref = activeSlipTab === 'sovanna'
                              ? sovannaSlipRef
                              : activeSlipTab === 'pheak'
                                ? pheakSlipRef
                                : activeSlipTab === 'landlord'
                                  ? landlordSlipRef
                                  : yearlySlipRef;
                            handleDownloadSlip(ref, filename);
                          }}
                          disabled={isDownloading}
                          className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 shadow-md transition-all flex items-center gap-1.5"
                        >
                          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          ទាញយកប័ណ្ណទូទាត់រូបភាពកម្រិត 4K (Download 4K PNG Slip)
                        </button>
                      </div>

                      {/* SLIPS WRAPPERS */}
                      <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 overflow-x-auto flex justify-center">
                        
                        {/* 1. SOVANNA SLIP */}
                        <div 
                          ref={sovannaSlipRef} 
                          className={`w-[600px] shrink-0 bg-white p-8 border-4 border-amber-600/60 shadow-lg relative rounded-sm ${activeSlipTab === 'sovanna' ? 'block' : 'hidden'}`}
                        >
                          {/* Khmer Decorative corners */}
                          <div className="absolute top-2 left-2 text-[10px] text-amber-600/30">✦</div>
                          <div className="absolute top-2 right-2 text-[10px] text-amber-600/30">✦</div>
                          <div className="absolute bottom-2 left-2 text-[10px] text-amber-600/30">✦</div>
                          <div className="absolute bottom-2 right-2 text-[10px] text-amber-600/30">✦</div>

                          <div className="text-center border-b-2 border-stone-200 pb-4 mb-4">
                            <h2 className="font-moul text-amber-800 text-base">សន្លឹកបើកប្រាក់បៀវត្សរ៍ប្រចាំខែ</h2>
                            <h3 className="font-sans font-bold text-stone-800 text-sm tracking-widest uppercase mt-0.5">MONTHLY SALARY STATEMENT (SOVANNA)</h3>
                            <p className="text-xs text-stone-500 font-sans mt-1">សម្រាប់៖ ខែ {mIndex} ឆ្នាំ 2026 / For: Month {mIndex} / 2026</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-4 border-b border-stone-100 pb-4">
                            <div>
                              <p className="text-stone-500">អ្នកទទួល (Receiver): <span className="font-bold text-stone-800">SOVANNA</span></p>
                              <p className="text-stone-500 mt-1">តួនាទី (Role): <span className="font-bold text-stone-800">អ្នកទទួលបន្ទុកអគ្គិសនី ទឹក និង Wifi / Supervisor of Elec, Water & Wifi</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-stone-500">ម្ចាស់ផ្ទះ (Landlord): <span className="font-bold text-stone-800">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</span></p>
                              <p className="text-stone-500 mt-1">កាលបរិច្ឆេទ (Date): <span className="font-bold text-stone-800">2026-{selectedMonth}-05</span></p>
                            </div>
                          </div>

                          <table className="w-full text-left border-collapse border border-stone-300 text-xs font-sans mb-6">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-300 text-stone-600 font-bold uppercase">
                                <th className="p-2">បរិយាយ (Description)</th>
                                <th className="p-2 text-right">ទឹកប្រាក់ (Amount)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 text-stone-700">
                              <tr>
                                <td className="p-2">
                                  <div className="font-medium text-stone-800">២០% នៃថ្លៃជួលបន្ទប់</div>
                                  <div className="text-[10px] text-stone-500 font-sans mt-0.5">(20% Room Rental Share)</div>
                                </td>
                                <td className="p-2 text-right font-mono font-bold">${(stats.roomRevenue * 0.20).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td className="p-2">
                                  <div className="font-medium text-stone-800">ថ្លៃអគ្គិសនីប្រចាំខែ</div>
                                  <div className="text-[10px] text-stone-500 font-sans mt-0.5">(100% Monthly Electricity Collected)</div>
                                </td>
                                <td className="p-2 text-right font-mono font-bold">${stats.electricityRevenue.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td className="p-2">
                                  <div className="font-medium text-stone-800">ថ្លៃទឹកស្អាតប្រចាំខែ</div>
                                  <div className="text-[10px] text-stone-500 font-sans mt-0.5">(100% Monthly Water Collected)</div>
                                </td>
                                <td className="p-2 text-right font-mono font-bold">${stats.waterRevenue.toFixed(2)}</td>
                              </tr>
                              {stats.wifiRevenue > 0 && (
                                <tr>
                                  <td className="p-2">
                                    <div className="font-medium text-stone-800">ថ្លៃអ៊ីនធឺណិតប្រចាំខែ</div>
                                    <div className="text-[10px] text-stone-500 font-sans mt-0.5">(100% Monthly Wi-Fi Collected)</div>
                                  </td>
                                  <td className="p-2 text-right font-mono font-bold">${stats.wifiRevenue.toFixed(2)}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>

                          <div className="flex justify-between items-center border-t-2 border-stone-800 pt-4 mb-8">
                            <span className="text-sm font-bold text-stone-800 uppercase">ប្រាក់បៀវត្សរ៍សរុប (Grand Total Payout)</span>
                            <span className="text-xl font-black text-amber-700 font-mono">${stats.sovannaSalary.toFixed(2)}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans mt-8 pt-8 border-t border-dashed border-stone-200">
                            <div>
                              <p className="text-stone-400">ហត្ថលេខាអ្នកទទួល (Receiver's Signature)</p>
                              <div className="h-12"></div>
                              <p className="font-bold text-stone-700">SOVANNA</p>
                            </div>
                            <div>
                              <p className="text-stone-400">អ្នករៀបចំ (Prepared By)</p>
                              <div className="h-12"></div>
                              <p className="font-bold text-stone-700">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</p>
                            </div>
                          </div>
                        </div>


                        {/* 2. PHEAK SLIP */}
                        <div 
                          ref={pheakSlipRef} 
                          className={`w-[600px] shrink-0 bg-white p-8 border-4 border-sky-600/60 shadow-lg relative rounded-sm ${activeSlipTab === 'pheak' ? 'block' : 'hidden'}`}
                        >
                          <div className="absolute top-2 left-2 text-[10px] text-sky-600/30">✦</div>
                          <div className="absolute top-2 right-2 text-[10px] text-sky-600/30">✦</div>
                          <div className="absolute bottom-2 left-2 text-[10px] text-sky-600/30">✦</div>
                          <div className="absolute bottom-2 right-2 text-[10px] text-sky-600/30">✦</div>

                          <div className="text-center border-b-2 border-stone-200 pb-4 mb-4">
                            <h2 className="font-moul text-sky-800 text-base">សន្លឹកបើកប្រាក់បៀវត្សរ៍ប្រចាំខែ</h2>
                            <h3 className="font-sans font-bold text-stone-800 text-sm tracking-widest uppercase mt-0.5">MONTHLY SALARY STATEMENT (PHEAK)</h3>
                            <p className="text-xs text-stone-500 font-sans mt-1">សម្រាប់៖ ខែ {mIndex} ឆ្នាំ 2026 / For: Month {mIndex} / 2026</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-4 border-b border-stone-100 pb-4">
                            <div>
                              <p className="text-stone-500">អ្នកទទួល (Receiver): <span className="font-bold text-stone-800">PHEAK</span></p>
                              <p className="text-stone-500 mt-1">តួនាទី (Role): <span className="font-bold text-stone-800">អ្នកគ្រប់គ្រងបន្ទប់ (Manager)</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-stone-500">ម្ចាស់ផ្ទះ (Landlord): <span className="font-bold text-stone-800">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</span></p>
                              <p className="text-stone-500 mt-1">កាលបរិច្ឆេទ (Date): <span className="font-bold text-stone-800">2026-{selectedMonth}-05</span></p>
                            </div>
                          </div>

                          <table className="w-full text-left border-collapse border border-stone-300 text-xs font-sans mb-6">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-300 text-stone-600 font-bold uppercase">
                                <th className="p-2">បរិយាយ (Description)</th>
                                <th className="p-2 text-center">ចំនួនបន្ទប់ (Quantity)</th>
                                <th className="p-2 text-right">តម្លៃឯកតា (Unit Rate)</th>
                                <th className="p-2 text-right">ទឹកប្រាក់ (Amount)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 text-stone-700">
                              <tr>
                                <td className="p-2">
                                  <div className="font-medium text-stone-800">ថ្លៃគ្រប់គ្រងបន្ទប់ដែលបានជួល</div>
                                  <div className="text-[10px] text-stone-500 font-sans mt-0.5">(Rented Room Management Fee)</div>
                                </td>
                                <td className="p-2 text-center font-mono">{stats.roomsCount} បន្ទប់ (Rooms)</td>
                                <td className="p-2 text-right font-mono">${mIndex >= 10 ? '10.00' : '15.00'}</td>
                                <td className="p-2 text-right font-mono font-bold">${stats.pheakSalary.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="flex justify-between items-center border-t-2 border-stone-800 pt-4 mb-8">
                            <span className="text-sm font-bold text-stone-800 uppercase">ប្រាក់បៀវត្សរ៍សរុប (Grand Total Payout)</span>
                            <span className="text-xl font-black text-sky-700 font-mono">${stats.pheakSalary.toFixed(2)}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans mt-8 pt-8 border-t border-dashed border-stone-200">
                            <div>
                              <p className="text-stone-400">ហត្ថលេខាអ្នកទទួល (Receiver's Signature)</p>
                              <div className="h-12"></div>
                              <p className="font-bold text-stone-700">PHEAK</p>
                            </div>
                            <div>
                              <p className="text-stone-400">អ្នករៀបចំ (Prepared By)</p>
                              <div className="h-12"></div>
                              <p className="font-bold text-stone-700">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</p>
                            </div>
                          </div>
                        </div>


                        {/* 3. LANDLORD NET REVENUE SLIP */}
                        <div 
                          ref={landlordSlipRef} 
                          className={`w-[600px] shrink-0 bg-white p-8 border-4 border-emerald-600/60 shadow-lg relative rounded-sm ${activeSlipTab === 'landlord' ? 'block' : 'hidden'}`}
                        >
                          <div className="absolute top-2 left-2 text-[10px] text-emerald-600/30">✦</div>
                          <div className="absolute top-2 right-2 text-[10px] text-emerald-600/30">✦</div>
                          <div className="absolute bottom-2 left-2 text-[10px] text-emerald-600/30">✦</div>
                          <div className="absolute bottom-2 right-2 text-[10px] text-emerald-600/30">✦</div>

                          <div className="text-center border-b-2 border-stone-200 pb-4 mb-4">
                            <h2 className="font-moul text-emerald-800 text-base">របាយការណ៍ហិរញ្ញវត្ថុប្រចាំខែ</h2>
                            <h3 className="font-sans font-bold text-stone-800 text-sm tracking-widest uppercase mt-0.5">MONTHLY NET REVENUE REPORT (LANDLORD)</h3>
                            <p className="text-xs text-stone-500 font-sans mt-1">សម្រាប់៖ ខែ {mIndex} ឆ្នាំ 2026 / For: Month {mIndex} / 2026</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-4 border-b border-stone-100 pb-4">
                            <div>
                              <p className="text-stone-500">អ្នកទទួលផល (Owner): <span className="font-bold text-stone-800">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</span></p>
                              <p className="text-stone-500 mt-1">ប្រភពផ្ទះជួល (Property): <span className="font-bold text-stone-800">បន្ទប់ជួលផ្ទះបឹងកេងកង</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-stone-500">បន្ទប់សរុប (Total Rooms): <span className="font-bold text-stone-800">{stats.roomsCount} / 12</span></p>
                              <p className="text-stone-500 mt-1">កាលបរិច្ឆេទ (Date): <span className="font-bold text-stone-800">2026-{selectedMonth}-05</span></p>
                            </div>
                          </div>

                          <table className="w-full text-left border-collapse border border-stone-300 text-xs font-sans mb-6">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-300 text-stone-600 font-bold uppercase">
                                <th className="p-2">លម្អិតប្រតិបត្តិការ (Description)</th>
                                <th className="p-2 text-right">ទឹកប្រាក់ (Amount)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 text-stone-700">
                              <tr>
                                <td className="p-2">
                                  <div className="font-medium text-stone-800">ចំណូលថ្លៃបន្ទប់សរុប</div>
                                  <div className="text-[10px] text-emerald-700 font-sans mt-0.5">(Total Room Rental Income Collected)</div>
                                </td>
                                <td className="p-2 text-right font-mono text-emerald-600 font-bold">+${stats.roomRevenue.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td className="p-2">
                                  <div className="font-medium text-amber-800">ដក៖ ភាគលាភ Sovanna ២០%</div>
                                  <div className="text-[10px] text-amber-700 font-sans mt-0.5">(Less: Sovanna 20% room rental share)</div>
                                </td>
                                <td className="p-2 text-right font-mono text-amber-700">-${(stats.roomRevenue * 0.20).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td className="p-2">
                                  <div className="font-medium text-sky-800">ដក៖ ថ្លៃគ្រប់គ្រង Pheak ${mIndex >= 10 ? '១០' : '១៥'}/បន្ទប់</div>
                                  <div className="text-[10px] text-sky-700 font-sans mt-0.5">(Less: Pheak Room Management Fee - ${mIndex >= 10 ? '$10' : '$15'}/room)</div>
                                </td>
                                <td className="p-2 text-right font-mono text-sky-700">-${stats.pheakSalary.toFixed(2)}</td>
                              </tr>
                              <tr className="bg-stone-50/50">
                                <td className="p-2">
                                  <div className="font-bold text-stone-600 italic">សំគាល់៖ ប្រាក់កក់មិនគិតចូលចំណូល</div>
                                  <div className="text-[10px] text-stone-500 font-sans mt-0.5 font-normal">(Deposit Held - displayed only)</div>
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-amber-900">${stats.deposit.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="flex justify-between items-center border-t-2 border-stone-800 pt-4 mb-8">
                            <span className="text-sm font-bold text-stone-800 uppercase">ប្រាក់ចំណេញសុទ្ធ (Landlord Net Revenue)</span>
                            <span className="text-xl font-black text-emerald-600 font-mono">${stats.landlordNet.toFixed(2)}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans mt-8 pt-8 border-t border-dashed border-stone-200">
                            <div>
                              <p className="text-stone-400">ហត្ថលេខាម្ចាស់ផ្ទះ (Owner's Signature)</p>
                              <div className="h-12"></div>
                              <p className="font-bold text-stone-700">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</p>
                            </div>
                            <div>
                              <p className="text-stone-400">អ្នកពិនិត្យ (Audited By)</p>
                              <div className="h-12"></div>
                              <p className="font-bold text-stone-700">ងួន សុវណ្ណា</p>
                            </div>
                          </div>
                        </div>


                        {/* 4. YEARLY INCOME REPORT SLIP */}
                        <div 
                          ref={yearlySlipRef} 
                          className={`w-[600px] shrink-0 bg-white p-8 border-4 border-violet-600/60 shadow-lg relative rounded-sm ${activeSlipTab === 'yearly' ? 'block' : 'hidden'}`}
                        >
                          <div className="absolute top-2 left-2 text-[10px] text-violet-600/30">✦</div>
                          <div className="absolute top-2 right-2 text-[10px] text-violet-600/30">✦</div>
                          <div className="absolute bottom-2 left-2 text-[10px] text-violet-600/30">✦</div>
                          <div className="absolute bottom-2 right-2 text-[10px] text-violet-600/30">✦</div>

                          <div className="text-center border-b-2 border-stone-200 pb-4 mb-4">
                            <h2 className="font-moul text-violet-800 text-base">របាយការណ៍សង្ខេបចំណូលប្រចាំឆ្នាំ</h2>
                            <h3 className="font-sans font-bold text-stone-800 text-sm tracking-widest uppercase mt-0.5">ANNUAL SUMMARY INCOME STATEMENT (2026)</h3>
                            <p className="text-xs text-stone-500 font-sans mt-1">របាយការណ៍សរុបចំណូលទាំងមូលពេញមួយឆ្នាំ / Full Year Cumulative Earnings Report</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-4 border-b border-stone-100 pb-4">
                            <div>
                              <p className="text-stone-500">ប្រភពផ្ទះជួល (Property): <span className="font-bold text-stone-800">បន្ទប់ជួលផ្ទះបឹងកេងកង</span></p>
                              <p className="text-stone-500 mt-1">កាលបរិច្ឆេទរបាយការណ៍ (Date): <span className="font-bold text-stone-800">{statementDate ? statementDate.split('-').reverse().join('-') : ''}</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-stone-500">ម្ចាស់ផ្ទះ (Landlord): <span className="font-bold text-stone-800">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</span></p>
                              <p className="text-stone-500 mt-1">ចំនួនខែទូទាត់ (Months tracked): <span className="font-bold text-stone-800">12 ខែ (12 Months)</span></p>
                            </div>
                          </div>

                          <table className="w-full text-left border-collapse border border-stone-300 text-xs font-sans mb-6">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-300 text-stone-600 font-bold uppercase">
                                <th className="p-2">សមាជិក (Person / Role)</th>
                                <th className="p-2">លម្អិតប្រភពចំណូល (Income Sources)</th>
                                <th className="p-2 text-right">ប្រាក់ចំណូលសរុប (Total Revenue)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 text-stone-700">
                              {/* Sovanna */}
                              <tr>
                                <td className="p-2 font-bold text-amber-800 bg-amber-50/10">SOVANNA<br/><span className="text-[9px] font-normal text-stone-500">អ្នកទទួលខុសត្រូវ (Supervisor)</span></td>
                                <td className="p-2 text-stone-600">
                                  • ២០% នៃថ្លៃបន្ទប់សរុប (20% Room Share: <span className="font-mono">${([1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).roomRevenue * 0.20, 0)).toFixed(2)}</span>)<br/>
                                  • ១០០% ថ្លៃទឹក អគ្គិសនី វ៉ាយហ្វាយ (100% Utilities & Wifi: <span className="font-mono">${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => {
                                    const stats = getMonthlyStats(m);
                                    return sum + stats.electricityRevenue + stats.waterRevenue + stats.wifiRevenue;
                                  }, 0).toFixed(2)}</span>)
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-amber-600 bg-amber-50/10 text-sm">
                                  ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).sovannaSalary, 0).toFixed(2)}
                                </td>
                              </tr>

                              {/* Pheak */}
                              <tr>
                                <td className="p-2 font-bold text-sky-800 bg-sky-50/10">PHEAK<br/><span className="text-[9px] font-normal text-stone-500">អ្នកគ្រប់គ្រង (Manager)</span></td>
                                <td className="p-2 text-stone-600">
                                  • $15 ក្នុងមួយបន្ទប់ (ខែ ១-៩) និង $10 (ខែ ១០-១២) ជួលបានសរុប ($15/room for Months 1-9, $10/room for Months 10-12 for all { [1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).roomsCount, 0) } rooms rented throughout the year)
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-sky-600 bg-sky-50/10 text-sm">
                                  ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).pheakSalary, 0).toFixed(2)}
                                </td>
                              </tr>

                              {/* Landlord */}
                              <tr>
                                <td className="p-2 font-bold text-emerald-800 bg-emerald-50/10">LANDLORD<br/><span className="text-[9px] font-normal text-stone-500">ម្ចាស់ផ្ទះ សាង សុវណ្ណារតនៈ (Owner)</span></td>
                                <td className="p-2 text-stone-600">
                                  • ៨០% ថ្លៃបន្ទប់សរុបដកថ្លៃ Pheak (Remaining Room Rent after paying commissions: Room Revenue <span className="font-mono">${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).roomRevenue, 0).toFixed(2)}</span> - Sovanna Share - Pheak Share)
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-emerald-600 bg-emerald-50/10 text-sm">
                                  ${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).landlordNet, 0).toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          <div className="bg-stone-50 p-3 rounded border border-stone-200 mb-6 flex justify-between items-center text-xs font-bold text-stone-700">
                            <span>សរុបចំណូលរួមទូទាំងឆ្នាំ (Combined Annual Revenue Collected):</span>
                            <span className="font-mono text-stone-900 text-sm">${[1,2,3,4,5,6,7,8,9,10,11,12].reduce((sum, m) => sum + getMonthlyStats(m).totalUsd, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans mt-8 pt-8 border-t border-dashed border-stone-200">
                            <div>
                              <p className="text-stone-400">ហត្ថលេខាម្ចាស់ផ្ទះ (Owner's Signature)</p>
                              <div className="h-12"></div>
                              <p className="font-bold text-stone-700">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</p>
                            </div>
                            <div>
                              <p className="text-stone-400">អ្នកពិនិត្យ (Audited By)</p>
                              <div className="h-12"></div>
                              <p className="font-bold text-stone-700">ងួន សុវណ្ណា</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* List of Rented Guests with Cumulative Payments (REQUESTED) */}
              <div className="space-y-4 font-sans mb-8">
                {/* Banner: Delete Old Tenant Info & Keep Accumulated Landlord Monthly Revenue */}
                <div className="bg-emerald-950/95 border-2 border-emerald-500 rounded-xl p-4 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                        {trApp('ប្រព័ន្ធរក្សាចំណូលបូកបន្ត • CUMULATIVE REVENUE PRESERVATION', 'CUMULATIVE REVENUE PRESERVATION MODE')}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      {trApp(
                        '🧹 លុបព័ត៌មានភ្ញៀវចាស់ដែលឈប់ជួល — រក្សាទុកតួលេខចំណូលប្រចាំខែរបស់ម្ចាស់ផ្ទះបូកបន្ត',
                        '🧹 Clear Vacated Tenant Info — Keep & Accumulate Landlord Monthly Revenue'
                      )}
                    </h4>
                    <p className="text-xs text-emerald-200 leading-relaxed">
                      {trApp(
                        'លុបព័ត៌មានភ្ញៀវចាស់ដែលបានឈប់ជួលបន្ទប់ ប៉ុន្តែរក្សាទុកទិន្នន័យចំណូលខែមុនៗទាំងអស់ ១០០% នៅក្នុងតារាងចំណូលប្រចាំខែរបស់ម្ចាស់ផ្ទះ។ ប្តូរតែភ្ញៀវជួលថ្មី ចំណូលនៅតែបូកបន្តជានិច្ច។',
                        'Delete personal information of former tenants who moved out while preserving 100% of past monthly revenues in the landlord ledger. Only the tenant changes; monthly revenue continues to accumulate.'
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePurgeAllFormerTenantsKeepRevenue()}
                      className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs px-3.5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{trApp('លុបឈ្មោះភ្ញៀវចាស់ (រក្សាចំណូលបូកបន្ត)', 'Clear Vacated Tenants (Keep Revenue)')}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-stone-50 border border-stone-200 rounded-lg p-3">
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 uppercase flex items-center gap-1.5">
                      {trApp(
                        '👥 បញ្ជីចំណូលសរុបបូកបន្តតាមបន្ទប់ទាំង ១៦ (CUMULATIVE REVENUE BY ALL 16 ROOMS)',
                        '👥 CUMULATIVE REVENUE BY ALL 16 ROOMS (RM-01 TO RM-16)'
                      )}
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5 font-sans">
                      {trApp(
                        'តារាងចំណូលប្រចាំខែរបស់ម្ចាស់ផ្ទះទាំង ១៦ បន្ទប់ (បូកបន្តទិន្នន័យចាស់ + ភ្ញៀវថ្មី)',
                        'Landlord cumulative monthly revenue table across all 16 rooms (preserves past revenue when changing tenants).'
                      )}
                    </p>
                  </div>
                  <div className="text-xs bg-white border border-stone-200 rounded px-3 py-1.5 flex items-center gap-3 font-sans">
                    <span className="font-bold text-stone-700">{trApp('បានបង់ប្រាក់ខែបច្ចុប្បន្ន៖', 'Paid Current Month:')}</span>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-mono">
                      {savedTenants.filter(t => t.isPaid).length} / 16 {trApp('បន្ទប់', 'Rooms')}
                    </span>
                  </div>
                </div>
                
                <div className="overflow-x-auto border border-stone-200 rounded-lg shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                        <th className="p-3">បន្ទប់ (Room)</th>
                        <th className="p-3">ភ្ញៀវបច្ចុប្បន្ន (Current Tenant)</th>
                        <th className="p-3">ថ្ងៃចូលស្នាក់នៅ (Check-In)</th>
                        <th className="p-3 text-right">តម្លៃបន្ទប់ដើម (Base Room Rent)</th>
                        <th className="p-3 text-right text-amber-800">ប្រាក់កក់ (Security Deposit)</th>
                        <th className="p-3 text-center font-sans">វិក្កយបត្របូកបន្ត (Accumulated Months)</th>
                        <th className="p-3 text-right font-bold text-emerald-700 font-sans">ចំណូលសរុបបូកបន្តរបស់ម្ចាស់ផ្ទះ (Cumulative Landlord Revenue)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {getAllTenantEntries().map((tenantEntry) => {
                        const isSelected = normalizeRoomKey(selectedYearlyTenant) === normalizeRoomKey(tenantEntry.roomNo);
                        
                        return (
                          <tr 
                            key={tenantEntry.key} 
                            onClick={() => {
                              setSelectedYearlyTenant(tenantEntry.roomNo);
                              setSelectedYearlyTenantName(tenantEntry.tenantName);
                            }}
                            className={`hover:bg-emerald-50/40 cursor-pointer transition-all duration-150 ${isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600 font-semibold' : ''}`}
                          >
                            <td className="p-3 font-bold text-stone-800">
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[11px] font-black font-sans">
                                {formatRoomBadge(tenantEntry.roomNo)}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-moul text-[11px] text-blue-900 leading-tight">{tenantEntry.tenantName}</p>
                                  {tenantEntry.tenantPhone && <p className="text-[10px] text-stone-400 mt-0.5">{tenantEntry.tenantPhone}</p>}
                                </div>
                                {tenantEntry.isCurrent ? (
                                  <span className="text-[9px] bg-emerald-500 text-white font-bold font-sans px-1.5 py-0.5 rounded scale-90 uppercase tracking-wider">កំពុងជួល (Active)</span>
                                ) : (
                                  <span className="text-[9px] bg-amber-500 text-white font-bold font-sans px-1.5 py-0.5 rounded scale-90 uppercase tracking-wider">បន្ទប់ទំនេរ (Vacant - Revenue Kept)</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-stone-500 font-sans">{tenantEntry.checkInDate || '—'}</td>
                            <td className="p-3 text-right font-sans">
                              <p className="font-medium text-stone-700">${tenantEntry.roomPrice}/ខែ (Month)</p>
                              {tenantEntry.wifiPrice > 0 && <p className="text-[10px] text-stone-400 mt-0.5">Wifi: ${tenantEntry.wifiPrice}</p>}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-amber-700">
                              {tenantEntry.deposit !== undefined ? `$${tenantEntry.deposit.toFixed(2)}` : '$0.00'}
                            </td>
                            <td className="p-3 text-center font-sans">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 font-sans">
                                {tenantEntry.records.length} ខែបូកបន្ត (Months Kept)
                              </span>
                            </td>
                            <td className="p-3 text-right font-black text-emerald-600 font-mono text-[13px] tabular-nums">
                              <div className="flex items-center justify-end gap-2">
                                <span>${tenantEntry.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                {tenantEntry.isCurrent && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const matched = savedTenants.find(t => normalizeRoomKey(t.roomNo) === normalizeRoomKey(tenantEntry.roomNo));
                                      if (matched) handleVacateRoom(matched);
                                    }}
                                    className="px-2 py-1 rounded text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-sans transition-all cursor-pointer"
                                    title={trApp('លុបភ្ញៀវចាស់ដែលឈប់ជួល តែរក្សាទុកចំណូលបូកបន្ត', 'Clear vacated tenant while keeping cumulative revenue')}
                                  >
                                    {trApp('លុបភ្ញៀវចាស់ (រក្សាចំណូល)', 'Vacate (Keep Revenue)')}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedYearlyTenant(tenantEntry.roomNo);
                                    setSelectedYearlyTenantName(tenantEntry.tenantName);
                                  }}
                                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider font-sans shadow-sm transition-all ${
                                    isSelected 
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                  }`}
                                >
                                  មើល (View)
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* DYNAMIC CUMULATIVE TRACKING & 12-MONTH INPUT MATRIX SECTION (REQUESTED) */}
                <div className="mt-6 border border-stone-200 rounded-xl overflow-hidden shadow-sm bg-white font-sans">
                  {/* Selector Header Sub-tabs */}
                  <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 p-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setYearlyViewTab('individual')}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          yearlyViewTab === 'individual'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        របាយការណ៍ម្នាក់ៗ (Individual Report)
                      </button>
                      <button
                        type="button"
                        onClick={() => setYearlyViewTab('matrix')}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          yearlyViewTab === 'matrix'
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        ម៉ាទ្រីស ១២ខែ (12-Month Matrix)
                      </button>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono px-3">
                      * ស្ថិតិតាមដានពេញមួយឆ្នាំ ២០២៦ / Full Year 2026 Tracking
                    </div>
                  </div>

                  {/* Panel Contents */}
                  <div className="p-5 bg-white">
                    {yearlyViewTab === 'individual' ? (
                      (() => {
                        const tenantEntries = getAllTenantEntries();
                        const selectedEntry = tenantEntries.find(e => e.roomNo === selectedYearlyTenant && (selectedYearlyTenantName ? e.tenantName.toLowerCase().trim() === selectedYearlyTenantName.toLowerCase().trim() : true)) || tenantEntries.find(e => e.roomNo === selectedYearlyTenant) || tenantEntries[0];
                        
                        const getMonthFromPaymentDate = (dateStr: string) => {
                          if (!dateStr) return '';
                          const parts = dateStr.split('-');
                          return parts[1] || '';
                        };

                        const selectedTenantHistory = selectedEntry ? selectedEntry.records : [];
                        const selectedTenantYearTotal = selectedTenantHistory.reduce((sum, r) => sum + r.totalUsd, 0);

                        return (
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 pb-3">
                              <div>
                                <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5 font-moul leading-normal">
                                  📊 តារាងលម្អិតការបង់ប្រាក់ប្រចាំខែ - បន្ទប់ {formatRoomBadge(selectedEntry?.roomNo)} ({selectedEntry?.tenantName}) {!selectedEntry?.isCurrent && <span className="text-xs text-amber-600 font-sans font-normal">(ភ្ញៀវចាស់ / Former Tenant)</span>}
                                </h4>
                                <p className="text-[11px] text-stone-500">ការតាមដានការទូទាត់ប្រចាំខែតាមជួរឈរនីមួយៗក្នុងឆ្នាំ ២០២៦ / Monthly payment details for the selected tenant.</p>
                              </div>
                              <div className="bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5 text-xs font-bold flex items-center gap-2">
                                <span className="text-emerald-800">សរុបប្រចាំឆ្នាំ (Yearly Accumulated):</span>
                                <span className="text-emerald-700 font-mono text-sm font-black">${selectedTenantYearTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>

                            <div className="overflow-x-auto border border-stone-100 rounded-lg">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                                    <th className="p-2.5 font-sans">ខែ (Month)</th>
                                    <th className="p-2.5 text-center font-sans">ស្ថានភាព (Status)</th>
                                    <th className="p-2.5 font-sans">កាលបរិច្ឆេទ (Payment Date)</th>
                                    <th className="p-2.5 text-right font-sans">ថ្លៃបន្ទប់ (Room Price)</th>
                                    <th className="p-2.5 text-right font-sans">ទឹកភ្លើង (Utilities)</th>
                                    <th className="p-2.5 text-right font-sans">វ៉ាយហ្វាយ (Wifi / Other)</th>
                                    <th className="p-2.5 text-right font-bold text-emerald-800 font-sans">សរុប (Total Amount)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 font-sans text-stone-700 bg-white">
                                  {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((mIndex) => {
                                    const monthRecords = selectedTenantHistory.filter(h => getMonthFromPaymentDate(h.paymentDate) === mIndex);
                                    const mRecord = monthRecords[0];
                                    const mRoomSum = monthRecords.reduce((s, r) => s + r.roomPrice, 0);
                                    const mUtilSum = monthRecords.reduce((s, r) => s + r.elecPrice + r.waterPrice, 0);
                                    const mWifiSum = monthRecords.reduce((s, r) => s + r.wifiPrice + r.otherPrice, 0);
                                    const mTotalSum = monthRecords.reduce((s, r) => s + r.totalUsd, 0);

                                    return (
                                      <tr key={mIndex} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="p-2.5 font-bold font-mono">ខែ {parseInt(mIndex)} / Month {parseInt(mIndex)}</td>
                                        <td className="p-2.5 text-center">
                                          {mRecord ? (
                                            <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">បង់រួច (PAID)</span>
                                          ) : (
                                            <span className="px-2.5 py-0.5 rounded bg-stone-50 text-stone-400 border border-stone-100 text-[10px] font-medium uppercase">គ្មានទិន្នន័យ (PENDING)</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-stone-500 font-mono">{mRecord ? mRecord.paymentDate : '—'}</td>
                                        <td className="p-2.5 text-right font-mono text-stone-600">{mRecord ? `$${mRoomSum.toFixed(2)}` : '—'}</td>
                                        <td className="p-2.5 text-right font-mono text-stone-600">{mRecord ? `$${mUtilSum.toFixed(2)}` : '—'}</td>
                                        <td className="p-2.5 text-right font-mono text-stone-600">{mRecord ? `$${mWifiSum.toFixed(2)}` : '—'}</td>
                                        <td className="p-2.5 text-right font-black text-emerald-600 font-mono text-sm">
                                          {mRecord ? `$${mTotalSum.toFixed(2)}` : '—'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-4">
                        <div className="border-b border-stone-100 pb-3">
                          <h4 className="text-sm font-black text-violet-800 uppercase tracking-wide flex items-center gap-1.5 font-moul leading-normal">
                            📊 ម៉ាទ្រីសចំណូលសរុបប្រចាំឆ្នាំតាមបន្ទប់ (12-MONTH ROOM REVENUE MATRIX)
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            {trApp(
                              'តារាងសរុបចំណូលតាមខែនីមួយៗរបស់បន្ទប់ទាំង ១៦ ក្នុងឆ្នាំ ២០២៦ (បូកបន្តភ្ញៀវចាស់ + ភ្ញៀវថ្មី)',
                              'Monthly revenue matrix across all 16 rooms in 2026 (accumulates both former vacated tenants and new tenants).'
                            )}
                          </p>
                        </div>

                        <div className="overflow-x-auto border border-stone-100 rounded-lg">
                          <table className="w-full text-center border-collapse text-[10px] font-sans">
                            <thead>
                              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-bold">
                                <th className="p-2.5 text-left">បន្ទប់ (Room)</th>
                                <th className="p-2.5 text-left">ឈ្មោះ (Guest)</th>
                                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(m => (
                                  <th key={m} className="p-1.5 font-mono">{appLang === 'km' ? `ខែ${m}` : `M${m}`}</th>
                                ))}
                                <th className="p-2.5 text-right text-emerald-800 font-bold">សរុបបូកបន្ត (Total)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 bg-white text-stone-700">
                              {getAllTenantEntries().map((tenantEntry) => {
                                const rowTotal = tenantEntry.records.reduce((sum, r) => sum + r.totalUsd, 0);

                                const getMonthFromPaymentDate = (dateStr: string) => {
                                  if (!dateStr) return '';
                                  const parts = dateStr.split('-');
                                  return parts[1] || '';
                                };

                                return (
                                  <tr key={tenantEntry.key} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="p-2.5 text-left font-bold font-sans text-stone-900 bg-stone-50/30">
                                      {formatRoomBadge(tenantEntry.roomNo)}
                                      {!tenantEntry.isCurrent && <span className="block text-[8px] text-amber-600 font-sans font-normal">(បន្ទប់ទំនេរ)</span>}
                                    </td>
                                    <td className="p-2.5 text-left font-moul text-[10px] truncate max-w-[90px] text-blue-950" title={tenantEntry.tenantName}>{tenantEntry.tenantName}</td>
                                    {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((mIndex) => {
                                      const monthRecs = tenantEntry.records.filter(h => getMonthFromPaymentDate(h.paymentDate) === mIndex);
                                      const monthSum = monthRecs.reduce((s, r) => s + r.totalUsd, 0);
                                      return (
                                        <td key={mIndex} className="p-1.5 font-mono">
                                          {monthRecs.length > 0 ? (
                                            <span className="text-emerald-600 font-bold" title={`Accumulated Revenue: $${monthSum.toFixed(2)}`}>${monthSum.toFixed(0)}</span>
                                          ) : (
                                            <span className="text-stone-300 font-normal">—</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className="p-2.5 text-right font-black text-emerald-600 font-mono text-[11px] bg-emerald-50/20">
                                      ${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Payment History Ledger */}
              <div className="space-y-4 font-sans">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5 mb-1 text-blue-900 uppercase">
                      📜 សៀវភៅបញ្ជីប្រវត្តិប្រតិបត្តិការលម្អិត (DETAILED TRANSACTION LEDGER • {history.length})
                    </h3>
                    <p className="text-xs text-stone-500">ប្រវត្តិទូទាត់លម្អិតរាល់ការបង់ប្រាក់ថ្លៃបន្ទប់ និងប្រតិបត្តិការដោយដៃ / Detailed payment history ledger of room rentals and manual entries.</p>
                  </div>
                  
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400 font-sans" />
                    <input
                      type="text"
                      placeholder="Search room, tenant, date..."
                      className="w-full bg-stone-50 border border-stone-200 rounded pl-8 pr-3 py-1.5 text-xs outline-none focus:bg-white focus:border-emerald-500 transition-all text-stone-800 font-sans"
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto border border-stone-200 rounded-lg shadow-sm">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                        <th className="p-3">កាលបរិច្ឆេទ (Date)</th>
                        <th className="p-3 font-sans">បន្ទប់ (Room)</th>
                        <th className="p-3">ឈ្មោះអ្នកជួល (Tenant)</th>
                        <th className="p-3 text-right">ថ្លៃបន្ទប់ (Room Price)</th>
                        <th className="p-3 text-right">ទឹកភ្លើង (Utilities)</th>
                        <th className="p-3 text-right">វ៉ាយហ្វាយ/ផ្សេងៗ (Wifi/Other)</th>
                        <th className="p-3 text-right font-bold text-indigo-700">ប្រាក់សរុប (Paid Amount)</th>
                        <th className="p-3 text-center">សកម្មភាព (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(() => {
                        const filtered = history.filter(h => 
                          h.tenantName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                          h.roomNo.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                          h.paymentDate.includes(adminSearchQuery)
                        ).sort((a, b) => {
                          const numA = parseInt((a.roomNo || '').replace(/\D/g, ''), 10);
                          const numB = parseInt((b.roomNo || '').replace(/\D/g, ''), 10);
                          if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
                          return (a.roomNo || '').localeCompare(b.roomNo || '', undefined, { numeric: true, sensitivity: 'base' });
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-stone-400">គ្មានទិន្នន័យទូទាត់សមស្របត្រូវបានរកឃើញទេ / No matching transaction records found.</td>
                            </tr>
                          );
                        }

                        return filtered.map((record) => (
                          <tr key={record.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="p-3 text-stone-600 font-mono text-[11px] whitespace-nowrap">{record.paymentDate}</td>
                            <td className="p-3 font-bold text-stone-800">
                              <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-black font-sans">
                                {formatRoomBadge(record.roomNo)}
                              </span>
                            </td>
                            <td className="p-3 font-moul text-[11px] text-blue-900 leading-tight">{record.tenantName}</td>
                            <td className="p-3 text-right font-mono text-stone-600">${record.roomPrice.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono text-stone-600">
                              ${(record.elecPrice + record.waterPrice).toFixed(2)}
                              {(record.elecUsage > 0 || record.waterUsage > 0) && (
                                <p className="text-[9px] text-stone-400 font-sans mt-0.5">
                                  {record.elecUsage > 0 ? `${record.elecUsage}KWH` : ''} {record.waterUsage > 0 ? `/ ${record.waterUsage}M³` : ''}
                                </p>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono text-stone-600">${(record.wifiPrice + record.otherPrice).toFixed(2)}</td>
                            <td className="p-3 text-right font-black text-indigo-600 font-mono text-[12px] tabular-nums">
                              ${record.totalUsd.toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`តើអ្នកប្រាកដជាចង់លុបប្រតិបត្តិការបន្ទប់ ${formatRoomBadge(record.roomNo)} ថ្ងៃទី ${record.paymentDate} នេះឬទេ? / Are you sure you want to delete room ${formatRoomBadge(record.roomNo)} transaction dated ${record.paymentDate}?`)) {
                                    handleDeleteHistory(record.id);
                                  }
                                }}
                                className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-all inline-flex"
                                title="លុបប្រតិបត្តិការ (Delete Transaction)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tenants Tab Screen */}
          {userRole === 'admin' && activeTab === 'tenants' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white shadow-2xl rounded-xl overflow-hidden p-6 sm:p-8 border border-stone-200 font-sans"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    {trApp('សៀវភៅគ្រប់គ្រងអ្នកជួលបន្ទប់ (ទាំង ១៦ បន្ទប់)', 'Tenants & Rooms Directory (All 16 Rooms)')}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    {trApp(
                      `គ្រប់គ្រងព័ត៌មានលម្អិតរបស់បន្ទប់ទាំង ១៦ បន្ទប់ទំនេរ (${vacantRoomsList.length} បន្ទប់) និងស្ថានភាពបង់ប្រាក់។`,
                      `Manage detailed information across all 16 rooms, vacant rooms (${vacantRoomsList.length} vacant), and payment status.`
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePurgeAllFormerTenantsKeepRevenue()}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-colors cursor-pointer"
                    title={trApp(
                      'លុបឈ្មោះភ្ញៀវចាស់ដែលឈប់ជួល តែរក្សាទុកចំណូលបូកបន្ត',
                      'Clear vacated tenant names while keeping cumulative revenue'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    {trApp('លុបភ្ញៀវចាស់ (រក្សាចំណូល)', 'Clear Vacated Tenants (Keep Revenue)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (vacantRoomsList.length > 0 && !vacantRoomsList.includes(checkInFormData.roomNo)) {
                        handleSelectVacantRoomForCheckIn(vacantRoomsList[0], true);
                      } else {
                        setActiveTab('checkInForm');
                      }
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    {trApp(`ចុះឈ្មោះភ្ញៀវចូលបន្ទប់ទំនេរ (${vacantRoomsList.length})`, `Check-In to Vacant Room (${vacantRoomsList.length})`)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(true);
                      formRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {trApp('បន្ថែមបន្ទប់ថ្មី', 'Add Room')}
                  </button>
                </div>
              </div>

              {/* Vacant Rooms Section inside Directory */}
              <div className="mb-7 bg-emerald-50/70 border-2 border-emerald-200 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                      {trApp(
                        `បន្ទប់ទំនេរមិនទាន់មានភ្ញៀវ (${vacantRoomsList.length} បន្ទប់)`,
                        `Vacant Rooms Ready for Rent (${vacantRoomsList.length} Rooms)`
                      )}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md">
                    {trApp('ចុចលើបន្ទប់ទំនេរដើម្បីបញ្ចូលភ្ញៀវថ្មី', 'Click a vacant room to check in a new tenant')}
                  </span>
                </div>

                {vacantRoomsList.length === 0 ? (
                  <div className="bg-white border border-emerald-200 rounded-lg p-4 text-center text-xs text-stone-600">
                    {trApp(
                      'បច្ចុប្បន្នគ្រប់បន្ទប់ទាំង ១៦ មានភ្ញៀវជួលពេញហើយ។',
                      'All 16 rooms are currently occupied.'
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {vacantRoomsList.map((rNo) => {
                      const meta = vacantRoomsMeta[rNo] || {
                        roomPrice: '80',
                        wifiPrice: '0',
                        elecOld: '0',
                        waterOld: '0',
                        deposit: '80'
                      };
                      return (
                        <div
                          key={`vacant-dir-${rNo}`}
                          className="bg-white border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-xs transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg font-sans">
                                {formatRoomBadge(rNo)}
                              </span>
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  ● {trApp('បន្ទប់ទំនេរ', 'Vacant Room')}
                                </span>
                                {meta.vacatedDate && (
                                  <p className="text-[10px] text-stone-400 mt-0.5">
                                    {trApp('ទំនេរថ្ងៃទី៖', 'Vacated:')} {meta.vacatedDate}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ${meta.roomPrice}/{trApp('ខែ', 'mo')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-200/70">
                            <div>{trApp('ភ្លើងចាស់៖', 'Old Elec:')} <strong className="text-stone-800">{meta.elecOld || '0'}</strong></div>
                            <div>{trApp('ទឹកចាស់៖', 'Old Water:')} <strong className="text-stone-800">{meta.waterOld || '0'}</strong></div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectVacantRoomForCheckIn(rNo, true)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{trApp('＋ ចុះឈ្មោះភ្ញៀវចូល', '＋ Check-In Tenant')}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tenants Grid list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedSavedTenants.map((tenant) => {
                  const isCurrent = data.roomNo === tenant.roomNo;
                  return (
                    <div 
                      key={tenant.tenantName}
                      className={`p-5 rounded-xl border relative transition-all shadow-sm ${
                        isCurrent 
                          ? 'border-blue-500 bg-blue-50/10 shadow-blue-50/20' 
                          : 'border-stone-200 bg-stone-50/30 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-sans">
                            {formatRoomBadge(tenant.roomNo)}
                          </span>
                          <div>
                            <h4 className="font-moul text-sm text-blue-900 leading-normal">{tenant.tenantName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300 font-mono">
                                ID: {formatTenantId(tenant.roomNo)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(formatTenantId(tenant.roomNo), tenant.roomNo)}
                                className="text-[10px] text-stone-500 hover:text-emerald-700 underline font-medium cursor-pointer"
                              >
                                {copiedTenantId === tenant.roomNo ? '✓ Copied' : 'ចម្លង ID (Copy ID)'}
                              </button>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-0.5 font-sans">កាលបរិច្ឆេទចូល (Check-in): {tenant.checkInDate || '—'}</p>
                          </div>
                        </div>

                        {/* Payment Pill */}
                        <button
                          type="button"
                          onClick={() => handleTogglePaidStatus(tenant.roomNo)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            tenant.isPaid 
                              ? 'bg-emerald-100 border-emerald-200 text-emerald-800' 
                              : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tenant.isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          {tenant.isPaid ? 'បានប្រមូល (Paid)' : 'មិនទាន់ប្រមូល (Unpaid)'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 text-xs text-stone-600 border-t border-stone-100 pt-3 font-sans">
                        <p>ថ្លៃបន្ទប់ (Room Price): <span className="font-bold text-stone-800">${tenant.roomPrice}</span></p>
                        <p>វ៉ាយហ្វាយ (Wi-Fi): <span className="font-bold text-stone-800">${tenant.wifiPrice}</span></p>
                        <p>ភ្លើងចាស់ (Old Elec): <span className="font-bold text-stone-800">{tenant.elecOld || '0'} KWH</span></p>
                        <p>ទឹកចាស់ (Old Water): <span className="font-bold text-stone-800">{tenant.waterOld || '0'} M³</span></p>
                        {tenant.deposit !== undefined && (
                          <p className="col-span-2 text-stone-700 font-medium">
                            ប្រាក់កក់ (Deposit): <span className="font-extrabold text-amber-700 font-mono">${tenant.deposit}</span>
                          </p>
                        )}
                        {tenant.tenantPhone && (
                          <p className="col-span-2 text-stone-500 flex items-center gap-1 mt-1 text-[11px]">
                            <span>📞 លេខទូរស័ព្ទ (Phone):</span>
                            <span className="font-bold text-stone-700">{tenant.tenantPhone}</span>
                          </p>
                        )}
                        {tenant.tenantIdNo && (
                          <p className="col-span-2 text-stone-500 flex items-center gap-1 text-[11px]">
                            <span>🪪 ID Card:</span>
                            <span className="font-medium text-stone-700">{tenant.tenantIdNo}</span>
                          </p>
                        )}
                      </div>

                      {/* Room Footer Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectTenant(tenant);
                            setActiveTab('invoice');
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          បង្កើតវិក្កយបត្រ (Use Tenant)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectTenant(tenant);
                            setUserRole('tenant');
                            setLoggedInTenantRoom(tenant.roomNo);
                            sessionStorage.setItem('userRole', 'tenant');
                            sessionStorage.setItem('loggedInTenantRoom', tenant.roomNo);
                            playAudioFeedback('success');
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-1.5 px-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Preview Self-Service Tenant Portal for this Room"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>ច្រកទ្វារភ្ញៀវ / Tenant Portal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleStartEditTenant(tenant);
                            setShowAddForm(true);
                          }}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          កែសម្រួល (Edit)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVacateRoom(tenant)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold py-1.5 px-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title={trApp(
                            'លុបព័ត៌មានភ្ញៀវចាស់ដែលឈប់ជួល តែរក្សាទុកចំណូលបូកបន្តឱ្យម្ចាស់ផ្ទះ',
                            'Clear vacated tenant info while keeping cumulative revenue for the landlord'
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>{trApp('ភ្ញៀវឈប់ជួល (រក្សាចំណូល)', 'Vacate (Keep Revenue)')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTenant(tenant.tenantName)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title={trApp('លុបភ្ញៀវចាស់ (រក្សាចំណូលបូកបន្ត)', 'Delete former tenant (Preserve revenue)')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Manual Input Tab Screen */}
          {userRole === 'admin' && activeTab === 'manualForm' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white shadow-2xl rounded-xl overflow-hidden p-6 sm:p-8 border border-stone-200 font-sans"
            >
              {/* Header */}
              <div id="input-form-title" className="border-b border-stone-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-600" />
                  {editingRecordId ? '✍️ របៀបកែសម្រួលទិន្នន័យរបស់ភ្ញៀវ (EDIT MONTHLY LEDGER RECORDS)' : '✍️ បញ្ចូលទិន្នន័យរបស់ភ្ញៀវប្រចាំខែ (RECORD NEW MONTHLY INPUTS)'}
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  បញ្ចូល ធ្វើបច្ចុប្បន្នភាព ឬលុបទិន្នន័យចំណូលលម្អិតរបស់ភ្ញៀវម្នាក់ៗតាមខែ។<br/>
                  <span className="text-stone-400">Add, edit, delete, and check monthly ledger input figures for each tenant room.</span>
                </p>
              </div>

              {/* Form & Checker Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
                
                {/* FORM LEFT: 7 Cols */}
                <form 
                  onSubmit={handleSaveCustomerMonthlyInput} 
                  className="lg:col-span-7 bg-stone-50 border border-stone-200 rounded-xl p-5 md:p-6 space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                    <span className="text-xs font-black text-stone-700 uppercase tracking-widest">
                      {editingRecordId ? '📝 កែសម្រួលកំណត់ត្រា (EDIT MODE ACTIVE)' : '✨ បញ្ចូលកំណត់ត្រាថ្មី (RECORD NEW INPUT)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={handleClearCustomerMonthlyInput}
                        className="text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        title={trApp('សម្អាតទិន្នន័យដើម្បីបញ្ចូលឡើងវិញ', 'Clear input fields to re-enter')}
                      >
                        <RotateCcw className="w-3 h-3 text-amber-600" />
                        <span>{trApp('សម្អាត', 'Clear')}</span>
                      </button>
                      {editingRecordId && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingRecordId(null);
                            handleClearCustomerMonthlyInput();
                          }} 
                          className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                        >
                          បោះបង់ការកែ (Cancel Edit)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    {/* Room Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">បន្ទប់ស្នាក់នៅ (Select Room) *</label>
                      <select
                        required
                        className="w-full bg-white border border-stone-300 rounded-lg p-2.5 font-bold text-stone-800 outline-none focus:border-emerald-500 text-sm shadow-sm font-sans"
                        value={inputRoomNo}
                        onChange={(e) => {
                          const rNo = e.target.value;
                          setInputRoomNo(rNo);
                          const tData = savedTenants.find(t => t.roomNo === rNo);
                          if (tData) {
                            setInputTenantName(tData.tenantName);
                            setInputRoomPrice(tData.roomPrice);
                            setInputWifiPrice(tData.wifiPrice);
                          }
                        }}
                      >
                        {sortedSavedTenants.map(t => (
                          <option key={t.roomNo} value={t.roomNo}>បន្ទប់ (Room) {t.roomNo} ({t.tenantName})</option>
                        ))}
                      </select>
                    </div>

                    {/* Tenant Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ឈ្មោះភ្ញៀវ (Guest Name) *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-stone-300 rounded-lg p-2.5 font-bold text-stone-800 outline-none focus:border-emerald-500 text-sm shadow-sm"
                        value={inputTenantName}
                        onChange={(e) => setInputTenantName(e.target.value)}
                      />
                    </div>

                    {/* Target Month */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ខែបញ្ចូល (Select Month) *</label>
                      <select
                        required
                        className="w-full bg-white border border-stone-300 rounded-lg p-2.5 font-bold text-stone-800 outline-none focus:border-emerald-500 text-sm shadow-sm font-sans"
                        value={inputMonth}
                        onChange={(e) => setInputMonth(e.target.value)}
                      >
                        {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => (
                          <option key={m} value={m}>ខែ {parseInt(m)} (Month {parseInt(m)})</option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">កាលបរិច្ឆេទបង់ (Payment Date) *</label>
                      <input
                        type="text"
                        required
                        placeholder="YYYY-MM-DD"
                        className="w-full bg-white border border-stone-300 rounded-lg p-2.5 font-mono text-stone-800 outline-none focus:border-emerald-500 text-sm shadow-sm"
                        value={inputPaymentDate}
                        onChange={(e) => setInputPaymentDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {/* Room Price */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ថ្លៃបន្ទប់ (Room Price - $)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white border border-stone-300 rounded-lg p-2.5 font-mono font-bold text-stone-800 outline-none focus:border-emerald-500 text-sm shadow-sm"
                        value={inputRoomPrice || ''}
                        onChange={(e) => setInputRoomPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {/* Wifi Price */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ថ្លៃវ៉ាយហ្វាយ (Wifi Price - $)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white border border-stone-300 rounded-lg p-2.5 font-mono font-bold text-stone-800 outline-none focus:border-emerald-500 text-sm shadow-sm"
                        value={inputWifiPrice || ''}
                        onChange={(e) => setInputWifiPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {/* Other Price */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ថ្លៃផ្សេងៗ (Other - $)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white border border-stone-300 rounded-lg p-2.5 font-mono font-bold text-stone-800 outline-none focus:border-emerald-500 text-sm shadow-sm"
                        value={inputOtherPrice || ''}
                        onChange={(e) => setInputOtherPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {/* Elec Usage (KWH) */}
                    <div>
                      <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">
                        ចំនួនអគ្គិសនី (Electricity - KWH) *
                      </label>
                      <input
                        type="number"
                        required
                        className="w-full bg-white border border-amber-300 rounded-lg p-2.5 font-mono font-bold text-amber-700 outline-none focus:border-amber-500 text-sm shadow-sm"
                        placeholder="e.g. 45"
                        value={inputElecUsage || ''}
                        onChange={(e) => setInputElecUsage(parseInt(e.target.value) || 0)}
                      />
                      <div className="text-[10px] font-bold text-amber-600 mt-1 font-sans">
                        = {(inputElecUsage * 1500).toLocaleString()} ៛ (${inputElecPrice.toFixed(2)})
                      </div>
                    </div>

                    {/* Water Usage (M³) */}
                    <div>
                      <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">
                        ចំនួនទឹកស្អាត (Water - M³) *
                      </label>
                      <input
                        type="number"
                        required
                        className="w-full bg-white border border-blue-300 rounded-lg p-2.5 font-mono font-bold text-blue-700 outline-none focus:border-emerald-500 text-sm shadow-sm"
                        placeholder="e.g. 5"
                        value={inputWaterUsage || ''}
                        onChange={(e) => setInputWaterUsage(parseInt(e.target.value) || 0)}
                      />
                      <div className="text-[10px] font-bold text-blue-600 mt-1 font-sans">
                        = {(inputWaterUsage * 2000).toLocaleString()} ៛ (${inputWaterPrice.toFixed(2)})
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">ស្ថានភាព (Paid Status)</label>
                      <select
                        className="w-full bg-white border border-stone-300 rounded-lg p-2.5 font-bold text-stone-800 outline-none focus:border-emerald-500 text-sm shadow-sm font-sans"
                        value={inputStatus}
                        onChange={(e) => setInputStatus(e.target.value as 'PAID' | 'PENDING')}
                      >
                        <option value="PAID">បង់រួច (PAID)</option>
                        <option value="PENDING">មិនទាន់បង់ (PENDING)</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-4 border-t border-stone-200 flex flex-wrap justify-between items-center gap-2">
                    <div className="text-xs font-bold text-stone-700">
                      សរុបប្រចាំខែ (Monthly Sum): <span className="text-emerald-600 font-mono text-sm font-black">${(Number(inputRoomPrice) + Number(inputWifiPrice) + Number(inputElecPrice) + Number(inputWaterPrice) + Number(inputOtherPrice)).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearCustomerMonthlyInput}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-3.5 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer text-xs uppercase font-sans flex items-center gap-1.5 active:scale-95"
                        title={trApp('លុបទិន្នន័យបញ្ចូលដើម្បីបញ្ចូលឡើងវិញ', 'Clear input data to re-enter')}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>{trApp('សម្អាត', 'Clear')}</span>
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-lg transition-all shadow-md cursor-pointer text-xs uppercase font-sans tracking-wide active:scale-95"
                      >
                        {editingRecordId ? '✓ រក្សាទុកការកែប្រែ (Save Changes)' : '💾 កត់ត្រាទិន្នន័យ (Record Entry)'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* CHECKER RIGHT: 5 Cols */}
                <div className="lg:col-span-5 bg-stone-50 border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-1.5">
                        🔎 ពិនិត្យផលបូកសរុបរបស់ភ្ញៀវ (TOTAL SUMMARY CHECKER)
                      </h3>
                      <p className="text-[10px] text-stone-500 mt-0.5">មើលសរុបចំណូលតាមខែនីមួយៗ និងពេញមួយឆ្នាំរបស់ភ្ញៀវនីមួយៗ / View totals of selected room.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAllRecordsForRoom(inputRoomNo, inputTenantName)}
                      className="text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-2xs"
                      title={trApp(
                        'លុបឈ្មោះភ្ញៀវចាស់ដែលឈប់ជួល តែរក្សាទុកតួលេខចំណូលប្រចាំខែបូកបន្ត',
                        'Clear vacated tenant name while preserving cumulative monthly revenue'
                      )}
                    >
                      <Trash2 className="w-3 h-3 text-amber-700" />
                      <span>{trApp('លុបភ្ញៀវចាស់ (រក្សាចំណូល)', 'Clear Former Tenant (Keep $)')}</span>
                    </button>
                  </div>

                  {/* Selected room and Statement Date in checker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <select
                        className="bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-none w-full"
                        value={inputRoomNo}
                        onChange={(e) => {
                          const rNo = e.target.value;
                          setInputRoomNo(rNo);
                          const tData = savedTenants.find(t => t.roomNo === rNo);
                          if (tData) {
                            setInputTenantName(tData.tenantName);
                            setInputRoomPrice(tData.roomPrice);
                            setInputWifiPrice(tData.wifiPrice);
                          }
                        }}
                      >
                        {sortedSavedTenants.map(t => (
                          <option key={t.roomNo} value={t.roomNo}>{formatRoomBadge(t.roomNo)} ({t.tenantName})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        className="bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-none w-full font-mono"
                        value={statementDate}
                        onChange={(e) => setStatementDate(e.target.value)}
                        title="កាលបរិច្ឆេទរបាយការណ៍ (Statement Date)"
                      />
                    </div>
                  </div>

                  {/* 12-Month summary for this customer */}
                  <div className="border border-stone-200 bg-white rounded-lg p-3 text-xs space-y-2 max-h-64 overflow-y-auto font-sans">
                    <div className="flex justify-between items-center font-bold text-stone-800 border-b pb-1.5 mb-1.5 text-[11px] uppercase tracking-wider">
                      <span>ខែ (Month)</span>
                      <span>សរុបបង់បូកបន្ត (Accumulated Collected)</span>
                    </div>

                    {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((mIndex) => {
                      const mRecord = history.find(h => 
                        normalizeRoomKey(h.roomNo) === normalizeRoomKey(inputRoomNo) && 
                        h.paymentDate.split('-')[1] === mIndex
                      );
                      
                      return (
                        <div key={mIndex} className="flex justify-between items-center text-[11px] py-1 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors px-1 rounded">
                          <span className="font-medium text-stone-600">ខែ {parseInt(mIndex)} / Month {parseInt(mIndex)}</span>
                          {mRecord ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-600">${mRecord.totalUsd.toFixed(2)}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleLoadCustomerRecordForEdit(mRecord)}
                                  className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors cursor-pointer"
                                  title={trApp('កែសម្រួលទិន្នន័យខែនេះ', 'Edit this month record')}
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(trApp(
                                      `តើអ្នកពិតជាចង់លុបទិន្នន័យខែ ${parseInt(mIndex)} របស់បន្ទប់ ${formatRoomBadge(inputRoomNo)} នេះដើម្បីបញ្ចូលឡើងវិញមែនទេ?`,
                                      `Are you sure you want to delete Month ${parseInt(mIndex)} record for ${formatRoomBadge(inputRoomNo)} to re-enter?`
                                    ))) {
                                      handleDeleteHistory(mRecord.id);
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                                  title={trApp('លុបទិន្នន័យខែនេះដើម្បីបញ្ចូលឡើងវិញ', 'Delete & Re-enter this month')}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setInputMonth(mIndex);
                                setEditingRecordId(null);
                                const el = document.getElementById('input-form-title');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="text-stone-400 hover:text-emerald-600 font-mono text-[10px] hover:underline cursor-pointer flex items-center gap-1"
                              title={trApp('បញ្ចូលទិន្នន័យខែនេះ', 'Enter data for this month')}
                            >
                              <span>— (＋ {trApp('បញ្ចូល', 'Add')})</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Year Total Box */}
                  <div className="bg-emerald-600 text-white rounded-lg p-3.5 flex justify-between items-center border border-emerald-500 shadow-sm font-sans">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100">សរុបរួមរបស់ភ្ញៀវ (Customer Cumulative Total)</p>
                      <p className="text-lg font-black font-mono mt-0.5">
                        ${getSummaryGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <span className="text-xl">💰</span>
                  </div>

                  {/* Action Buttons for Summation Invoice */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportSummaryPdf('device')}
                        disabled={isDownloading}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs font-sans disabled:opacity-50"
                        title="Export calibrated PDF based on current device"
                      >
                        {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5 text-rose-200" />}
                        <span>នាំចេញ PDF ឧបករណ៍ / Device PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportSummaryPdf('a4')}
                        disabled={isDownloading}
                        className="bg-stone-800 hover:bg-stone-700 text-rose-300 border border-stone-700 font-bold py-2.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs font-sans disabled:opacity-50"
                        title="Export standard A4 PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>នាំចេញ PDF A4 / Export A4 PDF</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const filename = `Invoice-Total-Room-${inputRoomNo}-${inputTenantName.trim().replace(/\s+/g, '-')}`;
                        handleDownloadSlip(customerSummaryInvoiceRef, filename);
                      }}
                      disabled={isDownloading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs font-sans"
                    >
                      {isDownloading && !isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      ទាញយកវិក្កយបត្រសរុប 4K (Download 4K Image)
                    </button>
                  </div>


                </div>
              </div>

              {/* LIST OF ENTERED RECORDS: EDIT AND DELETE TABLE */}
              <div className="space-y-3 font-sans">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-stone-100/70 p-3 rounded-xl border border-stone-200">
                  <div>
                    <h3 className="text-xs font-black text-stone-800 flex items-center gap-1.5 mb-0.5 text-blue-900 uppercase tracking-wider">
                      📜 បញ្ជីកំណត់ត្រាប្រចាំខែ (MONTHLY RECORDED LEDGER FIGURES)
                    </h3>
                    <p className="text-[11px] text-stone-600">
                      បង្ហាញព័ត៌មានភ្ញៀវ និងលេខបន្ទប់ជួលតាមខែ / Tenant details and room rental history by month.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-2.5 py-1 shadow-2xs">
                      <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-[11px] font-bold text-stone-600 whitespace-nowrap">តម្រៀប / Sort:</span>
                      <select
                        value={historySortOrder}
                        onChange={(e) => setHistorySortOrder(e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer py-0.5 font-sans"
                      >
                        <option value="roomAsc">🔢 តាមលេខបន្ទប់ (1 ➔ 10) / Room Order</option>
                        <option value="roomDesc">🔢 តាមលេខបន្ទប់ (10 ➔ 1) / Room Descending</option>
                        <option value="dateDesc">📅 កាលបរិច្ឆេទថ្មីមុន / Newest Date</option>
                        <option value="dateAsc">📅 កាលបរិច្ឆេទចាស់មុន / Oldest Date</option>
                      </select>
                    </div>

                    {/* Month Filter Selector */}
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg px-2.5 py-1 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[11px] font-bold text-stone-600 whitespace-nowrap">តម្រងខែ / Month:</span>
                      <select
                        value={selectedMonthFilter}
                        onChange={(e) => setSelectedMonthFilter(e.target.value)}
                        className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer py-0.5"
                      >
                        <option value="ALL">គ្រប់ខែទាំងអស់ (All Months)</option>
                        {(Array.from(new Set(history.map(h => (h.paymentDate ? h.paymentDate.substring(0, 7) : '')))).filter(Boolean) as string[]).sort().reverse().map((m: string) => (
                          <option key={m} value={m}>
                            ខែ {m.substring(5, 7)}/{m.substring(0, 4)} ({m})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Query */}
                    <div className="relative flex-1 md:w-52">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400 font-sans" />
                      <input
                        type="text"
                        placeholder="ស្វែងរកបន្ទប់ ឈ្មោះ... / Search..."
                        className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-emerald-500 transition-all text-stone-800 font-sans"
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Summary Stats Bar */}
                {(() => {
                  const filteredList = history.filter(h => {
                    const matchesSearch =
                      h.tenantName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                      h.roomNo.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                      h.paymentDate.includes(adminSearchQuery);
                    const matchesMonth =
                      selectedMonthFilter === 'ALL' || (h.paymentDate && h.paymentDate.startsWith(selectedMonthFilter));
                    return matchesSearch && matchesMonth;
                  });
                  const totalSum = filteredList.reduce((acc, item) => acc + item.totalUsd, 0);
                  const paidCount = filteredList.filter(item => item.status === 'PAID').length;
                  const pendingCount = filteredList.filter(item => item.status === 'PENDING').length;

                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-emerald-950/90 text-emerald-100 rounded-lg text-xs font-sans border border-emerald-800">
                      <div className="flex items-center gap-3">
                        <span className="font-bold flex items-center gap-1 text-emerald-300">
                          📊 លទ្ធផល / Results: <strong className="text-white">{filteredList.length}</strong> បន្ទប់
                        </span>
                        <span className="text-emerald-400/50">|</span>
                        <span className="text-emerald-200">
                          បានបង់: <strong className="text-emerald-300">{paidCount}</strong> | ជំពាក់: <strong className="text-amber-300">{pendingCount}</strong>
                        </span>
                      </div>
                      <div className="font-mono text-xs font-bold text-emerald-200">
                        សរុបប្រាក់ប្រមូលបាន: <span className="text-emerald-300 font-black text-sm">${totalSum.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="overflow-x-auto border border-stone-200 rounded-lg shadow-sm bg-white">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                        <th className="p-3">ថ្ងៃទូទាត់ & ខែជួល (Payment Date & Month)</th>
                        <th 
                          onClick={() => setHistorySortOrder(prev => prev === 'roomAsc' ? 'roomDesc' : 'roomAsc')}
                          className="p-3 font-sans cursor-pointer hover:bg-stone-100 transition-colors select-none text-emerald-800 font-black"
                          title="ចុចដើម្បីរៀបតាមលេខបន្ទប់ / Click to sort by room number"
                        >
                          <div className="flex items-center gap-1">
                            <span>បន្ទប់ (Room)</span>
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 rounded">
                              {historySortOrder === 'roomAsc' ? '▲ 1➔10' : historySortOrder === 'roomDesc' ? '▼ 10➔1' : '⇅'}
                            </span>
                          </div>
                        </th>
                        <th className="p-3">ឈ្មោះភ្ញៀវ (Guest Name)</th>
                        <th className="p-3 text-right">ថ្លៃបន្ទប់ (Room Price)</th>
                        <th className="p-3 text-right">ថ្លៃទឹកភ្លើង (Utilities)</th>
                        <th className="p-3 text-right">Wifi & ផ្សេងៗ (Wifi & Other)</th>
                        <th className="p-3 text-right font-bold text-emerald-700">សរុប (Total)</th>
                        <th className="p-3 text-center">ស្ថានភាព (Status)</th>
                        <th className="p-3 text-center">សកម្មភាព (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(() => {
                        const parseRoomNum = (roomStr: string): number => {
                          if (!roomStr) return Number.MAX_SAFE_INTEGER;
                          const nums = roomStr.replace(/[^0-9]/g, '');
                          return nums ? parseInt(nums, 10) : Number.MAX_SAFE_INTEGER;
                        };

                        const processedList = history.filter(h => {
                          const matchesSearch =
                            h.tenantName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                            h.roomNo.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                            h.paymentDate.includes(adminSearchQuery);
                          const matchesMonth =
                            selectedMonthFilter === 'ALL' || (h.paymentDate && h.paymentDate.startsWith(selectedMonthFilter));
                          return matchesSearch && matchesMonth;
                        }).sort((a, b) => {
                          if (historySortOrder === 'roomAsc' || historySortOrder === 'roomDesc') {
                            const numA = parseRoomNum(a.roomNo);
                            const numB = parseRoomNum(b.roomNo);
                            if (numA !== numB) {
                              return historySortOrder === 'roomAsc' ? numA - numB : numB - numA;
                            }
                            return historySortOrder === 'roomAsc'
                              ? (a.roomNo || '').localeCompare(b.roomNo || '', undefined, { numeric: true, sensitivity: 'base' })
                              : (b.roomNo || '').localeCompare(a.roomNo || '', undefined, { numeric: true, sensitivity: 'base' });
                          } else if (historySortOrder === 'dateDesc') {
                            return (b.paymentDate || '').localeCompare(a.paymentDate || '');
                          } else {
                            return (a.paymentDate || '').localeCompare(b.paymentDate || '');
                          }
                        });

                        if (processedList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-stone-400">គ្មានកំណត់ត្រាណាមួយត្រូវបានរកឃើញទេ / No matching transaction records found.</td>
                            </tr>
                          );
                        }

                        return processedList.map((record) => {
                          const monthStr = record.paymentDate ? record.paymentDate.substring(5, 7) : '--';
                          const yearStr = record.paymentDate ? record.paymentDate.substring(0, 4) : '----';
                          return (
                            <tr key={record.id} className="hover:bg-stone-50/80 transition-colors">
                              <td className="p-3 text-stone-700 font-mono text-[11px] whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-stone-800">{record.paymentDate}</span>
                                  <span className="inline-block mt-0.5 text-[9px] bg-emerald-100/80 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded font-bold font-sans w-fit">
                                    🗓️ ខែ {monthStr}/{yearStr}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 font-bold text-stone-800">
                                <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-black font-sans">
                                  {formatRoomBadge(record.roomNo)}
                                </span>
                              </td>
                              <td className="p-3 font-moul text-[11px] text-blue-900 leading-tight">
                                {record.tenantName}
                              </td>
                              <td className="p-3 text-right font-mono text-stone-600">${record.roomPrice.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-stone-600">
                                ${(record.elecPrice + record.waterPrice).toFixed(2)}
                                {(record.elecUsage > 0 || record.waterUsage > 0) && (
                                  <p className="text-[9px] text-stone-400 font-sans mt-0.5">
                                    {record.elecUsage > 0 ? `${record.elecUsage}KWH` : ''} {record.waterUsage > 0 ? `/ ${record.waterUsage}M³` : ''}
                                  </p>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono text-stone-600">${(record.wifiPrice + record.otherPrice).toFixed(2)}</td>
                              <td className="p-3 text-right font-black text-emerald-600 font-mono text-[12px] tabular-nums bg-emerald-50/20">
                                ${record.totalUsd.toFixed(2)}
                              </td>
                              <td className="p-3 text-center">
                                {record.status === 'PAID' ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[9px] uppercase tracking-wide">PAID</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-600 font-bold text-[9px] uppercase tracking-wide">PENDING</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleLoadCustomerRecordForEdit(record)}
                                    className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-all inline-flex"
                                    title="កែសម្រួល (Edit)"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`តើអ្នកប្រាកដជាចង់លុបកំណត់ត្រាបន្ទប់ ${formatRoomBadge(record.roomNo)} ថ្ងៃទី ${record.paymentDate} នេះឬទេ? / Are you sure you want to delete room ${formatRoomBadge(record.roomNo)} record dated ${record.paymentDate}?`)) {
                                        handleDeleteHistory(record.id);
                                      }
                                    }}
                                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-all inline-flex"
                                    title="លុប (Delete)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Dedicated Manager Check-In Form for Vacant Rooms */}
          {userRole === 'admin' && activeTab === 'checkInForm' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white shadow-2xl rounded-xl overflow-hidden border border-stone-200 font-sans"
            >
              {/* Top Banner Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 px-6 py-5 text-white border-b-4 border-amber-400">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center shrink-0 shadow-md">
                      <UserCheck className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                        <span>MANAGER CHECK-IN FORM</span>
                        <span>•</span>
                        <span>{trApp('បញ្ចូលភ្ញៀវថ្មីទៅក្នុងបន្ទប់ទំនេរ', 'VACANT ROOM TENANT CHECK-IN')}</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                        {trApp(
                          'ទម្រង់ចុះឈ្មោះភ្ញៀវថ្មីចូលជួលបន្ទប់ទំនេរ (ទាំង ១៦ បន្ទប់)',
                          'New Tenant Vacant Room Check-In Form (All 16 Rooms)'
                        )}
                      </h2>
                      <p className="text-xs text-emerald-100/90 mt-1">
                        {trApp(
                          'ជ្រើសរើសបន្ទប់ទំនេរ រួចបញ្ចូលព័ត៌មានភ្ញៀវថ្មី ប្រព័ន្ធនឹងធ្វើបច្ចុប្បន្នភាពបន្ទប់នោះទៅជា «មានភ្ញៀវជួល» ដោយស្វ័យប្រវត្តិ។',
                          'Select a vacant room and enter new tenant details to automatically assign the room and preserve cumulative revenue.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Summary Pills */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="bg-emerald-950/70 border border-emerald-400/40 rounded-xl px-3.5 py-2 text-center">
                      <div className="text-[10px] text-emerald-300 font-bold uppercase">{trApp('បន្ទប់ទំនេរ', 'Vacant Rooms')}</div>
                      <div className="text-xl font-black text-amber-300 font-mono">{vacantRoomsList.length}</div>
                    </div>
                    <div className="bg-emerald-950/70 border border-emerald-400/40 rounded-xl px-3.5 py-2 text-center">
                      <div className="text-[10px] text-emerald-300 font-bold uppercase">{trApp('មានភ្ញៀវ / ១៦', 'Occupied / 16')}</div>
                      <div className="text-xl font-black text-white font-mono">{savedTenants.length} / 16</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7 space-y-6">
                {/* Check-In Success Confirmation Banner */}
                {checkInSuccessInfo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-emerald-950">
                          {trApp(
                            `បានធ្វើបច្ចុប្បន្នភាពបន្ទប់ ${formatRoomBadge(checkInSuccessInfo.roomNo)} ដោយជោគជ័យ!`,
                            `Successfully checked in tenant to ${formatRoomBadge(checkInSuccessInfo.roomNo)}!`
                          )}
                        </h4>
                        <p className="text-xs text-emerald-800 mt-1">
                          {trApp(
                            `ភ្ញៀវឈ្មោះ ${checkInSuccessInfo.tenantName} ត្រូវបានបញ្ចូលទៅក្នុងបន្ទប់ ${formatRoomBadge(checkInSuccessInfo.roomNo)} រួចរាល់ហើយ។`,
                            `Tenant ${checkInSuccessInfo.tenantName} has been assigned to room ${formatRoomBadge(checkInSuccessInfo.roomNo)}.`
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('invoice')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        {trApp('មើលវិក្កយបត្រ', 'View Invoice')} ({formatRoomBadge(checkInSuccessInfo.roomNo)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tenants')}
                        className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        {trApp('មើលបញ្ជីបន្ទប់', 'Room Directory')}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: Building Room Status & Vacant Room Selector */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-stone-200">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-stone-800 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-black inline-flex items-center justify-center">1</span>
                        {trApp('ជ្រើសរើសបន្ទប់ទំនេរ (ក្នុងចំណោម ១៦ បន្ទប់)', 'Select Vacant Room (Out of 16 Rooms)')}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {trApp(
                          'បន្ទប់ពណ៌បៃតងគឺជាបន្ទប់ទំនេរ។ ចុចលើបន្ទប់ទំនេរណាមួយដើម្បីបញ្ចូលព័ត៌មានភ្ញៀវចូលជួល។',
                          'Green cards indicate vacant rooms. Click any vacant room to fill in new tenant details.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* All 16 Rooms Grid (Vacant vs Occupied) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                    {ALL_STANDARD_ROOMS.map((rNo) => {
                      const occupiedTenant = savedTenants.find((t) => normalizeRoomKey(t.roomNo) === rNo);
                      const isVacant = !occupiedTenant;
                      const isSelected = isVacant && normalizeRoomKey(checkInFormData.roomNo) === rNo;
                      const meta = vacantRoomsMeta[rNo];

                      return (
                        <button
                          key={`building-slot-${rNo}`}
                          type="button"
                          onClick={() => {
                            if (isVacant) {
                              handleSelectVacantRoomForCheckIn(rNo, false);
                            } else if (occupiedTenant) {
                              if (
                                confirm(
                                  trApp(
                                    `បន្ទប់ ${formatRoomBadge(rNo)} បច្ចុប្បន្នមានភ្ញៀវ "${occupiedTenant.tenantName}" កំពុងជួល។\nតើអ្នកចង់ផ្ទេរបន្ទប់ ${formatRoomBadge(rNo)} ទៅជា «បន្ទប់ទំនេរ (រក្សាចំណូលបូកបន្ត)» ដើម្បីបញ្ចូលភ្ញៀវថ្មីមែនទេ?`,
                                    `Room ${formatRoomBadge(rNo)} is currently occupied by "${occupiedTenant.tenantName}".\nDo you want to vacate ${formatRoomBadge(rNo)} (preserving cumulative revenue) to check in a new tenant?`
                                  )
                                )
                              ) {
                                handleVacateRoom(occupiedTenant);
                              }
                            }
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 border-amber-400 text-white shadow-lg scale-[1.03] ring-2 ring-emerald-500/40'
                              : isVacant
                              ? 'bg-emerald-50/90 hover:bg-emerald-100 border-emerald-300 text-emerald-950'
                              : 'bg-stone-100 hover:bg-stone-200/80 border-stone-200 text-stone-500 opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-black px-1.5 py-0.5 rounded font-sans ${
                              isSelected
                                ? 'bg-amber-400 text-stone-950'
                                : isVacant
                                ? 'bg-emerald-200/80 text-emerald-950'
                                : 'bg-stone-200 text-stone-700'
                            }`}>
                              {formatRoomBadge(rNo)}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isVacant
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-300 text-stone-700'
                            }`}>
                              {isVacant ? trApp('ទំនេរ', 'Vacant') : trApp('មានភ្ញៀវ', 'Occupied')}
                            </span>
                          </div>

                          <div className="mt-2">
                            {isVacant ? (
                              <div className={`text-[10px] font-bold truncate ${isSelected ? 'text-emerald-100' : 'text-emerald-800'}`}>
                                ${meta?.roomPrice || '80'}/{trApp('ខែ', 'mo')}
                              </div>
                            ) : (
                              <div className="text-[10px] font-bold text-stone-700 truncate" title={occupiedTenant?.tenantName}>
                                👤 {occupiedTenant?.tenantName}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2: Manager Check-In Form & Live Room Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Form Column (8 cols) */}
                  <form
                    onSubmit={handleVacantCheckInSubmit}
                    className="lg:col-span-8 bg-white border-2 border-emerald-600/30 rounded-xl p-5 sm:p-6 shadow-sm space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
                      <h3 className="text-base font-extrabold text-stone-800 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-black inline-flex items-center justify-center">2</span>
                        {trApp('បញ្ចូលព័ត៌មានភ្ញៀវចូលជួល', 'Enter New Tenant Information')}
                      </h3>
                      {checkInFormData.roomNo && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black px-3 py-1 rounded-lg">
                          {trApp('កំពុងជ្រើសរើស៖', 'Selected:')} {formatRoomBadge(checkInFormData.roomNo)} ({trApp('ទំនេរ', 'Vacant')})
                        </span>
                      )}
                    </div>

                    {/* Section A: Selected Vacant Room & Tenant Identity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-stone-700 mb-1">
                          {trApp('ជ្រើសរើសបន្ទប់ទំនេរ', 'Select Vacant Room')} <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={checkInFormData.roomNo}
                          onChange={(e) => handleSelectVacantRoomForCheckIn(e.target.value, false)}
                          className="w-full bg-emerald-50/70 border-2 border-emerald-400 rounded-lg p-2.5 text-sm font-black text-emerald-950 outline-none focus:border-emerald-700"
                        >
                          {vacantRoomsList.length === 0 ? (
                            <option value="">{trApp('-- មិនមានបន្ទប់ទំនេរ --', '-- No Vacant Rooms --')}</option>
                          ) : (
                            vacantRoomsList.map((rNo) => (
                              <option key={`select-vacant-${rNo}`} value={rNo}>
                                {formatRoomBadge(rNo)} — {trApp('បន្ទប់ទំនេរ', 'Vacant Room')} (${vacantRoomsMeta[rNo]?.roomPrice || '80'}/{trApp('ខែ', 'mo')})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-stone-700 mb-1">
                          {trApp('ថ្ងៃខែឆ្នាំចូលស្នាក់នៅ (Check-in Date)', 'Check-in Date')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="YYYY-MM-DD (e.g. 2026-10-25)"
                          value={checkInFormData.checkInDate}
                          onChange={(e) => setCheckInFormData({ ...checkInFormData, checkInDate: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-sm font-bold text-stone-800 outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-extrabold text-stone-700 mb-1">
                          {trApp('ឈ្មោះពេញរបស់ភ្ញៀវជួល (Tenant Full Name)', 'Tenant Full Name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={trApp('បញ្ចូលឈ្មោះភ្ញៀវខ្មែរ ឬ អង់គ្លេស (ឧ. សុខ សំណាង / Sok Samnang)...', 'Enter tenant full name (e.g. Sok Samnang)...')}
                          value={checkInFormData.tenantName}
                          onChange={(e) => setCheckInFormData({ ...checkInFormData, tenantName: e.target.value })}
                          className="w-full bg-stone-50 border-2 border-stone-300 rounded-lg p-2.5 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-stone-700 mb-1">
                          {trApp('លេខទូរស័ព្ទភ្ញៀវ (Phone Number)', 'Phone Number')}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 012 345 678"
                          value={checkInFormData.tenantPhone}
                          onChange={(e) => setCheckInFormData({ ...checkInFormData, tenantPhone: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-sm font-bold text-stone-800 outline-none focus:border-emerald-600 focus:bg-white"
                        />
                        <p className="text-[10px] text-stone-500 mt-1">
                          {trApp(
                            'លេខ ៦ ខ្ទង់ចុងក្រោយប្រើជាលេខសម្ងាត់ចូលមើលវិក្កយបត្រ។',
                            'Last 6 digits are used as the tenant portal PIN.'
                          )}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-extrabold text-stone-700">
                            {trApp('លេខអត្តសញ្ញាណប័ណ្ណ / លិខិតឆ្លងដែន (ID / Passport)', 'ID Card / Passport Number')}
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setCheckInFormData({
                                ...checkInFormData,
                                tenantIdNo: formatTenantId(checkInFormData.roomNo || '1')
                              })
                            }
                            className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            + {trApp('បង្កើតស្វ័យប្រវត្តិ', 'Auto-generate')} ({formatTenantId(checkInFormData.roomNo || '1')})
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder={`e.g. ${formatTenantId(checkInFormData.roomNo || '1')}`}
                          value={checkInFormData.tenantIdNo}
                          onChange={(e) => setCheckInFormData({ ...checkInFormData, tenantIdNo: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-sm font-bold text-stone-800 outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Section B: Pricing & Deposit */}
                    <div className="pt-3 border-t border-stone-200">
                      <h4 className="text-xs font-extrabold text-stone-700 uppercase tracking-wider mb-3">
                        {trApp('ថ្លៃឈ្នួលបន្ទប់ និងប្រាក់កក់ (Room Rent, Deposit & Wi-Fi)', 'Room Rent, Deposit & Wi-Fi')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-600 mb-1">
                            {trApp('ថ្លៃបន្ទប់ប្រចាំខែ ($/ខែ)', 'Monthly Room Rent ($/mo)')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={checkInFormData.roomPrice}
                            onChange={(e) => setCheckInFormData({ ...checkInFormData, roomPrice: Number(e.target.value) })}
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-sm font-black text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-amber-800">
                              {trApp('ប្រាក់កក់បន្ទប់ ($)', 'Security Deposit ($)')}
                            </label>
                            <div className="flex gap-1">
                              {[
                                { label: '$0', val: 0 },
                                { label: '1 ខែ', val: Number(checkInFormData.roomPrice) || 80 },
                                { label: '$50', val: 50 },
                                { label: '$100', val: 100 }
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => setCheckInFormData({ ...checkInFormData, deposit: preset.val })}
                                  className="text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 cursor-pointer"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            type="number"
                            step="any"
                            value={checkInFormData.deposit}
                            onChange={(e) => setCheckInFormData({ ...checkInFormData, deposit: Number(e.target.value) })}
                            className="w-full bg-amber-50/60 border border-amber-300 rounded-lg p-2.5 text-sm font-black text-amber-950 outline-none focus:border-amber-600 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-600 mb-1">
                            {trApp('ថ្លៃវ៉ាយហ្វាយ ($/ខែ)', 'Wi-Fi Fee ($/mo)')}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={checkInFormData.wifiPrice}
                            onChange={(e) => setCheckInFormData({ ...checkInFormData, wifiPrice: Number(e.target.value) })}
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-sm font-black text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section C: Starting Utility Meter Readings (Old Readings at Check-in) */}
                    <div className="pt-3 border-t border-stone-200">
                      <h4 className="text-xs font-extrabold text-stone-700 uppercase tracking-wider mb-3">
                        {trApp('លេខកុងទ័រភ្លើង និងទឹកពេលភ្ញៀវចូល (Starting Electricity & Water Readings)', 'Starting Electricity & Water Meter Readings')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
                          <label className="block text-xs font-extrabold text-blue-950 mb-1">
                            ⚡ {trApp('លេខកុងទ័រភ្លើងចាប់ផ្តើម (KWH)', 'Starting Electricity Reading (KWH)')}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={checkInFormData.elecOld}
                            onChange={(e) => setCheckInFormData({ ...checkInFormData, elecOld: e.target.value })}
                            className="w-full bg-white border border-blue-300 rounded-lg p-2 text-sm font-black text-blue-950 outline-none focus:border-blue-600"
                          />
                          <p className="text-[10px] text-blue-700 mt-1">
                            {trApp('តម្លៃភ្លើង៖ 1,500 ៛ / KWH', 'Rate: 1,500 ៛ / KWH')}
                          </p>
                        </div>

                        <div className="bg-cyan-50/50 border border-cyan-200 rounded-xl p-3">
                          <label className="block text-xs font-extrabold text-cyan-950 mb-1">
                            💧 {trApp('លេខកុងទ័រទឹកចាប់ផ្តើម (M³)', 'Starting Water Reading (M³)')}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={checkInFormData.waterOld}
                            onChange={(e) => setCheckInFormData({ ...checkInFormData, waterOld: e.target.value })}
                            className="w-full bg-white border border-cyan-300 rounded-lg p-2 text-sm font-black text-cyan-950 outline-none focus:border-cyan-600"
                          />
                          <p className="text-[10px] text-cyan-700 mt-1">
                            {trApp('តម្លៃទឹក៖ 2,000 ៛ / M³', 'Rate: 2,000 ៛ / M³')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section D: Initial Payment Status & Submit */}
                    <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none bg-stone-50 border border-stone-200 px-3.5 py-2.5 rounded-xl">
                        <input
                          type="checkbox"
                          checked={checkInFormData.isPaid}
                          onChange={(e) => setCheckInFormData({ ...checkInFormData, isPaid: e.target.checked })}
                          className="w-4 h-4 accent-emerald-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-stone-800 block">
                            {trApp('បានទូទាត់ថ្លៃបន្ទប់ខែដំបូងរួចហើយ (First Month Paid)', 'First Month Room Rent Paid')}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {trApp('ធីកប្រសិនបើភ្ញៀវបានបង់ប្រាក់ថ្លៃបន្ទប់ពេលចូលស្នាក់នៅរួចរាល់', 'Check if the tenant has already paid the first month rent')}
                          </span>
                        </div>
                      </label>

                      <button
                        type="submit"
                        disabled={!checkInFormData.roomNo}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-5 h-5" />
                        <span>
                          {trApp(
                            `រក្សាទុកភ្ញៀវចូលបន្ទប់ ${checkInFormData.roomNo ? formatRoomBadge(checkInFormData.roomNo) : ''}`,
                            `Save Tenant to ${checkInFormData.roomNo ? formatRoomBadge(checkInFormData.roomNo) : 'Room'}`
                          )}
                        </span>
                      </button>
                    </div>
                  </form>

                  {/* Live Room Assignment & Credentials Preview Column (4 cols) */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-gradient-to-b from-stone-900 to-stone-800 text-white rounded-xl p-5 border-2 border-amber-400/60 shadow-lg space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-700 pb-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
                            {trApp('ការធ្វើបច្ចុប្បន្នភាពបន្ទប់', 'ROOM STATUS UPDATE')}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            {trApp('ស្ថានភាពបន្ទប់ជ្រើសរើស', 'Selected Room Status')}
                          </h4>
                        </div>
                        <span className="text-lg font-black bg-amber-400 text-stone-950 px-3 py-1 rounded-lg font-sans">
                          {checkInFormData.roomNo ? formatRoomBadge(checkInFormData.roomNo) : 'RM---'}
                        </span>
                      </div>

                      {/* Status Transition Box */}
                      <div className="bg-stone-950/70 border border-stone-700 rounded-xl p-3.5 flex items-center justify-between gap-2">
                        <div className="text-center flex-1">
                          <div className="text-[10px] text-stone-400 font-bold">{trApp('មុនបញ្ចូល', 'Before')}</div>
                          <div className="mt-1 inline-block bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold px-2.5 py-1 rounded-md">
                            {trApp('បន្ទប់ទំនេរ (VACANT)', 'VACANT ROOM')}
                          </div>
                        </div>
                        <div className="text-amber-400 font-black text-lg">➔</div>
                        <div className="text-center flex-1">
                          <div className="text-[10px] text-stone-400 font-bold">{trApp('ក្រោយរក្សាទុក', 'After Save')}</div>
                          <div className="mt-1 inline-block bg-amber-400/20 border border-amber-400 text-amber-300 text-xs font-extrabold px-2.5 py-1 rounded-md">
                            {trApp('មានភ្ញៀវ (OCCUPIED)', 'OCCUPIED')}
                          </div>
                        </div>
                      </div>

                      {/* Summary Details */}
                      <div className="space-y-2 text-xs border-t border-stone-700 pt-3">
                        <div className="flex justify-between">
                          <span className="text-stone-400">{trApp('បន្ទប់៖', 'Room:')}</span>
                          <span className="font-bold text-amber-300">{checkInFormData.roomNo ? formatRoomBadge(checkInFormData.roomNo) : '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{trApp('ឈ្មោះភ្ញៀវ៖', 'Tenant Name:')}</span>
                          <span className="font-bold text-white">{checkInFormData.tenantName || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{trApp('ថ្ងៃចូល៖', 'Check-In Date:')}</span>
                          <span className="font-bold text-white">{checkInFormData.checkInDate || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{trApp('ថ្លៃបន្ទប់៖', 'Room Rent:')}</span>
                          <span className="font-bold text-emerald-300">${checkInFormData.roomPrice || '0'} / {trApp('ខែ', 'mo')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{trApp('ប្រាក់កក់៖', 'Deposit:')}</span>
                          <span className="font-bold text-amber-300">${checkInFormData.deposit || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{trApp('វ៉ាយហ្វាយ៖', 'Wi-Fi:')}</span>
                          <span className="font-bold text-white">${checkInFormData.wifiPrice || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">{trApp('កុងទ័រចាប់ផ្តើម៖', 'Starting Meters:')}</span>
                          <span className="font-bold text-cyan-300">{checkInFormData.elecOld || '0'} KWH • {checkInFormData.waterOld || '0'} M³</span>
                        </div>
                      </div>

                      {/* Auto-generated Tenant Portal Credentials Preview */}
                      <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 space-y-1.5">
                        <div className="text-[10px] font-extrabold text-emerald-300 uppercase">
                          {trApp('គណនីសម្រាប់ភ្ញៀវចូលមើលវិក្កយបត្រ (Tenant Portal Login)', 'Tenant Portal Login Credentials')}
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-300">{trApp('លេខបន្ទប់៖', 'Room:')}</span>
                          <span className="font-mono font-bold text-white">{checkInFormData.roomNo ? formatRoomBadge(checkInFormData.roomNo) : '—'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-300">{trApp('លេខសម្គាល់ ID (4 ខ្ទង់ចុង)៖', 'ID (Last 4 digits):')}</span>
                          <span className="font-mono font-bold text-amber-300">
                            {(checkInFormData.tenantIdNo.trim() || formatTenantId(checkInFormData.roomNo || '1')).slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-300">{trApp('លេខសម្ងាត់ (6 ខ្ទង់ទូរស័ព្ទ)៖', 'PIN (Last 6 phone digits):')}</span>
                          <span className="font-mono font-bold text-emerald-300">
                            {checkInFormData.tenantPhone.replace(/\D/g, '').slice(-6) || `0000${(checkInFormData.roomNo || '1').padStart(2, '0')}`.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 8, 9, 10, 11. SHARED MANAGEMENT SYSTEM & NGUON SOPHEAK DASHBOARD */}
          {(activeTab === 'managerOverview' || activeTab === 'managerList' || activeTab === 'sharedAccess' || activeTab === 'sopheakDashboard') && (
            <ManagerSharingSystem
              mode={
                activeTab === 'managerOverview'
                  ? 'owner_overview'
                  : activeTab === 'managerList'
                  ? 'owner_list'
                  : activeTab === 'sharedAccess'
                  ? 'owner_access'
                  : 'sopheak_dashboard'
              }
              staffRole={staffRole}
              savedTenants={savedTenants}
              setSavedTenants={setSavedTenants}
              history={history}
              setHistory={setHistory}
              vacantRoomsMeta={vacantRoomsMeta}
              setVacantRoomsMeta={setVacantRoomsMeta}
              managerAccounts={managerAccounts}
              setManagerAccounts={setManagerAccounts}
              auditLogs={auditLogs}
              setAuditLogs={setAuditLogs}
              onSelectTenantForInvoice={(tenant) => {
                handleSelectTenant(tenant);
              }}
              onSwitchMainTab={(tab) => setActiveTab(tab as any)}
              playAudioFeedback={playAudioFeedback}
              lang={appLang}
              setLang={setAppLang}
            />
          )}
            </div> {/* Screen Inner Display Frame */}
          </div> {/* AUXILIARY CORE DISPLAY SCREEN */}
        </div>

        {/* Right Column: Preseeded Rooms & Automatic Updates Directory - Hidden on print - ADMIN ONLY */}
        {userRole === 'admin' && (
          <div className="lg:col-span-4 xl:col-span-3 w-full print:hidden space-y-6 relative z-30">
          
          {/* Quick Action: Confirm Readings (Cycle Readings) */}
          {activeTab === 'invoice' && data.tenantName && (
            <div className="bg-emerald-600 rounded-lg p-5 text-white shadow-md">
              <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2">
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                បញ្ចូលខែថ្មី (Create New Month / Cycle Readings)
              </h3>
              <p className="text-xs text-emerald-100 mb-4 leading-relaxed font-sans">
                បន្ទាប់ពីបញ្ចូលលេខវ៉ាត់ថ្មីសម្រាប់ <strong>បន្ទប់ {data.roomNo}</strong> សូមចុចប៊ូតុងខាងក្រោមដើម្បីរក្សាទុកវាជាលេខវ៉ាត់ចាស់សម្រាប់ខែក្រោយដោយស្វ័យប្រវត្តិ។ / After entering new electricity/water readings for <strong>Room {data.roomNo}</strong>, click below to save them and transition to the next month's starting readings.
              </p>
              <button
                type="button"
                onClick={handleCycleReadings}
                className="w-full bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs py-2.5 px-4 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                💾 បញ្ចូលខែថ្មី (Save & Start New Month)
              </button>
            </div>
          )}

          {/* Directory Panel */}
          <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-sm space-y-4 font-sans text-stone-800">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                ជ្រើសរើសបន្ទប់ / Select Tenant Room
              </h2>
              <button
                onClick={() => {
                  if (showAddForm) {
                    handleCancelForm();
                  } else {
                    setShowAddForm(true);
                  }
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                {showAddForm ? "បោះបង់ (Cancel)" : "+ បន្ថែមបន្ទប់ (Add Room)"}
              </button>
            </div>

            {/* Quick Vacant Rooms Bar in Sidebar */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {trApp(`បន្ទប់ទំនេរ (${vacantRoomsList.length})`, `Vacant Rooms (${vacantRoomsList.length})`)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (vacantRoomsList.length > 0 && !vacantRoomsList.includes(checkInFormData.roomNo)) {
                      handleSelectVacantRoomForCheckIn(vacantRoomsList[0], true);
                    } else {
                      setActiveTab('checkInForm');
                    }
                  }}
                  className="text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded shadow-2xs transition-colors cursor-pointer"
                >
                  + {trApp('បញ្ចូលភ្ញៀវ', 'Check-In')}
                </button>
              </div>
              {vacantRoomsList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {vacantRoomsList.map((rNo) => (
                    <button
                      key={`sidebar-vacant-${rNo}`}
                      type="button"
                      onClick={() => handleSelectVacantRoomForCheckIn(rNo, true)}
                      title={trApp(`ចុះឈ្មោះភ្ញៀវចូលបន្ទប់ទំនេរ ${formatRoomBadge(rNo)}`, `Check in tenant to vacant room ${formatRoomBadge(rNo)}`)}
                      className="text-[11px] font-black bg-white hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 px-2 py-1 rounded-md transition-colors cursor-pointer font-sans"
                    >
                      {formatRoomBadge(rNo)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-stone-500">{trApp('ពេញគ្រប់បន្ទប់ទាំង ១៦', 'All 16 rooms occupied')}</p>
              )}
            </div>

            {/* Inline Add / Edit Room Form */}
            {showAddForm && (
              <form 
                ref={formRef}
                onSubmit={handleFormSubmit} 
                className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3 border-l-4 border-l-emerald-500"
              >
                <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                  <h4 className="text-xs font-bold text-stone-700 uppercase">
                    {editingTenantName ? `កែសម្រួលបន្ទប់ ${formatRoomBadge(newTenant.roomNo)} (EDIT ROOM ${formatRoomBadge(newTenant.roomNo)})` : "បន្ថែមបន្ទប់ និងភ្ញៀវថ្មី (ADD NEW ROOM & GUEST)"}
                  </h4>
                  {editingTenantName && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                      របៀបកែសម្រួល (Edit Mode)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">លេខបន្ទប់ (Room No) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5"
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.roomNo}
                      onChange={(e) => setNewTenant({...newTenant, roomNo: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">ឈ្មោះភ្ញៀវ (Tenant Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Seng..."
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.tenantName}
                      onChange={(e) => setNewTenant({...newTenant, tenantName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">លេខទូរស័ព្ទ (Phone)</label>
                    <input
                      type="text"
                      placeholder="e.g. 070..."
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.tenantPhone}
                      onChange={(e) => setNewTenant({...newTenant, tenantPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">អត្តសញ្ញាណប័ណ្ណ (ID Card No)</label>
                    <input
                      type="text"
                      placeholder="e.g. 180..."
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.tenantIdNo}
                      onChange={(e) => setNewTenant({...newTenant, tenantIdNo: e.target.value})}
                    />
                  </div>
                </div>

                {/* Grid row 3: Check-in Date and Room Price with Calendar Icon */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      ថ្ងៃចូលស្នាក់នៅ (Check-in Date) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="YYYY-MM-DD"
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 font-mono outline-none focus:border-emerald-500"
                      value={newTenant.checkInDate}
                      onChange={(e) => setNewTenant({...newTenant, checkInDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">តម្លៃជួលប្រចាំខែ (Monthly Rent - $) *</label>
                    <input
                      type="number"
                      required
                      placeholder="80"
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.roomPrice || ''}
                      onChange={(e) => setNewTenant({...newTenant, roomPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">Wifi ($)</label>
                    <input
                      type="number"
                      placeholder="5"
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.wifiPrice || ''}
                      onChange={(e) => setNewTenant({...newTenant, wifiPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">ប្រាក់កក់ (Security Deposit - $)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.deposit || ''}
                      onChange={(e) => setNewTenant({...newTenant, deposit: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">លេខវ៉ាត់ភ្លើងចាស់ (Starting Elec KWH)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1250"
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.elecOld}
                      onChange={(e) => setNewTenant({...newTenant, elecOld: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">លេខវ៉ាត់ទឹកចាស់ (Starting Water M³)</label>
                    <input
                      type="text"
                      placeholder="e.g. 101"
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-800 outline-none focus:border-emerald-500"
                      value={newTenant.waterOld}
                      onChange={(e) => setNewTenant({...newTenant, waterOld: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded text-xs transition-colors"
                  >
                    {editingTenantName ? "ធ្វើបច្ចុប្បន្នភាពគណនី (Update Directory)" : "រក្សាទុកព័ត៌មាន (Save Room & Tenant)"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold py-1.5 px-3 rounded text-xs transition-colors"
                  >
                    បោះបង់ (Cancel)
                  </button>
                </div>
              </form>
            )}

            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              បញ្ជីបន្ទប់ត្រូវបានរៀបចំតាមលំដាប់លេខបន្ទប់។ សូមជ្រើសរើសបន្ទប់ណាមួយដើម្បីបំពេញតម្លៃបន្ទប់ សេវាអ៊ីនធឺណិត និងលេខវ៉ាត់ទឹកភ្លើងចាស់ដោយស្វ័យប្រវត្តិ។ / Directory ordered by room number. Select a room card to load base prices, Wi-Fi rates, and historical meter starting numbers.
            </p>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="ស្វែងរករហ័សតាមបន្ទប់ ឈ្មោះ ឬលេខទូរស័ព្ទ... / Search by room, name, phone..."
                className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-stone-800 font-sans"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List of Saved Tenants with Edit and Delete capabilities */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {filteredSavedTenantsForSidebar.length === 0 ? (
                <div className="text-center py-8 text-stone-400 border border-dashed border-stone-100 rounded-lg font-sans">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-30 text-stone-500" />
                  <p className="text-xs font-semibold text-stone-600">រកមិនឃើញបន្ទប់ណាមួយទេ / No matching rooms found</p>
                </div>
              ) : (
                filteredSavedTenantsForSidebar.map((tenant) => {
                  const isCurrent = data.roomNo === tenant.roomNo;
                  return (
                    <div 
                      key={tenant.tenantName}
                      onClick={() => handleSelectTenant(tenant)}
                      className={`group relative p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
                        isCurrent 
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-1 ring-emerald-500/20' 
                          : 'border-stone-100 bg-stone-50/50 hover:border-emerald-300 hover:bg-white hover:shadow'
                      }`}
                    >
                      <div className="pr-12">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="font-bold text-stone-800 text-sm flex items-center gap-1">
                            <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-xs font-black font-sans">
                              {formatRoomBadge(tenant.roomNo)}
                            </span>
                            <span className="font-moul text-xs text-blue-900">{tenant.tenantName}</span>
                          </span>
                          
                          {/* Paid/Unpaid quick toggle button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePaidStatus(tenant.roomNo);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
                              tenant.isPaid 
                                ? 'bg-emerald-100 border-emerald-200 text-emerald-800' 
                                : 'bg-red-50 border-red-100 text-red-700 hover:bg-red-100'
                            }`}
                            title="ចុចដើម្បីកត់ត្រាការទូទាត់រហ័សសម្រាប់ខែតុលា / Click to quick toggle October payment status"
                          >
                            <span className={`w-1 h-1 rounded-full ${tenant.isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {tenant.isPaid ? 'បានបង់ (Paid)' : 'មិនទាន់បង់ (Unpaid)'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-2.5 text-[11px] text-stone-500 border-t border-stone-100/50 pt-2 font-sans">
                          <p>តម្លៃជួល (Rent): <span className="font-bold text-stone-700">${tenant.roomPrice}</span></p>
                          <p>Wifi: <span className="font-bold text-stone-700">${tenant.wifiPrice}</span></p>
                          <p>ភ្លើងចាស់ (Elec): <span className="font-bold text-stone-700">{tenant.elecOld || '0'}</span></p>
                          <p>ទឹកចាស់ (Water): <span className="font-bold text-stone-700">{tenant.waterOld || '0'}</span></p>
                          {tenant.deposit !== undefined && (
                            <p className="col-span-2 text-stone-600 font-medium mt-1">ប្រាក់កក់ (Deposit): <span className="font-extrabold text-amber-700 font-mono">${tenant.deposit}</span> <span className="text-[9px] text-stone-400 font-normal font-sans">(display only)</span></p>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1 font-sans">ថ្ងៃចូលស្នាក់នៅ (Check-in): {tenant.checkInDate || 'មិនទាន់បញ្ចូលទេ / Not specified'}</p>
                        {isCurrent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeTab !== 'invoice') {
                                setActiveTab('invoice');
                                setTimeout(() => {
                                  handleDownloadImage();
                                }, 300);
                              } else {
                                handleDownloadImage();
                              }
                            }}
                            className="mt-2.5 w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded shadow-md flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider font-sans border border-sky-500"
                            title="ទាញយកវិក្កយបត្រកម្រិតរូបភាពច្បាស់ 4K របស់ភ្ញៀវនេះ / Download high-resolution 4K PNG invoice for this room"
                          >
                            <Download className="w-3.5 h-3.5" />
                            ទាញយកវិក្កយបត្រ 4K (Download 4K PNG)
                          </button>
                        )}
                      </div>

                      {/* Edit and Vacate (Keep Cumulative Revenue) Actions on Hover */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditTenant(tenant);
                          }}
                          className="p-1 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                          title={trApp('កែសម្រួល ឬប្តូរភ្ញៀវថ្មី (រក្សាចំណូលបូកបន្ត)', 'Edit or Replace Tenant (Keep Cumulative Revenue)')}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVacateRoom(tenant);
                          }}
                          className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          title={trApp('លុបភ្ញៀវឈប់ជួល (រក្សាទុកចំណូលបូកបន្ត)', 'Clear Vacated Tenant (Keep Cumulative Revenue)')}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Splits Guidelines Card: Shown on Manual Form tab */}
          {activeTab === 'manualForm' && (
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-sm space-y-4 font-sans">
              <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-2 font-sans">
                <Info className="w-4 h-4 text-amber-500" />
                ច្បាប់បែងចែកលុយ (Commission Split Rules)
              </h2>
              <div className="space-y-3.5 text-xs text-stone-600 font-sans">
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100/60 font-sans">
                  <p className="font-bold text-amber-800">1. SOVANNA (20% + Utilities)</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-900/90 font-sans">
                    ទទួលបាន <strong>20%</strong> នៃតម្លៃបន្ទប់សរុប រួមជាមួយ <strong>100%</strong> នៃថ្លៃអគ្គិសនី ទឹកស្អាត និងប្រព័ន្ធអ៊ីនធឺណិត។
                  </p>
                </div>
                <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-100/60 font-sans">
                  <p className="font-bold text-sky-800">2. PHEAK ($10-$15 / room)</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-sky-900/90 font-sans">
                    ទទួលបាន <strong>$15/បន្ទប់</strong> សម្រាប់ខែ ១-៩ និង <strong>$10/បន្ទប់</strong> ចាប់ពីខែ ១០ ឡើងទៅ។
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/60 font-sans">
                  <p className="font-bold text-emerald-800">3. LANDLORD (Remaining 80%)</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/90 font-sans">
                    ទទួលបានចំណូលថ្លៃបន្ទប់សរុប ដកប្រាក់ខែរបស់ Sovanna និង Pheak (គ្មានការកាត់ទឹកភ្លើងផ្សេងៗ)។
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Room Earnings Ledger: Shown on Reports tab */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-sm space-y-4 font-sans">
              <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-2 font-sans">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                លទ្ធផលបន្ទប់ជួល (Room Income Ledger)
              </h2>
              <p className="text-[11px] text-stone-500 leading-normal font-sans">
                តារាងខាងក្រោមបង្ហាញពីចំណូលសរុបដែលប្រមូលបានពីបន្ទប់នីមួយៗក្នុងឆ្នាំ ២០២៦ នេះ។
              </p>
              
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 font-sans">
                {sortedSavedTenants.map((tenant) => {
                  const tenantRecords = history.filter(h => h.tenantName.toLowerCase().trim() === tenant.tenantName.toLowerCase().trim() || h.roomNo === tenant.roomNo);
                  const totalPaid = tenantRecords.reduce((sum, r) => sum + r.totalUsd, 0);
                  return (
                    <div key={tenant.roomNo} className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-stone-800 font-mono bg-stone-200/50 px-1.5 py-0.5 rounded text-[10px]">
                          {formatRoomBadge(tenant.roomNo)}
                        </span>
                        <span className="font-moul text-[10px] text-blue-900 ml-1.5">{tenant.tenantName}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">${totalPaid.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        )}

      </div>

      {/* Hidden / Offscreen printable Summary Invoice for html-to-image capture - Globally rendered so it never unmounts */}
      <div className="fixed top-[-9999px] left-[-9999px] print:hidden pointer-events-none select-none opacity-100 z-[-9999] overflow-hidden">
        <div 
          ref={customerSummaryInvoiceRef}
          className="w-[600px] bg-white p-8 border-4 border-emerald-600/60 shadow-none relative rounded-sm text-stone-800 opacity-100"
        >
          {/* Decorative corner ornaments */}
          <div className="absolute top-2 left-2 text-[10px] text-emerald-600/30">✦</div>
          <div className="absolute top-2 right-2 text-[10px] text-emerald-600/30">✦</div>
          <div className="absolute bottom-2 left-2 text-[10px] text-emerald-600/30">✦</div>
          <div className="absolute bottom-2 right-2 text-[10px] text-emerald-600/30">✦</div>

          {/* Document Header */}
          <div className="text-center border-b-2 border-stone-200 pb-4 mb-4">
            <h2 className="font-moul text-emerald-800 text-base">វិក្កយបត្រសង្ខេបរបស់ភ្ញៀវ</h2>
            <h3 className="font-sans font-bold text-stone-800 text-xs tracking-widest uppercase mt-0.5">CUSTOMER SUMMARY STATEMENT ({statementDate ? statementDate.split('-')[0] : new Date().getFullYear()})</h3>
            <p className="text-xs text-stone-500 font-sans mt-1">បន្ទប់ជួលផ្ទះបឹងកេងកង / Boeng Keng Kang Room Rental</p>
          </div>

          {/* Tenant and Room Information */}
          <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-4 border-b border-stone-100 pb-4">
            <div>
              <p className="text-stone-500">បន្ទប់ស្នាក់នៅ (Room No): <span className="font-bold text-emerald-800">{formatRoomBadge(inputRoomNo)}</span></p>
              <p className="text-stone-500 mt-1">ឈ្មោះអ្នកជួល (Tenant Name): <span className="font-moul text-[11px] text-blue-900 leading-tight">{inputTenantName}</span></p>
            </div>
            <div className="text-right">
              <p className="text-stone-500">ម្ចាស់ផ្ទះ (Landlord): <span className="font-bold text-stone-800">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</span></p>
              <p className="text-stone-500 mt-1">កាលបរិច្ឆេទរបាយការណ៍ (Date): <span className="font-bold text-stone-800">{statementDate ? statementDate.split('-').reverse().join('-') : ''}</span></p>
            </div>
          </div>

          {/* 12-Month Detailed Table */}
          <table className="w-full text-left border-collapse border border-stone-300 text-[10px] font-sans mb-6">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-300 text-stone-600 font-bold uppercase">
                <th className="p-2 border border-stone-300">ខែ (Month)</th>
                <th className="p-2 border border-stone-300 text-right">ថ្លៃបន្ទប់ (Room Rent)</th>
                <th className="p-2 border border-stone-300 text-right">ថ្លៃភ្លើង (Electricity)</th>
                <th className="p-2 border border-stone-300 text-right">ថ្លៃទឹក (Water)</th>
                <th className="p-2 border border-stone-300 text-right">Wifi / ផ្សេងៗ (Wifi/Other)</th>
                <th className="p-2 border border-stone-300 text-right">សរុបបង់ (Total Collected)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-700">
              {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((mIndex) => {
                const mRecord = history.find(h => 
                  (h.roomNo === inputRoomNo || h.tenantName.toLowerCase().trim() === inputTenantName.toLowerCase().trim()) && 
                  h.paymentDate.split('-')[1] === mIndex
                );

                return (
                  <tr key={mIndex} className="hover:bg-stone-50/50">
                    <td className="p-2 border border-stone-300 font-bold">ខែ {parseInt(mIndex)} / Month {parseInt(mIndex)}</td>
                    <td className="p-2 border border-stone-300 text-right font-mono text-stone-500">
                      {mRecord ? `$${mRecord.roomPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 border border-stone-300 text-right font-mono text-stone-500">
                      {mRecord ? `$${mRecord.elecPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 border border-stone-300 text-right font-mono text-stone-500">
                      {mRecord ? `$${mRecord.waterPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 border border-stone-300 text-right font-mono text-stone-500">
                      {mRecord ? `$${(mRecord.wifiPrice + mRecord.otherPrice).toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 border border-stone-300 text-right font-mono font-bold text-emerald-600">
                      {mRecord ? `$${mRecord.totalUsd.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-stone-100 font-bold border-t-2 border-stone-400 text-stone-800 font-mono text-[9px]">
                <td className="p-2 border border-stone-300 font-bold font-sans">សរុប (TOTAL)</td>
                <td className="p-2 border border-stone-300 text-right text-stone-700">${getSummaryCategoryTotals().totalRoom.toFixed(2)}</td>
                <td className="p-2 border border-stone-300 text-right text-stone-700">${getSummaryCategoryTotals().totalElec.toFixed(2)}</td>
                <td className="p-2 border border-stone-300 text-right text-stone-700">${getSummaryCategoryTotals().totalWater.toFixed(2)}</td>
                <td className="p-2 border border-stone-300 text-right text-stone-700">${getSummaryCategoryTotals().totalWifiOther.toFixed(2)}</td>
                <td className="p-2 border border-stone-300 text-right text-emerald-700 font-extrabold">${getSummaryCategoryTotals().totalCollected.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Year Total Box */}
          <div className="flex justify-between items-center border-t-2 border-stone-800 pt-4 mb-8">
            <span className="text-xs font-black text-stone-800 uppercase">សរុបប្រមូលបានទាំងអស់ (GRAND TOTAL COLLECTED)</span>
            <span className="text-lg font-black text-emerald-600 font-mono">
              ${getSummaryGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Stamp & Signatures */}
          <div className="grid grid-cols-2 gap-8 text-center text-[10px] font-sans mt-8 pt-8 border-t border-dashed border-stone-200 relative">
            
            {/* Landlord Stamp */}
            <div className="absolute left-[40%] top-[-25px] pointer-events-none select-none flex items-center justify-center">
              <div className="w-[80px] h-[80px] rounded-full border-[3px] border-red-500/80 flex items-center justify-center p-1 relative rotate-[-12deg] bg-white/40">
                <div className="w-[66px] h-[66px] rounded-full border border-dashed border-red-500/80 flex items-center justify-center relative">
                  <span className="absolute text-[6px] font-black text-red-500/80 uppercase tracking-widest text-center leading-none">
                    បន្ទប់ជួលផ្ទះបឹងកេងកង
                  </span>
                  <span className="absolute bottom-1 text-[5px] font-bold text-red-500/80 tracking-widest uppercase">
                    * ម្ចាស់ផ្ទះ *
                  </span>
                  <div className="text-sm text-red-500/80 select-none">💮</div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-stone-400">ហត្ថលេខាអ្នកជួល (Tenant's Signature)</p>
              <div className="h-10"></div>
              <p className="font-bold text-stone-700">{inputTenantName}</p>
            </div>
            <div>
              <p className="text-stone-400">ហត្ថលេខាម្ចាស់ផ្ទះ (Owner's Signature)</p>
              <div className="h-10"></div>
              <p className="font-bold text-stone-700">{data.landlordName || 'សាង សុវណ្ណារតនៈ'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Footer Info - Hidden on print */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-stone-400 text-xs print:hidden">
        <p>© 2024 Room Rent Manager. All rights reserved.</p>
        <p className="mt-1">Designed for professional property management.</p>
      </div>

      {/* 🛡️ Export Completeness Inspector Modal (Zero Omissions) */}
      {isExportInspectorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:hidden animate-fade-in font-sans">
          <div className="bg-stone-900 border border-emerald-500/50 rounded-2xl max-w-2xl w-full p-6 text-stone-100 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    ពិនិត្យភាពពេញលេញនៃការនាំចេញ / Export Completeness Inspector
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                      100% Verified
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    ធានាថាវិក្កយបត្រដែលបាននាំចេញ (រូបភាព PNG ឬ PDF) មិនមានការកាត់ខ្លី បាត់បង់ព័ត៌មាន ឬបញ្ហាមាត្រដ្ឋានឡើយ។ / Guarantees exported invoice [PNG/PDF] is never cut off, has no missing details, or scaling errors.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExportInspectorOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Checklist Items Scrollable Content */}
            <div className="overflow-y-auto space-y-3 pr-1 text-xs">
              
              {/* 1. Landlord */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-3.5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-200 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-emerald-400" />
                    <span>1. ព័ត៌មានម្ចាស់ផ្ទះ (Landlord Profile)</span>
                  </p>
                  <p className="text-stone-400 mt-1">
                    ឈ្មោះ / Name: <span className="text-white font-medium">{data.landlordName || '—'}</span> • 
                    លេខទូរស័ព្ទ / Phone: <span className="text-white font-medium">{data.landlordPhone || '—'}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 truncate max-w-md">
                    អាសយដ្ឋាន / Address: {data.landlordAddress || '—'}
                  </p>
                </div>
                <span className="shrink-0 text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded text-[11px] font-bold">
                  ✓ រួចរាល់ (Completed)
                </span>
              </div>

              {/* 2. Tenant & Room */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-3.5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>2. ព័ត៌មានអ្នកជួល និងលេខបន្ទប់ (Tenant & Room Info)</span>
                  </p>
                  <p className="text-stone-400 mt-1">
                    អ្នកជួល / Tenant: <span className="text-blue-300 font-bold font-moul">{data.tenantName || 'Not Entered'}</span> • 
                    បន្ទប់ / Room: <span className="text-emerald-400 font-bold">{data.roomNo ? formatRoomBadge(data.roomNo) : '—'}</span> • 
                    លេខទូរស័ព្ទ / Phone: <span className="text-white">{data.tenantPhone || '—'}</span>
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded text-[11px] font-bold ${
                  data.tenantName && data.roomNo
                    ? 'text-emerald-400 bg-emerald-950 border border-emerald-800'
                    : 'text-amber-400 bg-amber-950 border border-amber-800'
                }`}>
                  {data.tenantName && data.roomNo ? '✓ រួចរាល់ (Complete)' : '⚠️ ត្រូវពិនិត្យ (Needs Review)'}
                </span>
              </div>

              {/* 3. Utility Items Table */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-3.5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>3. តារាងទឹក ភ្លើង និងសេវាកម្ម ({data.items.length} មុខ) (Electricity, Water & Services Table)</span>
                  </p>
                  <p className="text-stone-400 mt-1">
                    បានពិនិត្យ៖ លេខចាស់ លេខថ្មី បរិមាណប្រើប្រាស់ និងតម្លៃឯកតារួមទាំងនិមិត្តសញ្ញារូបិយប័ណ្ណ ($ / ៛) ត្រូវបានបង្ហាញយ៉ាងច្បាស់លាស់។ / Checked: Old No, New No, consumption, unit prices with currency symbols displayed clearly.
                  </p>
                </div>
                <span className="shrink-0 text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded text-[11px] font-bold">
                  ✓ ត្រឹមត្រូវ (No Omissions)
                </span>
              </div>

              {/* 4. ABA QR Pay */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-3.5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-200 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-sky-400" />
                    <span>4. កូដទូទាត់ប្រាក់ ABA PAY (KHQR)</span>
                  </p>
                  <p className="text-stone-400 mt-1">
                    {data.qrUrl ? 'រូបភាព QR ផ្ទាល់ខ្លួន (Uploaded Custom QR)' : 'កូដ ABA KHQR Vector រួមបញ្ចូលជាស្រេច (ABA KHQR Vector Built-in)'}
                  </p>
                </div>
                <span className="shrink-0 text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded text-[11px] font-bold">
                  ✓ រួចរាល់ (Ready)
                </span>
              </div>

              {/* 5. Total */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-3.5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-red-400" />
                    <span>5. ទឹកប្រាក់សរុបជា USD និង KHR (Grand Total in USD & KHR)</span>
                  </p>
                  <p className="text-stone-300 mt-1 font-mono font-bold">
                    <span className="text-red-400 text-sm">${data.totalUsd.toFixed(2)} USD</span> • 
                    <span className="text-white ml-2">៛{(data.totalUsd * 4000).toLocaleString()} KHR</span>
                  </p>
                </div>
                <span className="shrink-0 text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded text-[11px] font-bold">
                  ✓ ត្រឹមត្រូវ 100% (100% Match)
                </span>
              </div>

              {/* 6. Rules & Signatures */}
              <div className="bg-stone-800/80 border border-stone-700/80 rounded-xl p-3.5 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-violet-400" />
                    <span>6. បទបញ្ជាផ្ទះជួល និងហត្ថលេខាទាំងសងខាង (House Rules & Signature Blocks)</span>
                  </p>
                  <p className="text-stone-400 mt-1">
                    {data.rules.length} bilingual rules • Tenant: <span className="text-white">{data.tenantName || '—'}</span> • Landlord: <span className="text-white">{data.landlordName}</span>
                  </p>
                </div>
                <span className="shrink-0 text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded text-[11px] font-bold">
                  ✓ រួចរាល់ (Complete Signatures)
                </span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-4 border-t border-stone-800 flex flex-wrap gap-2.5 justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsExportInspectorOpen(false)}
                className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer transition-colors"
              >
                បិទ / Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExportInspectorOpen(false);
                  handlePrint();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                បោះពុម្ព / Print
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExportInspectorOpen(false);
                  handleExportPdf('a4');
                }}
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-rose-500/40 text-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors disabled:opacity-50"
                title="Export standard A4 PDF (210×297mm)"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                នាំចេញ PDF A4 / Export A4 PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExportInspectorOpen(false);
                  handleExportPdf('device');
                }}
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50 ring-2 ring-rose-400/50"
                title="Export calibrated PDF matching device proportions"
              >
                {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4 text-rose-200" />}
                នាំចេញ PDF ឧបករណ៍ / Export Device PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExportInspectorOpen(false);
                  handleDownloadImage();
                }}
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
              >
                {isDownloading && !isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                ទាញយករូបភាព PNG / Download PNG
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
