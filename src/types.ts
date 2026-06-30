// Type Definitions for Cyber Security Assessment Platform

export interface User {
  username: string;
  email: string;
  first_name: string;
}

export interface CloudAccount {
  id: number;
  name: string;
  access_key: string;
  region: string;
  status: 'connected' | 'disconnected' | 'error';
  last_scan: string | null;
  created_at: string;
}

export interface ScanResult {
  id: number;
  overall_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_buckets: number;
  public_buckets: number;
  private_buckets: number;
  critical_buckets: number;
  total_iam_users: number;
  users_without_mfa: number;
  admin_users: number;
  inactive_users: number;
  high_risk_users: number;
}

export interface Scan {
  id: number;
  name: string;
  cloud_account: number;
  cloud_account_name: string;
  cloud_provider: string;
  scan_type: 'scoutsuite' | 'prowler' | 'combined';
  status: 'queued' | 'running' | 'completed' | 'failed';
  findings_count: number;
  overall_score: number;
  created_at: string;
  completed_at: string | null;
  result?: ScanResult;
}

export interface Finding {
  id: number;
  scan: number;
  scan_name: string;
  cloud_account: number;
  cloud_account_name: string;
  service: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk' | 'false_positive';
  finding_type: 'storage' | 'iam';
  title: string;
  description: string;
  created_at: string;
  
  // Storage specific fields
  bucket_name?: string;
  region?: string;
  exposure_type?: string;
  evidence?: string;
  remediation?: string;
  references?: string;

  // IAM specific fields
  affected_user?: string;
  issue?: string;
  impact?: string;
  remediation_steps?: string;
  reference_links?: string;
}

export interface DashboardData {
  security_score: number;
  risk_level: string;
  findings_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  assets_summary: {
    total_accounts: number;
    total_buckets: number;
    total_iam_users: number;
    total_iam_roles: number;
    total_iam_policies: number;
  };
  recent_scans: Scan[];
  findings_trend: {
    labels: string[];
    critical: number[];
    high: number[];
    medium: number[];
  };
}

export interface Report {
  id: number;
  scan: number;
  scan_name: string;
  cloud_account_name: string;
  format: 'pdf' | 'csv' | 'xlsx';
  report_file: string | null;
  report_file_url: string | null;
  created_at: string;
}
