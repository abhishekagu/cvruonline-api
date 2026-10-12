import Application from '../models/Application.js';
import User from '../models/User.js';

const PROGRAM_CODES = {
    bba: 'BBA',
    bca: 'BCA',
    blibisc: 'BLIB',
    mba: 'MBA',
    ma_english: 'MAE'
};

/**
 * Generates a unique university enrollment number.
 * Format: CVRU + current year + Program Code + 4-digit unique sequence/random number
 * Example: CVRU2026BCA1842
 * 
 * @param {string} programId - ID or name of the program (e.g., 'bca', 'mba')
 * @returns {Promise<string>} Unique enrollment number
 */
export const generateEnrollmentNumber = async (programId) => {
    const year = new Date().getFullYear();
    const normalizedProg = (programId || '').toLowerCase().trim();
    const progCode = (PROGRAM_CODES[normalizedProg] || normalizedProg.replace(/[^a-z0-9]/g, '').slice(0, 4) || 'GEN').toUpperCase();
    const prefix = `CVRU${year}${progCode}`;

    let isUnique = false;
    let enrollmentNo = '';
    let attempts = 0;

    while (!isUnique && attempts < 15) {
        attempts++;
        const random4Digits = Math.floor(1000 + Math.random() * 9000);
        enrollmentNo = `${prefix}${random4Digits}`;

        // Verify uniqueness across Application and User collections
        const [existingApp, existingUser] = await Promise.all([
            Application.findOne({ enrollmentNumber: enrollmentNo }),
            User.findOne({ enrollmentNo: enrollmentNo })
        ]);

        if (!existingApp && !existingUser) {
            isUnique = true;
        }
    }

    // Sequence fallback if random attempts exhaust
    if (!isUnique) {
        const count = await Application.countDocuments({ program: programId });
        enrollmentNo = `${prefix}${String(1001 + count).padStart(4, '0')}`;
    }

    return enrollmentNo;
};
