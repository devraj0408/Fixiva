import { supabase } from '../lib/supabaseClient';

/**
 * FIXIVA Trust Score Engine
 * Canonical Scoring Model (0 to 100):
 * 
 * Positive Components (Max 90 pts):
 * 1. Identity / KYC Verification (20 pts): ID proof (10 pts) + Profile photo (10 pts)
 * 2. Contact Verification (10 pts): Email present/verified (5 pts) + Phone present (5 pts)
 * 3. Completed Jobs (20 pts): 4 pts per completed booking (up to 5+ jobs = 20 pts max)
 * 4. Customer Rating (20 pts): Derived from reviews table (avgRating / 5.0 * 20)
 * 5. On-Time Completion (10 pts): Punctuality ratio (10 pts default for new workers)
 * 6. Job Acceptance & Reliability (10 pts): Job completion ratio (10 pts default for new workers)
 * 
 * Quality / Volume Bonus (Up to +10 pts, capped at 100 max):
 * - High Volume (5+ completed jobs): +5 pts
 * - High Rating (>= 4.8 avg with 2+ reviews): +5 pts
 * 
 * Deductions:
 * - Worker Cancellation: -15 pts per event
 * - No-Show Event: -25 pts per event
 * - Customer Complaint / Dispute Ticket: -10 pts per active ticket
 * - Late Job Completion: -5 pts per event
 * 
 * Final Score = Math.min(100, Math.max(0, positiveTotal - netDeductions))
 */

export const calculateWorkerTrustScore = (worker, bookings = [], reviews = [], tickets = []) => {
  if (!worker) {
    return {
      score: 50,
      tier: 'Average',
      tierColor: 'amber',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      positiveTotal: 40,
      netDeductions: 0,
      avgRating: '0.0',
      reviewCount: 0,
      completedJobsCount: 0,
      breakdown: {
        profileVerif: 10,
        contactVerif: 10,
        completedJobs: 0,
        customerRating: 0,
        onTime: 10,
        reliability: 10,
        bonus: 0,
        hasIdProof: false,
        hasPhoto: false,
        hasEmail: true,
        hasPhone: true,
      },
      deductions: [],
    };
  }

  const workerId = worker.id || worker.profile_id;
  const workerEmail = worker.email || worker.profile?.email || '';
  const workerPhone = worker.phone || worker.profile?.phone || '';

  // 1. Profile Verification (Max 20)
  const hasIdProof = Boolean(worker.id_proof_url || worker.idProofUrl || worker.kyc_verified || worker.is_verified);
  const hasPhoto = Boolean(worker.profile_photo_url || worker.profilePhotoUrl || worker.avatar_url || worker.profile?.avatar_url);
  const profileVerif = (hasIdProof ? 10 : 0) + (hasPhoto ? 10 : 0);

  // 2. Contact Verification (Max 10)
  const hasEmail = Boolean(workerEmail || worker.email_verified || worker.profile?.email_verified);
  const hasPhone = Boolean(workerPhone);
  const contactVerif = (hasEmail ? 5 : 0) + (hasPhone ? 5 : 0);

  // Filter bookings for this worker
  const wBookings = (bookings || []).filter((b) => {
    const bWorkerId = b.worker_id || b.workerId || b.worker?.id;
    return String(bWorkerId || '') === String(workerId);
  });

  // Completed jobs
  const completedBookings = wBookings.filter((b) => String(b.status || '').toLowerCase() === 'completed');
  const completedJobsCount = completedBookings.length;
  const completedJobsScore = Math.min(20, completedJobsCount * 4);

  // Worker Cancellations
  const workerCancelledBookings = wBookings.filter((b) => {
    const st = String(b.status || '').toLowerCase();
    const cancelledByWorker = b.cancelled_by === 'worker' || b.cancelledBy === 'worker' || (b.cancellation_reason && b.cancellation_reason.toLowerCase().includes('worker'));
    return st === 'cancelled' && cancelledByWorker;
  });
  const workerCancellationsCount = workerCancelledBookings.length;

  // No-shows
  const noShowBookings = wBookings.filter((b) => {
    const st = String(b.status || '').toLowerCase();
    const reason = String(b.cancellation_reason || '').toLowerCase();
    return st === 'no-show' || st === 'noshow' || reason.includes('no show') || reason.includes('no-show');
  });
  const noShowCount = noShowBookings.length;

  // Late jobs
  const lateJobs = completedBookings.filter((b) => Boolean(b.is_late || b.isLate || (b.late_minutes && b.late_minutes > 15)));
  const lateCount = lateJobs.length;

  // Reviews for worker
  const wReviews = (reviews || []).filter((r) => {
    const rWorkerId = r.worker_id || r.workerId;
    return String(rWorkerId || '') === String(workerId);
  });
  let avgRating = 0;
  if (wReviews.length > 0) {
    const sumRating = wReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    avgRating = sumRating / wReviews.length;
  }
  const customerRatingScore = wReviews.length > 0 ? Math.min(20, Math.round((avgRating / 5.0) * 20)) : 0;

  // On-Time Completion (Max 10)
  let onTimeScore = 10;
  if (completedJobsCount > 0) {
    const onTimeCount = completedJobsCount - lateCount;
    onTimeScore = Math.min(10, Math.max(0, Math.round((onTimeCount / completedJobsCount) * 10)));
  }

  // Reliability & Acceptance (Max 10)
  let reliabilityScore = 10;
  const totalAssignedJobs = completedJobsCount + workerCancellationsCount + noShowCount;
  if (totalAssignedJobs > 0) {
    reliabilityScore = Math.min(10, Math.max(0, Math.round((completedJobsCount / totalAssignedJobs) * 10)));
  }

  // Bonus Points
  let bonusScore = 0;
  if (completedJobsCount >= 5) bonusScore += 5;
  if (wReviews.length >= 2 && avgRating >= 4.8) bonusScore += 5;

  const positiveSubtotal = profileVerif + contactVerif + completedJobsScore + customerRatingScore + onTimeScore + reliabilityScore + bonusScore;
  const positiveTotal = Math.min(100, positiveSubtotal);

  // Complaints / Tickets against worker
  const wTickets = (tickets || []).filter((t) => {
    const target = String(t.user_id || t.userId || t.target_id || '');
    const msg = String(t.message || '').toLowerCase();
    const wName = String(worker.name || '').toLowerCase();
    return target === String(workerId) || (wName.length > 2 && msg.includes(wName));
  });
  const complaintCount = wTickets.filter((t) => {
    const st = String(t.status || '').toLowerCase();
    return st !== 'resolved' && st !== 'closed';
  }).length;

  // Deductions List
  const deductionsList = [];
  if (workerCancellationsCount > 0) {
    deductionsList.push({ type: 'Worker Cancellation', count: workerCancellationsCount, points: workerCancellationsCount * 15 });
  }
  if (noShowCount > 0) {
    deductionsList.push({ type: 'No-Show Event', count: noShowCount, points: noShowCount * 25 });
  }
  if (complaintCount > 0) {
    deductionsList.push({ type: 'Customer Complaint / Dispute', count: complaintCount, points: complaintCount * 10 });
  }
  if (lateCount > 0) {
    deductionsList.push({ type: 'Late Job Completion', count: lateCount, points: lateCount * 5 });
  }

  const netDeductions = deductionsList.reduce((acc, d) => acc + d.points, 0);
  const finalScore = Math.min(100, Math.max(0, positiveTotal - netDeductions));

  // Determine visual tier
  let tier = 'Average';
  let badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
  let tierColor = 'amber';

  if (finalScore >= 90) {
    tier = 'Excellent';
    badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    tierColor = 'emerald';
  } else if (finalScore >= 75) {
    tier = 'Very Good';
    badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
    tierColor = 'blue';
  } else if (finalScore >= 60) {
    tier = 'Good';
    badgeBg = 'bg-teal-50 text-teal-700 border-teal-200';
    tierColor = 'teal';
  } else if (finalScore >= 40) {
    tier = 'Average';
    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
    tierColor = 'amber';
  } else {
    tier = 'Needs Improvement';
    badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
    tierColor = 'rose';
  }

  return {
    score: finalScore,
    tier,
    tierColor,
    badgeBg,
    positiveTotal,
    netDeductions,
    avgRating: avgRating > 0 ? avgRating.toFixed(1) : 'No ratings',
    reviewCount: wReviews.length,
    completedJobsCount,
    breakdown: {
      profileVerif,
      contactVerif,
      completedJobs: completedJobsScore,
      customerRating: customerRatingScore,
      onTime: onTimeScore,
      reliability: reliabilityScore,
      bonus: bonusScore,
      hasIdProof,
      hasPhoto,
      hasEmail,
      hasPhone,
    },
    deductions: deductionsList,
  };
};

