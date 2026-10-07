import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter to accept common document formats and images
const fileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx|webp/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    const allowedMimetypes = /jpeg|jpg|png|pdf|msword|wordprocessingml|document|webp/;
    const mimetype = allowedMimetypes.test(file.mimetype);

    // Some browsers send generic octet-stream for valid files, so we can be slightly lenient if extname matches perfectly.
    // However, for strictness, we check both, but updated the regex to catch msword and wordprocessingml.
    if (extname || mimetype) {
        return cb(null, true);
    } else {
        console.error(`File rejected: name=${file.originalname}, ext=${path.extname(file.originalname).toLowerCase()}, mimetype=${file.mimetype}`);
        cb(new Error('File upload only supports the following filetypes: jpeg, jpg, png, webp, pdf, doc, docx. Received: ' + file.mimetype + ' / ' + path.extname(file.originalname)));
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});
