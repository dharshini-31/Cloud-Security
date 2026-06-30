import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, LayoutDashboard, Cloud, ShieldAlert, Users, 
  FileText, Settings, Play, RefreshCw, Plus, 
  Trash2, CheckCircle, XCircle, 
  ArrowRight, Download, Search, Database, ExternalLink,
  ChevronRight, X, ShieldCheck
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  mockDashboardData,
  mockCloudAccounts,
  mockScans,
  mockFindings,
  mockReports
} from './mockData';
import type {
  User,
  CloudAccount,
  Scan,
  Finding,
  DashboardData,
  Report
} from './types';

// API Configuration
const API_BASE = 'http://localhost:8000/api';

// Simple API Helper with auto-fallback to mock data if backend is offline
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('vapt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || 'Request failed');
    }
    
    // For file download responses
    if (options.method === 'GET' && endpoint.includes('/download/')) {
      return response;
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`API error on ${endpoint}. Check if Django backend is running:`, error);
    throw error;
  }
};

// Types are imported from './types' above

export default function App() {
  const [page, setPage] = useState<string>('Dashboard');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Auth state
  const [usernameInput, setUsernameInput] = useState('demo');
  const [passwordInput, setPasswordInput] = useState('demo');
  const [authError, setAuthError] = useState('');

  // Domain states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [cloudAccounts, setCloudAccounts] = useState<CloudAccount[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Modals & detail panels
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  
  // Add Account form fields
  const [newAccName, setNewAccName] = useState('');
  const [newAccKey, setNewAccKey] = useState('');
  const [newAccSecret, setNewAccSecret] = useState('');
  const [newAccRegion, setNewAccRegion] = useState('us-east-1');
  const [accountActionLoading, setAccountActionLoading] = useState<number | null>(null);

  // Filters
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Report Form state
  const [reportScanId, setReportScanId] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv' | 'xlsx'>('pdf');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Connection check message
  const [connMessage, setConnMessage] = useState<{ id: number; text: string; success: boolean } | null>(null);

  // Polling ref for running scans
  const pollingRef = useRef<number | null>(null);

  // Check login on load
  useEffect(() => {
    const savedUser = localStorage.getItem('vapt_user');
    const savedToken = localStorage.getItem('vapt_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch Page Data whenever page changes or demo mode switches
  useEffect(() => {
    if (!user) return;
    fetchData();

    // Start polling if we are on Dashboard or Scans page, to update active running scans
    if (page === 'Dashboard' || page === 'Scans') {
      startScanPolling();
    } else {
      stopScanPolling();
    }

    return () => stopScanPolling();
  }, [page, user, isDemoMode]);

  const startScanPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = window.setInterval(async () => {
      try {
        const latestScans = await apiCall('/scans/');
        setScans(latestScans);
        // If there was a scan that just finished, reload dashboard data
        const hasRunning = latestScans.some((s: Scan) => s.status === 'running' || s.status === 'queued');
        if (!hasRunning) {
          const dash = await apiCall('/dashboard/');
          setDashboardData(dash);
        }
      } catch (err) {
        // Quietly fail during polling
      }
    }, 4000);
  };

  const stopScanPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Main Data fetch router
  const fetchData = async () => {
    try {
      // 1. Fetch Dashboard data
      const dash = await apiCall('/dashboard/');
      setDashboardData(dash);
      
      // 2. Fetch Accounts
      const accs = await apiCall('/accounts/');
      setCloudAccounts(accs);

      // 3. Fetch Scans
      const scanList = await apiCall('/scans/');
      setScans(scanList);

      // 4. Fetch Findings
      const findingList = await apiCall('/findings/');
      setFindings(findingList);

      // 5. Fetch Reports
      const reportList = await apiCall('/reports/');
      setReports(reportList);

      setIsDemoMode(false);
    } catch (error) {
      console.warn("Switching to Local Simulated Demo Mode (offline backend)...");
      setIsDemoMode(true);
      loadMockData();
    }
  };

  // Mock data loader for when Django server is not reachable
  const loadMockData = () => {
    setDashboardData(mockDashboardData);
    setCloudAccounts(mockCloudAccounts);
    setScans(mockScans);
    setFindings(mockFindings);
    setReports(mockReports);
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await apiCall('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      localStorage.setItem('vapt_token', data.token);
      localStorage.setItem('vapt_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err: any) {
      // Automatically use demo mode if backend is not available
      // Any username/password works in demo mode
      const mockUser = { 
        username: usernameInput || 'demo', 
        email: `${usernameInput || 'demo'}@example.com`, 
        first_name: usernameInput || 'Demo User' 
      };
      localStorage.setItem('vapt_token', 'mock-token');
      localStorage.setItem('vapt_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsDemoMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vapt_token');
    localStorage.removeItem('vapt_user');
    setUser(null);
    stopScanPolling();
  };

  // Account Operations
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccKey || !newAccSecret) return;

    const body = {
      name: newAccName,
      access_key: newAccKey,
      secret_key: newAccSecret,
      region: newAccRegion
    };

    try {
      if (isDemoMode) {
        const newAcc: CloudAccount = {
          id: Date.now(),
          name: newAccName,
          access_key: newAccKey.substring(0, 4) + '****************',
          region: newAccRegion,
          status: 'connected',
          last_scan: null,
          created_at: new Date().toISOString()
        };
        setCloudAccounts([newAcc, ...cloudAccounts]);
      } else {
        await apiCall('/accounts/', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        fetchData();
      }
      
      // Reset
      setNewAccName('');
      setNewAccKey('');
      setNewAccSecret('');
      setNewAccRegion('us-east-1');
      setShowAddAccount(false);
    } catch (err: any) {
      alert(err.message || 'Failed to connect account');
    }
  };

  const handleTestConnection = async (id: number) => {
    setAccountActionLoading(id);
    setConnMessage(null);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 600));
        setConnMessage({ id, text: 'Connection Successful! Validated IAM Access Key.', success: true });
      } else {
        const res = await apiCall(`/accounts/${id}/test_connection/`, { method: 'POST' });
        setConnMessage({ id, text: res.message || 'Connected successfully!', success: true });
        fetchData();
      }
    } catch (err: any) {
      setConnMessage({ id, text: err.message || 'Connection check failed.', success: false });
    } finally {
      setAccountActionLoading(null);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this cloud account? All associated findings and scans will be deleted.')) return;
    try {
      if (isDemoMode) {
        setCloudAccounts(cloudAccounts.filter(a => a.id !== id));
      } else {
        await apiCall(`/accounts/${id}/`, { method: 'DELETE' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  // Scan Actions
  const handleTriggerScan = async (accountId: number, scanType: string = 'combined') => {
    try {
      if (isDemoMode) {
        const newScanId = Date.now();
        const acc = cloudAccounts.find(a => a.id === accountId);
        const newScan: Scan = {
          id: newScanId,
          name: `Quick Assessment - ${acc?.name || 'AWS'}`,
          cloud_account: accountId,
          cloud_account_name: acc?.name || 'AWS',
          cloud_provider: 'AWS',
          scan_type: scanType as any,
          status: 'running',
          findings_count: 0,
          overall_score: 100,
          created_at: new Date().toISOString(),
          completed_at: null
        };
        setScans([newScan, ...scans]);
        setPage('Scans');

        // Simulate finishing after 4 seconds
        setTimeout(() => {
          setScans(prevScans => prevScans.map(s => {
            if (s.id === newScanId) {
              return {
                ...s,
                status: 'completed',
                findings_count: 4,
                overall_score: 78,
                completed_at: new Date().toISOString(),
                result: {
                  id: Date.now(),
                  overall_score: 78,
                  critical_count: 1,
                  high_count: 1,
                  medium_count: 2,
                  low_count: 0,
                  total_buckets: 3,
                  public_buckets: 1,
                  private_buckets: 2,
                  critical_buckets: 1,
                  total_iam_users: 4,
                  users_without_mfa: 1,
                  admin_users: 1,
                  inactive_users: 0,
                  high_risk_users: 1
                }
              };
            }
            return s;
          }));

          // Append mock findings for this new scan
          const newMockFindings: Finding[] = [
            {
              id: Date.now(), scan: newScanId, scan_name: newScan.name, cloud_account: accountId, cloud_account_name: acc?.name || 'AWS',
              service: 'S3', severity: 'critical', status: 'open', finding_type: 'storage',
              title: 'Publicly exposing database credentials in S3 config logs',
              description: 'The bucket config-logs contains an object db_backup.sql that has hardcoded passwords.',
              bucket_name: 'config-logs', region: acc?.region || 'us-east-1', exposure_type: 'Anonymous Read Access',
              evidence: 's3://config-logs/db_backup.sql: PASSWORD="rootpassword123"',
              remediation: 'Immediately remove config logs or encrypt details with KMS.',
              references: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
              created_at: new Date().toISOString()
            }
          ];
          setFindings(prev => [...newMockFindings, ...prev]);
        }, 4000);

      } else {
        await apiCall(`/accounts/${accountId}/run_scan/`, {
          method: 'POST',
          body: JSON.stringify({ scan_type: scanType })
        });
        setPage('Scans');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start scan');
    }
  };

  const handleRescan = async (scanId: number) => {
    try {
      if (isDemoMode) {
        const scan = scans.find(s => s.id === scanId);
        if (scan) {
          handleTriggerScan(scan.cloud_account, scan.scan_type);
        }
      } else {
        await apiCall(`/scans/${scanId}/rescan/`, { method: 'POST' });
        setPage('Scans');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Rescan failed');
    }
  };

  const handleCancelScan = async (scanId: number) => {
    try {
      if (isDemoMode) {
        setScans(scans.map(s => s.id === scanId ? { ...s, status: 'failed' } : s));
      } else {
        await apiCall(`/scans/${scanId}/cancel_scan/`, { method: 'POST' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const handleDeleteScan = async (scanId: number) => {
    if (!confirm('Are you sure you want to delete this scan and all its findings?')) return;
    try {
      if (isDemoMode) {
        setScans(scans.filter(s => s.id !== scanId));
        setFindings(findings.filter(f => f.scan !== scanId));
      } else {
        await apiCall(`/scans/${scanId}/`, { method: 'DELETE' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  // Findings Status Workflow
  const handleUpdateFindingStatus = async (findingId: number, newStatus: string) => {
    try {
      if (isDemoMode) {
        setFindings(findings.map(f => f.id === findingId ? { ...f, status: newStatus as any } : f));
        if (selectedFinding && selectedFinding.id === findingId) {
          setSelectedFinding({ ...selectedFinding, status: newStatus as any });
        }
      } else {
        const updated = await apiCall(`/findings/${findingId}/update_status/`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
        setFindings(findings.map(f => f.id === findingId ? updated : f));
        if (selectedFinding && selectedFinding.id === findingId) {
          setSelectedFinding(updated);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // Report Operations
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportScanId) return;
    setGeneratingReport(true);

    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1200));
        const scan = scans.find(s => s.id === Number(reportScanId));
        const newReport: Report = {
          id: Date.now(),
          scan: Number(reportScanId),
          scan_name: scan?.name || 'Assessment Scan',
          cloud_account_name: scan?.cloud_account_name || 'AWS Env',
          format: reportFormat,
          report_file: null,
          report_file_url: '#',
          created_at: new Date().toISOString()
        };
        setReports([newReport, ...reports]);
      } else {
        await apiCall('/reports/', {
          method: 'POST',
          body: JSON.stringify({ scan: reportScanId, format: reportFormat })
        });
        fetchData();
      }
      setReportScanId('');
    } catch (err: any) {
      alert(err.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadReport = async (report: Report) => {
    if (isDemoMode) {
      alert('Mock download completed successfully. Report compiled in ' + report.format.toUpperCase() + ' format.');
      return;
    }

    try {
      const response = await apiCall(`/reports/${report.id}/download/`, { method: 'GET' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_scan_${report.scan}.${report.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Failed to download file: ' + err.message);
    }
  };

  // Filter & Search Logic
  const filteredFindings = findings.filter(f => {
    const matchesAccount = selectedAccountFilter === 'all' || f.cloud_account.toString() === selectedAccountFilter;
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesService = serviceFilter === 'all' || f.service === serviceFilter;
    
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      f.title.toLowerCase().includes(term) ||
      f.description.toLowerCase().includes(term) ||
      (f.bucket_name && f.bucket_name.toLowerCase().includes(term)) ||
      (f.affected_user && f.affected_user.toLowerCase().includes(term));

    return matchesAccount && matchesSeverity && matchesStatus && matchesService && matchesSearch;
  });

  // Severity order for sorting
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  // Deduplicate findings by title + cloud_account
  const dedupFindings = (findings: Finding[]) => {
    const seen = new Set<string>();
    return findings.filter(f => {
      const key = `${f.title.toLowerCase()}|${f.cloud_account}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Sorted & deduped findings for Findings page
  const sortedFindings = dedupFindings(filteredFindings).sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // S3/Storage findings sorted by severity, deduped
  const storageFindings = dedupFindings(filteredFindings.filter(f => f.finding_type === 'storage')).sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  // IAM findings sorted by severity, deduped
  const iamFindings = dedupFindings(filteredFindings.filter(f => f.finding_type === 'iam')).sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Login screen
  if (!user) {
    return (
      <div className="login-container">
        <form className="login-card fade-in" onSubmit={handleLogin}>
          <div className="login-logo">
            <Shield className="logo-icon" size={32} />
            <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 800 }}>NiceDash <span style={{ color: 'var(--primary)', fontSize: '14px', verticalAlign: 'super' }}>VAPT</span></h1>
          </div>
          <h2 className="login-title">Sign In</h2>
          <p className="login-subtitle">Cloud Security Assessment Platform</p>
          
          {authError && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={16} />
              {authError}
            </div>
          )}

          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--primary)' }}>Demo Credentials:</p>
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>Username: <strong>demo</strong></p>
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>Password: <strong>demo</strong></p>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. demo"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
            Get Started
            <ArrowRight size={16} />
          </button>

          <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Sandbox Demo: Enter any username/password or use the credentials above.
          </p>
        </form>
      </div>
    );
  }

  // Dashboard calculations
  const totalFindings = dashboardData?.findings_summary 
    ? (dashboardData.findings_summary.critical + dashboardData.findings_summary.high + dashboardData.findings_summary.medium + dashboardData.findings_summary.low)
    : 0;

  const scoreCircumference = 2 * Math.PI * 38; // 238.76
  const scoreDashoffset = scoreCircumference - ((dashboardData?.security_score || 100) / 100) * scoreCircumference;

  // Chart data format
  const trendChartData = dashboardData?.findings_trend?.labels.map((lbl, idx) => ({
    name: lbl,
    Critical: dashboardData.findings_trend.critical[idx],
    High: dashboardData.findings_trend.high[idx],
    Medium: dashboardData.findings_trend.medium[idx],
  })) || [];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <Shield className="logo-icon" size={28} />
          <span className="logo-text">NiceDash <span style={{ color: 'var(--primary)', fontSize: '10px', verticalAlign: 'super' }}>VAPT</span></span>
        </div>

        {isDemoMode && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            <Database size={14} />
            Demo Mode (Offline)
          </div>
        )}

        <nav className="nav-menu">
          <div className={`nav-item ${page === 'Dashboard' ? 'active' : ''}`} onClick={() => setPage('Dashboard')}>
            <LayoutDashboard size={18} />
            Dashboard
          </div>
          <div className={`nav-item ${page === 'CloudAccounts' ? 'active' : ''}`} onClick={() => setPage('CloudAccounts')}>
            <Cloud size={18} />
            Cloud Accounts
          </div>
          <div className={`nav-item ${page === 'PublicStorage' ? 'active' : ''}`} onClick={() => setPage('PublicStorage')}>
            <ShieldAlert size={18} />
            Public Storage (S3)
          </div>
          <div className={`nav-item ${page === 'IAMSecurity' ? 'active' : ''}`} onClick={() => setPage('IAMSecurity')}>
            <Users size={18} />
            IAM Security
          </div>
          <div className={`nav-item ${page === 'Findings' ? 'active' : ''}`} onClick={() => setPage('Findings')}>
            <ShieldAlert size={18} />
            Findings Repo
          </div>
          <div className={`nav-item ${page === 'Scans' ? 'active' : ''}`} onClick={() => setPage('Scans')}>
            <RefreshCw size={18} />
            Scan Management
          </div>
          <div className={`nav-item ${page === 'Reports' ? 'active' : ''}`} onClick={() => setPage('Reports')}>
            <FileText size={18} />
            Reports
          </div>
          <div className={`nav-item ${page === 'Settings' ? 'active' : ''}`} onClick={() => setPage('Settings')}>
            <Settings size={18} />
            Settings
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">
            {user.first_name.substring(0, 1).toUpperCase()}
          </div>
          <div className="user-info" style={{ flex: 1 }}>
            <span className="user-name">{user.first_name}</span>
            <span className="user-role">SecOps Engineer</span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="header-bar">
          <div>
            <h1 className="page-title">{page}</h1>
            <p className="page-subtitle">
              {page === 'Dashboard' && 'Continuous cloud security monitoring overview'}
              {page === 'CloudAccounts' && 'Connect and test credentials for cloud hosts'}
              {page === 'PublicStorage' && 'Public S3 bucket access & policy vulnerability tracker'}
              {page === 'IAMSecurity' && 'Identity governance & permission privilege audit'}
              {page === 'Findings' && 'Search and audit all discovered environment weaknesses'}
              {page === 'Scans' && 'Run and review ScoutSuite & Prowler background assessments'}
              {page === 'Reports' && 'Compile PDF summaries, Excel spreadsheets and CSV exports'}
              {page === 'Settings' && 'Manage user profiles and connection parameters'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {cloudAccounts.length > 0 && (
              <button className="btn btn-primary" onClick={() => handleTriggerScan(cloudAccounts[0].id)}>
                <Play size={16} />
                Quick Scan
              </button>
            )}
            <button className="btn btn-secondary" onClick={fetchData} title="Refresh Data">
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* -------------------- PAGES RENDERING -------------------- */}

        {/* 1. DASHBOARD PAGE */}
        {page === 'Dashboard' && (
          <div className="fade-in">
            {/* Top Grid: Metrics */}
            <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
              <div className="card metric-card">
                <div className="metric-header">
                  <span>Security Score</span>
                  <div className="metric-icon-bg"><ShieldCheck size={16} className="logo-icon" /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="metric-value">{dashboardData?.security_score ?? 100}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/100</span>
                </div>
                <span className={`badge badge-${dashboardData?.risk_level.toLowerCase()}`} style={{ alignSelf: 'flex-start', marginTop: '12px' }}>
                  {dashboardData?.risk_level} Risk
                </span>
              </div>

              <div className="card metric-card">
                <div className="metric-header">
                  <span>Open Findings</span>
                  <div className="metric-icon-bg"><ShieldAlert size={16} /></div>
                </div>
                <span className="metric-value">{totalFindings}</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--critical)' }}>Crit: {dashboardData?.findings_summary.critical || 0}</span>
                  <span style={{ color: 'var(--danger)' }}>High: {dashboardData?.findings_summary.high || 0}</span>
                  <span style={{ color: 'var(--warning)' }}>Med: {dashboardData?.findings_summary.medium || 0}</span>
                </div>
              </div>

              <div className="card metric-card">
                <div className="metric-header">
                  <span>Cloud Assets</span>
                  <div className="metric-icon-bg"><Cloud size={16} /></div>
                </div>
                <span className="metric-value">{dashboardData?.assets_summary.total_buckets || 0}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
                  Across {dashboardData?.assets_summary.total_accounts || 0} Accounts
                </span>
              </div>

              <div className="card metric-card">
                <div className="metric-header">
                  <span>IAM Users</span>
                  <div className="metric-icon-bg"><Users size={16} /></div>
                </div>
                <span className="metric-value">{dashboardData?.assets_summary.total_iam_users || 0}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
                  {dashboardData?.assets_summary.total_iam_roles || 0} Roles / {dashboardData?.assets_summary.total_iam_policies || 0} Policies
                </span>
              </div>
            </div>

            {/* Split layout: Score & Trend */}
            <div className="grid-main">
              {/* Left Column: Security Score Circle & Trend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Findings Trend (Historical Scans)</h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                        <Legend />
                        <Line type="monotone" dataKey="Critical" stroke="var(--critical)" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="High" stroke="var(--danger)" strokeWidth={2.5} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Medium" stroke="var(--warning)" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Recent Scan History</h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Scan Name</th>
                          <th>Account</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Score</th>
                          <th>Findings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scans.slice(0, 4).map(scan => (
                          <tr key={scan.id}>
                            <td style={{ fontWeight: 600 }}>{scan.name}</td>
                            <td>{scan.cloud_account_name}</td>
                            <td>{new Date(scan.created_at).toLocaleString()}</td>
                            <td>
                              <span className={`badge badge-${scan.status === 'completed' ? 'success' : scan.status === 'running' ? 'info' : 'danger'}`}>
                                {scan.status}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: scan.overall_score >= 85 ? 'var(--primary)' : scan.overall_score >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                              {scan.overall_score}/100
                            </td>
                            <td>{scan.findings_count} findings</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Score Breakdown & Asset widgets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-secondary)' }}>Security Posture</h3>
                  
                  <div className="score-circle-container">
                    <svg className="score-circle-svg">
                      <circle className="score-circle-bg" cx="50" cy="50" r="38" />
                      <circle 
                        className="score-circle-fill" 
                        cx="50" 
                        cy="50" 
                        r="38" 
                        strokeDasharray={scoreCircumference}
                        strokeDashoffset={scoreDashoffset}
                        style={{ stroke: (dashboardData?.security_score || 100) >= 85 ? 'var(--primary)' : (dashboardData?.security_score || 100) >= 60 ? 'var(--warning)' : 'var(--danger)' }}
                      />
                    </svg>
                    <div className="score-circle-text">{dashboardData?.security_score || 100}%</div>
                  </div>

                  <span className="page-title" style={{ fontSize: '20px', marginTop: '20px' }}>
                    {(dashboardData?.security_score || 100) >= 85 ? 'Secure Posture' : (dashboardData?.security_score || 100) >= 60 ? 'Attention Needed' : 'Critical Risks!'}
                  </span>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '8px' }}>
                    {(dashboardData?.security_score || 100) >= 85 
                      ? 'Environment follows security best practices closely. Maintain posture scans.' 
                      : (dashboardData?.security_score || 100) >= 60 
                        ? 'Minor policy violations and unencrypted storage configs found. Repair vulnerabilities.' 
                        : 'Unencrypted S3 write parameters and MFA disabled administrators active. Immediate fix required!'}
                  </p>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Vulnerabilities List</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(147, 51, 234, 0.08)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#C084FC' }}>Critical Severity</span>
                      <span style={{ fontWeight: 700 }}>{dashboardData?.findings_summary.critical || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#F87171' }}>High Severity</span>
                      <span style={{ fontWeight: 700 }}>{dashboardData?.findings_summary.high || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#FBBF24' }}>Medium Severity</span>
                      <span style={{ fontWeight: 700 }}>{dashboardData?.findings_summary.medium || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#60A5FA' }}>Low Severity</span>
                      <span style={{ fontWeight: 700 }}>{dashboardData?.findings_summary.low || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CLOUD ACCOUNTS PAGE */}
        {page === 'CloudAccounts' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <button className="btn btn-primary" onClick={() => setShowAddAccount(true)}>
                <Plus size={16} />
                Connect AWS Account
              </button>
            </div>

            {/* List of Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cloudAccounts.map(account => (
                <div key={account.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--primary)' }}>
                      <Cloud size={32} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{account.name}</h3>
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
                        <span>Region: <b>{account.region}</b></span>
                        <span>Access Key: <code>{account.access_key}</code></span>
                        <span>Connected: {new Date(account.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right', marginRight: '16px' }}>
                      <span className={`badge badge-${account.status === 'connected' ? 'success' : 'danger'}`} style={{ display: 'inline-block' }}>
                        {account.status}
                      </span>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Last Scan: {account.last_scan ? new Date(account.last_scan).toLocaleString() : 'Never'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleTestConnection(account.id)}
                        disabled={accountActionLoading === account.id}
                      >
                        {accountActionLoading === account.id && <span className="spinner" />}
                        Test Connection
                      </button>
                      <button className="btn btn-primary" onClick={() => handleTriggerScan(account.id)}>
                        <Play size={14} />
                        Run Assessment
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '10px', color: 'var(--danger)' }} onClick={() => handleDeleteAccount(account.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {cloudAccounts.length === 0 && (
                <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Cloud size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: '16px', fontWeight: 600 }}>No Connected Cloud Accounts</p>
                  <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text-muted)' }}>Get started by connecting your AWS environment credentials.</p>
                </div>
              )}
            </div>

            {/* Connection Test Popups */}
            {connMessage && (
              <div style={{ 
                position: 'fixed', bottom: '24px', right: '24px', 
                backgroundColor: connMessage.success ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
                color: 'white', padding: '14px 20px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 1000
              }}>
                {connMessage.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{connMessage.text}</span>
                <X size={18} style={{ cursor: 'pointer', marginLeft: '12px' }} onClick={() => setConnMessage(null)} />
              </div>
            )}

            {/* Connect Modal */}
            {showAddAccount && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3 className="modal-title">Connect AWS Environment</h3>
                    <X className="modal-close" onClick={() => setShowAddAccount(false)} />
                  </div>
                  <form onSubmit={handleAddAccount}>
                    <div className="form-group">
                      <label className="form-label">AWS Account Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. AWS-Production-Store"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">AWS Access Key ID</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="AKIA..."
                        value={newAccKey}
                        onChange={(e) => setNewAccKey(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">AWS Secret Key</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                        value={newAccSecret}
                        onChange={(e) => setNewAccSecret(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Default Region</label>
                      <select 
                        className="form-select"
                        value={newAccRegion}
                        onChange={(e) => setNewAccRegion(e.target.value)}
                      >
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-east-2">US East (Ohio)</option>
                        <option value="us-west-1">US West (N. California)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                        <option value="eu-west-1">Europe (Ireland)</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowAddAccount(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Connect Account
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. PUBLIC STORAGE S3 PAGE */}
        {page === 'PublicStorage' && (
          <div className="fade-in">
            {/* S3 Dashboard Metrics */}
            <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
              <div className="card metric-card">
                <div className="metric-header">
                  <span>Total Buckets Checked</span>
                </div>
                <span className="metric-value">
                  {scans.find(s => s.status === 'completed')?.result?.total_buckets || 3}
                </span>
              </div>
              <div className="card metric-card" style={{ borderLeft: '3px solid var(--danger)' }}>
                <div className="metric-header">
                  <span style={{ color: 'var(--danger)' }}>Publicly Exposed</span>
                </div>
                <span className="metric-value" style={{ color: 'var(--danger)' }}>
                  {scans.find(s => s.status === 'completed')?.result?.public_buckets || 2}
                </span>
              </div>
              <div className="card metric-card" style={{ borderLeft: '3px solid var(--primary)' }}>
                <div className="metric-header">
                  <span>Private Buckets</span>
                </div>
                <span className="metric-value">
                  {scans.find(s => s.status === 'completed')?.result?.private_buckets || 1}
                </span>
              </div>
              <div className="card metric-card" style={{ borderLeft: '3px solid var(--critical)' }}>
                <div className="metric-header">
                  <span style={{ color: 'var(--critical)' }}>Critical Misconfigs</span>
                </div>
                <span className="metric-value" style={{ color: 'var(--critical)' }}>
                  {scans.find(s => s.status === 'completed')?.result?.critical_buckets || 2}
                </span>
              </div>
            </div>

            {/* Storage Findings Table */}
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>S3 Bucket Exposures (ScoutSuite Audit)</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Bucket Name</th>
                      <th>Region</th>
                      <th>Exposure Type</th>
                      <th>Severity</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageFindings.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 600 }}>{f.bucket_name}</td>
                        <td><code>{f.region}</code></td>
                        <td><span style={{ color: 'var(--text-primary)' }}>{f.exposure_type}</span></td>
                        <td>
                          <span className={`badge badge-${f.severity}`}>
                            {f.severity.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedFinding(f)}>
                            View Detail
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {storageFindings.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No S3 vulnerabilities detected matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. IAM SECURITY PAGE */}
        {page === 'IAMSecurity' && (
          <div className="fade-in">
            {/* IAM Metrics */}
            <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
              <div className="card metric-card">
                <div className="metric-header">
                  <span>Total Users Checked</span>
                </div>
                <span className="metric-value">
                  {scans.find(s => s.status === 'completed')?.result?.total_iam_users || 5}
                </span>
              </div>
              <div className="card metric-card" style={{ borderLeft: '3px solid var(--danger)' }}>
                <div className="metric-header">
                  <span style={{ color: 'var(--danger)' }}>MFA Disabled Users</span>
                </div>
                <span className="metric-value" style={{ color: 'var(--danger)' }}>
                  {scans.find(s => s.status === 'completed')?.result?.users_without_mfa || 2}
                </span>
              </div>
              <div className="card metric-card" style={{ borderLeft: '3px solid var(--warning)' }}>
                <div className="metric-header">
                  <span>Admin Users</span>
                </div>
                <span className="metric-value">
                  {scans.find(s => s.status === 'completed')?.result?.admin_users || 2}
                </span>
              </div>
              <div className="card metric-card" style={{ borderLeft: '3px solid var(--critical)' }}>
                <div className="metric-header">
                  <span style={{ color: 'var(--critical)' }}>High Risk Profiles</span>
                </div>
                <span className="metric-value" style={{ color: 'var(--critical)' }}>
                  {scans.find(s => s.status === 'completed')?.result?.high_risk_users || 3}
                </span>
              </div>
            </div>

            {/* IAM Findings Table */}
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>IAM Vulnerabilities (Prowler Audit)</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User / Role Principal</th>
                      <th>Finding / Check Detail</th>
                      <th>Severity</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iamFindings.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 600 }}><code>{f.affected_user}</code></td>
                        <td>{f.issue || f.title}</td>
                        <td>
                          <span className={`badge badge-${f.severity}`}>
                            {f.severity.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedFinding(f)}>
                            View Detail
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {iamFindings.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No IAM vulnerabilities detected matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. FINDINGS PAGE */}
        {page === 'Findings' && (
          <div className="fade-in">
            {/* Filters Bar */}
            <div className="card filter-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%', border: 'none', backgroundColor: 'transparent', padding: '4px' }}
                  placeholder="Search S3 Buckets, IAM users, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <select 
                  className="form-select"
                  value={selectedAccountFilter}
                  onChange={(e) => setSelectedAccountFilter(e.target.value)}
                >
                  <option value="all">All Accounts</option>
                  {cloudAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                <select 
                  className="form-select"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="accepted_risk">Accepted Risk</option>
                  <option value="false_positive">False Positive</option>
                </select>

                <select 
                  className="form-select"
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  <option value="all">All Services</option>
                  <option value="S3">S3 Storage</option>
                  <option value="IAM">IAM Security</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Vulnerabilities List ({sortedFindings.length} found)</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Environment</th>
                      <th>Service</th>
                      <th>Finding</th>
                      <th>Severity</th>
                      <th>Discovered</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFindings.map(f => (
                      <tr key={f.id}>
                        <td><b>{f.cloud_account_name}</b></td>
                        <td><code>{f.service}</code></td>
                        <td>{f.title}</td>
                        <td>
                          <span className={`badge badge-${f.severity}`}>
                            {f.severity.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(f.created_at || Date.now()).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedFinding(f)}>
                            Detail
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedFindings.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No vulnerabilities found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. SCAN MANAGEMENT PAGE */}
        {page === 'Scans' && (
          <div className="fade-in">
            {/* Start a Combined Scan directly */}
            {cloudAccounts.length > 0 && (
              <div className="card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Run Security Audit</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Select an account and trigger an assessment run in the background worker.</p>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const accId = (e.target as any).account.value;
                    const type = (e.target as any).type.value;
                    handleTriggerScan(Number(accId), type);
                  }}
                  style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                >
                  <select name="account" className="form-select">
                    {cloudAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select name="type" className="form-select">
                    <option value="combined">Combined Audit (ScoutSuite + Prowler)</option>
                    <option value="scoutsuite">ScoutSuite Audit (S3 Storage Only)</option>
                    <option value="prowler">Prowler Audit (IAM Credentials Only)</option>
                  </select>
                  <button type="submit" className="btn btn-primary">
                    <Play size={16} />
                    Trigger Scan
                  </button>
                </form>
              </div>
            )}

            {/* List of Scans */}
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Scan Executions</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Assessment Job</th>
                      <th>Account Target</th>
                      <th>Engine Type</th>
                      <th>Started At</th>
                      <th>Status</th>
                      <th>Vulnerabilities</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map(scan => (
                      <tr key={scan.id}>
                        <td style={{ fontWeight: 600 }}>{scan.name}</td>
                        <td>{scan.cloud_account_name}</td>
                        <td><code>{scan.scan_type.toUpperCase()}</code></td>
                        <td>{new Date(scan.created_at).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${scan.status === 'completed' ? 'success' : scan.status === 'running' ? 'info' : scan.status === 'queued' ? 'warning' : 'danger'}`}>
                            {scan.status}
                          </span>
                        </td>
                        <td>
                          {scan.status === 'completed' ? (
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{scan.findings_count} findings</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>--</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleRescan(scan.id)}>
                            Rescan
                          </button>
                          {(scan.status === 'running' || scan.status === 'queued') && (
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)' }} onClick={() => handleCancelScan(scan.id)}>
                              Cancel
                            </button>
                          )}
                          <button className="btn btn-secondary" style={{ padding: '6px 10px', color: 'var(--danger)' }} onClick={() => handleDeleteScan(scan.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {scans.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No scans executed yet. Connect an account and run your first assessment!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. REPORTS PAGE */}
        {page === 'Reports' && (
          <div className="fade-in">
            <div className="grid-main">
              {/* Left Column: Generate form */}
              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Compile Compliance Report</h3>
                <form onSubmit={handleGenerateReport}>
                  <div className="form-group">
                    <label className="form-label">Select Audit Scan</label>
                    <select 
                      className="form-select"
                      value={reportScanId}
                      onChange={(e) => setReportScanId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Completed Scan --</option>
                      {scans.filter(s => s.status === 'completed').map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({new Date(s.created_at).toLocaleDateString()})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Export Format</label>
                    <select 
                      className="form-select"
                      value={reportFormat}
                      onChange={(e) => setReportFormat(e.target.value as any)}
                    >
                      <option value="pdf">PDF Report (Executive Summary & Details)</option>
                      <option value="xlsx">Excel Spreadsheet (Multi-sheet Table data)</option>
                      <option value="csv">CSV Export (Plain Comma Separated data)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={generatingReport}>
                    {generatingReport ? (
                      <>
                        <span className="spinner" />
                        Generating Files...
                      </>
                    ) : (
                      <>
                        <FileText size={16} />
                        Build & Save Report
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: List of generated reports */}
              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Generated Reports List</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reports.map(rep => (
                    <div key={rep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge badge-${rep.format === 'pdf' ? 'success' : rep.format === 'xlsx' ? 'info' : 'warning'}`}>
                            {rep.format.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{rep.scan_name}</span>
                        </div>
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {rep.cloud_account_name} | {new Date(rep.created_at).toLocaleString()}
                        </span>
                      </div>

                      <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => handleDownloadReport(rep)}>
                        <Download size={14} />
                        Download
                      </button>
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No reports generated yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. SETTINGS PAGE */}
        {page === 'Settings' && (
          <div className="fade-in">
            <div className="grid-cols-2">
              {/* User profile details */}
              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Operator Profile</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                  <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
                    {user.first_name.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{user.first_name}</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{user.email}</p>
                    <span className="badge badge-success" style={{ marginTop: '8px' }}>Administrator Access</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Role Title</label>
                  <input type="text" className="form-input" value="Cloud Security Engineer" disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Organizational Unit</label>
                  <input type="text" className="form-input" value="SecOps Infrastructure Security" disabled />
                </div>
              </div>

              {/* Assessment engine credentials parameters */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Integration Configurations</h3>
                
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>ScoutSuite Engine Settings</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Used for discovering publicly exposed storage resources (S3, bucket policy parameters).</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <input type="text" className="form-input" style={{ flex: 1, fontSize: '13px' }} value="scout --provider aws --credentials-use-keys" disabled />
                    <span className="badge badge-success">Active</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Prowler Audit Settings</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Used for auditing IAM policies, MFA statuses, inactive access keys, privilege levels.</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <input type="text" className="form-input" style={{ flex: 1, fontSize: '13px' }} value="/home/dharshini/.local/bin/prowler aws" disabled />
                    <span className="badge badge-success">Active</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Task Worker Environment</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>System scans operate via celery background processes, with synchronous fallback capabilities.</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                      Celery Worker status: <b>Active</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- DETAILS POPUP PANE -------------------- */}
        {selectedFinding && (
          <div className="modal-overlay" onClick={() => setSelectedFinding(null)}>
            <div className="modal-content fade-in" style={{ width: '700px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge badge-${selectedFinding.severity}`}>
                    {selectedFinding.severity.toUpperCase()}
                  </span>
                  <h3 className="modal-title">{selectedFinding.title}</h3>
                </div>
                <X className="modal-close" onClick={() => setSelectedFinding(null)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                <div>
                  <span className="detail-section-title" style={{ display: 'block', margin: 0 }}>Target Resource Details</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px', fontSize: '14px' }}>
                    <div>Environment: <b>{selectedFinding.cloud_account_name}</b></div>
                    <div>Service: <code>{selectedFinding.service}</code></div>
                    {selectedFinding.finding_type === 'storage' ? (
                      <>
                        <div>S3 Bucket: <code>{selectedFinding.bucket_name}</code></div>
                        <div>Exposure: <b>{selectedFinding.exposure_type}</b></div>
                      </>
                    ) : (
                      <>
                        <div>Affected Principal: <code>{selectedFinding.affected_user}</code></div>
                        <div>Check: <b>{selectedFinding.issue}</b></div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="detail-section-title" style={{ display: 'block' }}>Vulnerability Description</span>
                  <p style={{ fontSize: '14px', lineHeight: 1.5, marginTop: '8px', color: 'var(--text-secondary)' }}>
                    {selectedFinding.description}
                  </p>
                </div>

                {selectedFinding.finding_type === 'iam' && selectedFinding.impact && (
                  <div>
                    <span className="detail-section-title" style={{ display: 'block' }}>Security Impact</span>
                    <p style={{ fontSize: '14px', lineHeight: 1.5, marginTop: '8px', color: '#F87171' }}>
                      {selectedFinding.impact}
                    </p>
                  </div>
                )}

                {selectedFinding.evidence && (
                  <div>
                    <span className="detail-section-title" style={{ display: 'block' }}>Vulnerability Evidence</span>
                    <pre className="detail-code" style={{ marginTop: '8px' }}>
                      {selectedFinding.evidence}
                    </pre>
                  </div>
                )}

                <div>
                  <span className="detail-section-title" style={{ display: 'block' }}>Remediation Guidance</span>
                  <p style={{ fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-line', marginTop: '8px', color: 'var(--text-primary)' }}>
                    {selectedFinding.finding_type === 'storage' ? selectedFinding.remediation : selectedFinding.remediation_steps}
                  </p>
                </div>

                {(selectedFinding.references || selectedFinding.reference_links) && (
                  <div>
                    <span className="detail-section-title" style={{ display: 'block' }}>Reference Links</span>
                    <div className="detail-links" style={{ fontSize: '13px', marginTop: '8px' }}>
                      <a href={selectedFinding.finding_type === 'storage' ? selectedFinding.references : selectedFinding.reference_links} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {selectedFinding.finding_type === 'storage' ? selectedFinding.references : selectedFinding.reference_links}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Workflow Status:</span>
                    <select 
                      className="form-select" 
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      value={selectedFinding.status}
                      onChange={(e) => handleUpdateFindingStatus(selectedFinding.id, e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="accepted_risk">Accepted Risk</option>
                      <option value="false_positive">False Positive</option>
                    </select>
                  </div>

                  <button className="btn btn-secondary" onClick={() => setSelectedFinding(null)}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
