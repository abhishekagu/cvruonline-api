/**
 * Academic eligibility verification utility for CVRU Admissions
 * PG programs (MBA, MA English, B.Lib.I.Sc) require Graduation / Bachelor's Degree.
 * UG programs (BBA, BCA) require at least 10+2 / 12th pass.
 */

const PG_PROGRAMS = ['mba', 'ma_english', 'blibisc'];

const GRADUATION_KEYWORDS = [
    'graduat', 'bachelor', 'degree', 'undergraduat', 'ug', 'b.tech', 'btech', 'b.e', 'bca', 'b.c.a',
    'bba', 'b.b.a', 'b.com', 'bcom', 'b.sc', 'bsc', 'b.a', 'ba', 'llb', 'b.pharm', 'bpharm',
    'b.arch', 'post graduate', 'postgraduate', 'master', 'm.tech', 'mca', 'mba', 'm.com', 'msc', 'm.sc', 'm.a', 'ma', 'pg'
];

const TWELFTH_KEYWORDS = [
    '12', '12th', 'xii', 'twelfth', '10+2', '+2', 'plus two', 'intermediate', 'inter', 'hsc', 'h.s.c',
    'senior secondary', 'higher secondary', 'sr. secondary'
];

export const checkAcademicEligibility = (programId, qualifications = []) => {
    const progId = (programId || '').toLowerCase();
    const isPG = PG_PROGRAMS.includes(progId);
    const requiredLevel = isPG ? "Graduation / Bachelor's Degree" : "10+2 / 12th Standard";

    const validQuals = (qualifications || []).filter(q =>
        q && (q.level || q.programName || q.specialization || q.board || q.institute)
    );

    if (validQuals.length === 0) {
        return {
            isEligible: false,
            status: 'missing_qualifications',
            requiredLevel,
            detectedLevel: 'None',
            reason: `Educational qualifications are not found in the student profile. Please update profile with required academic credentials.`
        };
    }

    let hasGraduation = false;
    let hasTwelfth = false;
    let highestGrad = null;
    let highestTwelfth = null;

    for (const q of validQuals) {
        const text = `${q.level || ''} ${q.programName || ''} ${q.specialization || ''}`.toLowerCase();

        // Check graduation
        const matchesGrad = GRADUATION_KEYWORDS.some(kw => {
            if (['ba', 'ug', 'pg', 'ma', 'be'].includes(kw)) {
                return new RegExp(`\\b${kw}\\b`, 'i').test(text);
            }
            return text.includes(kw);
        });

        if (matchesGrad) {
            hasGraduation = true;
            if (!highestGrad) highestGrad = q;
        }

        // Check 12th
        const matchesTwelfth = TWELFTH_KEYWORDS.some(kw => {
            if (['+2', '12'].includes(kw)) {
                return new RegExp(`\\b${kw.replace('+', '\\+')}\\b`, 'i').test(text);
            }
            return text.includes(kw);
        });

        if (matchesTwelfth) {
            hasTwelfth = true;
            if (!highestTwelfth) highestTwelfth = q;
        }
    }

    if (isPG) {
        if (hasGraduation) {
            const gradTitle = highestGrad?.programName || highestGrad?.level || "Bachelor's Degree";
            return {
                isEligible: true,
                status: 'eligible',
                requiredLevel,
                detectedLevel: gradTitle,
                reason: `Academic eligibility verified with Bachelor's Degree (${gradTitle}).`
            };
        } else {
            const currentHighest = highestTwelfth
                ? (highestTwelfth.programName || highestTwelfth.level || '12th Standard')
                : (validQuals[0]?.programName || validQuals[0]?.level || '12th Pass');

            return {
                isEligible: false,
                status: 'ineligible_pg',
                requiredLevel,
                detectedLevel: currentHighest,
                reason: `Admission in Post Graduate program (${progId.toUpperCase()}) requires a minimum of a recognized Bachelor's Degree (Graduation). Your highest recorded qualification is "${currentHighest}". 12th pass students are not eligible for PG admission.`
            };
        }
    }

    // UG programs (BBA, BCA)
    if (hasGraduation || hasTwelfth) {
        const qualTitle = hasGraduation
            ? (highestGrad?.programName || 'Graduation')
            : (highestTwelfth?.programName || highestTwelfth?.level || '10+2 / 12th Standard');

        return {
            isEligible: true,
            status: 'eligible',
            requiredLevel,
            detectedLevel: qualTitle,
            reason: `Academic eligibility verified with 10+2 qualification (${qualTitle}).`
        };
    }

    // Fallback for UG in testing mode
    return {
        isEligible: true,
        status: 'provisional',
        requiredLevel,
        detectedLevel: validQuals[0]?.programName || validQuals[0]?.level || 'Secondary',
        reason: `Provisional admission eligibility pending verification.`
    };
};
