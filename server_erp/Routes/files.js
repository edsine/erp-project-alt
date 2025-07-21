const express = require('express');
const router = express.Router();
const fileController = require('../Controllers/fileController');
const authMiddleware = require('../Middleware/authMiddleware');
const { uploadSingle, uploadMultiple } = require('../Middleware/uploadMiddleware');

// Client routes
router.get('/files/clients', authMiddleware, fileController.getAllClients);
router.get('/files/clients/:id', authMiddleware, fileController.getClientById);
router.post('/files/clients', authMiddleware, fileController.createClient);
router.put('/files/clients/:id', authMiddleware, fileController.updateClient);
router.delete('/files/clients/:id', authMiddleware, fileController.deleteClient);

// File routes
router.get('/files', authMiddleware, fileController.getAllFiles);
router.get('/files/:id', authMiddleware, fileController.getFileById);
router.get('/files/download/:id', fileController.downloadFile);

router.get('/files/view/:id', fileController.viewFile);
router.delete('/files/delete-multiple', authMiddleware, fileController.deleteMultipleFiles);
router.delete('/files/:id', authMiddleware, fileController.deleteFile);
router.post('/files', authMiddleware, uploadSingle, fileController.uploadFile);
router.post('/files/multiple', authMiddleware, uploadMultiple, fileController.uploadMultipleFiles);



module.exports = router;
