// Central export file for all models
const User = require('./User');
const Location = require('./Location');
const Project = require('./Project');
const Scheme = require('./Scheme');
const Beneficiary = require('./Beneficiary');
const Application = require('./Application');
const Interview = require('./Interview');
const Report = require('./Report');
const EnquiryReport = require('./EnquiryReport');
const Notification = require('./Notification');
const Payment = require('./Payment');
const Dashboard = require('./Dashboard');
const FormConfiguration = require('./FormConfiguration');
const Donor = require('./Donor');
const Donation = require('./Donation');
const ActivityLog = require('./ActivityLog');
const MasterData = require('./MasterData');

// RBAC Models
const Role = require('./Role');
const Permission = require('./Permission');
const UserRole = require('./UserRole');

module.exports = {
  User,
  Location,
  Project,
  Scheme,
  Beneficiary,
  Application,
  Interview,
  Report,
  EnquiryReport,
  Notification,
  Payment,
  Dashboard,
  FormConfiguration,
  Donor,
  Donation,
  ActivityLog,
  MasterData,

  Role,
  Permission,
  UserRole
};