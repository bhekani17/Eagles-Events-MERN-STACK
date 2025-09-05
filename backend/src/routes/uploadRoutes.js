import express from 'express';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { uploadFile } from '../controllers/uploadController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// CORS is handled globally in the main app. Avoid overriding with permissive settings here.

// Minimal request logging for observability without exposing sensitive headers
router.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Test route to check if API is accessible
router.get('/test', protect, admin, (_req, res) => {
  res.json({ 
    status: 'upload test route working',
    timestamp: new Date().toISOString()
  });
});

// File upload route
router.post('/', protect, admin, (req, res, next) => {
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

// Test route to check if uploads directory is writable
router.get('/disk-test', protect, admin, (req, res) => {
  const testDir = path.join(process.cwd(), 'uploads');
  const testFilePath = path.join(testDir, 'test.txt');
  
  // Ensure directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  fs.writeFile(testFilePath, 'test', (err) => {
    if (err) {
      console.error('Write test failed:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to write test file',
        error: err.message,
        path: testFilePath,
        cwd: process.cwd(),
        dirExists: fs.existsSync(testDir)
      });
    }
    
    // Test reading the file
    fs.readFile(testFilePath, 'utf8', (readErr, data) => {
      if (readErr) {
        console.error('Read test failed:', readErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to read test file',
          error: readErr.message
        });
      }
      
      // Clean up
      fs.unlink(testFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Failed to clean up test file:', unlinkErr);
        }
        
        res.json({
          success: true,
          message: 'Disk test successful',
          fileContent: data,
          path: testFilePath,
          cwd: process.cwd()
        });
      });
    });
  });
});

export default router;
