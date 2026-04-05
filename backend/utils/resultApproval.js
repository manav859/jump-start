export const RESULT_PUBLICATION_STATUS = {
  NOT_SUBMITTED: "not_submitted",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
};

export const hasResultProfileData = (profile = {}) =>
  (Array.isArray(profile?.testResults) && profile.testResults.length > 0) ||
  (Array.isArray(profile?.strengths) && profile.strengths.length > 0) ||
  (Array.isArray(profile?.careerRecommendations) &&
    profile.careerRecommendations.length > 0) ||
  Boolean(profile?.personalityType?.code) ||
  (profile?.overallScore !== null &&
    profile?.overallScore !== undefined &&
    profile?.overallScore !== "" &&
    Number.isFinite(Number(profile?.overallScore)));

export const getProfilePublicationState = (
  profile = {},
  publication = {},
  fallback = {}
) => {
  const explicitStatus = publication?.status;
  const profileExists = hasResultProfileData(profile);

  if (
    profileExists &&
    (explicitStatus === RESULT_PUBLICATION_STATUS.PENDING_APPROVAL ||
      explicitStatus === RESULT_PUBLICATION_STATUS.APPROVED)
  ) {
    return {
      status: explicitStatus,
      submittedAt: publication?.submittedAt || null,
      approvedAt: publication?.approvedAt || null,
      approvedByName: publication?.approvedByName || "",
      hasProfileData: profileExists,
    };
  }

  if (profileExists) {
    return {
      status: RESULT_PUBLICATION_STATUS.APPROVED,
      submittedAt: publication?.submittedAt || fallback?.updatedAt || null,
      approvedAt: publication?.approvedAt || fallback?.updatedAt || null,
      approvedByName: publication?.approvedByName || "",
      hasProfileData: true,
    };
  }

  return {
    status: RESULT_PUBLICATION_STATUS.NOT_SUBMITTED,
    submittedAt: publication?.submittedAt || null,
    approvedAt: publication?.approvedAt || null,
    approvedByName: publication?.approvedByName || "",
    hasProfileData: false,
  };
};

export const getResultPublicationState = (user = {}) => {
  const profile = user?.resultProfile || {};
  return getProfilePublicationState(
    profile,
    user?.resultPublication || {},
    user
  );
};

export const isApprovedResultVisible = (user = {}) => {
  const publication = getResultPublicationState(user);
  return (
    publication.status === RESULT_PUBLICATION_STATUS.APPROVED &&
    publication.hasProfileData
  );
};
