import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            required: [true, 'Program slug / identifier is required (e.g. bba, mba)'],
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        name: {
            type: String,
            trim: true,
        },
        title: {
            type: String,
            required: [true, 'Display title is required (e.g. Online BBA)'],
            trim: true,
        },
        fullTitle: {
            type: String,
            required: [true, 'Full degree title is required (e.g. Bachelor of Business Administration)'],
            trim: true,
        },
        type: {
            type: String,
            required: [true, 'Degree type code is required (e.g. BBA, MBA, BCA)'],
            trim: true,
        },
        level: {
            type: String,
            enum: ['UG', 'PG', 'Diploma', 'Certificate'],
            default: 'UG',
            required: true,
        },
        duration: {
            type: String,
            required: [true, 'Please specify the duration (e.g. "3 Years", "2 Years")'],
            default: '3 Years',
        },
        minDegreeLevel: {
            type: String,
            enum: ['10th', '12th', 'graduation', 'post_graduation'],
            default: '12th',
        },
        minEligibility: {
            type: String,
            trim: true,
        },
        eligibility_criteria: {
            type: String,
            trim: true,
        },
        baseFee: {
            type: Number,
            required: [true, 'Base annual tuition fee is required'],
            default: 0,
        },
        total_fee: {
            type: Number,
            default: 0,
        },
        registrationFee: {
            type: Number,
            default: 5000,
        },
        categories: {
            type: [String],
            default: ['all'],
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        publishStatus: {
            type: String,
            enum: ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED'],
            default: 'PUBLISHED',
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        submittedAt: {
            type: Date,
        },
        assignedReviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
        submitterNote: {
            type: String,
            trim: true,
            default: '',
        },
        changeSummary: {
            type: [String],
            default: [],
        },
        lastPublishedSnapshot: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        approvalHistory: [
            {
                action: {
                    type: String,
                    enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'UNPUBLISHED', 'EDITED'],
                },
                performedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                performedAt: {
                    type: Date,
                    default: Date.now,
                },
                reason: {
                    type: String,
                },
            },
        ],
        is_trending: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
            trim: true,
        },
        heroImage: {
            type: String,
            trim: true,
            required: [true, 'Hero banner image is required'],
        },
        cardImage: {
            type: String,
            trim: true,
        },
        hasLinkedInBadge: {
            type: Boolean,
            default: false,
        },
        brochureUrl: {
            type: String,
            trim: true,
        },
        brochureFileName: {
            type: String,
            trim: true,
        },
        programmeGuideUrl: {
            type: String,
            trim: true,
        },
        programmeGuideFileName: {
            type: String,
            trim: true,
        },
        pprUrl: {
            type: String,
            trim: true,
        },
        pprFileName: {
            type: String,
            trim: true,
        },
        elmUrl: {
            type: String,
            trim: true,
        },
        elmNote: {
            type: String,
            trim: true,
            default: 'The E-LM will have the SLM and Video Content',
        },
        specializations: [
            {
                id: { type: String, trim: true },
                title: { type: String, trim: true },
                icon: { type: String, default: 'Award' },
                desc: { type: String, trim: true },
            },
        ],
        infoBar: {
            duration: { type: String, default: '3 Years' },
            durationNote: { type: String, default: 'Total duration' },
            fee: { type: String, default: '' },
            hasEMI: { type: Boolean, default: false },
            deadline: { type: String, default: 'Upcoming' },
            commitment: { type: String, default: '8-10 hours/week' },
            commitmentNote: { type: String, default: 'Recommended' },
            model: { type: String, default: 'LIVE + Recorded' },
            modelNote: { type: String, default: 'Lectures by Expert Faculty' },
            batchesNote: { type: String, default: 'Batches starting soon' },
        },
        programUSPs: [
            {
                title: { type: String, trim: true },
                desc: { type: String, trim: true },
            },
        ],
        linkedinUSPs: [
            {
                title: { type: String, trim: true },
                icon: { type: String, default: 'Award' },
            },
        ],
        fee: {
            indian: {
                semester: { type: Number, default: 0 },
                lumpsum: { type: Number, default: 0 },
            },
            international: {
                semester: { type: Number, default: 0 },
                lumpsum: { type: Number, default: 0 },
            },
        },
        eligibility: {
            type: [String],
            default: [],
        },
        notes: {
            type: [String],
            default: [],
        },
        curriculum: {
            stats: [
                {
                    label: { type: String },
                    value: { type: mongoose.Schema.Types.Mixed },
                    icon: { type: String, default: 'GraduationCap' },
                },
            ],
            semesters: [
                {
                    title: { type: String, trim: true },
                    courses: [{ type: mongoose.Schema.Types.Mixed }],
                },
            ],
        },
        placements: {
            supportText: { type: String, trim: true },
            supportImage: { type: String, trim: true },
            enhancement: [
                {
                    title: { type: String, trim: true },
                    desc: { type: String, trim: true },
                    image: { type: String, trim: true },
                },
            ],
        },
        admissionProcess: [
            {
                step: { type: Number },
                title: { type: String, trim: true },
                desc: { type: String, trim: true },
            },
        ],
        benefits: [
            {
                title: { type: String, trim: true },
                desc: { type: String, trim: true },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Dynamic validation: Banner images and conditional detail images
programSchema.pre('validate', function () {
    // Hero Banner Image check
    if (!this.heroImage || !this.heroImage.trim()) {
        this.invalidate('heroImage', 'Hero banner image is required');
    }

    // Auto-fallback cardImage to heroImage if not explicitly provided
    if (!this.cardImage && this.heroImage) {
        this.cardImage = this.heroImage;
    }

    // Placements: If support narrative text is provided, placement banner image is required
    if (this.placements?.supportText && this.placements.supportText.trim().length > 0) {
        if (!this.placements.supportImage || !this.placements.supportImage.trim()) {
            this.invalidate('placements.supportImage', 'Placement banner image is required when placement support details are filled');
        }
    }

    // PEP Enhancement Cards: If card detail (title or desc) is filled, image is required
    if (Array.isArray(this.placements?.enhancement)) {
        this.placements.enhancement.forEach((card, idx) => {
            const hasDetail = Boolean(card?.title?.trim() || card?.desc?.trim());
            if (hasDetail && (!card?.image || !card.image.trim())) {
                this.invalidate(`placements.enhancement.${idx}.image`, `Image is required for PEP enhancement card "${card?.title?.trim() || idx + 1}" because details are filled`);
            }
        });
    }
});

// Auto-sync legacy fields before saving
programSchema.pre('save', function () {
    if (!this.name && this.fullTitle) {
        this.name = this.fullTitle;
    }
    if (!this.total_fee && this.baseFee) {
        this.total_fee = this.baseFee;
    }
    if (!this.eligibility_criteria && this.minEligibility) {
        this.eligibility_criteria = this.minEligibility;
    }
});

const Program = mongoose.model('Program', programSchema);

export default Program;
