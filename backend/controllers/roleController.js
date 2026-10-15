const Role = require('../models/Role');
const { logEvent } = require('../services/auditService');

const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ level: -1 });
    return res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (err) {
    next(err);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    const { permissions, description } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        errorCode: 'ROLE_NOT_FOUND',
      });
    }

    if (permissions) role.permissions = permissions;
    if (description) role.description = description;
    await role.save();

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'ROLE_PERMISSIONS_UPDATED',
      resource: 'Role',
      resourceId: role._id.toString(),
      ipAddress: req.ip,
      status: 'SUCCESS',
      riskScore: 25,
      details: { roleName: role.name, permissionsCount: role.permissions.length },
    });

    return res.status(200).json({
      success: true,
      message: `Permissions updated for role ${role.name}`,
      data: role,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRoles,
  updateRolePermissions,
};
