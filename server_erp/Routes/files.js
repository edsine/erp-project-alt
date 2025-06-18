const express = require('express');
const router = express.Router();
const fileController = require('../Controllers/fileController');
const authMiddleware = require('../Middleware/authMiddleware');
const upload = require('../Middleware/uploadMiddleware');

// Client routes
router.get('/files/clients', authMiddleware, fileController.getAllClients);
router.get('/files/clients/:id', authMiddleware, fileController.getClientById);
router.post('/files/clients', authMiddleware, fileController.createClient);
router.put('/files/clients/:id', authMiddleware, fileController.updateClient);
router.delete('/files/clients/:id', authMiddleware, fileController.deleteClient);

// File routes
router.get('/files', authMiddleware, fileController.getAllFiles);
router.get('/files/:id', authMiddleware, fileController.getFileById);
router.post('/files', authMiddleware, upload.single('file'), fileController.uploadFile);
router.delete('/files/:id', authMiddleware, fileController.deleteFile);

module.exports = router;