/**
 * Persist calculated trust score & status to Supabase (workers & trust_scores tables)
 */
export const syncWorkerTrustScoreToDb = async (workerId, score, statusTier = 'Good') => {
  if (!supabase || !workerId) return { error: 'Supabase unavailable or missing workerId' };

  try {
    // 1. Update workers table
    const { error: wErr } = await supabase
      .from('workers')
      .update({ trust_score: score })
      .eq('id', workerId);

    if (wErr) console.warn('[trustScoreService] Error updating workers.trust_score:', wErr.message);

    // 2. Upsert into trust_scores mirror table
    const { error: tsErr } = await supabase
      .from('trust_scores')
      .upsert({
        worker_id: workerId,
        score,
        status: statusTier,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'worker_id' });

    if (tsErr) console.warn('[trustScoreService] Error upserting trust_scores:', tsErr.message);

    return { error: wErr || tsErr || null };
  } catch (err) {
    console.error('[trustScoreService] Failed to sync trust score:', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

/**
 * Helper to enrich an array of worker records with calculated Trust Scores and details
 */
export const enrichWorkersWithTrustScores = (workers = [], bookings = [], reviews = [], tickets = []) => {
  return (workers || []).map((worker) => {
    const trustDetails = calculateWorkerTrustScore(worker, bookings, reviews, tickets);
    return {
      ...worker,
      trust_score: trustDetails.score,
      trustScore: trustDetails.score,
      trustScoreDetails: trustDetails,
    };
  });
};
