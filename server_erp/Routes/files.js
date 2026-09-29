const express = require('express');
const router = express.Router();
const fileController = require('../Controllers/fileController');
const { requireFilesAccess } = require('../Middleware/accessControl');
const { uploadSingle, uploadMultiple } = require('../Middleware/uploadMiddleware');

// Client routes
router.get('/files/clients', requireFilesAccess, fileController.getAllClients);
router.get('/files/clients/:id', requireFilesAccess, fileController.getClientById);
router.post('/files/clients', requireFilesAccess, fileController.createClient);
router.put('/files/clients/:id', requireFilesAccess, fileController.updateClient);
router.delete('/files/clients/:id', requireFilesAccess, fileController.deleteClient);

// File routes
router.get('/files', requireFilesAccess, fileController.getAllFiles);
router.get('/files/:id', requireFilesAccess, fileController.getFileById);
router.get('/files/download/:id', requireFilesAccess, fileController.downloadFile);

router.get('/files/view/:id', requireFilesAccess, fileController.viewFile);
router.delete('/files/delete-multiple', requireFilesAccess, fileController.deleteMultipleFiles);
router.delete('/files/:id', requireFilesAccess, fileController.deleteFile);
router.post('/files', requireFilesAccess, uploadSingle, fileController.uploadFile);
router.post('/files/multiple', requireFilesAccess, uploadMultiple, fileController.uploadMultipleFiles);



module.exports = router;
