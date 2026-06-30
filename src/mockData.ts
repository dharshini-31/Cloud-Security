// Mock Data for Cyber Security Frontend - Persistent Mock Data Layer

import type { DashboardData, CloudAccount, Scan, Finding, Report } from './types';

export const mockDashboardData: DashboardData = {
  security_score: 68,
  risk_level: 'High',
  findings_summary: {
    critical: 5,
    high: 8,
    medium: 12,
    low: 18
  },
  assets_summary: {
    total_accounts: 3,
    total_buckets: 15,
    total_iam_users: 28,
    total_iam_roles: 52,
    total_iam_policies: 120
  },
  recent_scans: [
    {
      id: 201,
      name: 'Comprehensive Cyber Threat Assessment',
      cloud_account: 1,
      cloud_account_name: 'Production-Environment',
      cloud_provider: 'AWS',
      scan_type: 'combined',
      status: 'completed',
      findings_count: 12,
      overall_score: 62,
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 40).toISOString()
    },
    {
      id: 202,
      name: 'Advanced Vulnerability Scan Suite',
      cloud_account: 2,
      cloud_account_name: 'Staging-Environment',
      cloud_provider: 'AWS',
      scan_type: 'scoutsuite',
      status: 'completed',
      findings_count: 8,
      overall_score: 75,
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 170).toISOString()
    },
    {
      id: 203,
      name: 'IAM Privilege Escalation Audit',
      cloud_account: 3,
      cloud_account_name: 'Development-Environment',
      cloud_provider: 'AWS',
      scan_type: 'prowler',
      status: 'completed',
      findings_count: 5,
      overall_score: 80,
      created_at: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 3600 * 23.5).toISOString()
    }
  ],
  findings_trend: {
    labels: ['June 20', 'June 21', 'June 22', 'June 23', 'June 24', 'June 25', 'June 26'],
    critical: [7, 6, 5, 5, 5, 5, 5],
    high: [12, 11, 10, 9, 8, 8, 8],
    medium: [18, 16, 15, 14, 13, 12, 12]
  }
};

export const mockCloudAccounts: CloudAccount[] = [
  {
    id: 1,
    name: 'Production-Environment',
    access_key: 'AKIA2848****PROD1',
    region: 'us-east-1',
    status: 'connected',
    last_scan: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    created_at: new Date(Date.now() - 1000 * 3600 * 720).toISOString()
  },
  {
    id: 2,
    name: 'Staging-Environment',
    access_key: 'AKIA5621****STAGE2',
    region: 'us-west-2',
    status: 'connected',
    last_scan: new Date(Date.now() - 1000 * 3600 * 8).toISOString(),
    created_at: new Date(Date.now() - 1000 * 3600 * 720).toISOString()
  },
  {
    id: 3,
    name: 'Development-Environment',
    access_key: 'AKIA7334****DEV3',
    region: 'eu-west-1',
    status: 'connected',
    last_scan: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
    created_at: new Date(Date.now() - 1000 * 3600 * 480).toISOString()
  }
];

export const mockScans: Scan[] = [
  {
    id: 201,
    name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    cloud_provider: 'AWS',
    scan_type: 'combined',
    status: 'completed',
    findings_count: 12,
    overall_score: 62,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    result: {
      id: 1001,
      overall_score: 62,
      critical_count: 3,
      high_count: 4,
      medium_count: 3,
      low_count: 2,
      total_buckets: 8,
      public_buckets: 3,
      private_buckets: 5,
      critical_buckets: 2,
      total_iam_users: 12,
      users_without_mfa: 4,
      admin_users: 3,
      inactive_users: 1,
      high_risk_users: 2
    }
  },
  {
    id: 202,
    name: 'Advanced Vulnerability Scan Suite',
    cloud_account: 2,
    cloud_account_name: 'Staging-Environment',
    cloud_provider: 'AWS',
    scan_type: 'scoutsuite',
    status: 'completed',
    findings_count: 8,
    overall_score: 75,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 170).toISOString()
  }
];

