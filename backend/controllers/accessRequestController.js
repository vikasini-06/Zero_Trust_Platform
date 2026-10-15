const AccessRequest = require('../models/AccessRequest');
const Resource = require('../models/Resource');
const Device = require('../models/Device');
const Session = require('../models/Session');
const { evaluateAccess } = require('../services/accessDecisionService');
const { logEvent, createSecurityAlert } = require('../services/auditService');
const { extractDeviceMetadata, getOrCreateDevice } = require('../services/deviceService');

/**
 * @route   GET /api/access-requests/resources
 * @desc    Get catalog of enterprise resources protected by Zero Trust
 */
const getResources = async (req, res, next) => {
  try {
    const resources = await Resource.find().sort({ classification: -1, name: 1 });
    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/access-requests/resources/:id
 * @desc    Get single enterprise resource details
 */
const getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resource =
      (await Resource.findOne({ resourceId: id })) ||
      (await Resource.findById(id).catch(() => null));

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Enterprise resource not found',
        errorCode: 'RESOURCE_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/access-requests
 * @desc    Get all access requests (Managers / Admins)
 */
const getAccessRequests = async (req, res, next) => {
  try {
    const { status, requester } = req.query;
    const query = {};

    if (status) query.status = status;
    if (requester) query.requester = requester;

    const requests = await AccessRequest.find(query)
      .populate('requester', 'name email roleName department')
      .populate('reviewedBy', 'name email')
      .sort({ requestedAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/access-requests/me
 * @desc    Get current user's submitted access requests
 */
const getMyAccessRequests = async (req, res, next) => {
  try {
    const requests = await AccessRequest.find({ requester: req.user._id })
      .populate('reviewedBy', 'name email')
      .sort({ requestedAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/access-requests
 * @desc    Submit a new Zero Trust access request with automated posture scoring
 */
const createAccessRequest = async (req, res, next) => {
  try {
    const { resourceId, reason, requestedPermission = 'READ' } = req.body;

    if (!resourceId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID and justification reason are required',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const resource = await Resource.findOne({ resourceId }) || await Resource.findById(resourceId).catch(() => null);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Enterprise resource not found',
        errorCode: 'RESOURCE_NOT_FOUND',
      });
    }

    const deviceMetadata = extractDeviceMetadata(req);
    const { device } = await getOrCreateDevice(req.user, deviceMetadata);
    const sessionId = req.headers['x-session-id'] || req.tokenPayload?.sessionId;
    const session = sessionId ? await Session.findOne({ sessionId }) : null;

    // Run Zero Trust Access Decision evaluation upfront
    const decisionResult = await evaluateAccess({
      user: req.user,
      device,
      session,
      resource,
      requestedPermission,
      requestContext: { ipAddress: deviceMetadata.ipAddress, location: deviceMetadata.location },
    });

    const accessRequest = await AccessRequest.create({
      requester: req.user._id,
      requesterName: req.user.name,
      requesterEmail: req.user.email,
      requesterRole: req.user.roleName,
      resourceId: resource.resourceId,
      resourceName: resource.name,
      resourceCategory: resource.category,
      reason,
      requestedPermission,
      status: 'PENDING',
      riskScore: decisionResult.riskScore,
      riskLevel: decisionResult.riskLevel,
      riskFactors: decisionResult.factors,
      zeroTrustDecision: {
        decision: decisionResult.decision,
        reason: decisionResult.reason,
        score: decisionResult.riskScore,
      },
      requestedAt: new Date(),
    });

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'ACCESS_REQUEST_CREATED',
      resource: resource.name,
      resourceId: resource.resourceId,
      ipAddress: deviceMetadata.ipAddress,
      deviceId: device.deviceId,
      status: 'SUCCESS',
      riskScore: decisionResult.riskScore,
      details: {
        requestId: accessRequest._id,
        initialDecision: decisionResult.decision,
        reason,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Access request submitted and evaluated against Zero Trust policies.',
      data: accessRequest,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/access-requests/:id/approve
 * @desc    Approve access request (Manager / Security Admin)
 */
const approveAccessRequest = async (req, res, next) => {
  try {
    const { reviewNotes = 'Approved following security policy verification' } = req.body;
    const request = await AccessRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found',
        errorCode: 'REQUEST_NOT_FOUND',
      });
    }

    request.status = 'APPROVED';
    request.reviewedBy = req.user._id;
    request.reviewedByName = req.user.name;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes;
    await request.save();

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'ACCESS_GRANTED',
      resource: request.resourceName,
      resourceId: request.resourceId,
      ipAddress: req.ip,
      status: 'SUCCESS',
      riskScore: request.riskScore,
      details: {
        requestId: request._id,
        requester: request.requesterEmail,
        reviewNotes,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Access granted to ${request.resourceName} for ${request.requesterName}.`,
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/access-requests/:id/reject
 * @desc    Reject access request (Manager / Security Admin)
 */
const rejectAccessRequest = async (req, res, next) => {
  try {
    const { reviewNotes = 'Access denied due to least-privilege policy' } = req.body;
    const request = await AccessRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found',
        errorCode: 'REQUEST_NOT_FOUND',
      });
    }

    request.status = 'REJECTED';
    request.reviewedBy = req.user._id;
    request.reviewedByName = req.user.name;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes;
    await request.save();

    await logEvent({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'ACCESS_DENIED',
      resource: request.resourceName,
      resourceId: request.resourceId,
      ipAddress: req.ip,
      status: 'FAILURE',
      riskScore: request.riskScore + 15,
      details: {
        requestId: request._id,
        requester: request.requesterEmail,
        reviewNotes,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Access to ${request.resourceName} has been rejected.`,
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/access-requests/verify-access
 * @desc    Real-time Zero Trust Access Decision Checkpoint
 *          Evaluates user posture, device status, MFA, session validity, risk
 */
const evaluateLiveAccess = async (req, res, next) => {
  try {
    const { resourceId } = req.body;

    const resource = await Resource.findOne({ resourceId }) || await Resource.findById(resourceId).catch(() => null);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        errorCode: 'RESOURCE_NOT_FOUND',
      });
    }

    const deviceMetadata = extractDeviceMetadata(req);
    const { device } = await getOrCreateDevice(req.user, deviceMetadata);
    const sessionId = req.headers['x-session-id'] || req.tokenPayload?.sessionId;
    const session = sessionId ? await Session.findOne({ sessionId }) : null;

    const evaluation = await evaluateAccess({
      user: req.user,
      device,
      session,
      resource,
      requestContext: { ipAddress: deviceMetadata.ipAddress, location: deviceMetadata.location },
    });

    if (evaluation.allowed) {
      await logEvent({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'ACCESS_GRANTED',
        resource: resource.name,
        resourceId: resource.resourceId,
        ipAddress: deviceMetadata.ipAddress,
        deviceId: device.deviceId,
        status: 'SUCCESS',
        riskScore: evaluation.riskScore,
        details: { decision: evaluation.decision, reason: evaluation.reason },
      });
    } else {
      await logEvent({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'ACCESS_DENIED',
        resource: resource.name,
        resourceId: resource.resourceId,
        ipAddress: deviceMetadata.ipAddress,
        deviceId: device.deviceId,
        status: 'BLOCKED',
        riskScore: evaluation.riskScore,
        details: { decision: evaluation.decision, reason: evaluation.reason },
      });

      if (evaluation.riskScore >= 75) {
        await createSecurityAlert({
          type: 'SUSPICIOUS_RESOURCE_ACCESS_ATTEMPT',
          severity: 'HIGH',
          user: req.user._id,
          userName: req.user.name,
          userEmail: req.user.email,
          device: device._id,
          deviceId: device.deviceId,
          ipAddress: deviceMetadata.ipAddress,
          description: `High risk access attempt to ${resource.name} blocked. Reason: ${evaluation.reason}`,
          riskScore: evaluation.riskScore,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...evaluation,
        resource: {
          resourceId: resource.resourceId,
          name: resource.name,
          category: resource.category,
          classification: resource.classification,
          requiresMFA: resource.requiresMFA,
          endpointUrl: resource.endpointUrl,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getResources,
  getResourceById,
  getAccessRequests,
  getMyAccessRequests,
  createAccessRequest,
  approveAccessRequest,
  rejectAccessRequest,
  evaluateLiveAccess,
};
