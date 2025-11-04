// Default stage configurations for projects and schemes

export const DEFAULT_PROJECT_STAGES = [
  {
    name: "Project Initiation",
    description: "Initial project setup, planning, and resource allocation",
    order: 1,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'project_coordinator'],
    estimatedDuration: 7,
    autoTransition: false,
    transitionConditions: "",
    color: "#3B82F6",
    icon: "🚀"
  },
  {
    name: "Planning & Design",
    description: "Detailed planning, design, and approval process",
    order: 2,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'project_coordinator'],
    estimatedDuration: 14,
    autoTransition: false,
    transitionConditions: "",
    color: "#8B5CF6",
    icon: "📋"
  },
  {
    name: "Implementation",
    description: "Active project implementation and execution",
    order: 3,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'project_coordinator', 'area_admin', 'unit_admin'],
    estimatedDuration: 90,
    autoTransition: false,
    transitionConditions: "",
    color: "#10B981",
    icon: "⚡"
  },
  {
    name: "Monitoring & Evaluation",
    description: "Progress monitoring and quality evaluation",
    order: 4,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'project_coordinator'],
    estimatedDuration: 30,
    autoTransition: false,
    transitionConditions: "",
    color: "#F59E0B",
    icon: "📊"
  },
  {
    name: "Completion & Closure",
    description: "Project completion, documentation, and closure",
    order: 5,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'project_coordinator'],
    estimatedDuration: 7,
    autoTransition: false,
    transitionConditions: "",
    color: "#EF4444",
    icon: "✅"
  }
];

export const DEFAULT_SCHEME_STAGES = [
  {
    name: "Application Received",
    description: "Initial application submission and registration",
    order: 1,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'],
    autoTransition: true,
    transitionConditions: "Automatically set when application is submitted",
    color: "#6B7280",
    icon: "📝"
  },
  {
    name: "Document Verification",
    description: "Verification of submitted documents and eligibility",
    order: 2,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'],
    autoTransition: false,
    transitionConditions: "",
    color: "#3B82F6",
    icon: "🔍"
  },
  {
    name: "Field Verification",
    description: "Physical verification and field assessment",
    order: 3,
    isRequired: false,
    allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin'],
    autoTransition: false,
    transitionConditions: "",
    color: "#8B5CF6",
    icon: "🏠"
  },
  {
    name: "Interview Process",
    description: "Beneficiary interview and assessment",
    order: 4,
    isRequired: false, // Will be required based on scheme.requiresInterview
    allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin', 'unit_admin', 'scheme_coordinator'],
    autoTransition: false,
    transitionConditions: "",
    color: "#10B981",
    icon: "💬"
  },
  {
    name: "Final Review",
    description: "Final review and decision making",
    order: 5,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin'],
    autoTransition: false,
    transitionConditions: "",
    color: "#F59E0B",
    icon: "⚖️"
  },
  {
    name: "Approved",
    description: "Application approved for disbursement",
    order: 6,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin'],
    autoTransition: false,
    transitionConditions: "",
    color: "#10B981",
    icon: "✅"
  },
  {
    name: "Disbursement",
    description: "Money disbursement to beneficiary",
    order: 7,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin'],
    autoTransition: false,
    transitionConditions: "",
    color: "#059669",
    icon: "💰"
  },
  {
    name: "Completed",
    description: "Application process completed successfully",
    order: 8,
    isRequired: true,
    allowedRoles: ['super_admin', 'state_admin', 'district_admin', 'area_admin'],
    autoTransition: true,
    transitionConditions: "Automatically set when all disbursements are complete",
    color: "#065F46",
    icon: "🎉"
  }
];

export const DEFAULT_DISTRIBUTION_TIMELINE = [
  {
    description: "Initial Payment (First Installment)",
    percentage: 50,
    daysFromApproval: 7,
    requiresVerification: true,
    notes: "First installment after approval"
  },
  {
    description: "Progress Payment (Second Installment)",
    percentage: 30,
    daysFromApproval: 60,
    requiresVerification: true,
    notes: "Payment after progress verification"
  },
  {
    description: "Final Payment (Completion)",
    percentage: 20,
    daysFromApproval: 120,
    requiresVerification: true,
    notes: "Final payment upon completion"
  }
];

// Function to get default configuration based on type
export const getDefaultConfiguration = (type: 'project_stages' | 'scheme_stages' | 'distribution_timeline') => {
  switch (type) {
    case 'project_stages':
      return {
        stages: DEFAULT_PROJECT_STAGES,
        enablePublicTracking: false,
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false
        }
      };
    
    case 'scheme_stages':
      return {
        stages: DEFAULT_SCHEME_STAGES,
        enablePublicTracking: true,
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: true
        }
      };
    
    case 'distribution_timeline':
      return {
        distributionSteps: DEFAULT_DISTRIBUTION_TIMELINE,
        settings: {
          enableNotifications: true,
          enablePublicTracking: true,
          autoProgressCalculation: true,
          requireApprovalForUpdates: false
        }
      };
    
    default:
      return null;
  }
};

// Function to apply scheme stages to application workflow
export const getApplicationStagesFromScheme = (scheme: any) => {
  let stages = [...DEFAULT_SCHEME_STAGES];
  
  // If scheme has custom stages, use those
  if (scheme.statusStages && scheme.statusStages.length > 0) {
    stages = scheme.statusStages;
  }
  
  // Modify stages based on scheme settings
  if (!scheme.applicationSettings?.requiresInterview) {
    // Remove or mark interview stage as not required
    stages = stages.map(stage => 
      stage.name === "Interview Process" 
        ? { ...stage, isRequired: false }
        : stage
    );
  } else {
    // Ensure interview stage is required
    stages = stages.map(stage => 
      stage.name === "Interview Process" 
        ? { ...stage, isRequired: true }
        : stage
    );
  }
  
  return stages;
};

// Function to initialize default stages for new projects/schemes
export const initializeDefaultStages = async (entityType: 'project' | 'scheme', entityId: string) => {
  try {
    const defaultConfig = getDefaultConfiguration(
      entityType === 'project' ? 'project_stages' : 'scheme_stages'
    );
    
    if (!defaultConfig) return null;
    
    // Here you would typically save to your backend
    // For now, return the configuration
    return defaultConfig;
  } catch (error) {
    console.error(`Error initializing default stages for ${entityType}:`, error);
    return null;
  }
};