export const mockFindings: Finding[] = [
  {
    id: 10,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'S3',
    severity: 'critical',
    status: 'open',
    finding_type: 'storage',
    title: 'S3 Bucket with Full Public Write Access - Data Exfiltration Risk',
    description: 'S3 bucket configured with unrestricted public write permissions. This allows anyone on the internet to upload malicious files, overwrite critical data, or cause data loss through mass deletion.',
    bucket_name: 'prod-user-uploads-bucket',
    region: 'us-east-1',
    exposure_type: 'Public Write Access - Unrestricted',
    evidence: 'Bucket Policy Statement:\n{\n  "Effect": "Allow",\n  "Principal": "*",\n  "Action": ["s3:PutObject", "s3:DeleteObject"],\n  "Resource": "arn:aws:s3:::prod-user-uploads-bucket/*"\n}\n\nACL Analysis: Everyone (Public) has WRITE and DELETE permissions',
    remediation: '1. Remove all "*" principals from S3 bucket policy immediately.\n2. Apply principle of least privilege - restrict to specific IAM roles only.\n3. Enable S3 Block Public Access feature.\n4. Implement bucket encryption with KMS.\n5. Enable CloudTrail logging for all S3 API calls.',
    references: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-iam-cloudtrail-logging.html',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 11,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'S3',
    severity: 'critical',
    status: 'open',
    finding_type: 'storage',
    title: 'Production Database Backup Exposed in Public S3 Bucket',
    description: 'Sensitive database backups (.sql, .db files) containing customer records and credentials are stored in a publicly readable S3 bucket. This violates GDPR, HIPAA, and PCI-DSS compliance standards.',
    bucket_name: 'backup-archives-prod',
    region: 'us-east-1',
    exposure_type: 'Public Read + List Access',
    evidence: 's3://backup-archives-prod/database_backup_2026_06_28.sql (Size: 2.3GB)\nPublic Read Verified via: curl https://s3.amazonaws.com/backup-archives-prod/database_backup_2026_06_28.sql\nResponse: 200 OK with full database dump\n\nContents: User credentials, payment info, SSNs, email addresses',
    remediation: '1. IMMEDIATE: Delete public backups or move to private encrypted bucket.\n2. Rotate all exposed database credentials and API keys.\n3. Notify affected users of potential data breach.\n4. Implement automated backup encryption with AWS KMS.\n5. Enforce backup retention policies with automatic deletion.',
    references: 'https://aws.amazon.com/premiumsupport/knowledge-center/backup-best-practices-aws/',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 12,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'IAM',
    severity: 'critical',
    status: 'open',
    finding_type: 'iam',
    title: 'Root Account Credentials Active with No MFA - Full Account Takeover Risk',
    description: 'AWS Root account has active access keys and MFA is disabled. This represents the highest risk - root account compromise grants full control over the entire AWS infrastructure, billing, and resource deletion.',
    affected_user: 'root@production-env',
    issue: 'Root Account MFA Disabled',
    impact: 'CRITICAL: Complete account compromise, ability to delete all resources, modify billing, access all data, disable logging, and cause service disruption.',
    evidence: 'AWS IAM Credential Report:\nRoot Account: admin-active = TRUE\nMFA Status: DISABLED\nAccess Key Age: 847 days (inactive rotation)\nConsole Login: Active in last 24 hours',
    remediation_steps: '1. Immediately delete root access keys.\n2. Enable MFA on root account using hardware device (preferred) or authenticator app.\n3. Use IAM users for all operational tasks.\n4. Enable CloudTrail for root account activity monitoring.\n5. Lock root account behind AWS Organizations root permissions.\n6. Implement AWS SSO for identity federation.',
    reference_links: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 13,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'IAM',
    severity: 'critical',
    status: 'in_progress',
    finding_type: 'iam',
    title: 'Multiple Admin Users Without MFA Enabled - Privilege Abuse Risk',
    description: 'Four IAM users with AdministratorAccess policy have MFA disabled. These accounts can perform any operation on AWS resources including delete, modify, or exfiltrate data without additional verification.',
    affected_user: 'admin-james, admin-sarah, admin-john, admin-operations',
    issue: 'Admin Accounts Lacking MFA Protection',
    impact: 'If any admin account is compromised, attacker gains unrestricted AWS resource access. Can delete databases, exfiltrate S3 data, modify security policies, stop logging, and disable backups.',
    evidence: 'IAM Users with Admin Access:\n- admin-james: MFA = false, Last Login = 2 hours ago\n- admin-sarah: MFA = false, Last Login = 6 hours ago\n- admin-john: MFA = false, Access Key Age = 120 days\n- admin-operations: MFA = false, Used for automated deployments',
    remediation_steps: '1. Immediately require MFA for all admin users.\n2. Implement IAM policy condition requiring MFA for sensitive actions.\n3. For automation: use temporary credentials via AssumeRole.\n4. Enforce password policy with 90-day rotation.\n5. Monitor admin actions via CloudTrail.\n6. Implement AWS Config rules to auto-remediate.',
    reference_links: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable.html',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 14,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'S3',
    severity: 'high',
    status: 'open',
    finding_type: 'storage',
    title: 'S3 Bucket with Public Read Access to Application Code and Configuration',
    description: 'Application source code and configuration files (including API endpoints and secrets) are publicly readable from S3. This allows attackers to discover vulnerabilities, hardcoded credentials, and architecture details.',
    bucket_name: 'app-source-code-repo',
    region: 'us-east-1',
    exposure_type: 'Public Read Access',
    evidence: 's3://app-source-code-repo/\nPublic can LIST and GET objects\nFound files:\n- /src/database.config (contains DB host, username, plaintext password)\n- /api/endpoints.json (lists all API routes)\n- /secrets/.env (contains AWS_SECRET_ACCESS_KEY)',
    remediation: '1. Immediately restrict bucket to private access.\n2. Move code to CodeCommit/GitHub with private access.\n3. Rotate all exposed credentials immediately.\n4. Enable versioning to track changes.\n5. Implement bucket encryption at rest.\n6. Use Infrastructure-as-Code instead of configuration files in S3.',
    references: 'https://aws.amazon.com/premiumsupport/knowledge-center/private-s3-bucket/',
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString()
  },
  {
    id: 15,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'IAM',
    severity: 'high',
    status: 'open',
    finding_type: 'iam',
    title: 'Service Account with Overly Permissive IAM Policy',
    description: 'Service account used by application servers has wildcard ("*") permissions on all S3 and EC2 actions. If application is compromised, attacker gains broad AWS access.',
    affected_user: 'service-app-prod',
    issue: 'Overly Permissive Service Account Permissions',
    impact: 'If application container/server is compromised, attacker can access all S3 buckets, terminate instances, modify security groups, and access other resources.',
    evidence: 'Attached Policy:\n{\n  "Effect": "Allow",\n  "Action": ["s3:*", "ec2:*"],\n  "Resource": "*"\n}\nPolicy used by: prod-app-server, prod-worker-queue, prod-batch-jobs',
    remediation_steps: '1. Create fine-grained IAM policy based on principle of least privilege.\n2. Restrict S3 access to specific buckets needed by application.\n3. Limit EC2 actions to describe and stop only (not terminate).\n4. Use resource tags to further limit scope.\n5. Rotate service account credentials every 90 days.\n6. Monitor service account usage with CloudTrail.',
    reference_links: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege',
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString()
  },
  {
    id: 16,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'IAM',
    severity: 'high',
    status: 'resolved',
    finding_type: 'iam',
    title: 'Inactive IAM Access Keys Not Rotated for 18+ Months',
    description: 'Multiple IAM access keys remain active despite not being used for over 18 months. Inactive credentials that may have been compromised still pose a security risk.',
    affected_user: 'dev-contractor, legacy-api-user, old-ci-pipeline',
    issue: 'Stale Access Keys',
    impact: 'Compromised but forgotten credentials can be used to access AWS resources. No detection alerts since they haven\'t been used.',
    evidence: 'Access Key Status:\n- AKIAX5678OLDKEY1: Last used = 640 days ago\n- AKIAY9012LEGACY2: Last used = 580 days ago\n- AKIA3456CIOLD: Last used = 450 days ago',
    remediation_steps: '1. Delete unused access keys immediately.\n2. Implement access key rotation policy (max 90 days).\n3. Use CloudTrail to identify unused keys.\n4. Implement AWS Config rule to detect old keys.\n5. For contractors: use temporary credentials via STS AssumeRole.\n6. Enable access key rotation alerts.',
    reference_links: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 17,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'S3',
    severity: 'medium',
    status: 'accepted_risk',
    finding_type: 'storage',
    title: 'S3 Bucket Versioning Disabled - Data Loss Risk',
    description: 'S3 bucket does not have versioning enabled. Accidental or malicious file deletion cannot be recovered.',
    bucket_name: 'critical-documents-prod',
    region: 'us-east-1',
    exposure_type: 'No Version Control',
    evidence: 'Bucket Configuration:\n- Versioning Status: Disabled\n- MFA Delete: Disabled\n- Contains 85 critical documents',
    remediation: '1. Enable S3 versioning on the bucket.\n2. Set MFA Delete to require MFA for permanent deletion.\n3. Implement S3 lifecycle policies for version retention.\n4. Enable S3 Object Lock for WORM compliance.',
    references: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 18,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account: 1,
    cloud_account_name: 'Production-Environment',
    service: 'IAM',
    severity: 'medium',
    status: 'open',
    finding_type: 'iam',
    title: 'Console Access Password Policy Not Enforced',
    description: 'IAM password policy allows weak passwords. Minimum requirements not met: no uppercase, numbers, or special characters enforced.',
    affected_user: 'all-iam-users',
    issue: 'Weak Password Policy',
    impact: 'Users can create weak passwords susceptible to brute force attacks.',
    evidence: 'Current IAM Password Policy:\n- Minimum Length: 6 characters\n- Uppercase Required: No\n- Numbers Required: No\n- Special Characters: No\n- Expiration: Not enforced',
    remediation_steps: '1. Update IAM password policy to require minimum 14 characters.\n2. Enforce mixed case, numbers, and special characters.\n3. Set password expiration to 90 days.\n4. Prevent password reuse for last 12 passwords.\n5. Implement AWS SSO instead of IAM console access.\n6. Enable MFA for all console users.',
    reference_links: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_passwords_account-policy.html',
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString()
  }
];

export const mockReports: Report[] = [
  {
    id: 1,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account_name: 'Production-Environment',
    format: 'pdf',
    report_file: 'VAPT_Assessment_Prod_2026_06_28.pdf',
    report_file_url: '#',
    created_at: new Date(Date.now() - 1000 * 3600 * 12).toISOString()
  },
  {
    id: 2,
    scan: 201,
    scan_name: 'Comprehensive Cyber Threat Assessment',
    cloud_account_name: 'Production-Environment',
    format: 'xlsx',
    report_file: 'Vulnerability_Details_Prod.xlsx',
    report_file_url: '#',
    created_at: new Date(Date.now() - 1000 * 3600 * 10).toISOString()
  }
];
