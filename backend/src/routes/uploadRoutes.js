import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import mongoose from 'mongoose';
import { uploadFile } from '../controllers/uploadController.js';
import { uploadRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// Enable CORS for all routes
router.use(cors({
  origin: true, // Reflect the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Handle preflight requests
router.options('*', cors());

// Log all requests to this router
router.use((req, res, next) => {
  next();
});

// Test route removed for production

// File upload route
router.post('/', uploadRateLimit, (req, res, next) => {
  uploadFile(req, res, next);
});

// Stream a file from MongoDB GridFS by ID
router.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid file id' });
    }

    const conn = mongoose.connection;
    if (conn.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });

    // Try to find the file first to get metadata/contentType
    const files = await conn.db.collection('uploads.files').find({ _id: new mongoose.Types.ObjectId(id) }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const file = files[0];

    // Set headers
    if (file.contentType) {
      res.set('Content-Type', file.contentType);
    } else if (file.metadata?.mimetype) {
      res.set('Content-Type', file.metadata.mimetype);
    } else {
      res.set('Content-Type', 'application/octet-stream');
    }
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Content-Disposition', `inline; filename="${file.filename || 'file'}"`);

    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));
    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      } else {
        res.end();
      }
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error('GET /files/:id error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test route removed for production

export default router;
